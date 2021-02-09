(async () => {
    
    "use strict";

    if (process.argv.length < 5) {
        console.log(
            "Usage:",
            __filename.split("\u005c").pop(), 
            "orig_file revised_file output_file"
        );
        process.exit(-1);
    }

    const FILE_ORIG = process.argv[2]; //"../data/northernmost/nmost_v3.csv";
    const FILE_V2 = process.argv[3]; //"../data/northernmost/nmost_v4.csv";
    const FILE_OUT = process.argv[4]; //"../data/northernmost/drops.csv";

    const csv=require('csvtojson');
    const _recordsOG = (await csv().fromFile(FILE_ORIG)).map(function(value){return value.taxon_name;});
    const _recordsV2 = (await csv().fromFile(FILE_V2)).map(function(value){return value.taxon_name;});
    const _problems = [];
    
    _recordsOG.forEach((species) => {
        if (_recordsV2.indexOf(species) === -1) {
            _problems.push({species: species});
        }
    });
    
    /* write to csv output file */
    require("fs").writeFile(
        FILE_OUT, 
        require('json2csv').parse(_problems), 
        (err) => {
            if (err) {
                throw("error writing file!");
            }
        }
    ); /* writeFile */ 
    
})().catch(err => {
    console.error(err);
});