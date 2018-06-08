import {BpmnStudioClient} from '@process-engine/bpmn-studio_client';
import {IProcessDefEntity} from '@process-engine/process_engine_contracts';
import {bindingMode} from 'aurelia-binding';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {bindable, computedFrom, inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {ValidateEvent, ValidationController} from 'aurelia-validation';
import * as canvg from 'canvg-browser';
import * as download from 'downloadjs';
import * as heatmap from 'heatmap.js';
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
export class ProcessDefDetail {

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

  private _heatmap: any;

  public validationController: ValidationController;
  public validationError: boolean;
  public solutionExplorerIsShown: boolean = false;
  public xmlIsShown: boolean = false;

  @bindable() public uri: string;
  @bindable() public name: string;
  @bindable() public startedProcessId: string;
  @bindable({ defaultBindingMode: bindingMode.oneWay }) public initialLoadingFinished: boolean = false;
  public detailView: HTMLElement;

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

  public async activate(routeParameters: RouteParameters): Promise<void> {
    this.processId = routeParameters.processDefId;
    await this.refreshProcess();
  }

  public attached(): void {
    this.validationController.subscribe((event: ValidateEvent) => {
      this.validateForm(event);
    });

    this.subscriptions = [
      this.eventAggregator.subscribe(AuthenticationStateEvent.LOGIN, () => {
        this.refreshProcess();
      }),
      this.eventAggregator.subscribe(AuthenticationStateEvent.LOGOUT, () => {
        this.refreshProcess();
      }),
      this.eventAggregator.subscribe(environment.events.processDefDetail.saveDiagram, () => {
        this.saveDiagram();
      }),
      this.eventAggregator.subscribe(`${environment.events.processDefDetail.exportDiagramAs}:BPMN`, () => {
        this.exportBPMN();
      }),
      this.eventAggregator.subscribe(`${environment.events.processDefDetail.exportDiagramAs}:SVG`, () => {
        this.exportSVG();
      }),
      this.eventAggregator.subscribe(`${environment.events.processDefDetail.exportDiagramAs}:PNG`, () => {
        this.exportPNG();
      }),
      this.eventAggregator.subscribe(`${environment.events.processDefDetail.exportDiagramAs}:JPEG`, () => {
        this.exportJPEG();
      }),
      this.eventAggregator.subscribe(environment.events.processDefDetail.startProcess, () => {
        this.startProcess();
      }),
      this.eventAggregator.subscribe(environment.events.processDefDetail.toggleXMLView, () => {
        this.toggleXMLView();
      }),
    ];

    this.eventAggregator.publish(environment.events.navBar.showTools, this.process);
    this.eventAggregator.publish(environment.events.statusBar.showXMLButton);

    this._heatmap = heatmap.create({
      container: this.detailView,
    });
  }

  public detached(): void {
    for (const subscription of this.subscriptions) {
      subscription.dispose();
    }

    this.eventAggregator.publish(environment.events.navBar.hideTools);
    this.eventAggregator.publish(environment.events.statusBar.hideXMLButton);
  }

  private refreshProcess(): Promise<IProcessDefEntity> {
    return this.processEngineService.getProcessDefById(this.processId)
      .then((result: any) => {
        if (result && !result.error) {
          this._process = result;

          this.eventAggregator.publish(environment.events.navBar.updateProcess, this._process);

          return this._process;
        } else {
          this._process = null;
          return result.error;
        }
    });
  }

  public startProcess(): void {
    this.validateXML();
    this.router.navigate(`processdef/${this.process.id}/start`);
  }

  public closeProcessStartDropdown(): void {
    this.startButton.removeAttribute('disabled');
  }

  public deleteProcess(): void {
    const deleteForReal: boolean = confirm('Are you sure you want to delete the process definition?');
    if (!deleteForReal) {
      return;
    }
    this.processEngineService.deleteProcessDef(this.process.id)
      .then(() => {
        this._process = null;
        this.router.navigate('');
      })
      .catch((error: Error) => {
        this.notificationService.showNotification(NotificationType.ERROR, error.message);
      });
  }

  @computedFrom('_process')
  public get process(): IProcessDefEntity {
    return this._process;
  }

  public onModdlelImported(moddle: any, xml: string): void {
    this.bpmn.xml = xml;
  }

  public async saveDiagram(): Promise<void> {

    this.validateXML();

    try {
      const xml: string = await this.bpmn.getXML();
      const response: any = await this.processEngineService.updateProcessDef(this.process, xml);

      if (response.error) {
        this.notificationService.showNotification(NotificationType.ERROR, `Error while saving file: ${response.error}`);
      } else if (response.result) {
        this.notificationService.showNotification(NotificationType.SUCCESS, 'File saved.');
      } else {
        this.notificationService.showNotification(NotificationType.WARNING, `Unknown error: ${JSON.stringify(response)}`);
      }
    } catch (error) {
      this.notificationService.showNotification(NotificationType.ERROR, `Error: ${error.message}`);
    }
  }

  private validateXML(): void {
    const registry: Array<IShape> = this.bpmn.modeler.get('elementRegistry');

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

  public async exportBPMN(): Promise<void> {
    const xml: string = await this.bpmn.getXML();
    const formattedXml: string = beautify(xml);
    download(formattedXml, `${this.process.name}.bpmn`, 'application/bpmn20-xml');
  }

  public async exportSVG(): Promise<void> {
    const svg: string = await this.bpmn.getSVG();
    download(svg, `${this.process.name}.svg`, 'image/svg+xml');
  }

  public async exportPNG(): Promise<void> {
    const svg: string = await this.bpmn.getSVG();
    download(this.generateImageFromSVG('png', svg), `${this.process.name}.png`, 'image/png');
  }

  public async exportJPEG(): Promise<void> {
    const svg: string = await this.bpmn.getSVG();
    download(this.generateImageFromSVG('jpeg', svg), `${this.process.name}.jpeg`, 'image/jpeg');
  }

  public generateImageFromSVG(desiredImageType: string, svg: any): string {
    const encoding: string = `image/${desiredImageType}`;
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    const context: CanvasRenderingContext2D = canvas.getContext('2d');

    canvg(canvas, svg);
    // make the background white for every format
    context.globalCompositeOperation = 'destination-over';
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);

    const image: string = canvas.toDataURL(encoding); // returns a base64 datastring
    return image;
  }

  public toggleXMLView(): void {
    if (this.xmlIsShown) {
      this.xmlIsShown = false;
    } else {
      this.xmlIsShown = true;
    }

    this.bpmn.toggleXMLView();
  }

  public toggleSolutionExplorer(): void {
    this.solutionExplorerIsShown = !this.solutionExplorerIsShown;
  }

  private validateForm(event: ValidateEvent): void {
    if (event.type !== 'validate') {
      return;
    }

    this.eventAggregator.publish(environment.events.navBar.enableSaveButton);

    for (const result of event.results) {
      if (result.valid === false) {
        this.eventAggregator.publish(environment.events.navBar.disableSaveButton);
        return;
      }
    }
  }

}
