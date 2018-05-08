'use strict';

import merlot from './merlot';
import _ from 'lodash';

let DEBUG = false;
let DISCOVER = false;

let registeredRoutes = {
  GET: [],
  POST: [],
  PUT: [],
  PATCH: [],
  DELETE: []
};

let registeredSchemes = {};

function isRegisteredRoute(req) {
  let out = false;
  registeredRoutes[req.method].forEach(routeData => {
    let pathMatches = req.path.match(routeData.route);
    if(pathMatches && pathMatches[0] === req.path) {
        out = routeData;
        return;
      }
  });
  return out;
}

function registerSchema(schema) {
  let _schema = {};
  _schema[schema.__name] = _.cloneDeep(merlot.removeMetaFromSchema(schema));
  registeredSchemes = _.merge(registeredSchemes, _schema);
}

function schemaAsJSON(schema) {
  let _schema = _.cloneDeep(schema);
  
  function rTypesToString(_schema) {
    Object.keys(_schema).forEach(entry => {
      let schemaEntry = _schema[entry];
      if(schemaEntry.type && schemaEntry.type instanceof Function) {
        switch(schemaEntry.type) {
          case Boolean: schemaEntry.type = 'Boolean'; break;
          case String: schemaEntry.type = 'String'; break;
          case Number: schemaEntry.type = 'Number'; break;
          case Date: schemaEntry.type = 'Date'; break;
        }
      } else {
        rTypesToString(schemaEntry);
      }
    });
    return _schema;
  }
  return rTypesToString(_schema);
}

function strictModeValidation(data, schema) {
  let _schema = _.cloneDeep(schema);
  let _data = _.cloneDeep(data);
  let dataToValueSchema = _.merge(_schema, merlot.rTransformData(_data));

  function rCheckStrictMode(populatedSchema) {
    let noError = true;
    Object.keys(populatedSchema).forEach(key => {
      let schemaEntry = populatedSchema[key];
        if(schemaEntry instanceof Object && !schemaEntry.type && !(schemaEntry.value && Object.keys(schemaEntry).length === 1)) {
          let isValid = rCheckStrictMode(schemaEntry);
          if(!isValid) {
            noError = false;
          }
        } else {
          //Check if Entry has type & value and no virtual:true
          if(schemaEntry.value && !schemaEntry.type || schemaEntry.value && schemaEntry.virtual) {
            noError = false;
          }
        }
    });
    return noError;
  }
  return rCheckStrictMode(dataToValueSchema);
}


const debug = function(value) {
  DEBUG = value;
};

const discover = function(value) {
  DISCOVER = value;
};

const registerRoute = function(method, route, schema, cfg) {
  method = method.toUpperCase();
  if(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].indexOf(method) === -1) {
    console.error(`Route ${route} can't be registered. Unknow method: ${method}`);
    return false;
  } 
  if(!route || typeof route !== 'string') {
    console.error(`${route} is not a valid route`);
    return false;
  }
  if(!(schema || schema instanceof Object)) {
    console.error(`Route ${route} can't be registered. Schema seems to be invalid.`);
    return false;
  }
  //Transform route
  route = route.replace(/(\:[a-zA-Z0-9]+)/g, '([a-zA-Z0-9]+)');
  let schemaName = schema.__name;
  if(typeof cfg !== undefined) {
    cfg.schemaName = schemaName;
    registeredRoutes[method].push({route, schema: merlot.removeMetaFromSchema(schema), cfg});
  } else {
    registeredRoutes[method].push({route, schema: merlot.removeMetaFromSchema(schema)}, { schemaName });
  }
  registerSchema(schema);
  return true;
};

const handler = function(req, res, next) {
  if(DISCOVER && req.path === '/discover') {
    res.send(schemaAsJSON(registeredSchemes));
    next();
    return;
  }
  let routeData = isRegisteredRoute(req);
  if(!routeData) {
    next();
    return;
  }

  const requestBody = _.cloneDeep(req.body);

  if(routeData.cfg.strict && !strictModeValidation(requestBody, routeData.schema)) {
    res.status(412).send(JSON.stringify({ type: 'schema', errors: 'strictModeViolation'}));
    return;
  }

  req.merlot = merlot.validate(requestBody, routeData.schema, routeData.cfg.schemaName);
  if(merlot.hasValidationErrors(req.merlot)) {
    if(routeData.cfg.validationRejection === false) {
      next();
      return;
    } else {
      res.status(412).send(JSON.stringify({ type: 'validation', errors: merlot.getValidationErrors(req.merlot) }));
    }
  } else {
    next();
  }
};

export default { debug, discover, handler, registerRoute };