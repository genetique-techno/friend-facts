"use strict";
module.exports = db => ({ TableName }) => {
const output = {};
/* Rough Schema
  FactNumber: primary key
  FactText
  Author
  Unixstamp
  Votes
  Immortal
*/

// Executes a provided db method and returns a promise
const doIt = method => ({...expressions}) => new Promise((resolve, reject) => db[method]({
  TableName, ...expressions,
}, (err, data) => {
  if (err) reject(err)
  resolve(data)
}))

output.getFact = ({ Key }) => doIt("get")({Key})

output.put = ({ Item }) => doIt("put")({Item})

output.vote = (user) => ({ Key }) => {
  const params = {
    Key,
    UpdateExpression: "ADD #Votes :user",
    ExpressionAttributeNames: {
      "#Votes": "Votes",
    },
    ExpressionAttributeValues: {
      ":user": db.createSet([user]),
    },
    ReturnValues: "ALL_NEW",
  };
  return doIt("update")(params);
}

output.setImmortal = ({ Key }) => {
  const params = {
    Key,
    UpdateExpression: "set Immortal = :val",
    ExpressionAttributeValues: {
      ":val": true,
    },
    ReturnValues: "UPDATED_NEW",
  };
  return doIt("update")(params)
}

output.updateFactText = ({ Key, Author, FactText }) => {
  const params = {
    Key,
    ConditionExpression: "Author = :author",
    UpdateExpression: "set FactText = :text, Votes = :votes",
    ExpressionAttributeValues: {
      ":author": Author,
      ":text": FactText,
      ":votes": 0,
    },
    ReturnValues: "UPDATED_NEW",
  }
  return doIt("update")(params)
}

output.scanAll = ({ justNumbers = false, forceAll = false }) => {
  // justNumbers will only return fact numbers and not the full fact object
  // forceAll option forces the scan to return ALL facts, without it the scan will only return facts from the last 30 days and immortal facts

  let Unixstamp;
  if (!forceAll) {
    // create a timestamp for the beginning of a day, 30 days ago
    Unixstamp = new Date();
    Unixstamp.setHours(0);
    Unixstamp.setMinutes(0);
    Unixstamp.setMilliseconds(0);
    Unixstamp.setDate(Unixstamp.getDate() - 30)
  }

  // add a filter for facts with a creation unixstamp newer than 30 days ago, unless `forceAll` option was passed
  const filters = forceAll ? {} : {
    FilterExpression: "Unixstamp > :unixstamp or Immortal = :immortal",
    ExpressionAttributeValues: {
      ":unixstamp": Unixstamp.valueOf(),
      ":immortal": true,
    },
  }
  // build the params object
  // include a projection for FactNumber if the justNumbers option was passed
  const params = Object.assign(justNumbers ? {
    ProjectionExpression: "FactNumber",
  } : {}, filters);

  return doIt("scan")(params);
};

output.delete = ({ Key, Author }) => {
  const params = {
    Key,
    ConditionExpression: "Author = :author",
    ExpressionAttributeValues: {
      ":author": Author,
    }
  }
  return doIt("delete")(params)
}

output.createSet = db.createSet

return output;
}
