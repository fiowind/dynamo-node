const AWS = require('aws-sdk');
const ConditionalQueryBuilder = require('./lib/ConditionalQueryBuilder');

const getPromise = func => (method, params) => new Promise((resolve, reject) => {
  func[method](params, (err, data) => (err ? reject(err) : resolve(data)));
});

// Exports DynamoDB function that returns an object of methods
module.exports = (config) => {
  AWS.config.update({ region: config.region });
  if (process.env.DYNAMO_ENV === 'test') {
    AWS.config.update({
      apiVersion: '2012-08-10',
      accessKeyId: process.env.DYNAMO_ENV,
      secretAccessKey: process.env.DYNAMO_ENV,
      endpoint: 'http://localhost:8000',
    });
  } else if (config) {
    if (process.env.DYNAMO_ENV === 'test') {
      AWS.config.update({
        apiVersion: '2018-12-10',
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      });
    }
  }

  const dynamoDB = new AWS.DynamoDB();
  if (!dynamoDB.config.credentials) {
    throw new Error('Can not load AWS credentials');
  }

  const docClient = new AWS.DynamoDB.DocumentClient();
  const db = getPromise(dynamoDB);
  const doc = getPromise(docClient);

  return {
    config: dynamoDB.config,

    // Select Table and return method object for further queries
    select: TableName => new ConditionalQueryBuilder(TableName, {
      docClient,
      doc,
      db,
    }),

    createSet: params => docClient.createSet(params),
  };
};
