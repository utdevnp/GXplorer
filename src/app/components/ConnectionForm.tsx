import React from 'react';
import { Box, Button, Typography, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface ConnectionFormProps {
  mode: 'add' | 'edit';
  conn: any;
  setConn: (conn: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ mode, conn, setConn, onSave, onCancel }) => {
  return (
    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }} onSubmit={e => { e.preventDefault(); onSave(); }}>
      <Typography variant="subtitle1">{mode === 'add' ? 'Add Connection' : 'Edit Connection'}</Typography>
      <TextField
        type="text"
        label="Name"
        value={conn.name}
        onChange={e => setConn({ ...conn, name: e.target.value })}
        fullWidth
        size="small"
        placeholder="Connection name"
        InputLabelProps={{ sx: { fontSize: 14, top: '-4px' } }}
        InputProps={{
          sx: {
            '& input': { padding: '6px 8px', height: 18, fontSize: 14 },
            '& input::placeholder': { fontSize: 14, opacity: 0.7 },
          },
        }}
        required
      />
      <FormControl fullWidth size="small">
        <InputLabel id="type-label">Type</InputLabel>
        <Select
          labelId="type-label"
          value={conn.type}
          label="Type"
          onChange={e => setConn({ ...conn, type: e.target.value })}
          sx={{ height: 32, fontSize: 14, p: 0 }}
        >
          <MenuItem value="local">Local Gremlin</MenuItem>
          <MenuItem value="cosmos">Azure Cosmos Gremlin</MenuItem>
        </Select>
      </FormControl>
      {/* Dynamic fields */}
      {conn.type === 'local' ? (
        <TextField
          type="text"
          label="URL"
          value={conn.url}
          onChange={e => setConn({ ...conn, url: e.target.value })}
          fullWidth
          size="small"
          placeholder="ws://localhost:8182/gremlin"
          InputLabelProps={{ sx: { fontSize: 14, top: '-4px' } }}
          InputProps={{
            sx: {
              '& input': { padding: '6px 8px', height: 18, fontSize: 14 },
              '& input::placeholder': { fontSize: 14, opacity: 0.7 },
            },
          }}
          required
        />
      ) : (
        <>
          <TextField
            type="text"
            label="URL"
            value={conn.url}
            onChange={e => setConn({ ...conn, url: e.target.value })}
            fullWidth
            size="small"
            placeholder="Cosmos DB Gremlin endpoint"
            InputLabelProps={{ sx: { fontSize: 14, top: '-4px' } }}
            InputProps={{
              sx: {
                '& input': { padding: '6px 8px', height: 18, fontSize: 14 },
                '& input::placeholder': { fontSize: 14, opacity: 0.7 },
              },
            }}
            required
          />
          <TextField
            type="text"
            label="Access Key"
            value={conn.accessKey}
            onChange={e => setConn({ ...conn, accessKey: e.target.value })}
            fullWidth
            size="small"
            placeholder="Primary or secondary key"
            InputLabelProps={{ sx: { fontSize: 14, top: '-4px' } }}
            InputProps={{
              sx: {
                '& input': { padding: '6px 8px', height: 18, fontSize: 14 },
                '& input::placeholder': { fontSize: 14, opacity: 0.7 },
              },
            }}
            required
          />
          <TextField
            type="text"
            label="Database Name"
            value={conn.dbName}
            onChange={e => setConn({ ...conn, dbName: e.target.value })}
            fullWidth
            size="small"
            placeholder="Database name"
            InputLabelProps={{ sx: { fontSize: 14, top: '-4px' } }}
            InputProps={{
              sx: {
                '& input': { padding: '6px 8px', height: 18, fontSize: 14 },
                '& input::placeholder': { fontSize: 14, opacity: 0.7 },
              },
            }}
            required
          />
          <TextField
            type="text"
            label="Graph Name"
            value={conn.graphName}
            onChange={e => setConn({ ...conn, graphName: e.target.value })}
            fullWidth
            size="small"
            placeholder="Graph name"
            InputLabelProps={{ sx: { fontSize: 14, top: '-4px' } }}
            InputProps={{
              sx: {
                '& input': { padding: '6px 8px', height: 18, fontSize: 14 },
                '& input::placeholder': { fontSize: 14, opacity: 0.7 },
              },
            }}
            required
          />
        </>
      )}
      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
        <Button type="submit" variant="contained" color="primary" size="small" sx={{ minWidth: 0 }}>
          Save
        </Button>
        <Button type="button" variant="outlined" color="secondary" size="small" onClick={onCancel} sx={{ minWidth: 0 }}>
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default ConnectionForm; 