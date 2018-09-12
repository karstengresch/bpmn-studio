import {bindable} from 'aurelia-framework';

import {Correlation} from '@process-engine/management_api_contracts';
import {ILogEntry, InspectPanelTab} from '../../../../contracts/index';

export class InspectPanel {
  @bindable() public correlations: Array<Correlation>;
  @bindable() public selectedCorrelation: Correlation;
  @bindable() public log: Array<ILogEntry>;
  @bindable() public fullscreen: boolean;
  public InspectPanelTab: typeof InspectPanelTab = InspectPanelTab;
  public showProcessInstanceList: boolean = true;
  public showLogViewer: boolean;

  public toggleFullscreen(): void {
    this.fullscreen = !this.fullscreen;
  }

  public changeTab(inspectPanelTab: InspectPanelTab): void {
    switch (inspectPanelTab) {
      case InspectPanelTab.ProcessInstanceList:
        this.showProcessInstanceList = true;
        this.showLogViewer = false;
        break;

      case InspectPanelTab.LogViewer:
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
