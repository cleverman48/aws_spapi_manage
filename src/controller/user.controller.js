const express = require("express");
const route = express.Router({ strict: true });
const UserService = require("../service/user.service");
const { InternalServerError, BadRequestError } = require("../util/error");
const { OKSuccess, CreatedSuccess } = require("../util/success");
const passport = require("passport");
const { LWA } = require("../config/aws.config");

route.post("/", async (req, res) => {
    try {
        const { body } = req;
        const userService = new UserService({});
        await userService.registration(body);
        res.status(CreatedSuccess.status).send(new CreatedSuccess({
            data: `user registered successfully`
        }));
    }
    catch (err) {
        console.log('err', err);
        res.status(err.status ? err.status : InternalServerError.status).send(err);
    }
})

route.get("/:id", passport.authenticate('authenticate', { session: false }), async (req, res) => {
    try {
        const { id } = req.params;
        const userService = new UserService({ id: id });
        res.status(OKSuccess.status).send(new OKSuccess({
            data: await userService.getUser()
        }));
    }
    catch (err) {
        res.status(err.status ? err.status : InternalServerError.status).send(err);
    }
})

route.post('/login', passport.authenticate('local', { session: false }), async (req, res) => {
    const { body } = req;
    const { email, password } = body;
    console.log('req.info', req.authInfo);
    console.log('req.user', req.user);
    const { error } = req.authInfo;
    if (error)
        return res.status(error.status).send(error);
    res.status(OKSuccess.status).send(new OKSuccess({
        data: {
            jwt: req.user.createLoginJWT()
        }
    }))
}, function (err) {
    console.log('err', err);
})

route.post('/authorize/region', passport.authenticate('authenticate', { session: false }), async (req, res) => {
    try {
        console.log('req.user', req.user);
        const { params, body } = req;
        let id;
        if (req.user) {
            const { user } = req.user;
            if (user)
                id = user;
        }
        const userService = await UserService.checkUser(id);
        const { region } = body;
        if (!region) {
            throw new BadRequestError({ message: `region is not define` });
        }
        await userService.authorizeRegion(region);
        res.status(OKSuccess.status).send(new OKSuccess({
            data: {
                url: userService.generateRedirectURL(region)
            }
        }));
    }
    catch (err) {
        console.log('err', err);
        res.status(err.status ? err.status : InternalServerError.status).send(err);
    }
})

route.get('/authorize/redirect', passport.authenticate('region-authorization', { session: false }), async (req, res) => {
    try {
        const { query } = req;
        console.log('query', query);
        console.log('req.user', req.user);
        const { error } = req.authInfo;
        if (error)
            return res.status(error.status).send(error);
        if (req.user) {
            var { user, region } = req.user;
        }
        const userService = await UserService.checkUser(user);
        await userService.setOAuthCredential(query, region);
        // on successfully saving the OAuth credentials you can redirect to your application
        res.redirect(LWA.REDIRECT_URL);
    }
    catch (err) {
        console.log('err', err);
        res.status(err.status ? err.status : InternalServerError.status).send(err);
    }
})

route.get('/marketplaces/:region', passport.authenticate('authenticate', { session: false }), async (req, res) => {
    try {
        const { params } = req;
        let id;
        if (req.user) {
            const { user } = req.user;
            if (user)
                id = user;
        }
        const { region } = params;
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
        const response = await userService.getMarketplaceParticipations({ region: regionExist["region"], refreshToken: regionExist["refreshToken"] });
        const { payload } = response;
        const data = {
            marketplaces: userService.filterMarketplaces(payload)
        };
        res.status(OKSuccess.status).send(new OKSuccess({
            data: data
        }));

    } catch (err) {
        console.log('err', err);
        res.status(err.status ? err.status : InternalServerError.status).send(err);
    }
})

module.exports = route;