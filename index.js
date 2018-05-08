'use strict';

const merlot = require('./src/merlot');
const merlotExpress = require('./src/merlot-express-middleware');
const merlotMongoose = require('./src/merlotMongoose');
const merlotTypes = require('./src/merlot-types');

module.exports = {
  core: merlot,
  express: merlotExpress,
  mongoose: merlotMongoose,
  types: merlotTypes
};