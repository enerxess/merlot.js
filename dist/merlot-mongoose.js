'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _merlot = require('./merlot');

var _merlot2 = _interopRequireDefault(_merlot);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var mongooseModels = [];

var TYPE_MIXED = _mongoose2.default.Schema.Types.Mixed;

var registerSchemaToMongoose = function registerSchemaToMongoose(mongoose, schema, schemaOptions, plugin) {
  if (typeof schemaOptions === 'undefined') {
    schemaOptions = {};
  }
  var schemaName = schema.__name;
  var cleanedSchema = new mongoose.Schema(_merlot2.default.removeMetaFromSchema(schema), schemaOptions);
  if (typeof plugin !== 'undefined') {
    if (plugin.config) {
      cleanedSchema.plugin(plugin.plugin, plugin.config);
    } else {
      cleanedSchema.plugin(plugin.plugin);
    }
  }
  mongooseModels.push({ name: schemaName, model: mongoose.model(schemaName, cleanedSchema) });
};

var getMongooseModel = function getMongooseModel(name) {
  var outModel = void 0;
  mongooseModels.forEach(function (mongooseModel) {
    if (mongooseModel.name === name) {
      outModel = mongooseModel.model;
    }
  });
  return outModel;
};

exports.default = { registerSchemaToMongoose: registerSchemaToMongoose, getMongooseModel: getMongooseModel, TYPE_MIXED: TYPE_MIXED };