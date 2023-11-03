const express = require("express");
const route = express.Router({ caseSensitive: true });
const AWSService = require("../service/aws.service");
const { OKSuccess } = require("../util/success");
const {InternalServerError} = require("../util/error");


route.post("/accessToken", async (req, res) => {
    try {
        const { body } = req;
        const { refreshToken } = body;
        const awsService = new AWSService({ refreshToken: refreshToken });
        res.status(OKSuccess.status).send(new OKSuccess({
            data: await awsService.loginWithAmazonAccessToken()
        }));
    }
    catch (err) {
        console.log('err',err);
        res.status(err.status ? err.status : InternalServerError.status).send(err);
    }
})

route.post("/temporaryCredential", async (req, res) => {
    try {
        const { body } = req;
        const { accessToken } = body;
        const awsService = new AWSService({refreshToken : accessToken});
        res.status(OKSuccess.status).send(new OKSuccess({
            data: await awsService.getTemporaryCredential()
        }));
    }
    catch (err) {
        res.status(err.status ? err.status : InternalServerError.status).send(err);
    }
})

module.exports = route;