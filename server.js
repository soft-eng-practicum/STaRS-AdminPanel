var express = require('express');
var cors = require('cors');
var request = require('request');
var bodyParser = require('body-parser');
var path = require('path');
var app = express();

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://admin:starsGGCadmin@itec-gunay.duckdns.org:5984/judges');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'DELETE,GET,HEAD,POST');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});
app.use(cors());

app.use(express.static(path.join(__dirname, 'client')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.set('port', process.env.PORT || 3197);

app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});
