const testAdapter = require('fortune/test/adapter');
const adapter = require('../lib');

testAdapter(adapter, {
  projectId: 'my-project-id',
  keyFilename: __dirname + '/../gae_key.json',
  namespace: 'fortune-adapter-test',
  generateId: () => Math.floor(Math.random() * Math.pow(2, 32)).toString(16)
});