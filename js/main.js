/***************************************************************
 * MAIN ENTRY POINT
 ***************************************************************/
//test
import initSimulation from './forceSimulation.js';
import {handleMouseOver, handleMouseMove, handleMouseOut, handleNodeClick, handleNodeDblClick, dragStarted, dragged, dragEnded} from './eventHandlers.js';
import { updateChoiceButton, createDynamicButton, toggleButton, repositionButton } from './choiceButtons.js';

// Some global references, or use closures:
let svg, g;
let nodes, links;
let link, node;
let simulation;

export { link, node, links, nodes, simulation };

// For removed data tracking
let removedNodes = new Map();
let removedLinks = new Map();

// Hardcoded source/target for the example
const sourceId = 1;
const targetId = 13;

export {sourceId, targetId};
import { adjustSVGHeight } from "./layoutUtils.js";
// Once the DOM is loaded, run the main
document.addEventListener("DOMContentLoaded", function() {
  
    const container = document.createElement("div");
    container.classList.add("choice-container");
    container.style.width = "300px";
    container.style.height = "200px";
    container.style.border = "2px solid black";
    container.style.padding = "10px";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.alignItems = "center";
    container.style.justifyContent = "space-between";
    container.style.backgroundColor = "#f9f9f9";
    container.style.position = "relative";

    // Add textboxes
    for (let i = 1; i <= 3; i++) {
        const textBox = document.createElement("div");
        textBox.id = `textbox${i}`;
        textBox.classList.add("textbox");
        textBox.textContent = `Text ${i}`;
        textBox.style.width = "90%";
        textBox.style.height = "30px";
        textBox.style.border = "1px solid #ccc";
        textBox.style.padding = "5px";
        textBox.style.textAlign = "center";
        textBox.style.backgroundColor = "white";
        textBox.style.fontSize = "14px";
        container.appendChild(textBox);
    }

    // Add update button
    const updateBtn = document.createElement("button");
    updateBtn.id = "updateChoiceButton";
    updateBtn.classList.add("update-btn");
    updateBtn.textContent = "Update";
    updateBtn.style.width = "100px";
    updateBtn.style.padding = "5px";
    updateBtn.style.marginTop = "10px";
    updateBtn.style.cursor = "pointer";
    updateBtn.style.backgroundColor = "blue";
    updateBtn.style.color = "white";
    updateBtn.style.border = "none";
    updateBtn.style.borderRadius = "5px";
    updateBtn.addEventListener("click", updateChoiceButton);

    container.appendChild(updateBtn);
    document.body.appendChild(container);

    // Create dynamic buttons
    createDynamicButton("Button 1", 350, 50);
    createDynamicButton("Button 2", 350, 100, false);
    createDynamicButton("Button 3", 350, 150);
    createDynamicButton("Button 4", 350, 200);
    createDynamicButton("Button 5", 350, 250);

    // Toggle Button Example
    setTimeout(() => toggleButton(1, true), 3000); // Activate Button 2 after 3 seconds
    setTimeout(() => repositionButton(2, 400, 120), 5000); // Move Button 3 after 5 seconds
    
    
    // 1) Adjust the SVG height
  const { svgWidth, svgHeight } = adjustSVGHeight(document);

  //const tempsvgw = appConfig.svgHeight


  // 2) Select the SVG & append <g> for actual content
  svg = d3.select("svg");
  g = svg.append("g");

  // 3) Load data
  d3.json("mgpdata.json").then(graphData => {
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
      .attr("stroke", "red")
      .attr("stroke-opacity", 0.1)
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
  })
  .catch(error => console.error(error));
});
