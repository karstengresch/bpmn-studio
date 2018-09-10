export interface IProcessInstanceTableEntry {
  index: number;
  startedAt: string;
  state: string;
  user: string;
  correlationId: string;
}
