const child_process = require("child_process");

const CONFIG = {
    species: "Pinus contorta",
    csv: "../data/pinus-contorta.csv",
    service: "https://services.arcgis.com/nzS0F0zdNLvs7nc8/ArcGIS/rest/services/pinus_contorta_edit/FeatureServer/0"
};

console.log();

if (
    child_process.spawnSync(
        "node",
        ["inat-fetch", CONFIG.species, CONFIG.csv],
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
        ["project-coords", CONFIG.csv, "temp-wm.csv"],
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
            CONFIG.service
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
            "temp-wm.csv",
            CONFIG.service
        ],
        {stdio: "inherit"}
    )
    .status !== 0    
)
{
    process.exit();
}