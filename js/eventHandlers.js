  /***************************************************************
         * 4) EVENT HANDLERS
         ***************************************************************/
        //test
        import appConfig from './config.js';
        import { link, node, links, nodes, simulation, sourceId, targetId } from './main.js';
        import { setNodeXPosition } from './layoutUtils.js';

        /**
         * Mouseover event handler to show tooltips.
         */
        export function handleMouseOver(event, d) {
            if (d.spineheld === 1 || d.choice == 1) {
                d3.select(".tooltip")
                    .style("visibility", "visible")
                    .style("top", `${event.pageY + 10}px`)
                    .style("left", `${event.pageX + 10}px`)
                    .html(`<strong>${d.name}</strong><br>${d.tooltip}`);
            }
        }

        /**
         * Mousemove event handler to move tooltips.
         */
        export function handleMouseMove(event) {
            d3.select(".tooltip")
                .style("top", `${event.pageY + 10}px`)
                .style("left", `${event.pageX + 10}px`);
        }

        /**
         * Mouseout event handler to hide tooltips.
         */
        export function handleMouseOut() {
            d3.select(".tooltip").style("visibility", "hidden");
        }

        /**
         * Click event handler for nodes.
         */
        export function handleNodeClick(event, d) {
            

            if (d.spineheld === 0) {
                // Possibly re-position node if not yet spineheld
                setNodeXPosition(d, nodes, links, 200, 20);
            }

            d.spineheld = 1;
            resetFormatting();
            // Append text to node
            d3.selectAll(".node")
                .filter(n => n.id === d.id)
                .append("text")
                .attr("x", 9)
                .attr("y", 3)
                .text(n => `${n.name} ${n.visitCount}`)
                .attr("fill", "black")
                .attr("fill-opacity", 1)
                .style("font-size", "12px")
                .style("font-weight", "bold");

            // Highlight the clicked node
            d3.selectAll(".node")
                .filter(n => n.id === d.id)
                .select("circle")
                .attr("r", 7)
                .attr("fill-opacity", 0.898)
                .attr("stroke-opacity", 1);

            applyNodeStyle(d.id, "selected");

            // Incoming/outgoing highlighting
            const visitedIncoming = new Set();
            highlightIncoming(d.id, visitedIncoming);

            const visitedOutgoing = new Set();
            highlightOutgoing(d.id, visitedOutgoing);

            // Update text box
            const incomingLinks = links
                .filter(link => link.target.id === d.id)
                .map(link => `${link.source.id} (${Math.round(link.source.y)}) (A)`);

            const outgoingLinks = links
                .filter(link => link.source.id === d.id)
                .map(link => `${link.target.id} (${Math.round(link.target.y)}) (S)`);

            const textBoxContent = `
            <strong>Name:</strong> ${d.name}<br>
            <strong>Year:</strong> ${Math.round(d.year)}<br>
            <strong>Connected Nodes:</strong> ${[...incomingLinks, ...outgoingLinks].join(' ') || 'None'}<br>
            <strong>Summary:</strong> ${d.tooltip}
          `;
            d3.select("#textBox").html(textBoxContent);
        }

        /**
         * Double-click event handler for nodes.
         */
        export function handleNodeDblClick(event, d) {
            resetFormatting();

            d.fx = null;
            d.spineheld = 1;

            d3.selectAll(".node")
                .filter(n => n.id === d.id)
                .select("circle")
                .attr("r", 7)
                .attr("fill-opacity", 0.2)
                .attr("stroke-opacity", 0.2);

            d3.selectAll(".node")
                .filter(n => n.id === d.id)
                .selectAll("text")
                .remove();

            const visitedIncoming = new Set();
            highlightIncomingDbl(d.id, visitedIncoming);

            const visitedOutgoing = new Set();
            highlightOutgoingDbl(d.id, visitedOutgoing);

            const incomingLinks = links
                .filter(link => link.target.id === d.id)
                .map(link => `${link.source.id} (${Math.round(link.source.y)}) (A)`);

            const outgoingLinks = links
                .filter(link => link.source.id === d.id)
                .map(link => `${link.target.id} (${Math.round(link.target.y)}) (S)`);

            const textBoxContent = `
            <strong>Name:</strong> ${d.name}<br>
            <strong>Year:</strong> ${Math.round(d.year)}<br>
            <strong>Connected Nodes:</strong> ${[...incomingLinks, ...outgoingLinks].join(' ') || 'None'}<br>
            <strong>Summary:</strong> ${d.tooltip}
          `;
            d3.select("#textBox").html(textBoxContent);
        }

        /**
         * Highlights incoming links/nodes on click.
         */
        function highlightIncoming(nodeId, visitedIncoming) {
            if (visitedIncoming.has(nodeId)) return;
            visitedIncoming.add(nodeId);

            links.forEach(link => {
                if (link.target.id === nodeId) {
                    link.highlighted = true;
                    link.highlightColor = "red";
                    applyLinkStyle(link, "choice_in");

                    link.source.choice = 1;

                    d3.selectAll(".node")
                        .filter(n => n.id === link.source.id && link.source.spineheld === 0)
                        .select("circle")
                        .attr("r", 10)

                    applyNodeStyle(link.source.id, "choice_in");
                }
            });
        }

        /**
         * Highlights outgoing links/nodes on click.
         */
        function highlightOutgoing(nodeId, visitedOutgoing) {
            if (visitedOutgoing.has(nodeId)) return;
            visitedOutgoing.add(nodeId);

            links.forEach(link => {
                if (link.source.id === nodeId) {
                    link.highlighted = true;
                    link.highlightColor = "blue";
                    if (link.target.spineheld === 0) {
                        applyLinkStyle(link, "choice_out");
                    }
                    link.target.choice = 1;


                    d3.selectAll(".node")
                        .filter(n => n.id === link.target.id && link.target.spineheld === 0)

                    applyNodeStyle(link.target.id, "choice_out");
                }
            });
        }

        /**
         * Highlights incoming links/nodes on double-click.
         */
        function highlightIncomingDbl(nodeId, visitedIncoming) {
            if (visitedIncoming.has(nodeId)) return;
            visitedIncoming.add(nodeId);

            links.forEach(link => {
                if (link.target.id === nodeId) {
                    link.highlighted = false;
                    link.highlightColor = "red";

                    d3.selectAll(".node")
                        .filter(n => n.id === link.source.id)
                        .select("circle")
                        .attr("r", 10);
                }
            });
        }

        /**
         * Highlights outgoing links/nodes on double-click.
         */
        function highlightOutgoingDbl(nodeId, visitedOutgoing) {
            if (visitedOutgoing.has(nodeId)) return;
            visitedOutgoing.add(nodeId);

            links.forEach(link => {
                if (link.source.id === nodeId) {
                    link.highlighted = false;
                    link.highlightColor = "blue";

                    d3.selectAll(".node")
                        .filter(n => n.id === link.target.id)
                        .select("circle")
                        .attr("r", 10);

                    d3.selectAll(".node")
                        .filter(n => n.id === link.target.id)
                        .select("text");
                }
            });
        }

        /**
         * Reset all formatting, skipping links with both ends spineheld=1.
         */
        function resetFormatting() {
            links.forEach(l => {
                if (l.source.spineheld === 1 && l.target.spineheld === 1) {
                    applyLinkStyle(l, "spine");

                }
                if (l.source.spineheld === 0 || l.target.spineheld === 0){
                    applyLinkStyle(l, "pool");
                    //l.highlighted = false;
                    //l.highlightColor = null;

                }
            });

            d3.selectAll(".link")
                .filter(l => ((l.source.spineheld === 0 || l.target.spineheld === 0)))
                .attr("stroke", "green");


            nodes.forEach(resetnode => {
                if (resetnode.id === sourceId) {
                    applyNodeStyle(resetnode.id, "source");
                }
                else if (resetnode.id === targetId) {
                    applyNodeStyle(resetnode.id, "target");
                }
                else if (resetnode.spineheld === 0) {
                    applyNodeStyle(resetnode.id, "pool");
                }
                else if (resetnode.spineheld === 1) {
                    applyNodeStyle(resetnode.id, "selected");
                }
            });

            // Example of commented-out code left intact:
            // d3.selectAll(".link").attr("stroke-opacity", 0);
            // d3.selectAll(".node circle").attr("stroke", "none");
        }

        /***************************************************************
         * 5) DRAG & TICK HANDLERS
         ***************************************************************/




        export function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; // Fix x for dragging
        }

        export function dragged(event, d) {
            d.fx = Math.max(10, Math.min(appConfig.svgWidth - 10, event.x));
            d.x = d.fx;
        }

        export function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = d.x;
            d.fx = Math.round(d.x / 200) * 200;
        }
