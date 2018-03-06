'use strict';
const serverless = require("serverless-http");
const express = require("express");
const app = new express();
// const db = require("./db");

const wrapSuccess = stream => stream
  .map(JSON.stringify)
  .map(body => ({ statusCode: 200, body }))

/*
add
  getFactNumbersList(true)
    pick highest number
    add one
  put
vote (FactNumber)
  vote
  [setImmortal]
get
  getFactNumbersList()
  random pick
  getFact
get (FactNumber)
  getFact
fix (FactNumber)
  updateText(author, text)
delete (FactNumber)
  delete
*/
app.post("/add", (req, res, next) => {
  res.json({ msg: "done" });
})

app.post("/vote", (req, res, next) => {

})

app.post("/get", (req, res, next) => {

})

app.post("/fix", (req, res, next) => {

})

app.post("/delete", (req, res, next) => {

})

module.exports.handler = serverless(app);
