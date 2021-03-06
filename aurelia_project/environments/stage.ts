const processEngineRoute: string = 'http://localhost:8000';
const appHost: string = 'bpmn-studio:/';

// tslint:disable-next-line no-default-export
export default {
  debug: true,
  testing: false,
  appHost: appHost,
  processlist: {
    pageLimit: 10,
  },
  openIdConnect: {
    authority: 'http://localhost:5000',
  },
  processengine: {
    waitingRoomPollingIntervalInMs: 200,
    processModelPollingIntervalInMs: 1500,
    routes: {
      processes: `${processEngineRoute}/datastore/ProcessDef`,
      startProcess: `${processEngineRoute}/processengine/start`,
      iam: `${processEngineRoute}/iam`,
      userTasks: `${processEngineRoute}/datastore/UserTask`,
      importBPMN: `${processEngineRoute}/processengine/create_bpmn_from_xml`,
    },
  },
  events: {
    differsFromOriginal: 'differsFromOriginal',
    xmlChanged: 'xmlChanged',
    refreshProcessDefs: 'processdefs:refresh',
    statusBar: {
      showDiagramViewButtons: 'statusbar:diagramviewbuttons:show',
      hdieDiagramViewButtons: 'statusbar:diagramviewbuttons:hide',
    },
    configPanel: {
      processEngineRouteChanged: 'configpanel:processEngineRoute:changed',
    },
    navBar: {
      showTools: 'navbar:tools:show',
      hideTools: 'navbar:tools:hide',
      disableStartButton: 'navbar:startButton:disable',
      enableStartButton: 'navbar:startButton:enable',
      updateProcess: 'navbar:process:update',
      disableSaveButton: 'navbar:saveButton:disable',
      enableSaveButton: 'navbar:saveButton:enable',
      disableDiagramUploadButton: 'navbar:diagramUploadButton:disable',
      enableDiagramUploadButton: 'navbar:diagramUploadButton:enable',
    },
    processDefDetail: {
      printDiagram: 'processdefdetail:diagram:print',
      saveDiagram: 'processdefdetail:diagram:save',
      exportDiagramAs: 'processdefdetail:diagram:exportas',
      startProcess: 'processdefdetail:process:start',
      toggleXMLView: 'processdefdetail:xmlview:toggle',
      uploadProcess: 'processdefdetail:process:upload',
    },
    bpmnio: {
      toggleXMLView: 'processdefdetail:xmlview:toggle',
      toggleDiffView: 'processdefdetail:diffview:toggle',
    },
    diffView: {
      changeDiffMode: 'diffview:diffmode:change',
      toggleChangeList: 'diffview:changelist:toggle',
    },
    diagramChange: 'diagram:change',
    processSolutionPanel: {
      toggleProcessSolutionExplorer: 'processSolutionPanel:processsolutionexplorer:toggle',
      openProcessEngineIndexCard: 'processSolutionPanel:processEngineIndexCard:toggle',
    },
  },
  baseRoute: processEngineRoute,
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
