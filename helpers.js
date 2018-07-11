"use strict"
const r = require("ramda")

// Take a text string like "1 this is new fact text", and convert it to [1, "this is new fact text"]
exports.parseText = r.compose(
  r.converge( (...args) => [...args], [
    r.compose(
      parseInt,
      r.head),
    r.compose(
      r.join(" "),
      r.tail)
    ]),
  r.split(" "))
