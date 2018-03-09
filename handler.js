"use strict"
const serverless = require("serverless-http")
const Koa = require("koa")
const bodyParser = require("koa-bodyparser")
const Router = require("koa-router")
const r = require("ramda")

const app = new Koa()
const router = new Router()

const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });
const dynamoDb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const db = require("./db")(dynamoDb)({
  TableName: "test",
})

const EPHEMERAL = "ephemeral",
  IN_CHANNEL = "in_channel"

router

  .post("/:stage?/add", async (ctx, next) => {
    const factNumberList = await db.scanAll({ justNumbers: true, forceAll: true })
    const FactNumber = r.compose(
      r.add(1),
      r.when(r.lt(r.__, 0), r.always(0)),
      r.apply(Math.max),
      r.pluck("FactNumber"),
      r.propOr([], "Items")
      )(factNumberList)

    const { text, user_name } = ctx.request.body
    const Item = {
      FactNumber,
      Text: text,
      Unixstamp: Date.now(),
      Author: user_name,
      Votes: db.createSet([user_name]),
      Immortal: false,
    }

    const res = await db.put({Item})
    ctx.body = {
      text: `PatFact #${FactNumber} added by \`${user_name}\`: "${text}"`,
      response_type: EPHEMERAL
    }
    next()
  })

  .post("/:stage?/get", async (ctx, next) => {
    const { text } = ctx.request.body
    const FactNumber = Number(text)
    if (FactNumber) {
      const res = await db.getFact({ Key: {FactNumber} })
      ctx.body = {
        text: `PatFact #${res.Item.FactNumber}: ${res.Item.Text}  _#justpatfactthings_`,
        response_type: IN_CHANNEL,
      }
    } else {
      let res = await db.scanAll({})
      if (!res.Items.length) res = await db.scanAll({ forceAll: true })
      const { FactNumber, Text, Immortal } = res.Items[Math.floor(Math.random() * res.Items.length)]
      ctx.body = {
        text: `PatFact #${FactNumber}: ${Text}  _#justpatfactthings_`,
        response_type: IN_CHANNEL,
      }
    }
    next()
  })

  .post("/:stage?/vote", async (ctx, next) => {
    const { user_name, text } = ctx.request.body
    const FactNumber = Number(text)
    if (!FactNumber) {
      ctx.body = {
        text: `"${text}" is not a valid Fact Number.`,
        response_type: EPHEMERAL,
      }
    } else {
      const res = await db.vote(user_name)({ Key: {FactNumber} })
      ctx.body = {
        text: `Vote added for PatFact ${FactNumber}`,
        response_type: EPHEMERAL,
      }
    }
    next()
  })



app
  .use(async (ctx, next) => {
    ctx.set("Access-Control-Allow-Origin", "*")
    ctx.set("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
    await next()
  })
  .use(bodyParser())
  .use(router.routes())
  .use(router.allowedMethods())

module.exports.handler = serverless(app)



/*
{"token":"token","team_id":"team_id1","team_domain":"team_domain","channel_id":"channel_id",
"channel_name":"channel_name","user_id":"user_id234","user_name":"user_name","command":"/command",
"response_url":"https://hooks.slack.com/commands","trigger_id":"trigger_id","text":"a new pat fact",
"rawBody":"token=token&team_id=team_id1&team_domain=team_domain&channel_id=channel_id&channel_name=channel_name&user_id=user_id234&user_name=user_name&command=%2Fcommand&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands&trigger_id=trigger_id&text=add+%22a+new+pat+fact%22"}
*/
