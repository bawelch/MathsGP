/***************************************************************
 * FORCE SIMULATION SETUP & RESTART LOGIC
 ***************************************************************/

import appConfig from './config.js';
import { link, node, links, nodes, simulation,g,playState } from './main.js';
import { applyNodeStyle, applyLinkStyle } from "./styleUtils.js"; // Import styling functions

export default function initSimulation(nodes, links) {
  // This is your default distance, charge, collision, etc.
  const linkDistance = 5;
  const chargeStrength = -5;
  const collisionRadius = 10;

  const nodeScale = 100;
  const linkScale = 100;
  const fontScale = 100;
  const clickGridWidth = 200;
  const clickSnapWidth = 100;
  const clickYearBuffer = 42;


  const sim = d3.forceSimulation(nodes)
    .force("link", d3.forceLink(links).id(d => d.id).distance(linkDistance))
    .force("charge", d3.forceManyBody().strength(chargeStrength))
    .force("collision", d3.forceCollide().radius(collisionRadius))
    .on("tick", ticked);

  return sim;
}

/**
 * The simulation's "tick" handler for positioning
 */
function ticked() {
    const padding = 10; // Minimum margin from the edge

    nodes.forEach(d => {
        // Constrain node positions within the window bounds
        d.x = Math.max(padding, Math.min(appConfig.svgWidth - padding, d.x));  // Horizontal bounds
        d.y = Math.max(padding, Math.min(appConfig.svgHeight - padding, d.y)); // Vertical bounds
    });
  link
    .attr("x1", d => d.source.x)
    .attr("y1", d => d.source.fixedY)
    .attr("x2", d => d.target.x)
    .attr("y2", d => d.target.fixedY);

  node
    .attr("transform", d => `translate(${d.x},${d.fixedY})`);
}
     /***************************************************************
         * 6) REMOVE/RESTORE DESCENDANTS & RESTART SIM
         ***************************************************************/

        function removeDescendants(node) {
            const descendants = new Set();
            const linksToRemove = [];
            const nodesToRemove = [];

            function findDescendants(nodeId) {
                links.forEach(link => {
                    if (link.source.id === nodeId) {
                        descendants.add(link.target.id);
                        linksToRemove.push(link);
                        findDescendants(link.target.id);
                    }
                });
            }

            findDescendants(node.id);

            descendants.forEach(descendantId => {
                const descendantNode = nodes.find(n => n.id === descendantId);
                if (descendantNode) nodesToRemove.push(descendantNode);
            });

            removedNodes.set(node.id, nodesToRemove);
            removedLinks.set(node.id, linksToRemove);

            nodes.splice(0, nodes.length, ...nodes.filter(n => !descendants.has(n.id)));
            links.splice(0, links.length, ...links.filter(l => !linksToRemove.includes(l)));
        }

        function restoreDescendants(node) {
            const nodesToRestore = removedNodes.get(node.id) || [];
            const linksToRestore = removedLinks.get(node.id) || [];

            nodes.push(...nodesToRestore);
            links.push(...linksToRestore);

            removedNodes.delete(node.id);
            removedLinks.delete(node.id);
        }

export function restartSimulation() {
    
        // Remove any text labels attached to nodes
    d3.selectAll(".node text").remove();

    // Reset all nodes to "pool" style
    nodes.forEach(n => {
        applyNodeStyle(n.id, "pool")
        n.spineheld=0;
        n.netheld=0;
        n.fx=null;

    });

    // Reset all links to "pool" style
    links.forEach(l => {
        applyLinkStyle(l, "pool")
    });


    // Restart the simulation
    simulation.nodes(nodes);
    simulation.force("link").links(links);
    simulation.alpha(1).restart();
}