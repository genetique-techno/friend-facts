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

// Executes a provided db method and returns a highland stream
const doIt = method => ({...expressions}) => new Promise((resolve, reject) => db[method]({
  TableName, ...expressions,
}, (err, data) => {
  if (err) reject(err)
  resolve(data)
}))

output.getFact = ({ Key }) => doIt("get")({Key})

output.put = ({ Item }) => doIt("put")({Item})

output.delete = ({ Key }) => doIt("delete")({Key})

output.vote = (user) => ({ Key }) => {
  const params = {
    Key,
    UpdateExpression: "add #Votes :user",
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

  let Unixstamp;
  if (!forceAll) {
    Unixstamp = new Date();
    Unixstamp.setDate(0);
    Unixstamp.setHours(0);
    Unixstamp.setMinutes(0);
    Unixstamp.setMilliseconds(0);
  }

  const filters = forceAll ? {} : {
    FilterExpression: "Unixstamp > :unixstamp or Immortal = :immortal",
    ExpressionAttributeValues: {
      ":unixstamp": Unixstamp.valueOf(),
      ":immortal": true,
    },
  }
  const params = Object.assign(justNumbers ? {
    ProjectionExpression: "FactNumber",
  } : {}, filters);

  return doIt("scan")(params);
};

output.createSet = db.createSet;

return output;
}
