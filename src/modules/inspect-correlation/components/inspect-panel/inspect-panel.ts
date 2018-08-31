import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
import environment from '../../../../environment';

@inject(EventAggregator)
export class InspectPanel {
  public showInspectPanel: boolean;

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
}
