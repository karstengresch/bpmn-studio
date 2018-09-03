import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
import {activationStrategy, Redirect, Router} from 'aurelia-router';
import {ValidateEvent, ValidationController} from 'aurelia-validation';

import {
  Event,
  EventList,
  IManagementApiService,
  ManagementContext,
  ProcessModelExecution,
} from '@process-engine/management_api_contracts';

import {
  AuthenticationStateEvent,
  IAuthenticationService,
  IElementRegistry,
  IExtensionElement,
  IFormElement,
  IModdleElement,
  IShape,
  NotificationType,
} from '../../contracts/index';
import environment from '../../environment';
import {BpmnIo} from '../bpmn-io/bpmn-io';
import {NotificationService} from '../notification/notification.service';

interface RouteParameters {
  processModelId: string;
}

@inject(
  EventAggregator,
  Router,
  ValidationController,
  'NotificationService',
  'AuthenticationService',
  'ManagementApiClientService')
export class ProcessDefDetail {

  public bpmnio: BpmnIo;
  public process: ProcessModelExecution.ProcessModel;
  public showStartEventModal: boolean = false;
  public showSaveForStartModal: boolean = false;
  public showSaveOnLeaveModal: boolean = false;
  public saveForStartModal: HTMLElement;

  public processesStartEvents: Array<Event> = [];
  public selectedStartEventId: string;
  // TODO: Explain what dropdown this is and find a better name.
  public dropdownMenu: HTMLSelectElement;

  private _notificationService: NotificationService;
  private _eventAggregator: EventAggregator;
  private _subscriptions: Array<Subscription>;
  private _processModelId: string;
  private _router: Router;
  private _diagramHasChanged: boolean = false;
  private _validationController: ValidationController;
  // TODO: Explain when this is set and by whom.
  private _diagramIsInvalid: boolean = false;
  // Used to control the modal view; shows the modal view for pressing the play button.
  private _startButtonPressed: boolean = false;
  private _authenticationService: IAuthenticationService;
  private _managementApiClient: IManagementApiService;

  constructor(eventAggregator: EventAggregator,
              router: Router,
              validationController: ValidationController,
              notificationService: NotificationService,
              authenticationService: IAuthenticationService,
              managementApiClient: IManagementApiService) {

    this._eventAggregator = eventAggregator;
    this._router = router;
    this._validationController = validationController;
    this._notificationService = notificationService;
    this._authenticationService = authenticationService;
    this._managementApiClient = managementApiClient;
  }

  public async activate(routeParameters: RouteParameters): Promise<void> {
    this._processModelId = routeParameters.processModelId;
    this._diagramHasChanged = false;
    await this._refreshProcess();
  }

  public attached(): void {
    this._subscriptions = [
      //#region Aurelia Event Subscriptions
      // Aurelia will expose the ValidateEvent, we use this to check the BPMN in the modeler.
      this._validationController.subscribe((event: ValidateEvent) => {
        this._handleFormValidateEvents(event);
      }),

      this._eventAggregator.subscribe(AuthenticationStateEvent.LOGIN, () => {
        this._refreshProcess();
      }),
      this._eventAggregator.subscribe(AuthenticationStateEvent.LOGOUT, () => {
        this._refreshProcess();
      }),
      //#endregion

      //#region Button Subscriptions

      //#region Save Button Subscription
      this._eventAggregator.subscribe(environment.events.processDefDetail.saveDiagram, () => {
        this._saveDiagram()
          .catch((error: Error) => {
            this
              ._notificationService
              .showNotification(NotificationType.ERROR, `Error while saving the diagram: ${error.message}`);
          });
      }),
      //#endregion

      //#region Start Button Subscription
      this._eventAggregator.subscribe(environment.events.processDefDetail.startProcess, () => {
        this._showStartDialog();
      }),
      //#endregion

      //#endregion

      //#region Differs from Original Subscription
      this._eventAggregator.subscribe(environment.events.differsFromOriginal, (savingNeeded: boolean) => {
        this._diagramHasChanged = savingNeeded;
      }),
      //#endregion

    ];

    this._eventAggregator.publish(environment.events.navBar.showTools, this.process);
    this._eventAggregator.publish(environment.events.navBar.enableStartButton);
    this._eventAggregator.publish(environment.events.navBar.disableDiagramUploadButton);
    this._eventAggregator.publish(environment.events.navBar.showProcessName, this.process);
    this._eventAggregator.publish(environment.events.statusBar.showDiagramViewButtons);
    this._eventAggregator.publish(environment.events.navBar.inspectNavigateToHeatmap);
    this._eventAggregator.publish(environment.events.navBar.enableDesignLink);
  }

  public determineActivationStrategy(): string {
    return activationStrategy.replace;
  }

  /**
   * We implement canDeactivate() for the Aurelia Router, because we want to
   * prevent the user from leaving the editor, if there are changes, that need
   * to be saved.
   *
   * Basically, the Router will look for an implementation and execute this
   * method. The Aurelia Router is not working properly at this moment, so we use a workaround to achieve this:
   *
   * We return a Promise with a redirection to the previous view!
   * This will preserve the state and works as expected.
   *
   */
  public async canDeactivate(): Promise<Redirect> {

    const _modal: Promise<boolean> = new Promise((resolve: Function, reject: Function): void => {

      if (!this._diagramHasChanged) {
        resolve(true);
      } else {
        this.showSaveOnLeaveModal = true;

        //#region register onClick handler
        /* Do not save and leave */
        const dontSaveButtonId: string = 'dontSaveButtonLeaveView';
        document
          .getElementById(dontSaveButtonId)
          .addEventListener('click', () => {
            this.showSaveOnLeaveModal = false;
            this._diagramHasChanged = false;
            resolve(true);
          });

        /* Save and leave */
        const saveButtonId: string = 'saveButtonLeaveView';

        document
          .getElementById(saveButtonId)
          .addEventListener('click', () => {

            this
              ._saveDiagram()
              .catch((error: Error) => {
                this._notificationService.showNotification(NotificationType.ERROR, `Unable to save the diagram: ${error.message}`);
              });

            this.showSaveOnLeaveModal = false;
            this._diagramHasChanged = false;
            this._startButtonPressed = false;

            resolve(true);
          });

        /* Stay, do not save */
        const cancelButtonId: string = 'cancelButtonLeaveView';

        document
          .getElementById(cancelButtonId)
          .addEventListener('click', () => {
            this.showSaveOnLeaveModal = false;
            this._startButtonPressed = false;

            resolve(false);
          });
        }
        //#endregion
    });

    const result: boolean = await _modal;

    // TODO: Extract Business Rule
    if (result === false) {
      /*
       * As suggested in https://github.com/aurelia/router/issues/302, we use
       * the router directly to navigate back, which results in staying on this
       * component-- and this is the desired behaviour.
       */
      return new Redirect(this._router.currentInstruction.fragment, {trigger: false, replace: false});
    }
  }

  public detached(): void {
    for (const subscription of this._subscriptions) {
      subscription.dispose();
    }

    this._eventAggregator.publish(environment.events.navBar.hideTools);
    this._eventAggregator.publish(environment.events.navBar.disableStartButton);
    this._eventAggregator.publish(environment.events.navBar.enableDiagramUploadButton);
    this._eventAggregator.publish(environment.events.statusBar.hideDiagramViewButtons);
    this._eventAggregator.publish(environment.events.navBar.hideProcessName);
    this._eventAggregator.publish(environment.events.navBar.inspectNavigateToDashboard);
  }

  public async startProcess(): Promise<void> {

    if (this.selectedStartEventId === null) {
      return;
    }

    this._dropInvalidFormData();

    if (this._diagramIsInvalid) {
      this
        ._notificationService
        .showNotification(
          NotificationType.WARNING,
          'Unable to start the process, because it is not valid. This could have something to do with your latest changes. Try to undo them.',
        );
      return;
    }

    const context: ManagementContext = this._getManagementContext();
    const startRequestPayload: ProcessModelExecution.ProcessStartRequestPayload = {
      inputValues: {},
    };

    try {
      const response: ProcessModelExecution.ProcessStartResponsePayload = await this._managementApiClient
        .startProcessInstance(context, this.process.id, this.selectedStartEventId, startRequestPayload, undefined, undefined);

      const correlationId: string = response.correlationId;

      this._router.navigateToRoute('waiting-room', {
        correlationId: correlationId,
        processModelId: this.process.id,
      });
    } catch (error) {
      this.
        _notificationService
        .showNotification(
          NotificationType.ERROR,
          error.message,
        );
    }
  }

  public cancelDialog(): void {
    this.showStartEventModal = false;
    this.showSaveForStartModal = false;
  }

  public async saveChangesBeforeStart(): Promise<void> {
    this._saveDiagram();
    await this.showSelectStartEventDialog();
  }

  /**
   * Opens a modal dialog to ask the user, which StartEvent he want's to
   * use to start the process.
   *
   * If there is only one StartEvent this method will select this StartEvent by
   * default.
   */
  public async showSelectStartEventDialog(): Promise<void> {
    await this._updateProcessStartEvents();

    if (this.processesStartEvents.length === 1) {
      this.selectedStartEventId = this.processesStartEvents[0].id;
      this.startProcess();

      return;
    }

    this.showStartEventModal = true;
    this.showSaveForStartModal = false;

  }

  /**
   * Opens a modal, if the diagram has unsaved changes and ask the user,
   * if he wants to save his changes. This is necessary to
   * execute the Process.
   *
   * If there are no unsaved changes, no modal will be displayed.
   */
  private async _showStartDialog(): Promise<void> {
    if (this._diagramHasChanged) {
      this.showSaveForStartModal = true;
    } else {
      await this.showSelectStartEventDialog();
    }
  }

  private async _refreshProcess(): Promise<ProcessModelExecution.ProcessModel> {
    const context: ManagementContext = this._getManagementContext();

    const updatedProcessModel: ProcessModelExecution.ProcessModel = await this._managementApiClient.getProcessModelById(context,
                                                                                                                        this._processModelId);

    this.process = updatedProcessModel;
    this
      ._eventAggregator
      .publish(environment.events.navBar.updateProcess, this.process);

    return updatedProcessModel;
  }

  private _getManagementContext(): ManagementContext {
    const accessToken: string = this._authenticationService.getAccessToken();
    const context: ManagementContext = {
      identity: accessToken,
    };

    return context;
  }

  private async _updateProcessStartEvents(): Promise<void> {
    const context: ManagementContext = this._getManagementContext();
    const startEventResponse: EventList = await this._managementApiClient.getEventsForProcessModel(context, this.process.id);

    this.processesStartEvents = startEventResponse.events;
  }

  /**
   * This method will save the diagram by using the ProcessEngineService.
   *
   * The user will be notified, about the outcome of the operation. Errors will be
   * reported reasonably and a success message will be emitted.
   *
   * Saving is not possible, if _diagramIsInvalid has been set to true.
   *
   * The source of the XML is the bmpn.io-modeler. It is used to extract the BPMN
   * while saving; a validation is not executed here.
   */
  private async _saveDiagram(): Promise<void> {

    this._dropInvalidFormData();

    if (this._diagramIsInvalid) {
      this
        ._notificationService
        .showNotification(
          NotificationType.WARNING,
          'Unable to save the diagram, because it is not valid. This could have something to do with your latest changes. Try to undo them.',
        );
      return;
    }

    //#region Save the diagram to the ProcessEngine

    try {
      const xml: string = await this.bpmnio.getXML();

      const context: ManagementContext = this._getManagementContext();

      const payload: ProcessModelExecution.UpdateProcessDefinitionsRequestPayload = {
        xml: xml,
      };

      await this._managementApiClient.updateProcessDefinitionsByName(context, this.process.id, payload);
      this._notificationService.showNotification(NotificationType.SUCCESS, 'File saved.');
    } catch (error) {
      this._notificationService.showNotification(NotificationType.ERROR, `Error while saving diagram: ${error.message}`);
    }
    //#endregion

    this._diagramHasChanged = false;
  }

  /**
   * In the current implementation this method only checks for UserTasks that have
   * empty or otherwise not allowed FormData in them.
   *
   * If that is the case the method will continue by deleting unused/not allowed
   * FormData to make sure the diagrams XML is further supported by Camunda.
   *
   * TODO: Look further into this if this method is not better placed at the FormsSection
   * in the Property Panel, also split this into two methods and name them right.
   */
  private _dropInvalidFormData(): void {
    const registry: IElementRegistry = this.bpmnio.modeler.get('elementRegistry');

    registry.forEach((element: IShape) => {
      if (element.type === 'bpmn:UserTask') {
        const businessObj: IModdleElement = element.businessObject;

        if (businessObj.extensionElements) {
          const extensions: IExtensionElement = businessObj.extensionElements;

          extensions.values = extensions.values.filter((value: IFormElement) => {
            const typeIsNotCamundaFormData: boolean = value.$type !== 'camunda:FormData';
            const elementContainsFields: boolean = (value.fields !== undefined) && (value.fields.length > 0);

            const keepThisValue: boolean = typeIsNotCamundaFormData || elementContainsFields;
            return keepThisValue;
          });

          if (extensions.values.length === 0) {
            delete businessObj.extensionElements;
          }
        }
      }
    });
  }

  /**
   * This handler will set the diagram state to invalid, if the ValidateEvent arrives.
   * Currently only form fields in the Property Panel are validated. This will cause
   * the following behaviour:
   *
   * The user inserts an invalid string (e.g. he uses a already used Id for an element);
   * The Aurelia validators will trigger; the validation event will arrive here;
   * if there are errors present, we will disable the save button and the save functionality
   * by setting the _diagramIsInvalid flag to true.
   *
   * Events fired here:
   *
   * 1. disableSaveButton
   * 2. enableSaveButton
   */
  private _handleFormValidateEvents(event: ValidateEvent): void {
    const eventIsValidateEvent: boolean = event.type !== 'validate';

    if (eventIsValidateEvent) {
      return;
    }

    for (const result of event.results) {
      const resultIsNotValid: boolean = result.valid === false;

      if (resultIsNotValid) {
        this._diagramIsInvalid = true;
        this._eventAggregator
          .publish(environment.events.navBar.disableSaveButton);

        return;
      }
    }

    this._eventAggregator
      .publish(environment.events.navBar.enableSaveButton);

    this._diagramIsInvalid = false;
  }
}
