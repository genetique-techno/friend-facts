"use strict"
const serverless = require("serverless-http")
const Koa = require("koa")
const bodyParser = require("koa-bodyparser")
const Router = require("koa-router")

const app = new Koa()
const router = new Router()

router.post("/:stage?/add", async (ctx, next) => {
  ctx.body = ctx.request.body
  ctx.body.rawBody = ctx.request.rawBody
  await next()
})

app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

module.exports.handler = serverless(app)
