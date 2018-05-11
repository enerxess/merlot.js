'use strict';

const merlot = require('./dist/merlot');
const merlotExpress = require('./dist/merlot-express-middleware');
const merlotMongoose = require('./dist/merlot-mongoose');
const merlotTypes = require('./dist/merlot-types');

const exportObj = merlot;
exportObj.express = merlotExpress.default;
exportObj.mongoose = merlotMongoose.default;
exportObj.types = merlotTypes.default;

module.exports = exportObj;