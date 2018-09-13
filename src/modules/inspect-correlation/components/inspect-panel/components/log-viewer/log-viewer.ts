import {bindable, inject} from 'aurelia-framework';

import * as clipboard from 'clipboard-polyfill';

import {ILogEntry, ILogSortSettings, LogSortProperty, NotificationType} from '../../../../../../contracts/index';
import {DateService} from '../../../../../date-service/date.service';
import {NotificationService} from '../../../../../notification/notification.service';

@inject('NotificationService')
export class LogViewer {
  @bindable({ changeHandler: 'logChanged' }) public log: Array<ILogEntry>;
  public LogSortProperty: typeof LogSortProperty = LogSortProperty;
  public sortedLog: Array<ILogEntry>;
  public sortSettings: ILogSortSettings = {
    ascending: false,
    sortProperty: undefined,
  };

  private _dateService: DateService;
  private _notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this._notificationService = notificationService;
    this._dateService = new DateService();
  }

  public logChanged(): void {
    this.log.forEach((logEntry: ILogEntry) => {
      logEntry.logLevel = logEntry.logLevel.toUpperCase();
    });

    this.sortList(LogSortProperty.Time);
  }

  public copyToClipboard(textToCopy: string): void {
    (clipboard as any).writeText(textToCopy);

    this._notificationService.showNotification(NotificationType.SUCCESS, 'Successfully copied to clipboard.');
  }

  public getDateStringFromTimestamp(timestamp: number): string {
    const dateString: string = this._dateService.getDateStringFromTimestamp(timestamp);

    return dateString;
  }

  public sortList(property: LogSortProperty): void {
    this.sortedLog = [];
    const isSamePropertyAsPrevious: boolean = this.sortSettings.sortProperty === property;
    const ascending: boolean = isSamePropertyAsPrevious ? !this.sortSettings.ascending
                                                        : true;

    this.sortSettings.ascending = ascending;
    this.sortSettings.sortProperty = property;

    const sortedLog: Array<ILogEntry> = this._getSortedLogByProperty(property);

    this.sortedLog = ascending ? sortedLog
                                     : sortedLog.reverse();
  }

  private _getSortedLogByProperty(property: LogSortProperty): Array<ILogEntry> {
    const sortedLog: Array<ILogEntry> =
      this.log.sort((firstEntry: ILogEntry, secondEntry: ILogEntry) => {
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

    return sortedLog;
  }
}
