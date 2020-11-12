(function () {

	"use strict";

  	if (process.argv.length !== 3) {
  		console.log("Usage: " + __filename + " service");
  		process.exit(-1);
  	}

	const fs = require('fs');
	const request = require('request');

  	const SERVICE_URL = process.argv[2];
	const TOKEN = JSON.parse(fs.readFileSync("token.json")).token;

	console.log("----------------------------------------------------");
	console.log("Purging records from feature service...");
	console.log("Service URL: "+SERVICE_URL);

	var _objectIDs;
	var _totalRecs;

	getCount(
		function(/*objectIDs*/) {
			// todo: check for objectIDs null or zero length 
			// begin the purge
			console.log("Removing "+_totalRecs+" records...");
			doNext();
		}
	);

	function getCount(callBack)
	{
		// todo: should use async node-fetch
		// todo: should merely return list of object ids (not mess with globals)
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
				_totalRecs = _objectIDs.length;
				
				if (!_objectIDs.length) {
					console.log("Feature service is already empty.");
					console.log("----------------------------------------------------");                                       
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
					process.stdout.write("Progress: "+(100-parseInt((_objectIDs.length/_totalRecs)*100))+"%");				
				}

				if (_objectIDs.length) {
					doNext();
				} else {					
					console.log("");                    
                    console.log("Success!");                                       
                    console.log("----------------------------------------------------");                                       
				}

			}
		);	

	}

}());

