import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
import {ValidateEvent, ValidationController, ValidationRules} from 'aurelia-validation';
import {
  IBpmnModeler,
  IElementRegistry,
  IModdleElement,
  IPageModel,
  IPoolElement,
  ISection,
  IShape,
} from '../../../../../../contracts';
import environment from '../../../../../../environment';

@inject(ValidationController, EventAggregator)
export class PoolSection implements ISection {

  public path: string = '/sections/pool/pool';
  public canHandleElement: boolean = false;
  public validationController: ValidationController;
  public validationError: boolean = false;
  public businessObjInPanel: IPoolElement;

  private _modeler: IBpmnModeler;
  private _previousProcessRefId: string;
  private _eventAggregator: EventAggregator;

  constructor(controller?: ValidationController, eventAggregator?: EventAggregator) {
    this.validationController = controller;
    this._eventAggregator = eventAggregator;
  }

  public activate(model: IPageModel): void {
    if (this.validationError) {
      this.businessObjInPanel.processRef.id = this._previousProcessRefId;
      this.validationController.validate();
    }

    this.businessObjInPanel = model.elementInPanel.businessObject;
    this._previousProcessRefId = this.businessObjInPanel.processRef.id;

    this._modeler = model.modeler;

    this.validationController.subscribe((event: ValidateEvent) => {
      this._validateId(event);
    });

    this._setValidationRules();
  }

  public detached(): void {
    if (this.validationError) {
      this.businessObjInPanel.processRef.id = this._previousProcessRefId;
      this.validationController.validate();
    }
  }

  public isSuitableForElement(element: IShape): boolean {
    return this._elementIsParticipant(element);
  }

  public validate(): void {
    this.validationController.validate();
  }

  public updateVersion(): void {
    this._publishDiagramChange();
  }

  public updateName(): void {
    this._publishDiagramChange();
  }

  private _elementIsParticipant(element: IShape): boolean {
    return element !== undefined
        && element.businessObject !== undefined
        && element.businessObject.$type === 'bpmn:Participant';
  }

  private _validateId(event: ValidateEvent): void {
    if (event.type !== 'validate') {
      return;
    }
    this.validationError = false;

    for (const result of event.results) {
      if (result.rule.property.displayName !== 'processId') {
        continue;
      }
      if (result.valid === false) {
        this.validationError = true;
        document.getElementById(result.rule.property.displayName).style.border = '2px solid red';
      } else {
        document.getElementById(result.rule.property.displayName).style.border = '';
      }
    }
  }

  private _formIdIsUnique(id: string): boolean {
    const elementRegistry: IElementRegistry = this._modeler.get('elementRegistry');
    const elementsWithSameId: Array<IShape> =  elementRegistry.filter((element: IShape) => {
        return element.businessObject.id === this.businessObjInPanel.processRef.id;
    });

    return elementsWithSameId.length === 0;
  }

  private _isProcessIdUnique(id: string): boolean {
    const elementIds: Array<string> = this._modeler._definitions.rootElements.map((rootElement: IModdleElement) => {
      return rootElement.id;
    });

    const currentId: number = elementIds.indexOf(this.businessObjInPanel.processRef.id);
    elementIds.splice(currentId, 1);

    return !elementIds.includes(id);
  }

  private _setValidationRules(): void {
    ValidationRules.ensure((businessObject: IModdleElement) => businessObject.id)
    .displayName('processId')
    .required()
    .withMessage('Process-ID cannot be blank.')
    .then()
    .satisfies((id: string) => this._formIdIsUnique(id) && this._isProcessIdUnique(id))
    .withMessage('Process-ID already exists.')
    .on(this.businessObjInPanel.processRef);
  }

  private _publishDiagramChange(): void {
    this._eventAggregator.publish(environment.events.diagramChange);
  }
}
