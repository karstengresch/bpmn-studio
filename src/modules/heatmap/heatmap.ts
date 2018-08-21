import {inject} from 'aurelia-framework';

import {IBpmnModeler, IElementRegistry, IShape} from '../../contracts';
import {IFlowNodeAssociation, IHeatmapService} from './contracts';

import * as bundle from '@process-engine/bpmn-js-custom-bundle';
import {FlowNodeRuntimeInformation} from '@process-engine/kpi_api_contracts';
import {ProcessModelExecution} from '@process-engine/management_api_contracts';

interface RouteParameters {
  processModelId: string;
}

@inject('HeatmapService')
export class Heatmap {
  public viewerContainer: HTMLDivElement;

  private _processModelId: string;
  private _heatmapService: IHeatmapService;
  private _modeler: IBpmnModeler;
  private _viewer: IBpmnModeler;

  constructor(heatmapService: IHeatmapService) {
    this._heatmapService = heatmapService;
    this._modeler = new bundle.modeler({
      moddleExtensions: {
        camunda: bundle.camundaModdleDescriptor,
      },
    });
  }

  public async activate(routeParameters: RouteParameters): Promise<void> {
    this._processModelId = routeParameters.processModelId;
    const processModel: ProcessModelExecution.ProcessModel = await this._heatmapService.getProcess(this._processModelId);
    await this._importXML(processModel.xml, this._modeler);

    const elementRegistry: IElementRegistry  = this._modeler.get('elementRegistry');
    const associations: Array<IFlowNodeAssociation> = await this._heatmapService.getFlowNodeAssociations(elementRegistry);
    const flowNodeRuntimeInformation: Array<FlowNodeRuntimeInformation> = await this
      ._heatmapService
      .getRuntimeInformationForProcessModel(this._processModelId);

    const xml: string = await this._heatmapService.getColoredXML(associations, flowNodeRuntimeInformation, this._modeler);

    this._viewer = new bundle.viewer({
      additionalModules:
      [
        bundle.ZoomScrollModule,
        bundle.MoveCanvasModule,
      ],
    });

    this._importXML(xml, this._viewer);
  }

  public attached(): void {
    this._viewer.attachTo(this.viewerContainer);
  }

  private _importXML(xml: string, modeler: IBpmnModeler): Promise<void> {
    return new Promise((resolve: Function, reject: Function): void => {
      modeler.importXML(xml, (importXmlError: Error) => {
        if (importXmlError) {
          reject(importXmlError);
          return;
        }
        resolve();
      });
    });
  }

}
