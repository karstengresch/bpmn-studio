import {inject} from 'aurelia-framework';

import {FlowNodeRuntimeInformation} from '@process-engine/kpi_api_contracts';
import {ProcessModelExecution} from '@process-engine/management_api_contracts';

import {
  defaultBpmnColors,
  IBpmnModeler,
  IColorPickerColor,
  IConnection,
  IElementRegistry,
  IModeling,
  IShape,
} from '../../../contracts/index';
import {IFlowNodeAssociation, IHeatmapRepository, IHeatmapService} from '../contracts';

@inject('HeatmapMockRepository')
export class HeatmapService implements IHeatmapService {
  private _heatmapRepository: IHeatmapRepository;

  constructor(heatmapRepository: IHeatmapRepository) {
    this._heatmapRepository = heatmapRepository;
  }

  public getRuntimeInformationForProcessModel(processModelId: string): Promise<Array<FlowNodeRuntimeInformation>> {
    return this._heatmapRepository.getRuntimeInformationForProcessModel(processModelId);
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

      const shapeToColor: IShape = this._getShapeToColor(elementRegistry, elementToColor);

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

  private _getShapeToColor(elementRegistry: IElementRegistry, elementToColor: FlowNodeRuntimeInformation): IShape {
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
}