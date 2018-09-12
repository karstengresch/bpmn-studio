import {EventAggregator} from 'aurelia-event-aggregator';
import {bindable, inject} from 'aurelia-framework';

import {Dashboard} from '../dashboard/dashboard';
import {Heatmap} from '../heatmap/heatmap';

import {IDiagram} from '@process-engine/solutionexplorer.contracts';
import environment from '../../environment';

export interface IInspectRouteParameters {
  processModelId?: string;
  view?: string;
  latestSource?: string;
}

@inject(EventAggregator)
export class Inspect {

  @bindable() public processModelId: string;
  public showHeatmap: boolean = false;
  public showDashboard: boolean = true;
  public heatmap: Heatmap;
  public dashboard: Dashboard;

  private _eventAggregator: EventAggregator;

  constructor(eventAggregator: EventAggregator) {
    this._eventAggregator = eventAggregator;
  }

  public activate(routeParameters: IInspectRouteParameters): void {
    this._eventAggregator.publish(environment.events.processSolutionPanel.navigateToHeatmap);

    const noRouteParameters: boolean = routeParameters.processModelId === undefined || routeParameters.view === undefined;
    if (noRouteParameters) {
      return;
    }

    this.processModelId = routeParameters.processModelId;
    const process: IDiagram = {
      name: this.processModelId,
      xml: '',
      uri: '',
      id: this.processModelId,
    };

    if (routeParameters.view === 'dashboard') {
      this.showHeatmap = false;
      this.showDashboard = true;

      if (routeParameters.latestSource === 'process-engine') {
        this._eventAggregator.publish(environment.events.navBar.showInspectButtons);
        this._eventAggregator.publish(environment.events.navBar.showProcessName, process);
      }
    } else if (routeParameters.view === 'heatmap') {
      this._eventAggregator.publish(environment.events.navBar.showInspectButtons);
      this._eventAggregator.publish(environment.events.navBar.showProcessName, process);

      this.showDashboard = false;
      this.showHeatmap = true;
    }

  }

  public deactivate(): void {
    this._eventAggregator.publish(environment.events.navBar.inspectNavigateToDashboard);
    this._eventAggregator.publish(environment.events.processSolutionPanel.navigateToDesigner);
    this._eventAggregator.publish(environment.events.navBar.hideInspectButtons);
    this._eventAggregator.publish(environment.events.navBar.hideProcessName);
  }
}
