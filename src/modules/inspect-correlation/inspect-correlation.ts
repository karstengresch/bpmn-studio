import {inject} from 'aurelia-framework';

import {
  Correlation,
  IManagementApiService,
  ManagementContext,
  ProcessModelExecution,
} from '@process-engine/management_api_contracts';

import {IAuthenticationService} from '../../contracts/index';
import {DiagramViewer} from './components/diagram-viewer/diagram-viewer';
import {IInspectCorrelationService} from './contracts';

interface RouteParameters {
  processModelId: string;
}

@inject('InspectCorrelationService', 'ManagementApiClientService', 'AuthenticationService')
export class InspectCorrelation {
  public diagramViewer: DiagramViewer;
  public processModelCorrelations: Array<Correlation>;
  public correlationSelected: boolean;
  public canvasModel: HTMLElement;
  public currentToken: string;
  public currentLog: string;
  public showToken: boolean;
  public showLog: boolean;
  public xml: string;

  private _inspectCorrelationService: IInspectCorrelationService;
  private _managementApiService: IManagementApiService;
  private _authenticationService: IAuthenticationService;

  constructor(inspectCorrelationService: IInspectCorrelationService,
              managementApiService: IManagementApiService,
              authenticationService: IAuthenticationService) {

    this._inspectCorrelationService = inspectCorrelationService;
    this._managementApiService = managementApiService;
    this._authenticationService = authenticationService;
  }

  public async activate(routeParameters: RouteParameters): Promise<void> {
    const processModelId: string = routeParameters.processModelId;

    this.processModelCorrelations = await this._inspectCorrelationService.getAllCorrelationsForProcessModelId(processModelId);
  }

  public detached(): void {
    this.correlationSelected = false;
  }

  public async selectCorrelation(selectedCorrelation: Correlation): Promise<void> {
    const managementContext: ManagementContext = this._getManagementContext();
    const processModelId: string = selectedCorrelation.processModelId;

    this.correlationSelected = true;

    const processModel: ProcessModelExecution.ProcessModel = await this._managementApiService.getProcessModelById(managementContext, processModelId);
    this.xml = processModel.xml;

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

    this.currentToken = `Token: ${lorem}`;
    this.currentLog = `Log ${lorem}`;
  }

  public toggleTokenVisibility(): void {
    this.showToken = !this.showToken;
  }

  public toggleLogVisibility(): void {
    this.showLog = !this.showLog;
  }

  private _getManagementContext(): ManagementContext {
    const accessToken: string = this._authenticationService.getAccessToken();
    const context: ManagementContext = {
      identity: accessToken,
    };

    return context;
  }
}
