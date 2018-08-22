import {IShape} from './index';

export interface IModeling {
  updateProperties(element: IShape, properties: object): void;
  setColor(elements: Array<IShape> | IShape, options: {
    fill: string,
    stroke: string,
  }): void;
}
