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
import {
  defaultOverlayPositions,
  IFlowNodeAssociation,
  IHeatmapRepository,
  IHeatmapService,
  ITokenPositionAndCount,
} from '../contracts/index';

// maximalTokenCount is used to sanitise the displayed number to "99+"
const maximalTokenCount: number = 100;

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
    this._includeShapeTypeToActiveToken(elementRegistry, activeTokens);
    const taskToken: Array<ActiveToken> = this._filterTasksfromActiveTokens(activeTokens);
    const eventToken: Array<ActiveToken> = this._filterEventsfromActiveTokens(activeTokens);
    const gatewayToken: Array<ActiveToken> = this._filterGatewaysfromActiveTokens(activeTokens);

    console.log(taskToken);
    console.log(eventToken);
    console.log(gatewayToken);

    const tokenToCount: Array<ActiveToken> = this._getTokenToCount(activeTokens);

    console.log(tokenToCount);

    const tokenWithIdAndLength: Array<ITokenPositionAndCount> = this._getTokenWithIdAndCount(activeTokens, tokenToCount);
    const elementsWithoutToken: Array<IShape> = this._getElementsWithoutToken(elementRegistry, tokenWithIdAndLength);
    let participantsTokenCount: number = 0;

    const addOverlay: ((elementId: string, count: number, position: IOverlayPosition) => void ) =
      ((elementId: string, count: number, position: IOverlayPosition): void => {

        const countIsTooHigh: boolean = count >=  maximalTokenCount;

        overlays.add(elementId, {
          position: {
            left: position.left,
            top: position.top,
          },
          html: `<div class="heatmap__overlay" title="This element has actual ${count} token.">${countIsTooHigh ? '99+' : count}</div>`,
        });
      });

    tokenWithIdAndLength.forEach((token: ITokenPositionAndCount) => {
      const tokenShape: IShape = this._getShape(elementRegistry, token);
      const tokenShapeIsUndefined: boolean = tokenShape === undefined;

      if (tokenShapeIsUndefined) {
        return;
      }

      const tokenShapeIsGateway: boolean = tokenShape.type === 'bpmn:ExclusiveGateway';
      const tokenShapeIsEvent: boolean = tokenShape.type === 'bpmn:EndEvent' || tokenShape.type === 'bpmn:StartEvent';

      if (tokenShapeIsGateway) {
        addOverlay(token.flowNodeId, token.count, defaultOverlayPositions.gateways);
      } else if (tokenShapeIsEvent) {
        addOverlay(token.flowNodeId, token.count, defaultOverlayPositions.events);
      } else {
        addOverlay(token.flowNodeId, token.count, defaultOverlayPositions.tasks);
      }

      participantsTokenCount += token.count;
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

    const participantShape: IShape = this._getParticipantShape(elementRegistry);
    addOverlay(participantShape.id, participantsTokenCount, {
      left: participantShape.width - defaultOverlayPositions.participants.left,
      top: participantShape.height - defaultOverlayPositions.participants.top,
    });
  }

  private _includeShapeTypeToActiveToken(elementRegistry: IElementRegistry, activeTokens: Array<ActiveToken>): void {
    activeTokens.map((tokenElement: ActiveToken & { type: string }) => {
      const shapeOfTokenElement: IShape = this._getShape(elementRegistry, tokenElement);

      tokenElement.type = shapeOfTokenElement.type;
    });
  }

  private _filterTasksfromActiveTokens(activeTokens: Array<ActiveToken>): Array<ActiveToken> {
    const tokenOnTasks: Array<ActiveToken> =  activeTokens.filter((activeToken: ActiveToken & { type: string }) => {
      // alle Task types nachschauen
      const tokenElementIsTask: boolean = activeToken.type === 'bpmn:ScriptTask'
                                || activeToken.type === 'bpmn:ServiceTask'
                                || activeToken.type === 'bpmn:UserTask';

      return tokenElementIsTask;
    });

    return tokenOnTasks;
  }

  private _filterGatewaysfromActiveTokens(activeTokens: Array<ActiveToken>): Array<ActiveToken> {
    const tokenOnGateways: Array<ActiveToken> =  activeTokens.filter((activeToken: ActiveToken & { type: string }) => {
      // alle gateway types nachschauen
      const tokenElementIsGateway: boolean = activeToken.type === 'bpmn:ExclusiveGateway';

      return tokenElementIsGateway;
    });

    return tokenOnGateways;
  }

  private _filterEventsfromActiveTokens(activeTokens: Array<ActiveToken>): Array<ActiveToken> {
    const tokenOnEvents: Array<ActiveToken> =  activeTokens.filter((activeToken: ActiveToken & { type: string }) => {
      // alle Task types nachschauen
      const tokenElementIsEvent: boolean = activeToken.type === 'bpmn:EndEvent'
                                || activeToken.type === 'bpmn:StartEvent';

      return tokenElementIsEvent;
    });

    return tokenOnEvents;
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

  private _getShape(elementRegistry: IElementRegistry, elementToColor: FlowNodeRuntimeInformation | ITokenPositionAndCount | ActiveToken): IShape {
    const elementShape: IShape = elementRegistry.get(elementToColor.flowNodeId);

    return elementShape;
  }

  private _getParticipantShape(elementRegistry: IElementRegistry): IShape {
    const allElements: Array<IShape> = elementRegistry.getAll();

    const participantShape: IShape = allElements.find((element: IShape) => {
      const elementIsParticipant: boolean = element.type === 'bpmn:Participant';

      return elementIsParticipant;
    });

    return participantShape;
  }

  /**
   *
   * @param elementRegistry Die Elementregistry des BPMN-Modelers
   * @param tokenWithIdAndLength Array von flowNodeIds und deren ActiveToken Anzahl
   *
   * Diese Methode filtert alle Elemente des Diagramms nach Elementen, die ein Overlay
   * bekommen sollen und nach den Elementen, die keinen Token besitzen.
   */
  private _getElementsWithoutToken(
    elementRegistry: IElementRegistry,
    tokenWithIdAndLength: Array<ITokenPositionAndCount>,
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
      const token: ITokenPositionAndCount = tokenWithIdAndLength.find((activeToken: ITokenPositionAndCount) => {
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
    const lengthOfRTStamp: number = 4;
    const startRunTimeText: number = annotationText.search('RT:') + lengthOfRTStamp;
    const lengthOfRunTimeText: number = 12;
    const runTimeTimeStamp: string = annotationText.substr(startRunTimeText, lengthOfRunTimeText);
    const date: Date = new Date('1970-01-01T' + runTimeTimeStamp + 'Z');
    const medianRunTimeInMs: number = date.getTime();

    return medianRunTimeInMs;
  }

  /**
   *
   * @param activeTokens Alle Token eines Prozessmodells.
   * @param tokenToCount ActiveToken, dessen Anzahl ermittelt werden muss
   *
   * Diese Methode filtert die ActiveTokens nach den Token, die gezählt werden müssen
   * und gibt dessen flowNodeId und die Anzahl in einem Array zurück.
   */
  private _getTokenWithIdAndCount(activeTokens: Array<ActiveToken>, tokenToCount: Array<ActiveToken>): Array<ITokenPositionAndCount> {
    const tokenWithIdAndLength: Array<ITokenPositionAndCount> = [];
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

  /**
   * Diese Methode findet die ActiveToken Objecte, welche die gleiche flowNodeId haben
   * und speichert diese im Array tokenToCount.
   * Anschließend können in der _getTokenWithIdAndCount Methode die ActiveTokens nach
   * den tokenToCount gefiltert werden und die Anzahl ermittelt werden.
   */
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
