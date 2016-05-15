var mongoose = require('mongoose');
var database = require('./database');

var conn = mongoose.createConnection(database.epaperDbUrl);

module.exports = conn.model('dbDepartment', {
    name: String,
    subDep: [String],
    member: [String],
    email: [String],
    title: [String]
});
