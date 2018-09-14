import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {bindable, inject, observable} from 'aurelia-framework';

import {
  Correlation,
  IManagementApiService,
  ManagementContext,
  ProcessModelExecution,
} from '@process-engine/management_api_contracts';

import {IAuthenticationService, IEventFunction, ILogEntry} from '../../contracts/index';
import environment from '../../environment';
import {IInspectCorrelationService} from './contracts';

interface RouteParameters {
  processModelId: string;
}

@inject('InspectCorrelationService', 'ManagementApiClientService', 'AuthenticationService', EventAggregator)
export class InspectCorrelation {
  public correlations: Array<Correlation>;
  @bindable({ changeHandler: 'selectedCorrelationChanged'}) public selectedCorrelation: Correlation;
  @bindable() public inspectPanelFullscreen: boolean = false;
  @observable public bottomPanelHeight: number = 250;
  public xml: string;
  public token: string;
  public log: Array<ILogEntry>;
  public showInspectPanel: boolean = true;
  public showTokenViewer: boolean = false;
  public bottomPanelResizeDiv: HTMLDivElement;

  private _managementApiService: IManagementApiService;
  private _authenticationService: IAuthenticationService;
  private _inspectCorrelationService: IInspectCorrelationService;
  private _eventAggregator: EventAggregator;
  private _subscriptions: Array<Subscription>;
  private _processModelId: string;
  private _statusBarHeight: number = 20;
  private _minInspectPanelHeight: number = 250;

  constructor(inspectCorrelationService: IInspectCorrelationService,
              managementApiService: IManagementApiService,
              authenticationService: IAuthenticationService,
              eventAggregator: EventAggregator) {

    this._inspectCorrelationService = inspectCorrelationService;
    this._managementApiService = managementApiService;
    this._authenticationService = authenticationService;
    this._eventAggregator = eventAggregator;
  }

  public async activate(routeParameters: RouteParameters): Promise<void> {
    this._processModelId = routeParameters.processModelId;

    this.correlations = await this._inspectCorrelationService.getAllCorrelationsForProcessModelId(this._processModelId);
  }

  public attached(): void {
    this._eventAggregator.publish(environment.events.statusBar.showInspectViewButtons, true);
    this._eventAggregator.publish(environment.events.navBar.updateProcessName, this._processModelId);

    this._subscriptions = [
      this._eventAggregator.subscribe(environment.events.inspectView.showInspectPanel, (showInspectPanel: boolean) => {
        this.showInspectPanel = showInspectPanel;
      }),
    ];

    this.bottomPanelResizeDiv.addEventListener('mousedown', (e: Event) => {
      const windowEvent: Event = e || window.event;
      windowEvent.cancelBubble = true;

      const mousemoveFunction: IEventFunction = (event: MouseEvent): void => {
        this.resize(event);
        document.getSelection().empty();
      };

      const mouseUpFunction: IEventFunction = (): void => {
        document.removeEventListener('mousemove', mousemoveFunction);
        document.removeEventListener('mouseup', mouseUpFunction);
      };

      document.addEventListener('mousemove', mousemoveFunction);
      document.addEventListener('mouseup', mouseUpFunction);
    });
  }

  public detached(): void {
    this._eventAggregator.publish(environment.events.statusBar.showInspectViewButtons, false);
    this._eventAggregator.publish(environment.events.navBar.clearProcessData);

    for (const subscription of this._subscriptions) {
      subscription.dispose();
    }
  }

  public resize(event: MouseEvent): void {
    const mouseYPosition: number = event.clientY;
    const inspectPanelHeightWithStatusBar: number = this.bottomPanelResizeDiv.parentElement.parentElement.clientHeight + this._statusBarHeight;
    const newBottomPanelHeight: number = inspectPanelHeightWithStatusBar - mouseYPosition;

    this.bottomPanelHeight = Math.max(newBottomPanelHeight, this._minInspectPanelHeight);
  }

  public toggleTokenViewer(): void {
    this.showTokenViewer = !this.showTokenViewer;
  }

  public async selectedCorrelationChanged(selectedCorrelation: Correlation): Promise<void> {
    const processModelId: string = selectedCorrelation.processModelId;

    this.log = this._getLog();
    this.token = this._getToken();
    this.xml = await this._getXml(processModelId);
  }

  private async _getXml(processModelId: string): Promise<string> {
    const managementContext: ManagementContext = this._getManagementContext();
    const processModel: ProcessModelExecution.ProcessModel = await this._managementApiService.getProcessModelById(managementContext, processModelId);

    return processModel.xml;
  }

  private _getToken(): string {
    const token: string = '{' +
    '"history":{"StartEvent":{},' +
    '"ut_WaehleKlasse":{ "form_fields":{"category":"Kleinwagen","isOneWay":"false","currency":"EUR"}},' +
    '"ut_WaehleExtras":{"form_fields":{"navigationSystem":"true","additionalDriver":"true","leather":"true"}},' +
    '"UserTask_Luxus":{"form_fields":{"chauffeur":"true"}},' +
    '"ut_WaehleKlasse2":{ "form_fields":{"category":"Kleinwagen","isOneWay":"false","currency":"EUR"}},' +
    '"ut_WaehleExtras2":{"form_fields":{"navigationSystem":"true","additionalDriver":"true","leather":"true"}},' +
    '"UserTask_Luxus2":{"form_fields":{"chauffeur":"true"}},' +
    '"ut_WaehleKlasse3":{ "form_fields":{"category":"Kleinwagen","isOneWay":"false","currency":"EUR"}},' +
    '"ut_WaehleExtras3":{"form_fields":{"navigationSystem":"true","additionalDriver":"true","leather":"true"}},' +
    '"UserTask_Luxus3":{"form_fields":{"chauffeur":"true"}},' +
    '"ut_WaehleKlasse4":{ "form_fields":{"category":"Kleinwagen","isOneWay":"false","currency":"EUR"}},' +
    '"ut_WaehleExtras4":{"form_fields":{"navigationSystem":"true","additionalDriver":"true","leather":"true"}},' +
    '"UserTask_Luxus4":{"form_fields":{"chauffeur":"true"}},' +
    '"ut_WaehleKlasse5":{ "form_fields":{"category":"Kleinwagen","isOneWay":"false","currency":"EUR"}},' +
    '"ut_WaehleExtras5":{"form_fields":{"navigationSystem":"true","additionalDriver":"true","leather":"true"}},' +
    '"UserTask_Luxus5":{"form_fields":{"chauffeur":"true"}},' +
    '"ut_WaehleKlasse6":{ "form_fields":{"category":"Kleinwagen","isOneWay":"false","currency":"EUR"}},' +
    '"ut_WaehleExtras6":{"form_fields":{"navigationSystem":"true","additionalDriver":"true","leather":"true"}},' +
    '"UserTask_Luxus6":{"form_fields":{"chauffeur":"true"}},' +
    '"ut_WaehleKlasse7":{ "form_fields":{"category":"Kleinwagen","isOneWay":"false","currency":"EUR"}},' +
    '"ut_WaehleExtras7":{"form_fields":{"navigationSystem":"true","additionalDriver":"true","leather":"true"}},' +
    '"UserTask_Luxus7":{"form_fields":{"chauffeur":"true"}},' +
    '"ut_WaehleKlasse8":{ "form_fields":{"category":"Kleinwagen","isOneWay":"false","currency":"EUR"}},' +
    '"ut_WaehleExtras8":{"form_fields":{"navigationSystem":"true","additionalDriver":"true","leather":"true"}},' +
    '"UserTask_Luxus8":{"form_fields":{"chauffeur":"true"}},' +
    '"ut_WaehleKlasse9":{ "form_fields":{"category":"Kleinwagen","isOneWay":"false","currency":"EUR"}},' +
    '"ut_WaehleExtras9":{"form_fields":{"navigationSystem":"true","additionalDriver":"true","leather":"true"}},' +
    '"UserTask_Luxus9":{"form_fields":{"chauffeur":"true"}},' +
    '"ut_WaehleKlasse10":{ "form_fields":{"category":"Kleinwagen","isOneWay":"false","currency":"EUR"}},' +
    '"ut_WaehleExtras10":{"form_fields":{"navigationSystem":"true","additionalDriver":"true","leather":"true"}},' +
    '"UserTask_Luxus10":{"form_fields":{"chauffeur":"true"}},' +
    '"current":{"form_fields":{"chauffeur":"true"}}}' +
    '}';

    return token;
  }

  private _getLog(): Array<ILogEntry> {
    const log: Array<ILogEntry> = [
      {
        timestamp: 30767606000,
        message: 'Process started.',
        logLevel: 'info',
      },
      {
        timestamp: 30854006000,
        message: 'Service Task with id fetchData finished.',
        logLevel: 'info',
      },
      {
        timestamp: 1460454317000,
        message: 'User Task with id enterEmail was finished with incompatible data!',
        logLevel: 'error',
      },
      {
        timestamp: 1460454377000,
        message: 'User Task with id enterEmail finished.',
        logLevel: 'info',
      },
      {
        timestamp: 1535981475000,
        message: 'User Task with id enterEmail finished.',
        logLevel: 'info',
      },
      {
        timestamp: 1747054117000,
        message: 'Service Task with id sendEmail finished.',
        logLevel: 'info',
      },
      {
        timestamp: 2177449199000,
        message: 'Process finished.',
        logLevel: 'info',
      },
    ];

    return log;
  }

  private _getManagementContext(): ManagementContext {
    const accessToken: string = this._authenticationService.getAccessToken();
    const context: ManagementContext = {
      identity: accessToken,
    };

    return context;
  }
}
