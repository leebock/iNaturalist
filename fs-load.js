(function () {

	"use strict";

	const https = require("https");
	const querystring = require("querystring");
	const fs = require("fs");

  	if (process.argv.length !== 4) {
  		console.log("Usage: " + __filename + " input_file service");
  		process.exit(-1);
  	}

	const FILE = process.argv[2];
	const SERVICE_URL = process.argv[3];
	var TOKEN;

	var _records = [];
	
	fs.readFile("token.json", (err, content) => {
		TOKEN = JSON.parse(content).token;
		require('csvtojson')()
			.fromFile(FILE)
			.on('data',(data)=>{
			    //data is a buffer object
			    _records.push(JSON.parse(data.toString('utf8')));
			})
			.on(
				"done", 
				function(error) {
					console.log("***********************************************");
					console.log("Loading "+SERVICE_URL+" ...");
					console.log("Processing", _records.length, "incidents...");
					console.log("***********************************************");
					write();
				}
			);
    });
	
	function write()
	{
		var bucket = _records.splice(0, 100).map(
			function(json) {
				return {
					geometry: {x: json.x, y: json.y},
					spatialReference: {wkid: 102100},
					attributes: json
				};
			}
		);
		var postData = {
			features:JSON.stringify(bucket),
			f:"pjson"
		};
		
		postData = querystring.stringify(postData);
		var options = {
			hostname: "services.arcgis.com",
			method: "POST",
			port: 443,
			path: SERVICE_URL+"/addFeatures"+"?token="+TOKEN,
			headers:{"Content-Type": "application/x-www-form-urlencoded","Content-Length": postData.length}
		};

		var result = "";	
		
		var req = https.request(options, function(res) {
			res.setEncoding('utf8');
			res.on('data', function (chunk) {
				result = result+chunk;
			}).on('end', function(huh){
				if (
					JSON.parse(result).addResults &&
					JSON.parse(result).addResults.length && 
					JSON.parse(result).addResults.shift().success === true
				) {
					process.stdout.clearLine();  // clear current text
					process.stdout.cursorTo(0);  // move cursor to beginning of line
					process.stdout.write("good so far "+_records.length);
					if (_records.length) {
						write();
					} else {
						// log success
						console.log("");
						console.log("done");
					}
				} else {
					console.log("");
					console.log("problem with bucket.  exiting...");
					process.exit(1);					
				}
			});
		});
		
		req.on('error', function(e) {
			console.log('problem with request: ' + e.message);
		});
		
		req.write(postData);
		req.end();		

	}

}());