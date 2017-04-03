var express = require('express');
var cors = require('cors');
var request = require('request');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();

app.options(/\.*/, function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://itec-gunay.duckdns.org:5984/judges/");
	res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
	res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
	res.sendStatus(200);
});

app.use(cors({
    origin: 'http://itec-gunay.duckdns.org:5984/judges/',
    withCredentials: false,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin' ]
}));


app.use(express.static(path.join(__dirname, 'client')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('port', process.env.PORT || 3197);

app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
