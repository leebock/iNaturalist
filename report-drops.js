(async () => {
    
    "use strict";
    
    const FILE_ORIG = "../data/northernmost/nmost_orig.csv";
    const FILE_V2 = "../data/northernmost/nmost_v2.csv";
    const FILE_OUT = "../data/species/problems.csv";

    const csv=require('csvtojson');
    const _recordsOG = (await csv().fromFile(FILE_ORIG)).map(function(value){return value.taxon_name;});
    const _recordsV2 = (await csv().fromFile(FILE_V2)).map(function(value){return value.taxon_name;});
    const _problems = [];
    
    _recordsOG.forEach((species, i) => {
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