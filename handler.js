'use strict';
const AWS = require("aws-sdk");
AWS.config.update({ region: process.env.AWS_DEFAULT_REGION });
const dynamoDb = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

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

// scan
dynamoDb.scan({
  TableName: "test",
}, (err, data) => {

  const response = {
    statusCode: 200,
    body: JSON.stringify(data),
  };

  callback(null, response);

})



  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
};
