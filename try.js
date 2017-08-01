const fortune = require('fortune');

var fortuneSchema = {
  post: {
    text: String
  }
};

var fortuneCfg = {
  adapter: [ require(__dirname + '/lib'), {
    projectId: 'ciandt-cognitive-sandbox',
    keyFilename: __dirname + '/gae_key.json',
    namespace: 'fortune-adapter-test'
  }]
};

var store = fortune(fortuneSchema, fortuneCfg);

store.connect();

/* CREATE */
// Promise.all([
//   store.create('post', [ {
//     text: 'Vinicius Patrinhani'
//   }, {
//     text: 'Lucas Polo'
//   } ])
// ])
// .then(function(results) { 
//   console.log('DONE!', results); 
// })
// .catch(console.error);

/* FIND */
// Promise.all([
//   store.find('post', [ 'LyC+DSgFQIcfD8VzDC8l', 'QuKqS98Y6GWJjsBKB+Mk' ])
// ])
// .then((results) => { 
//   console.log('DONE!', results); 
// })
// .catch(console.error);

/* UPDATE */
// Promise.all([
//   store.update('post', {
//     id: 'x6vim6iKVFSsWViFGs3y',
//     replace: {
//       text: 'Vinicius Patrinhani (UPDATED)'
//     }
//   }).then((result) => {
//     console.log('DONE!', result); 
//     return result;
//   })
// ])
// .then(function(results) { 
//   console.log('DONE!', results); 
// })
// .catch(console.error);

// console.log('DONE!'); 
