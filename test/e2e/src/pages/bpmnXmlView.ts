import {
  by,
  element,
  ElementFinder,
} from 'protractor';

import {
  By,
  promise,
} from 'selenium-webdriver';

export class BpmnXmlView {

  // Define Links, Urls, Classes
  public bpmnLineNumbersClass: string = 'hljs-ln-numbers';

  // Define Elements
  private _byTagName: By = by.tagName('bpmn-xml-view');

  public bpmnXmlViewTag: ElementFinder = element(this._byTagName);

  // Define Functions
  public openXMLViewByClickOnButton(showXMLViewButton: ElementFinder): promise.Promise<void> {
    return showXMLViewButton.click();
  }

}
