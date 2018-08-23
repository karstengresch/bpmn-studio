import {by, element, ElementFinder} from 'protractor';

export class BpmnDiffView {

  // Define Links, Urls, Classes

  // Define Elements
  public bpmnDiffViewTag: ElementFinder = element(by.tagName('bpmn-diff-view'));
  public changesListClassName: ElementFinder = element(by.className('diff-change-list'));

  // Define Functions
  public openDiffViewByClickOnButton(showDiffViewButton: ElementFinder): any {
    return showDiffViewButton.click();
  }
  public closeDiffViewByClickOnButton(hideDiffViewButton: ElementFinder): any {
    return hideDiffViewButton.click();
  }
}
