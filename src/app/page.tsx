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
import MenuIcon from '@mui/icons-material/Menu';
import { getConnections, saveConnection, Connection } from '../utils/connectionStorage';
import { v4 as uuidv4 } from 'uuid';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
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
  const [connections, setConnections] = useState<Connection[]>([]);
  const [addMode, setAddMode] = useState(false);
  const [newConn, setNewConn] = useState({
    name: '',
    type: 'local',
    url: '',
    accessKey: '',
    dbName: '',
    graphName: '',
  });
  const [selectedConnectionId, setSelectedConnectionId] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');

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

  // Load connections initially
  useEffect(() => {
    setConnections(getConnections());
  }, []);
  // Optionally, reload when drawer opens (if you want to catch changes from other tabs/windows)
  useEffect(() => {
    if (drawerOpen) {
      setConnections(getConnections());
    }
  }, [drawerOpen]);

  // When connections change, default to first connection if none selected
  useEffect(() => {
    if (connections.length > 0 && !selectedConnectionId) {
      setSelectedConnectionId(connections[0].id);
    }
    if (connections.length === 0) {
      setSelectedConnectionId(null);
    }
  }, [connections]);

  // Get the selected connection object
  const selectedConnection = connections.find(c => c.id === selectedConnectionId) || null;

  // When selected connection changes, fetch schema and reset query state
  useEffect(() => {
    if (selectedConnection) {
      setSchema(null);
      setQueryResult(null);
      setError(null);
      setQueryError(null);
      setLoading(true);
      setConnectionStatus('loading');
      fetchSchema();
    }
  }, [selectedConnectionId]);

  const fetchSchema = async () => {
    if (!selectedConnection) return;
    setLoading(true);
    setError(null);
    try {
      const body: any = { type: selectedConnection.type, ...selectedConnection.details };
      const res = await fetch('/api/gremlin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setSchema(data.result);
        setConnectionStatus('ok');
      } else {
        setError(data.error || 'Failed to fetch schema');
        setConnectionStatus('error');
      }
    } catch (err) {
      setError((err as Error).message);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const createLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConnection || !newLabel) return;
    setCreating(true);
    setError(null);
    let labelQuery = '';
    if (labelType === 'vertex') {
      labelQuery = `graph.addVertex(label, '${newLabel}')`;
    } else {
      labelQuery = `v1 = graph.addVertex(); v2 = graph.addVertex(); v1.addEdge('${newLabel}', v2)`;
    }
    try {
      const body: any = { type: selectedConnection.type, query: labelQuery, ...selectedConnection.details };
      const res = await fetch('/api/gremlin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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
    if (!selectedConnection) return;
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
      const body: any = { type: selectedConnection.type, query, ...selectedConnection.details };
      const res = await fetch('/api/gremlin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const handleAddConnection = () => {
    const conn: Connection = {
      id: uuidv4(),
      name: newConn.name,
      type: newConn.type,
      details:
        newConn.type === 'local'
          ? { url: newConn.url }
          : { url: newConn.url, accessKey: newConn.accessKey, dbName: newConn.dbName, graphName: newConn.graphName },
    };
    saveConnection(conn);
    setConnections(getConnections());
    setAddMode(false);
    setNewConn({ name: '', type: 'local', url: '', accessKey: '', dbName: '', graphName: '' });
  };

  return (
    <Box>
      <AppBar position="sticky" elevation={0} sx={{ background: 'rgba(255,255,255,0.97)', boxShadow: 1, borderBottom: '1px solid #e0e0e0', zIndex: 1201 }}>
        <Toolbar sx={{ flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', alignItems: 'center', minHeight: 88 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mr: 4 }}>
            {/* Burger menu */}
            <IconButton edge="start" color="inherit" aria-label="menu" onClick={() => setDrawerOpen(open => !open)}>
              <MenuIcon sx={{ color: 'black' }} />
            </IconButton>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: 1 }}>
              GXplorer
            </Typography>
          </Box>
          {/* Connection select dropdown */}
          <Box sx={{ minWidth: 260, display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="connection-select-label">Connection</InputLabel>
              <Select
                labelId="connection-select-label"
                value={selectedConnectionId || ''}
                label="Connection"
                onChange={e => setSelectedConnectionId(e.target.value)}
              >
                <MenuItem value="">Select Connection</MenuItem>
                {connections.map(conn => (
                  <MenuItem key={conn.id} value={conn.id}>
                    {conn.name} ({conn.type})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {connectionStatus === 'loading' && (
              <CircularProgress size={20} sx={{ ml: 1 }} />
            )}
            {connectionStatus === 'ok' && (
              <FiberManualRecordIcon sx={{ color: 'green', ml: 1, fontSize: 20, verticalAlign: 'middle' }} />
            )}
            {connectionStatus === 'error' && (
              <FiberManualRecordIcon sx={{ color: 'red', ml: 1, fontSize: 20, verticalAlign: 'middle' }} />
            )}
          </Box>
        </Toolbar>
      </AppBar>
      {/* Drawer for connection management */}
      <Drawer anchor="left" open={drawerOpen} onClose={() => { setDrawerOpen(false); setAddMode(false); }}>
        <Box sx={{ width: 340, p: 3 }}>
          <Typography variant="h6" gutterBottom>Connections</Typography>
          {/* Connection list */}
          <Box sx={{ mb: 2 }}>
            {connections.length === 0 ? (
              <Typography color="text.secondary">No connections saved.</Typography>
            ) : (
              connections.map(conn => (
                <Box
                  key={conn.id}
                  sx={{
                    mb: 1,
                    p: 1,
                    borderRadius: 1,
                    background: '#f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <Box>
                    <Typography fontWeight={600}>{conn.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{conn.type}</Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
          {addMode ? (
            <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} onSubmit={e => { e.preventDefault(); handleAddConnection(); }}>
              <Typography variant="subtitle1">Add Connection</Typography>
              <input
                type="text"
                placeholder="Name"
                value={newConn.name}
                onChange={e => setNewConn({ ...newConn, name: e.target.value })}
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                required
              />
              <select
                value={newConn.type}
                onChange={e => setNewConn({ ...newConn, type: e.target.value })}
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
              >
                <option value="local">Local Gremlin</option>
                <option value="cosmos">Azure Cosmos Gremlin</option>
              </select>
              {/* Dynamic fields */}
              {newConn.type === 'local' ? (
                <input
                  type="text"
                  placeholder="Gremlin Server URL"
                  value={newConn.url}
                  onChange={e => setNewConn({ ...newConn, url: e.target.value })}
                  style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                  required
                />
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Cosmos Gremlin URL"
                    value={newConn.url}
                    onChange={e => setNewConn({ ...newConn, url: e.target.value })}
                    style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Access Key"
                    value={newConn.accessKey}
                    onChange={e => setNewConn({ ...newConn, accessKey: e.target.value })}
                    style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Database Name"
                    value={newConn.dbName}
                    onChange={e => setNewConn({ ...newConn, dbName: e.target.value })}
                    style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Graph Name (Collection)"
                    value={newConn.graphName}
                    onChange={e => setNewConn({ ...newConn, graphName: e.target.value })}
                    style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
                    required
                  />
                </>
              )}
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button type="submit" variant="contained" color="primary" fullWidth>
                  Save
                </Button>
                <Button variant="outlined" color="secondary" fullWidth onClick={() => setAddMode(false)}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Button variant="contained" color="primary" fullWidth onClick={() => setAddMode(true)}>
              + Add Connection
            </Button>
          )}
        </Box>
      </Drawer>
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
                    {tabIndex === 1 && (
                      loading ? (
                        <Box display="flex" alignItems="center" justifyContent="center" minHeight={120}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <SchemaBox schema={schema} />
                      )
                    )}
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

