'use strict';

const merlot = require('./dist/merlot');
const merlotExpress = require('./dist/merlot-express-middleware');
const merlotMongoose = require('./dist/merlot-mongoose');
const merlotTypes = require('./dist/merlot-types');

module.exports = {
  core: merlot,
  express: merlotExpress,
  mongoose: merlotMongoose,
  types: merlotTypes
};