const JWT = Object.freeze({
    "SESSION_SECRET": process.env.SESSION_SECRET,
    "SESSION_EXPIRE": process.env.SESSION_EXPIRE
})

module.exports = { JWT }