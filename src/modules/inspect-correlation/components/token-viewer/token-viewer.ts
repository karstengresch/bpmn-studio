import {bindable} from 'aurelia-framework';

export class TokenViewer {
  @bindable({ changeHandler: 'titleChanged' }) public title: string;
  @bindable({ changeHandler: 'foldableChanged' }) public foldable: string;
  @bindable() public token: string;
  public showToken: boolean = true;
  public showHeadline: boolean;
  public isFoldable: boolean;

  public toggleTokenVisibility(): void {
    if (this.isFoldable) {
      this.showToken = !this.showToken;
    }
  }

  public foldableChanged(): void {
    this.isFoldable = this.foldable === 'true';
    this.showHeadline = this.title !== ''
                     || this.isFoldable;
  }

  public titleChanged(): void {
    this.showHeadline = this.title !== ''
                     || this.isFoldable;
  }
}
