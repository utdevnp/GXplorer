import React from 'react';
import { Box, Button, Typography } from '@mui/material';

interface ConnectionFormProps {
  mode: 'add' | 'edit';
  conn: any;
  setConn: (conn: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

const ConnectionForm: React.FC<ConnectionFormProps> = ({ mode, conn, setConn, onSave, onCancel }) => {
  return (
    <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2, }} onSubmit={e => { e.preventDefault(); onSave(); }}>
      <Typography variant="subtitle1">{mode === 'add' ? 'Add Connection' : 'Edit Connection'}</Typography>
      <input
        type="text"
        placeholder="Name"
        value={conn.name}
        onChange={e => setConn({ ...conn, name: e.target.value })}
        style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        required
      />
      <select
        value={conn.type}
        onChange={e => setConn({ ...conn, type: e.target.value })}
        style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
      >
        <option value="local">Local Gremlin</option>
        <option value="cosmos">Azure Cosmos Gremlin</option>
      </select>
      {/* Dynamic fields */}
      {conn.type === 'local' ? (
        <input
          type="text"
          placeholder="Gremlin Server URL"
          value={conn.url}
          onChange={e => setConn({ ...conn, url: e.target.value })}
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          required
        />
      ) : (
        <>
          <input
            type="text"
            placeholder="Cosmos Gremlin URL"
            value={conn.url}
            onChange={e => setConn({ ...conn, url: e.target.value })}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            required
          />
          <input
            type="text"
            placeholder="Access Key"
            value={conn.accessKey}
            onChange={e => setConn({ ...conn, accessKey: e.target.value })}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            required
          />
          <input
            type="text"
            placeholder="Database Name"
            value={conn.dbName}
            onChange={e => setConn({ ...conn, dbName: e.target.value })}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            required
          />
          <input
            type="text"
            placeholder="Graph Name (Collection)"
            value={conn.graphName}
            onChange={e => setConn({ ...conn, graphName: e.target.value })}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            required
          />
        </>
      )}
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Save
        </Button>
        <Button variant="outlined" color="secondary" fullWidth onClick={onCancel} type="button">
          Cancel
        </Button>
      </Box>
    </Box>
  );
};

export default ConnectionForm; 