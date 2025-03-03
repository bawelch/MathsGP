/***************************************************************
 * layoutUtils.js
 * 
 * Functions and utilities for adjusting SVG layout, snapping,
 * and setting node positions (including "viability" logic).
 ***************************************************************/
console.log("LayoutUtils loaded!");
import appConfig from "./config.js";
import { link, node, links, nodes, simulation, sourceId, targetId, g, playState } from './main.js';
export {linkDistance, chargeStrength, collisionRadius, nodeScale, linkScale, fontScale, clickGridWidth, snapGridWidth, clickYearBuffer} from './main.js';

import {handleMouseOver, handleMouseMove, handleMouseOut, handleNodeClick, handleNodeDblClick, dragStarted, dragged, dragEnded} from './eventHandlers.js';


/**
 * Dynamically adjusts the SVG size based on the controls panel height.
 * @returns {Object} { svgWidth, svgHeight }
 */
export function adjustSVGHeight(document) {
      const controlsContainer = document.querySelector(".controls-container");

    // Handle case where the controls container does not exist
    const controlsHeight = controlsContainer ? controlsContainer.offsetHeight : 0;
  const svgWidth = window.innerWidth;
  const baseBufferHeight = 10;
  const svgHeight = window.innerHeight - controlsHeight- baseBufferHeight;

  appConfig.svgWidth = svgWidth;
  appConfig.svgHeight = svgHeight;


  d3.select("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);



  return { svgWidth, svgHeight };
}




/**
 * Snaps a node's x-coordinate to the given grid size.
 */
function snapToGrid(node, gridSize) {
  const newX = Math.round(node.x / gridSize) * gridSize;
  node.x = newX;
  node.fx = newX;
}


export function propagateClickFromHighestYear() {
    // Step 1: Find the node with highest year AND netheld = 1
    const highestYearNode = nodes
        .filter(n => n.netheld === 1)
        .reduce((maxNode, currentNode) => (currentNode.year > (maxNode?.year || -Infinity) ? currentNode : maxNode), null);

    if (!highestYearNode) {
        console.warn("No nodes found with netheld = 1");
        return;
    }

    console.log(`Starting propagation from node ${highestYearNode.id} (Year: ${highestYearNode.year})`);

    // Step 2: Simulate click event on the highest year node
    handleNodeClick(null, highestYearNode);

    // Step 3: Propagate click to all `netheld = 1` nodes via parent nodes
    const visitedNodes = new Set(); // Track visited nodes

    function propagateClick(node) {
        if (!node || visitedNodes.has(node.id)) return; // Avoid re-processing
        visitedNodes.add(node.id);

        // Run the click event on this node
        handleNodeClick(null, node);

        // Find parent nodes (incoming links)
        const parentNodes = links
            .filter(link => link.target.id === node.id)
            .map(link => link.source)
            .filter(parent => parent.netheld === 1);

        // Recursively propagate the click event
        parentNodes.forEach(propagateClick);
    }

    // Start propagation from the highest year node
    propagateClick(highestYearNode);
}



/**
 * Basic version: finds an X that doesn't conflict with any held node
 * if their year is within TRACK_GAP of `click_node.year`.
 */
function findValidX_basic(click_node, nodes, heldParents, gridSize, TRACK_GAP) {
  const potentialX = Math.round(click_node.x / gridSize) * gridSize;
  const hasConflict = nodes.some(n => {
    if (n.spineheld === 1 && n !== click_node) {
      const closeInYear = Math.abs(n.year - click_node.year) < TRACK_GAP;
      const sameX = n.x === potentialX;
      if (closeInYear && sameX) return true;
    }
    return false;
  });

  return hasConflict ? null : potentialX;
}

/**
 * Attempts to find a valid X coordinate for `click_node` under different "modes."
 *
 * modes:
 *  -1:  Directly compute a "nearby" snap to click_node.x
 *   0:  Search outward from the center of the window
 *   1:  Search outward from the average (center of mass) of `syncNodes`
 */
function findValidX(click_node, nodes, syncNodes, gridSize, TRACK_GAP, mode_id) {
  // Helper to check if a given X conflicts with any other spineheld node
  function hasConflictAt(xValue) {
    for (const n of nodes) {
      if (n.spineheld === 1 && n !== click_node) {
        const closeInYear = Math.abs(n.year - click_node.year) < TRACK_GAP;
        const sameX = (n.x === xValue);
        if (closeInYear && sameX) {
          return true;
        }
      }
    }
    return false;
  }

  // Snap or search for a free X
  if (mode_id === -1) {
    // 1) Snap to nearest grid
    const potentialX = Math.round(click_node.x / gridSize) * gridSize;
    return hasConflictAt(potentialX) ? null : potentialX;
  }
  else if (mode_id === 0) {
    // 2) Search from the center of the window outward
    let centreX = Math.round((window.innerWidth / gridSize)/2) * gridSize;
    let direction = 1;
    let left = 1;
    let right = 1;
    let count = 2;

    if (centreX > window.innerWidth) {
      direction = -1;
    }

    do {
      const trialPosition = centreX + direction * Math.floor(count / 2) * gridSize;
      if (trialPosition < 0) {
        left = 0;
      } else if (trialPosition > window.innerWidth) {
        right = 0;
      } else {
        if (!hasConflictAt(trialPosition)) {
          return trialPosition;
        }
      }
      count++;
      direction *= -1;
    } while (left > 0 || right > 0);

    return null;
  }
  else if (mode_id === 1) {
    // 3) Search from "center of mass" of syncNodes outward
    if (!syncNodes || syncNodes.length === 0) {
      return null;
    }

    let position_sum = 0;
    for (const sn of syncNodes) {
      position_sum += sn.x;
    }
    const centreX = Math.round((position_sum / syncNodes.length) / gridSize) * gridSize;

    let direction = 1;
    let left = 1;
    let right = 1;
    let count = 2;
    if (centreX > window.innerWidth) {
      direction = -1;
    }

    do {
      const trialPosition = centreX + direction * Math.floor(count / 2) * gridSize;
      if (trialPosition < 0) {
        left = 0;
      } else if (trialPosition > window.innerWidth) {
        right = 0;
      } else {
        if (!hasConflictAt(trialPosition)) {
          return trialPosition;
        }
      }
      count++;
      direction *= -1;
    } while (left > 0 || right > 0);

    return null;
  }

  return null;
}

/**
 * Sets the node's x-position based on parent/child viability checks.
 */
export function setNodeXPosition(click_node, nodes, links, gridSize, TRACK_GAP) {
  // We rely on findParentNodes, findChildNodes, checkParentViability, etc.
  // Make sure those are globally available or imported from graphUtils.js.

  const parentNodes = findParentNodes(click_node, nodes, links);
  const childNodes = findChildNodes(click_node, nodes, links);

  const heldParents = parentNodes.filter(p => p.spineheld === 1);
  const heldChildren = childNodes.filter(c => c.spineheld === 1);

  const viableParents = heldParents.filter(p => checkParentViability(click_node, p, nodes));
  const viableChildren = heldChildren.filter(c => checkChildViability(click_node, c, nodes));

  // (A) No attached parents or children
  if (heldParents.length === 0 && heldChildren.length === 0) {
    snapToGrid(click_node, gridSize);
    return;
  }

  // (B) No attached parent, but at least one viable child
  if (heldParents.length === 0 && viableChildren.length > 0) {
    const chosenChild = viableChildren[0];
    click_node.x = chosenChild.x;
    click_node.fx = chosenChild.x;
    return;
  }

  // (C) No attached child, but at least one viable parent
  if (heldChildren.length === 0 && viableParents.length > 0) {
    const chosenParent = viableParents[0];
    click_node.x = chosenParent.x;
    click_node.fx = chosenParent.x;
    return;
  }

  // (D) Viable parents + children
  if (viableChildren.length > 0 && viableParents.length > 0) {
    const childXs = viableChildren.map(c => c.x);
    const matchingParent = viableParents.find(p => childXs.includes(p.x));
    if (matchingParent) {
      click_node.x = matchingParent.x;
      click_node.fx = matchingParent.x;
    } else {
      const chosenParent = viableParents[0];
      click_node.x = chosenParent.x;
      click_node.fx = chosenParent.x;
    }
    return;
  }

  // (E) Held parents but no viable parents/children => try mode=1
  if (heldChildren.length === 0 && viableParents.length === 0 && heldParents.length > 0) {
    const foundFreeX = findValidX(click_node, nodes, heldParents, gridSize, TRACK_GAP, 1);
    if (foundFreeX !== null) {
      click_node.x = foundFreeX;
      click_node.fx = foundFreeX;
      return;
    }
  }

  // (F) Held parents but no viable parents => fallback with children in mode=1
  if (viableChildren.length > 0 && viableParents.length === 0 && heldParents.length > 0) {
    const foundFreeX = findValidX(click_node, nodes, heldChildren, gridSize, TRACK_GAP, 1);
    if (foundFreeX !== null) {
      click_node.x = foundFreeX;
      click_node.fx = foundFreeX;
      return;
    }
  }

  // (G) No spot behind children, no spot ahead of parents => try mode=1 with them both
  if (viableChildren.length === 0 && heldChildren.length > 0 &&
      viableParents.length === 0 && heldParents.length > 0) {
    const heldNodes = [...new Set([...heldParents, ...heldChildren])];
    const foundFreeX = findValidX(click_node, nodes, heldNodes, gridSize, TRACK_GAP, 1);
    if (foundFreeX !== null) {
      click_node.x = foundFreeX;
      click_node.fx = foundFreeX;
      return;
    }
  }

  // (H) Final fallback => mode=0 or snap
  const foundFreeX = findValidX(click_node, nodes, heldParents, gridSize, TRACK_GAP, 0);
  if (foundFreeX !== null) {
    click_node.x = foundFreeX;
    click_node.fx = foundFreeX;
  } else {
    snapToGrid(click_node, gridSize);
  }
}

/**
 * Example function that repositions a clicked node (and shifts spineheld=1 nodes by +50).
 * (Adjust if referencing global `nodes` or `simulation`.)
 */
function recalcPositions(clickedNode) {
  const newX = Math.round(clickedNode.x / 200) * 200;
  clickedNode.x = newX;
  clickedNode.fx = newX;

  // This line assumes `nodes` is globally accessible or passed in.
  nodes.forEach(n => {
    if (n.spineheld === 1) {
      const shiftedX = n.x + 50;
      n.x = shiftedX;
      n.fx = shiftedX;
    }
  });

  // Similarly assumes `simulation` is in scope
  simulation.alpha(1).restart();
}
