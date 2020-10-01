const child_process = require("child_process");

console.log();

if (
    child_process.spawnSync(
        "node",
        ["inat-fetch", "../data/pinus-contorta-48934.csv"],
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
        ["project-coords", "../data/pinus-contorta-48934.csv", "temp-wm.csv"],
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
            "https://services.arcgis.com/nzS0F0zdNLvs7nc8/ArcGIS/rest/services/pinus_contorta_edit/FeatureServer/0"
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
            "https://services.arcgis.com/nzS0F0zdNLvs7nc8/ArcGIS/rest/services/pinus_contorta_edit/FeatureServer/0"
        ],
        {stdio: "inherit"}
    )
    .status !== 0    
)
{
    process.exit();
}