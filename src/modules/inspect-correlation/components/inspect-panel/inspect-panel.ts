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
    const shouldShowProcessInstanceList: boolean = inspectPanelTab === InspectPanelTab.ProcessInstanceList;
    const shouldShowLogViewer: boolean = inspectPanelTab === InspectPanelTab.LogViewer;

    this.showProcessInstanceList = shouldShowProcessInstanceList;
    this.showLogViewer = shouldShowLogViewer;
  }
}
