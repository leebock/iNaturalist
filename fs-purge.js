(function () {

	"use strict";

  	if (process.argv.length !== 3) {
  		console.log("Usage: " + __filename + " service");
  		process.exit(1);
  	}

	var TOKEN;
  	const SERVICE_URL = process.argv[2];

	const fs = require('fs');
	const request = require('request');

	var _objectIDs;

    fs.readFile("token.json", (err, content) => {
		TOKEN = JSON.parse(content).token;
		console.log("Purging "+SERVICE_URL+" ...");
		getCount(
			function() {
				// begin the purge
				console.log("Commence purge.");				
				doNext();
			}
		);
    });

	function getCount(callBack)
	{
		request(
			SERVICE_URL+"/query"+
			"?where="+encodeURIComponent("1 = 1")+
			"&returnIdsOnly=true"+
			"&token="+TOKEN+
			"&f=pjson",		
			{json: true}, 
			(error, response, body) => {
	
				if (error) { 
					return console.log(error); 
				}
	
				_objectIDs = body.objectIds;
	
				if (!_objectIDs.length) {
					console.log("Feature service is already empty.");
					process.exit(0);
				}
	
				callBack();
	
			}
		);		
	}

	function doNext()
	{

		request(
			{
				hostname: "services.arcgis.com",
				method: "POST",
				port: 443,
				uri: SERVICE_URL+"/deleteFeatures",
				form: {
					f:"pjson",
					token: TOKEN,
					objectIds: _objectIDs.splice(0, 100).join(","),
					rollbackOnFailure:false
				}
			}, 
			(error, response, body) => {

				if (error) { 
					console.log("Error in deleteFeatures request.");
					process.exit(1);
				}

				if (!JSON.parse(body).deleteResults) {
					console.log("Bad return from deleteFeatures.");
					process.exit(1);
				} else {
					process.stdout.clearLine();  // clear current text
					process.stdout.cursorTo(0);  // move cursor to beginning of line
					process.stdout.write("Good so far "+_objectIDs.length);				
				}

				if (_objectIDs.length) {
					doNext();
				} else {
					process.stdout.clearLine();  // clear current text
					process.stdout.cursorTo(0);  // move cursor to beginning of line
					process.stdout.write("Purge complete.");				
				}

			}
		);	

	}

}());

