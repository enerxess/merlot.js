'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _merlot = require('./merlot');

var _merlot2 = _interopRequireDefault(_merlot);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DEBUG = false;
var DISCOVER = false;

var registeredRoutes = {
  GET: [],
  POST: [],
  PUT: [],
  PATCH: [],
  DELETE: []
};

var registeredSchemes = {};

function isRegisteredRoute(req) {
  var out = false;
  registeredRoutes[req.method].forEach(function (routeData) {
    var pathMatches = req.path.match(routeData.route);
    if (pathMatches && pathMatches[0] === req.path) {
      out = routeData;
      return;
    }
  });
  return out;
}

function registerSchema(schema) {
  var _schema = {};
  _schema[schema.__name] = _lodash2.default.cloneDeep(_merlot2.default.removeMetaFromSchema(schema));
  registeredSchemes = _lodash2.default.merge(registeredSchemes, _schema);
}

function schemaAsJSON(schema) {
  var _schema = _lodash2.default.cloneDeep(schema);

  function rTypesToString(_schema) {
    Object.keys(_schema).forEach(function (entry) {
      var schemaEntry = _schema[entry];
      if (schemaEntry.type && schemaEntry.type instanceof Function) {
        switch (schemaEntry.type) {
          case Boolean:
            schemaEntry.type = 'Boolean';break;
          case String:
            schemaEntry.type = 'String';break;
          case Number:
            schemaEntry.type = 'Number';break;
          case Date:
            schemaEntry.type = 'Date';break;
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
  var _schema = _lodash2.default.cloneDeep(schema);
  var _data = _lodash2.default.cloneDeep(data);
  var dataToValueSchema = _lodash2.default.merge(_schema, _merlot2.default.rTransformData(_data));

  function rCheckStrictMode(populatedSchema) {
    var noError = true;
    Object.keys(populatedSchema).forEach(function (key) {
      var schemaEntry = populatedSchema[key];
      if (schemaEntry instanceof Object && !schemaEntry.type && !(schemaEntry.value && Object.keys(schemaEntry).length === 1)) {
        var isValid = rCheckStrictMode(schemaEntry);
        if (!isValid) {
          noError = false;
        }
      } else {
        //Check if Entry has type & value and no virtual:true
        if (schemaEntry.value && !schemaEntry.type || schemaEntry.value && schemaEntry.virtual) {
          noError = false;
        }
      }
    });
    return noError;
  }
  return rCheckStrictMode(dataToValueSchema);
}

var debug = function debug(value) {
  DEBUG = value;
};

var discover = function discover(value) {
  DISCOVER = value;
};

var registerRoute = function registerRoute(method, route, schema, cfg) {
  method = method.toUpperCase();
  if (['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].indexOf(method) === -1) {
    console.error('Route ' + route + ' can\'t be registered. Unknow method: ' + method);
    return false;
  }
  if (!route || typeof route !== 'string') {
    console.error(route + ' is not a valid route');
    return false;
  }
  if (!(schema || schema instanceof Object)) {
    console.error('Route ' + route + ' can\'t be registered. Schema seems to be invalid.');
    return false;
  }
  //Transform route
  route = route.replace(/(\:[a-zA-Z0-9]+)/g, '([a-zA-Z0-9]+)');
  var schemaName = schema.__name;
  if ((typeof cfg === 'undefined' ? 'undefined' : _typeof(cfg)) !== undefined) {
    cfg.schemaName = schemaName;
    registeredRoutes[method].push({ route: route, schema: _merlot2.default.removeMetaFromSchema(schema), cfg: cfg });
  } else {
    registeredRoutes[method].push({ route: route, schema: _merlot2.default.removeMetaFromSchema(schema) }, { schemaName: schemaName });
  }
  registerSchema(schema);
  return true;
};

var handler = function handler(req, res, next) {
  if (DISCOVER && req.path === '/discover') {
    res.send(schemaAsJSON(registeredSchemes));
    next();
    return;
  }
  var routeData = isRegisteredRoute(req);
  if (!routeData) {
    next();
    return;
  }

  var requestBody = _lodash2.default.cloneDeep(req.body);

  if (routeData.cfg.strict && !strictModeValidation(requestBody, routeData.schema)) {
    res.status(412).send(JSON.stringify({ type: 'schema', errors: 'strictModeViolation' }));
    return;
  }

  req.merlot = _merlot2.default.validate(requestBody, routeData.schema, routeData.cfg.schemaName);
  if (_merlot2.default.hasValidationErrors(req.merlot)) {
    if (routeData.cfg.validationRejection === false) {
      next();
      return;
    } else {
      res.status(412).send(JSON.stringify({ type: 'validation', errors: _merlot2.default.getValidationErrors(req.merlot) }));
    }
  } else {
    next();
  }
};

exports.default = { debug: debug, discover: discover, handler: handler, registerRoute: registerRoute };