const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async () => {
  const mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI_TEST = mongod.getUri();
  process.env.JWT = 'test-secret-key-for-jest';
  global.__MONGOD__ = mongod;
};
