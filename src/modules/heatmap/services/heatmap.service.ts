import {inject} from 'aurelia-framework';

import {ActiveToken, FlowNodeRuntimeInformation} from '@process-engine/kpi_api_contracts';
import {ProcessModelExecution} from '@process-engine/management_api_contracts';

import {
  defaultBpmnColors,
  IBpmnModeler,
  IColorPickerColor,
  IConnection,
  IElementRegistry,
  IModeling,
  IOverlay,
  IOverlayPosition,
  IShape,
} from '../../../contracts/index';
import {defaultOverlayPositions, IFlowNodeAssociation, IHeatmapRepository, IHeatmapService} from '../contracts/index';

@inject('HeatmapMockRepository')
export class HeatmapService implements IHeatmapService {
  private _heatmapRepository: IHeatmapRepository;

  constructor(heatmapRepository: IHeatmapRepository) {
    this._heatmapRepository = heatmapRepository;
  }

  public getRuntimeInformationForProcessModel(processModelId: string): Promise<Array<FlowNodeRuntimeInformation>> {
    return this._heatmapRepository.getRuntimeInformationForProcessModel(processModelId);
  }

  public getActiveTokensForProcessModel(processModelId: string): Promise<Array<ActiveToken>> {
    return this._heatmapRepository.getActiveTokensForProcessModel(processModelId);
  }

  public addOverlays(overlays: IOverlay, elementRegistry: IElementRegistry, activeTokens: Array<ActiveToken>): void {
    const tokenToCount: Array<ActiveToken> = this._getTokenToCount(activeTokens);
    const tokenWithIdAndLength: Array<{flowNodeId: string, count: number}> = this._getTokenWithIdAndCount(activeTokens, tokenToCount);
    const elementsWithoutToken: Array<IShape> = this._getElementsWithoutToken(elementRegistry, tokenWithIdAndLength);

    const addOverlay: ((elementId: string,
                        count: number,
                        position: IOverlayPosition,
                      ) => void) = ((elementId: string,
                                     count: number,
                                     position: IOverlayPosition,
                                    ): void => {
      overlays.add(elementId, {
        position: {
          left: position.left,
          top: position.top,
        },
        html: `<div class="overlay" title="This element has actual ${count} token.">${count}</div>`,
      });
    });

    tokenWithIdAndLength.forEach((token: {flowNodeId: string, count: number}) => {
      const tokenShape: IShape = this._getShape(elementRegistry, token);
      const tokenShapeIsGateway: boolean = tokenShape.type === 'bpmn:ExclusiveGateway';
      const tokenShapeIsEvent: boolean = tokenShape.type === 'bpmn:EndEvent' || tokenShape.type === 'bpmn:StartEvent';

      if (tokenShapeIsGateway) {
        addOverlay(token.flowNodeId, token.count, defaultOverlayPositions.gateways);
      } else if (tokenShapeIsEvent) {
        addOverlay(token.flowNodeId, token.count, defaultOverlayPositions.events);
      } else {
        addOverlay(token.flowNodeId, token.count, defaultOverlayPositions.tasks);
      }
    });

    elementsWithoutToken.forEach((element: IShape) => {
      const elementIsGateway: boolean = element.type === 'bpmn:ExclusiveGateway';
      const elementIsEvent: boolean = element.type === 'bpmn:EndEvent' || element.type === 'bpmn:StartEvent';

      if (elementIsGateway) {
        addOverlay(element.id, 0, defaultOverlayPositions.gateways);
      } else if (elementIsEvent) {
        addOverlay(element.id, 0, defaultOverlayPositions.events);
      } else {
        addOverlay(element.id, 0, defaultOverlayPositions.tasks);
      }
    });
  }

  private _getElementsWithoutToken(
    elementRegistry: IElementRegistry,
    tokenWithIdAndLength: Array<{flowNodeId: string, count: number}>,
  ): Array<IShape> {
    const allElements: Array<IShape> = elementRegistry.getAll();
    const filteredElements: Array<IShape> = allElements.filter((element: IShape) => {
      const condition: boolean = element.type !== 'bpmn:Association'
                              && element.type !== 'bpmn:SequenceFlow'
                              && element.type !== 'bpmn:TextAnnotation'
                              && element.type !== 'bpmn:Participant'
                              && element.type !== 'bpmn:Collaboration'
                              && element.type !== 'bpmn:Lane'
                              && element.type !== 'label';

      return condition;
    });

    const filterWithActiveToken: Array<IShape> = filteredElements.filter((element: IShape) => {
      const token: {flowNodeId: string, count: number} = tokenWithIdAndLength.find((activeToken: {flowNodeId: string, count: number}) => {
        return activeToken.flowNodeId === element.id;
      });
      if (token === undefined) {
        return true;
      } else {
        return false;
      }
    });

    return filterWithActiveToken;
  }

  public getProcess(processModelId: string): Promise<ProcessModelExecution.ProcessModel> {
    return this._heatmapRepository.getProcess(processModelId);
  }

  public getFlowNodeAssociations(elementRegistry: IElementRegistry): Array<IFlowNodeAssociation> {

    const flowNodeAssociations: Array<IFlowNodeAssociation> = [];

    const associations: Array<IConnection> = elementRegistry.filter((element: IShape) => {
      const elementIsNoValidAssociation: boolean = element.target === undefined ||
                                                   element.target.businessObject === undefined ||
                                                   element.target.businessObject.text === undefined;

      if (elementIsNoValidAssociation) {
        return false;
      }

      const elementIsAssociation: boolean = element.type === 'bpmn:Association';
      const annotationHasRuntime: boolean = element.target.businessObject.text.includes('RT:');

      return elementIsAssociation && annotationHasRuntime;
    });

    associations.forEach((association: IConnection) => {

      const medianRunTime: number = this._getMedianRunTimeForAssociation(association);

      const flowNodeAssociation: IFlowNodeAssociation = {
        associationId: association.id,
        sourceId: association.source.id,
        runtime_medianInMs: medianRunTime,
      };

      flowNodeAssociations.push(flowNodeAssociation);
    });

    return flowNodeAssociations;
  }

  public async getColoredXML(
    associations: Array<IFlowNodeAssociation>,
    flowNodeRuntimeInformation: Array<FlowNodeRuntimeInformation>,
    modeler: IBpmnModeler,
  ): Promise<string> {
    const elementRegistry: IElementRegistry = modeler.get('elementRegistry');
    const modeling: IModeling = modeler.get('modeling');

    const elementsToColor: Array<FlowNodeRuntimeInformation> = this._getElementsToColor(associations, flowNodeRuntimeInformation);

    associations.forEach((association: IFlowNodeAssociation) => {
      const elementToColor: FlowNodeRuntimeInformation =  elementsToColor.find((element: FlowNodeRuntimeInformation) => {
        return element.flowNodeId === association.sourceId;
      });

      const shapeToColor: IShape = this._getShape(elementRegistry, elementToColor);

      if (elementToColor.medianRuntimeInMs > association.runtime_medianInMs) {
        this.colorElement(modeling, shapeToColor, defaultBpmnColors.red);
      } else {
        this.colorElement(modeling, shapeToColor, defaultBpmnColors.green);
      }

    });

    const xml: string = await this._getXmlFromModeler(modeler);

    return xml;
  }

  private colorElement(modeling: IModeling, shapeToColor: IShape, color: IColorPickerColor): void {
    modeling.setColor(shapeToColor, {
      stroke: color.border,
      fill: color.fill,
    });
  }

  private _getElementsToColor(
    associations: Array<IFlowNodeAssociation>,
    flowNodeRuntimeInformation: Array<FlowNodeRuntimeInformation>,
  ): Array<FlowNodeRuntimeInformation> {

    const elementsToColor: Array<FlowNodeRuntimeInformation> = flowNodeRuntimeInformation.filter((information: FlowNodeRuntimeInformation) => {
      const associationWithSameId: IFlowNodeAssociation = associations.find((association: IFlowNodeAssociation) => {
        return association.sourceId === information.flowNodeId;
      });
      return associationWithSameId;
    });

    return elementsToColor;
  }

  private _getShape(elementRegistry: IElementRegistry, elementToColor: FlowNodeRuntimeInformation | {flowNodeId: string, count: number}): IShape {
    const elementShape: IShape = elementRegistry.get(elementToColor.flowNodeId);

    return elementShape;
  }

  private async _getXmlFromModeler(modeler: IBpmnModeler): Promise<string> {
    const saveXmlPromise: Promise<string> = new Promise((resolve: Function, reject: Function): void =>  {
      modeler.saveXML({}, async(saveXmlError: Error, xml: string) => {
        if (saveXmlError) {
          reject(saveXmlError);

          return;
        }

        resolve(xml);
      });
    });

    return saveXmlPromise;
  }

  private _getMedianRunTimeForAssociation(association: IConnection): number {
    const annotationText: string = association.target.businessObject.text;
    const lengthofRTStamp: number = 4;
    const startRunTimeText: number = annotationText.search('RT:') + lengthofRTStamp;
    const lengthOfRunTimeText: number = 12;
    const runTimeTimeStamp: string = annotationText.substr(startRunTimeText, lengthOfRunTimeText);
    const date: Date = new Date('1970-01-01T' + runTimeTimeStamp + 'Z');
    const medianRunTimeInMs: number = date.getTime();

    return medianRunTimeInMs;
  }

  private _getTokenWithIdAndCount(activeTokens: Array<ActiveToken>, tokenToCount: Array<ActiveToken>): Array<{flowNodeId: string, count: number}> {
    const tokenWithIdAndLength: Array<{flowNodeId: string, count: number}> = [];
    tokenToCount.forEach((token: ActiveToken) => {
      const tokenOfAnElement: Array<ActiveToken> =  activeTokens.filter((activeToken: ActiveToken) => {
        return activeToken.flowNodeId === token.flowNodeId;
      });

      tokenWithIdAndLength.push({
        flowNodeId: token.flowNodeId,
        count: tokenOfAnElement.length,
      });
    });

    return tokenWithIdAndLength;
  }

  private _getTokenToCount(activeTokens: Array<ActiveToken>): Array<ActiveToken> {
    const tokenToCount: Array<ActiveToken> = [];

    for (const token of activeTokens) {
      const tokenIsInArray: ActiveToken = tokenToCount.find((element: ActiveToken) => {
        return element.flowNodeId === token.flowNodeId;
      });

      if (tokenIsInArray !== undefined) {
        continue;
      } else {
        tokenToCount.push(token);
      }
    }

    return tokenToCount;
  }

}
