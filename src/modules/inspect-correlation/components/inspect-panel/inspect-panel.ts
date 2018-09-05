import {bindable} from 'aurelia-framework';

import {Correlation} from '@process-engine/management_api_contracts';

enum NavigationButton {
  ProcessInstanceList = 'processInstanceList',
  LogViewer = 'LogViewer',
}

interface LogEntry {
  timestamp: number;
  message: string;
  logLevel: string;
}

export class InspectPanel {
  @bindable() public correlations: Array<Correlation>;
  @bindable() public selectedCorrelation: Correlation;
  @bindable() public log: Array<LogEntry>;
  public NavigationButton: typeof NavigationButton = NavigationButton;
  public showProcessInstanceList: boolean;
  public showLogViewer: boolean;

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
        this.showProcessInstanceList = false;
        this.showLogViewer = false;
        break;
    }
  }
}
