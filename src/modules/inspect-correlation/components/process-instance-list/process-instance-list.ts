import {bindable, bindingMode} from 'aurelia-framework';

import {Correlation} from '@process-engine/management_api_contracts';

interface TableEntry {
  index: number;
  startedAt: string;
  state: string;
  user: string;
  correlationId: string;
}

export class ProcessInstanceList {
  @bindable({ defaultBindingMode: bindingMode.twoWay }) public selectedCorrelation: Correlation;
  @bindable({ changeHandler: 'correlationsChanged' }) public correlations: Array<Correlation>;
  public tableData: Array<TableEntry> = [];

  public selectCorrelation(selectedTableEntry: TableEntry): void {
    this.selectedCorrelation = this.correlations.find((correlation: Correlation) => {
      return correlation.id === selectedTableEntry.correlationId;
    });
  }

  public correlationsChanged(newCorrelations: Array<Correlation>): void {
    this._convertCorrelationsIntoTableData(newCorrelations);
  }

  private _convertCorrelationsIntoTableData(correlations: Array<any>): void {
    for (const correlation of correlations) {
      const formattedStartedDate: string = this._formatDate(new Date(correlation.startedAt));

      const tableEntry: TableEntry = {
        index: this._getIndexForCorrelation(correlation, correlations),
        startedAt: formattedStartedDate,
        state: correlation.state,
        user: correlation.user,
        correlationId: correlation.id,
      };

      this.tableData.push(tableEntry);
    }
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
    const month: string = `${date.getMonth()}`;

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

  private _getIndexForCorrelation(correlation: any, correlations: Array<any>): number {
    const correlationStartedDate: number = correlation.startedAt;

    const earlierStartedCorrelations: Array<any> = correlations.filter((entry: any) => {
      return entry.startedAt < correlationStartedDate;
    });

    const amountOfEarlierStartedCorrelations: number = earlierStartedCorrelations.length;

    return amountOfEarlierStartedCorrelations;
  }
}
