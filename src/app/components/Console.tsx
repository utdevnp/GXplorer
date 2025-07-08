import React from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface ConsoleLog {
  id: string;
  time: string;
  type: 'query' | 'connection' | 'error' | 'info';
  message: string;
  endpoint?: string;
  query?: string;
  success?: boolean;
  details?: any;
}

interface ConsoleProps {
  logs: ConsoleLog[];
  expandedLogId: string | null;
  setExpandedLogId: (id: string | null) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  logContainerRef: React.RefObject<HTMLDivElement | null>;
}

const Console: React.FC<ConsoleProps> = ({ logs, expandedLogId, setExpandedLogId, open, setOpen, logContainerRef }) => (
  <Box sx={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 2000, display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
    <Box sx={{ width: '98%', m: 2, borderRadius: 2, boxShadow: 3, background: '#f5f5f5', pointerEvents: 'auto' }}>
      <Box
        sx={{
          background: '#e0e0e0',
          color: '#222',
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          userSelect: 'none',
        }}
        onClick={() => setOpen(!open)}
      >
        <Typography sx={{ fontWeight: 600, flex: 1 }}>Console</Typography>
        {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>
      {open && (
        <Box
          ref={logContainerRef}
          sx={{
            background: '#fafafa',
            color: '#222',
            maxHeight: 260,
            overflowY: 'auto',
            borderBottomLeftRadius: 8,
            borderBottomRightRadius: 8,
            px: 2,
            py: 1,
            fontSize: 13,
          }}
        >
          {logs.length === 0 ? (
            <Typography color="text.secondary">No logs yet.</Typography>
          ) : (
            [...logs].sort((a, b) => Number(b.id) - Number(a.id)).map((log, idx) => {
              const hasDetails = log.query || log.details;
              const isExpanded = expandedLogId === log.id;
              return (
                <Box
                  key={log.id + '-' + idx}
                  sx={{
                    mb: 0.5,
                    p: 0.75,
                    borderRadius: 1,
                    background: '#ececec',
                    display: 'flex',
                    flexDirection: 'column',
                    fontFamily: 'monospace',
                    transition: 'background 0.2s',
                    cursor: hasDetails ? 'pointer' : 'default',
                    '&:hover': { background: hasDetails ? '#e0e0e0' : '#ececec' },
                  }}
                  onClick={hasDetails ? () => setExpandedLogId(isExpanded ? null : log.id) : undefined}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Typography variant="caption" sx={{ color: '#888', minWidth: 48, fontFamily: 'monospace', fontSize: 11 }}>{log.time}</Typography>
                    {typeof log.success === 'boolean' && (
                      <FiberManualRecordIcon sx={{ color: log.success ? 'green' : 'red', fontSize: 12, mx: 0.5 }} />
                    )}
                    <Typography
                      variant="body2"
                      title={log.message}
                      sx={{ flex: 1, ml: 1, fontFamily: 'monospace', fontSize: 12, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {log.message}
                    </Typography>
                    {log.endpoint && (
                      <Typography
                        variant="caption"
                        title={log.endpoint}
                        sx={{ color: '#1976d2', ml: 1, minWidth: 80, maxWidth: 120, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'monospace' }}
                      >
                        {log.endpoint}
                      </Typography>
                    )}
                    {hasDetails && (
                      <IconButton
                        size="small"
                        sx={{ ml: 0.5, p: 0.5 }}
                        onClick={e => { e.stopPropagation(); setExpandedLogId(isExpanded ? null : log.id); }}
                        tabIndex={-1}
                      >
                        {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                      </IconButton>
                    )}
                  </Box>
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit sx={{ width: '100%' }}>
                    {log.query && (
                      <Box sx={{ mt: 0.5, fontFamily: 'monospace', color: '#ffd54f' }}>
                        <Typography variant="caption" sx={{ color: '#ffd54f', fontSize: 11 }}>Query:</Typography>
                        <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log.query}</pre>
                      </Box>
                    )}
                    {log.details && (
                      <Box sx={{ mt: 0.5, fontFamily: 'monospace', color: '#666' }}>
                        <Typography variant="caption" sx={{ color: '#666', fontSize: 11 }}>Details:</Typography>
                        <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}</pre>
                      </Box>
                    )}
                  </Collapse>
                </Box>
              );
            })
          )}
        </Box>
      )}
    </Box>
  </Box>
);

export default Console; 