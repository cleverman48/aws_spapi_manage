const passport = require("passport");
const { Strategy } = require("passport-local");
const UserService = require("../service/user.service");
const { UnauthorizedError, BadRequestError } = require('./error');
const JWTStrategy = require("passport-jwt").Strategy;
const { ExtractJwt } = require("passport-jwt");
const { JWT } = require("../config/jwt.config");

passport.use("local", new Strategy({ usernameField: "email" }, async (username, password, done) => {
    try {
        console.log("inside passport");
        const userService = new UserService({ email: username });
        const user = await userService.login({ password: password });
        console.log('user', user);
        const isMatch = await user.verifyPassword(password);
        if (!isMatch) {
            return done(null, {}, { error: new UnauthorizedError({ message: 'Invalid email or password' }) });
        }
        done(null, user);
    }
    catch (err) {
        console.log('err', err);
        done(null, {}, { error: err });
    }
}))


passport.use("region-authorization", new JWTStrategy({
    jwtFromRequest: ExtractJwt.fromUrlQueryParameter("state"),
    secretOrKey: JWT.SESSION_SECRET
}, (jwt_payload, done) => {
    try {
        console.log("inside jwt passport", jwt_payload);
        const { data } = jwt_payload;
        const { user, region } = data;
        if (!(user || region)) {
            return done(null, {}, { error: new UnauthorizedError({ message: 'user id and region value not found' }) });
        }
        done(null, data);
    }
    catch (err) {
        console.log('err', err);
        done(null, {}, { error: err });
    }
}));

passport.use("authenticate", new JWTStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT.SESSION_SECRET
}, (jwt_payload, done) => {
    try {
        console.log("inside jwt passport", jwt_payload);
        const { data } = jwt_payload;
        const { user } = data;
        // if (!user) {
        //     return done(new UnauthorizedError({ message: 'user id not found' }));
        // }
        done(null, data);
    }
    catch (err) {
        console.log('err', err);
        done(err);
    }
}));



module.exports = passport;