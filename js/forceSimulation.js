/***************************************************************
 * FORCE SIMULATION SETUP & RESTART LOGIC
 ***************************************************************/

import appConfig from './config.js';
import { link, node, links, nodes, simulation } from './main.js';

export default function initSimulation(nodes, links) {
  // This is your default distance, charge, collision, etc.
  const linkDistance = 5;
  const chargeStrength = -5;
  const collisionRadius = 10;

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

        function restartSimulation() {
            link = g.selectAll(".link")
                .data(links, d => `${d.source.id}-${d.target.id}`);
            link.exit().remove();
            link.enter()
                .append("line")
                .attr("class", "link")
                .merge(link);

            node = g.selectAll(".node")
                .data(nodes, d => d.id);
            node.exit().remove();

            const nodeEnter = node.enter()
                .append("g")
                .attr("class", "node")
                .call(d3.drag()
                    .on("start", dragStarted)
                    .on("drag", dragged)
                    .on("end", dragEnded)
                );

            nodeEnter.append("circle")
                .attr("r", 5)
                .attr("fill", d => d.color);

            node = nodeEnter.merge(node);

            simulation.nodes(nodes);
            simulation.force("link").links(links);
            simulation.alpha(1).restart();
        }