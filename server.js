
// Require npm modules

var JESSICA_CEL = '+16507139717'
var TWILIO_NR = '+16503895329'


var express = require('express');
var	bodyParser = require('body-parser');
var db = require('./models');
var app = express();
var methodOverride = require('method-override');
var path = require('path');
var twilio = require('twilio');
var env = process.env;
var account_id = env.TWILIO_SID;
var auth_token = env.TWILIO_AUTH_TOKEN;	


// Your accountSid and authToken from twilio.com/user/account
var client = require('twilio')(account_id, auth_token);

var cronJob = require('cron').CronJob;
 
app.set('view engine', 'ejs');

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));

app.use(methodOverride('_method'));

app.use(express.static(path.join(__dirname, 'public')));



//ROUTES INDEX
app.get('/', function(req,res) {

	console.log("index");

	var request_body = 'http://www.google.com';
	var request_phone = '+16507139719'


	db.User
	.findOrCreate( { where: {phone: request_phone} })
	.spread(function(user, created) {

		if (created) {
			console.log('User created');
		} else {
			console.log('User already exists');
		}

		console.log('The user_id is ' + user.id);
		console.log('The message is ' + request_body);

		db.Message
		.create({ text_body: request_body, user_id: user.id })
		.then(function(message) {
			console.log('message created with id ' + message.id);
		})

	})

  res.render('index');
});

// manually deliver all the messages
app.get('/deliver', function(req,res) {

	db.Message.findAll().then(function(messages) {

		messages.forEach(function(message) {

			db.User.findById(message.user_id).then(function(user) {

				console.log("The user phone is" + user.phone);

				// to post to TWILIO
				client.sms.messages.post({
				    to: user.phone, 
				    from: TWILIO_NR,
				    body: message.text_body
				}, function(err, text) {
				    console.log('You sent: '+ text.body);
				    console.log('Current status of this text message is: '+ text.status);
				});

			})

			db.Message.destroy({where : {id : message.id}});
			console.log("deleted message " + message.id);

		});

	});

	res.render('index');

})

// webhook used by twilio to send the new text message details
app.post('/message', function (req, res) {

	console.log('/message was accessed');
	console.log('The body is: ' + req.body.Body);
	console.log('The sender is: ' + req.body.From);

	var request_body = req.body.Body;
	var request_phone = req.body.From;

	db.User
	.findOrCreate( { where: {phone: request_phone} })
	.spread(function(user, created) {

		if (created) {
			console.log('User created');
		} else {
			console.log('User already exists');
		}

		console.log('The user_id is ' + user.id);
		console.log('The message is ' + request_body);

		db.Message
		.create({ text_body: request_body, user_id: user.id })
		.then(function(message) {
			console.log('message created with id ' + message.id);
		})

	})

	var resp = new twilio.TwimlResponse();
	resp.message('Got it! ');
	res.writeHead(200, {
		'Content-Type':'text/xml'
	});
	res.end(resp.toString());

});











// app.listen(process.env.PORT || 3000);


  db.sequelize.sync().then(function() {
    var server = app.listen(3000, function() {
    // This part just adds a snazzy listening message:
    console.log(new Array(51).join("*"));
    console.log("\t LISTENING ON: \n\t\t localhost:3000");
    console.log(new Array(51).join("*")); 
  });
});








