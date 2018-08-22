import {
  by,
  element,
  ElementArrayFinder,
  ElementFinder,
} from 'protractor';

import {
  By,
  promise,
} from 'selenium-webdriver';

export class SolutionExplorer {

  // Define Elements
  public solutionExplorerTag: ElementFinder = element(by.tagName('process-solution-panel'));
  public solutionExplorerListItems: ElementArrayFinder = this.solutionExplorerTag.all(by.className('process-explorer__structure-item'));

  // Define Functions
  public solutionExplorerListItemsId(processModelId: string): ElementFinder {
    const id: string = 'processSolutionPanel-' + processModelId;
    const byId: By = by.id(id);

    return this.solutionExplorerTag.element(byId);
  }
  public solutionExplorerListItemsIds(processModelId: string): ElementArrayFinder {
    const id: string = 'processSolutionPanel-' + processModelId;
    const byId: By = by.id(id);

    return this.solutionExplorerListItems.all(byId);
  }
  public processModellDiagram(processModelId: string): ElementFinder {
    const id: string = 'processSolutionPanel-' + processModelId;
    const byId: By = by.id(id);

    return element(byId);
  }

  public openProcessModelByClick(processModelId: string): promise.Promise<void> {
    const solutionExplorerListItemsId: ElementFinder = this.solutionExplorerListItemsId(processModelId);

    return solutionExplorerListItemsId.click();
  }

  public openProcessModelByClick(processModelId: string): any {
    return this.solutionExplorerListItemsId(processModelId).click();
  }

}
