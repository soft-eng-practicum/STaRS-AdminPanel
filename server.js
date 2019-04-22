var express = require('express');
var cors = require('cors');
var request = require('request');
var bodyParser = require('body-parser');
var path = require('path');
const nodemailer = require("nodemailer");
const local_config = require("./localconfig.json");
var app = express();

app.options(/\.*/, function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "http://itec-gunay.duckdns.org:5984/judges_sp18/");
	res.header("Access-Control-Allow-Headers", "X-Requested-With, Content-Type");
	res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
	res.sendStatus(200);
});

app.use(cors({
    origin: 'http://itec-gunay.duckdns.org:5984/judges_sp18/',
    withCredentials: false,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin' ]
}));


app.use(express.static(path.join(__dirname, 'client')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// respond with "hello world" when a GET request is made to the homepage
app.get('/hello', function (req, res) {
  res.send('hello world')
});

// Send mail out
// async..await is not allowed in global scope, must use a wrapper
// TODO: change to POST
app.get('/judgemail', async function (req, res) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport(local_config.nodemailer);

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: "bar@example.com, baz@example.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>" // html body
  });

  console.log("Message sent: %s", info.messageId);

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

  res.send('judges!')
});

app.set('port', process.env.PORT || 3197);

app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});


