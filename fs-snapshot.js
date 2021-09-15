(async () => {

    "use strict";

    const fetch = require('node-fetch');
    const fs = require("fs");
    
    if (process.argv.length < 4) {
        console.log(
            "Usage:",
            __filename.split("\u005c").pop(), 
            "service output_file [sort_field] [output_fields] [token_file]"
        );
        process.exit(-1);
    }
    
    const SERVICE = process.argv[2];
    const OUTPUT_FILE = process.argv[3];
    const SORT_FIELD = process.argv.length > 4 ? process.argv[4].trim() : null;
    const OUTPUT_FIELDS = process.argv.length > 5 ? process.argv[5].trim() : null;
    const TOKEN = process.argv.length > 6 ? 
        JSON.parse(fs.readFileSync(process.argv[6])).token : 
        null;
        
    console.log("----------------------------------------------------");
    console.log("Making snapshot from feature service...");
    console.log("Service: "+SERVICE);
    console.log("Output file: "+OUTPUT_FILE);

    // get feature count

    const _featureCount = await getCount();
    console.log("Retrieving", _featureCount, "records...");

    var _results = [];
    
    for (var i=0; i < Math.ceil(_featureCount/1000); i++) {
        _results = _results.concat(await getFeatures(i*1000));
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        process.stdout.write("Progress: "+parseInt((_results.length/_featureCount)*100)+"%");        
    }

    /* write to csv output file */
    require("fs").writeFile(
        OUTPUT_FILE, 
        require('json2csv').parse(
            _results, 
            OUTPUT_FIELDS && OUTPUT_FIELDS.length > 0 ? 
                {fields: OUTPUT_FIELDS.split(",")} : 
                {}
        ), 
        (err) => {
            if (err) {
                throw("error writing file!");
            }
        }
    ); /* writeFile */ 
    console.log("");                        
    console.log("Success!");                                       
    console.log("----------------------------------------------------");                                       


    async function getFeatures(offset)
    {
        const response = await fetch(
            SERVICE+"/query"+
            "?where="+encodeURIComponent("1=1")+
            (SORT_FIELD ? "&orderByFields="+SORT_FIELD : "")+
            "&resultOffset="+offset+
            "&resultRecordCount=1000"+            
            "&outFields=*"+
            "&f=pjson"+
            (TOKEN ? "&token="+TOKEN : "")
        );
        const json = await response.json();
        return json.features.map(function(value){return value.attributes;});
    }

    async function getCount()  {
        const response = await fetch(
            SERVICE+"/query"+
            "?where="+encodeURIComponent("1=1")+
            "&returnCountOnly=true"+
            "&f=pjson"+
            (TOKEN ? "&token="+TOKEN : "")
        );
        const json = await response.json();
        return json.count;
    }

})().catch(err => {
    console.error(err);
});