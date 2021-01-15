(async () => {

    "use strict";

    const os = require("os");
    const querystring = require("querystring");
    const fetch = require('node-fetch');
    const fs = require("fs");

    const USERNAME = process.argv[2];
    const PASSWORD = process.argv[3];
    const OUTPUT_FILE = "token.json";

    if (process.argv.length !== 4) {
        console.log("Usage: " + __filename + " username password");
        process.exit(1);
    }

    var postData = {
        username: USERNAME,
        password: PASSWORD,
        referer: os.hostname(),
        expiration: 60*24*60,
        f: "json"
    };

    postData = querystring.stringify(postData);

    var options = {
        method: "POST",
        port: 443,
        body: postData,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": postData.length
        }
    };

    const response = await fetch("https://www.arcgis.com/sharing/rest/generateToken", options);
    const json = await response.json();
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(json));

})().catch(err => {
    console.error(err);
});