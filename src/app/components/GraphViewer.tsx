import React, { useMemo, useRef, useEffect, useState } from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import { CircularProgress, Alert, Box, Button, Stack, IconButton, Tooltip } from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';

interface GraphViewerProps {
  data: any;
  loading?: boolean;
  error?: string | null;
  setSelectedNodeData?: (data: any) => void;
}

const labelColorPalette: string[] = [
  '#1976d2', // blue
  '#43a047', // green
  '#fbc02d', // yellow
  '#e64a19', // orange
  '#8e24aa', // purple
  '#00838f', // teal
  '#c62828', // red
  '#6d4c41', // brown
  '#3949ab', // indigo
  '#00acc1', // cyan
];

function getColorForLabel(label: string) {
  if (!label) return labelColorPalette[0];
  let hash = 0;
  for (let i = 0; i < label.length; i++) {
    hash = label.charCodeAt(i) + ((hash << 5) - hash);
  }
  return labelColorPalette[Math.abs(hash) % labelColorPalette.length];
}

const isEdge = (item: any) =>
  (item.source !== undefined && item.target !== undefined) ||
  (item.outV !== undefined && item.inV !== undefined);

const isNode = (item: any) =>
  item.id !== undefined && item.label !== undefined && !isEdge(item);

// Extract nodes and edges from various Gremlin result shapes
function extractGraphElements(data: any) {
  let nodes: any[] = [];
  let edges: any[] = [];
  const nodeMap: Record<string, any> = {};
  const edgeMap: Record<string, any> = {};

  // Helper to add node if not already present
  function addNode(node: any) {
    if (!node || !node.id) return;
    const id = String(node.id);
    if (!nodeMap[id]) {
      nodeMap[id] = node;
    }
  }
  // Helper to add edge if not already present
  function addEdge(edge: any) {
    if (!edge || !edge.id) return;
    const id = String(edge.id);
    if (!edgeMap[id]) {
      edgeMap[id] = edge;
    }
  }

  // Normalize data
  if (data && Array.isArray(data._items)) {
    data = data._items;
  }

  if (data && data.nodes && Array.isArray(data.nodes) && data.edges && Array.isArray(data.edges)) {
    data.nodes.forEach(addNode);
    data.edges.forEach(addEdge);
  } else if (Array.isArray(data)) {
    data.forEach(item => {
      if (isNode(item)) {
        addNode(item);
      } else if (isEdge(item)) {
        addEdge(item);
        // If edge contains outVLabel/inVLabel or outV/inV as objects, add those as nodes
        if (item.outV && typeof item.outV === 'object') addNode(item.outV);
        if (item.inV && typeof item.inV === 'object') addNode(item.inV);
        // Some Gremlin results have outV/inV as id, but may also have outVLabel/inVLabel
        if (item.outVLabel && item.outV) {
          addNode({ id: item.outV, label: item.outVLabel });
        }
        if (item.inVLabel && item.inV) {
          addNode({ id: item.inV, label: item.inVLabel });
        }
      } else if (item.type === 'vertex' || item.type === 'edge') {
        // TinkerPop style
        if (item.type === 'vertex') addNode(item);
        if (item.type === 'edge') addEdge(item);
      } else if (item.objects && Array.isArray(item.objects)) {
        // Path or subgraph result
        item.objects.forEach((o: any) => {
          if (isNode(o)) addNode(o);
          if (isEdge(o)) addEdge(o);
        });
      }
    });
  }

  nodes = Object.values(nodeMap);
  edges = Object.values(edgeMap);
  return { nodes, edges };
}

const getElementsFromData = (data: any): any[] => {
  const { nodes, edges } = extractGraphElements(data);
  const nodeElements: any[] = nodes.map((item: any) => {
    const label = item.label || '';
    const id = item.id !== undefined ? String(item.id) : '';
    // Only include id for Cytoscape's internal use, not for display or other data
    const nodeData: any = {
      label,
      color: getColorForLabel(label),
      ...Object.fromEntries(
        Object.entries(item.properties || {}).map(([k, v]) => [k, v?.[0]?.value ?? ''])
      )
    };
    return {
      data: {
        id, // Cytoscape requires an id field
        ...nodeData
      }
    };
  });
  const edgeElements: any[] = edges.map((item: any) => {
    // Gremlin edges may use outV/inV (id or object) or source/target
    let source = item.outV !== undefined ? item.outV : item.source;
    let target = item.inV !== undefined ? item.inV : item.target;
    // If outV/inV are objects, use their id
    if (typeof source === 'object' && source && source.id) source = source.id;
    if (typeof target === 'object' && target && target.id) target = target.id;
    return {
      data: {
        id: String(item.id),
        source: String(source),
        target: String(target),
        label: item.label,
        ...Object.fromEntries(
          Object.entries(item.properties || {}).map(([k, v]) => [k, v?.[0]?.value ?? ''])
        )
      }
    };
  });
  return [...nodeElements, ...edgeElements];
};

const GraphViewer: React.FC<GraphViewerProps> = ({ data, loading, error, setSelectedNodeData }) => {
  const elements = useMemo(() => {
    if (!data) return [];
    const result = getElementsFromData(data);
    return Array.isArray(result) ? result : [];
  }, [data]);
  const cyRef = useRef<any>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [hoveredPosition, setHoveredPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedElement, setSelectedElement] = useState<{ id: string; group: 'nodes' | 'edges' } | null>(null);

  // Auto-fit/center the graph on load or data change
  useEffect(() => {
    if (cyRef.current && elements.length > 0) {
      setTimeout(() => {
        try {
          cyRef.current.fit(undefined, 40);
        } catch {}
      }, 100);
    }
  }, [elements]);

  // Add Cytoscape event listeners for hover and click
  useEffect(() => {
    if (!cyRef.current) return;
    const cy = cyRef.current;
    const handleMouseOver = (evt: any) => {
      const node = evt.target;
      // Exclude id from tooltip
      const { id, ...rest } = node.data();
      setHoveredNode(rest);
      setHoveredPosition({ x: evt.renderedPosition.x, y: evt.renderedPosition.y });
    };
    const handleMouseOut = () => {
      setHoveredNode(null);
      setHoveredPosition(null);
    };
    const handleClick = (evt: any) => {
      const ele = evt.target;
      // Remove 'selected' class from all nodes and edges
      cy.elements().removeClass('selected');
      // Add 'selected' class to the clicked element
      ele.addClass('selected');
      // Track selected element
      setSelectedElement({ id: ele.id(), group: ele.isNode() ? 'nodes' : 'edges' });
      if (setSelectedNodeData) setSelectedNodeData(ele.data());
    };
    cy.on('mouseover', 'node', handleMouseOver);
    cy.on('mouseout', 'node', handleMouseOut);
    cy.on('tap', 'node,edge', handleClick);
    return () => {
      cy.off('mouseover', 'node', handleMouseOver);
      cy.off('mouseout', 'node', handleMouseOut);
      cy.off('tap', 'node,edge', handleClick);
    };
  }, [cyRef.current, setSelectedNodeData]);

  const handleResetView = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 40);
    }
  };

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom({ level: cyRef.current.zoom() * 1.2, renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 } });
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom({ level: cyRef.current.zoom() * 0.8, renderedPosition: { x: cyRef.current.width() / 2, y: cyRef.current.height() / 2 } });
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight={300}><CircularProgress /></Box>;
  }
  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }
  if (!elements.length) {
    return <Alert severity="info">No graph data to display.</Alert>;
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Stack direction="row" spacing={1} alignItems="center" mb={1}>
        <Button variant="outlined" size="small" onClick={handleResetView}>
          Reset View
        </Button>
        <Tooltip title="Zoom In">
          <IconButton size="small" onClick={handleZoomIn}><ZoomInIcon /></IconButton>
        </Tooltip>
        <Tooltip title="Zoom Out">
          <IconButton size="small" onClick={handleZoomOut}><ZoomOutIcon /></IconButton>
        </Tooltip>
      </Stack>
      <Box sx={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <CytoscapeComponent
          cy={(cy: any) => { cyRef.current = cy; }}
          elements={elements}
          style={{ width: '100%', height: '100%', background: '#000000' }}
          layout={{ name: 'cose', padding: 60 }}
          stylesheet={[
            // Node: only show label (no id)
            {
              selector: 'node',
              style: {
                label: 'data(label)',
                'background-color': '#e74c3c',
                'border-width': 0,
                'box-shadow': '0 2px 8px 0 rgba(0,0,0,0.10)',
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': 3,
                'font-family': 'system-ui, sans-serif',
                'width': 22,
                'height': 22,
                'shape': 'ellipse',
                'color': '#fff',
                'text-outline-width': 0,
                'transition-property': 'width, height, box-shadow, border-color, opacity',
                'transition-duration': '0.3s',
                'text-margin-y': 3,
                'opacity': 0,
                'transition-timing-function': 'ease',
                'text-wrap': 'none',
                'text-max-width': 20,
                'text-overflow-wrap': 'ellipsis',
              },
            },
            // Node: fade-in animation
            {
              selector: 'node',
              style: {
                'opacity': 1,
                'transition-property': 'opacity',
                'transition-duration': '0.7s',
                'transition-timing-function': 'ease',
              },
            },
            // Node: hover effect - colored border, no background change
            {
              selector: 'node:hover',
              style: {
                'border-color': '#e74c3c',
                'border-width': 2,
                'z-index': 10,
                'cursor': 'pointer',
              },
            },
            // Node: selected effect - purple border and outside glow
            {
              selector: 'node.selected',
              style: {
                'border-color': '#8e24aa',
                'border-width': 2,
                'z-index': 20,
                'shadow-blur': 8,
                'shadow-color': '#8e24aa',
                'shadow-opacity': 1,
                'shadow-offset-x': 0,
                'shadow-offset-y': 0,
              },
            },
            // Edge: clean, thin, light, image-inspired, with fade-in, smaller font
            {
              selector: 'edge',
              style: {
                width: 1,
                'line-color': '#e0e0e0',
                'target-arrow-color': '#e0e0e0',
                'target-arrow-shape': 'triangle',
                'target-arrow-fill': 'hollow',
                'arrow-scale': 0.5,
                'curve-style': 'bezier',
                label: 'data(label)',
                'font-size': 4,
                'font-family': 'system-ui, sans-serif',
                'font-weight': 400,
                'color': '#fff',
                'text-background-opacity': 0,
                'text-background-padding': 0,
                'text-rotation': 'autorotate',
                'text-margin-y': -4,
                'letter-spacing': 0.2,
                'text-shadow': '0 1px 2px #888',
                'opacity': 0,
                'transition-property': 'line-color, width, opacity',
                'transition-duration': '0.7s',
                'transition-timing-function': 'ease',
              },
            },
            // Edge: fade-in animation
            {
              selector: 'edge',
              style: {
                'opacity': 1,
                'transition-property': 'opacity',
                'transition-duration': '0.7s',
                'transition-timing-function': 'ease',
              },
            },
            // Edge: hover effect - increase opacity and thickness
            {
              selector: 'edge:hover',
              style: {
                width: 2.2,
                'opacity': 1,
                'z-index': 10,
                'cursor': 'pointer',
              },
            },
            // Edge: selected effect - purple color
            {
              selector: 'edge.selected',
              style: {
                'line-color': '#8e24aa',
                'target-arrow-color': '#8e24aa',
                'width': 2.2,
                'z-index': 20,
              },
            },
          ]}
        />
        {/* Tooltip for hovered node */}
        {hoveredNode && hoveredPosition && (
          <Box
            sx={{
              position: 'absolute',
              left: hoveredPosition.x + 12,
              top: hoveredPosition.y - 12,
              background: 'rgba(30,30,30,0.97)',
              color: '#fff',
              px: 2,
              py: 1,
              borderRadius: 1,
              fontSize: 12,
              zIndex: 1000,
              pointerEvents: 'none',
              maxWidth: 260,
              boxShadow: 3,
              whiteSpace: 'pre-wrap',
            }}
          >
            <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12 }}>
              {JSON.stringify(hoveredNode, null, 2)}
            </pre>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default GraphViewer; 