const Router = require("koa-router")
const router = new Router()
const r = require("ramda")
const { parseText } = require("./helpers")

module.exports = routes

const EPHEMERAL = "ephemeral",
  IN_CHANNEL = "in_channel"
function routes(db) {

  router
    .post("/:stage?/get", async (ctx, next) => {
      const { text } = ctx.request.body
      const FactNumber = Number(text)
      // see if a specific fact number was requested by trying to convert it to a number
      if (FactNumber) {
        const res = await db.getFact({ Key: {FactNumber} })
        ctx.body = {
          text: `PatFact #${res.Item.FactNumber}: ${res.Item.FactText}  _#justpatfactthings_`,
          response_type: IN_CHANNEL,
        }
      // if no fact number was provided
      } else {
        // get all facts form the last 30 days, plus all immortal facts
        let res = await db.scanAll({})
        // if nothing is returned, attempt again looking at ALL facts ever
        if (!res.Items.length) res = await db.scanAll({ forceAll: true })
        // if there's _still_ nothing returned, we have no facts in the db
        if (!res.Items.length) {
          ctx.body = {
            text: `SadPat says: oh :balls:, there are no patfacts`,
            response_type: IN_CHANNEL,
          }
        // if facts are found, randomly pick one
        } else {
          const { FactNumber, FactText, Immortal } = res.Items[Math.floor(Math.random() * res.Items.length)]
          ctx.body = {
            text: `PatFact #${FactNumber}: ${FactText}  _#justpatfactthings_`,
            response_type: IN_CHANNEL,
          }
        }
      }
      next()
    })

    .post("/:stage?/add", async (ctx, next) => {
      const { text, user_name } = ctx.request.body
      // check if text was provided, otherwise we can't do anything
      if (!text) {
        ctx.body = {
          text: `PatFacts: You must include fact text, ya :cock:`,
          response_type: IN_CHANNEL,
        }
        return next()
      }

      // get the list of factNumbers
      const factNumberList = await db.scanAll({ justNumbers: true, forceAll: true })
      // find the highest FactNumber and add 1.  If no facts are there the returned value is 1
      const FactNumber = r.compose(
        r.add(1),
        r.when(r.lt(r.__, 0), r.always(0)),
        r.apply(Math.max),
        r.pluck("FactNumber"),
        r.propOr([], "Items")
        )(factNumberList)

      // create the Item object from the fact body
      const Item = {
        FactNumber,
        FactText: text,
        Unixstamp: Date.now(),
        Author: user_name,
        Votes: db.createSet([user_name]),
        Immortal: false,
      }

      // put the item
      const res = await db.put({Item})
      if (res) {
        ctx.body = {
          text: `PatFact #${FactNumber} added by \`${user_name}\`: "${text}"`,
          response_type: EPHEMERAL
        }
      } else {
        ctx.body = {
          text: `PatFacts Error: couldn't add the fact because of some reason, I guess AWS is down? maybe tell Bezos?`,
          response_type: EPHEMERAL,
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
        return next()
      }

      // vote for the fact
      const { Attributes: res } = await db.vote(user_name)({ Key: {FactNumber} })
      // set the response
      ctx.body = {
        text: `Vote added for PatFact #${FactNumber}`,
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
      let [FactNumber, FactText] = parseText(text)

      if (!FactNumber) {
        ctx.body = {
          text: "Not a valid PatFact number",
          response_type: EPHEMERAL,
        }
        return next()
      }

      let res;
      try {
        await db.updateFactText({ Key: {FactNumber}, Author, FactText })
        res = `PatFact #${FactNumber} has been updated!`
      }
      catch (e) {
        res = e.message === "The conditional request failed" ? "You failed to specificate the correct zip code (you ain't the author)" : e.message
      }

      ctx.body = {
        text: res,
        response_type: EPHEMERAL,
      }
      next()
    })

    .post("/:stage?/delete", async (ctx, next) => {
      const { user_name: Author, text } = ctx.request.body
      let [FactNumber, FactText] = parseText(text)

      if (!FactNumber) {
        ctx.body = {
          text: "Not a valid PatFact number, DUMBASS",
          response_type: EPHEMERAL,
        }
        return next()
      }

      try {
        await db.delete({ Key: {FactNumber}, Author })
        res = "Yo that shit mad deleted, dawg."
      }
      catch (e) {
        res = e.message === "The conditional request failed" ? "Hell naww, you didn't create that fact." : e.message
      }

      ctx.body = {
        text: res,
        response_type: EPHEMERAL,
      }
      next()
    })

  return router
}
