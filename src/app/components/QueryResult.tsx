import React from 'react';
import { Typography, Alert } from '@mui/material';
import dynamic from 'next/dynamic';
const ReactJson = dynamic(() => import('react-json-view'), { ssr: false });

interface QueryResultProps {
  queryResult: any;
}

const QueryResult: React.FC<QueryResultProps> = ({ queryResult }) => {
  if (!queryResult) {
    return <Alert severity="info">No result to display.</Alert>;
  }
  return (
    <div>
      <ReactJson
        src={queryResult}
        collapsed={1}
        name={null}
        enableClipboard={true}
        displayDataTypes={false}
        displayObjectSize={false}
        style={{ fontSize: 13 }}
      />
    </div>
  );
};

export default QueryResult; 