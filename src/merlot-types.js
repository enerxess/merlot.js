'use strict';

import _ from 'lodash';

import merlotMongoose from "./merlot-mongoose";

const types = [];

const defaultBeforeFilter = function(val) { return val; };
const defaultAfterFilter = function(val) { return val; };
const defaultValidation = function(val) { return val; };

const registerType = function(name, config) {
  if(!(config.schema && config.schema instanceof Object && Object.keys(config.schema).length)) {
    console.error(`Error creating Type ${name}: schema must be an object with at least one key.`);
  }

  const newTypeTemplate = {
    before: config.before || defaultBeforeFilter,
    after: config.after || defaultAfterFilter,
    validation: config.validation || defaultValidation,
    schema: config.schema
  };
  types.push({name, type: newTypeTemplate });
  return newTypeTemplate;
};

const getTypeByName = function(name) {
  let outType;
  types.forEach(typeObj => {
    if(typeObj.name === name) {
      outType = typeObj.type;
    }
  });
  return outType;
};

const resolveTypes = function(schema, isRecursiveCall) {
  Object.keys(schema).forEach(key => {
    let entry = schema[key];
    if(entry.type) {
      if(typeof entry.type === 'string') {
        let customType = getTypeByName(entry.type);
        if(!customType) {
          console.error(`Error while processing schema. An invalid Type "${entry.type}" has been referenced. Reference-Type has been substituted with "Mixed".`);
          entry.type = merlotMongoose.TYPE_MIXED;
          return;
        }
        schema[key] = customType.schema;
        schema[key].__typeDef = {
          name: entry.type,
          before: customType.before,
          after: customType.after,
          validation: customType.validation,
        };
      }
    } else if(entry instanceof Object) {      
      schema[key] = resolveTypes(entry, true);
    }
  });
  if(typeof isRecursiveCall === 'undefined') {
  } 
  return schema;
};

const execTypeValidation = function(data, typeDef) {
  return typeDef.after(typeDef.validation(typeDef.before(data)));
};

const getValue = function(obj, path) {
  return _.get(obj, `${path}.value`);
};

const setValue = function(obj, path, val) {
  _.set(obj, `${path}.value`, val);
};

const addError = function(obj, path, err) {
  if(obj[path]) {
    if(obj[path].errors) {
      obj[path].errors.push(err);
    } else {
      obj[path].errors = [err];
    }
  }
};

export default { execTypeValidation, getValue, setValue, addError, getTypeByName, registerType, resolveTypes };