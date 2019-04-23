var express = require('express');
var cors = require('cors');
var request = require('request');
var bodyParser = require('body-parser');
var path = require('path');
const nodemailer = require("nodemailer");
var inlineCSS = require('nodemailer-juice');
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

// Send mail out to students
// TODO: change to POST
app.post('/judgemail', function (req, res) {
  // Abort if not authorized
  if (req.body.secret != "skjhiuwykcnbmnckuwykdkhkjdfhf") {
    res.send("unathorized");
    console.error("unathorized access to /judgemail; wrong secret");
    return;
  }
  // Copy email to admin
  req.body.from = local_config.adminemail; 
  req.body.cc = local_config.adminemail; 
  sendmail(req.body).then(doc =>{
    res.send('success');
  }).catch(err => {
    res.send("error");
    console.error(err);
  });  
});

// async..await is not allowed in global scope, must use a wrapper
async function sendmail(req) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport(local_config.nodemailer);
  transporter.use('compile', inlineCSS());
  
  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: req.from, // sender address
    to: req.to, // list of receivers
    cc: req.cc, // list of carbon copy
    subject: req.subject, // Subject line
    text: req.text, // plain text body
    html: req.html, // html body
    attachments: req.attachments
  });

  console.log("Message sent: %s", info.messageId);

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

app.set('port', process.env.PORT || 3197);

app.listen(app.get('port'), function() {
    console.log('Express server listening on port ' + app.get('port'));
});


