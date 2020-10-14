(async () => {

    "use strict";

    const fetch = require('node-fetch');

    if (process.argv.length !== 4) {
    	console.log("Usage: " + __filename + " <service> <output_file>");
    	process.exit(-1);
    }

    const SERVICE = process.argv[2];
    const OUTPUT_FILE = process.argv[3];

    console.log("----------------------------------------------------");
    console.log("Making snapshot from feature service...");
    console.log("Service: "+SERVICE);
    console.log("Output file: "+OUTPUT_FILE);

    // get feature count

    const _featureCount = await getCount();
    console.log("Retrieving", _featureCount, "records...");

    var _results = [];
    
    for (var i=0; i < Math.ceil(_featureCount/2000); i++) {
        _results = _results.concat(await getFeatures(i*2000));
        process.stdout.clearLine();  // clear current text
        process.stdout.cursorTo(0);  // move cursor to beginning of line
        process.stdout.write("Progress: "+parseInt((_results.length/_featureCount)*100)+"%");        
    }

    /* write to csv output file */
    require("fs").writeFile(
        OUTPUT_FILE, 
        require('json2csv').parse(_results), 
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
            "&resultOffset="+offset+
            "&resultRecordCount=2000"+            
            "&outFields=*"+
            "&f=pjson"
        );
        const json = await response.json();
        return json.features.map(function(value){return value.attributes;});
    }

    async function getCount()  {
        const response = await fetch(SERVICE+"/query?where="+encodeURIComponent("1=1")+"&returnCountOnly=true&f=pjson");
        const json = await response.json();
        return json.count;
    }

})().catch(err => {
    console.error(err);
});