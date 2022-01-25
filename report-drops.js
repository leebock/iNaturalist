(async () => {
    
    "use strict";

    if (process.argv.length < 4) {
        console.log(
            "Usage:",
            __filename.split("\u005c").pop(), 
            "service1 service2"
        );
        process.exit(-1);
    }

	const fs = require("fs");
    const fetch = require('node-fetch');

    const SERVICE1 = process.argv[2];
    const SERVICE2 = process.argv[3];

    const TOKEN = JSON.parse(fs.readFileSync("token.json")).token;
    
    console.log("************************************************");
    console.log("Retrieving species from ", SERVICE1);    
    const recordsV1 = await selectSpecies(SERVICE1);

    console.log("-----------------------------------------------");
    console.log("Retrieving species from ", SERVICE2);    
    const recordsV2 = await selectSpecies(SERVICE2);

    console.log("-----------------------------------------------");
    console.log("Comparing results...")
    const problems = recordsV1.filter((species)=>recordsV2.indexOf(species)<0);

    if (problems.length) {
        console.log("The following species are missing from ", SERVICE2, ":");
        console.log("");
        console.log(problems.join("\n"));
    } else {
        console.log("No drops.");
    }

    async function selectSpecies(service) {

        // get feature count

        const featureCount = await getCount(service);
        console.log("Fetching", featureCount, "records...");

        var results = [];
        
        for (var i=0; i < Math.ceil(featureCount/1000); i++) {
            results = results.concat(await getFeatures(service, i*1000));
            process.stdout.clearLine();  // clear current text
            process.stdout.cursorTo(0);  // move cursor to beginning of line
            process.stdout.write("Progress: "+parseInt((results.length/featureCount)*100)+"%");        
        }

        console.log("")

        return results.map((value)=>value.taxon_name);

        async function getFeatures(service, offset)
        {
            const response = await fetch(
                service+"/query"+
                "?where="+encodeURIComponent("1=1")+
                "&orderByFields=taxon_name"+
                "&returnGeometry=false"+
                "&resultOffset="+offset+
                "&resultRecordCount=1000"+            
                "&outFields=taxon_name"+
                "&f=pjson"+
                (TOKEN ? "&token="+TOKEN : "")
            );
            const json = await response.json();
            return json.features.map(function(value){return value.attributes;});
        }
    
        async function getCount(service) {
            const response = await fetch(
                service+"/query"+
                "?where="+encodeURIComponent("1=1")+
                "&returnCountOnly=true"+
                "&f=pjson"+
                (TOKEN ? "&token="+TOKEN : "")
            );
            const json = await response.json();
            return json.count;
        }
    
    }
    
})().catch(err => {
    console.error(err);
});