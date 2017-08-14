'use strict';

const datastore = require('@google-cloud/datastore');

const helpers = require('./helpers');
const inputRecord = helpers.inputRecord;
const outputRecord = helpers.outputRecord;
const mapValues = helpers.mapValues;
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

  _save(type, data, id, operation = 'create') {
    const Promise = this.Promise;

    const primaryKey = this.keys.primary;
    const ConflictError = this.errors.ConflictError;

    return Promise.resolve(this._getDSKey(type, id || data[primaryKey]))
      .then((key) => new Promise((resolve, reject) => {
        if (operation === 'create') {
          this._ds.get(key, (err, entity) => {
            if (err) {
              // Error handling omitted.
              return reject(err);
            }

            if (entity) {
              return reject(new ConflictError('Unique constraint violated.'));  
            }

            resolve(key);
          });
        } else {
          resolve(key);
        }
      }))
      .then((key) => new Promise((resolve, reject) => {
        try {
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
      }));
  }

  _get(key) {
    return new Promise((resolve, reject) => {
      this._ds.get(key, function(err, data) {
        if (err) {
          // Error handling omitted.
          return reject(err);
        }
        resolve(data);
      });
    });
  }

  _runQuery(type, fields, filters) {
    const Promise = this.Promise;

    return new Promise((resolve, reject) => {
      var query = null;
      if (this.options.namespace) {
        query = this._ds.createQuery(this.options.namespace, type);
      } else {
        query = this._ds.createQuery(type);
      }

      if (fields) {
        query = query.select(fields);
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

  _createOrUpdateBatch(type, records, operation = 'create') {
    const Promise = this.Promise;
    const ConflictError = this.errors.ConflictError;
    const recordsInput = records.map(inputRecord.bind(this, type));

    return new Promise((resolve, reject) => {
      var promises = [];
      recordsInput.forEach((rec) => {
        promises.push(this._save(type, rec, rec.id, operation));
      });

      const fn = outputRecord.bind(this, type);

      Promise.all(promises)
        .then((results) => [].concat.apply([], results))
        .then((results) => {
          return results.map(outputRecord.bind(this, type));
        })
        .then(resolve)
        .catch(reject);
    });
  }

  find(type, ids, options = {}, meta = {}) {
    if (ids && !ids.length) return super.find();

    const {recordTypes} = this;
    const primaryKey = this.keys.primary;
    const fields = recordTypes[type];

    let columns = Object.keys(options.fields || {})
    columns = columns.length ?
      (columns.every(column => options.fields[column]) ?
        [ primaryKey ].concat(columns) :
        [ primaryKey ].concat(Object.keys(fields)
          .filter(field => !columns.some(column => column === field)))
      ) : null;

    var promises = [];
      
    if (!ids) {
      promises.push(this._runQuery(type, columns));
    } else {
      ids.forEach((id) => {
        promises.push(this._runQuery(type, columns, [ { field: 'id', value: id } ]));
      });
    }

    const Promise = this.Promise;

    return Promise.all(promises)
        .then((results) => {
          return [].concat.apply([], results);
        })
        .then((entries) =>  {
          return applyOptions(recordTypes[type], entries, options, meta);
        })
        .then((result) => {
          const records = result.map((rec) => {
            return outputRecord.call(this, type, rec);
          });
          records.count = result.length;
          return records;
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

    return Promise.all(updates.map(update =>
      this._get(this._getDSKey(type, update.id))
        .then((record) => {
          if (!record) {
            return 0;
          }

          const id = record[primaryKey]
          applyUpdate(record, update)
          return this._save(type, record, record[primaryKey], 'update')
            .then(() => 1)
            .catch(() => 0);
        })))
        .then(results => {
          return results.reduce((num, result) => {
            num += result
            return num
          }, 0)
        });
  }

  delete(type, ids, clear = false) {
    if (ids && !ids.length) {
      return super.delete()
    }

    if (clear) {
      ids = null;
    }

    const Promise = this.Promise;
    const typeMap = this.options.typeMap;

    return Promise.resolve(ids)
      .then((ids) => {
        if (!ids || ids.length <= 0) {
          return this._runQuery(type)
            .then((data) => data.map((rec) => rec.id));
        } 
        return ids;
      })
      .then((ids) => Promise.all(ids.map(delId =>
        new Promise((resolve, reject) => {
          this._get(this._getDSKey(type, delId))
            .then((record) => {
              if (record) {
                return this._ds.delete(this._getDSKey(type, delId), (err) => {
                  if (err)
                    return reject(err);
                  resolve(1);
                });
              } else {
                resolve(0);                
              }
            })
            .catch((err) => reject(err));
        })))
        .then((res) => [].concat.apply([], res))
        .then((res) => res.reduce((counter, added) => counter + added, 0)));
  }
};