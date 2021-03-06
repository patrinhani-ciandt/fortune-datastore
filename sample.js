const fortune = require('fortune');

var fortuneSchema = {
  post: {
    text: String,
    owner: ['person', 'posts']
  },
  person: {
    name: String,
    posts: [Array('post'), 'owner']
  }
};

var fortuneCfg = {
  adapter: [require(__dirname + '/lib'), {
    projectId: 'fortune-datastore-unit-tests',
    // apiEndpoint: 'http://127.0.0.1:8888',
    // keyFilename: __dirname + '/gae_key.json',
    namespace: 'fortune-adapter-test'
  }]
};

var store = fortune(fortuneSchema, fortuneCfg);

store.connect();

/* CREATE */
// Promise.all([
//   store.create('person', [ {
//     name: 'Vinicius Patrinhani'
//   } ])
//     .then((records) => { 
//       console.log('DONE!', records); 
//     })
// ])
// .then((records) => { 
//   console.log('DONE!', records); 
// })
// .catch(console.error);

// Promise.all([
//   store.create('person', [ {
//     name: 'Vinicius Patrinhani'
//   } ]).then((personRes) => {
//     var person = personRes.payload.records[0];
//     return store.create('post', [ {
//       text: 'Novo Post',
//       owner: person.id
//     } ]).then((postsRes) => {
//       person.posts = person.posts || [];
//       person.posts.push(postsRes.payload.records[0].id);
//       return store.update('person', {
//         id: person.id,
//         replace: person
//       });
//     });
//   })
// ])
// .then(function(results) { 
//   console.log('DONE!', results); 
// })
// .catch(console.error);

/* FIND */
// Promise.all([
//   store.find('person', [ 'vJygi+Iow6Rgiug+geNF' ])
// ])
// .then((results) => { 
//   console.log('DONE!', results); 
// })
// .catch(console.error);

// Promise.all([
//   store.find('person')
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

// Promise.all([
//   store.update('person', [
//     {
//       id: 'yAhnKPuje//jMGqiRhpf',
//       replace: {
//         name: 'Vinicius Patrinhani (UPDATED)'
//       }
//     },
//     {
//       id: 'n+1MxLLvwSxXSGY/PPhW',
//       replace: {
//         name: 'Vinicius Patrinhani (UPDATED)'
//       }
//     }
//   ]).then((result) => {
//     console.log('DONE!', result);
//     return result;
//   })
// ])
//   .then(function (results) {
//     console.log('DONE!', results);
//   })
//   .catch(console.error);

// console.log('DONE!'); 

/* DELETE */
// Promise.all([
//   store.delete('person', [ 'n+1MxLLvwSxXSGY/PPhW', 'md+hmtfZE8z7cAy2OprW' ])
// ])
// .then((results) => { 
//   console.log('DONE!', results); 
// })
// .catch(console.error);