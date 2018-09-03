import {EventAggregator} from 'aurelia-event-aggregator';
import {bindable, inject} from 'aurelia-framework';

import {Dashboard} from '../dashboard/dashboard';
import {Heatmap} from '../heatmap/heatmap';

import environment from '../../environment';

export interface IInspectRouteParameters {
  processModelId?: string;
  view?: string;
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
    console.log('testtesttest');
    this._eventAggregator.publish(environment.events.processSolutionPanel.navigateToHeatmap);

    const noRouteParameters: boolean = routeParameters.processModelId === undefined || routeParameters.view === undefined;
    if (noRouteParameters) {
      return;
    }

    this.processModelId = routeParameters.processModelId;

    if (routeParameters.view === 'dashboard') {
      this.showHeatmap = false;
      this.showDashboard = true;
    } else if (routeParameters.view === 'heatmap') {
      this.showDashboard = false;
      this.showHeatmap = true;
      this._eventAggregator.publish(environment.events.navBar.enableDesignLink);
    }

  }

  public deactivate(): void {
    this._eventAggregator.publish(environment.events.navBar.inspectNavigateToDashboard);
    this._eventAggregator.publish(environment.events.processSolutionPanel.navigateToDesigner);
  }
}
