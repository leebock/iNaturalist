"use strict";

const fetch = require('node-fetch');

const OUTPUT_FILE = "../data/pinus-contorta-48934.csv";

var page = 0;
var records = [];

doIt();
    
function doIt()
{
    page++;
    fetch("https://api.inaturalist.org/v1/observations/?taxon_id=48934&has[]=geo&order_by=observed_on&page="+page+"&per_page=200")
        .then(res => res.text())
        .then(
            function(body) {
                var json = JSON.parse(body);
                records = records.concat(json.results.map(converter));
                console.log(records.length, " of ", json.total_results);
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
        photo: result.photos.length ? result.photos[0].url : null
    };
}