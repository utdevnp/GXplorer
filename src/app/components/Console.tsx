import React from 'react';
import { Box, Typography, Collapse, IconButton } from '@mui/material';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Tooltip from '@mui/material/Tooltip';

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
  logContainerRef: React.RefObject<HTMLDivElement>;
  themeMode?: 'light' | 'dark';
}

const Console: React.FC<ConsoleProps> = ({
  logs,
  expandedLogId,
  setExpandedLogId,
  open,
  setOpen,
  logContainerRef,
  themeMode = 'light',
}) => {
  if (!open) {
    // Render a small header at the bottom to open the console
    return (
      <Box
        sx={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1202,
          background: themeMode === 'dark' ? '#23272f' : '#f5f5f5',
          color: themeMode === 'dark' ? '#e0e0e0' : '#222',
          borderTop: themeMode === 'dark' ? '1px solid #333' : '1px solid #e0e0e0',
          boxShadow: themeMode === 'dark' ? '0 -1px 4px 0 rgba(0,0,0,0.5)' : '0 -1px 4px 0 rgba(0,0,0,0.05)',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          px: 2,
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(true)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 15, color: themeMode === 'dark' ? '#90caf9' : '#1976d2', letterSpacing: 1 }}>
            Console
          </Typography>
          <Typography variant="caption" sx={{ color: themeMode === 'dark' ? '#b0b0b0' : '#888', ml: 1 }}>
            {logs.length} log{logs.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: themeMode === 'dark' ? '#e0e0e0' : '#222' }}>
          <ExpandLessIcon />
        </IconButton>
      </Box>
    );
  }
  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1202,
        background: themeMode === 'dark' ? '#181a20' : '#fafafa',
        color: themeMode === 'dark' ? '#e0e0e0' : '#222',
        borderTop: themeMode === 'dark' ? '1px solid #333' : '1px solid #e0e0e0',
        boxShadow: themeMode === 'dark' ? '0 -2px 8px 0 rgba(0,0,0,0.7)' : '0 -2px 8px 0 rgba(0,0,0,0.10)',
        fontFamily: 'monospace',
        fontSize: 13,
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      {/* Console Header (clickable to close) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1.2,
          py: 0.5,
          background: themeMode === 'dark' ? '#23272f' : '#f5f5f5',
          color: themeMode === 'dark' ? '#e0e0e0' : '#222',
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
          borderBottom: themeMode === 'dark' ? '1px solid #333' : '1px solid #e0e0e0',
          boxShadow: themeMode === 'dark' ? '0 -1px 4px 0 rgba(0,0,0,0.5)' : '0 -1px 4px 0 rgba(0,0,0,0.05)',
          cursor: 'pointer',
        }}
        onClick={() => setOpen(open ? false : true)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: 13, color: themeMode === 'dark' ? '#90caf9' : '#1976d2', letterSpacing: 1 }}>
            Console
          </Typography>
          <Typography variant="caption" sx={{ color: themeMode === 'dark' ? '#b0b0b0' : '#888', ml: 0.5, fontSize: 11 }}>
            {logs.length} log{logs.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        <IconButton size="small" sx={{ color: themeMode === 'dark' ? '#e0e0e0' : '#222', p: 0.25 }}>
          <ExpandLessIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box
        ref={logContainerRef}
        sx={{
          background: themeMode === 'dark' ? '#23272f' : '#fafafa',
          color: themeMode === 'dark' ? '#e0e0e0' : '#222',
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
          <Typography color={themeMode === 'dark' ? '#888' : 'text.secondary'}>No logs yet.</Typography>
        ) : (
          [...logs].sort((a, b) => Number(b.id) - Number(a.id)).map((log, idx) => {
            const hasDetails = log.query || log.details;
            const isExpanded = expandedLogId === log.id;
            return (
              <Box
                key={log.id + '-' + idx}
                sx={{
                  mb: 0.25,
                  p: 0.5,
                  borderRadius: 1,
                  background: themeMode === 'dark' ? '#181a20' : '#ececec',
                  color: themeMode === 'dark' ? '#e0e0e0' : '#222',
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: 'monospace',
                  transition: 'background 0.2s',
                  cursor: hasDetails ? 'pointer' : 'default',
                  '&:hover': { background: hasDetails ? (themeMode === 'dark' ? '#23272f' : '#e0e0e0') : (themeMode === 'dark' ? '#181a20' : '#ececec') },
                }}
                onClick={hasDetails ? () => setExpandedLogId(isExpanded ? null : log.id) : undefined}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <Typography variant="caption" sx={{ color: themeMode === 'dark' ? '#b0b0b0' : '#888', minWidth: 48, fontFamily: 'monospace', fontSize: 11 }}>{log.time}</Typography>
                  {typeof log.success === 'boolean' ? (
                    <FiberManualRecordIcon sx={{ color: log.success ? (themeMode === 'dark' ? 'limegreen' : 'green') : (themeMode === 'dark' ? '#ff5252' : 'red'), fontSize: 12, mx: 1 }} />
                  ) : (log.type === 'info' || log.type === 'connection') ? (
                    <FiberManualRecordIcon sx={{ color: '#42a5f5', fontSize: 12, mx: 1 }} />
                  ) : null}
                  <Typography
                    variant="body2"
                    title={log.message}
                    sx={{
                      flex: 1,
                      ml: 1,
                      fontFamily: 'monospace',
                      fontSize: 11,
                      color: log.success === false ? (themeMode === 'dark' ? '#ff5252' : 'red') : (themeMode === 'dark' ? '#e0e0e0' : '#222'),
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {log.message}
                  </Typography>
                  <Tooltip title="Copy log message" arrow>
                    <IconButton
                      size="small"
                      sx={{ ml: 0.5, color: themeMode === 'dark' ? '#b0b0b0' : '#888', p: 0.25 }}
                      onClick={e => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(JSON.stringify(log, null, 2));
                      }}
                    >
                      <ContentCopyIcon fontSize="inherit" style={{ fontSize: 14 }} />
                    </IconButton>
                  </Tooltip>
                  {log.endpoint && (
                    <Typography
                      variant="caption"
                      title={log.endpoint}
                      sx={{
                        color: themeMode === 'dark' ? '#90caf9' : '#1976d2',
                        ml: 1,
                        minWidth: 80,
                        maxWidth: 120,
                        fontSize: 11,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFamily: 'monospace',
                      }}
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
                    <Box sx={{ mt: 0.5, fontFamily: 'monospace', color: themeMode === 'dark' ? '#ffb300' : '#e65100' }}>
                      <Typography variant="caption" sx={{ color: themeMode === 'dark' ? '#ffb300' : '#e65100', fontSize: 11 }}>Query:</Typography>
                      <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log.query}</pre>
                    </Box>
                  )}
                  {log.details && (
                    <Box sx={{ mt: 0.5, fontFamily: 'monospace', color: themeMode === 'dark' ? '#b0b0b0' : '#666' }}>
                      <Typography variant="caption" sx={{ color: themeMode === 'dark' ? '#b0b0b0' : '#666', fontSize: 11 }}>Details:</Typography>
                      <pre style={{ margin: 0, fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}</pre>
                    </Box>
                  )}
                </Collapse>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
};

export default Console; 