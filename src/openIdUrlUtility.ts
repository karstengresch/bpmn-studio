// Copyright (c) Brock Allen & Dominick Baier. All rights reserved.
// Licensed under the Apache License, Version 2.0. See LICENSE in the project root for license information.

export class UrlUtility {
    public static addQueryParam(url, name, value) {
        if (url.indexOf('?') < 0) {
            url += '?';
        }

        if (url[url.length - 1] !== '?') {
            url += '&';
        }

        url += encodeURIComponent(name);
        url += '=';
        url += encodeURIComponent(value);

        return url;
    }

    public static parseUrlFragment(value, delimiter = '#') {
        if (typeof value !== 'string') {
            value = location.href;
        }

        const idx = value.lastIndexOf(delimiter);
        if (idx >= 0) {
            value = value.substr(idx + 1);
        }

        let params = {},
            regex = /([^&=]+)=([^&]*)/g,
            m;

        let counter = 0;
        while (m = regex.exec(value)) {
            params[decodeURIComponent(m[1])] = decodeURIComponent(m[2]);
            if (counter++ > 50) {
                return {
                    error: 'Response exceeded expected number of parameters',
                };
            }
        }

        for (const prop in params) {
            return params;
        }

        return {};
    }
}
