import {
  IBpmnModdle,
  IBpmnModeler,
  IElementRegistry,
  IExtensionElement,
  IForm,
  IFormElement,
  IModdleElement,
  IPageModel,
  ISection,
  IShape,
} from '../../../../../../contracts';

import {inject} from 'aurelia-framework';
import {ValidateEvent, ValidationController, ValidationRules} from 'aurelia-validation';

@inject(ValidationController)
export class BasicsSection implements ISection {

  public path: string = '/sections/basics/basics';
  public canHandleElement: boolean = true;
  private isFormSelected: boolean = false;

  private businessObjInPanel: IFormElement;
  private bpmnModdle: IBpmnModdle;
  private modeler: IBpmnModeler;

  private forms: Array<IForm>;
  private selectedForm: IForm;
  private selectedIndex: number;
  private selectedType: string;
  private types: Array<string> = ['string', 'long', 'boolean', 'date', 'enum', 'custom type'];
  private customType: string;
  private formElement: IFormElement;

  private previousFormId: string;
  private previousForm: IForm;
  private validationError: boolean = false;
  private validationController: ValidationController;

  private activeListElementId: string;

  constructor(controller?: ValidationController) {
    this.validationController = controller;
  }

  public activate(model: IPageModel): void {
    this.businessObjInPanel = model.elementInPanel.businessObject;

    this.modeler = model.modeler;
    this.bpmnModdle = this.modeler.get('moddle');

    this.validationController.subscribe((event: ValidateEvent) => {
      this._validateFormId(event);
    });

    this._init();

    if (this.validationError) {
      this.previousForm.id = this.previousFormId;
      this.validationController.validate();
    }
  }

  public detached(): void {
    this._validateOnDetach();
  }

  private _validateOnDetach(): void {
    if (!this.validationError) {
      return;
    }

    this._resetIdOnSelectedOrPrevious();

    this.validationController.validate();
    this._updateId();
  }

  private _resetIdOnSelectedOrPrevious(): void {
    if (this.selectedForm !== null) {
      this.selectedForm.id = this.previousFormId;
    } else {
      this.previousForm.id = this.previousFormId;
    }
  }

  public isSuitableForElement(element: IShape): boolean {
    if (!element.businessObject) {
      return false;
    }

    return element.businessObject.$type === 'bpmn:UserTask';
  }

  private _init(): void {
    this.isFormSelected = false;
    if (this.canHandleElement) {
      this.formElement = this._getFormElement();
      this._reloadForms();
    }
  }

  private _getXML(): string {
    let xml: string;
    this.modeler.saveXML({format: true}, (err: Error, diagrammXML: string) => {
      xml = diagrammXML;
    });
    return xml;
  }

  private _resetId(): void {
    this._resetIdOnSelectedOrPrevious();

    this.validationController.validate();
  }

  private _selectForm(): void {
    if (this.validationError) {
      this.previousForm.id = this.previousFormId;
    }

    this.previousFormId = this.selectedForm.id;
    this.previousForm = this.selectedForm;

    this.validationController.validate();

    this.isFormSelected = true;
    this.selectedType = this._getTypeOrCustomType(this.selectedForm.type);
    this.selectedIndex = this._getSelectedIndex();

    this._setValidationRules();
  }

  private _reloadForms(): void {
    this.forms = [];

    if (!this.formElement || !this.formElement.fields) {
      return;
    }

    const forms: Array<IForm> = this.formElement.fields;
    for (const form of forms) {
      if (form.$type === `camunda:FormField`) {
        this.forms.push(form);
      }
    }
  }

  private _getTypeOrCustomType(type: string): string {
    if (this.types.includes(type) || type === null) {
      this.customType = '';
      return type;
    } else {
      this.customType = type;
      return 'custom type';
    }
  }

  private _updateId(): void {
    this.validationController.validate();

    const hasValidationErrors: boolean = this.validationController.errors.length > 0;
    if (hasValidationErrors) {
      this._resetId();
    }

    const isSelectedFormIdNotExisting: boolean = this.selectedForm === null || this.selectedForm.id === '';
    if (isSelectedFormIdNotExisting) {
      return;
    }

    this.formElement.fields[this.selectedIndex].id = this.selectedForm.id;
  }

  private _updateDefaultValue(): void {
    this.formElement.fields[this.selectedIndex].defaultValue = this.selectedForm.defaultValue;
  }

  private _updateLabel(): void {
    this.formElement.fields[this.selectedIndex].label = this.selectedForm.label;
  }

  private _updateType(): void {
    let type: string;

    if (this.selectedType === 'custom type') {
      type = this.customType;
    } else {
      type = this.selectedType;
    }

    this.formElement.fields[this.selectedIndex].type = type;
  }

  private _removeForm(): void {
    this.formElement.fields.splice(this.selectedIndex, 1);

    this.isFormSelected = false;
    this.selectedForm = undefined;
    this.selectedIndex = undefined;

    this._reloadForms();
  }

  private async _addForm(): Promise<void> {

    const bpmnForm: IForm = this.bpmnModdle.create('camunda:FormField',
      {
        id: `Form_${this._generateRandomId()}`,
        type: null,
        label: ``,
        defaultValue: ``,
      });

    if (!this.formElement.fields) {
      this.formElement.fields = [];
    }

    this.formElement.fields.push(bpmnForm);
    this.forms.push(bpmnForm);
    this.selectedForm = bpmnForm;

    this._selectForm();
  }

  private _getSelectedIndex(): number {
    const forms: Array<IForm> = this.formElement.fields;
    for (let index: number = 0; index < forms.length; index++) {
      if (forms[index].id === this.selectedForm.id) {
        return index;
      }
    }
  }

  private _getFormElement(): IModdleElement {
    let formElement: IModdleElement;

    if (!this.businessObjInPanel.extensionElements) {
      this._createExtensionElement();
    }

    for (const extensionValue of this.businessObjInPanel.extensionElements.values) {
      if (extensionValue.$type === 'camunda:FormData') {
        formElement = extensionValue;
      }
    }

    if (!formElement) {
      const fields: Array<IModdleElement> = [];
      const extensionFormElement: IModdleElement = this.bpmnModdle.create('camunda:FormData', {fields: fields});
      this.businessObjInPanel.extensionElements.values.push(extensionFormElement);

      return this._getFormElement();
    }

    return formElement;
  }

  private _createExtensionElement(): void {
    const values: Array<IFormElement> = [];
    const fields: Array<IForm> = [];
    const formData: IFormElement = this.bpmnModdle.create('camunda:FormData', {fields: fields});
    values.push(formData);

    this.businessObjInPanel.formKey = `Form Key`;
    const extensionElements: IModdleElement = this.bpmnModdle.create('bpmn:ExtensionElements', {values: values});
    this.businessObjInPanel.extensionElements = extensionElements;
  }

  private _generateRandomId(): string {
    let randomId: string = '';
    const possible: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    const randomIdLength: number = 8;
    for (let i: number = 0; i < randomIdLength; i++) {
      randomId += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return randomId;
  }

  private _deleteExtensions(): void {
    delete this.businessObjInPanel.extensionElements;
    delete this.businessObjInPanel.formKey;
  }

  private _clearFormKey(): void {
    this.businessObjInPanel.formKey = '';
  }

  private _clearId(): void {
    this.selectedForm.id = '';
    this.validationController.validate();
    this._updateId();
    this.validationController.validate();
  }

  private _clearType(): void {
    this.customType = '';
  }

  private _clearLabel(): void {
    this.selectedForm.label = '';
  }

  private _clearValue(): void {
    this.selectedForm.defaultValue = '';
  }

  private _validateFormId(event: ValidateEvent): void {
    if (event.type !== 'validate') {
      return;
    }

    this.validationError = false;
    for (const result of event.results) {
      if (result.rule.property.displayName !== 'formId') {
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

  private _hasFormSameIdAsSelected(forms: Array<IForm>): boolean {

    const unselectedFormWithSameId: IForm = forms.find((form: IForm) => {

      const formHasSameIdAsSelectedForm: boolean = form.id === this.selectedForm.id;
      const formIsNotSelectedForm: boolean = form !== this.selectedForm;

      return formHasSameIdAsSelectedForm && formIsNotSelectedForm;
    });

    return unselectedFormWithSameId !== undefined;
  }

  private _getFormDataFromBusinessObject(businessObject: IModdleElement): IFormElement {
    const extensionElement: IExtensionElement = businessObject.extensionElements;
    const hasNoExtensionElements: boolean = extensionElement === undefined;
    if (hasNoExtensionElements) {
      return;
    }

    const extensions: Array<IModdleElement> = extensionElement.values;
    return extensions.find((extension: IModdleElement) => {
      const isFormData: boolean = extension.$type === 'camunda:FormData';

      return isFormData;
    });
  }

  private _getFormsById(id: string): Array<IShape> {
    const elementRegistry: IElementRegistry = this.modeler.get('elementRegistry');

    const formsWithId: Array<IShape> = elementRegistry.filter((element: IShape) => {
      const currentBusinessObject: IModdleElement = element.businessObject;

      const isNoUserTask: boolean = currentBusinessObject.$type !== 'bpmn:UserTask';
      if (isNoUserTask) {
        return false;
      }
      const formData: IFormElement = this._getFormDataFromBusinessObject(currentBusinessObject);
      if (formData === undefined) {
        return false;
      }

      const forms: Array<IForm> = formData.fields;

      return this._hasFormSameIdAsSelected(forms);
    });

    return formsWithId;
  }

  private _formIdIsUnique(id: string): boolean {
    const formsWithSameId: Array<IShape> = this._getFormsById(id);
    const isIdUnique: boolean = formsWithSameId.length === 0;

    return isIdUnique;
  }

  private _setValidationRules(): void {
    ValidationRules
      .ensure((form: IForm) => form.id)
      .displayName('formId')
      .required()
      .withMessage('Id cannot be blank.')
      .then()
      .satisfies((id: string) => this._formIdIsUnique(id))
      .withMessage('Id already exists.')
      .on(this.selectedForm);
  }
}