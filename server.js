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
var emoji = require('node-emoji');
var shorturl = require('shorturl');


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
		
		if (request_body.match(/((ht|f)tps?:\/\/)?[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?/i)) {

			var just_url = request_body.match(/((ht|f)tps?:\/\/)?[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?/i)[0];

			db.User
			.findOrCreate( { where: {phone: request_phone} })
			.spread(function(user, created) {

				if (created) {
					console.log('User created');
				} else {
					console.log('User already exists');
				}

				console.log('The full message is => ' + request_body);
				console.log('The URL in the message is => ' + just_url);

				db.Message
				.create({ text_body: just_url, user_id: user.id, time: user.time })
				.then(function(message) {

					console.log('message created with id ' + message.id);

					resp.message("Got your link! I'll text you back at " + user.time + "h " + emoji.get(':smiley:'));
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

		} else if (request_body.match(/^([0-9]|1[0-9]|2[0-3])$/)) {

			resp.message('Setting your reminder time to ' + request_body + 'h');
			res.writeHead(200, {
				'Content-Type':'text/xml'
				
			});
			res.end(resp.toString());

		} else {
			
			resp.message("Oops, that's not a link." + emoji.get(':confused:') + " " + "Text me links and I'll send them back to you at 9pm!");	
			res.writeHead(200, {
				'Content-Type':'text/xml'
			});
			res.end(resp.toString());

		}		

	}

});

// Run the jobs at 4 AM UTC (9 PM Pacific)
new cronJob( '0 * * * *', function(){

	current_hour = new Date().getHours();

	// find all unsent messages, for which the time matches the current hour
  	db.Message.findAll({ where: { sent: false, time: current_hour } }).then(function(messages) {

		messages.forEach(function(message) {

			db.User.findById(message.user_id).then(function(user) {
				
				var shortened_message;
				shorturl(message.text_body, function(result) {

					console.log('The user phone is' + user.phone);
					console.log('The user message text_body is ' + message.text_body);
					console.log('The short url is ' + result);

					shortened_message = result;

					// to post to TWILIO
					client.sms.messages.post({
					    to: user.phone, 
					    from: TWILIO_NR,
					    body: 'A friendly reminder from loopbird, here is your link: ' + shortened_message
					}, function(err, text) {
					    console.log('You sent: '+ text.body);
					    console.log('Current status of this text message is: '+ text.status);
					});

				});
	


			})

			message.updateAttributes({ sent: true });

		});

	});

},  null, true);






app.listen(process.env.PORT || 3000);



