import {Correlation} from '@process-engine/management_api_contracts';

import {IInspectCorrelationRepository} from '../contracts';

export class InspectCorrelationMockRepository implements IInspectCorrelationRepository {

  private _mockCorrelations: Array<any> = [
    {
      id: 'heatmapSample',
      processModelId: 'heatmap_sample',
      startedAt: 1532295611443,
      state: 'finished',
      user: 'User 1',
    },
    {
      id: 'heatmapSample2',
      processModelId: 'heatmap_sample',
      startedAt: 1533023744560,
      state: 'terminated',
      user: 'User 3',

    },
    {
      id: 'heatmapSample3',
      processModelId: 'knaskdjnjfdsada',
      startedAt: 1533023744560,
      state: 'waiting',
      user: 'User 1',

    },
    {
      id: 'heatmapSample4',
      processModelId: 'heatmap_sample',
      startedAt: 1530794122626,
      state: 'finished',
      user: 'User 2',
    },
    {
      id: 'heatmapSample5',
      processModelId: 'heatmap_sample',
      startedAt: 1530961248291,
      state: 'waiting',
      user: 'User 1',
    },
    {
      id: 'heatmapSample6',
      processModelId: 'test',
      startedAt: 1530961248291,
      state: 'finished',
      user: 'User 1',
    },
    {
      id: 'heatmapSample7',
      processModelId: 'heatmap_sample',
      startedAt: 1531461457698,
      state: 'waiting',
      user: 'User 2',
    },
    {
      id: 'heatmapSample8',
      processModelId: 'heatmap_sample',
      startedAt: 1529937232105,
      state: 'terminated',
      user: 'User 2',
    },
    {
      id: 'heatmapSample9',
      processModelId: 'cdcdsafsd',
      startedAt: 1529937232105,
      state: 'finished',
      user: 'User 1',
    },
    {
      id: 'heatmapSample10',
      processModelId: 'heatmap_sample',
      startedAt: 1531559893834,
      state: 'finished',
      user: 'User 1',
    },
    {
      id: 'heatmapSample11',
      processModelId: 'heatmap_sample',
      startedAt: 1532030760259,
      state: 'terminated',
      user: 'User 3',
    },
    {
      id: 'heatmapSample12',
      processModelId: 'heatmap_sample',
      startedAt: 1534356143429,
      state: 'terminated',
      user: 'User 3',
    },
  ];

  public getAllCorrelationsForProcessModelId(processModelId: string): Promise<Array<Correlation>> {
    const correlationsForProcessModelId: Array<Correlation> = this._mockCorrelations.filter((correlation: Correlation) => {
      return correlation.processModelId === processModelId;
    });

    return new Promise((resolve: Function): void => {
      resolve(correlationsForProcessModelId);
    });
  }
}
