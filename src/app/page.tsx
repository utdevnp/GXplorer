"use client";
import React, { useState, useMemo, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  TextField,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  Box,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Collapse,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import CytoscapeComponent from 'react-cytoscapejs';
import Popover from '@mui/material/Popover';
import Drawer from '@mui/material/Drawer';
import DownloadIcon from '@mui/icons-material/Download';
import ImageIcon from '@mui/icons-material/Image';
import SearchIcon from '@mui/icons-material/Search';
import FormatPaintIcon from '@mui/icons-material/FormatPaint';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import StorageIcon from '@mui/icons-material/Storage';
import MonacoEditor from '@monaco-editor/react';
import type { editor as MonacoEditorType, Position as MonacoPosition } from 'monaco-editor';
import QueryBox from './components/QueryBox';
import QueryResult from './components/QueryResult';
import SchemaBox from './components/SchemaBox';
import FetchSchemaBox from './components/FetchSchemaBox';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import GraphViewer from './components/GraphViewer';
import dynamic from 'next/dynamic';
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

const DEFAULT_SERVER_URL = 'ws://localhost:8182/gremlin';

const colorPalette = [
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

// Key for localStorage
const QUERY_HISTORY_KEY = 'gremlin_query_history';

function sanitizeDataObject(data: Record<string, any>) {
  const clean: Record<string, any> = {};
  Object.entries(data).forEach(([k, v]) => {
    if (
      v !== undefined &&
      v !== null &&
      typeof v !== 'function' &&
      !(Array.isArray(v) && v.length === 0) &&
      !(typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0)
    ) {
      clean[k] = v;
    }
  });
  return clean;
}

export default function Home() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [schema, setSchema] = useState<{ vertexLabels: string[]; edgeLabels: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState('');
  const [labelType, setLabelType] = useState<'vertex' | 'edge'>('vertex');
  const [creating, setCreating] = useState(false);
  const [query, setQuery] = useState('g.V().limit(10)');
  const [queryResult, setQueryResult] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [cyRef, setCyRef] = useState<any>(null);
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [tooltipAnchor, setTooltipAnchor] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const [tooltipData, setTooltipData] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [layout, setLayout] = useState('cose');
  const [search, setSearch] = useState('');
  // Query history state
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);
  const [selectedNodeData, setSelectedNodeData] = useState<any>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(QUERY_HISTORY_KEY);
    if (stored) {
      try {
        setQueryHistory(JSON.parse(stored));
      } catch { }
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(QUERY_HISTORY_KEY, JSON.stringify(queryHistory));
  }, [queryHistory]);

  const fetchSchema = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gremlin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setSchema(data.result);
      } else {
        setError(data.error || 'Failed to fetch schema');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel) return;
    setCreating(true);
    setError(null);
    let labelQuery = '';
    if (labelType === 'vertex') {
      labelQuery = `graph.addVertex(label, '${newLabel}')`;
    } else {
      labelQuery = `v1 = graph.addVertex(); v2 = graph.addVertex(); v1.addEdge('${newLabel}', v2)`;
    }
    try {
      const res = await fetch('/api/gremlin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl, query: labelQuery }),
      });
      const data = await res.json();
      if (data.success) {
        setNewLabel('');
        fetchSchema();
      } else {
        setError(data.error || 'Failed to create label');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  const executeQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    setQueryLoading(true);
    setQueryError(null);
    setQueryResult(null);
    // Add to history if not duplicate and not empty
    setQueryHistory(prev => {
      const trimmed = query.trim();
      if (!trimmed) return prev;
      if (prev[0] === trimmed) return prev; // avoid consecutive duplicates
      const next = [trimmed, ...prev.filter(q => q !== trimmed)].slice(0, 20); // max 20
      return next;
    });
    try {
      const res = await fetch('/api/gremlin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverUrl, query }),
      });
      const data = await res.json();
      if (data.success) {
        setQueryResult(data.result);
      } else {
        setQueryError(data.error || 'Query failed');
      }
    } catch (err) {
      setQueryError((err as Error).message);
    } finally {
      setQueryLoading(false);
    }
  };

  // Graph event handlers
  const handleCyInit = (cy: any) => {
    setCyRef(cy);
    cy.on('tap', 'node,edge', (evt: any) => {
      const ele = evt.target;
      setSelectedElement(ele.data());
      setDrawerOpen(true);
    });
    cy.on('mouseover', 'node,edge', (evt: any) => {
      const ele = evt.target;
      const pos = ele.renderedPosition();
      setTooltipData(ele.data());
      setTooltipAnchor({ mouseX: pos.x, mouseY: pos.y });
    });
    cy.on('mouseout', 'node,edge', () => {
      setTooltipAnchor(null);
      setTooltipData(null);
    });
  };

  const handleZoomIn = () => {
    if (cyRef) cyRef.zoom({ level: cyRef.zoom() * 1.2 });
  };
  const handleZoomOut = () => {
    if (cyRef) cyRef.zoom({ level: cyRef.zoom() * 0.8 });
  };
  const handleFit = () => {
    if (cyRef) cyRef.fit();
  };

  // Color mapping by label
  const labelColorMap = useMemo(() => {
    const labels = new Set<string>();
    if (queryResult && Array.isArray(queryResult)) {
      queryResult.forEach((item: any) => {
        if (item.label) labels.add(item.label);
      });
    }
    const arr = Array.from(labels);
    const map: Record<string, string> = {};
    arr.forEach((label, i) => {
      map[label] = colorPalette[i % colorPalette.length];
    });
    return map;
  }, [queryResult]);

  // Export handlers
  const handleExportPNG = () => {
    if (cyRef) {
      const png = cyRef.png({ full: true, scale: 2 });
      const link = document.createElement('a');
      link.href = png;
      link.download = 'graph.png';
      link.click();
    }
  };
  const handleExportJSON = () => {
    if (cyRef) {
      const json = cyRef.json();
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'graph.json';
      link.click();
    }
  };

  return (
    <Box>
      <AppBar position="sticky" elevation={0} sx={{ background: 'rgba(255,255,255,0.97)', boxShadow: 1, borderBottom: '1px solid #e0e0e0', zIndex: 1201 }}>
        <Toolbar sx={{ flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center', minHeight: 88 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 4 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1 }}>
              GXplorer
            </Typography>
          </Box>
          <Paper elevation={1} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, flexWrap: 'wrap', minWidth: 420, boxShadow: 'none' }}>
            {/* Connect to Gremlin Server (inline, compact) */}
            <Box component="form" onSubmit={e => { e.preventDefault(); fetchSchema(); }} sx={{ display: 'flex', alignItems: 'center', gap: 1, background: 'none', boxShadow: 'none', p: 0 }}>
              <TextField
                label="Gremlin Server URL"
                value={serverUrl}
                onChange={e => setServerUrl(e.target.value)}
                size="small"
                sx={{ minWidth: 180, maxWidth: 240 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={fetchSchema}
                disabled={loading}
                sx={{ minWidth: 80, fontWeight: 600, fontSize: 14 }}
              >
                {loading ? <CircularProgress size={16} /> : 'Fetch Schema'}
              </Button>
            </Box>
            {error && (
              <Alert severity="error" sx={{ ml: 1, py: 0.5, px: 1, fontSize: 13, alignItems: 'center', height: 36 }}>{error}</Alert>
            )}
            <Divider orientation="vertical" flexItem sx={{ mx: 2, height: 36, borderColor: '#e0e0e0' }} />
            {/* Create New Label (inline, compact) */}
            <Box component="form" onSubmit={createLabel} sx={{ display: 'flex', alignItems: 'center', gap: 1, background: 'none', boxShadow: 'none', p: 0 }}>
              <FormControl size="small" sx={{ minWidth: 70 }}>
                <InputLabel id="label-type-select">Type</InputLabel>
                <Select
                  labelId="label-type-select"
                  value={labelType}
                  label="Type"
                  onChange={e => setLabelType(e.target.value as 'vertex' | 'edge')}
                >
                  <MenuItem value="vertex">Vertex</MenuItem>
                  <MenuItem value="edge">Edge</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Label name"
                value={newLabel}
                onChange={e => setNewLabel(e.target.value)}
                size="small"
                sx={{ minWidth: 90, maxWidth: 140 }}
              />
              <Button type="submit" variant="contained" color="secondary" disabled={creating || !newLabel} sx={{ minWidth: 64 }}>
                {creating ? <CircularProgress size={14} /> : 'Create'}
              </Button>
            </Box>
          </Paper>
        </Toolbar>
      </AppBar>
      <Box sx={{ p:4, height: 'calc(100vh - 88px)' }}>
        <Grid container spacing={2} sx={{ height: '100%' }}>
          <Grid item xs={6} md={6} sx={{ height: '100%' }}>

            {/* Query Editor below header controls */}
            <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Query Editor
              </Typography>
              {/* Query History */}
              {queryHistory.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                    History
                    {queryHistory.length > 1 && (
                      <IconButton size="small" onClick={() => setHistoryOpen(o => !o)} sx={{ ml: 1 }}>
                        {historyOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    )}
                  </Typography>
                  {/* Latest history always visible */}
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Button
                      key={queryHistory[0] + 'latest'}
                      size="small"
                      variant={queryHistory[0] === query ? 'contained' : 'outlined'}
                      color="secondary"
                      sx={{ fontFamily: 'monospace', textTransform: 'none', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      onClick={() => setQuery(queryHistory[0])}
                    >
                      {queryHistory[0].length > 60 ? queryHistory[0].slice(0, 57) + '...' : queryHistory[0]}
                    </Button>
                  </Box>
                  {/* Collapsible rest of history */}
                  {queryHistory.length > 1 && (
                    <Collapse in={historyOpen}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {queryHistory.slice(1).map((q, i) => (
                          <Button
                            key={q + i}
                            size="small"
                            variant={q === query ? 'contained' : 'outlined'}
                            color="secondary"
                            sx={{ fontFamily: 'monospace', textTransform: 'none', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                            onClick={() => setQuery(q)}
                          >
                            {q.length > 60 ? q.slice(0, 57) + '...' : q}
                          </Button>
                        ))}
                      </Box>
                    </Collapse>
                  )}
                </Box>
              )}
              <QueryBox
                query={query}
                setQuery={setQuery}
                executeQuery={executeQuery}
                queryLoading={queryLoading}
                queryError={queryError}
                schema={schema}
              />
            </Paper>
            {/* Panels below */}
            <Box display={{ xs: 'block', md: 'flex' }} gap={3}>
              {/* Left Panel: Editor & Controls */}
              <Box flex={1.3} minWidth={420}>
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                  {/* Tabs for Query Result, Schema, Node Data */}
                  <Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} aria-label="Result Tabs">
                    <Tab label="Query Result" />
                    <Tab label="Schema" />
                    <Tab label="Node Data" />
                  </Tabs>
                  <Box sx={{ mt: 2 }}>
                    {tabIndex === 0 && <QueryResult queryResult={queryResult} />}
                    {tabIndex === 1 && <SchemaBox schema={schema} />}
                    {tabIndex === 2 && (
                      selectedNodeData ? (
                        <ReactJson
                          src={selectedNodeData}
                          collapsed={1}
                          name={null}
                          enableClipboard={true}
                          displayDataTypes={false}
                          displayObjectSize={false}
                          style={{ fontSize: 13 }}
                        />
                      ) : (
                        <Alert severity="info">No node selected. Click a node in the graph to view its data.</Alert>
                      )
                    )}
                  </Box>
                </Paper>
              </Box>
            </Box>

          </Grid>
          <Grid item xs={6} md={6} sx={{ height: '100%' }}>

            <Box sx={{ height: '100%' }}>
              <GraphViewer
                data={queryResult}
                loading={queryLoading}
                error={queryError}
                setSelectedNodeData={data => {
                  setSelectedNodeData(data);
                  setTabIndex(2); // Switch to Node Data tab
                }}
              />
            </Box>

          </Grid>
        </Grid>

      </Box>
    </Box>
  );
}

