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
    baser: 10,
    "fill-opacity": 1,
    stroke: "black",
    "stroke-width": 4,
    "stroke-opacity": 1
  },
  spine: {
    r: 6,
    baser: 6,
    netheld: 1,
    "fill-opacity": 1,
    stroke: "green",
    "stroke-width": 2,
    "stroke-opacity": 1
  },
  source: {
    r: 10,
    baser: 10,
    "fill-opacity": 1,
    stroke: "gold",
    "stroke-width": 2,
    "stroke-opacity": 1
  },
  target: {
    r: 10,
    baser: 10,
    "fill-opacity": 1,
    stroke: "gold",
    "stroke-width": 2,
    "stroke-opacity": 1
  },
  choice_in: {
    r: 8,
    baser: 8,
    "fill-opacity": 1,
    stroke: "yellow",
    "stroke-width": 6,
    "stroke-opacity": 0.5,
    choice: 1
  },
  choice_out: {
    r: 10,
    baser: 10,
    "fill-opacity": 1,
    stroke: "green",
    "stroke-width": 6,
    "stroke-opacity":0.7,
    choice: 1
  },
  held_in: {
    r: 8,
    baser: 8,
    "fill-opacity": 1,
    stroke: "yellow",
    "stroke-width": 6,
    "stroke-opacity": 0.1,
    choice: 1
  },
  held_out: {
    r: 10,
    baser: 10,
    "fill-opacity": 1,
    stroke: "green",
    "stroke-width": 6,
    "stroke-opacity": 0.1,
    choice: 1
  },
  revealed: {
    r: 5,
    baser: 5,
    "fill-opacity": 0.3,
    stroke: "black",
    "stroke-width": 1,
    "stroke-opacity": 0.2
  },
  pool: {
    r: 5,
    baser: 5,
    "fill-opacity": 0.1,
    stroke: "none",
    choice: 0
  }
};

// Link style presets
const LINK_STYLES = {
  spine: {
    netheld: 1,
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
    stroke: "yellow",
    "stroke-width": 3,
    "stroke-opacity": 0.3
  },
  choice_out: {
    stroke: "green",
    "stroke-width": 3,
    "stroke-opacity": 0.3
  },
  held_in: {
    stroke: "black",
    "stroke-width": 3,
    "stroke-opacity": 0.5
  },
  held_out: {
    stroke: "gold",
    "stroke-width": 3,
    "stroke-opacity": 0.5
  },
  pool: {
    stroke: "black",
    "stroke-width": 1,
    "stroke-opacity": 0.05
  }
};

// Link style presets
const TEXT_STYLES = {
  spine: {
    "x": 9,
    "y": 3,
    "basex": 9,
    "basey": 3,
    "fill": "black",
    "fill-opacity": 0.5,
    "style:font-size": "10px",
    "style:font-weight": "normal",
    "style:font-family": "Arial, sans-serif",
  },
  selected: {
    "x": 9,
    "y": 3,
    "basex": 9,
    "basey": 3,
    "fill": "black",
    "fill-opacity": 1,
    "style:font-size": "10px",
    "style:font-weight": "bold",
    "style:font-family": "Arial, sans-serif",
  },
  general: {
    "x": 9,
    "y": 3,
    "basex": 9,
    "basey": 3,
    "fill": "black",
    "fill-opacity": 1,
    "style:font-size": "12px",
    "style:font-weight": "bold",
    "style:font-family": "Arial, sans-serif",
  },
  choice_in: {
    "x": 9,
    "y": 3,
    "basex": 9,
    "basey": 3,
    "fill": "black",
    "fill-opacity": 1,
    "style:font-size": "12px",
    "style:font-weight": "bold",
    "style:font-family": "Arial, sans-serif",
  },
  choice_out: {
    "x": 9,
    "y": 3,
    "basex": 9,
    "basey": 3,
    "fill": "black",
    "fill-opacity": 1,
    "style:font-size": "12px",
    "style:font-weight": "bold",
    "style:font-family": "Arial, sans-serif",
  },
  held_in: {
    "x": 9,
    "y": 3,
    "basex": 9,
    "basey": 3,
    "fill": "black",
    "fill-opacity": 1,
    "style:font-size": "12px",
    "style:font-weight": "bold",
    "style:font-family": "Arial, sans-serif",
  },
  held_out: {
    "x": 9,
    "y": 3,
    "basex": 9,
    "basey": 3,
    "fill": "black",
    "fill-opacity": 1,
    "style:font-size": "12px",
    "style:font-weight": "bold",
    "style:font-family": "Arial, sans-serif",
  },
  pool: {
    "x": 9,
    "y": 3,
    "basex": 9,
    "basey": 3,
    "fill": "black",
    "fill-opacity": 1,
    "style:font-size": "12px",
    "style:font-weight": "bold",
    "style:font-family": "Arial, sans-serif",
  }
};

/**
 * Applies a style preset to a node with a given ID.
 * @param {string|number} nodeId
 * @param {string} styleCode
 */
export function applyNodeStyle(nodeId, styleCode, nodeScale = 100) {
  const stylePreset = NODE_STYLES[styleCode];
  if (!stylePreset) {
    console.warn(`No style preset found for code "${styleCode}". Skipping...`);
    return;
  }

  const circleSelection = d3.selectAll(".node")
    .filter(d => d.id === nodeId)
    .select("circle");

  // Apply all preset styles
  Object.entries(stylePreset).forEach(([attrName, attrValue]) => {
    circleSelection.attr(attrName, attrValue);
  });

  // Correctly retrieve `baser` from each node's data and apply scaling
  circleSelection.attr("r", function(d) {
    const baseR = d.baser || 5; // Default to 10 if baser is undefined
    return Math.round(baseR * nodeScale / 100);
  });
}

export function applyGlobalLinkScale(linkScaleApplied) {
  d3.selectAll(".node")
    .select("circle")
    .attr("r", function(d) {
      const baseR = d.baser || 10; // Default to 10 if baser is undefined
      return Math.round(baseR * linkScaleApplied / 100);
    });
}

export function applyGlobalFontScale(fontScaleApplied) {
  d3.selectAll(".node")
    .select("circle")
    .attr("r", function(d) {
      const baseR = d.baser || 10; // Default to 10 if baser is undefined
      return Math.round(baseR * fontScaleApplied / 100);
    });
}

export function applyGlobalTextGap(fontScaleApplied) {
  d3.selectAll(".node")
    .select("circle")
    .attr("r", function(d) {
      const baseR = d.baser || 10; // Default to 10 if baser is undefined
      return Math.round(baseR * fontScaleApplied / 100);
    });
}

export function applyGlobalNodeScale(nodeScaleApplied) {
  d3.selectAll(".node")
    .select("circle")
    .attr("r", function(d) {
      const baseR = d.baser || 10; // Default to 10 if baser is undefined
      return Math.round(baseR * nodeScaleApplied / 100);
    });
}

/**
 * Applies a style preset to a link (by datum).
 * @param {Object} focusLinkData
 * @param {string} styleCode
 */
export function applyLinkStyle(focusLinkData, styleCode) {
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

export function applyNodeTextStyle(nodeId, styleCode) {
  const stylePreset = TEXT_STYLES[styleCode];
  if (!stylePreset) {
    console.warn(`No style preset found for code "${styleCode}". Skipping...`);
    return;
  }

  const nodeSelection = d3.selectAll(".node").filter(d => d.id === nodeId);
  let textSelection = nodeSelection.select("text");

  if (textSelection.empty()) {
    // If text doesn't exist, create it
    textSelection = nodeSelection.append("text")
      .attr("x", 9) // Default positioning
      .attr("y", 3)
      .text(d => `${d.name} ${d.visitCount}`);
  }

  // Apply the provided style
  Object.entries(stylePreset).forEach(([key, value]) => {
    if (key.startsWith("style:")) {
      textSelection.style(key.replace("style:", ""), value);
    } else {
      textSelection.attr(key, value);
    }
  });
}