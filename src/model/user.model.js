const mongoose = require("mongoose");
const uuid = require("uuid");
const { USERSTATUS, REGION } = require("../enum/index");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT } = require("../config/jwt.config");

const schemaOptions = {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
}

const schema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        index: true,
        default: () => {
            return uuid.v4();
        }
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    passwordUpdatedAt: {
        type: Date
    },
    status: {
        type: String,
        required: true,
        enums: Object.values(USERSTATUS),
        default: USERSTATUS.REGISTRATION
    },
    authorization: [
        {
            region: {
                type: String,
                required: true,
                enums: Object.values(REGION)
            },
            credential: {
                authCode: { type: String },
                state: { type: String },
                sellingPartnerId: { type: String },
            },
            refreshToken: { type: String },
            isAuthorized: { type: Boolean, default: false },
            // getMarketplaceParticipations of the user
            marketplaces : []
        }
    ],
    isActive: {
        type: Boolean,
        default: true
    },
    isDelete: {
        type: Boolean,
        default: false
    }
}, schemaOptions);

// schema.pre('save', function (next) {
//     console.log('this user', this);
//     this.setPassword(this.password);
//     next();
// })

schema.methods.setPassword = function (password) {
    const salt = bcrypt.genSaltSync(16);
    const hash = bcrypt.hashSync(password, salt);
    this.password = hash;
    this.passwordUpdatedAt = new Date();
}

schema.methods.verifyPassword = function (password) {
    console.log("password",password);
    console.log("this.password",this.password);

    if (this.password && password) {
        const isMatch = bcrypt.compareSync(password, this.password);
        return isMatch;
    } else {
        return false;
    }
}

schema.methods.createLoginJWT = function () {
    return jwt.sign({
        data: {
            user: this.id
        },
    }, JWT.SESSION_SECRET, { expiresIn: JWT.SESSION_EXPIRE });
}

schema.methods.createRegionAuthorizationJWT = function (region) {
    return jwt.sign({
        data: {
            user: this.id,
            region: region
        },
    }, JWT.SESSION_SECRET, { expiresIn: JWT.SESSION_EXPIRE });
}

const User = mongoose.model('user', schema);
module.exports = User;