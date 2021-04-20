(async () => {

	const fetch = require("node-fetch");
	const querystring = require("querystring");

	const GEOMETRY_SERVICE = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer";

	if (process.argv.length !== 4) {
		console.log("Usage: " + __filename + " input_file output_file");
		process.exit(-1);
	}

	const IN_FILE = process.argv[2];
	const OUT_FILE = process.argv[3];

	console.log("----------------------------------------------------");
	console.log("Projecting data points to web mercator...");
	console.log("Input file: "+IN_FILE);
	console.log("Output file: "+OUT_FILE);

	const _records = await require('csvtojson')().fromFile(IN_FILE);
	console.log("Processing", _records.length, "records.");
	
	var _counter = 0;
	
	while (_counter < _records.length) {
		const record = _records[_counter];
		const obj = await project(record.lon, record.lat);
		process.stdout.clearLine();  // clear current text
		process.stdout.cursorTo(0);  // move cursor to beginning of line
		process.stdout.write("Progress: "+parseInt(( (_counter+1) / _records.length)*100)+"%");
		record.x = obj.x;
		record.y = obj.y;
		_counter++;
	}

	const csv = require("json2csv").parse(_records); /* json2csv */
	require("fs").writeFile(OUT_FILE, csv, () => {}); /* writeFile */    

	console.log("");
	console.log("Success!");
	console.log("----------------------------------------------------");

	async function project(x, y)
	{
		const postData = querystring.stringify(
			{
				inSR:4326,
				outSR:3857,
				geometries: JSON.stringify({
					"geometryType":"esriGeometryPoint",
					"geometries":[{x:x,y:y}]
				}),
				f:"pjson"
			}			
		);
		const response = await fetch(
			GEOMETRY_SERVICE+"/project",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
					"Content-Length": postData.length
				},
				body: postData
			}			
		)
		const json = await response.json();
		return json.geometries[0];
	}

})().catch(err => {
    console.error(err);
});