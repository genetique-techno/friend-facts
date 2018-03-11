const Router = require("koa-router")
const router = new Router()
const r = require("ramda")

module.exports = routes

const EPHEMERAL = "ephemeral",
  IN_CHANNEL = "in_channel"
function routes(db) {

  router
    .post("/:stage?/get", async (ctx, next) => {
      const { text } = ctx.request.body
      const FactNumber = Number(text)
      if (FactNumber) {
        const res = await db.getFact({ Key: {FactNumber} })
        ctx.body = {
          text: `PatFact #${res.Item.FactNumber}: ${res.Item.FactText}  _#justpatfactthings_`,
          response_type: IN_CHANNEL,
        }
      } else {
        let res = await db.scanAll({})
        if (!res.Items.length) res = await db.scanAll({ forceAll: true })
        const { FactNumber, FactText, Immortal } = res.Items[Math.floor(Math.random() * res.Items.length)]
        ctx.body = {
          text: `PatFact #${FactNumber}: ${FactText}  _#justpatfactthings_`,
          response_type: IN_CHANNEL,
        }
      }
      next()
    })

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
        FactText: text,
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

    .post("/:stage?/vote", async (ctx, next) => {
      const { user_name, text } = ctx.request.body
      const FactNumber = Number(text)
      if (!FactNumber) {
        ctx.body = {
          text: `"${text}" is not a valid Fact Number.`,
          response_type: EPHEMERAL,
        }
        return next()
      }

      // vote for the fact
      const { Attributes: res } = await db.vote(user_name)({ Key: {FactNumber} })
      // set the response
      ctx.body = {
        text: `Vote added for PatFact ${FactNumber}`,
        response_type: EPHEMERAL,
      }

      // set fact to immortal if votes are 3 or more
      if (r.path(["Votes", "values"], res).length >= 3 && r.path(["Immortal"], res) === false) {
        const immortal = await db.setImmortal({ Key: {FactNumber} })
      }

      next()
    })

    .post("/:stage?/fix", async (ctx, next) => {
      const { user_name: Author, text } = ctx.request.body
      let [FactNumber, ...FactText] = text.split(" ")
      FactNumber = parseInt(FactNumber)
      FactText = FactText.join(" ")

      if (!FactNumber) {
        ctx.body = {
          text: "Not a valid PatFact number",
          response_type: EPHEMERAL,
        }
        return next()
      }
      const res = await db.updateFactText({ Key: {FactNumber}, Author, FactText })
      ctx.body = res
      next()
    })

  return router
}
