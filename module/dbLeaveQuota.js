var mongoose = require('mongoose');
var database = require('./database');

var conn = mongoose.createConnection(database.epaperDbUrl);

module.exports = conn.model('dbLeaveQuota', {
    email: String,
    name: [String],
    info: [String],
    total: [Number],
    used: [Number]
});
