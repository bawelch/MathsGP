// Select search input and results container
        import { nodes, playState } from './main.js';
import { applyNodeStyle, applyLinkStyle } from "./styleUtils.js"; // Import styling functions
import { handleNodeClick } from "./eventHandlers.js"; // ✅ Import handleNodeClick

// Function to filter nodes based on search query
export function searchNodes(query, searchInput) {
    if (!query) {
        searchResults.innerHTML = "";
        searchResults.style.display = "none";
        return;
    }

    // Filter nodes whose names contain the search text (case-insensitive)
    const matches = nodes.filter(n => n.name.toLowerCase().includes(query.toLowerCase()));

    // Display results
    searchResults.innerHTML = "";
    matches.forEach(node => {
        const resultItem = document.createElement("div");
        resultItem.textContent = node.name;
        resultItem.onclick = () => selectNode(node,searchInput); // Handle selection
        searchResults.appendChild(resultItem);
    });

    searchResults.style.display = matches.length ? "block" : "none";

}

// Function to select and highlight a node
function selectNode(node, searchInput) {
    //searchResults.style.display = "none"; // Hide results
    playState.held_node = node.id;
    //applyNodeStyle(node.id, "target");
    //node.spineheld = 1;
        searchResults.innerHTML = "";
    searchResults.style.display = "none";
        if (searchInput) {
        searchInput.value = ""; 
    }
    handleNodeClick(null, node);
}

