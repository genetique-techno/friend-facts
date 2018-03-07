"use strict"
const serverless = require("serverless-http")
const Koa = require("koa")
const bodyParser = require("koa-bodyparser")
const Router = require("koa-router")

const db = require("./db")

const app = new Koa()
const router = new Router()

router.post("/:stage?/add", async (ctx, next) => {
  const { text, user_name } = ctx.request.body

  const Item = {
    FactNumber: Date.now(),
    Text: text,
    Unixstamp: Date.now(),
    Author: user_name,
    Votes: 0,
    Immortal: false,
  }

  await db.put({Item})
  ctx.body = "added"
  next()
})

router.post("/:stage?/get", async (ctx, next) => {
  const res = await db.getFactNumbersList()
  ctx.body = res
  next()
})

app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

module.exports.handler = serverless(app)



/*
{"token":"token","team_id":"team_id1","team_domain":"team_domain","channel_id":"channel_id",
"channel_name":"channel_name","user_id":"user_id234","user_name":"user_name","command":"/command",
"response_url":"https://hooks.slack.com/commands","trigger_id":"trigger_id","text":"a new pat fact",
"rawBody":"token=token&team_id=team_id1&team_domain=team_domain&channel_id=channel_id&channel_name=channel_name&user_id=user_id234&user_name=user_name&command=%2Fcommand&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands&trigger_id=trigger_id&text=add+%22a+new+pat+fact%22"}
*/
