import React from 'react';
import { Typography, Grid, Card, CardContent, Divider, Box } from '@mui/material';

interface SchemaBoxProps {
  schema: { vertexLabels: string[]; edgeLabels: string[] } | null;
}

const SchemaBox: React.FC<SchemaBoxProps> = ({ schema }) => (
  <div>
   
    {schema ? (
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1">Vertex Labels</Typography>
              <Divider sx={{ my: 1 }} />
              <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                {schema.vertexLabels.map(label => (
                  <li key={label}><Typography>{label}</Typography></li>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1">Edge Labels</Typography>
              <Divider sx={{ my: 1 }} />
              <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                {schema.edgeLabels.map(label => (
                  <li key={label}><Typography>{label}</Typography></li>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    ) : (
      <Typography color="text.secondary">No schema loaded. Connect to server and fetch schema.</Typography>
    )}
  </div>
);

export default SchemaBox; 