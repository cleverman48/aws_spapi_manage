"use strict";
const request = require('request');
const { ForbiddenError, InternalServerError } = require('../util/error');
const { Request } = require("node-fetch");
const fetch = require("node-fetch");
const moment = require("moment");


class RequestService {

    #method;
    #url;
    #body;
    #headers;
    constructor({ method, url, body, headers }) {
        if (!(method && url)) {
            throw new ForbiddenError({ message: 'You must pass method & url' });
        }
        this.#method = method;
        this.#url = url;
        this.#body = body;
        this.#headers = headers;
    }

    async sendHTTPRequest() {

        let option = {
            'method': this.#method,
            'url': this.#url,
            'headers': this.#headers,
        }
        if (this.#method == 'POST') {
            switch (this.#headers['content-type']) {
                case 'application/x-www-form-urlencoded': {
                    option['form'] = this.#body;
                    break;
                }
                case 'application/json': {
                    option['body'] = this.#body;
                    // option['json'] = true;
                    break;
                }
                default: {
                    option['body'] = this.#body;
                    // option['json'] = true;
                    break;
                    // throw new InternalServerError({ message: 'Invalid content-type of the request' });
                }
            }
        }
        console.log('body', this.#body);
        console.log('option', option);

        return new Promise((resolve, reject) => {
            request(option, (error, response, body) => {
                if (error) {
                    console.error("request error", error);
                    reject(new InternalServerError({ message: 'send http request error', data: error }));
                } else {
                    // console.log("response",response);
                    console.log("body", body);
                    if(this.isJsonParsable(body)){
                        resolve(JSON.parse(body));
                    }else{
                        resolve(body);
                    }
                }

            })
        })

    }

    isJsonParsable(string) {
        try{
            JSON.parse(string);
        }
        catch(e){
            console.error('e',e);
            return false;
        }
        return true;
    }

}

module.exports = RequestService;