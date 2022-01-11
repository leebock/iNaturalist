# iNaturalist tools

These tools were created to query data from the iNaturalist repository, process the results, and insert the final product into the ArcGIS feature service environment.  The programs access iNaturalist via the iNaturalist API.  To interface with the ArcGIS system, the programs use the ArcGIS REST API.

The tools are written in JavaScript and require the Node.js runtime in order to execute.  You can read about and download the runtime from the <a href="https://nodejs.org/en/" target="_blank">Node.js website</a>.

Of the ten JavaScript files in the repo, two are drivers and eight are utilities.  Utilities perform a specific task, whereas drivers are more like batch programs -- orchestrating the utilities into a certain workflow.

The utilities are:

<ul>
    <li>fs-load.js</li>
    <li>fs-purge.js</li>
    <li>fs-snapshot.js</li>
    <li>get-token.js</li>
    <li>inat-fetch.js</li>
    <li>report-differences.js</li>
    <li>report-drops.js</li>
</ul>

Drivers are:

<ul>
    <li>driver-refresh-sample-species.js</li>
    <li>driver-update-edges.js</li>
</ul>

Repo photo by <a href="https://unsplash.com/@benjamingriffinproductions?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Benjamin Griffin</a> on <a href="https://unsplash.com/s/photos/lodgepole-pine?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
  
