// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

import { UrlUtility } from './openIdUrlUtility';

const OidcScope = 'openid';

export class SigninResponse {
    constructor(url) {

        const values = UrlUtility.parseUrlFragment(url, '#');
        console.log('values', values);
        this.error = values.error;
        this.error_description = values.error_description;
        this.error_uri = values.error_uri;

        this.state = values.state;
        this.id_token = values.id_token;
        this.session_state = values.session_state;
        this.access_token = values.access_token;
        this.token_type = values.token_type;
        this.scope = values.scope;
        this.profile = undefined; // will be set from ResponseValidator

        const expires_in = parseInt(values.expires_in);
        if (typeof expires_in === 'number' && expires_in > 0) {
            const now = parseInt(Date.now() / 1000);
            this.expires_at = now + expires_in;
        }
    }

    public get expires_in() {
        if (this.expires_at) {
            const now = parseInt(Date.now() / 1000);
            return this.expires_at - now;
        }
        return undefined;
    }

    public get expired() {
        const expires_in = this.expires_in;
        if (expires_in !== undefined) {
            return expires_in <= 0;
        }
        return undefined;
    }

    public get scopes() {
        return (this.scope || '').split(' ');
    }

    public get isOpenIdConnect() {
        return this.scopes.indexOf(OidcScope) >= 0 || !!this.id_token;
    }
}
