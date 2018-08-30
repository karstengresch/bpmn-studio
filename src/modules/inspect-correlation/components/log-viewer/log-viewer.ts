import {bindable} from 'aurelia-framework';

export class LogViewer {
  @bindable({ changeHandler: 'titleChanged' }) public title: string;
  @bindable({ changeHandler: 'foldableChanged' }) public foldable: string;
  @bindable() public log: string;
  public showLog: boolean = true;
  public showHeadline: boolean;
  public isFoldable: boolean;

  public toggleLogVisibility(): void {
    if (this.isFoldable) {
      this.showLog = !this.showLog;
    }
  }

  public foldableChanged(): void {
    this.isFoldable = this.foldable === 'true';
    this.showHeadline = this.title !== ''
                     || this.title === undefined
                     || this.isFoldable;
  }

  public titleChanged(): void {
    this.showHeadline = this.title !== ''
                     || this.isFoldable;
  }
}
