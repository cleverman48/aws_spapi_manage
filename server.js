require("dotenv").config({
    path: `./.env`,
});

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');

app.use(
    bodyParser.urlencoded({ extended: true })
);
app.use(bodyParser.json());
app.use(cors());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Custom-header"
    );
    // in case we need to use our custom created header in application
    res.header("Access-Control-Expose-Headers", "X-Custom-header");
    next();
});
app.use(require("./src/util/passport").initialize());

app.use("/", require("./src/controller/welcome.controller"));
app.use("/api/user", require("./src/controller/user.controller"));
app.use("/api/aws", require("./src/controller/aws.controller"));
app.use("/api/order",require("./src/controller/order.controller"));
app.use("/api/inventory",require("./src/controller/inventory.controller"));


// app.use(passport.session());

app.listen(process.env.PORT, () => {
    console.log(`server running at port ${process.env.PORT}`);
    let url = new URL("https://www.google.com/get?a='i'&b='d'");
    const moment = require("moment");
    console.log(moment().format("YYYYMMDD"))
})
require("./src/config/db.config");