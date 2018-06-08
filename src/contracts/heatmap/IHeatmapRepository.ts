import {IKPI} from './IKPI';

export interface IHeatmapRepository {
  getDataByDiagram(processId: string): Array<IKPI>;
}
