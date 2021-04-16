(async () => {

	"use strict";

	const fetch = require("node-fetch");
	const querystring = require("querystring");
	const fs = require("fs");

	if (process.argv.length !== 4) {
		console.log("Usage: " + __filename + " input_file service");
		process.exit(-1);
	}

	const FILE = process.argv[2];
	const SERVICE_URL = process.argv[3];
	const TOKEN = JSON.parse(fs.readFileSync("token.json")).token;

	console.log("----------------------------------------------------");
	console.log("Loading records into feature service...");
	console.log("Input file: "+FILE);
	console.log("Service URL: "+SERVICE_URL);

	var _records = await require('csvtojson')().fromFile(FILE);
	var _totalRecs = _records.length;
	console.log("Processing", _totalRecs, "records...");
		
	while (_records.length) {

		const bucket = _records.splice(0, 100).map(
			function(json) {
				return {
					geometry: {x: json.x, y: json.y},
					spatialReference: {wkid: 102100},
					attributes: json
				};
			}
		);
		
		const postData = querystring.stringify(
			{
				features:JSON.stringify(bucket),
				f:"pjson"
			}
		);
		
		const response = await fetch(
			SERVICE_URL+"/addFeatures"+"?token="+TOKEN,
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
			json.addResults &&
			json.addResults.length && 
			json.addResults.shift().success === true
		) {
			process.stdout.clearLine();  // clear current text
			process.stdout.cursorTo(0);  // move cursor to beginning of line
			process.stdout.write("Progress: "+(100-parseInt((_records.length/_totalRecs)*100))+"%");
		} else {
			console.log("");
			console.log("problem with bucket.  exiting...");
			process.exit(1);					
		}

	}

	console.log("");
	console.log("Success!");
	console.log("----------------------------------------------------");


})().catch(err => {
    console.error(err);
});