const rp = require("request-promise")
const h = require("highland")
const path = require("path")
const parse = require("csv-parse")
const parser = parse()
const { createReadStream } = require("fs")

// example structure
/*
{"token":"token","team_id":"team_id1","team_domain":"team_domain","channel_id":"channel_id",
"channel_name":"channel_name","user_id":"user_id234","user_name":"user_name","command":"/command",
"response_url":"https://hooks.slack.com/commands","trigger_id":"trigger_id","text":"a new pat fact",
"rawBody":"token=token&team_id=team_id1&team_domain=team_domain&channel_id=channel_id&channel_name=channel_name&user_id=user_id234&user_name=user_name&command=%2Fcommand&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands&trigger_id=trigger_id&text=add+%22a+new+pat+fact%22"}
*/

const fileArg = process.argv[2]
const file = path.resolve(__dirname, fileArg)
if (!file) {
  console.error("No CSV file provided")
  process.exit(0)
}

const uri = process.argv[3]
if (!uri) {
  console.error("No add fact uri provided")
  process.exit(0)
}

const input = createReadStream(file, "utf8")
// kick off a highland stream with the output of the csv parser
h(input.pipe(parser))
.drop(1) // ignores the csv header line
.ratelimit(1, 250) // rate limiting may help the data go into the db in the correct order
.flatMap(([text, _, user_name]) => {
  const req = JSON.stringify({
    user_name,
    text
  })

  const options = {
    body: { user_name, text },
    json: true,
    method: "POST",
    uri,
  }

  return h(push => rp(options).then(() => {
    push(null, text)
    push(null, h.nil)
  }).catch(e => {
    push(e, h.nil)
  }))
})
.errors(h.log)
.tap(text => console.log(`Fact Written: ${text}`))
.done(() => {})
