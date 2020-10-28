"use strict";

const fetch = require('node-fetch');
const chalk = require('chalk');  

if (process.argv.length < 4) {
	console.log("Usage: " + __filename + " species output_file [nlat]");
	process.exit(-1);
}

const SPECIES = process.argv[2];
const OUTPUT_FILE = process.argv[3];
const PLACE_ID = process.argv[4];
const NLAT = process.argv.length > 5 ? process.argv[5] : null;

const args = {
	identified: true, /* necessary? */
	hrank: "species", /* necessary? */
	taxon_name: SPECIES, /* e.g. "Pinus contorta" alternatively, "taxon_id: 48934", */
	geo: true,
	acc: true, /* redundant when using acc_below? */
	acc_below: 1001,
	photos: true,
	quality_grade: "research",
	order_by: "observed_on",
	per_page: 200
};

if (PLACE_ID) {
	args.place_id = PLACE_ID;
}

if (NLAT) {
	args.swlat = NLAT;
	args.swlng = -180;
	args.nelat = 90;
	args.nelng = 180;
}

const QUERY_STRING = createQueryString(args);

console.log("----------------------------------------------------");
console.log("Pulling data from iNaturalist API...");
console.log("Species: "+chalk.cyan(SPECIES));
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

				try {

	                var json = JSON.parse(body);
	                records = records.concat(json.results.map(converter));
					if (page === 1) {
						console.log("Pulling", json.total_results, "records...");
					}
	                process.stdout.clearLine();  // clear current text
	    			process.stdout.cursorTo(0);  // move cursor to beginning of line
					process.stdout.write(
						"Progress: "+
						parseInt((records.length/json.total_results)*100)+
						"%"
					);
	                if (records.length < json.total_results) {
	                    doIt();
	                } else {

						console.log("");                    
						
						/* eliminate obscured observations */
						
						records = records.filter(function(record){return !record.obscured;});
						console.log(
							"Reducing to", 
							records.length, 
							"records after filtering for obscured."
						);
						records = records.filter(
							function(record) {
								return record.taxon_name.toLowerCase().indexOf(SPECIES.toLowerCase())>-1;
							}
						);
						console.log(
							"Reducing to", 
							records.length, 
							"records after filtering for strict species and sub species only."
						);
						
						const fields = Object.keys(converter({}));
						
	                    /* write to csv output file */
	                    require("fs").writeFile(
	                    	OUTPUT_FILE, 
	                    	require('json2csv').parse(
								records, 
								records.length ? {} : {fields}
							), 
	                    	(err) => {
	                    		if (err) {
	                    			throw("error writing file!");
	                    		}
	                    	}
	                    ); /* writeFile */ 
	                    console.log("Success!");                                       
	                    console.log("----------------------------------------------------");                                       
	                }

				} catch(err) {
					console.log("error in inat-fetch!");
					process.exit(-1);
				}

            }
		);
}

function converter(result)
{
	/* convert the inaturalist data to flat csv friendly data */
    return  {
        observation_id: result.id,
		taxon_id: result.taxon ? result.taxon.id : null,
		taxon_name: result.taxon ? result.taxon.name : null,
        quality_grade: result.quality_grade,
        observation_date: result.observed_on,
		geoprivacy: result.geoprivacy,
		taxon_geoprivacy: result.taxon_geoprivacy,
		obscured: result.obscured,
        lat: result.location ? result.location.split(",")[0] : null,
        lon: result.location ? result.location.split(",")[1] : null,
        place_guess: result.place_guess,
		positional_accuracy: result.positional_accuracy,
        photo: result.photos ? 
			result.photos.length ? processPhotoURL(result.photos[0].url) : null :
			null,
		photo_reference: result.photos ?
			result.photos.length ? "https://www.inaturalist.org/photos/"+result.photos[0].id : null :
			null,
		photo_attribution: result.photos ?
			result.photos.length ? result.photos[0].attribution : null :
			null,
        page: result.uri,
		updated_at: result.updated_at
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