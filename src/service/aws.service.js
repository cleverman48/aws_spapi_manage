"use strict";

const { LWA, AWS } = require("../config/aws.config");
const awssdk = require("aws-sdk");
const { ForbiddenError, InternalServerError, BadRequestError } = require('../util/error');
const RequestService = require("./request.service");
const { SPAPIENDPOINT } = require("../constant/index");
const { GRANTTYPE } = require("../enum/index");


class AWSService {

  accessToken;
  #refreshToken;
  #authorizationCode;
  clientCredential;

  constructor({ refreshToken, authorizationCode }) {
    if (!(refreshToken || authorizationCode)) {
      throw new ForbiddenError({ message: "you must provide seller authorization code or refresh token value" });
    } else {
      if (refreshToken)
        this.#refreshToken = refreshToken;
      if (authorizationCode)
        this.#authorizationCode = authorizationCode;
    }
    if (
      !(
        AWS.ACCESS_KEY &&
        AWS.SECRET_KEY &&
        AWS.ROLE_ARN &&
        AWS.POLICY_ARN
      )
    ) {
      throw new ForbiddenError({ message: "you must define aws access key, secret key, policy & role arn values in env file" }
      );
    }
    if (
      !(
        LWA.CLIENT_ID &&
        LWA.CLIENT_SECRET
      )
    ) {
      throw new ForbiddenError({ message: "you must define grantType, clientId, clientSecret" }
      );
    }
  }

  async loginWithAmazonAccessToken() {
    const response = await new RequestService({
      method: "POST",
      url: SPAPIENDPOINT.LWA,
      body: {
        grant_type: GRANTTYPE.REFRESH_TOKEN,
        client_id: LWA.CLIENT_ID,
        client_secret: LWA.CLIENT_SECRET,
        refresh_token: this.#refreshToken,
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    }).sendHTTPRequest();
    const result = response;
    const {access_token} = result;
    if (!access_token) {
      throw new BadRequestError({ message: `can't get access token`, data : result });
    }
    this.accessToken = access_token;
    return result;
  }

  async loginWithAmazonRefreshToken() {

    const response = await new RequestService({
      method: "POST",
      url: SPAPIENDPOINT.LWA,
      body: {
        grant_type: GRANTTYPE.AUTHORIZATION_CODE,
        code: this.#authorizationCode,
        client_id: LWA.CLIENT_ID,
        client_secret: LWA.CLIENT_SECRET,
      },
      headers: {
        "content-type": "application/x-www-form-urlencoded",
      },
    }).sendHTTPRequest();
    const result = response;
    console.log("result loginWithAmazonRefreshToken",result);
    const {refresh_token} = result;
    if (!refresh_token) {
      throw new BadRequestError({ message: `can't get refresh token`, data : result });
    }
    return result;
  }

  async getTemporaryCredential() {
    const sts = new awssdk.STS({
      accessKeyId: AWS.ACCESS_KEY,
      secretAccessKey: AWS.SECRET_KEY,
    });
    const { Credentials } = await new Promise((resolve, reject) => {
      sts.assumeRole(
        {
          RoleArn: AWS.ROLE_ARN,
          PolicyArns: [
            {
              arn: AWS.POLICY_ARN,
            },
          ],
          RoleSessionName: AWS.ROLE_SESSION_NAME,
          DurationSeconds: AWS.TEMPORARY_CREDENTIAL_DURATION,
        },
        (err, data) => {
          if (err) {
            reject(new InternalServerError({ message: `Error in getTemporaryCredential`, data: err }));
          }
          resolve(data);
        }
      );
    });
    if (Credentials) {
      this.clientCredential = Credentials;
    }
    console.log('clientCredential',this.clientCredential);
    return this.clientCredential;
  }

  
}

module.exports = AWSService;
