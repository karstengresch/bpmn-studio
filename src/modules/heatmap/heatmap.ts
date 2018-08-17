import {inject} from 'aurelia-framework';

import {ManagementApiClientService} from '@process-engine/management_api_client';
import {ManagementContext, ProcessModelExecution} from '@process-engine/management_api_contracts';

import {AuthenticationService} from '../authentication/authentication.service';

interface RouteParameters {
  processModelId: string;
}

@inject('ManagementApiClientService', 'AuthenticationService')
export class Heatmap {

  public processModel: ProcessModelExecution.ProcessModel;

  private _processModelId: string;
  private _managementApiClient: ManagementApiClientService;
  private _authenticationService: AuthenticationService;

  constructor(managementClient: ManagementApiClientService, authenticationService: AuthenticationService) {
    this._managementApiClient = managementClient;
    this._authenticationService = authenticationService;
  }

  public async activate(routeParameters: RouteParameters): Promise<void> {
    this._processModelId = routeParameters.processModelId;
    await this._getProcess();
  }

  private async _getProcess(): Promise<void> {
    const context: ManagementContext = this._getManagementContext();

    this.processModel = await this._managementApiClient.getProcessModelById(context, this._processModelId);
  }

  private _getManagementContext(): ManagementContext {
    const accessToken: string = this._authenticationService.getAccessToken();
    const context: ManagementContext = {
      identity: accessToken,
    };

    return context;
  }
}
