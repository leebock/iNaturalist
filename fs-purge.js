(async () => {

	"use strict";

	if (process.argv.length !== 3) {
		console.log("Usage: " + __filename + " service");
		process.exit(-1);
	}

	const fs = require('fs');
	const querystring = require("querystring");
	const fetch = require('node-fetch');

	const SERVICE_URL = process.argv[2];
	const TOKEN = JSON.parse(fs.readFileSync("token.json")).token;

	console.log("----------------------------------------------------");
	console.log("Purging records from feature service...");
	console.log("Service URL: "+SERVICE_URL);

	const _objectIDs = await getObjectIds();
	const _totalRecs = _objectIDs.length;
	
	if (_totalRecs === 0) {
		console.log("Feature service is already empty.");
		console.log("----------------------------------------------------");                                       
		process.exit(0);
	}

	console.log("Removing "+_totalRecs+" records...");
	
	while (_objectIDs.length) {

		const postData = querystring.stringify(
			{
				objectIds: _objectIDs.splice(0, 100).join(","),
				f:"pjson"
			}
		);

		const response = await fetch(
			SERVICE_URL+"/deleteFeatures"+(TOKEN ? "?token="+TOKEN : ""),
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"Content-Length": postData.length
				},
				body: postData
			}			
		);
		
		const json = await response.json();
		
		if (
			json.deleteResults &&
			json.deleteResults.length && 
			json.deleteResults.shift().success === true
		) {			
			process.stdout.clearLine();  // clear current text
			process.stdout.cursorTo(0);  // move cursor to beginning of line
			process.stdout.write("Progress: "+(100-parseInt((_objectIDs.length/_totalRecs)*100))+"%");				
		} else {
			console.log("");
			console.log("problem with bucket.  exiting...");
			process.exit(1);			
		}

	}

	console.log("");                    
	console.log("Success!");                                       
	console.log("----------------------------------------------------");                                       

	async function getObjectIds()  {
        const response = await fetch(
			SERVICE_URL+"/query"+
            "?where="+encodeURIComponent("1=1")+
			"&returnIdsOnly=true"+
            "&f=pjson"+
            (TOKEN ? "&token="+TOKEN : "")
        );
        const json = await response.json();
        return json.objectIds;
    }

})().catch(err => {
    console.error(err);
});