import {IOverlayDescriptor} from './IOverlayDescriptor';

export interface IOverlay {
  add(elementOrElementId: string, overlayDescriptor: IOverlayDescriptor): void;
  remove(elemenId: string): void;
}
