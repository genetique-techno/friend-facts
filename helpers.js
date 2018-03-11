"use strict"
const r = require("ramda")

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
