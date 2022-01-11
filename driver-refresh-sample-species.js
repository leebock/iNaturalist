const child_process = require("child_process");

const CONFIGS = [
    {
        species: "Pinus contorta",
        csv: "../data/inat-sample-pulls/pinus-contorta.csv",
        service: "https://services.arcgis.com/nzS0F0zdNLvs7nc8/ArcGIS/rest/services/pinus_contorta_edit/FeatureServer/0"
    },
    {
        species: "Acer spicatum",
        csv: "../data/inat-sample-pulls/acer-spicatum.csv",
        service: "https://services.arcgis.com/nzS0F0zdNLvs7nc8/arcgis/rest/services/acer_spicatum_edit/FeatureServer/0"
    }    
];

CONFIGS.forEach((config) => {

    console.log();

    if (
        child_process.spawnSync(
            "node",
            ["inat-fetch", config.species, config.csv],
            {stdio: "inherit"}
        )
        .status !== 0
    )
    {
        process.exit();
    }

    console.log();

    if (
        child_process.spawnSync(
            "node",
            [
                "fs-purge", 
                config.service
            ],
            {stdio: "inherit"}
        )
        .status !== 0    
    )
    {
        process.exit();
    }
    
    console.log();

    if (
        child_process.spawnSync(
            "node",
            [
                "fs-load", 
                config.csv,
                config.service
            ],
            {stdio: "inherit"}
        )
        .status !== 0    
    )
    {
        process.exit();
    }
    
});