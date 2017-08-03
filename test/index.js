const testAdapter = require('fortune/test/adapter');
const adapter = require('../lib');

testAdapter(adapter, {
  projectId: 'fortune-datastore-unit-tests',
  apiEndpoint: 'http://localhost:8888',
  namespace: 'fortune-adapter-test',
  generateId: () => Math.floor(Math.random() * Math.pow(2, 32)).toString(16)
});