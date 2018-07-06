import { autoinject } from 'aurelia-framework';
import { OpenIdConnect, OpenIdConnectRoles } from 'aurelia-open-id-connect';
import {Router, RouterConfiguration} from 'aurelia-router';
import { User } from 'oidc-client';
import {oidcConfig} from './open-id-connect-configuration';
import { SigninResponse } from './openIdSignInResponse';

@autoinject()
export class App {
  private _router: Router;
  private _openIdConnect: OpenIdConnect;
  private _user: User;

  constructor(openIdConnect: OpenIdConnect) {
    this._openIdConnect = openIdConnect;
    this._openIdConnect.observeUser((user: User) => this._user = user);
  }

  private _parseDeepLinkingUrl(url: string): string {
    const customProtocolPrefix: string = 'bpmn-studio://';
    const urlFragment: string = url.substring(customProtocolPrefix.length);
    return urlFragment;
  }

  private _processDeepLinkingRequest(url: string): void {
    const urlFragment: string = this._parseDeepLinkingUrl(url);
    this._router.navigate(urlFragment);
  }

  public configureRouter(config: RouterConfiguration, router: Router): void {
    this._router = router;

    if ((<any> window).nodeRequire) {
      const ipcRenderer: any = (<any> window).nodeRequire('electron').ipcRenderer;
      ipcRenderer.on('deep-linking-request-in-runtime', (event: any, url: string) => {
        console.log('deep linking request received: ', event, url);
        this._processDeepLinkingRequest(url);
      });
      ipcRenderer.on('deep-linking-request', async(event: any, url: string) => {
        const urlFragment: string = this._parseDeepLinkingUrl(url);
        console.log('signinresponse::: ' + urlFragment);
        const user: User = new User(new SigninResponse(urlFragment));
        this._user = user;
        console.log(user);
        console.log(user.profile.name);
        // await this._openIdConnect.userManager.processSigninResponse(urlFragment, oidcConfig.userManagerSettings.userStore);
        this._router.navigate('/');
      });
      ipcRenderer.send('deep-linking-ready');
    }

    config.options.pushState = true;
    // config.options.root = '/';
    config.title = 'BPMN-Studio';

    config.map([
      {
        route: ['', 'processdef', 'processdef/:page'],
        title: 'Process Definition List',
        name: 'processdef-list',
        moduleId: 'modules/processdef-list/processdef-list',
        nav: true,
      },
      {
        route: ['task', 'processdef/:processDefId/task', 'process/:processId/task'],
        title: 'Task List',
        name: 'task-list',
        moduleId: 'modules/task-list/task-list',
        nav: true,
      },
      {
        route: ['process', 'processdef/:processDefId/process'],
        title: 'Process Instance List',
        name: 'process-list',
        moduleId: 'modules/process-list/process-list',
        nav: true,
      },
      {
        route: ['task/:userTaskId/dynamic-ui'],
        title: 'Task Dynamic UI',
        name: 'task-dynamic-ui',
        moduleId: 'modules/task-dynamic-ui/task-dynamic-ui',
      },
      {
        route: ['processdef/:processDefId/detail'],
        title: 'ProcessDef Detail',
        name: 'processdef-detail',
        moduleId: 'modules/processdef-detail/processdef-detail',
      },
      {
        route: 'processdef/:processDefId/start',
        title: 'ProcessDef Start',
        name: 'processdef-start',
        moduleId: 'modules/processdef-start/processdef-start',
      },
      {
        route: 'configuration',
        title: 'Configuration',
        name: 'configuration',
        moduleId: 'modules/config-panel/config-panel',
      },
      {
        route: 'waitingroom/:processInstanceId',
        title: 'Waiting Room',
        name: 'waiting-room',
        moduleId: 'modules/waiting-room/waiting-room',
      },
    ]);

    config.fallbackRoute('');

    this._openIdConnect.configure(config);
  }
}
