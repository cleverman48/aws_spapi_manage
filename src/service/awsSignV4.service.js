const { ForbiddenError } = require('../util/error');
const { Request } = require("node-fetch");
const request = require('request');
const { URL, URLSearchParams } = require("url");
const crypto = require("crypto-js");
const moment = require("moment");

class AWSSignV4Service {

    #clientCredential;

    constructor({ clientCredential }) {
        if (!clientCredential) {
            throw new ForbiddenError({ message: "user client credential is not define for aws signaturev4" });
        } else {
            this.#clientCredential = clientCredential;
            console.log("this.#clientCredential", this.#clientCredential);
        }
    }

    sign({ request, region, serviceName }) {

        const signingDate = this.#initializeHeaders(request);
        const signedHeaders = this.#extractSignedHeaders(request.headers);
        const hashedCanonicalRequest = this.#createCanonicalRequest({ request, signedHeaders });
        // serviceName : "execute-api"
        const stringToSign = this.#stringToSign({
            signingDate: signingDate,
            hashedCanonicalRequest: hashedCanonicalRequest,
            region: region,
            serviceName: serviceName
        });
        console.log("stringToSign", stringToSign);
        const signature = this.#calculateSignature({
            stringToSign: stringToSign,
            signingDate: signingDate,
            secretKey: this.#clientCredential.SecretAccessKey,
            region: region,
            serviceName: serviceName
        })

        this.#addSignature({
            request: request,
            accessKey: this.#clientCredential.AccessKeyId,
            signedHeaders: signedHeaders,
            signature: signature,
            signingDate: signingDate,
            region: region,
            serviceName: serviceName
        })
        console.log("request final", request.headers);
        return request;
    }

    #initializeHeaders(request) {
        // request.hostname;
        if (request.headers) {
            // delete host and x-amz-date headers to avoid user errors
            request.headers.delete("x-amz-date");
            request.headers.delete("host");
        }
        // utc false because of my local timezone settings otherwise not needed if local timezone is set to utc
        const signingDate = moment().utc(false);
        request.headers.append("x-amz-date", signingDate.toISOString());
        request.headers.append("host", request.hostname);
        return signingDate;
    }

    #extractSignedHeaders(headers) {
        let rawHeaders = new Array();
        if (headers) {
            for (let headerKey of headers.keys()) {
                rawHeaders.push(headerKey);
            }
        }
        return rawHeaders.join(";").toString();
    }

    #createCanonicalRequest({ request, signedHeaders }) {
        console.log('request', request.url);
        // https://sellingpartnerapi-na.amazon.com/orders/v0/orders?CreatedAfter=13123
        const url = new URL(request.url);
        // const url = new URL("https://sellingpartnerapi-na.amazon.com/orders/v0/orders?CreatedAfter=13123");


        let canonicalizedRequest = new Array();
        // request method
        canonicalizedRequest.push(`${request.method}\n`);
        // request uri parameters
        canonicalizedRequest.push(`${this.#extractCanonicalURIParameters(url.pathname)}\n`);
        // request query string
        canonicalizedRequest.push(`${this.#extractCanonicalQueryString(url.searchParams)}\n`);
        // request headers
        canonicalizedRequest.push(`${this.#extractCanonicalHeaders(request.headers)}\n`);
        // signed headers
        canonicalizedRequest.push(`${signedHeaders}\n`);
        // hash(digest) request body payload
        canonicalizedRequest.push(`${this.#hashRequestPayload(request.body)}`)

        const canonicalRequest = canonicalizedRequest.join("").toString();

        console.log("canonical request", canonicalRequest);

        // create hash(digest) of canonical request
        return crypto.SHA256(canonicalRequest).toString(crypto.enc.Hex);
    }

    #hashRequestPayload(body) {
        const value = body ? body.toString() : "";
        return crypto.SHA256(value).toString(crypto.enc.Hex);
    }

    #extractCanonicalURIParameters(parameters) {
        let canonicalURI = "";
        if (!parameters || parameters.length == 0) {
            canonicalURI = "/";
        }
        else {
            if (!String(parameters).startsWith("/")) {
                canonicalURI = "/";
            }
            let arr = String(parameters).split("/");
            arr.forEach((element, index) => {
                // logic for encode twice
                arr[index] = encodeURI(element);
                arr[index] = encodeURI(arr[index]);
            });
            canonicalURI += arr.join("/").toString();
        }
        return canonicalURI;
    }

    #extractCanonicalQueryString(queryParameters) {
        let canonicalQueryString = new URLSearchParams();
        if (queryParameters) {
            queryParameters.forEach((value, key) => {
                // console.log("key", key);
                // console.log("value", value);
                // canonicalQueryString.append(encodeURI(key), encodeURI(value));

                // encoded the query key and values in sp-api service
                canonicalQueryString.append(key, value);

            })
        }
        return canonicalQueryString.toString();
    }



    #extractCanonicalHeaders(headers) {
        let headerString = new Array();
        if (headers) {
            headers.forEach((value, name) => {
                headerString.push(`${name}:${value}\n`);
            })
        }
        return headerString.join("").toString();
    }

    #stringToSign({ signingDate, hashedCanonicalRequest, region, serviceName }) {

        const scope = this.#buildScope({ signingDate: signingDate, region: region, serviceName: serviceName });
        const stringToSign = String(`AWS4-HMAC-SHA256\n${signingDate.format("YYYYMMDD[T]HHmmss[Z]")}\n${scope}\n${hashedCanonicalRequest}`);
        return stringToSign;
    }

    #deriveSigningKey({ key, dateStamp, region, serviceName }) {
        var kDate = crypto.HmacSHA256(dateStamp, "AWS4" + key);
        var kRegion = crypto.HmacSHA256(region, kDate);
        var kService = crypto.HmacSHA256(serviceName, kRegion);
        var kSigning = crypto.HmacSHA256("aws4_request", kService);
        return kSigning;
    }

    #calculateSignature({ stringToSign, signingDate, secretKey, region, serviceName }) {
        const signingKey = this.#deriveSigningKey({
            key: secretKey,
            dateStamp: signingDate.format("YYYYMMDD"),
            region: region,
            serviceName: serviceName
        });
        return crypto.HmacSHA256(stringToSign, signingKey).toString(crypto.enc.Hex);

    }

    #buildScope({ signingDate, region, serviceName }) {
        return String(`${signingDate.format("YYYYMMDD")}/${region}/${serviceName}/aws4_request`).toString();
    }

    #addSignature({ request, accessKey, signedHeaders, signature, signingDate, region, serviceName }) {
        const scope = this.#buildScope({
            signingDate: signingDate,
            region: region,
            serviceName: serviceName
        })
        let authorizationHeaderValue = new String();
        authorizationHeaderValue = authorizationHeaderValue.concat(`AWS4-HMAC-SHA256`);
        authorizationHeaderValue = authorizationHeaderValue.concat(` Credential=${accessKey}/${scope},`);
        authorizationHeaderValue = authorizationHeaderValue.concat(` SignedHeaders=${signedHeaders},`);
        authorizationHeaderValue = authorizationHeaderValue.concat(` Signature=${signature}`);

        request.headers.append("authorization", authorizationHeaderValue.toString());

        console.log("request addSignature", request.headers);
    }
}

module.exports = AWSSignV4Service;