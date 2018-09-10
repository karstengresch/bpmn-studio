import {bindable, inject} from 'aurelia-framework';

import * as clipboard from 'clipboard-polyfill';

import {NotificationType} from '../../../../../../contracts/index';
import {DateService} from '../../../../../date-service/date.service';
import {NotificationService} from '../../../../../notification/notification.service';

interface LogEntry {
  timestamp: number;
  message: string;
  logLevel: string;
}

@inject('NotificationService')
export class LogViewer {
  @bindable() public log: Array<LogEntry>;

  private _dateService: DateService;
  private _notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this._notificationService = notificationService;
    this._dateService = new DateService();
  }

  public copyToClipboard(textToCopy: string): void {
    (clipboard as any).writeText(textToCopy);

    this._notificationService.showNotification(NotificationType.SUCCESS, 'Successfully copied to clipboard.');
  }

  public getDateStringFromTimestamp(timestamp: number): string {
    const dateString: string = this._dateService.getDateStringFromTimestamp(timestamp);

    return dateString;
  }
}
