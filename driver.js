const child_process = require("child_process");

const CONFIGS = [
    {
        species: "Pinus contorta",
        csv: "../data/pinus-contorta.csv",
        service: "https://services.arcgis.com/nzS0F0zdNLvs7nc8/ArcGIS/rest/services/pinus_contorta_edit/FeatureServer/0"
    },
    {
        species: "Acer spicatum",
        csv: "../data/acer-spicatum.csv",
        service: "https://services.arcgis.com/nzS0F0zdNLvs7nc8/arcgis/rest/services/acer_spicatum_edit/FeatureServer/0"
    }    
];

CONFIGS.forEach((config, i) => {

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
            ["project-coords", config.csv, "scratch/temp-wm.csv"],
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
                "scratch/temp-wm.csv",
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