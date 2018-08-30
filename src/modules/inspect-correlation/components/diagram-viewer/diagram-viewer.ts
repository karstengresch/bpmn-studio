import {inject} from 'aurelia-framework';

import * as bundle from '@process-engine/bpmn-js-custom-bundle';

import {IBpmnModeler, NotificationType} from '../../../../contracts/index';
import {NotificationService} from '../../../notification/notification.service';

@inject('NotificationService')
export class DiagramViewer {
  public canvasModel: HTMLElement;
  public showDiagram: boolean;

  private _notificationService: NotificationService;
  private _diagramViewer: IBpmnModeler;

  constructor(notificationService: NotificationService) {
    this._notificationService = notificationService;
  }

  public attached(): void {
    this._diagramViewer = new bundle.viewer({
      additionalModules:
      [
        bundle.ZoomScrollModule,
        bundle.MoveCanvasModule,
      ],
    });
    this._diagramViewer.attachTo(this.canvasModel);
  }

  public toggleDiagramVisibility(): void {
    this.showDiagram = !this.showDiagram;
  }

  public async importXml(xml: string): Promise <void> {
    const xmlIsNotLoaded: boolean = (xml === undefined || xml === null);
    if (xmlIsNotLoaded) {
      const notificationMessage: string = 'The xml could not be loaded. Please try to reopen the Diff View or reload the Detail View.';
      this._notificationService.showNotification(NotificationType.ERROR, notificationMessage);
      return;
    }

    const xmlImportPromise: Promise<void> = new Promise((resolve: Function, reject: Function): void => {
      this._diagramViewer.importXML(xml, (importXmlError: Error) => {
        if (importXmlError) {
          reject(importXmlError);
          return;
        }
        resolve();
      });
    });
    return xmlImportPromise;
  }
}
