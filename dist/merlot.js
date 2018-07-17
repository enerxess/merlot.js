'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _merlotTypes = require('./merlot-types');

var _merlotTypes2 = _interopRequireDefault(_merlotTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _ = require('lodash');


var schemes = [];

var Validator = {
  min: function min(type, x, _min) {
    if (type === Number) {
      return x >= _min;
    }
    if (type === String) {
      return x.length >= _min;
    }
  },
  max: function max(type, x, _max) {
    if (type === Number) {
      return x <= _max;
    }
    if (type === String) {
      return x.length <= _max;
    }
  },
  minItems: function minItems(array, min) {
    return array.length >= min;
  },
  maxItems: function maxItems(array, max) {
    return array.length <= max;
  },
  enum: function _enum(enumeration, value) {
    if (enumeration instanceof Array && enumeration.includes(value)) {
      return true;
    } else {
      return false;
    }
  },
  pattern: function pattern(value, _pattern) {
    return value.match(new RegExp(_pattern)) !== null;
  },
  required: function required(value) {
    return value !== undefined;
  }
};

function rValidatePopulatedSchema(populatedSchema) {
  Object.keys(populatedSchema).forEach(function (entry) {
    var schemaEntry = populatedSchema[entry];
    if (schemaEntry.type || schemaEntry instanceof Array) {
      populatedSchema[entry] = validateNode(schemaEntry);
    } else if (!(schemaEntry.value && Object.keys(schemaEntry).length === 1)) {
      schemaEntry = rValidatePopulatedSchema(populatedSchema[entry]);
    }
  });
  return populatedSchema;
}

function validateNode(obj, parent) {
  //Array handling
  if (obj instanceof Array && obj.length) {
    obj.forEach(function (objEntry) {
      obj = validateNode(objEntry);
    });
    return obj; //Return object, since we already validated it two lines above. :-)
  }

  if (!(obj.errors && obj.errors instanceof Array)) {
    obj.errors = [];
  }

  if (obj.required && !Validator.required(obj.value)) {
    obj.errors.push('required');
    return obj; //We don't need to do any more validations here. 
  } else if (!obj.value) {
    Reflect.deleteProperty(obj, 'errors');
    return obj;
  }

  if (obj.value instanceof Array) {
    //Validations for array values.
    if (obj.minItems) {
      if (!Validator.minItems(obj.value, obj.minItems)) {
        obj.errors.push('minItems');
      }
    }

    if (obj.maxItems) {
      if (!Validator.maxItems(obj.value, obj.maxItems)) {
        obj.errors.push('maxItems');
      }
    }

    var tmpErrors = [];
    obj.value.forEach(function (value) {
      var tmpObj = _.cloneDeep(obj);
      tmpObj.value = value;
      tmpObj = validateNode(tmpObj, obj);
      if (tmpObj.errors && tmpObj.errors.length) {
        tmpObj.errors.forEach(function (error) {
          obj.errors.push(error);
        });
      }
    });
    obj.errors = _.uniq(obj.errors);
    if (!obj.errors.length) {
      Reflect.deleteProperty(obj, 'errors');
    }
    return obj;
  }

  //Validate Types
  if (obj.type === String) {
    obj.value = obj.type(obj.value);
  }
  if (obj.type === Number) {
    obj.value = obj.type(obj.value);
    if (!obj.value && obj.value !== 0) obj.errors.push('NaN');
  }
  if (obj.type === Date) {
    obj.value = new (obj.type(obj.value))();
    if (!+obj.value) obj.errors.push('invalidDate');
  }
  if (obj.type === Boolean) {
    obj.value = obj.type(obj.value);
    if (!obj.value) obj.errors.push('invalidBoolean');
  }

  //If an error occured while checking types, all other validations will fail => return here! ;)
  if (obj.errors.length) {
    return obj;
  }

  //Validate min
  if (obj.min) {
    if (!Validator.min(obj.type, obj.value, obj.min)) {
      obj.errors.push('min');
    }
  }

  //Validate max
  if (obj.max) {
    if (!Validator.max(obj.type, obj.value, obj.max)) {
      obj.errors.push('max');
    }
  }

  //Validate enumerations
  if (obj.enum) {
    if (!Validator.enum(obj.enum, obj.value)) {
      obj.errors.push('invalidValue');
    }
  }

  //Validate Regular Expression Pattern
  if (obj.pattern) {
    if (!Validator.pattern(obj.value, obj.pattern)) {
      obj.errors.push('patternMismatch');
    }
  }

  //Delete empty error properties
  if (!obj.errors.length) {
    Reflect.deleteProperty(obj, 'errors');
  }
  return obj;
}

function rTypeValidation(data, schema) {
  var isValidatedNode = void 0;
  Object.keys(data).forEach(function (key) {
    if (schema && schema[key]) {
      var dataEntry = data[key];
      var schemaEntry = schema[key];
      if (schema.__typeDef && !isValidatedNode) {
        isValidatedNode = true;
        return _merlotTypes2.default.execTypeValidation(data, schema.__typeDef);
      }
      if (!dataEntry.type && dataEntry instanceof Object) {
        return rTypeValidation(dataEntry, schemaEntry);
      }
    }
  });
  return data;
}

var validate = function validate(data, schema, schemaName) {
  var _schema = _.cloneDeep(schema);
  var populatedSchema = _.merge(_schema, rTransformData(data));
  var typeValidatedSchema = rTypeValidation(populatedSchema, getSchemaByName(schemaName));
  var validatedSchema = rValidatePopulatedSchema(typeValidatedSchema);
  return validatedSchema;
};

function rGetValidationErrors(validatedSchema, errors, path) {
  var errorsOut = [];
  Object.keys(validatedSchema).forEach(function (entry) {
    var tmpPath = '' + path + entry;
    var schemaEntry = validatedSchema[entry];
    if (schemaEntry instanceof Array) {
      //No code atm...
    } else if (schemaEntry instanceof Object && !schemaEntry.type) {
      var _tmpPath = entry + '.';
      if (!schemaEntry.type && !(schemaEntry.type instanceof Object)) {
        var rErrorArr = rGetValidationErrors(schemaEntry, errors, _tmpPath);
        if (rErrorArr.length) {
          rErrorArr.forEach(function (err) {
            return errorsOut.push(err);
          });
        }
      }
      if (schemaEntry.errors) {
        errorsOut.push({ path: _tmpPath, errors: schemaEntry.errors });
      }
    } else {
      if (schemaEntry.errors) {
        errorsOut.push({ path: tmpPath, errors: schemaEntry.errors });
      }
    }
  });
  return errorsOut;
}

var rTransformData = function rTransformData(data) {
  Object.keys(data).forEach(function (entry) {
    var dataEntry = data[entry];
    if (dataEntry instanceof Array) {
      data[entry] = [{ value: dataEntry }];
    } else if (dataEntry instanceof Object) {
      data[entry] = rTransformData(dataEntry);
    } else {
      data[entry] = { value: dataEntry };
    }
  });
  return data;
};

var getValidationErrors = function getValidationErrors(validatedSchema) {
  return rGetValidationErrors(validatedSchema, [], '');
};

var hasValidationErrors = function hasValidationErrors(validatedSchema) {

  function rFindErrors(schema) {
    var hasError = false;
    Object.keys(schema).forEach(function (key) {
      var schemaEntry = schema[key];
      if (schemaEntry.type) {
        if (schemaEntry.errors) {
          hasError = true;
        }
      } else if (!(schemaEntry.value && Object.keys(schemaEntry).length === 1)) {
        if (rFindErrors(schemaEntry)) {
          hasError = true;
        }
      }
    });
    return hasError;
  }

  return rFindErrors(validatedSchema);
};

var removeMetaFromSchema = function removeMetaFromSchema(schema) {
  var _schema = _.cloneDeep(schema);

  function rRemoveMeta(schema) {
    Object.keys(schema).forEach(function (key) {
      var entry = schema[key];
      if (entry.__typeDef) {
        Reflect.deleteProperty(schema[key], '__typeDef');
      }
      if (entry.__name) {
        Reflect.deleteProperty(schema[key], '__name');
      }
      if (!entry.type && entry instanceof Object) {
        schema[key] = rRemoveMeta(entry);
      }
    });
    return schema;
  }

  _schema = rRemoveMeta(_schema);
  Reflect.deleteProperty(_schema, '__name');
  return _schema;
};

var getSchemaByName = function getSchemaByName(name) {
  var outSchema = void 0;
  schemes.forEach(function (schema) {
    if (schema.__name === name) {
      outSchema = schema;
    }
  });
  return outSchema;
};

var initializeSchema = function initializeSchema(name, schema) {
  if (getSchemaByName(name) !== undefined) {
    console.error('Tried to initialize a Schema with name "' + name + '", but the name is already taken.');
    return;
  }
  schema.__name = name;
  schema = _merlotTypes2.default.resolveTypes(schema);
  schemes.push(schema);
  return schema;
};

exports.default = { validate: validate, getValidationErrors: getValidationErrors, hasValidationErrors: hasValidationErrors, initializeSchema: initializeSchema, removeMetaFromSchema: removeMetaFromSchema, rTransformData: rTransformData, Validator: Validator };