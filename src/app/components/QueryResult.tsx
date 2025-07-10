import React from 'react';
import { Typography, Alert } from '@mui/material';
import dynamic from 'next/dynamic';
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

interface QueryResultProps {
  queryResult: any;
  themeMode?: 'light' | 'dark';
}

const QueryResult: React.FC<QueryResultProps> = ({ queryResult, themeMode = 'light' }) => {
  if (!queryResult) {
    return <Alert severity="info">No result to display.</Alert>;
  }
  return (
    <div style={{
      background: themeMode === 'dark' ? '#000' : '#fff',
      color: themeMode === 'dark' ? '#e0e0e0' : '#222',
      borderRadius: 8,
      padding: 8,
      fontSize: 13,
      overflowX: 'auto',
      border: `4px solid ${themeMode === 'dark' ? '#222' : '#fff'}`,
    }}>
      <ReactJson
        src={queryResult}
        collapsed={1}
        name={null}
        enableClipboard={true}
        displayDataTypes={false}
        displayObjectSize={false}
        style={{ fontSize: 13 }}
        theme={themeMode === 'dark' ? 'monokai' : 'rjv-default'}
      />
    </div>
  );
};

export default QueryResult; 