var mongoose = require('mongoose');
var database = require('./database');

var conn = mongoose.createConnection(database.epaperDbUrl);

//> if modified, need to modify newEmployee @ adminManage.js
module.exports = conn.model('dbEmployees', {
    name: String,
    email: String,
    password: String,
    sex: String,
    department: String,
    title: String,
    onBoardDate: Date,
    admin: Boolean
});
