(async () => {
    
    "use strict";
    
    const FILE_ORIG = "../data/northernmost/nmost_orig.csv";
    const FILE_V2 = "../data/northernmost/nmost_v2.csv";
    const FILE_OUT = "../data/northernmost/differences.csv";

    const csv=require('csvtojson');
    const _recordsOG = (await csv().fromFile(FILE_ORIG));
    const _recordsV2 = (await csv().fromFile(FILE_V2));
    var _diff = [];
    
    var match;
    _recordsOG.forEach((record, i) => {
        match = _recordsV2.filter(
            function(value){return value.taxon_name === record.taxon_name;}
        ).shift();
        if (match) {
            _diff.push({
                taxon_name: record.taxon_name,
                observation_orig: record.observation_id,
                lat_orig: record.lat,
                lon_orig: record.lon,
                observation_new: match.observation_id,
                lat_new: match.lat,
                lon_new: match.lon
            });
        } else {
            console.log("missing", record.taxon_name);
        }
    });
    
    _diff = _diff.filter(function(value){return value.observation_orig !== value.observation_new;});
    
    /* write to csv output file */
    require("fs").writeFile(
        FILE_OUT, 
        require('json2csv').parse(_diff), 
        (err) => {
            if (err) {
                throw("error writing file!");
            }
        }
    ); /* writeFile */ 
    
})().catch(err => {
    console.error(err);
});