// set the dimensions and margins of the graph
const margin = {top: 10, right: 30, bottom: 30, left: 40},
  width = 500 - margin.left - margin.right,
  height = 500 - margin.top - margin.bottom;

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

        // Initialize the links
        const link = svg
            .selectAll("line")
            .data(data.links)
            .join("line")
            .style("stroke", "#aaa");

        // Color nodes by type of season
        var color = d3
        .scaleOrdinal(["All newbies", "All returners", "Captains", "Half and half"], d3.schemeCategory10)

        // Initialize the nodes
        const node = svg
            .selectAll("circle")
            .data(data.nodes)
            .join("circle")
            .attr("r", 10)
            .style("fill", d => color(d.type));

        // Let's list the force we wanna apply on the network
        const simulation = d3.forceSimulation(data.nodes) // Force algorithm is applied to data.nodes
            .force("link", d3.forceLink() // This force provides links between nodes
                .id(function (d) { return d.id; }) // This provide  the id of a node
                .links(data.links) // and this the list of links
            )
            .force("charge", d3.forceManyBody().strength(-100)) // Adds repulsion between nodes.
            .force("center", d3.forceCenter(3 * width / 4, height / 2)) // This force attracts nodes slightly to the right to avoid the legend
            .on("end", ticked);

        // This function is run at each iteration of the force algorithm, updating the nodes position.
        function ticked() {
            link
                .attr("x1", function (d) { return d.source.x; })
                .attr("y1", function (d) { return d.source.y; })
                .attr("x2", function (d) { return d.target.x; })
                .attr("y2", function (d) { return d.target.y; });

            node
                .attr("cx", function (d) { return d.x + 6; })
                .attr("cy", function (d) { return d.y - 6; });
        }

        // Make legend
        svg.append("g")
          .attr("class", "legendOrdinal")
          .attr("transform", `translate(0,20)`);

        var legendOrdinal = d3.legendColor()
          .scale(color);

        svg.select(".legendOrdinal")
          .call(legendOrdinal);

    });