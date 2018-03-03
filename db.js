"use strict";
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });
const dynamoDb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
const h = require("highland");

const TableName = "test";

/* Rough Schema
  FactNumber: primary key
  Text
  Author
  Unixstamp
  Votes
  Immortal
*/

// Executes a provided dynamoDb method and returns a highland stream
const go = method => ({...expressions}) => h.wrapCallback(dynamoDb[method])({
  TableName,
  ...expressions,
});

// put a new item
exports.put = ({ Item }) => h.of({ Item })
  .flatMap(go("put"))

exports.delete = ({ Key }) => h.of({ Key })
  .flatMap(go("delete"))

// increments the Votes property of a particular Fact
exports.vote = ({ Key }) => h.of(Key)
  .map(Key => ({
    Key,
    UpdateExpression: "set Votes = Votes + :incr",
    ExpressionAttributeValues: {
      ":incr": 1,
    },
    ReturnValues: "UPDATED_NEW",
  }))
  .flatMap(go("update"))

// sets the Immortal property to true
exports.setImmortal = ({ Key }) => h.of(Key)
  .map(Key => ({
    Key,
    UpdateExpression: "set Immortal = :val",
    ExpressionAttributeValues: {
      ":val": true,
    },
    ReturnValues: "UPDATED_NEW",
  }))
  .flatMap(go("update"))

// allows a matching author to update the text of their fact, resets votes on the fact
exports.updateText = (author, text) => ({ Key }) => h.of({Key})
  .map(Key => ({
    Key,
    ConditionExpression: "Author = :author",
    UpdateExpression: "set Text = :text, Votes = :votes",
    ExpressionAttributeValues: {
      ":author": author,
      ":text": text,
      ":votes": 0,
    },
    ReturnValues: "UPDATED_NEW",
  }))
  .flatMap(go("update"))

// get a list of fact numbers within the current month, includes all Immortal facts
exports.getFactNumbersList = (forceAll) => {

  let Unixstamp;
  if (!forceAll) {
    Unixstamp = new Date();
    Unixstamp.setDate(0);
    Unixstamp.setHours(0);
    Unixstamp.setMinutes(0);
    Unixstamp.setMilliseconds(0);
  }

  return h.of(forceAll ? {} : {
    FilterExpression: "Unixstamp > :unixstamp OR Immortal = :immortal"
    ExpressionAttributeValues: {
      ":unixstamp": Unixstamp,
      ":immortal": true,
    },
  })
    .map(({...expressions}) => ({
      ProjectionExpression: "FactNumber",
      ...expressions,
    }))
    .flatMap(go("scan"))
};

// get a specific fact by providing FactNumber
exports.getFact = ({ Key }) => h.of({Key})
  .flatMap(go("get"))
