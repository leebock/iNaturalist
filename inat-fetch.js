"use strict";

const fetch = require('node-fetch');

if (process.argv.length !== 3) {
	console.log("Usage: " + __filename + " output_file");
	process.exit(-1);
}

const OUTPUT_FILE = process.argv[2];

console.log("----------------------------------------------------");
console.log("Pulling data from iNaturalist API...");
console.log("Output file: "+OUTPUT_FILE);

var page = 0;
var records = [];

doIt();
    
function doIt()
{
    page++;
    fetch("https://api.inaturalist.org/v1/observations/?taxon_id=48934&has[]=geo&order_by=observed_on&per_page=200&page="+page)
        .then(res => res.text())
        .then(
            function(body) {
                var json = JSON.parse(body);
                records = records.concat(json.results.map(converter));
                process.stdout.clearLine();  // clear current text
    			process.stdout.cursorTo(0);  // move cursor to beginning of line
    			process.stdout.write("Processing "+records.length+" of "+json.total_results);
                if (records.length < json.total_results) {
                    doIt();
                } else {
                    /* write to csv output file */
                    require("fs").writeFile(
                    	OUTPUT_FILE, 
                    	require('json2csv').parse(records), 
                    	(err) => {
                    		if (err) {
                    			throw("error writing file!");
                    		}
                    	}
                    ); /* writeFile */ 
                    console.log("");                    
                    console.log("Success!");                                       
                    console.log("----------------------------------------------------");                                       
                }
            }
        );
}

function converter(result)
{
    return  {
        id: result.id,
        quality_grade: result.quality_grade,
        observation_date: result.observed_on,
        mappable: result.mappable,
        lat: result.location ? result.location.split(",")[0] : null,
        lon: result.location ? result.location.split(",")[1] : null,
        place_guess: result.place_guess,
        photo: result.photos.length ? processPhotoURL(result.photos[0].url) : null,
        page: result.uri
    };
    function processPhotoURL(URL)
    {
        // derives the medium photo url from the give square one.
        var parts = URL.split("/");
        var extension = parts.pop().split("?").shift().split(".").pop();
        return parts.join("/")+"/medium."+extension;
    }
}