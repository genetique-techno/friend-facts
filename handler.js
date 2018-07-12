"use strict"
const serverless = require("serverless-http")
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });
const dynamoDb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const Koa = require("koa")
const app = new Koa()

const bodyParser = require("koa-bodyparser")
const db = require("./db")(dynamoDb)({
  TableName: "PatFactsTable",
})
const router = require("./routes")(db)


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
