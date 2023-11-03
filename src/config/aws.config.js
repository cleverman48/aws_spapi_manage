const LWA = Object.freeze({
    'GRANT_TYPE': {
        'REFRESH_TOKEN': process.env.GRANT_TYPE_REFRESH_TOKEN,
        'AUTHORIZATION_CODE': process.env.GRANT_TYPE_AUTHORIZATION_CODE
    },
    'CLIENT_ID': process.env.CLIENT_ID,
    'CLIENT_SECRET': process.env.CLIENT_SECRET,
    'REFRESH_TOKEN': process.env.REFRESH_TOKEN,
    'REDIRECT_URL' : process.env.REDIRECT_URL,
    'APP_ID' : process.env.APP_ID
})
const AWS = Object.freeze({
    'ACCESS_KEY': process.env.ACCESS_KEY,
    'SECRET_KEY': process.env.SECRET_KEY,
    'ROLE_ARN': process.env.ROLE_ARN,
    'ROLE_SESSION_NAME': process.env.ROLE_SESSION_NAME,
    'POLICY_ARN': process.env.POLICY_ARN,
    "TEMPORARY_CREDENTIAL_DURATION": process.env.TEMPORARY_CREDENTIAL_DURATION
});

module.exports = { LWA, AWS }