'use strict';

import _ from 'lodash';
import merlotTypes from './merlot-types';

const schemes = [];

const Validator = {
  min: function(type, x, min) {
    if(type === Number) {
      return x >= min;
    }
    if(type === String) {
      return x.length >= min;
    }
  },
  max: function(type, x, max) {
    if(type === Number) {
      return x <= max;
    }
    if(type === String) {
      return x.length <= max;
    }
  },
  minItems: function(array, min) {
    return array.length >= min;
  },
  maxItems: function(array, max) {
    return array.length <= max;
  },
  enum: function(enumeration, value) {
    if(enumeration instanceof Array && enumeration.includes(value)) {
      return true;
    } else {
      return false;
    }
  },
  pattern: function(value, pattern) {
    return (value.match(new RegExp(pattern)) !== null);
  },
  required: function(value) {
    return value !== undefined;
  }
};

function rValidatePopulatedSchema(populatedSchema) {
  Object.keys(populatedSchema).forEach(entry => {
    let schemaEntry = populatedSchema[entry];
    if(schemaEntry.type || schemaEntry instanceof Array) {
      populatedSchema[entry] = validateNode(schemaEntry);
    } else if(!(schemaEntry.value && Object.keys(schemaEntry).length === 1)) {
      schemaEntry = rValidatePopulatedSchema(populatedSchema[entry]);
    }
  });
  return populatedSchema;
}

function validateNode(obj, parent) {
  //Array handling
  if(obj instanceof Array && obj.length) {
    obj.forEach(objEntry => {
      obj = validateNode(objEntry);
    });
    return obj; //Return object, since we already validated it two lines above. :-)
  }

  if(!(obj.errors && obj.errors instanceof Array)) {
    obj.errors = [];
  }

  if(obj.required && !Validator.required(obj.value)) {
    obj.errors.push('required');
    return obj; //We don't need to do any more validations here. 
  } else if(!obj.value) {
    Reflect.deleteProperty(obj, 'errors');
    return obj;
  }

  if(obj.value instanceof Array) {
    //Validations for array values.
    if(obj.minItems) {
      if(!Validator.minItems(obj.value, obj.minItems)) {
        obj.errors.push('minItems');
      }
    }
  
    if(obj.maxItems) {
      if(!Validator.maxItems(obj.value, obj.maxItems)) {
        obj.errors.push('maxItems');
      }
    }

    let tmpErrors = [];
    obj.value.forEach(value => {
      let tmpObj = _.cloneDeep(obj);
      tmpObj.value = value;
      tmpObj = validateNode(tmpObj, obj);
      if(tmpObj.errors && tmpObj.errors.length) {
        tmpObj.errors.forEach(error => {
          obj.errors.push(error);
        });
      }
    });
    obj.errors = _.uniq(obj.errors);
    if(!obj.errors.length) {
      Reflect.deleteProperty(obj, 'errors');
    }
    return obj;
  }

  //Validate Types
  if(obj.type === String) {
    obj.value = obj.type(obj.value);
  }
  if(obj.type === Number) {
    obj.value = obj.type(obj.value);
    if(!obj.value) obj.errors.push('NaN');
  }
  if(obj.type === Date) {
    obj.value = new (obj.type(obj.value));
    if(!+obj.value) obj.errors.push('invalidDate');
  }
  if(obj.type === Boolean) {
    obj.value = obj.type(obj.value);
    if(!obj.value) obj.errors.push('invalidBoolean');
  }

  //If an error occured while checking types, all other validations will fail => return here! ;)
  if(obj.errors.length) {
    return obj;
  }

  //Validate min
  if(obj.min) {
    if(!Validator.min(obj.type, obj.value, obj.min)) {
      obj.errors.push('min');
    }
  }

  //Validate max
  if(obj.max) {
    if(!Validator.max(obj.type, obj.value, obj.max)) {
      obj.errors.push('max');
    }
  }

  //Validate enumerations
  if(obj.enum) {
    if(!Validator.enum(obj.enum, obj.value)) {
      obj.errors.push('invalidValue');
    }
  }

  //Validate Regular Expression Pattern
  if(obj.pattern) {
    if(!Validator.pattern(obj.value, obj.pattern)) {
      obj.errors.push('patternMismatch');
    }
  }

  //Delete empty error properties
  if(!obj.errors.length) {
    Reflect.deleteProperty(obj, 'errors');
  }
  return obj;
}

function rTypeValidation(data, schema) {
  let isValidatedNode;
  Object.keys(data).forEach(key => {
    if(schema && schema[key]) {
      let dataEntry = data[key];
      let schemaEntry = schema[key];
      if(schema.__typeDef && !isValidatedNode) {
        isValidatedNode = true;
        return merlotTypes.execTypeValidation(data, schema.__typeDef);
      }
      if(!dataEntry.type && dataEntry instanceof Object) {
        return rTypeValidation(dataEntry, schemaEntry);
      }
    }
  });
  return data;
}

const validate = function(data, schema, schemaName) {
  let _schema = _.cloneDeep(schema);
  let populatedSchema = _.merge(_schema, rTransformData(data));
  let typeValidatedSchema = rTypeValidation(populatedSchema, getSchemaByName(schemaName));
  let validatedSchema = rValidatePopulatedSchema(typeValidatedSchema);
  return validatedSchema;
};

function rGetValidationErrors(validatedSchema, errors, path) {
  let errorsOut = [];
  Object.keys(validatedSchema).forEach(entry => {
    let tmpPath = `${path}${entry}`;
    let schemaEntry = validatedSchema[entry];
    if(schemaEntry instanceof Array) {
      //No code atm...
    } else if(schemaEntry instanceof Object && !schemaEntry.type) {
      let tmpPath = `${entry}.`;
      if(!schemaEntry.type && !(schemaEntry.type instanceof Object)) {
        let rErrorArr = rGetValidationErrors(schemaEntry, errors, tmpPath);
        if(rErrorArr.length) {
          rErrorArr.forEach(err => errorsOut.push(err));
        }
      }
      if(schemaEntry.errors) {
        errorsOut.push({ path: tmpPath, errors: schemaEntry.errors });
      }
    } else {
      if(schemaEntry.errors) {
        errorsOut.push({ path: tmpPath, errors: schemaEntry.errors });
      }
    }
  });
  return errorsOut;
}

const rTransformData = function (data) {
  Object.keys(data).forEach(entry => {
    let dataEntry = data[entry];
    if(dataEntry instanceof Array) {
      data[entry] = [{ value: dataEntry }];
    } else if(dataEntry instanceof Object) {
      data[entry] = rTransformData(dataEntry);
    } else {
      data[entry] = { value: dataEntry };
    }
  });
  return data;
};

const getValidationErrors = function(validatedSchema) {
  return rGetValidationErrors(validatedSchema, [], '');
};

const hasValidationErrors = function(validatedSchema) {

  function rFindErrors(schema) {
    let hasError = false;
    Object.keys(schema).forEach(key => {
      let schemaEntry = schema[key];
      if(schemaEntry.type) {
        if(schemaEntry.errors) {
          hasError = true;
        }
      } else if(!(schemaEntry.value && Object.keys(schemaEntry).length === 1)) {
        if(rFindErrors(schemaEntry)) {
          hasError = true;
        }
      }
    });
    return hasError;
  }

  return rFindErrors(validatedSchema);
};

const removeMetaFromSchema = function(schema) {
  let _schema = _.cloneDeep(schema);

  function rRemoveMeta(schema) {
    Object.keys(schema).forEach(key => {
      let entry = schema[key];
      if(entry.__typeDef) {
        Reflect.deleteProperty(schema[key], '__typeDef');
      }
      if(entry.__name) {
        Reflect.deleteProperty(schema[key], '__name');
      }
      if(!entry.type && entry instanceof Object) {
        schema[key] = rRemoveMeta(entry);
      }
    });
    return schema;
  }

  _schema = rRemoveMeta(_schema);
  Reflect.deleteProperty(_schema, '__name');
  return _schema;
};

const getSchemaByName = function(name) {
  let outSchema;
  schemes.forEach(schema => {
    if(schema.__name === name) {
      outSchema = schema;
    }
   });
   return outSchema;
};

const initializeSchema = function(name, schema) {
  if(getSchemaByName(name) !== undefined) {
    console.error(`Tried to initialize a Schema with name "${name}", but the name is already taken.`);
    return;
  }
  schema.__name = name;
  schema = merlotTypes.resolveTypes(schema);
  schemes.push(schema);
  return schema;
};

export default { validate, getValidationErrors, hasValidationErrors, initializeSchema, removeMetaFromSchema, rTransformData };