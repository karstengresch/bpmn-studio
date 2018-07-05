import { UserManagerSettings, WebStorageStateStore } from 'oidc-client';

const processEngineRoute: string = 'http://localhost:8000';
const appHost: string = 'bpmn-studio:/';

// tslint:disable-next-line no-default-export
export default {
  debug: true,
  testing: true,
  appHost: appHost,
  processlist: {
    pageLimit: 10,
  },
  openIdConnect: {
    authority: 'http://localhost:5000',
  },
  processengine: {
    poolingInterval: 5000,
    routes: {
      processes: `${processEngineRoute}/datastore/ProcessDef`,
      startProcess: `${processEngineRoute}/processengine/start`,
      processInstances: `${processEngineRoute}/datastore/Process`,
      messageBus: `${processEngineRoute}/mb`,
      iam: `${processEngineRoute}/iam`,
      userTasks: `${processEngineRoute}/datastore/UserTask`,
      importBPMN: `${processEngineRoute}/processengine/create_bpmn_from_xml`,
    },
  },
  events: {
    xmlChanged: 'xmlChanged',
    refreshProcessDefs: 'processdefs:refresh',
    statusBar: {
      showXMLButton: 'statusbar:xmlbutton:show',
      hideXMLButton: 'statusbar:xmlbutton:hide',
      updateProcessEngineRoute: 'statusbar:processEngineRoute:update',
    },
    navBar: {
      showTools: 'navbar:tools:show',
      hideTools: 'navbar:tools:hide',
      updateProcess: 'navbar:process:update',
      disableSaveButton: 'navbar:saveButton:disable',
      enableSaveButton: 'navbar:saveButton:enable',
    },
    processDefDetail: {
      printDiagram: 'processdefdetail:diagram:print',
      saveDiagram: 'processdefdetail:diagram:save',
      exportDiagramAs: 'processdefdetail:diagram:exportas',
      startProcess: 'processdefdetail:process:start',
    },
    bpmnio: {
      toggleXMLView: 'processdefdetail:xmlview:toggle',
    },
    diagramChange: 'diagram:change',
    processSolutionPanel: {
      toggleProcessSolutionExplorer: 'processSolutionPanel:processsolutionexplorer:toggle',
    },
  },
  bpmnStudioClient: {
    baseRoute: processEngineRoute,
  },
  propertyPanel: {
    defaultWidth: 250,
  },
  colorPickerSettings: {
    preferredFormat: 'hex',
    clickoutFiresChange: true,
    showPalette: true,
    maxSelectionSize: 8,
    showInitial: true,
    showInput: true,
    allowEmpty: true,
    showButtons: false,
    containerClassName: 'colorpicker-container',
  },
};
