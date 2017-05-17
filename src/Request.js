
const util = require('util'),
    isEmpty = require('lodash.isempty'),
    omit = require('lodash.omit'),
    request = require('request'),
    uuid = require('uuid'),
    Constants = require('./Constants'),
    debugLog = util.debuglog('xwiki-sdk');

class Request {
    constructor(url, sdk) {
        this.url = url;
        this.sdk = sdk;
        this.defaultRequestOptions = {
            timeout: 60000,
            gzip: true,
            baseUrl: this.sdk.apiHost,
        };
        this.requestId = uuid.v4();
        this.method = 'GET';
        this.query = this.body = {};
        this.headers = {
            'Connection': 'keep-alive',
            'Accept': '*/*',
            'Accept-Encoding': Constants.ACCEPT_ENCODING,
            'Content-Type': Constants.CONTENT_TYPE,
            'Accept-Language': Constants.ACCEPT_LANGUAGE,
        };
        this.parseResponseInJSON = true;
        this.checkStatusCode = true;
        this.successStatusCodes = new Set([200, 201, 202, 204, 304]);
        this.log = debugLog.bind(debugLog, 'Request: ');
    }

    setQuery(query) {
        this.query = query;

        return this;
    }

    setBody(body) {
        this.body = body;

        return this;
    }

    setMethod(method) {
        this.method = method;

        return this;
    }

    setSendPlainBody(plain) {
        this.sendPlainBody = plain;

        this.setHeader('Content-Type', 'text/plain');

        return this;
    }

    /**
     * Sets or adds header to request.
     * @param {String} key
     * @param {String} value
     * @returns {Request}
     */
    setHeader(key, value) {
        this.headers[key] = value;

        return this;
    }

    then() {
        this.cachedSendPromise = this.cachedSendPromise || this.send();

        return this.cachedSendPromise.then(...arguments);
    }

    catch() {
        this.cachedSendPromise = this.cachedSendPromise || this.send();

        return this.cachedSendPromise.catch(...arguments);
    }

    tap() {
        this.cachedSendPromise = this.cachedSendPromise || this.send();

        return this.cachedSendPromise.tap(...arguments);
    }

    send() {
        const requestOptions = Object.assign({}, this.defaultRequestOptions, {
            url: this.url,
            qs: Request._normalizeQueryParams(Object.assign({}, {media: 'json'}, this.query)),
            method: this.method,
            auth: this.sdk.auth,
        });

        return new Promise((resolve, reject) => {
            if (!isEmpty(this.body)) {
                if (this.sendPlainBody) {
                    requestOptions.body = this.body;
                } else {
                    requestOptions.form = this.body;
                }

                this.log(`(${this.requestId}) Request.send: request with body:`, this.body);
            }

            requestOptions.headers = this.headers;
            this.log(`(${this.requestId}) Request.send: request with params:`, omit(requestOptions, ['jar']));

            const requester = request[this.method.toLowerCase()];

            requester(requestOptions, (err, res, resData) => {
                if (err) {
                    err.res = {requestId: this.requestId};

                    return reject(err);
                }

                res.requestId = this.requestId;

                this.log(`(${this.requestId}) Request.send: response statusCode:`, res.statusCode);
                this.log(`(${this.requestId}) Request.send: response headers:`, res.headers);

                if (this.checkStatusCode && !this.successStatusCodes.has(res.statusCode)) {
                    let invalidStatusCodeError = new Error();

                    invalidStatusCodeError.resData = resData;
                    invalidStatusCodeError.res = res;

                    throw invalidStatusCodeError;
                }

                if (this.parseResponseInJSON) {
                    let resJSON = {};

                    if (res.statusCode === 204) {
                        this.log(`(${this.requestId}) Request.send parsing JSON: empty response`);

                        return resolve({});
                    }

                    try {
                        resJSON = JSON.parse(resData);
                    } catch(err) {
                        this.log(`(${this.requestId}) Request.send parsing JSON: invalid response:`, resData);

                        let invalidJSONError = new Error('Invalid JSON response:' + resData);

                        invalidJSONError.resData = resData;
                        invalidJSONError.res = res;

                        return reject(invalidJSONError);
                    }

                    this.log(`(${this.requestId}) Request.send parsing JSON: response:`, util.inspect(resJSON));

                    resJSON.requestId = this.requestId;

                    return resolve(resJSON);
                }

                resolve({res, resData});
            });
        });
    }

    static _normalizeQueryParams(query) {
        let out = {};

        for (let i in query) {
            if (Object.prototype.hasOwnProperty.call(query, i)) {
                if (query[i] !== undefined && query[i] !== null) {
                    out[i] = query[i];
                }
            }
        }

        return out;
    }
}

module.exports = Request;
