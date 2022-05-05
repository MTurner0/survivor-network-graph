// set the dimensions and margins of the graph
const margin = {top: 10, right: 30, bottom: 30, left: 40},
  width = 500 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

// will be used to set scale
const classes = ["All newbies", "All returners", "Captains", "Half and half"];

// append the svg object to the body of the page
const svg = d3.select("#graph")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        `translate(${margin.left}, ${margin.top})`);

const url = "assets/returners.json";

const fetchJson = async () => {
  try {
    const file = await fetch(url);
    const data = await file.json();
    console.log("Data collected.")
    return(data);
  } catch (error) {
    console.log(error);
  }
 };

fetchJson().then((data) => {

        // Get list of contestant names
        const raw_castaways = [];

        for(let i=0; i<data.links.length; i++) {
          raw_castaways[i] = data.links[i].name;
        }

        // Remove duplicate names
        const castaways = [...new Set(raw_castaways)];

        // Initialize menu
        const dropdown = d3.select("#graph")
          .append("select");

        dropdown // Add button
          .selectAll("options")
            .data(castaways)
          .enter()
            .append("option")
          .text(function (d) { return d; }) // Show text in the menu
          .attr("value", function (d) { return d; }); // Return value

        // Initialize the links
        const link = svg
            .selectAll("line")
            .data(data.links)
            .join("line")
            .style("stroke", "#aaa")
            .attr("stroke-width", d => d.strength) // Link thickness is determined by # of returners
            .attr("id", d => d.name.replace(/ /g, "-") + d.source); // Remove spaces from names

        // Color nodes by type of season
        const color = d3
        .scaleOrdinal(classes, d3.schemeCategory10)

        // Initialize the nodes
        const node = svg
            .selectAll("circle")
            .data(data.nodes)
            .join("circle")
            .attr("r", 10)
            .style("fill", d => color(d.type))
            .style("opacity", 1);

        // Label nodes
        const label = svg.append("g")
                    .attr("class", "labels")
                    .selectAll("text")
                    .data(data.nodes)
                    .enter().append("text")
                    .text(function(d) { return d.season_name; })
                    .attr("class", "label");

        // Let's list the force we want to apply on the network
        const simulation = d3.forceSimulation(data.nodes) // Force algorithm is applied to data.nodes
            .force("link", d3.forceLink() // This force provides links between nodes
                .id(function (d) { return d.id; }) // This provide  the id of a node
                .links(data.links) // and this the list of links
            )
            .force("charge", d3.forceManyBody().strength(-150)) // Adds repulsion between nodes.
            .force("center", d3.forceCenter(3 * width / 5, height / 2)) // This force attracts nodes slightly to the right to avoid the legend
            .on("end", ticked);

        // This function is run at each iteration of the force algorithm, updating the nodes position.
        function ticked() {
            link
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            node
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });

            label
                .attr("x", function(d) { return d.x; })
                .attr("y", function (d) { return d.y; });
        }

        // Make legend by hand

        svg.append("g")
          .selectAll("legend-dots")
          .data(classes)
          .enter()
          .append("circle")
            .attr("r", 10)
            .attr("cx", 0)
            .attr("cy", function(d,i) {
              return 25 * i;
            })
            .style("fill", function(d) {
              return color(d);
            });

          svg.append("g")
            .selectAll("legend-text")
            .data(classes)
            .enter()
            .append("text")
              .attr("x", 10)
              .attr("y", function(d,i) {
                return 5 + (25 * i);
              })
              .text(function(d) {
                return d;
              });

        // Add contestant selection
        dropdown.on("change", function() {
          // Reset line colors
          svg.selectAll("line")
            .style("stroke", "#aaa");

          // Put nodes and text back on top
          svg.selectAll("circle")
            .raise();

          svg.selectAll("text")
            .raise();

          // Recover the chosen contestant
          let selected = d3.select(this)
          .property("value");

          console.log(selected); // Print chosen contestant

          // Get all sources
          let selected_sources = data.links
            .filter(d => d["name"] == selected)
            .map(d => selected.replace(/ /g, "-") + d.source.id);

          console.log(selected_sources)

          // Update chart with this option
          for(let i=0; i<selected_sources.length; i++) {
            d3.select('#' + selected_sources[i])
            .style("stroke", "#000")
            .raise(); // Bring selected path to front
          }

        })

        // Add brushing
        const brush = d3.brush()
            .extent( [ [0, 0], [width + margin.left + margin.right, height + margin.top + margin.bottom] ] )
            .on("start brush", brushUpdateChart);

        svg.append("g")
          .call(brush);

        function brushUpdateChart() {
          extent = d3.brushSelection(this);
          node.classed("selected-node", function(d) {
            return isBrushed(extent, d.x, d.y)
            }
          );
          label.classed("selected-label", function(d) {
            return isBrushed(extent, d.x, d.y)
          });
        }

        // Determine whether a point is in the selected region
        function isBrushed(brushCoords, cx, cy) {
          let x0 = brushCoords[0][0],
              x1 = brushCoords[1][0],
              y0 = brushCoords[0][1],
              y1 = brushCoords[1][1];
         return x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1;    // This return TRUE or FALSE depending on if the point is in the selected area
        }

    });