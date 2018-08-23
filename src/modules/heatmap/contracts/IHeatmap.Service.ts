import {ActiveToken, FlowNodeRuntimeInformation} from '@process-engine/kpi_api_contracts';
import {ProcessModelExecution} from '@process-engine/management_api_contracts';
import {IFlowNodeAssociation} from '.';
import {IBpmnModeler, IElementRegistry, IOverlay} from '../../../contracts';

export interface IHeatmapService {
  getRuntimeInformationForProcessModel(processModelId: string): Promise<Array<FlowNodeRuntimeInformation>>;
  getProcess(processModelId: string): Promise<ProcessModelExecution.ProcessModel>;
  getFlowNodeAssociations(elementRegistry: IElementRegistry): Array<IFlowNodeAssociation>;
  getColoredXML(
    associations: Array<IFlowNodeAssociation>,
    flowNodeRuntimeInformation: Array<FlowNodeRuntimeInformation>,
    modeler: IBpmnModeler,
   ): Promise<string>;
  getActiveTokensForProcessModel(processModelId: string): Promise<Array<ActiveToken>>;
  addOverlays(overlays: IOverlay, elementRegistry: IElementRegistry, activeTokens: Array<ActiveToken>): void;
}
