if (process.argv.length !== 4) {
	console.log("Usage: " + __filename + " <input_file> <output_file>");
	process.exit(-1);
}

const IN_FILE = process.argv[2];
const OUT_FILE = process.argv[3];

console.log("----------------------------------------------------");
console.log("Renaming fields...");
console.log("Input file: "+IN_FILE);
console.log("Output file: "+OUT_FILE);

var _records = [];

require('csvtojson')()
	.fromFile(IN_FILE)
	.on('data',(data)=>{
	    //data is a buffer object
        _records.push(converter(JSON.parse(data.toString('utf8'))));
	})
	.on(
		"done", 
		function(error) {
			console.log("Processing", _records.length, "records.");
            var csv = require("json2csv").parse(_records); /* json2csv */
        	require("fs").writeFile(OUT_FILE, csv, (err) => {}); /* writeFile */ 
            console.log("Success!");                                       
            console.log("----------------------------------------------------");               
		}
	);

function converter(record)
{
    return  {
        taxon_name: record.species,
        generic_name: record.genrcNm,
        observation_id: parseInt(record.occrrID.split("/").pop()),
        observer: record.idntfdB,
        observation_date: record.eventDt,
        page: record.occrrID,
        lat: parseFloat(record.dcmlLtt),
        lon: parseFloat(record.dcmlLng),
        positional_accuracy: parseInt(record.crdnUIM),
        photo: processPhotoURL(record.identfr),
        photo_reference: record.refrncs,
        created: record.created,
        creator: record.creator,
        license: record.license,
        rights_holder: record.rghtsHl
    };
    function processPhotoURL(URL)
    {
        // derives the medium photo url from the give square one.
        var parts = URL.split("/");
        var extension = parts.pop().split("?").shift().split(".").pop();
        return parts.join("/")+"/medium."+extension;
    }
}
