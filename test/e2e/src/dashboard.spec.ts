import {
  browser,
  ElementFinder,
  protractor,
  ProtractorExpectedConditions,
} from 'protractor';

import {Dashboard} from './pages/dashboard';
import {General} from './pages/general';
import {ProcessModel} from './pages/processModel';

describe('Dashboard view', () => {

  let dashboard: Dashboard;
  let general: General;
  let processModel: ProcessModel;

  let processModelId: string;

  const aureliaUrl: string = browser.params.aureliaUrl;
  const defaultTimeoutMS: number = browser.params.defaultTimeoutMS;
  // tslint:disable-next-line:no-magic-numbers
  const taskListTimeoutMS: number = 2 * defaultTimeoutMS;

  const expectedConditions: ProtractorExpectedConditions = protractor.ExpectedConditions;

  beforeAll(() => {
    dashboard = new Dashboard();
    general = new General();
    processModel = new ProcessModel();

    processModelId = processModel.getProcessModelId();

    // Create a new process definition by POST REST call
    processModel.postProcessModelWithUserTask(processModelId);
  });

  beforeEach(() => {
    const dashboardLink: string = dashboard.dashboardLink;
    const routerViewContainer: ElementFinder = general.getRouterViewContainer;
    const visibilityOfRouterViewContainer: Function = expectedConditions.visibilityOf(routerViewContainer);

    browser.get(aureliaUrl + dashboardLink);
    browser.driver
      .wait(() => {
        browser
          .wait(visibilityOfRouterViewContainer, defaultTimeoutMS);

        return routerViewContainer;
      });
  });

  it('should contain process definitions.', () => {
      processModel.startProcess(processModelId);
  });

  // process list section

  it('should contain process list.', async() => {
    const processListTag: ElementFinder = dashboard.processListTag;
    const processListTagIsDisplayed: boolean = await processListTag.isDisplayed();

    expect(processListTagIsDisplayed).toBeTruthy();
  });

  it('should contain at least process definition in running section.', async() => {
    const firstProcessRunningListItems: ElementFinder = dashboard.firstProcessRunningListItems;
    const visibilityOfFirstProcessRunningListItems: Function = expectedConditions.visibilityOf(firstProcessRunningListItems);

    browser.driver
      .wait(() => {
        browser
          .wait(visibilityOfFirstProcessRunningListItems, defaultTimeoutMS);

        return firstProcessRunningListItems;
      });

    const countOfProcessRunningListItems: number = await dashboard.countOfProcessRunningListItems();

    expect(countOfProcessRunningListItems).toBeGreaterThanOrEqual(1);
  });

  it('should contain recently started process in running section.', async() => {
    const correlationId: string = processModel.getCorrelationId();
    const firstProcessRunningListItemsById: ElementFinder = dashboard.firstProcessRunningListItemsById(correlationId);
    const visibilityOfFirstProcessRunningListItemsById: Function = expectedConditions.visibilityOf(firstProcessRunningListItemsById);

    browser.driver
      .wait(() => {
        browser
          .wait(visibilityOfFirstProcessRunningListItemsById, defaultTimeoutMS);

        return firstProcessRunningListItemsById;
      });

    const countOfProcessRunningListItemsByCorrelationId: number = await dashboard.countOfProcessRunningListItemsByCorrelationId(correlationId);

    expect(countOfProcessRunningListItemsByCorrelationId).toBe(1);
  });

  it('should be possible to open process model by click on hyperlink in table.', async() => {
    const correlationId: string = processModel.getCorrelationId();
    const hyperlinkOfProcessRunningListItemByCorrelationId: ElementFinder = dashboard.hyperlinkOfProcessRunningListItemByCorrelationId(correlationId);
    const visibilityOfHyperlinkOfProcessRunningListItemByCorrelationId: Function =
      expectedConditions.visibilityOf(hyperlinkOfProcessRunningListItemByCorrelationId);

    browser.driver
      .wait(() => {
        browser
          .wait(visibilityOfHyperlinkOfProcessRunningListItemByCorrelationId, defaultTimeoutMS);

        return hyperlinkOfProcessRunningListItemByCorrelationId;
     });

    await dashboard.openProcessModelByClickOnModelIdInProcessRunningList(correlationId);

    const processModelUrl: string = processModel.processModelUrl(processModelId);
    const currentBrowserUrl: string = await browser.getCurrentUrl();

    expect(currentBrowserUrl).toContain(processModelUrl);

  });

  it('should be possible to open user tasks by clicking on the hyperlink in the table.', async() => {
    const correlationId: string = processModel.getCorrelationId();
    const hyperlinkOfUserTasksInProcessRunningListItemByCorrelationId: ElementFinder =
      dashboard.hyperlinkOfUserTasksInProcessRunningListItemByCorrelationId(correlationId);
    const visibilityOfHyperlinkOfUserTasksInProcessRunningListItemByCorrelationId: Function =
      expectedConditions.visibilityOf(hyperlinkOfUserTasksInProcessRunningListItemByCorrelationId);

    browser.driver
      .wait(() => {
        browser
          .wait(visibilityOfHyperlinkOfUserTasksInProcessRunningListItemByCorrelationId, defaultTimeoutMS);
        return hyperlinkOfUserTasksInProcessRunningListItemByCorrelationId;
      });

    await dashboard.openUserTasksByClickOnModelIdInProcessRunningList(correlationId);

    const userTasksUrl: string = processModel.userTasksUrl(processModelId);
    const currentBrowserUrl: string = await browser.getCurrentUrl();

    expect(currentBrowserUrl).toContain(userTasksUrl);
  });

  it('should contain task list.', async() => {
    const taskListContainer: ElementFinder = dashboard.taskListContainer;
    const taskListContainerIsDisplayed: boolean = await taskListContainer.isDisplayed();

    expect(taskListContainerIsDisplayed).toBeTruthy();
  });

  // task list section

  it('should contain at least task definition in tasks waiting section.', async() => {
    const firstTaskListItems: ElementFinder = dashboard.firstTaskListItems;
    const visibilityOfFirstTaskListItems: Function = expectedConditions.visibilityOf(firstTaskListItems);

    browser.driver
      .wait(() => {
        browser
          .wait(visibilityOfFirstTaskListItems, taskListTimeoutMS);
        return firstTaskListItems;
      });

    const countOfTasksWaitingListItems: number = await dashboard.countOfTasksWaitingListItems();

    expect(countOfTasksWaitingListItems).toBeGreaterThanOrEqual(1);
  });

  it('should contain recently started task in tasks waiting section.', async() => {
    const firstTaskWaitingById: ElementFinder = dashboard.firstTaskWaitingById(processModelId);
    const visibilityOfFirstTaskWaitingById: Function = expectedConditions.visibilityOf(firstTaskWaitingById);

    browser.driver
      .wait(() => {
        browser
          .wait(visibilityOfFirstTaskWaitingById, taskListTimeoutMS);

        return firstTaskWaitingById;
      });

    const countOfTasksWaitingListItemsById: number = await dashboard.countOfTasksWaitingListItemsById(processModelId);

    expect(countOfTasksWaitingListItemsById).toBe(1);
  });

  it('should be possbible to click continue in task waiting section.', async() => {
    const firstTaskWaitingById: ElementFinder = dashboard.firstTaskWaitingById(processModelId);
    const visibilityOfFirstTaskWaitingById: Function = expectedConditions.visibilityOf(firstTaskWaitingById);

    browser.driver
      .wait(() => {
        browser
          .wait(visibilityOfFirstTaskWaitingById, taskListTimeoutMS);

        return firstTaskWaitingById;
      });

    await dashboard.continueTaskByClickOnButton(processModelId);

    const userTasksInputUrl: string = processModel.userTasksInputUrl(processModelId);
    const currentBrowserUrl: string = await browser.getCurrentUrl();

    expect(currentBrowserUrl).toContain(userTasksInputUrl);
  });

  it('should be possbible to click continue in an opened user task.', () => {
    const firstTaskWaitingById: ElementFinder = dashboard.firstTaskWaitingById(processModelId);
    const visibilityOfFirstTaskWaitingById: Function = expectedConditions.visibilityOf(firstTaskWaitingById);

    browser.driver
      .wait(() => {
        browser
          .wait(visibilityOfFirstTaskWaitingById, taskListTimeoutMS);

        return firstTaskWaitingById;
      });

    dashboard.continueTaskByClickOnButton(processModelId);

    const dynamicUiWrapperContinueButton: ElementFinder = dashboard.dynamicUiWrapperContinueButton;
    const visibilityOfDynamicUiWrapperContinueButton: Function = expectedConditions.visibilityOf(dynamicUiWrapperContinueButton);

    // Wait until view is loaded and button is visible
    browser.driver
      .wait(() => {
        browser
          .wait(visibilityOfDynamicUiWrapperContinueButton, taskListTimeoutMS);

        return dynamicUiWrapperContinueButton;
      });
  });

  it('should be in waiting room when click continue in an opened user task.', async() => {
    const firstTaskWaitingById: ElementFinder = dashboard.firstTaskWaitingById(processModelId);
    const visibilityOfFirstTaskWaitingById: Function = expectedConditions.visibilityOf(firstTaskWaitingById);

    browser.driver
      .wait(() => {
        browser
          .wait(visibilityOfFirstTaskWaitingById, taskListTimeoutMS);

        return firstTaskWaitingById;
      });

    dashboard.continueTaskByClickOnButton(processModelId);

    const dynamicUiWrapperContinueButton: ElementFinder = dashboard.dynamicUiWrapperContinueButton;
    const visibilityOfDynamicUiWrapperContinueButton: Function = expectedConditions.visibilityOf(dynamicUiWrapperContinueButton);

    // Wait until view is loaded and button is visible
    browser.driver
      .wait(() => {
        browser
          .wait(visibilityOfDynamicUiWrapperContinueButton, taskListTimeoutMS);

        return dynamicUiWrapperContinueButton;
      });

    await dashboard.continueUserTaskByClickOnDynamicUiWrapperContinuButton();

    const correlationId: string = processModel.getCorrelationId();
    const waitingRoomUrl: string = processModel.waitingroomUrl(processModelId, correlationId);
    const currentBrowserUrl: string = await browser.getCurrentUrl();

    // Should be in waiting room
    expect(currentBrowserUrl).toContain(waitingRoomUrl);

    const dashboardLink: string = dashboard.dashboardLink;
    const urlContainsDashboardLink: Function = expectedConditions.urlContains(dashboardLink);

    // Should be in dashboard view
    browser.driver
    .wait(() => {
      browser
      .wait(urlContainsDashboardLink, taskListTimeoutMS);

      return dashboardLink;
    });
  });
});
