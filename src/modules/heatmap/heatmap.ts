import {EventAggregator} from 'aurelia-event-aggregator';
import {bindable, inject} from 'aurelia-framework';

import {IBpmnModeler, IElementRegistry, IOverlay} from '../../contracts/index';
import {IFlowNodeAssociation, IHeatmapService} from './contracts';

import * as bundle from '@process-engine/bpmn-js-custom-bundle';
import {ActiveToken, FlowNodeRuntimeInformation} from '@process-engine/kpi_api_contracts';
import {ProcessModelExecution} from '@process-engine/management_api_contracts';
import environment from '../../environment';

interface RouteParameters {
  processModelId: string;
}

@inject('HeatmapService', EventAggregator)
export class Heatmap {
  public viewerContainer: HTMLDivElement;
  @bindable() public processmodelid: string;
  public test: HTMLElement;

  private _processModel: ProcessModelExecution.ProcessModel;
  private _heatmapService: IHeatmapService;
  private _modeler: IBpmnModeler;
  private _viewer: IBpmnModeler;
  private _eventAggregator: EventAggregator;

  constructor(heatmapService: IHeatmapService, eventAggregator: EventAggregator) {
    this._heatmapService = heatmapService;
    this._eventAggregator = eventAggregator;
  }

  public processmodelidChanged(): void {
    const viewerContainerIsAttached: boolean = this.viewerContainer !== undefined && this.viewerContainer !== null;
    const viewerIsInitialized: boolean = this._viewer !== undefined;

    if (viewerContainerIsAttached) {
      const attachedViewer: Element = document.getElementsByClassName('bjs-container')[0];
      this.viewerContainer.removeChild(attachedViewer);
    }

    if (viewerIsInitialized) {
      this._viewer.detach();
      this._viewer.destroy();
    }

    this.attached();
  }

  public async attached(): Promise<void> {
    this._modeler = new bundle.modeler({
      moddleExtensions: {
        camunda: bundle.camundaModdleDescriptor,
      },
    });

    this._processModel = await this._heatmapService.getProcess(this.processmodelid);

    this._eventAggregator.publish(environment.events.navBar.updateProcess, this._processModel);
    this._eventAggregator.publish(environment.events.navBar.processEngineSource);

    await this._importXML(this._processModel.xml, this._modeler);

    const elementRegistry: IElementRegistry  = this._modeler.get('elementRegistry');
    const associations: Array<IFlowNodeAssociation> = await this._heatmapService.getFlowNodeAssociations(elementRegistry);
    const flowNodeRuntimeInformation: Array<FlowNodeRuntimeInformation> = await this
      ._heatmapService
      .getRuntimeInformationForProcessModel(this.processmodelid);

    const xml: string = await this._heatmapService.getColoredXML(associations, flowNodeRuntimeInformation, this._modeler);

    this._viewer = new bundle.viewer({
      additionalModules:
      [
        bundle.ZoomScrollModule,
        bundle.MoveCanvasModule,
      ],
    });

    await this._importXML(xml, this._viewer);

    const activeTokens: Array<ActiveToken> = await this._heatmapService.getActiveTokensForProcessModel(this.processmodelid);

    const overlays: IOverlay = this._viewer.get('overlays');

    this._heatmapService.addOverlays(overlays, elementRegistry, activeTokens);

    this._eventAggregator.publish(environment.events.navBar.showProcessName, this._processModel);

    this._viewer.attachTo(this.viewerContainer);
  }

  public detached(): void {
    this._eventAggregator.publish(environment.events.navBar.hideProcessName);
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
