(async () => {

    "use strict";

    const fetch = require('node-fetch');
    const child_process = require("child_process");
    const fs = require("fs");
    const querystring = require("querystring");  
    const chalk = require('chalk');  
    const csv=require('csvtojson');
    
    const SERVICE = "https://services.arcgis.com/nzS0F0zdNLvs7nc8/arcgis/rest/services/nmost/FeatureServer/0";
    const SERVICE_EDIT = "https://services.arcgis.com/nzS0F0zdNLvs7nc8/ArcGIS/rest/services/nmost_edit/FeatureServer/0";
    const GEOMETRY_SERVICE = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer";    
    const PASS = 1;
    
    const TOKEN = JSON.parse(fs.readFileSync("token.json")).token;
    
    /*******************************************************************************
    *********************************** MAIN ***************************************
    *******************************************************************************/
    
    const features = await getFeatures(1000);
    if (features.length < 1) {
        console.log("No features left in pass", PASS, ".");
        process.exit(-1);
    }
    
    do {
        const feature = features.shift();
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
                    feature.attributes.lat
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
                await updateFeature(
                    {attributes: {ObjectId: feature.attributes.ObjectId, pass: PASS}}
                ) ? "Current record remains northmost" : "Error updating pass"
            );
        } else {
            const geometry = await project(winner.lon, winner.lat);
            console.log(
                await updateFeature(
                    {
                        geometry: geometry,
                        attributes: buildAtts(feature.attributes.ObjectId, PASS, winner) 
                    }
                ) ?
                "Updated: "+chalk.cyan(winner.taxon_name)+" at "+parseFloat(winner.lat)+" ("+winner.place_guess+")" : 
                "Error updating observation"
            );
        } // if (_records.length === 0) {
        console.log("****************************************************");        
        
    } while (features.length > 0);

    /*******************************************************************************
    ********************************* FUNCTIONS ************************************
    *******************************************************************************/
    
    function buildAtts(objectId, pass, northmost)
    {
        return {
            ObjectId: objectId, 
            pass: PASS,
            taxon_name: northmost.taxon_name,
            generic_name: northmost.generic_name,
            observer: "",
            observation_date: northmost.observation_date,
            page: northmost.page,
            lat: northmost.lat,
            lon: northmost.lon,
            positional_accuracy: northmost.positional_accuracy,
            photo: northmost.photo,
            photo_reference: "",
            created: "",
            creator: "", 
            license: "",
            rights_holder: "",
            observation_id: northmost.observation_id                      
        };        
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

    async function updateFeature(obj)
    {
        var postData = {
            features:JSON.stringify([obj]),
            f:"pjson"
        };            		

        postData = querystring.stringify(postData);

        const response = await fetch(
            SERVICE_EDIT+"/updateFeatures"+"?token="+TOKEN,
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
        return json.updateResults && 
            json.updateResults.length && 
            json.updateResults.shift().success === true;
    }
    
    async function getFeatures(n)
    {
        const response = await fetch(
            SERVICE+"/query"+
            "?where="+encodeURIComponent("pass<1")+
            "&resultRecordCount="+n+            
            "&outFields=*"+
            "&f=pjson"
        );
        const json = await response.json();         
        return json.features;
    }

})().catch(err => {
    console.error(err);
});