'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _merlotMongoose = require('./merlot-mongoose');

var _merlotMongoose2 = _interopRequireDefault(_merlotMongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var types = [];

var defaultBeforeFilter = function defaultBeforeFilter(val) {
  return val;
};
var defaultAfterFilter = function defaultAfterFilter(val) {
  return val;
};
var defaultValidation = function defaultValidation(val) {
  return val;
};

var registerType = function registerType(name, config) {
  if (!(config.schema && config.schema instanceof Object && Object.keys(config.schema).length)) {
    console.error('Error creating Type ' + name + ': schema must be an object with at least one key.');
  }

  var newTypeTemplate = {
    before: config.before || defaultBeforeFilter,
    after: config.after || defaultAfterFilter,
    validation: config.validation || defaultValidation,
    schema: config.schema
  };
  types.push({ name: name, type: newTypeTemplate });
  return newTypeTemplate;
};

var getTypeByName = function getTypeByName(name) {
  var outType = void 0;
  types.forEach(function (typeObj) {
    if (typeObj.name === name) {
      outType = typeObj.type;
    }
  });
  return outType;
};

var resolveTypes = function resolveTypes(schema, isRecursiveCall) {
  Object.keys(schema).forEach(function (key) {
    var entry = schema[key];
    if (entry.type) {
      if (typeof entry.type === 'string') {
        var customType = getTypeByName(entry.type);
        if (!customType) {
          console.error('Error while processing schema. An invalid Type "' + entry.type + '" has been referenced. Reference-Type has been substituted with "Mixed".');
          entry.type = _merlotMongoose2.default.TYPE_MIXED;
          return;
        }
        schema[key] = customType.schema;
        schema[key].__typeDef = {
          name: entry.type,
          before: customType.before,
          after: customType.after,
          validation: customType.validation
        };
      }
    } else if (entry instanceof Object) {
      schema[key] = resolveTypes(entry, true);
    }
  });
  if (typeof isRecursiveCall === 'undefined') {}
  return schema;
};

var execTypeValidation = function execTypeValidation(data, typeDef) {
  return typeDef.after(typeDef.validation(typeDef.before(data)));
};

var getValue = function getValue(obj, path) {
  return _lodash2.default.get(obj, path + '.value');
};

var setValue = function setValue(obj, path, val) {
  _lodash2.default.set(obj, path + '.value', val);
};

var addError = function addError(obj, path, err) {
  if (obj[path]) {
    if (obj[path].errors) {
      obj[path].errors.push(err);
    } else {
      obj[path].errors = [err];
    }
  }
};

exports.default = { execTypeValidation: execTypeValidation, getValue: getValue, setValue: setValue, addError: addError, getTypeByName: getTypeByName, registerType: registerType, resolveTypes: resolveTypes };