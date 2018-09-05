import {bindable} from 'aurelia-framework';

export class TokenViewer {
  @bindable({ changeHandler: 'formatToken' }) public token: string;
  public formattedToken: string;

  public formatToken(): void {
    const unformattedToken: JSON = JSON.parse(this.token);

    // tslint:disable-next-line:no-magic-numbers
    this.formattedToken = JSON.stringify(unformattedToken, null, 2);
  }
}
