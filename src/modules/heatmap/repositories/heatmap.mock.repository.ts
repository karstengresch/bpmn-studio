import {inject} from 'aurelia-framework';

import {ActiveToken, FlowNodeRuntimeInformation} from '@process-engine/kpi_api_contracts';
import {ManagementApiClientService} from '@process-engine/management_api_client';
import {ManagementContext, ProcessModelExecution} from '@process-engine/management_api_contracts';

import {IAuthenticationService} from '../../../contracts';
import {IHeatmapRepository} from '../contracts/IHeatmap.Repository';

@inject('ManagementApiClientService', 'AuthenticationService')
export class HeatmapMockRepository implements IHeatmapRepository {

  private _managementApiClient: ManagementApiClientService;
  private _authenticationService: IAuthenticationService;

  private _mockDataForHeatmapSampleProcess: Array<FlowNodeRuntimeInformation> = [
    /** 3 Tasks */
    {
      processModelId: 'heatmap_sample',
      flowNodeId: 'Task_1sy1ibw',
      arithmeticMeanRuntimeInMs: 10000.0,
      firstQuartileRuntimeInMs: NaN,
      medianRuntimeInMs: 10100.5,
      thirdQuartileRuntimeInMs: NaN,
      minRuntimeInMs: NaN,
      maxRuntimeInMs: NaN,
    },
    {
      processModelId: 'heatmap_sample',
      flowNodeId: 'Task_0julnc5',
      arithmeticMeanRuntimeInMs: 10000.0,
      firstQuartileRuntimeInMs: NaN,
      medianRuntimeInMs: 10100.5,
      thirdQuartileRuntimeInMs: NaN,
      minRuntimeInMs: NaN,
      maxRuntimeInMs: NaN,
    },
    {
      processModelId: 'heatmap_sample',
      flowNodeId: 'Task_04fbo5q',
      arithmeticMeanRuntimeInMs: 10000.0,
      firstQuartileRuntimeInMs: NaN,
      medianRuntimeInMs: 10100.5,
      thirdQuartileRuntimeInMs: NaN,
      minRuntimeInMs: NaN,
      maxRuntimeInMs: NaN,
    },
    /** 2 Gateways */
    {
      processModelId: 'heatmap_sample',
      flowNodeId: 'ExclusiveGateway_0fi1ct7',
      arithmeticMeanRuntimeInMs: 5000.0,
      firstQuartileRuntimeInMs: NaN,
      medianRuntimeInMs: 5100.5,
      thirdQuartileRuntimeInMs: NaN,
      minRuntimeInMs: NaN,
      maxRuntimeInMs: NaN,
    },
    {
      processModelId: 'heatmap_sample',
      flowNodeId: 'ExclusiveGateway_134ybqm',
      arithmeticMeanRuntimeInMs: 5100.0,
      firstQuartileRuntimeInMs: NaN,
      medianRuntimeInMs: 4900.5,
      thirdQuartileRuntimeInMs: NaN,
      minRuntimeInMs: NaN,
      maxRuntimeInMs: NaN,
    },
    /** 7 Edges */
    {
      processModelId: 'heatmap_sample',
      flowNodeId: 'SequenceFlow_1jdocur',
      arithmeticMeanRuntimeInMs: 1000.0,
      firstQuartileRuntimeInMs: NaN,
      medianRuntimeInMs: 10100.5,
      thirdQuartileRuntimeInMs: NaN,
      minRuntimeInMs: NaN,
      maxRuntimeInMs: NaN,
    },
    {
      processModelId: 'heatmap_sample',
      flowNodeId: 'SequenceFlow_1g8yhyu',
      arithmeticMeanRuntimeInMs: 1000.0,
      firstQuartileRuntimeInMs: NaN,
      medianRuntimeInMs: 10100.5,
      thirdQuartileRuntimeInMs: NaN,
      minRuntimeInMs: NaN,
      maxRuntimeInMs: NaN,
    },
    {
      processModelId: 'heatmap_sample',
      flowNodeId: 'SequenceFlow_0szygwm',
      arithmeticMeanRuntimeInMs: 1000.0,
      firstQuartileRuntimeInMs: NaN,
      medianRuntimeInMs: 10100.5,
      thirdQuartileRuntimeInMs: NaN,
      minRuntimeInMs: NaN,
      maxRuntimeInMs: NaN,
    },
    {
      processModelId: 'heatmap_sample',
      flowNodeId: 'SequenceFlow_17fbkvc',
      arithmeticMeanRuntimeInMs: 1000.0,
      firstQuartileRuntimeInMs: NaN,
      medianRuntimeInMs: 10100.5,
      thirdQuartileRuntimeInMs: NaN,
      minRuntimeInMs: NaN,
      maxRuntimeInMs: NaN,
    },
    {
      processModelId: 'heatmap_sample',
      flowNodeId: 'SequenceFlow_027yae2',
      arithmeticMeanRuntimeInMs: 1000.0,
      firstQuartileRuntimeInMs: NaN,
      medianRuntimeInMs: 10100.5,
      thirdQuartileRuntimeInMs: NaN,
      minRuntimeInMs: NaN,
      maxRuntimeInMs: NaN,
    },
    {
      processModelId: 'heatmap_sample',
      flowNodeId: 'SequenceFlow_0nqcs3t',
      arithmeticMeanRuntimeInMs: 1000.0,
      firstQuartileRuntimeInMs: NaN,
      medianRuntimeInMs: 10100.5,
      thirdQuartileRuntimeInMs: NaN,
      minRuntimeInMs: NaN,
      maxRuntimeInMs: NaN,
    },
    {
      processModelId: 'heatmap_sample',
      flowNodeId: 'SequenceFlow_1ejes54',
      arithmeticMeanRuntimeInMs: 1000.0,
      firstQuartileRuntimeInMs: NaN,
      medianRuntimeInMs: 10100.5,
      thirdQuartileRuntimeInMs: NaN,
      minRuntimeInMs: NaN,
      maxRuntimeInMs: NaN,
    },
  ];

  private _mockDataForActiveTokens: Array<ActiveToken> = [
    {
      processInstanceId: 'test',
      processModelId: 'heatmap_sample',
      correlationId: 'test',
      identity: {
        token: 'test',
      },
      createdAt: new Date(),
      flowNodeId: 'Task_1sy1ibw',
      flowNodeInstanceId: '<flownodeinstanceidhere>',
      payload: '',
    },
    {
      processInstanceId: 'test',
      processModelId: 'heatmap_sample',
      correlationId: 'test',
      identity: {
        token: 'test',
      },
      createdAt: new Date(),
      flowNodeId: 'Task_1sy1ibw',
      flowNodeInstanceId: '<flownodeinstanceidhere>',
      payload: '',
    },
    {
      processInstanceId: 'test',
      processModelId: 'heatmap_sample',
      correlationId: 'test',
      identity: {
        token: 'test',
      },
      createdAt: new Date(),
      flowNodeId: 'Task_1sy1ibw',
      flowNodeInstanceId: '<flownodeinstanceidhere>',
      payload: '',
    },
    {
      processInstanceId: 'test',
      processModelId: 'heatmap_sample',
      correlationId: 'test',
      identity: {
        token: 'test',
      },
      createdAt: new Date(),
      flowNodeId: 'Task_0julnc5',
      flowNodeInstanceId: '<flownodeinstanceidhere>',
      payload: '',
    },
    {
      processInstanceId: 'test',
      processModelId: 'heatmap_sample',
      correlationId: 'test',
      identity: {
        token: 'test',
      },
      createdAt: new Date(),
      flowNodeId: 'Task_0julnc5',
      flowNodeInstanceId: '<flownodeinstanceidhere>',
      payload: '',
    },
    {
      processInstanceId: 'test',
      processModelId: 'heatmap_sample',
      correlationId: 'test',
      identity: {
        token: 'test',
      },
      createdAt: new Date(),
      flowNodeId: 'Task_0julnc5',
      flowNodeInstanceId: '<flownodeinstanceidhere>',
      payload: '',
    },
    {
      processInstanceId: 'test',
      processModelId: 'heatmap_sample',
      correlationId: 'test',
      identity: {
        token: 'test',
      },
      createdAt: new Date(),
      flowNodeId: 'Task_0julnc5',
      flowNodeInstanceId: '<flownodeinstanceidhere>',
      payload: '',
    },
    {
      processInstanceId: 'test',
      processModelId: 'heatmap_sample',
      correlationId: 'test',
      identity: {
        token: 'test',
      },
      createdAt: new Date(),
      flowNodeId: 'Task_0julnc5',
      flowNodeInstanceId: '<flownodeinstanceidhere>',
      payload: '',
    },
    {
      processInstanceId: 'test',
      processModelId: 'heatmap_sample',
      correlationId: 'test',
      identity: {
        token: 'test',
      },
      createdAt: new Date(),
      flowNodeId: 'Task_04fbo5q',
      flowNodeInstanceId: '<flownodeinstanceidhere>',
      payload: '',
    },
  ];

  constructor(manegementApiClient: ManagementApiClientService, authenticationService: IAuthenticationService) {
    this._managementApiClient = manegementApiClient;
    this._authenticationService = authenticationService;
  }

  public getRuntimeInformationForProcessModel(processModelId: string): Promise<Array<FlowNodeRuntimeInformation>> {
    return new Promise ((resolve: Function, reject: Function): void => {
      resolve(this._mockDataForHeatmapSampleProcess);
    });
  }

  public getActiveTokensForProcessModel(processModelId: string): Promise<Array<ActiveToken>> {
    return new Promise ((resolve: Function, reject: Function): void => {
      resolve(this._mockDataForActiveTokens);
    });
  }

  public getProcess(processModelId: string): Promise<ProcessModelExecution.ProcessModel> {
    const context: ManagementContext = this._getManagementContext();

    return this._managementApiClient.getProcessModelById(context, processModelId);
  }

  private _getManagementContext(): ManagementContext {
    const accessToken: string = this._authenticationService.getAccessToken();
    const context: ManagementContext = {
      identity: accessToken,
    };

    return context;
  }
}
