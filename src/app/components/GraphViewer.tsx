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
  showNodeTooltips?: boolean;
  onNodeClick?: (id: string) => void;
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
function extractGraphElements(data: any): { nodes: any[]; edges: any[] } {
  let nodes: any[] = [];
  let edges: any[] = [];
  const nodeMap: { [key: string]: any } = {};
  const edgeMap: { [key: string]: any } = {};

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

  nodes = Object.values(nodeMap) as any[];
  edges = Object.values(edgeMap) as any[];
  return { nodes, edges };
}

const getElementsFromData = (data: any): any[] => {
  const result = extractGraphElements(data);
  const nodes: any[] = result.nodes;
  const edges: any[] = result.edges;
  const nodeIds = new Set(nodes.map((item: any) => String(item.id)));
  const nodeElements: any[] = nodes.map((item: any) => {
    const label = item.label || '';
    const id = item.id !== undefined ? String(item.id) : '';
    const nodeData: any = {
      label,
      color: getColorForLabel(label),
      ...Object.fromEntries(
        Object.entries(item.properties as any || {}).map(([k, v]: [string, any]) => [k, v?.[0]?.value ?? ''])
      ),
      rawProperties: item.properties // Attach the full properties object
    };
    return {
      data: {
        id,
        ...nodeData
      }
    };
  });
  const edgeElements: any[] = edges.map((item: any) => {
    let source = item.outV !== undefined ? item.outV : item.source;
    let target = item.inV !== undefined ? item.inV : item.target;
    if (typeof source === 'object' && source && source.id) source = source.id;
    if (typeof target === 'object' && target && target.id) target = target.id;
    return {
      data: {
        id: String(item.id),
        source: String(source),
        target: String(target),
        label: item.label,
        ...Object.fromEntries(
          Object.entries(item.properties as any || {}).map(([k, v]: [string, any]) => [k, v?.[0]?.value ?? ''])
        )
      }
    };
  }).filter(edge => nodeIds.has(edge.data.source) && nodeIds.has(edge.data.target));
  return [...nodeElements, ...edgeElements];
};

const GraphViewer: React.FC<GraphViewerProps> = ({ data, loading, error, setSelectedNodeData, showNodeTooltips = true, onNodeClick }) => {
  const elements = useMemo(() => {
    if (!data) return [];
    const result = getElementsFromData(data);
    // Filter out any elements with missing id, source, or target
    return Array.isArray(result)
      ? result.filter(el => el && el.data && el.data.id && (el.data.source === undefined || el.data.source) && (el.data.target === undefined || el.data.target))
      : [];
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
  // CHECKPOINT: useEffect dependency array order and size fixed for React compliance
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
      cy.elements().removeClass('selected');
      ele.addClass('selected');
      setSelectedElement({ id: ele.id(), group: ele.isNode() ? 'nodes' : 'edges' });
      if (ele.isNode() && onNodeClick) {
        onNodeClick(ele.data().id);
      } else if (setSelectedNodeData) {
        setSelectedNodeData(ele.data());
      }
    };
    cy.on('mouseover', 'node', handleMouseOver);
    cy.on('mouseout', 'node', handleMouseOut);
    cy.on('tap', 'node,edge', handleClick);
    return () => {
      cy.off('mouseover', 'node', handleMouseOver);
      cy.off('mouseout', 'node', handleMouseOut);
      cy.off('tap', 'node,edge', handleClick);
    };
  }, [cyRef.current, setSelectedNodeData, onNodeClick]); // Always 3 dependencies, same order

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

  // Detect dark mode from document body attribute (set by main app)
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  React.useEffect(() => {
    setIsDarkMode(document.body.getAttribute('data-theme') === 'dark');
    const observer = new MutationObserver(() => {
      setIsDarkMode(document.body.getAttribute('data-theme') === 'dark');
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);

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
          style={{ width: '100%', height: '100%', background: isDarkMode ? '#181a20' : '#fafbfc' }}
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
                'font-weight': 700,
                'width': 22,
                'height': 22,
                'shape': 'ellipse',
                'color': '#fff',
                'text-outline-width': 0,
                'text-background-color': '#e74c3c',
                'text-background-opacity': 1,
                'text-background-shape': 'roundrectangle',
                'text-background-padding': 2,
                'transition-property': 'width, height, box-shadow, border-color, opacity',
                'transition-duration': '0.3s',
                'text-margin-y': 0,
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
                'border-color': '#43a047',
                'border-width': 3,
                'z-index': 20,
                'shadow-blur': 64,
                'shadow-color': '#43a047',
                'shadow-opacity': 1,
                'shadow-offset-x': 0,
                'shadow-offset-y': 0,
              },
            },
            // Edge: clean, thin, light, image-inspired, with fade-in, smaller font
            {
              selector: 'edge',
              style: {
                width: 0.5,
                'line-color': isDarkMode ? '#dedede' : '#43a047',
                'target-arrow-color': isDarkMode ? '#dedede' : '#43a047',
                'target-arrow-shape': 'triangle',
                'target-arrow-fill': 'filled',
                'arrow-scale': 0.3,
                'curve-style': 'bezier',
                label: 'data(label)',
                'font-size': isDarkMode ? 4 : 4,
                'font-family': 'system-ui, sans-serif',
                'font-weight': isDarkMode ? 400 : 600,
                'color': isDarkMode ? '#fff' : '#222',
                'text-background-opacity': isDarkMode ? 0 : 0.7,
                'text-background-color': isDarkMode ? undefined : '#fff',
                'text-background-padding': isDarkMode ? 0 : 2,
                'text-rotation': 'autorotate',
                'text-margin-y': isDarkMode ? -4 : -6,
                'letter-spacing': 0.2,
                'text-shadow': isDarkMode ? '0 1px 2px #888' : '0 1px 2px #fff',
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
                width: 0.7,
                'opacity': 1,
                'z-index': 10,
                'cursor': 'pointer',
                'line-color': isDarkMode ? '#dedede' : '#1976d2',
                'target-arrow-color': isDarkMode ? '#dedede' : '#1976d2',
                'arrow-scale': 0.3,
                'target-arrow-fill': 'filled',
              },
            },
            // Edge: selected effect - purple color
            {
              selector: 'edge.selected',
              style: {
                'line-color': '#43a047',
                'target-arrow-color': '#43a047',
                'width': 2,
                'arrow-scale': 0.5,
                'target-arrow-fill': 'filled',
                'z-index': 20,
              },
            },
          ]}
        />
        {/* Tooltip for hovered node */}
        {showNodeTooltips && hoveredNode && hoveredPosition && (
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
            <Box style={{ fontFamily: 'monospace', fontSize: 12 }}>
              <div><b>label:</b> {hoveredNode.label ?? ''}</div>
              {hoveredNode.name && (
                <div><b>name:</b> {hoveredNode.name}</div>
              )}
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default GraphViewer; 