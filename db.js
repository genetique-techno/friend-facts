"use strict";
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });
const dynamoDb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

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
const db = method => ({...expressions}) => new Promise((resolve, reject) => dynamoDb[method]({
  TableName, ...expressions,
}, (err, data) => {
  if (err) reject(err)
  resolve(data)
}))

exports.getFact = ({ Key }) => db("get")({Key})

exports.put = ({ Item }) => db("put")({Item})

exports.delete = ({ Key }) => db("delete")({Key})

exports.vote = ({ Key }) => {
  const params = {
    Key,
    UpdateExpression: "set Votes = Votes + :incr",
    ExpressionAttributeValues: {
      ":incr": 1,
    },
    ReturnValues: "UPDATED_NEW",
  };
  return db("update")(params);
}

exports.setImmortal = ({ Key }) => {
  const params = {
    Key,
    UpdateExpression: "set Immortal = :val",
    ExpressionAttributeValues: {
      ":val": true,
    },
    ReturnValues: "UPDATED_NEW",
  };
  return db("update")(params)
}

exports.updateText = (author, text) => ({ Key }) => {
  const params = {
    Key,
    ConditionExpression: "Author = :author",
    UpdateExpression: "set Text = :text, Votes = :votes",
    ExpressionAttributeValues: {
      ":author": author,
      ":text": text,
      ":votes": 0,
    },
    ReturnValues: "UPDATED_NEW",
  }
  return db("update")(params)
}

exports.getFactNumbersList = (justNumbers, forceAll) => {

  let Unixstamp;
  if (!forceAll) {
    Unixstamp = new Date();
    Unixstamp.setDate(0);
    Unixstamp.setHours(0);
    Unixstamp.setMinutes(0);
    Unixstamp.setMilliseconds(0);
  }

  const filters = forceAll ? {} : {
    FilterExpression: "Unixstamp > :unixstamp", // OR Immortal = :immortal",
    ExpressionAttributeValues: {
      ":unixstamp": Unixstamp,
      // ":immortal": true,
    },
  }
  const params = Object.assign({
    ProjectionExpression: justNumbers ? "FactNumber" : "",
  }, filters);

  return db("scan")(params);
};

