import {by, element, ElementFinder} from 'protractor';

export class BpmnXmlView {

  // Define Links, Urls, Classes
  public bpmnLineNumbersClass: string = 'hljs-ln-numbers';

  // Define Elements
  public bpmnXmlViewTag: ElementFinder = element(by.tagName('bpmn-xml-view'));

  // Define Functions
  public openXMLViewByClickOnButton(showXMLViewButton: ElementFinder): any {
    return showXMLViewButton.click();
  }

}
