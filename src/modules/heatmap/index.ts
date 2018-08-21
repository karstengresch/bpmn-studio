import {FrameworkConfiguration} from 'aurelia-framework';

import {HeatmapMockRepository} from './repositories/heatmap.mock.repository';
import {HeatmapService} from './services/heatmap.service';

export function configure(config: FrameworkConfiguration): void {
  config.container.registerSingleton('HeatmapMockRepository', HeatmapMockRepository);
  config.container.registerSingleton('HeatmapService', HeatmapService);
}
