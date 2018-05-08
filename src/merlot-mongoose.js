'use strict';

import merlot from './merlot';
import mongoose from 'mongoose';

const mongooseModels = [];

const TYPE_MIXED = mongoose.Schema.Types.Mixed;

const registerSchemaToMongoose = function(mongoose, schema) {
  const schemaName = schema.__name;
  mongooseModels.push({name: schemaName, model: mongoose.model(schemaName, merlot.removeMetaFromSchema(schema))});
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