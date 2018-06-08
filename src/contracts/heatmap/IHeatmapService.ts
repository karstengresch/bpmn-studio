import {ICalculatedData} from './ICalculatedData';
import {IKPI} from './IKPI';

export interface IHeatmapService {
  getDataByDiagram(processId: string): Array<IKPI>;
  calculateColorForElements(elementsData: Array<IKPI>): Array<ICalculatedData>;
  setColorOnElements(calculatedData: Array<ICalculatedData>): void;
}
