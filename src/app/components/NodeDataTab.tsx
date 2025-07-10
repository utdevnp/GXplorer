import React from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import QueryResult from './QueryResult';

interface NodeDataTabProps {
  selectedNodeData: any;
  nodeDataLoading: boolean;
  themeMode?: 'light' | 'dark';
}

const NodeDataTab: React.FC<NodeDataTabProps> = ({ selectedNodeData, nodeDataLoading, themeMode = 'light' }) => {
  if (nodeDataLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={120}>
        <CircularProgress />
      </Box>
    );
  }
  if (!selectedNodeData) {
    return <Alert severity="info">No node selected. Click a node in the graph to view its data.</Alert>;
  }
  if (Array.isArray(selectedNodeData?.result?._items) && selectedNodeData.result._items.length > 0) {
    return <QueryResult queryResult={selectedNodeData.result._items[0]} themeMode={themeMode} />;
  }
  return <QueryResult queryResult={selectedNodeData} themeMode={themeMode} />;
};

export default NodeDataTab; 