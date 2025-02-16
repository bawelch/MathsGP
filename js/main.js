/***************************************************************
 * MAIN ENTRY POINT
 ***************************************************************/
//test
import initSimulation from './forceSimulation.js';
import {handleMouseOver, handleMouseMove, handleMouseOut, handleNodeClick, handleNodeDblClick, dragStarted, dragged, dragEnded} from './eventHandlers.js';
import { updateChoiceButton, createDynamicButton, toggleButton, repositionButton } from './choiceButtons.js';
import { restartSimulation } from './forceSimulation.js';  
import { displaySpine } from './eventHandlers.js';  
import { searchNodes } from './searchUtils.js';  
import { applyGlobalNodeScale } from './styleUtils.js';  
import { propagateClickFromHighestYear } from './layoutUtils.js';  



// Some global references, or use closures:
let svg, g;
let nodes, links;
let link, node;
let simulation;
let playState = {held_node:1};

export { link, node, links, nodes, simulation,g, playState };

// For removed data tracking
let removedNodes = new Map();
let removedLinks = new Map();

// Hardcoded source/target for the example
const sourceId = 1;
const targetId = 16;

export {sourceId, targetId};
import { adjustSVGHeight } from "./layoutUtils.js";
// Once the DOM is loaded, run the main
document.addEventListener("DOMContentLoaded", function() {
     // Event Listener for search input
    let searchInput = document.getElementById("nodeSearch");
    const searchResults = document.getElementById("searchResults");
    searchInput.addEventListener("input", (e) => {
        searchNodes(e.target.value, searchInput)
        });
  // 1) Adjust the SVG height
  const { svgWidth, svgHeight } = adjustSVGHeight(document);

    const button_buffer = -100
    const button_count = 4
      // Create dynamic buttons
    //createDynamicButton("Reset", svgWidth/(button_count+1), svgHeight - button_buffer, 200, 50);
    createDynamicButton("Reset Simulation", svgWidth/(button_count+1), svgHeight - button_buffer, 200, 50, true, () => {
        console.log("Simulation Reset Triggered");
        restartSimulation();
        });

    createDynamicButton("Add Ancestors", 2*svgWidth/(button_count+1), svgHeight - button_buffer, 200,50, true, () => {
        console.log("Add Ancestors Triggered");
        displaySpine(event, 0);
        });

    createDynamicButton("Add Descendents", 3*svgWidth/(button_count+1), svgHeight - button_buffer,200,50, true, () => {
        console.log("Add Ancestors Triggered");
        displaySpine(event, 1);
        });
    createDynamicButton("Lock to Grid", 4*svgWidth/(button_count+1), svgHeight - button_buffer,200,50, true, () => {
        console.log("Gridlock Triggered");
        propagateClickFromHighestYear();
        });
    //createDynamicButton("Button 5", 350, svgHeight - 100);

    // Toggle Button Example
    //setTimeout(() => toggleButton(1, true), 3000); // Activate Button 2 after 3 seconds
    //setTimeout(() => repositionButton(2, 400, 120), 5000); // Move Button 3 after 5 seconds



  //const tempsvgw = appConfig.svgHeight


  // 2) Select the SVG & append <g> for actual content
  svg = d3.select("svg");
  g = svg.append("g");

  // 3) Load data
  d3.json("data/mgpxdata.json").then(graphData => {
    nodes = graphData.nodes;
    links = graphData.links;

    // Initialize each node's custom props
    nodes.forEach((n, i) => {
      n.hidden = false;
      n.year = n.y;
      n.spine = 0;
      n.choice = 0;
      n.spineheld = 0;
      n.fixedY = svgHeight - ((n.y - 1600) / (2005 - 1600)) * svgHeight;
      n.fixedY = Math.max(10, Math.min(svgHeight - 10, n.fixedY));

      // Hardcoded example: fix source & target in center
      if (i === sourceId - 1) {
        n.fx = svgWidth / 2;
        n.spine = 1;
        n.spineheld = 1;
      }
      else if (i === targetId - 1) {
        n.fx = svgWidth / 2;
        n.spine = 1;
        n.spineheld = 1;
      }
      else {
          n.x = svgWidth/2;
      }
    });

    links.forEach(l => {
      l.hidden = false;
      l.highlighted = false;
      l.highlightColor = null;
    });

    // 4) Create the simulation
    simulation = initSimulation(nodes, links);

    // 4a Generate spine info
    resetNodeVisits(nodes);
    const allPaths = findAllPaths(nodes, links, sourceId, targetId);

    incrementNodeVisitsForPaths(allPaths, nodes);

    // Now each node object in `nodes` has a `.visitCount` property
    // representing how many times that node appeared across all paths.
    console.log("All paths:", allPaths);
    console.log("Nodes with updated visitCount:", nodes);


    // 5) Create link elements
    link = g.append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "black")
      .attr("stroke-opacity", 0.05)
      .attr("stroke-width", 1)
      .attr("spineheld", 0);

    // 6) Create node groups
    node = g.append("g")
      .attr("class", "nodes")
      .attr("choice", 0)
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .attr("r", 5)
      .attr("baser", 5)
      .attr("class", "node")
      .attr("fill-opacity", 0.2)
      .attr("stroke-opacity", 0.2);

    // 7) Append circles, attach event handlers
    node.append("circle")
      .attr("r", 5)
      .attr("fill", d => d.color)
      .on("mouseover", handleMouseOver)
      .on("mousemove", handleMouseMove)
      .on("mouseout", handleMouseOut);

    node
      .on("click", handleNodeClick)
      .on("dblclick", handleNodeDblClick);

    // 8) Enable D3 drag
    const dragBehavior = d3.drag()
      .on("start", dragStarted)
      .on("drag", dragged)
      .on("end", dragEnded);
    node.call(dragBehavior);

    // 9) Example styling or highlight for special nodes
    d3.selectAll(".node")
      .filter(n => n.id === sourceId)
      .select("circle")
      .attr("r", 15)
      .attr("fill-opacity", 0.898)
      .attr("stroke-opacity", 1);

    // 10) Slider inputs
    d3.select("#linkDistance").on("input", function() {
      let linkDistance = +this.value;
      d3.select("#linkDistanceValue").text(linkDistance);
      simulation.force("link", d3.forceLink(links).id(d => d.id).distance(linkDistance));
      simulation.alpha(1).restart();
    });

    d3.select("#chargeStrength").on("input", function() {
      let chargeStrength = +this.value;
      d3.select("#chargeStrengthValue").text(chargeStrength);
      simulation.force("charge", d3.forceManyBody().strength(chargeStrength));
      simulation.alpha(1).restart();
    });

    d3.select("#collisionRadius").on("input", function() {
      let collisionRadius = +this.value;
      d3.select("#collisionRadiusValue").text(collisionRadius);
      simulation.force("collision", d3.forceCollide().radius(collisionRadius));
      simulation.alpha(1).restart();
    });

    d3.select("#nodeScale").on("input", function() {
      let nodeScale = +this.value;
      d3.select("#nodeScaleValue").text(nodeScale);
      applyGlobalNodeScale(nodeScale);
      simulation.alpha(1).restart();
    });

    d3.select("#linkScale").on("input", function() {
      let linkScale = +this.value;
      d3.select("#linkScaleValue").text(linkScale);
      //simulation.force("charge", d3.forceManyBody().strength(chargeStrength));
      //simulation.alpha(1).restart();
    });

    d3.select("#fontScale").on("input", function() {
      let fontScale = +this.value;
      d3.select("#fontScaleValue").text(fontScale);
      //simulation.force("collision", d3.forceCollide().radius(collisionRadius));
      //simulation.alpha(1).restart();
    });

    d3.select("#clickGridWidth").on("input", function() {
      let clickGridWidth = +this.value;
      d3.select("#clickGridWidthValue").text(clickGridWidth);
      //simulation.force("link", d3.forceLink(links).id(d => d.id).distance(linkDistance));
      //simulation.alpha(1).restart();
    });

    d3.select("#snapGridWidth").on("input", function() {
      let snapGridWidth = +this.value;
      d3.select("#chargeStrengthValue").text(snapGridWidth);
      //simulation.force("charge", d3.forceManyBody().strength(chargeStrength));
      //simulation.alpha(1).restart();
    });

    d3.select("#clickYearBuffer").on("input", function() {
      let clickYearBuffer = +this.value;
      d3.select("#clickYearBufferValue").text(clickYearBuffer);
      //simulation.force("collision", d3.forceCollide().radius(collisionRadius));
      //simulation.alpha(1).restart();
    });

  })
  .catch(error => console.error(error));
});
