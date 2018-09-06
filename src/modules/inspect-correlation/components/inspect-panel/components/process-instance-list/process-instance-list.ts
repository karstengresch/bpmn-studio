import {bindable, bindingMode} from 'aurelia-framework';

import {Correlation} from '@process-engine/management_api_contracts';

interface TableEntry {
  index: number;
  startedAt: string;
  state: string;
  user: string;
  correlationId: string;
}

interface NewCorrelation extends Correlation {
  startedAt: number;
  state: string;
  user: string;
}

enum SortProperty {
  Number = 'index',
  StartedAt = 'startedAt',
  State = 'state',
  User = 'user',
  CorrelationId = 'correlationId',
}

interface SortSettings {
  ascending: boolean;
  sortProperty: SortProperty;
}

export class ProcessInstanceList {
  @bindable({ defaultBindingMode: bindingMode.twoWay }) public selectedCorrelation: NewCorrelation;
  @bindable({ changeHandler: 'correlationsChanged' }) public correlations: Array<NewCorrelation>;
  public sortedTableData: Array<TableEntry>;
  public SortProperty: typeof SortProperty = SortProperty;

  private _tableData: Array<TableEntry> = [];
  private _sortSettings: SortSettings = {
    ascending: false,
    sortProperty: undefined,
  };

  public selectCorrelation(selectedTableEntry: TableEntry): void {
    this.selectedCorrelation = this._getCorrelationForTableEntry(selectedTableEntry);
  }

  public correlationsChanged(correlations: Array<NewCorrelation>): void {
    this._convertCorrelationsIntoTableData(correlations);
    this.sortList(SortProperty.Number);
  }

  private _convertCorrelationsIntoTableData(correlations: Array<NewCorrelation>): void {
    for (const correlation of correlations) {
      const formattedStartedDate: string = this._formatDate(new Date(correlation.startedAt));

      const tableEntry: TableEntry = {
        index: this._getIndexForCorrelation(correlation, correlations),
        startedAt: formattedStartedDate,
        state: correlation.state,
        user: correlation.user,
        correlationId: correlation.id,
      };

      this._tableData.push(tableEntry);
    }
  }

  public sortList(property: SortProperty): void {
    this.sortedTableData = [];
    const isSamePropertyAsPrevious: boolean = this._sortSettings.sortProperty === property;
    const ascending: boolean = isSamePropertyAsPrevious ? !this._sortSettings.ascending
                                                        : true;

    this._sortSettings.ascending = ascending;
    this._sortSettings.sortProperty = property;

    const sortByDate: boolean = property === SortProperty.StartedAt;
    const sortByString: boolean = property === SortProperty.CorrelationId
                               || property === SortProperty.State
                               || property === SortProperty.User;

    const sortedTableData: Array<TableEntry> = sortByDate ? this._sortListByStartDate()
                                                          : this._sortList(property);

    this.sortedTableData = ascending ? sortedTableData
                                     : sortedTableData.reverse();
  }

  private _sortList(property: SortProperty): Array<TableEntry> {
    const sortedTableData: Array<TableEntry> = this._tableData.sort((firstEntry: TableEntry, secondEntry: TableEntry) => {
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

  private _sortListByStartDate(): Array<TableEntry> {
    const sortedTableData: Array<TableEntry> = this._tableData.sort((firstEntry: TableEntry, secondEntry: TableEntry) => {
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

  private _getCorrelationForTableEntry(tableEntry: TableEntry): NewCorrelation {
    const correlationForTableEntry: NewCorrelation = this.correlations.find((correlation: NewCorrelation) => {
      return correlation.id === tableEntry.correlationId;
    });

    return correlationForTableEntry;
  }

  private _formatDate(date: Date): string {
    const day: string = this._getDayFromDate(date);
    const month: string = this._getMonth(date);
    const year: string = this._getYearFromDate(date);
    const hour: string = this._getHoursFromDate(date);
    const minute: string =  this._getMinutesFromDate(date);

    const formattedDate: string = `${day}.${month}.${year} ${hour}:${minute}`;

    return formattedDate;
  }

  private _getDayFromDate(date: Date): string {
    const day: string = `${date.getDate()}`;

    if (day.length === 1) {
      return `0${day}`;
    }

    return day;
  }

  private _getMonth(date: Date): string {
    const month: string = `${date.getMonth() + 1}`;

    if (month.length === 1) {
      return `0${month}`;
    }

    return month;
  }

  private _getYearFromDate(date: Date): string {
    const year: string = `${date.getFullYear()}`;

    return year;
  }

  private _getHoursFromDate(date: Date): string {
    const hours: string = `${date.getHours()}`;

    if (hours.length === 1) {
      return `0${hours}`;
    }

    return hours;
  }

  private _getMinutesFromDate(date: Date): string {
    const minute: string = `${date.getMinutes()}`;

    if (minute.length === 1) {
      return `0${minute}`;
    }

    return minute;
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
