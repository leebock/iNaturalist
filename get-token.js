var os = require("os");
var querystring = require("querystring");
var https = require("https");

var USERNAME = process.argv[2];
var PASSWORD = process.argv[3];

if (process.argv.length !== 4) {
    console.log("Usage: " + __filename + " username password");
    process.exit(1);
}

getToken(function(){console.log("done");});

function getToken(callBack)
{
	
	var postData = {
		username: USERNAME,
		password: PASSWORD,
		referer: os.hostname(),
        expiration: 60*24*60,
		f: "json"
    };
	
	postData = querystring.stringify(postData);
	
	var options = {
		host: "www.arcgis.com",
		method: "POST",
		port: 443,
		path: "https://www.arcgis.com/sharing/rest/generateToken",
		headers:{"Content-Type": "application/x-www-form-urlencoded","Content-Length": postData.length}
	};
	
	var result = "";	

	try {
			
		var req = https.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				result = result+chunk;
			}).on('end', function(huh){
				console.log(JSON.parse(result));
				callBack();
			});
		});
	
		req.on('error', function(e) {
			console.log("uh-oh...error in token request");
		});
		
		req.write(postData);
		req.end();
	
	} catch(err) {
		console.log("problem communicating with token service...");
	}	
	
}