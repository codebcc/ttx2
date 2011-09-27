var db      = require('./models/connection.js');
var express = require('express');

var app = express.createServer();
app.use(express.bodyParser());

require('./routes')(app);
app.listen('3000');
