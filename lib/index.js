'use strict';

const datastore = require('@google-cloud/datastore');

const helpers = require('./helpers');
const inputRecord = helpers.inputRecord;
const outputRecord = helpers.outputRecord;
const mapValues = helpers.mapValues;
const idKey = helpers.idKey;
const generateId = helpers.generateId;

const adapterOptions = new Set(['generateId', 'typeMap']);

module.exports = Adapter => class DatastoreAdapter extends Adapter {

  connect() {
    const Promise = this.Promise;
    const options = this.options;

    const parameters = {};

    if (!('generateId' in options)) options.generateId = generateId;
    if (!('typeMap' in options)) options.typeMap = {};

    for (const key in options) {
      if (!adapterOptions.has(key)) {
        parameters[key] = options[key];
      }
    }

    if (!this._ds) {
      this._ds = datastore(parameters);
    }

    return this.Promise.resolve();
  }

  disconnect() {
    if (this._ds) {
      this._ds = null;
    }

    return this.Promise.resolve();
  }

  _getDSKey(type, key) {
    var keyParam = [type, key];
    if (this.options.namespace) {
      keyParam = {
        namespace: this.options.namespace,
        path: keyParam
      };
    }
    return this._ds.key(keyParam);
  }

  _save(type, data, id) {
    const Promise = this.Promise;

    return new Promise((resolve, reject) => {
      try {
        var key = this._getDSKey(type, id || data[idKey]);

        this._ds.save({
          key: key,
          data: data
        }, () => {
          resolve(data);
        });

      } catch (err) {
        reject(err);
      }
    });
  }

  _runQuery(type, id) {
    const Promise = this.Promise;

    return new Promise((resolve, reject) => {
      var query = null;
      if (this.options.namespace) {
        query = this._ds.createQuery(this.options.namespace, type);
      } else {
        query = this._ds.createQuery(type);
      }

      query = query.filter('__key__', this._getDSKey(type, id));

      this._ds.runQuery(query, function (err, entities) {
        if (err)
          return reject(err);

        var list = (entities || []).map(function (entity) {
          return entity;
        });

        resolve(list);
      });
    });
  }

  _createOrUpdateBatch(type, records) {
    const Promise = this.Promise;
    const ConflictError = this.errors.ConflictError;
    const recordsInput = records.map(inputRecord.bind(this, type));

    return new Promise((resolve, reject) => {
      var promises = [];
      recordsInput.forEach((rec) => {
        promises.push(this._save(type, rec));
      });

      const fn = outputRecord.bind(this, type);

      Promise.all(promises)
        .then((results) => {
          const fn = outputRecord.bind(this, type);
          return [].concat.apply([], results);
        })
        .then(resolve)
        .catch(reject);
    });
  }

  find(type, ids, options) {
    if (ids && !ids.length) return super.find();

    options = options || {};

    var promises = [];

    ids.forEach((id) => {
      promises.push(this._runQuery(type, id));
    });

    const Promise = this.Promise;

    return new Promise((resolve, reject) => {
      Promise.all(promises)
        .then((results) => {
          const fn = outputRecord.bind(this, type);
          return [].concat.apply([], results);
        })
        .then(resolve)
        .catch(reject);
    });
  }

  create(type, records) {
    if (!records.length) return super.create();

    return this._createOrUpdateBatch(type, records);
  }

  update(type, updates) {
    if (!updates.length) return super.update();

    const Promise = this.Promise;
    const typeMap = this.options.typeMap;
    const primaryKey = this.keys.primary;

    const updateIds = updates.map((uIds) => uIds[primaryKey]);

    return Promise.all(updates.map(update =>
      new Promise((resolve, reject) => {
        var changes = null;

        if ('replace' in update && Object.keys(update.replace).length)
          changes = update.replace;
        if (changes) {
          changes[idKey] = update[idKey];

          this._save(type, changes, update[idKey])
            .then(resolve)
            .catch(reject);
        } else {
          resolve();
        }
      })));
  }
};