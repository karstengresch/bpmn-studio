import {inject} from 'aurelia-framework';

import {ActiveToken, FlowNodeRuntimeInformation} from '@process-engine/kpi_api_contracts';
import {IManagementApiService, ManagementContext, ProcessModelExecution} from '@process-engine/management_api_contracts';

import {IAuthenticationService} from '../../../contracts';
import {IHeatmapRepository} from '../contracts/IHeatmap.Repository';

@inject('ManagementApiClientService', 'AuthenticationService')
export class HeatmapRepository implements IHeatmapRepository {

  private _managementApiClientService: IManagementApiService;
  private _authenticationService: IAuthenticationService;

  constructor(managementApiClientService: IManagementApiService, authenticationService: IAuthenticationService) {
    this._managementApiClientService = managementApiClientService;
    this._authenticationService = authenticationService;
  }

  public getRuntimeInformationForProcessModel(processModelId: string): Promise<Array<FlowNodeRuntimeInformation>> {
    const context: ManagementContext = this._getManagementContext();

    return this._managementApiClientService.getRuntimeInformationForProcessModel(context, processModelId);
  }

  public getProcess(processModelId: string): Promise<ProcessModelExecution.ProcessModel> {
    const context: ManagementContext = this._getManagementContext();

    return this._managementApiClientService.getProcessModelById(context, processModelId);
  }

  public getActiveTokensForProcessModel(processModelId: string): Promise<Array<ActiveToken>> {
    const context: ManagementContext = this._getManagementContext();

    return this._managementApiClientService.getActiveTokensForProcessModel(context, processModelId);
  }

  private _getManagementContext(): ManagementContext {
    const accessToken: string = this._authenticationService.getAccessToken();

    const context: ManagementContext = {
      identity: accessToken,
    };

    return context;
  }
}
