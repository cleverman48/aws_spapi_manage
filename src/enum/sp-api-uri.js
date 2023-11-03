const {REGION} = require('../enum/index');


const signatureURI = Object.freeze({
    "us-east-1" : 'https://sellingpartnerapi-na.amazon.com',
    "eu-west-1" : 'https://sellingpartnerapi-eu.amazon.com',
    "eu-west-2" : 'https://sellingpartnerapi-fe.amazon.com'
})

module.exports = signatureURI;