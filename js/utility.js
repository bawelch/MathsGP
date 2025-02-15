        /***************************************************************
         * 1) HELPER FUNCTIONS & UTILITIES
         ***************************************************************/

        /**
         * Dynamically adjusts the SVG size based on the controls panel height.
         * @returns {Object} { svgWidth, svgHeight }
         */
        function adjustSVGHeight() {
            const controlsHeight = document.querySelector(".controls-container").offsetHeight;
            const svgWidth = window.innerWidth;
            const baseBufferHeight = 50
            const svgHeight = window.innerHeight - controlsHeight-baseBufferHeight;

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

        /**
         * Finds all parent nodes of `click_node` by scanning the links.
         * "Parent" is where link.source.id === parent's ID and link.target.id === click_node.id
         */
        function findParentNodes(click_node, allNodes, allLinks) {
            const parentIDs = allLinks
                .filter(link => link.target.id === click_node.id)
                .map(link => link.source.id);
            return allNodes.filter(n => parentIDs.includes(n.id));
        }

        /**
         * Finds all child nodes of `click_node` by scanning the links.
         * "Child" is where link.source.id === click_node.id and link.target.id === child's ID
         */
        function findChildNodes(click_node, allNodes, allLinks) {
            const childIDs = allLinks
                .filter(link => link.source.id === click_node.id)
                .map(link => link.target.id);
            return allNodes.filter(n => childIDs.includes(n.id));
        }

        /**
         * Checks if a parent node is viable, per your rules:
         * - Must not find another held node with the same x, whose year is between parent.year and click_node.year.
         */
        function checkParentViability(click_node, parentNode, nodes) {
            for (let check_node of nodes) {
                if (
                    check_node !== click_node &&
                    check_node.spineheld === 1 &&
                    check_node.x === parentNode.x &&
                    check_node.year > parentNode.year
                ) {
                    return false; // inviability found
                }
            }
            return true;
        }

        /**
         * Checks if a child node is viable, per your rules:
         * - Must not find another held node with the same x, whose year is between click_node.year and childNode.year.
         */
        function checkChildViability(click_node, childNode, nodes) {
            for (let check_node of nodes) {
                if (
                    check_node !== click_node &&
                    check_node.spineheld === 1 &&
                    check_node.x === childNode.x &&
                    check_node.year < childNode.year
                ) {
                    return false; // inviability found
                }
            }
            return true;
        }

        /**
         * Searches for an x-position that doesn't conflict with any held node if
         * their year is within TRACK_GAP of click_node.year.
         */
        function findValidX_basic(click_node, nodes, heldParents, gridSize, TRACK_GAP, mode) {
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
 *
 * @param {Object}  click_node  The node we're repositioning.
 * @param {Array}   nodes       All node data.
 * @param {Array}   syncNodes   Subset of nodes for "center of mass" in mode=1.
 * @param {Number}  gridSize    The snapping increment for X.
 * @param {Number}  TRACK_GAP   The year proximity threshold for conflicts.
 * @param {Number}  mode_id     The mode to use: -1, 0, or 1.
 * @returns {Number|null}       A valid X or null if none found.
 */
function findValidX(click_node, nodes, syncNodes, gridSize, TRACK_GAP, mode_id) {
  // Helper to check if a given X conflicts with any other spineheld node
    function hasConflictAt(xValue) {
      let conflictFound = false;

      for (const n of nodes) {
        if (n.spineheld === 1 && n !== click_node) {
          const closeInYear = Math.abs(n.year - click_node.year) < TRACK_GAP;
          const sameX = (n.x === xValue);
          if (closeInYear && sameX) {
            conflictFound = true;
            // But don't 'break' if you truly want to check each node 
            // for any side-effects or logs
          }
        }
      }

      return conflictFound;
    }

  // Initialize result and possibly conflict
  let potentialX = null;

  if (mode_id === -1) {
    // 1) Snap to the nearest grid from click_node.x
    potentialX = Math.round(click_node.x / gridSize) * gridSize;

    // Check conflict
    const conflict = hasConflictAt(potentialX);
    return conflict ? null : potentialX;

  } else if (mode_id === 0) {
    // 2) Find any viable spot "center out" from window center
    //    We'll check positions around centerX in a do/while.

    let centreX = Math.round((window.innerWidth / gridSize)/2) * gridSize;
    let direction = 1;
    let left = 1;
    let right = 1;
    let count = 2;

    // If the center is beyond the window, reverse direction
    if (centreX > window.innerWidth) {
      direction = -1;
    }

    // We'll try positions: centreX, centreX +/- gridSize, etc.
    do {
      const trialPosition = centreX + direction * Math.floor(count / 2) * gridSize;

      // Check if within window bounds
      if (trialPosition < 0) {
        left = 0;
      } else if (trialPosition > window.innerWidth) {
        right = 0;
      } else {
        // Check conflict
        if (!hasConflictAt(trialPosition)) {
          return trialPosition;
        }
      }

      count++;
      // Flip direction after each increment, e.g. +, -, +, -
      direction *= -1;

    } while (left > 0 || right > 0);

    // If no position found
    return null;

  } else if (mode_id === 1) {
    // 3) Find viable spot center-out from the "center of mass" of syncNodes
    //    If no syncNodes, fallback logic can go here.

    if (!syncNodes || syncNodes.length === 0) {
      return null;
    }

    // Average X of syncNodes
    let position_sum = 0;
    let count_syncs = 0;

    syncNodes.forEach(sync_node => {
      position_sum += sync_node.x;
      count_syncs++;
    });

    const centreX = Math.round((position_sum / count_syncs) / gridSize) * gridSize;

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
      // Flip direction after each increment
      direction *= -1;

    } while (left > 0 || right > 0);

    return null;
  }

  // If mode_id wasn't -1,0,1, or no valid X was found
  return null;
}




        /**
         * Sets the node's x-position based on parent/child viability checks.
         * Follows your multi-step logic to handle parents, children, fallback, etc.
         */
        function setNodeXPosition(click_node, nodes, links, gridSize, TRACK_GAP) {
  // 1) Identify parents and children
  const parentNodes = findParentNodes(click_node, nodes, links);
  const childNodes = findChildNodes(click_node, nodes, links);

  // 2) Filter out the ones that have spineheld = 1
  const heldParents = parentNodes.filter(p => p.spineheld === 1);
  const heldChildren = childNodes.filter(c => c.spineheld === 1);

  // 3) Check viability for each held parent/child
  const viableParents = heldParents.filter(p => checkParentViability(click_node, p, nodes));
  const viableChildren = heldChildren.filter(c => checkChildViability(click_node, c, nodes));

  // =========================
  // DECISION LOGIC
  // =========================

  // (A) No attached (held) parents or children
  if (heldParents.length === 0 && heldChildren.length === 0) {
    // Snap to the nearest grid from the clicked node’s x
    snapToGrid(click_node, gridSize);
    return;
  }

  // (B) No attached parent, at least one viable child
  if (heldParents.length === 0 && viableChildren.length > 0) {
    // Snap to the x of the first viable child
    const chosenChild = viableChildren[0];
    click_node.x = chosenChild.x;
    click_node.fx = chosenChild.x;
    return;
  }

  // (C) No attached child, at least one viable parent
  if (heldChildren.length === 0 && viableParents.length > 0) {
    // Snap to the x of the first viable parent
    const chosenParent = viableParents[0];
    click_node.x = chosenParent.x;
    click_node.fx = chosenParent.x;
    return;
  }

  // (D) Viable parent(s) and child(ren)
  if (viableChildren.length > 0 && viableParents.length > 0) {
    // Look for a parent x that matches one of the child x's
    const childXs = viableChildren.map(c => c.x);
    const matchingParent = viableParents.find(p => childXs.includes(p.x));

    if (matchingParent) {
      click_node.x = matchingParent.x;
      click_node.fx = matchingParent.x;
    } else {
      // fallback to first viable parent's x
      const chosenParent = viableParents[0];
      click_node.x = chosenParent.x;
      click_node.fx = chosenParent.x;
    }
    return;
  }

  // (E) "No spot ahead of attached parent, no children"
  //     => i.e., there are held parents but no viable children or parents
  //        that can be used directly => fallback to findValidX with mode=1
  if (heldChildren.length === 0 && viableParents.length === 0 && heldParents.length > 0) {
    const foundFreeX = findValidX(click_node, nodes, heldParents, gridSize, TRACK_GAP, /*mode=*/1);
    if (foundFreeX != null) {
      click_node.x = foundFreeX;
      click_node.fx = foundFreeX;
      return;
    }
    // If still no valid spot, we continue below to final fallback
  }

  // (F) "No spot ahead of attached parent, no children"
  //     => i.e., there are held parents but no viable children or parents
  //        that can be used directly => fallback to findValidX with mode=1
  if (viableChildren.length > 0 && viableParents.length === 0 && heldParents.length > 0) {
    const foundFreeX = findValidX(click_node, nodes, heldChildren, gridSize, TRACK_GAP, /*mode=*/1);
    if (foundFreeX != null) {
      click_node.x = foundFreeX;
      click_node.fx = foundFreeX;
      return;
    }
    // If still no valid spot, we continue below to final fallback
  }

  // (G) "No spot ahead of attached parent, no spot behind attached children"
  //     => i.e., there are held parents but no viable children or parents
  //        that can be used directly => fallback to findValidX with mode=1
  if (viableChildren.length === 0 && heldChildren.length > 0 && viableParents.length === 0 && heldParents.length > 0) {
      const heldNodes = [...new Set([...heldParents, ...heldChildren])];
      const foundFreeX = findValidX(click_node, nodes, heldNodes, gridSize, TRACK_GAP, /*mode=*/1);
    if (foundFreeX != null) {
      click_node.x = foundFreeX;
      click_node.fx = foundFreeX;
      return;
    }
    // If still no valid spot, we continue below to final fallback
  }

  // (H) Otherwise, find a free x with fallback mode=0
  const foundFreeX = findValidX(click_node, nodes, heldParents, gridSize, TRACK_GAP, /*mode=*/0);
  if (foundFreeX != null) {
    click_node.x = foundFreeX;
    click_node.fx = foundFreeX;
  } else {
    // final fallback
    snapToGrid(click_node, gridSize);
  }
}

        /**
         * Applies a style preset to a node with a given ID.
         * @param {String|Number} nodeId  The node ID
         * @param {String} styleCode      Key from NODE_STYLES
         */
        function applyNodeStyle(nodeId, styleCode) {
            const stylePreset = NODE_STYLES[styleCode];
            if (!stylePreset) {
                console.warn(`No style preset found for code "${styleCode}". Skipping...`);
                return;
            }

            const circleSelection = d3.selectAll(".node")
                .filter(d => d.id === nodeId)
                .select("circle");

            Object.entries(stylePreset).forEach(([attrName, attrValue]) => {
                circleSelection.attr(attrName, attrValue);
            });
        }

        /**
         * Applies a style preset to a link (by datum).
         * @param {Object} focusLinkData  The link datum
         * @param {String} styleCode      Key from LINK_STYLES
         */
        function applyLinkStyle(focusLinkData, styleCode) {
            const stylePreset = LINK_STYLES[styleCode];
            if (!stylePreset) {
                console.warn(`No style preset found for code "${styleCode}". Skipping...`);
                return;
            }

            const linkSelection = d3.selectAll(".link")
                .filter(d => d === focusLinkData);

            Object.entries(stylePreset).forEach(([attrName, attrValue]) => {
                linkSelection.attr(attrName, attrValue);
            });
        }

        /**
         * Example function that repositions a clicked node (and shifts spineheld=1 nodes by +50).
         */
        function recalcPositions(clickedNode) {
            const newX = Math.round(clickedNode.x / 200) * 200;
            clickedNode.x = newX;
            clickedNode.fx = newX;

            nodes.forEach(n => {
                if (n.spineheld === 1) {
                    const shiftedX = n.x + 50;
                    n.x = shiftedX;
                    n.fx = shiftedX;
                }
            });

            simulation.alpha(1).restart();
        }
        /**
 * Finds all unique paths in a directed graph (defined by `nodes` and `links`)
 * from `sourceId` to `targetId`, moving only from parent -> child (i.e., link.source -> link.target).
 * 
 * @param {Array} nodes - Array of node objects, each with a unique `id`.
 * @param {Array} links - Array of link objects, each with `.source.id` and `.target.id`.
 * @param {String|Number} sourceId - The ID of the start node.
 * @param {String|Number} targetId - The ID of the end node.
 * @returns {Array} A list of paths, where each path is an array of node IDs.
 */
        function findAllPaths(nodes, links, sourceId, targetId) {
            // 1) Build an adjacency map: nodeId -> array of child nodeIds
            //    so we can easily look up the "children" of a node.
            const adjacency = buildAdjacencyMap(nodes, links);

            const allPaths = [];
            const currentPath = [];

            function dfs(currentId) {
                // Add the current node to the path
                currentPath.push(currentId);

                // If we reached the target, record the current path
                if (currentId === targetId) {
                    // Make a copy since `currentPath` is mutable
                    allPaths.push([...currentPath]);
                } else {
                    // Otherwise, continue DFS on each child
                    const children = adjacency[currentId] || [];
                    for (let childId of children) {
                        // Avoid re-visiting a node in the current path if you want strictly simple paths
                        if (!currentPath.includes(childId)) {
                            dfs(childId);
                        }
                    }
                }

                // Backtrack
                currentPath.pop();
            }

            // Start DFS from sourceId
            dfs(sourceId);
            return allPaths;
        }

        /**
         * Helper to build a map of nodeId -> array of child nodeIds from the given links.
         */
        function buildAdjacencyMap(nodes, links) {
            const adjacency = {};
            // Initialize adjacency list for each node
            nodes.forEach(n => {
                adjacency[n.id] = [];
            });

            // Populate adjacency
            links.forEach(link => {
                // We'll assume link.source.id and link.target.id exist
                const parentId = link.source.id;
                const childId = link.target.id;
                adjacency[parentId].push(childId);
            });
            return adjacency;
        }

        /**
         * Given an array of `nodes`, resets each node's `visitCount` to 0 (or creates it if missing).
         */
        function resetNodeVisits(nodes) {
            nodes.forEach(node => {
                node.visitCount = 0;
            });
        }

        /**
         * Given a list of paths (each path is an array of node IDs),
         * increments `visitCount` for each node on each path.
         * Assumes `nodes` is an array of node objects each accessible by ID.
         */
        function incrementNodeVisitsForPaths(paths, nodes) {
            // For fast lookup: build a map of nodeId -> node object
            const nodeMap = {};
            nodes.forEach(n => {
                nodeMap[n.id] = n;
            });

            // For each path and for each nodeId in that path, increment visitCount
            paths.forEach(path => {
                path.forEach(nodeId => {
                    nodeMap[nodeId].visitCount++;
                });
            });
        }

        /***************************************************************
         * 2) PAGE SETUP & GLOBAL VARIABLES
         ***************************************************************/


        // Node & link style presets
        const NODE_STYLES = {
            selected: {
                r: 10,
                "fill-opacity": 1,
                "stroke": "black",
                "stroke-width": 4,
                "stroke-opacity": 1
            },
            spine: {
                r: 6,
                "fill-opacity": 1,
                "stroke": "green",
                "stroke-width": 2,
                "stroke-opacity": 1
            },
            source: {
                r: 10,
                "fill-opacity": 1,
                "stroke": "gold",
                "stroke-width": 2,
                "stroke-opacity": 1
            },
            target: {
                r: 10,
                "fill-opacity": 1,
                "stroke": "gold",
                "stroke-width": 2,
                "stroke-opacity": 1
            },
            choice_in: {
                r: 8,
                "fill-opacity": 1,
                "stroke": "black",
                "stroke-width": 6,
                "stroke-opacity": 0.3,
                "choice": 1
            },
            choice_out: {
                r: 10,
                "fill-opacity": 1,
                "stroke": "gold",
                "stroke-width": 6,
                "stroke-opacity": 0.5,
                "choice": 1
            },
            revealed: {
                r: 5,
                "fill-opacity": 0.3,
                "stroke": "black",
                "stroke-width": 1,
                "stroke-opacity": 0.2
            },
            pool: {
                r: 5,
                "fill-opacity": 0.1,
                "stroke": "none",
                "choice": 0
            }
        };

        const LINK_STYLES = {
            spine: {
                "stroke": "black",
                "stroke-width": 2,
                "stroke-opacity": 0.8
            },
            spineadjacent: {
                "stroke": "black",
                "stroke-width": 5,
                "stroke-opacity": 0.3
            },
            general: {
                "stroke": "gold",
                "stroke-width": 5,
                "stroke-opacity": 0.5
            },
            choice_in: {
                "stroke": "black",
                "stroke-width": 3,
                "stroke-opacity": 0.5
            },
            choice_out: {
                "stroke": "gold",
                "stroke-width": 3,
                "stroke-opacity": 0.5
            },
            pool: {
                "stroke": "white",
                "stroke-opacity": 0
            }
        };

