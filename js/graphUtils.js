/***************************************************************
 * graphUtils.js
 *
 * Functions to navigate and analyze the graph:
 * - Find parent/child nodes
 * - Check viability
 * - Build adjacency, find paths
 * - Track node visits
 ***************************************************************/

/**
 * Finds all parent nodes of `click_node` by scanning the links.
 * "Parent" means link.source.id === parent's ID && link.target.id === click_node.id
 */
function findParentNodes(click_node, allNodes, allLinks) {
  const parentIDs = allLinks
    .filter(link => link.target.id === click_node.id)
    .map(link => link.source.id);
  return allNodes.filter(n => parentIDs.includes(n.id));
}

/**
 * Finds all child nodes of `click_node` by scanning the links.
 * "Child" means link.source.id === click_node.id && link.target.id === childNode's ID
 */
function findChildNodes(click_node, allNodes, allLinks) {
  const childIDs = allLinks
    .filter(link => link.source.id === click_node.id)
    .map(link => link.target.id);
  return allNodes.filter(n => childIDs.includes(n.id));
}

/**
 * Checks if a parent node is viable, per your rules.
 * - Must not find another held node with the same x, 
 *   whose year is between parent.year and click_node.year.
 */
function checkParentViability(click_node, parentNode, nodes) {
  for (let check_node of nodes) {
    if (
      check_node !== click_node &&
      check_node.spineheld === 1 &&
      check_node.x === parentNode.x &&
      check_node.year > parentNode.year
    ) {
      return false; 
    }
  }
  return true;
}

/**
 * Checks if a child node is viable, per your rules:
 * - Must not find another held node with the same x,
 *   whose year is between click_node.year and childNode.year.
 */
function checkChildViability(click_node, childNode, nodes) {
  for (let check_node of nodes) {
    if (
      check_node !== click_node &&
      check_node.spineheld === 1 &&
      check_node.x === childNode.x &&
      check_node.year < childNode.year
    ) {
      return false; 
    }
  }
  return true;
}

/**
 * Builds an adjacency map: nodeId -> array of child nodeIds
 */
function buildAdjacencyMap(nodes, links) {
  const adjacency = {};
  nodes.forEach(n => {
    adjacency[n.id] = [];
  });
  links.forEach(link => {
    const parentId = link.source.id;
    const childId = link.target.id;
    adjacency[parentId].push(childId);
  });
  return adjacency;
}

/**
 * Finds all unique paths in a directed graph from `sourceId` to `targetId`,
 * moving parent -> child (link.source -> link.target).
 */
function findAllPaths(nodes, links, sourceId, targetId) {
  const adjacency = buildAdjacencyMap(nodes, links);
  const allPaths = [];
  const currentPath = [];

  function dfs(currentId) {
    currentPath.push(currentId);
    if (currentId === targetId) {
      allPaths.push([...currentPath]);
    } else {
      const children = adjacency[currentId] || [];
      for (let childId of children) {
        if (!currentPath.includes(childId)) {
          dfs(childId);
        }
      }
    }
    currentPath.pop();
  }

  dfs(sourceId);
  return allPaths;
}

/**
 * Given an array of nodes, reset each node's visitCount to 0.
 */
function resetNodeVisits(nodes) {
  nodes.forEach(node => {
    node.visitCount = 0;
  });
}

/**
 * Given a list of paths (each path is an array of node IDs),
 * increments visitCount for each node on each path.
 */
function incrementNodeVisitsForPaths(paths, nodes) {
  const nodeMap = {};
  nodes.forEach(n => {
    nodeMap[n.id] = n;
  });
  paths.forEach(path => {
    path.forEach(nodeId => {
      nodeMap[nodeId].visitCount++;
    });
  });
}
