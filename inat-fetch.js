"use strict";

const fetch = require('node-fetch');

if (process.argv.length !== 3) {
	console.log("Usage: " + __filename + " output_file");
	process.exit(-1);
}

const OUTPUT_FILE = process.argv[2];
const QUERY_STRING = createQueryString(
	{
		identified: true, /* necessary? */
		hrank: "species", /* necessary? */
		taxon_name: "pinus contorta", /* alternatively, "taxon_id: 48934", */
		geo: true,
		acc: true, /* redundant when using acc_below? */
		acc_below: 1000,
		photos: true,
		quality_grade: "research",
		order_by: "observed_on",
		per_page: 200
	}
);

console.log("----------------------------------------------------");
console.log("Pulling data from iNaturalist API...");
console.log("Output file: "+OUTPUT_FILE);

var page = 0;
var records = [];

doIt();
    
function doIt()
{
	page++;
	
    fetch("https://api.inaturalist.org/v1/observations/?"+QUERY_STRING+"&page="+page)
        .then(res => res.text())
        .then(
            function(body) {
                var json = JSON.parse(body);
                records = records.concat(json.results.map(converter));
				if (page === 1) {
					console.log("Pulling", json.total_results, "records...");
				}
                process.stdout.clearLine();  // clear current text
    			process.stdout.cursorTo(0);  // move cursor to beginning of line
				process.stdout.write("Progress: "+parseInt((records.length/json.total_results)*100)+"%");
                if (records.length < json.total_results) {
                    doIt();
                } else {

					console.log("");                    
					
					/* eliminate obscured observations */
					
					records = records.filter(function(record){return !record.obscured;});
					console.log("Reducing to", records.length, "records after filtering for obscured.");
					
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
                    console.log("Success!");                                       
                    console.log("----------------------------------------------------");                                       
                }
            }
		);
}

function converter(result)
{
    return  {
        observation_id: result.id,
		taxon_id: result.taxon.id,
		taxon_name: result.taxon.name,
        quality_grade: result.quality_grade,
        observation_date: result.observed_on,
		geoprivacy: result.geoprivacy,
		taxon_geoprivacy: result.taxon_geoprivacy,
		obscured: result.obscured,
        lat: result.location ? result.location.split(",")[0] : null,
        lon: result.location ? result.location.split(",")[1] : null,
        place_guess: result.place_guess,
		positional_accuracy: result.positional_accuracy,
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

function createQueryString(args)
{
	
	// create query string

	const list = [];
	for (const property in args) {
		if (args.hasOwnProperty(property)) {
			list.push(`${property}=${args[property]}`);
		}		
	}
	return list.join("&");
		
}