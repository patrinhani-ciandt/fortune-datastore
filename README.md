[![Code Climate](https://codeclimate.com/github/patrinhani-ciandt/fortune-datastore/badges/gpa.svg)](https://codeclimate.com/github/patrinhani-ciandt/fortune-datastore)
[![Travis-CI](https://travis-ci.org/patrinhani-ciandt/fortune-datastore.svg?branch=master)](https://travis-ci.org/patrinhani-ciandt/fortune-datastore)

# Fortune Google Cloud Datastore Adapter

This is a [Google Cloud Datastore](https://cloud.google.com/datastore/) adapter for [Fortune](http://fortune.js.org).

## Usage

Install the `fortune-datastore` package from `npm` or `yarn`:

```git 
$ npm install fortune-datastore
```
or
```git 
$ yarn add fortune-datastore
```

Then use it with Fortune:

```js
import fortune from 'fortune'
import datastoreAdapter from 'fortune-datastore'

const store = fortune({...},  {
  adapter: [
    datastoreAdapter,
    {
      projectId: 'my-gcp-project-id',
      keyFilename: 'gae_service_account_key.json',
      namespace: 'fortune-adapter-test'
    }
  ]
})
```


## Adapter Options


Event    | Description
:------------- | :-------------
generateId   | Generate the id key on a new record. It must be a function that accepts one argument, the record type, and returns a unique string or number. Optional.
projectId | The project ID from the Google Developer's Console, e.g. 'grape-spaceship-123'. We will also check the environment variable GCLOUD_PROJECT for your project ID. If your app is running in an environment which supports [Application Default Credentials](https://developers.google.com/identity/protocols/application-default-credentials), your project ID will be detected automatically.
keyFilename | Full path to the a .json, .pem, or .p12 key downloaded from the Google Developers Console. If you provide a path to a JSON file, the projectId option above is not necessary. NOTE: .pem and .p12 require you to specify options.email as well.
namespace | Namespace to isolate transactions to.

## License

This software is licensed under the MIT License.
