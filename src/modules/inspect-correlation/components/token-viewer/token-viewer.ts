import {bindable} from 'aurelia-framework';

export class TokenViewer {
  @bindable() public title: string;
  @bindable() public foldable: string;
  @bindable() public token: string;
  public showToken: boolean = true;

  public toggleTokenVisibility(): void {
    const isFoldable: boolean = this.foldable === 'true';

    if (isFoldable) {
      this.showToken = !this.showToken;
    }
  }
}
