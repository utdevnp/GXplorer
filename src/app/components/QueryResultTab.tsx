import React from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import QueryResult from './QueryResult';

interface QueryResultTabProps {
  queryResult: any;
  queryLoading: boolean;
  themeMode?: 'light' | 'dark';
}

const QueryResultTab: React.FC<QueryResultTabProps> = ({ queryResult, queryLoading, themeMode = 'light' }) => {
  if (queryLoading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={120}>
        <CircularProgress />
      </Box>
    );
  }
  if (!queryResult) {
    return <Alert severity="info">No result to display.</Alert>;
  }
  return <QueryResult queryResult={queryResult} themeMode={themeMode} />;
};

export default QueryResultTab; 