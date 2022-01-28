# iNaturalist tools

These tools were created to query data from the iNaturalist repository, process the results, and insert the final product into the ArcGIS feature service environment.  The programs access iNaturalist via the iNaturalist API.  To interface with the ArcGIS system, the programs use the ArcGIS REST API.

The tools are written in JavaScript and require the Node.js runtime in order to execute.  You can read about and download the runtime from the <a href="https://nodejs.org/en/" target="_blank">Node.js website</a>.

Two of the JavaScript files in this repo are drivers; the rest are utilities.  Utilities perform a specific task, whereas drivers are more like batch programs -- orchestrating the utilities into a certain workflow.

Drivers are:

<ul>
    <li>driver-refresh-sample-species.js</li>
    <li>driver-update-edges.js</li>
</ul>

The utilities include:

<ul>
    <li>fs-load.js - loads a CSV into a target feature layer</li>
    <li>fs-purge.js - removes all records from a feature layer</li>
    <li>fs-snapshot.js - downloads contents of a featuer layer into a CSV file</li>
    <li>get-token.js - generates a token based on account user and password</li>
    <li>inat-fetch.js - queries observation data from iNaturalist and downloads to CSV</li>
    <li>report-differences.js- reports differences between two CSV snapshots</li>
    <li>report-drops.js - compares two feature layers to report whether there are species missing in the second layer that are present in the first layer</li>
</ul>


Workflow description can be found in this <a target="_blank" href="https://docs.google.com/document/d/1xvX1nFldvzQKAQZVu7qY7bBmpsH88Ov-Fj9XTTOOot4/edit?usp=sharing">Google Doc.</a>

Repo photo by <a href="https://unsplash.com/@benjamingriffinproductions?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Benjamin Griffin</a> on <a href="https://unsplash.com/s/photos/lodgepole-pine?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  
