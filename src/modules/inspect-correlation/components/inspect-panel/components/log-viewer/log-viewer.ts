import {bindable} from 'aurelia-framework';

interface LogEntry {
  timestamp: number;
  message: string;
  logLevel: string;
}

export class LogViewer {
  @bindable() public log: Array<LogEntry>;

  public getFormattedDate(timestamp: number): string {
    const date: Date = new Date(timestamp);

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
}
