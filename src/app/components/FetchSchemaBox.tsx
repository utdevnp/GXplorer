import React from 'react';
import { Paper, Typography, Grid, TextField, Button, CircularProgress, Alert } from '@mui/material';

interface FetchSchemaBoxProps {
  serverUrl: string;
  setServerUrl: (url: string) => void;
  fetchSchema: () => void;
  loading: boolean;
  error: string | null;
}

const FetchSchemaBox: React.FC<FetchSchemaBoxProps> = ({
  serverUrl,
  setServerUrl,
  fetchSchema,
  loading,
  error,
}) => (
  <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
    <Typography variant="h6" gutterBottom>
      Connect to Gremlin Server
    </Typography>
    <Grid container spacing={2} alignItems="center">
      <Grid item xs={12} sm={9}>
        <TextField
          label="Gremlin Server URL"
          value={serverUrl}
          onChange={e => setServerUrl(e.target.value)}
          fullWidth
          size="medium"
          sx={{ height: 48 }}
        />
      </Grid>
      <Grid item xs={12} sm={3} sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <Button
          variant="contained"
          color="primary"
          onClick={fetchSchema}
          disabled={loading}
          fullWidth
          sx={{ height: 48, minWidth: 120, fontWeight: 600, fontSize: 16 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Fetch Schema'}
        </Button>
      </Grid>
    </Grid>
    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
  </Paper>
);

export default FetchSchemaBox; 