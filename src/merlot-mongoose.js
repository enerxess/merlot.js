'use strict';

import merlot from './merlot';
import mongoose from 'mongoose';

const mongooseModels = [];

const TYPE_MIXED = mongoose.Schema.Types.Mixed;

const registerSchemaToMongoose = function(mongoose, schema, schemaOptions, plugin) {
  if(typeof schemaOptions === 'undefined') {
    schemaOptions = {};
  }
  const schemaName = schema.__name;
  const cleanedSchema =  new mongoose.Schema(merlot.removeMetaFromSchema(schema), schemaOptions);
  if(typeof plugin !== 'undefined') {
    if(plugin.config) {
      cleanedSchema.plugin(plugin.plugin, plugin.config);
    } else {
      cleanedSchema.plugin(plugin.plugin);
    }
  }
  mongooseModels.push({name: schemaName, model: mongoose.model(schemaName, cleanedSchema)});
};

const getMongooseModel = function(name) {
  let outModel;
  mongooseModels.forEach(mongooseModel => {
    if(mongooseModel.name === name) {  
      outModel = mongooseModel.model;
    }
  });
  return outModel;
};

export default { registerSchemaToMongoose, getMongooseModel, TYPE_MIXED };