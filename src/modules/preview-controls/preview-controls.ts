import {BpmnStudioClient} from '@process-engine/bpmn-studio_client';
import {IProcessDefEntity} from '@process-engine/process_engine_contracts';
import {bindingMode} from 'aurelia-binding';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {bindable, computedFrom, inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {ValidateEvent, ValidationController} from 'aurelia-validation';
import * as canvg from 'canvg-browser';
import * as download from 'downloadjs';
import * as beautify from 'xml-beautifier';
import {
  AuthenticationStateEvent,
  ElementDistributeOptions,
  IExtensionElement,
  IFormElement,
  IModdleElement,
  IProcessEngineService,
  IShape,
  NotificationType,
} from '../../contracts/index';
import environment from '../../environment';
import {BpmnIo} from '../bpmn-io/bpmn-io';
import {NotificationService} from './../notification/notification.service';

interface RouteParameters {
  processDefId: string;
}

@inject('ProcessEngineService', EventAggregator, 'BpmnStudioClient', Router, ValidationController, 'NotificationService')
export class PreviewControls {

  private processEngineService: IProcessEngineService;
  private notificationService: NotificationService;
  private eventAggregator: EventAggregator;
  private subscriptions: Array<Subscription>;
  private processId: string;
  private _process: IProcessDefEntity;
  private bpmn: BpmnIo;
  private startButtonDropdown: HTMLDivElement;
  private startButton: HTMLButtonElement;
  private saveButton: HTMLButtonElement;
  private bpmnStudioClient: BpmnStudioClient;
  private router: Router;

  public validationController: ValidationController;
  public validationError: boolean;
  public solutionExplorerIsShown: boolean = false;
  public xmlIsShown: boolean = false;

  @bindable() public uri: string;
  @bindable() public name: string;
  @bindable() public startedProcessId: string;
  @bindable({ defaultBindingMode: bindingMode.oneWay }) public initialLoadingFinished: boolean = false;

  constructor(processEngineService: IProcessEngineService,
              eventAggregator: EventAggregator,
              bpmnStudioClient: BpmnStudioClient,
              router: Router,
              validationController: ValidationController,
              notificationService: NotificationService) {
    this.processEngineService = processEngineService;
    this.eventAggregator = eventAggregator;
    this.bpmnStudioClient = bpmnStudioClient;
    this.router = router;
    this.validationController = validationController;
    this.notificationService = notificationService;
  }

}
