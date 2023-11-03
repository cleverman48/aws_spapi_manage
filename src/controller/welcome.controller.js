const express = require("express");
const route = express.Router({ strict: true });
const passport = require("passport");
const fs = require("fs");
const path = require("path");
const parentFolderPath = path.resolve(__dirname, "..");

route.get("/", async (req, res) => {
  try {
    fs.readFile(parentFolderPath + "/view/index.html", "utf8", (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error reading file");
      } else {
        res.send(data);
      }
    });
  } catch (err) {
    console.log("err", err);
    res.status(err.status ? err.status : InternalServerError.status).send(err);
  }
});
route.get("/register", async (req, res) => {
  try {
    fs.readFile(parentFolderPath + "/view/register.html", "utf8", (err, data) => {
      if (err) {
        console.error(err);
        res.status(500).send("Error reading file");
      } else {
        res.send(data);
      }
    });
  } catch (err) {
    console.log("err", err);
    res.status(err.status ? err.status : InternalServerError.status).send(err);
  }
});
module.exports = route;
