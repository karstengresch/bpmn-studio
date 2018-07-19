import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
import {Redirect, Router} from 'aurelia-router';
import {ValidateEvent, ValidationController} from 'aurelia-validation';

import {IProcessDefEntity} from '@process-engine/process_engine_contracts';

import {
  AuthenticationStateEvent,
  IErrorResponse,
  IExtensionElement,
  IFormElement,
  IModdleElement,
  IProcessEngineService,
  IResponse,
  IShape,
  NotificationType,
} from '../../contracts/index';
import environment from '../../environment';
import {BpmnIo} from '../bpmn-io/bpmn-io';
import {NotificationService} from '../notification/notification.service';

interface RouteParameters {
  processDefId: string;
}

@inject('ProcessEngineService', EventAggregator, Router, ValidationController, 'NotificationService')
export class ProcessDefDetail {

  public bpmnio: BpmnIo;
  public process: IProcessDefEntity;

  private _processEngineService: IProcessEngineService;
  private _notificationService: NotificationService;
  private _eventAggregator: EventAggregator;
  private _subscriptions: Array<Subscription>;
  private _processId: string;
  private _router: Router;
  private _diagramHasChanged: boolean = false;
  private _validationController: ValidationController;
  // TODO: Explain when this is set and by whom.
  private _diagramIsInvalid: boolean = false;
  // Used to control the modal view; shows the modal view for pressing the play button.
  private _startButtonPressed: boolean = false;

  constructor(processEngineService: IProcessEngineService,
              eventAggregator: EventAggregator,
              router: Router,
              validationController: ValidationController,
              notificationService: NotificationService) {

    this._processEngineService = processEngineService;
    this._eventAggregator = eventAggregator;
    this._router = router;
    this._validationController = validationController;
    this._notificationService = notificationService;
  }

  public async activate(routeParameters: RouteParameters): Promise<void> {
    this._processId = routeParameters.processDefId;
    this._diagramHasChanged = false;
    await this._refreshProcess();
  }

  public attached(): void {
    this._subscriptions = [
      //  Aurelia Event Subscriptions {{{ //
      // Aurelia will expose the ValidateEvent, we use this to check the BPMN in the modeler.
      this._validationController.subscribe((event: ValidateEvent) => {
        this._handleFormValidateEvents(event);
      }),
      //  }}} Aurelia Event Subscriptions //

      this._eventAggregator.subscribe(AuthenticationStateEvent.LOGIN, () => {
        this._refreshProcess();
      }),
      this._eventAggregator.subscribe(AuthenticationStateEvent.LOGOUT, () => {
        this._refreshProcess();
      }),

      //  Button Subscriptions {{{ //
      this._eventAggregator.subscribe(environment.events.processDefDetail.saveDiagram, () => {
        this._saveDiagram()
          .catch((error: Error) => {
            this
              ._notificationService
              .showNotification(
                NotificationType.ERROR,
                `Error while saving the diagram: ${error.message}`,
              );
          });
      }),

      //  Start Button Subscription {{{ //
      this._eventAggregator.subscribe(environment.events.processDefDetail.startProcess, () => {
        this._startProcess();
      }),
      //  }}} Start Button Subscription //
      //  }}} Button Subscriptions //

      //  General Event Subscritions {{{ //
      this._eventAggregator.subscribe(environment.events.diagramChange, () => {
        this._diagramHasChanged = true;
      }),
      //  }}} General Event Subscritions //
    ];

    this._eventAggregator.publish(environment.events.navBar.showTools, this.process);
    this._eventAggregator.publish(environment.events.navBar.showStartButton);
    this._eventAggregator.publish(environment.events.statusBar.showDiagramViewButtons);

    window.onbeforeunload = (): void => {
      return;
   };
  }

  public determineActivationStrategy(): string {
    return 'replace';
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

        const modal: HTMLElement = this._startButtonPressed
          ? document.getElementById('saveModalProcessStart')
          : document.getElementById('saveModalLeaveView');

        modal.classList.add('show-modal');

        //  register onClick handler {{{ //
        /* Do not save and leave */
        const dontSaveButtonId: string = 'dontSaveButtonLeaveView';
        document
          .getElementById(dontSaveButtonId)
          .addEventListener('click', () => {

            modal.classList.remove('show-modal');

            this._diagramHasChanged = false;

            resolve(true);
          });

        /* Save and leave */
        const saveButtonId: string = this._startButtonPressed
          ? 'saveButtonProcessStart'
          : 'saveButtonLeaveView';

        document
          .getElementById(saveButtonId)
          .addEventListener('click', () => {

            this
              ._saveDiagram()
              .catch((error: Error) => {
                this._notificationService.showNotification(NotificationType.ERROR, `Unable to save the diagram: ${error.message}`);
              });

            modal.classList.remove('show-modal');

            this._diagramHasChanged = false;
            this._startButtonPressed = false;

            resolve(true);
          });

        /* Stay, do not save */
        const cancelButtonId: string = this._startButtonPressed
          ? 'cancelButtonProcessStart'
          : 'cancelButtonLeaveView';

        document
          .getElementById(cancelButtonId)
          .addEventListener('click', () => {
            modal.classList.remove('show-modal');

            this._startButtonPressed = false;

            resolve(false);
          });
        }
        //  }}} register onClick handler //
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
    this._eventAggregator.publish(environment.events.navBar.hideStartButton);
    this._eventAggregator.publish(environment.events.statusBar.hideDiagramViewButtons);
  }

  private _refreshProcess(): Promise<IProcessDefEntity> {
    return this
      ._processEngineService
      .getProcessDefById(this._processId)
      .then((result: IProcessDefEntity & IErrorResponse) => {
        // TODO: Extract Business Rule
        if (result && !result.error) {
          this.process = result;

          this
            ._eventAggregator
            .publish(environment.events.navBar.updateProcess, this.process);

          return this.process;

        } else {
          this.process = null;
          return result.error;
        }
    });
  }

  /**
   * This sets the _startButtonPressed flag to control the modal view of the save dialog.
   *
   * If the process is not valid, it will not start it.
   */
  private _startProcess(): void {
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

    this._startButtonPressed = true;

    this._router.navigate(`processdef/${this.process.id}/start`);
  }

  /**
   * Currently unused Method.
   *
   * TODO: Look deeper into this if we need this method anymore and/or in this
   * particular way.
   *
   * TODO: Use this again.
   */
  private _deleteProcess(): void {
    const userIsSureOfDeletion: boolean = confirm('Are you sure you want to delete the process definition?');

    if (userIsSureOfDeletion) {
      this
        ._processEngineService
        .deleteProcessDef(this.process.id)
        .then(() => {
          this.process = null;
          this._router.navigate('');
        })
        .catch((error: Error) => {
          this._notificationService.showNotification(NotificationType.ERROR, error.message);
        });
    }
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

    //  Save the diagram to the ProcessEngine {{{ //
    // TODO: Explain what this is doing -> Refactor.
    let response: IResponse;

    try {
      const xml: string = await this.bpmnio.getXML();
      response = await this._processEngineService.updateProcessDef(this.process, xml);
    } catch (error) {
      this._notificationService.showNotification(NotificationType.ERROR, `An error occured: ${error.message}`);
    }
    //  }}} Save the diagram to the ProcessEngine //

    // Treat possible errors {{{ //
    if (response.error) {
      this
        ._notificationService
        .showNotification(NotificationType.ERROR, `Unable to save the file: ${response.error}`);

    } else if (response.result) {
      this
        ._notificationService
        .showNotification(NotificationType.SUCCESS, 'File saved.');

    } else {
      // TODO: Not gonna buy this. Is this needed at all?
      this
        ._notificationService
        .showNotification(
          NotificationType.WARNING,
          `Something is very wrong: ${JSON.stringify(response)}. Please contact the BPMN-Studio team, they can help.`,
        );
    }
    //  }}}  Treat possible errors //

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
    const registry: Array<IShape> = this.bpmnio.modeler.get('elementRegistry');

    registry.forEach((element: IShape) => {
      if (element.type === 'bpmn:UserTask') {
        const businessObj: IModdleElement = element.businessObject;

        if (businessObj.extensionElements) {
          const extensions: IExtensionElement = businessObj.extensionElements;

          extensions.values = extensions.values.filter((value: IFormElement) => {
            const keepThisValue: boolean = value.$type !== 'camunda:FormData' || value.fields.length > 0;
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
