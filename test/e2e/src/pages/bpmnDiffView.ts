import {
  by,
  element,
  ElementFinder, promise,
} from 'protractor';

import {By} from 'selenium-webdriver';

export class BpmnDiffView {

  // Define Elements
  private byTagName: By = by.tagName('bpmn-diff-view');
  private byChangesListId: By = by.id('changesList');

  public bpmnDiffViewTag: ElementFinder = element(this.byTagName);
  public changesListId: ElementFinder = element(this.byChangesListId);

  // Define Functions
  public static openDiffViewByClickOnButton(showDiffViewButton: ElementFinder): promise.Promise<void> {
    return showDiffViewButton.click();
  }
  public static closeDiffViewByClickOnButton(hideDiffViewButton: ElementFinder): any {
    return hideDiffViewButton.click();
  }
}
