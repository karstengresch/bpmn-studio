import {EventAggregator} from 'aurelia-event-aggregator';
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

@inject('InspectCorrelationService', 'ManagementApiClientService', 'AuthenticationService', EventAggregator)
export class InspectCorrelation {
  public correlations: Array<Correlation>;
  @bindable({ changeHandler: 'selectedCorrelationChanged'}) public selectedCorrelation: Correlation;
  public xml: string;
  public token: string;
  public log: string;

  private _managementApiService: IManagementApiService;
  private _authenticationService: IAuthenticationService;
  private _inspectCorrelationService: IInspectCorrelationService;
  private _eventAggragator: EventAggregator;

  constructor(inspectCorrelationService: IInspectCorrelationService,
              managementApiService: IManagementApiService,
              authenticationService: IAuthenticationService,
              eventAggregator: EventAggregator) {

    this._inspectCorrelationService = inspectCorrelationService;
    this._managementApiService = managementApiService;
    this._authenticationService = authenticationService;
    this._eventAggragator = eventAggregator;
  }

  public async activate(routeParameters: RouteParameters): Promise<void> {
    const processModelId: string = routeParameters.processModelId;

    this.correlations = await this._inspectCorrelationService.getAllCorrelationsForProcessModelId(processModelId);
  }

  public attached(): void {
    this._eventAggragator.publish(environment.events.statusBar.showInspectViewButtons, true);
  }

  public detached(): void {
    this._eventAggragator.publish(environment.events.statusBar.showInspectViewButtons, false);
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

  private _getLog(): string {
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

  private _getManagementContext(): ManagementContext {
    const accessToken: string = this._authenticationService.getAccessToken();
    const context: ManagementContext = {
      identity: accessToken,
    };

    return context;
  }
}
