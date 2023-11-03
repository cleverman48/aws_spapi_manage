const { REGION, SPAPIURI } = require("../enum/index");
const AWSService = require("../service/aws.service");
const { ForbiddenError } = require('../util/error');
const { Request } = require("node-fetch");
const fetch = require("node-fetch");
const AWSSignV4Service = require("../service/awsSignV4.service");
const Bluebird = require("bluebird");
// fetch.Promise = Bluebird;
const RequestService = require("../service/request.service");

class SPAPIService {

    #region;
    #awsService;

    constructor({ region, refreshToken }) {
        if (!region) {
            throw new ForbiddenError({ message: "user region value is missing" });
        } else {
            this.#region = region;
        }
        if (!refreshToken) {
            throw new ForbiddenError({ message: "user refreshToken value is missing" });
        }
        this.#awsService = new AWSService({ refreshToken: refreshToken });
    }


    async callAPI({ method, endpoint, path, query, body, headers }) {

        if (!method) {
            throw new ForbiddenError({ message: "request method is not define" });
        }
        if (!endpoint) {
            throw new ForbiddenError({ message: "request endpoint is not define" });
        }

        await this.#awsService.loginWithAmazonAccessToken();
        console.log("this.#awsService.accessToken", this.#awsService.accessToken);
        await this.#awsService.getTemporaryCredential();
        console.log("this.#awsService.clientCredential", this.#awsService.clientCredential);

        console.log("SPAPIURI[this.#region]", SPAPIURI[this.#region]);
        var url = new URL(SPAPIURI[this.#region]);
        //path will be the required parameters for specific endpoints

        if (!path) {
            url.pathname = endpoint;
        } else {
            let pathArray = new Array();
            for (let key in path) {
                pathArray.push(path[key]);
            }
            let pathString = pathArray.join("/").toString();
            url.pathname = `${endpoint}/${pathString}`;
        }
        if (query) {
            // sort query object by key
            query = Object.keys(query).sort().reduce((r, k) => (r[k] = query[k], r), {});
            var searchParams = new URLSearchParams();
            for (let key in query) {
                // console.log("key query[key]", key, query[key]);
                searchParams.append(encodeURI(key), encodeURI(query[key]));
            }
            url.search = searchParams.toString();
        }

        console.log("url sp-api-service", url.toString());

        let request = new Request(url.toString(), {
            method: method,
            body: body,
            headers: headers,
        });
        request.hostname = url.hostname;

        // append accessToken value in request headers
        request.headers.append("x-amz-access-token", this.#awsService.accessToken);
        request.headers.append("x-amz-security-token", this.#awsService.clientCredential.SessionToken);

        // signing v4 process
        const awsSignv4Service = new AWSSignV4Service({
            clientCredential: this.#awsService.clientCredential
        });
        request = awsSignv4Service.sign({
            region: this.#region,
            request: request,
            serviceName: "execute-api"
        });

        console.log("request.headers", request.headers.raw());

        let _headers = {};
        request.headers.forEach((value, name) => {
            _headers[name] = value;
        })

        const requestService = new RequestService({
            method: request.method,
            url: request.url,
            body: request.body,
            headers: _headers
        });

        return requestService.sendHTTPRequest();

    }
}

module.exports = SPAPIService;