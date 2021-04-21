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
    
    const CONFIG = JSON.parse(fs.readFileSync("config-edges.json")); 
    const TOKEN = JSON.parse(fs.readFileSync("token.json")).token;
    
    /*******************************************************************************
    *********************************** MAIN ***************************************
    *******************************************************************************/

    const listSpecies = (await csv().fromFile(SPECIES_CSV))
        .map(function(value){return value.species;})
        .filter(
            /* Note: This bit here just weeds out a couple of species that where
                    problematic in the first run. The records corresponding to the
                    species don't exist in the prior version of the feature service, 
                    so those species will throw an error guaranteed.  It might be better
                    practice to check for a null return from the feature query and skip
                    gracefully, but I wouldn't want to camouflage a legit bad return
                    from the featureservice. */
            CONFIG.direction.trim().toLowerCase() === "north" ?
            function(species) {
                return [
                    "arisaema quinatum", 
                    "govenia lagenophora"
                ].indexOf(species.trim().toLowerCase()) === -1;
            } :
            function (species) {
                return species.trim().toLowerCase() !== "sarracenia purpurea";
            }
        );

    if (listSpecies.length < 1) {
        console.log("All species have been visited...");
        process.exit(-1);
    }
    
    do {
        const species = listSpecies.shift();
        
        console.log("\n\n\n");
        console.log("****************************************************");        
        console.log("Now processing "+chalk.cyan(species));
        
        // before attempting to retrieve feature, check count to see if it exists
        // note: this is purely to provide more precise messaging, should feature
        // retrieval fail.
        
        const count = await getFeatureCount(species);
        
        if (Number.isInteger(count)) {
            if (count === 0) {
                console.log("Unable to find record for "+chalk.cyan(species)+" in current service?");
                process.exit();
            } else if (count === 1) { 
                // do nothing
            } else {
                console.log("More than one record for "+chalk.cyan(species)+" in current service?");
                process.exit();
            }
        } else {
            console.log("Error retrieving "+chalk.cyan(species)+" record from current service.");
            process.exit();
        }

        // if we made it to here, there's exactly one record for the species in the
        // current service.  now, retrieve it...
        
        console.log("Retrieving record for "+chalk.cyan(species)+" in current service."); 

        const feature = await getFeature(species);
        
        console.log(
            "Search iNaturalist for instances of", 
            chalk.cyan(feature.attributes.taxon_name), 
            CONFIG.direction+" of", 
            feature.attributes.lat
        );

        // find the new northmost/southmost record (if there is one)
    
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
                    CONFIG.direction
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
            
        if (!winner) {
            // write the existing feature to the new service
            console.log("Current record remains "+CONFIG.direction+"most.");
            console.log(
                await addFeature(feature) ? 
                "Successfully wrote current record to service." : 
                "Error writing feature to service."
            );
        } else {
            // write the new winner to the new service
            const geometry = await project(winner.lon, winner.lat);
            winner.taxon_name = species;
            console.log("Updating "+CONFIG.direction+"most occurence for "+
                        chalk.cyan(winner.taxon_name)+" to "+
                        parseFloat(winner.lat)+" ("+winner.place_guess+")");
            console.log(
                await addFeature(
                    {
                        geometry: geometry,
                        attributes: winner
                    }
                ) ?
                "Successfully wrote new winner to service." : 
                "Error updating observation"
            );
        } // if (_records.length === 0) {
        console.log("****************************************************");        
        
    } while (listSpecies.length > 0);

    /*******************************************************************************
    ********************************* FUNCTIONS ************************************
    *******************************************************************************/    
        
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
            CONFIG.service_write+"/addFeatures"+"?token="+TOKEN,
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
            CONFIG.service_read+"/query"+
            "?where="+encodeURIComponent("taxon_name='"+species+"'")+
            "&outFields=*"+
            "&f=pjson"+
            "&token="+TOKEN
        );
        const json = await response.json();
        return json.features.shift();
    }
        
    async function getFeatureCount(species)
    {
        const response = await fetch(
            CONFIG.service_read+"/query"+
            "?where="+encodeURIComponent("taxon_name='"+species+"'")+
            "&returnCountOnly=true"+
            "&f=pjson"+
            "&token="+TOKEN
        );
        const json = await response.json();
        return json.count;
    }    

})().catch(err => {
    console.error(err);
});