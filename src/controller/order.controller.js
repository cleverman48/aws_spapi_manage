const express = require("express");
const route = express.Router({ strict: true });
const SPAPIService = require("../service/sp-api-service");
const { InternalServerError, BadRequestError } = require("../util/error");
const { OKSuccess, CreatedSuccess } = require("../util/success");
const UserService = require("../service/user.service");
const passport = require("passport");


route.get("/:region", passport.authenticate('authenticate', { session: false }), async (req, res) => {
    try {
        const { params, query } = req;
        let id;
        if (req.user) {
            const { user } = req.user;
            if (user)
                id = user;
        }
        const { region } = params;
        const {MarketplaceIds} = query;
        const userService = await UserService.checkUser(id);
        if (!region) {
            return res.status(BadRequestError.status).send(new BadRequestError({ message: `region is not define` }));
        }
        const regionExist = userService.isRegionExist(region);
        if (!regionExist) {
            return res.status(BadRequestError.status).send(new BadRequestError({ message: `region ${region} doesn't exist` }));
        }
        if (!(regionExist["isAuthorized"] && regionExist["refreshToken"])) {
            return res.status(BadRequestError.status).send(new BadRequestError({ message: `region ${region} is not authorized by user` }));
        }
        if(!MarketplaceIds){
            let marketpalces = regionExist["marketplaces"];
            if(marketpalces && marketpalces.length > 0){
                let filterMarketplace = marketpalces.map((marketplace) => {
                    return marketplace["id"];
                })
                query["MarketplaceIds"] = filterMarketplace.join(",");
            }
        }
        const spApiService = new SPAPIService({
            refreshToken: regionExist["refreshToken"],
            region: regionExist["region"]
        });
        const response = await spApiService.callAPI({
            method: "GET",
            endpoint: "/orders/v0/orders",
            // path: {
            //     orderId : "114-6408901-7137035"
            // },
            // query: {
            //     MarketplaceIds: "A2EUQ1WTGCTBG2",
            //     CreatedAfter : "2020-12-01T08:02:32Z",
            //     // LastUpdatedAfter: "2020-12-01T08:02:32Z"
            // },
            query: query,
            headers: {
                "content-type": "application/json"
            }
        })
        res.status(OKSuccess.status).send(new OKSuccess({
            data: response
        }));
    }
    catch (err) {
        console.log('err', err);
        res.status(err.status ? err.status : InternalServerError.status).send(err);
    }
})

module.exports = route;


