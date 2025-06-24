
import React, { useMemo } from 'react';
import { RouteEvent } from '../../types';

interface RouteTreeViewProps {
  events: RouteEvent[];
}

interface ParentConnection {
  parentId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface TreeNode {
  id: string;
  event: RouteEvent;
  children: TreeNode[];
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  parentConnections: ParentConnection[];
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80; // Increased height for more content
const LEVEL_HEIGHT = 150; // Vertical spacing between levels
const SIBLING_SPACING = 50; // Horizontal spacing between siblings
const PADDING = 20;

export const RouteTreeView: React.FC<RouteTreeViewProps> = ({ events }) => {
  const { treeNodes, svgWidth, svgHeight } = useMemo(() => {
    if (!events || events.length === 0) {
      return { treeNodes: [], svgWidth: PADDING * 2, svgHeight: PADDING * 2 };
    }

    const nodesMap = new Map<string, TreeNode>();
    const rootNodes: TreeNode[] = [];

    // Initialize nodes
    events.forEach(event => {
      nodesMap.set(event.id, {
        id: event.id,
        event,
        children: [],
        x: 0,
        y: 0,
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        level: -1, // Initialize level to -1 to indicate it hasn't been set
        parentConnections: [],
      });
    });

    // Build tree structure (populate children arrays)
    events.forEach(event => {
      const node = nodesMap.get(event.id);
      if (node) {
        if (event.parentEventIds && event.parentEventIds.length > 0) {
          event.parentEventIds.forEach(parentId => {
            const parentNode = nodesMap.get(parentId);
            if (parentNode) {
              // Ensure child is not already added (can happen in complex graphs if not careful)
              if (!parentNode.children.find(child => child.id === node.id)) {
                 parentNode.children.push(node);
              }
            }
          });
        }
      }
    });
    
    // Identify initial root nodes (those with no parents in the provided events list)
    events.forEach(event => {
        const node = nodesMap.get(event.id);
        if (node && (!event.parentEventIds || event.parentEventIds.length === 0)) {
            if (!rootNodes.find(rn => rn.id === node.id)) {
                rootNodes.push(node);
            }
        }
    });


    // Fallback: if no explicit root nodes found (e.g. due to cycles or all nodes having parents)
    if (rootNodes.length === 0 && events.length > 0) {
        // Attempt to find nodes that are not children of any other node within the processed structure
        // This is a simple heuristic and might not be perfect for all complex cyclic graphs.
        const allChildIds = new Set<string>();
        nodesMap.forEach(node => {
            node.children.forEach(child => allChildIds.add(child.id));
        });

        nodesMap.forEach(node => {
            if (!allChildIds.has(node.id)) {
                 if (!rootNodes.find(rn => rn.id === node.id)) {
                    rootNodes.push(node);
                 }
            }
        });
        
        // If still no roots (e.g., a perfect cycle involving all nodes), pick the first event as a fallback.
        if (rootNodes.length === 0 && events.length > 0) {
            const firstNode = nodesMap.get(events[0].id);
            if (firstNode && !rootNodes.find(rn => rn.id === firstNode.id)) {
                 rootNodes.push(firstNode);
            }
        }
    }


    const levelMap = new Map<number, TreeNode[]>();
    let maxLevel = 0;

    function assignLevels(node: TreeNode, currentLevel: number, pathVisited: Set<string>) {
      if (pathVisited.has(node.id)) {
        // console.warn(`Cycle detected for node ${node.id} during level assignment. Path: ${Array.from(pathVisited).join(" -> ")} -> ${node.id}`);
        return; // Already visited in this current traversal path, cycle detected
      }
      pathVisited.add(node.id);

      // If node.level is already set, take the minimum (for DAGs where a node can be reached via paths of different lengths)
      // Or if it's the first time, set it.
      if (node.level === -1 || currentLevel < node.level) {
        node.level = currentLevel;
      }
      // If currentLevel is greater, we don't update, assuming we want the "highest" position (min level number)

      if (!levelMap.has(node.level)) {
        levelMap.set(node.level, []);
      }
      if (!levelMap.get(node.level)!.find(n => n.id === node.id)) {
        levelMap.get(node.level)!.push(node);
      }
      
      maxLevel = Math.max(maxLevel, node.level);

      node.children.forEach(child => {
        assignLevels(child, node.level + 1, pathVisited);
      });

      pathVisited.delete(node.id); // Backtrack: remove from path visited set
    }

    // Before assigning levels, ensure all node levels are reset if multiple passes or complex logic.
    // Here, nodesMap initializes level to -1.
    rootNodes.forEach(root => assignLevels(root, 0, new Set<string>()));
    
    // For nodes potentially not reached from roots (e.g. orphan cycles), assign a default level if still -1
    nodesMap.forEach(node => {
        if (node.level === -1) {
            // console.warn(`Node ${node.id} was not reached by assignLevels, placing at default level 0.`);
            node.level = 0; // Default level for unreached nodes
            if (!levelMap.has(node.level)) levelMap.set(node.level, []);
            if (!levelMap.get(node.level)!.find(n => n.id === node.id)) {
                 levelMap.get(node.level)!.push(node);
            }
            maxLevel = Math.max(maxLevel, node.level);
        }
    });


    // Assign Y positions
    nodesMap.forEach(node => {
      node.y = PADDING + node.level * LEVEL_HEIGHT;
    });

    // Assign X positions
    let overallMaxWidth = 0;
    for (let level = 0; level <= maxLevel; level++) {
      const nodesOnLevel = levelMap.get(level) || [];
      const levelWidth = nodesOnLevel.length * (NODE_WIDTH + SIBLING_SPACING) - (nodesOnLevel.length > 0 ? SIBLING_SPACING : 0) ;
      overallMaxWidth = Math.max(overallMaxWidth, levelWidth);
      
      const startX = PADDING + (overallMaxWidth - levelWidth) / 2; // Center nodes on the level based on overallMaxWidth

      nodesOnLevel.forEach((node, index) => {
        // Ensure nodes are sorted perhaps by original order or title to make X consistent if order matters
        node.x = startX + index * (NODE_WIDTH + SIBLING_SPACING);
      });
    }
    
    // Adjust overallMaxWidth if PADDING makes it larger
    overallMaxWidth = Math.max(overallMaxWidth, PADDING * 2);
    if (nodesMap.size > 0) overallMaxWidth += PADDING*2;


    // Create parent connections (lines)
     nodesMap.forEach(node => { // Iterate through all nodes to draw lines to their children
        node.children.forEach(childNode => { // childNode is a TreeNode from the children array
            // Ensure the childNode is also in nodesMap (it should be)
            const actualChild = nodesMap.get(childNode.id);
            if (actualChild) {
                 // Add to actualChild's parentConnections for drawing
                if (!actualChild.parentConnections.some(pc => pc.parentId === node.id)) { // Avoid duplicate connections if logic allows
                     actualChild.parentConnections.push({
                        parentId: node.id, 
                        x1: node.x + node.width / 2,
                        y1: node.y + node.height,
                        x2: actualChild.x + actualChild.width / 2,
                        y2: actualChild.y,
                    });
                }
            }
        });
    });


    const finalNodes = Array.from(nodesMap.values());
    const finalSvgHeight = PADDING + (maxLevel + 1) * LEVEL_HEIGHT + NODE_HEIGHT + PADDING; // Add PADDING at bottom

    return { treeNodes: finalNodes, svgWidth: overallMaxWidth, svgHeight: finalSvgHeight };

  }, [events]);

  if (!events || events.length === 0) {
    return <p className="text-slate-400 text-center py-8">表示するイベントがありません。</p>;
  }

  return (
    <div className="w-full overflow-auto bg-slate-800 p-4 rounded-lg border border-slate-700" style={{maxHeight: '70vh'}}>
      <svg width={svgWidth} height={svgHeight}>
        {/* Lines (Edges) - Draw from each node's parentConnections list */}
        {treeNodes.map(node =>
          node.parentConnections.map((conn, index) => (
            <line
              key={`${node.id}-pconn-${conn.parentId || index}`} 
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              className="stroke-slate-500"
              strokeWidth="2"
            />
          ))
        )}
         {/* Nodes */}
        {treeNodes.map(node => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <rect
              width={node.width}
              height={node.height}
              rx="8" // Rounded corners
              className={`${
                node.event.isBranchPoint ? 'fill-sky-700 stroke-sky-400' : 'fill-slate-700 stroke-slate-500'
              } stroke-2`}
            />
            <text
              x={node.width / 2}
              y={25} // Position for title
              textAnchor="middle"
              className="fill-slate-100 font-semibold text-sm select-none pointer-events-none"
            >
              {node.event.title.length > 20 ? node.event.title.substring(0, 18) + '...' : node.event.title}
            </text>
            {node.event.dateTime && (
                 <text
                    x={node.width / 2}
                    y={45} // Position for dateTime
                    textAnchor="middle"
                    className="fill-slate-400 text-xs select-none pointer-events-none"
                >
                    {node.event.dateTime.length > 25 ? node.event.dateTime.substring(0,22) + '...' : node.event.dateTime}
                </text>
            )}
             {node.event.isBranchPoint && (
                <text
                    x={node.width / 2}
                    y={node.height - 15 }
                    textAnchor="middle"
                    className="fill-sky-300 text-xs font-bold select-none pointer-events-none"
                >
                    分岐点
                </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};
