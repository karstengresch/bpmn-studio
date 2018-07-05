import { OpenIdConnectConfiguration } from 'aurelia-open-id-connect';
import { Log, WebStorageStateStore } from 'oidc-client';
import environment from './environment';

export const oidcConfig: OpenIdConnectConfiguration = {
  loginRedirectRoute: 'bpmn-studio://',
  logoutRedirectRoute: 'bpmn-studio://',
  unauthorizedRedirectRoute: 'bpmn-studio://',
  logLevel: Log.DEBUG,
  userManagerSettings: {
    accessTokenExpiringNotificationTime: 1,
    authority: environment.openIdConnect.authority,
    automaticSilentRenew: true,
    monitorSession: true,
    checkSessionInterval: 2000,
    client_id: 'bpmn_studio',
    // client_id: 'implicit',
    filterProtocolClaims: true,
    loadUserInfo: false,
    post_logout_redirect_uri: `${environment.appHost}/signout-oidc`,
    redirect_uri: `${environment.appHost}/signin-oidc`,
    response_type: 'id_token',
    scope: 'openid profile',
    silentRequestTimeout: 10000,
    silent_redirect_uri: `${environment.appHost}/signin-oidc`,
    userStore: new WebStorageStateStore({
      prefix: 'oidc',
      store: window.localStorage,
    }),
  },
};
