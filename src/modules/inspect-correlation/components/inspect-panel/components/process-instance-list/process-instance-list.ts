import {bindable, bindingMode} from 'aurelia-framework';

import {Correlation} from '@process-engine/management_api_contracts';

import {IProcessInstanceSortSettings, IProcessInstanceTableEntry, ProcessInstanceListSortProperty} from '../../../../../../contracts/index';
import {DateService} from '../../../../../date-service/date.service';

interface NewCorrelation extends Correlation {
  startedAt: number;
  state: string;
  user: string;
}

export class ProcessInstanceList {
  @bindable({ defaultBindingMode: bindingMode.twoWay }) public selectedCorrelation: NewCorrelation;
  @bindable({ changeHandler: 'correlationsChanged' }) public correlations: Array<NewCorrelation>;
  public sortedTableData: Array<IProcessInstanceTableEntry>;
  public ProcessInstanceListSortProperty: typeof ProcessInstanceListSortProperty = ProcessInstanceListSortProperty;
  public sortSettings: IProcessInstanceSortSettings = {
    ascending: false,
    sortProperty: undefined,
  };

  private _tableData: Array<IProcessInstanceTableEntry> = [];
  private _dateService: DateService;

  constructor() {
    this._dateService = new DateService();
  }

  public selectCorrelation(selectedTableEntry: IProcessInstanceTableEntry): void {
    this.selectedCorrelation = this._getCorrelationForTableEntry(selectedTableEntry);
  }

  public correlationsChanged(correlations: Array<NewCorrelation>): void {
    this._convertCorrelationsIntoTableData(correlations);
    this.sortList(ProcessInstanceListSortProperty.Number);
  }

  private _convertCorrelationsIntoTableData(correlations: Array<NewCorrelation>): void {
    for (const correlation of correlations) {
      const formattedStartedDate: string = this._dateService.getDateStringFromTimestamp(correlation.startedAt);

      const index: number = this._getIndexForCorrelation(correlation, correlations);
      const state: string = correlation.state.toUpperCase();

      const tableEntry: IProcessInstanceTableEntry = {
        index: index,
        startedAt: formattedStartedDate,
        state: state,
        user: correlation.user,
        correlationId: correlation.id,
      };

      this._tableData.push(tableEntry);
    }
  }

  public sortList(property: ProcessInstanceListSortProperty): void {
    this.sortedTableData = [];

    const isSameSortPropertyAsBefore: boolean = this.sortSettings.sortProperty === property;
    const ascending: boolean = isSameSortPropertyAsBefore ? !this.sortSettings.ascending
                                                          : true;

    this.sortSettings.ascending = ascending;
    this.sortSettings.sortProperty = property;

    const sortByDate: boolean = property === ProcessInstanceListSortProperty.StartedAt;

    const sortedTableData: Array<IProcessInstanceTableEntry> = sortByDate ? this._sortListByStartDate()
                                                                          : this._sortList(property);

    this.sortedTableData = ascending ? sortedTableData
                                     : sortedTableData.reverse();
  }

  private _sortList(property: ProcessInstanceListSortProperty): Array<IProcessInstanceTableEntry> {
    const sortedTableData: Array<IProcessInstanceTableEntry> =
      this._tableData.sort((firstEntry: IProcessInstanceTableEntry, secondEntry: IProcessInstanceTableEntry) => {
        const firstEntryIsBigger: boolean = firstEntry[property] > secondEntry[property];
        if (firstEntryIsBigger) {
          return 1;
        }

        const secondEntryIsBigger: boolean = firstEntry[property] < secondEntry[property];
        if (secondEntryIsBigger) {
          return -1;
        }

        return 0;
      });

    return sortedTableData;
  }

  private _sortListByStartDate(): Array<IProcessInstanceTableEntry> {
    const sortedTableData: Array<IProcessInstanceTableEntry> =
      this._tableData.sort((firstEntry: IProcessInstanceTableEntry, secondEntry: IProcessInstanceTableEntry) => {
        const firstCorrelation: NewCorrelation = this._getCorrelationForTableEntry(firstEntry);
        const secondCorrelation: NewCorrelation = this._getCorrelationForTableEntry(secondEntry);

        const firstEntryIsBigger: boolean = firstCorrelation.startedAt > secondCorrelation.startedAt;
        if (firstEntryIsBigger) {
          return 1;
        }

        const secondEntryIsBigger: boolean = firstCorrelation.startedAt < secondCorrelation.startedAt;
        if (secondEntryIsBigger) {
          return -1;
        }

        return 0;
      });

    return sortedTableData;
  }

  private _getCorrelationForTableEntry(tableEntry: IProcessInstanceTableEntry): NewCorrelation {
    const correlationForTableEntry: NewCorrelation = this.correlations.find((correlation: NewCorrelation) => {
      return correlation.id === tableEntry.correlationId;
    });

    return correlationForTableEntry;
  }

  private _getIndexForCorrelation(correlation: NewCorrelation, correlations: Array<NewCorrelation>): number {
    const correlationStartedDate: number = correlation.startedAt;

    const earlierStartedCorrelations: Array<NewCorrelation> = correlations.filter((entry: NewCorrelation) => {
      return entry.startedAt < correlationStartedDate;
    });

    const amountOfEarlierStartedCorrelations: number = earlierStartedCorrelations.length;
    const correlationIndex: number = amountOfEarlierStartedCorrelations + 1;

    return correlationIndex;
  }
}
