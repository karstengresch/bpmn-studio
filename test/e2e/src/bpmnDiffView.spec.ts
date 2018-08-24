import {browser, protractor, ProtractorExpectedConditions} from 'protractor';

import {BpmnDiffView} from './pages/bpmnDiffView';
import {BpmnIo} from './pages/bpmn-io';
import {General} from './pages/general';
import {NavBar} from './pages/navbar';
import {ProcessModel} from './pages/processModel';
import {SolutionExplorer} from './pages/solutionExplorer';
import {StatusBar} from './pages/statusBar';

describe('bpmn-io compare view', () => {

  let bpmnDiffView: BpmnDiffView;
  let bpmnIo: BpmnIo;
  let general: General;
  let navBar: NavBar;
  let processModel: ProcessModel;
  let solutionExplorer: SolutionExplorer;
  let statusBar: StatusBar;

  let processModelId: string;

  const aureliaUrl: string = browser.params.aureliaUrl;
  const defaultTimeoutMS: number = browser.params.defaultTimeoutMS;

  const expectedConditions: ProtractorExpectedConditions = protractor.ExpectedConditions;

  beforeAll(() => {
    bpmnIo = new BpmnIo();
    bpmnDiffView = new BpmnDiffView();
    general = new General();
    navBar = new NavBar();
    processModel = new ProcessModel();
    solutionExplorer = new SolutionExplorer();
    statusBar = new StatusBar();

    processModelId = processModel.getProcessModelId();

    // Create a new process definition by POST REST call
    processModel.postProcessModelWithUserTask(processModelId);
  });

  beforeEach(() => {
    browser.get(aureliaUrl);
    browser.driver.wait(() => {
      browser.wait(expectedConditions.visibilityOf(general.getRouterViewContainer), defaultTimeoutMS);
      return general.getRouterViewContainer;
    });

    // You have to open solution explorer before click on link
    navBar.openSolutionExplorerByButtonClick();
    solutionExplorer.openProcessModelByClick(processModelId);

    // Wait until diagram is loaded
    browser.driver.wait(() => {
      browser.wait(expectedConditions.visibilityOf(bpmnIo.bpmnIoTag), defaultTimeoutMS);
      return bpmnIo.bpmnIoTag;
    });
  });

  it('should contain `Show Diff` button in status bar.', () => {
    statusBar.statusBarDiffViewButton.isDisplayed().then((statusBarDiffViewButtonIsDisplayed: boolean) => {
      expect(statusBarDiffViewButtonIsDisplayed).toBeTruthy();
    });
  });

  it('should be possible to open xml view when click on `Show Diff` button.', () => {
    bpmnDiffView.openDiffViewByClickOnButton(statusBar.statusBarDiffViewButton).then(() => {
      bpmnDiffView.bpmnDiffViewTag.isDisplayed().then((diffViewIsDisplayed: boolean) => {
        expect(diffViewIsDisplayed).toBeTruthy();
      });
    });
  });

  it('should be possible to close xml view when click on `Show Diagram` button.', () => {
    bpmnDiffView.openDiffViewByClickOnButton(statusBar.statusBarDiffViewButton);
    bpmnDiffView.closeDiffViewByClickOnButton(statusBar.statusBarDisableDiffViewButton).then(() => {
      bpmnDiffView.bpmnDiffViewTag.isDisplayed().then((diffViewIsDisplayed: boolean) => {
        expect(diffViewIsDisplayed).toBeFalsy();
      },
      // The element schould not exist any more and an error will be thrown
      (error: any) => {
        expect(error).toBeDefined();
      });
    });
  });

  it('should be possible to click on `Before vs. After` button.', () => {
    bpmnDiffView.openDiffViewByClickOnButton(statusBar.statusBarDiffViewButton);
    statusBar.statusBarBeforeVsAfter.click().then(() => {
      statusBar.statusBarButtonIsEnabled(statusBar.statusBarBeforeVsAfter).then((isEnabled: boolean) => {
        expect(isEnabled).toBeTruthy();
      });
      statusBar.statusBarButtonIsEnabled(statusBar.statusBarAfterVsBefore).then((isEnabled: boolean) => {
        expect(isEnabled).not.toBeTruthy();
      });
    });
  });

  it('should be possible to click on `After vs. Before` button.', () => {
    bpmnDiffView.openDiffViewByClickOnButton(statusBar.statusBarDiffViewButton);
    statusBar.statusBarAfterVsBefore.click().then(() => {
      statusBar.statusBarButtonIsEnabled(statusBar.statusBarAfterVsBefore).then((isEnabled: boolean) => {
        expect(isEnabled).toBeTruthy();
      });
      statusBar.statusBarButtonIsEnabled(statusBar.statusBarBeforeVsAfter).then((isEnabled: boolean) => {
        expect(isEnabled).not.toBeTruthy();
      });
    });
  });

  it('should be possible to click on changes log button.', () => {
    bpmnDiffView.openDiffViewByClickOnButton(statusBar.statusBarDiffViewButton);
    statusBar.statusBarChangesLog.click().then(() => {
      statusBar.statusBarButtonIsEnabled(statusBar.statusBarChangesLog).then((isEnabled: boolean) => {
        expect(isEnabled).toBeTruthy();
      });
    });
  });

  it('should be possible to open changes log window by clicking on changes log button.', () => {
    bpmnDiffView.openDiffViewByClickOnButton(statusBar.statusBarDiffViewButton);
    statusBar.statusBarChangesLog.click().then(() => {
      bpmnDiffView.changesListClassName.isDisplayed().then((changesLogWindowIsDisplayed: boolean) => {
        expect(changesLogWindowIsDisplayed).toBeTruthy();
      });
    });
  });

  it('should be possible to close changes log window by clicking on changes log button.', () => {
    bpmnDiffView.openDiffViewByClickOnButton(statusBar.statusBarDiffViewButton);
    statusBar.statusBarChangesLog.click().then(() => {
      bpmnDiffView.changesListClassName.isDisplayed().then((changesLogWindowIsDisplayed: boolean) => {
        expect(changesLogWindowIsDisplayed).toBeTruthy();
      });
    });
    statusBar.statusBarChangesLog.click().then(() => {
      bpmnDiffView.changesListClassName.isDisplayed().then((changesLogWindowIsDisplayed: boolean) => {
        expect(changesLogWindowIsDisplayed).not.toBeTruthy();
      },
      // The element schould not exist any more and an error will be thrown
      (error: any) => {
        expect(error).toBeDefined();
      });
    });
  });
});
