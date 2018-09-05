import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {bindable, inject} from 'aurelia-framework';

import {
  Correlation,
  IManagementApiService,
  ManagementContext,
  ProcessModelExecution,
} from '@process-engine/management_api_contracts';

import {IAuthenticationService} from '../../contracts/index';
import environment from '../../environment';
import {IInspectCorrelationService} from './contracts';

interface RouteParameters {
  processModelId: string;
}

interface LogEntry {
  timestamp: number;
  message: string;
  logLevel: string;
}

@inject('InspectCorrelationService', 'ManagementApiClientService', 'AuthenticationService', EventAggregator)
export class InspectCorrelation {
  public correlations: Array<Correlation>;
  @bindable({ changeHandler: 'selectedCorrelationChanged'}) public selectedCorrelation: Correlation;
  public xml: string;
  public token: string;
  public log: Array<LogEntry>;
  public showInspectPanel: boolean = true;
  public showTokenViewer: boolean = false;

  private _managementApiService: IManagementApiService;
  private _authenticationService: IAuthenticationService;
  private _inspectCorrelationService: IInspectCorrelationService;
  private _eventAggregator: EventAggregator;
  private _subscriptions: Array<Subscription>;

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
    const processModelId: string = routeParameters.processModelId;

    this.correlations = await this._inspectCorrelationService.getAllCorrelationsForProcessModelId(processModelId);
  }

  public attached(): void {
    this._eventAggregator.publish(environment.events.statusBar.showInspectViewButtons, true);

    this._subscriptions = [
      this._eventAggregator.subscribe(environment.events.inspectView.showInspectPanel, (showInspectPanel: boolean) => {
        this.showInspectPanel = showInspectPanel;
      }),
    ];
  }

  public detached(): void {
    this._eventAggregator.publish(environment.events.statusBar.showInspectViewButtons, false);

    for (const subscription of this._subscriptions) {
      subscription.dispose();
    }
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
    const lorem: string = `Lorem ipsum dolor sit amet, consetetur sadipscing
    elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna
    aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo
    dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus
    est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur
    sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et
    dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam
    et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea
    takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit
    amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt
    ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et
    accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea
    takimata sanctus est Lorem ipsum dolor sit amet. Duis autem vel eum iriure
    dolor in hendrerit in vulputate velit esse molestie consequat, vel illum
    dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio
    dignissim qui blandit praesent luptatum zzril delenit augue duis dolore te
    feugait nulla facilisi. Lorem ipsum dolor sit amet,`;

    return lorem;
  }

  private _getLog(): Array<LogEntry> {
    const log: Array<LogEntry> = [
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
