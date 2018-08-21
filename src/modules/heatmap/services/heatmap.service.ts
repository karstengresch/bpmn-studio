import {inject} from 'aurelia-framework';

import {FlowNodeRuntimeInformation} from '@process-engine/kpi_api_contracts';
import {ProcessModelExecution} from '@process-engine/management_api_contracts';

import {IBpmnModeler, IConnection, IElementRegistry, IModeling, IShape} from '../../../contracts';
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
      const associationShowsTiming: boolean = element.target.businessObject.text.includes('RT:');

      return elementIsAssociation && associationShowsTiming;
    });

    associations.forEach((association: IConnection) => {
      const flowNodeAssociation: IFlowNodeAssociation = {
        associationId: association.id,
        sourceId: association.source.id,
        runtime_timeSpecification: association.target.businessObject.text,
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
    const shapesToColor: Array<IShape> = this._getShapesToColor(elementRegistry, elementsToColor);

    console.log('elements', elementsToColor);
    console.log('associations', associations);
    modeling.setColor(shapesToColor, {
      stroke: '#E53935',
      fill: '#FFCDD2',
    });

    const xml: string = await this._getXmlFromModeler(modeler);

    return xml;
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

  private _getShapesToColor(elementRegistry: IElementRegistry, elementsToColor: Array<FlowNodeRuntimeInformation>): Array<IShape> {
    const elementShapes: Array<any> = [];

    elementsToColor.forEach((element: FlowNodeRuntimeInformation) => {
      const elementShape: IShape = elementRegistry.get(element.flowNodeId);
      elementShapes.push(elementShape);
    });

    return elementShapes;
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
}
