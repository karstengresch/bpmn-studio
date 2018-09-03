import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {bindable, inject} from 'aurelia-framework';

import {Correlation} from '@process-engine/management_api_contracts';

import environment from '../../../../environment';

enum NavigationButton {
  ProcessInstanceList = 'processInstanceList',
  LogViewer = 'LogViewer',
}

@inject(EventAggregator)
export class InspectPanel {
  @bindable() public correlations: Array<Correlation>;
  @bindable() public selectedCorrelation: Correlation;
  @bindable() public log: string;
  public NavigationButton: typeof NavigationButton = NavigationButton;
  public showInspectPanel: boolean;
  public showProcessInstanceList: boolean;
  public showLogViewer: boolean;

  private _eventAggregator: EventAggregator;
  private _subscriptions: Array<Subscription>;

  constructor(eventAggregator: EventAggregator) {
    this._eventAggregator = eventAggregator;
  }

  public attached(): void {
    this._subscriptions = [
      this._eventAggregator.subscribe(environment.events.inspectView.showInspectPanel, (showInspectPanel: boolean) => {
        this.showInspectPanel = showInspectPanel;
      }),
    ];
  }

  public detached(): void {
    for (const subscription of this._subscriptions) {
      subscription.dispose();
    }
  }

  public changeTab(navigationButton: NavigationButton): void {
    switch (navigationButton) {
      case NavigationButton.ProcessInstanceList:
        this.showProcessInstanceList = true;
        this.showLogViewer = false;
        break;

      case NavigationButton.LogViewer:
        this.showProcessInstanceList = false;
        this.showLogViewer = true;
        break;

      default:
        console.log('default');
        this.showProcessInstanceList = false;
        this.showLogViewer = false;
        break;
    }
  }
}
