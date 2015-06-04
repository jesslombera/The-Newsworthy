
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

//ROUTES INDEX test
app.get('/', function(req,res) {
	console.log("index");
	res.render('index');
});

// webhook used by twilio to send the new text message details
app.post('/message', function (req, res) {

	var resp = new twilio.TwimlResponse();

	// Prevent the app fro mcrashing if the request came empty/undefined
	if (req.body != undefined) {

		var request_body = req.body.Body;
		var request_phone = req.body.From;
		
		if (request_body.match(/^((ht|f)tps?:\/\/)?[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/i)) {

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

					resp.message("Got it! I'll text you back at 9 pm :-)'");
					res.writeHead(200, {
						'Content-Type':'text/xml'
					});
					res.end(resp.toString());

				})

			})

		} else if (request_body.match(/start/i)) {

			resp.message('Share URLs with this contact and we will send it back to you later!');
			res.writeHead(200, {
				'Content-Type':'text/xml'
			});
			res.end(resp.toString());

		} else {
			
			resp.message("Oops, that's not a link. Text me links and I'll send them back to you at 9:00pm!");	
			res.writeHead(200, {
				'Content-Type':'text/xml'
			});
			res.end(resp.toString());

		}		

	}

});

new cronJob( '* * * * *', function(){

  	db.Message.findAll({ where: { sent: false } }).then(function(messages) {

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

			message.updateAttributes({ sent: true });

		});

	});

},  null, true);

app.listen(process.env.PORT || 3000);



