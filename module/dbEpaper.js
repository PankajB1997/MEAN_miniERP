var mongoose = require('mongoose');
var database = require('./database');

var conn = mongoose.createConnection(database.epaperDbUrl);

module.exports = conn.model('dbEpaper', {
    applicant: String,
    date: Date,
    type: String,
    status: String,
    approver: [{name: String, status: String}],
    data: mongoose.Schema.Types.Mixed,
    record: [{name: String, status: String, date: Date}]
});
