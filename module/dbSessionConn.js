var mongoose = require('mongoose');
var database = require('./database');

module.exports = mongoose.createConnection(database.sessionDbUrl);
