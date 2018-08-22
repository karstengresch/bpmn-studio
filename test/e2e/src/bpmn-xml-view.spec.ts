import {browser, protractor, ProtractorExpectedConditions} from 'protractor';

import {BpmnIo} from './pages/bpmn-io';
import {BpmnXmlView} from './pages/bpmn-xml-view';
import {General} from './pages/general';
import {NavBar} from './pages/navbar';
import {ProcessModel} from './pages/processModel';
import {SolutionExplorer} from './pages/solutionExplorer';
import {StatusBar} from './pages/statusBar';

describe('bpmn-io XML view', () => {

  let bpmnIo: BpmnIo;
  let bpmnXmlView: BpmnXmlView;
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
    bpmnXmlView = new BpmnXmlView();
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

  it('should contain `Show XML` button in status bar.', () => {
    statusBar.statusBarXMLViewButton.isDisplayed().then((statusBarXMLViewButtonIsDisplayed: boolean) => {
      expect(statusBarXMLViewButtonIsDisplayed).toBeTruthy();
    });
  });

  it('should be possbile to open xml view when click on `Show XML` button.', () => {
    bpmnXmlView.openXMLViewByClickOnButton(statusBar.statusBarXMLViewButton).then(() => {
      bpmnXmlView.bpmnXmlViewTag.isDisplayed().then((xmlViewIsDisplayed: boolean) => {
        expect(xmlViewIsDisplayed).toBeTruthy();
      });
    });
  });
});
