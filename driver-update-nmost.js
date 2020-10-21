(async () => {

    "use strict";

    const fetch = require('node-fetch');
    const child_process = require("child_process");
    const fs = require("fs");
    const querystring = require("querystring");    
    
    const SERVICE = "https://services.arcgis.com/nzS0F0zdNLvs7nc8/arcgis/rest/services/nmost/FeatureServer/0";
    const SERVICE_EDIT = "https://services.arcgis.com/nzS0F0zdNLvs7nc8/ArcGIS/rest/services/nmost_edit/FeatureServer/0";
    const GEOMETRY_SERVICE = "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/Geometry/GeometryServer";    
    const PASS = 1;
    
    const TOKEN = JSON.parse(fs.readFileSync("token.json")).token;
    
    const features = await getFeatures();
    const feature = features.shift();
    if (!feature) {
        console.log("No features match query for pass", PASS, ".");
        process.exit(-1);
    }
    
    console.log(feature);

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
    
    var _records = [];
    
    require('csvtojson')()
    	.fromFile(SCRATCH_FILE)
    	.on('data',(data)=>{
    	    //data is a buffer object
            _records.push(JSON.parse(data.toString('utf8')));
    	})
    	.on(
    		"done", 
    		function(error) {
                finish();
    		}
    	);
        
    async function finish()
    {
        if (_records.length === 0) {

            console.log("No records.");
            // not much to do here; just update pass field and move on!
            if (
                await updateFeature(
                    {attributes: {ObjectId: feature.attributes.ObjectId, pass: PASS}}
                )
            ) {
                console.log("Update successful.");
            } else {
                console.log("Bad update.");
            }
        } else {
            // find the new northmost and update
            console.log("Sorting", _records.length, "records.");
            _records.sort(sortDescendingByLatitude);
            var winner = _records.shift();
            console.log(winner);
            const geometry = await project(feature.attributes.lon, feature.attributes.lat);
            await updateFeature(
                {
                    geometry: geometry,
                    attributes: {
                        ObjectId: feature.attributes.ObjectId, 
                        pass: PASS,
                        taxon_name: winner.taxon_name,
                        generic_name: winner.generic_name,
                        observer: "",
                        observation_date: winner.observation_date,
                        page: winner.page,
                        lat: winner.lat,
                        lon: winner.lon,
                        positional_accuracy: winner.positional_accuracy,
                        photo: winner.photo,
                        photo_reference: "",
                        created: "",
                        creator: "", 
                        license: "",
                        rights_holder: "",
                        observation_id: winner.observation_id                      
                    } 
                }
            );
        }
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
        console.log(json);
        return json.updateResults && 
            json.updateResults.length && 
            json.updateResults.shift().success === true;
    }
    
    async function getFeatures()
    {
        const response = await fetch(
            SERVICE+"/query"+
            "?where="+encodeURIComponent("pass<1")+
            "&resultRecordCount=1"+            
            "&outFields=*"+
            "&f=pjson"
        );
        const json = await response.json();         
        return json.features;
    }

})().catch(err => {
    console.error(err);
});