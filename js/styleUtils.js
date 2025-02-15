/***************************************************************
 * styleUtils.js
 *
 * Holds style presets for nodes and links,
 * plus utility functions to apply them.
 ***************************************************************/

// Node style presets
const NODE_STYLES = {
  selected: {
    r: 10,
    "fill-opacity": 1,
    stroke: "black",
    "stroke-width": 4,
    "stroke-opacity": 1
  },
  spine: {
    r: 6,
    "fill-opacity": 1,
    stroke: "green",
    "stroke-width": 2,
    "stroke-opacity": 1
  },
  source: {
    r: 10,
    "fill-opacity": 1,
    stroke: "gold",
    "stroke-width": 2,
    "stroke-opacity": 1
  },
  target: {
    r: 10,
    "fill-opacity": 1,
    stroke: "gold",
    "stroke-width": 2,
    "stroke-opacity": 1
  },
  choice_in: {
    r: 8,
    "fill-opacity": 1,
    stroke: "black",
    "stroke-width": 6,
    "stroke-opacity": 0.3,
    choice: 1
  },
  choice_out: {
    r: 10,
    "fill-opacity": 1,
    stroke: "gold",
    "stroke-width": 6,
    "stroke-opacity": 0.5,
    choice: 1
  },
  revealed: {
    r: 5,
    "fill-opacity": 0.3,
    stroke: "black",
    "stroke-width": 1,
    "stroke-opacity": 0.2
  },
  pool: {
    r: 5,
    "fill-opacity": 0.1,
    stroke: "none",
    choice: 0
  }
};

// Link style presets
const LINK_STYLES = {
  spine: {
    stroke: "black",
    "stroke-width": 2,
    "stroke-opacity": 0.8
  },
  spineadjacent: {
    stroke: "black",
    "stroke-width": 5,
    "stroke-opacity": 0.3
  },
  general: {
    stroke: "gold",
    "stroke-width": 5,
    "stroke-opacity": 0.5
  },
  choice_in: {
    stroke: "black",
    "stroke-width": 3,
    "stroke-opacity": 0.5
  },
  choice_out: {
    stroke: "gold",
    "stroke-width": 3,
    "stroke-opacity": 0.5
  },
  pool: {
    stroke: "white",
    "stroke-opacity": 0
  }
};

/**
 * Applies a style preset to a node with a given ID.
 * @param {string|number} nodeId
 * @param {string} styleCode
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
 * @param {Object} focusLinkData
 * @param {string} styleCode
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
