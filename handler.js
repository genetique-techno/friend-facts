'use strict';

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


module.exports.put = (event, context, callback) => {

  callback(null, { statusCode: 200, body: JSON.stringify(event)});
  // put an Item
  // dynamoDb.put({
  //   TableName: "test",
  //   Item: {
  //     Enabled: 1,
  //     Unixstamp: Date.now(),
  //     FactNumber: 1,
  //     Author: "Aaron",
  //     Test: "this is a fact",
  //     Votes: 0
  //   }
  // }, (err, data) => {
  //   callback(null, { statusCode: 200, body: JSON.stringify(data) });
  // })
}

module.exports.get = (event, context, callback) => {


  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
