const http = require("http");
const querystring = require("querystring");

const GEOMETRY_SERVICE = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer";

if (process.argv.length !== 4) {
	console.log("Usage: " + __filename + " input_file output_file");
	process.exit(-1);
}

const IN_FILE = process.argv[2];
const OUT_FILE = process.argv[3];

var _records = [];
var _counter = 0;

require('csvtojson')()
	.fromFile(IN_FILE)
	.on('data',(data)=>{
	    //data is a buffer object
        _records.push(JSON.parse(data.toString('utf8')));
	})
	.on(
		"done", 
		function(error) {
            console.log(_records.length);
            doIt();
		}
	);
    
function doIt()
{
    var record = _records[_counter];
    project(
        record.lon, record.lat, 
        function(obj) {
			process.stdout.clearLine();  // clear current text
			process.stdout.cursorTo(0);  // move cursor to beginning of line
			process.stdout.write("Processing record "+_counter+" of "+_records.length);
            record.x = obj.x;
            record.y = obj.y;
            _counter++;
            if (_counter < _records.length) {
                doIt();
            } else {
                finish();
            }
        }
    );
}

function finish() 
{
    var csv = require("json2csv").parse(_records); /* json2csv */
	require("fs").writeFile(OUT_FILE, csv, (err) => {}); /* writeFile */    
}

function project(x, y, callBack)
{

	var postData = {
		inSR:4326,
		outSR:3857,
		geometries: JSON.stringify({
			"geometryType":"esriGeometryPoint",
			"geometries":[{x:x,y:y}]
		}),
		f:"pjson"
	}; 

	postData = querystring.stringify(postData);

	var options = {
		host: "sampleserver6.arcgisonline.com",
		method: "POST",
		port: 80,
		path: GEOMETRY_SERVICE.replace("http://sampleserver6.arcgisonline.com","")+"/project",
		headers:{"Content-Type": "application/x-www-form-urlencoded","Content-Length": postData.length}
	};

	var result = "";	
	
	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			result = result+chunk;
		}).on('end', function(huh){
			callBack(JSON.parse(result).geometries[0]);
		});
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});
	
	req.write(postData);
	req.end();

}
