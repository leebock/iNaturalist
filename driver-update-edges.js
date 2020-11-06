(async () => {

    "use strict";

    const fetch = require('node-fetch');
    const child_process = require("child_process");
    const fs = require("fs");
    const querystring = require("querystring");  
    const chalk = require('chalk');  
    const csv=require('csvtojson');
    
    const SPECIES_CSV = "../data/species/species.csv";
    const GEOMETRY_SERVICE = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer";    
    const PLACE_ID_NORTH_AMERICA = 97394;

    const SERVICE_READ = "https://services7.arcgis.com/poOcx60xJtGtoR7g/ArcGIS/rest/services/SMost_Aug_18/FeatureServer/0";
    const SERVICE_WRITE = "https://services.arcgis.com/nzS0F0zdNLvs7nc8/arcgis/rest/services/smost_v2_edit/FeatureServer/0";
    const DIRECTION = "south";
    
    const TOKEN = JSON.parse(fs.readFileSync("token.json")).token;
    
    /*******************************************************************************
    *********************************** MAIN ***************************************
    *******************************************************************************/
    
    const listSpecies = (await csv().fromFile(SPECIES_CSV))
        /*.filter(function(value){return value.visited.trim().toLowerCase() === "false";})*/
        .map(function(value){return value.species;});

    if (listSpecies.length < 1) {
        console.log("All species have been visited...");
        process.exit(-1);
    }
        
    do {
        const species = listSpecies.shift();
        const feature = await getFeature(species);
        feature.attributes = converter(feature.attributes);
        message1(feature.attributes.taxon_name, feature.attributes.lat);

        // find the new northmost record (if there is one)
    
        const SCRATCH_FILE = "scratch/"+
                            feature.attributes.taxon_name.toLowerCase().replace(" ", "-")+
                            ".csv";
                            
        if (
            child_process.spawnSync(
                "node",
                [
                    "inat-fetch", 
                    feature.attributes.taxon_name, 
                    SCRATCH_FILE,
                    PLACE_ID_NORTH_AMERICA,
                    feature.attributes.lat,
                    DIRECTION
                ],
                {stdio: "inherit"}
            )
            .status !== 0
        )
        {
            process.exit();
        }
        
        var _records = await csv().fromFile(SCRATCH_FILE);
        _records.sort(sortDescendingByLatitude);
        var winner = _records.shift();
    
        // update according to whether new winner was found
            
        console.log("");
        console.log("----------------------------------------------------");    
        if (!winner) {
            // not much to do here; just update pass field and move on!
            console.log(
                await addFeature(feature) ? 
                "Current record remains northmost" : 
                "Error updating pass"
            );
        } else {
            const geometry = await project(winner.lon, winner.lat);
            winner.taxon_name = species;
            console.log(
                await addFeature(
                    {
                        geometry: geometry,
                        attributes: winner
                    }
                ) ?
                "Updated: "+chalk.cyan(winner.taxon_name)+" at "+parseFloat(winner.lat)+" ("+winner.place_guess+")" : 
                "Error updating observation"
            );
        } // if (_records.length === 0) {
        console.log("****************************************************");        
        
    } while (listSpecies.length > 0);

    /*******************************************************************************
    ********************************* FUNCTIONS ************************************
    *******************************************************************************/
    
    function converter(record)
    {
        return  {
            taxon_name: record.species,
            observation_id: parseInt(record.occrrID.split("/").pop()),
            observer_name: record.idntfdB,
            observation_date: record.eventDt,
            page: record.occrrID,
            lat: parseFloat(record.dcmlLtt),
            lon: parseFloat(record.dcmlLng),
            photo: processPhotoURL(record.identfr),
            photo_reference: record.refrncs,
            photo_attribution: record.license
        };
        function processPhotoURL(URL)
        {
            // derives the medium photo url from the give square one.
            var parts = URL.split("/");
            var extension = parts.pop().split("?").shift().split(".").pop();
            return parts.join("/")+"/medium."+extension;
        }
    }
    

    function message1(species, latitude)
    {        
        console.log("");
        console.log("****************************************************");        
        console.log(
            "Searching for updates for", 
            chalk.cyan(species), 
            "north of", 
            latitude
        );
        console.log("----------------------------------------------------","\n");        
    }
        
    function sortDescendingByLatitude(a,b)
    {
        if (a.lat > b.lat) {
            return -1;
        }
        if (a.lat < b.lat) {
            return 1;
        }
        return 0;
    }    

    async function project(x, y)
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

        const response = await fetch(
            GEOMETRY_SERVICE+"/project",
            {
                method: "POST",
                body: postData,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": postData.length
                }
            }
        );
        const json = await response.json();
        return json.geometries.shift();
    }

    async function addFeature(obj)
    {
        var postData = {
            features:JSON.stringify([obj]),
            f:"pjson"
        };            		

        postData = querystring.stringify(postData);

        const response = await fetch(
            SERVICE_WRITE+"/addFeatures"+"?token="+TOKEN,
            {
                method: "POST",
                body: postData,
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Content-Length": postData.length
                }
            }
        );
        const json = await response.json();
        return json.addResults && 
            json.addResults.length && 
            json.addResults.shift().success === true;
    }
    
    async function getFeature(species)
    {
        const response = await fetch(
            SERVICE_READ+"/query"+
            "?where="+encodeURIComponent("species='"+species+"'")+
            "&outFields=*"+
            "&f=pjson"+
            "&token="+TOKEN
        );
        const json = await response.json();   
        return json.features.shift();
    }    

})().catch(err => {
    console.error(err);
});