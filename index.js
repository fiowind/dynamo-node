const AWS = require('aws-sdk');
const ConditionalQueryBuilder = require('./lib/ConditionalQueryBuilder');

const getPromise = func => (method, params) => new Promise((resolve, reject) => {
  func[method](params, (err, data) => (err ? reject(err) : resolve(data)));
});

// Exports DynamoDB function that returns an object of methods
module.exports = (conf) => {
  AWS.config.update({ region: 'ap-northeast-1' });

  AWS.config.update(conf);

  AWS.CredentialProviderChain.defaultProviders = [
    function () { return new AWS.EnvironmentCredentials('AWS'); },
    function () { return new AWS.EnvironmentCredentials('AMAZON'); },
    function () { return new AWS.SharedIniFileCredentials(); },
    function () {
      // if AWS_CONTAINER_CREDENTIALS_RELATIVE_URI is set
      if(process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI) {
        return new AWS.ECSCredentials();
      } else {
        return new AWS.EC2MetadataCredentials();
      }
    }
  ]

  const dynamoDB = new AWS.DynamoDB();

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
