document.addEventListener("DOMContentLoaded", () => {
    const svg = document.getElementById("map-view");

    function createNode(x, y, id, label) {
        let group = document.createElementNS("http://www.w3.org/2000/svg", "g");

        let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", "20");
        circle.setAttribute("fill", "blue");
        circle.setAttribute("stroke", "white");
        circle.setAttribute("stroke-width", "2");

        let text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", x);
        text.setAttribute("y", y + 5);
        text.setAttribute("fill", "white");
        text.setAttribute("font-size", "12px");
        text.setAttribute("text-anchor", "middle");
        text.textContent = label;

        group.appendChild(circle);
        group.appendChild(text);
        svg.appendChild(group);
    }

    createNode(100, 100, 1, "Node 1");
    createNode(200, 200, 2, "Node 2");
});
