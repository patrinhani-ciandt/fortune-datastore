'use strict';

const datastore = require('@google-cloud/datastore');

const helpers = require('./helpers');
const inputRecord = helpers.inputRecord;
const outputRecord = helpers.outputRecord;
const mapValues = helpers.mapValues;
const idKey = helpers.idKey;
const generateId = helpers.generateId;

const applyOptions = require('fortune/lib/adapter/adapters/common').applyOptions;
const applyUpdate = require('fortune/lib/common/apply_update');

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
        }, (err) => {
          if (err)
            return reject(err);
            
          resolve(data);
        });

      } catch (err) {
        reject(err);
      }
    });
  }

  _runQuery(type, filters) {
    const Promise = this.Promise;

    return new Promise((resolve, reject) => {
      var query = null;
      if (this.options.namespace) {
        query = this._ds.createQuery(this.options.namespace, type);
      } else {
        query = this._ds.createQuery(type);
      }

      if (filters) {
        filters.forEach((item) => {
          let searchField = item.field;
          if (item.field === 'id') {
            searchField = '__key__';
          }
          query = query.filter(searchField, this._getDSKey(type, item.value));
        });
      }

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

  find(type, ids, options = {}, meta = {}) {
    console.log('[test][find]: ', type, ids, options, meta);

    if (ids && !ids.length) return super.find();

    const {recordTypes} = this;
    options = options || {};

    if (!ids) {
      return this._runQuery(type)
        .then((entries) => {
          return applyOptions(recordTypes[type], entries, options, meta);
        });
    }  

    var promises = [];

    ids.forEach((id) => {
      promises.push(this._runQuery(type, [ { field: 'id', value: id } ]));
    });

    const Promise = this.Promise;

    return new Promise((resolve, reject) => {
      Promise.all(promises)
        .then((results) => {
          const fn = outputRecord.bind(this, type);
          return [].concat.apply([], results);
        })
        .then((entries) => {
          return applyOptions(recordTypes[type], entries, options, meta);
        })
        .then(resolve)
        .catch(reject);
    });
  }

  create(type, records) {
    console.log('[test][create]: ', type, records);

    if (!records.length) return super.create();

    return this._createOrUpdateBatch(type, records);
  }

  update(type, updates) {
    console.log('[test][update]: ', type, updates);

    if (!updates.length) return super.update();

    const Promise = this.Promise;
    const typeMap = this.options.typeMap;
    const primaryKey = this.keys.primary;

    const updateIds = updates.map((uIds) => uIds[primaryKey]);

    return Promise.all(updates.map(update =>
      this.find(type, [ update.id ])
        .then((records) => {
          return Promise.all(records.map(record => {
            const id = record[primaryKey]
            applyUpdate(record, update)
            return this._save(type, record, record[idKey])
          }))
        })));
  }

  delete(type, ids) {
    ids = ids || [];
    console.log('[test][delete]: ', type, ids);

    if (ids && !ids.length) {
      return super.delete()
    }

    const Promise = this.Promise;
    const typeMap = this.options.typeMap;

    return Promise.all(ids.map(delId =>
      new Promise((resolve, reject) => {
        this._ds.delete(this._getDSKey(type, delId), (err) => {
          if (err)
            return reject(err);
          resolve(1);
        });
      })))
      .then((res) => [].concat.apply([], res))
      .then((res) => res.reduce((counter, added) => counter + added, 0));
  }
};