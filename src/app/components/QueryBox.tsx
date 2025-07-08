import React from 'react';
import MonacoEditor from '@monaco-editor/react';
import type { editor as MonacoEditorType, Position as MonacoPosition } from 'monaco-editor';
import { Box, Button, CircularProgress, Alert } from '@mui/material';

interface QueryBoxProps {
  query: string;
  setQuery: (q: string) => void;
  executeQuery: (e: React.FormEvent) => void;
  queryLoading: boolean;
  queryError: string | null;
  schema: { vertexLabels: string[]; edgeLabels: string[] } | null;
}

const QueryBox: React.FC<QueryBoxProps> = ({
  query,
  setQuery,
  executeQuery,
  queryLoading,
  queryError,
  schema,
}) => {
  return (
    <Box component="form" onSubmit={executeQuery} sx={{ width: '100%' }}>
      <Box sx={{ width: '100%', height: 220, mb: 2 }}>
        <MonacoEditor
          width="100%"
          height="100%"
          defaultLanguage="gremlin"
          language="gremlin"
          value={query}
          onChange={v => setQuery(v || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 16,
            fontFamily: 'monospace',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
          }}
          onMount={(editor, monaco) => {
            if (!monaco.languages.getLanguages().some((l: { id: string }) => l.id === 'gremlin')) {
              monaco.languages.register({ id: 'gremlin' });
            }
            monaco.languages.registerCompletionItemProvider('gremlin', {
              triggerCharacters: ['.'],
              provideCompletionItems: (
                model: MonacoEditorType.ITextModel,
                position: MonacoPosition
              ) => {
                const word = model.getWordUntilPosition(position);
                const range = {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: word.startColumn,
                  endColumn: word.endColumn,
                };
                // All possible traversal steps and functions
                const traversalFunctions = [
                  { label: 'V()', detail: 'Vertices' },
                  { label: 'E()', detail: 'Edges' },
                  { label: 'addV()', detail: 'Add vertex' },
                  { label: 'addE()', detail: 'Add edge' },
                  { label: 'property()', detail: 'Add property' },
                  { label: 'has()', detail: 'Filter by property' },
                  { label: 'hasLabel()', detail: 'Filter by label' },
                  { label: 'hasId()', detail: 'Filter by id' },
                  { label: 'hasKey()', detail: 'Filter by key' },
                  { label: 'hasValue()', detail: 'Filter by value' },
                  { label: 'out()', detail: 'Outgoing edges' },
                  { label: 'in()', detail: 'Incoming edges' },
                  { label: 'both()', detail: 'Both directions' },
                  { label: 'outE()', detail: 'Outgoing edges (edges)' },
                  { label: 'inE()', detail: 'Incoming edges (edges)' },
                  { label: 'bothE()', detail: 'Both directions (edges)' },
                  { label: 'outV()', detail: 'Outgoing vertex' },
                  { label: 'inV()', detail: 'Incoming vertex' },
                  { label: 'bothV()', detail: 'Both vertices' },
                  { label: 'values()', detail: 'Get property values' },
                  { label: 'valueMap()', detail: 'Get value map' },
                  { label: 'elementMap()', detail: 'Get element map' },
                  { label: 'id()', detail: 'Get id' },
                  { label: 'label()', detail: 'Get label' },
                  { label: 'count()', detail: 'Count results' },
                  { label: 'limit()', detail: 'Limit results' },
                  { label: 'order()', detail: 'Order results' },
                  { label: 'by()', detail: 'Order by property' },
                  { label: 'range()', detail: 'Range of results' },
                  { label: 'dedup()', detail: 'Remove duplicates' },
                  { label: 'group()', detail: 'Group results' },
                  { label: 'groupCount()', detail: 'Group and count' },
                  { label: 'project()', detail: 'Project results' },
                  { label: 'select()', detail: 'Select results' },
                  { label: 'unfold()', detail: 'Unfold results' },
                  { label: 'fold()', detail: 'Fold results' },
                  { label: 'coalesce()', detail: 'Coalesce traversals' },
                  { label: 'union()', detail: 'Union traversals' },
                  { label: 'where()', detail: 'Where predicate' },
                  { label: 'not()', detail: 'Negate predicate' },
                  { label: 'and()', detail: 'And predicate' },
                  { label: 'or()', detail: 'Or predicate' },
                  { label: 'is()', detail: 'Is predicate' },
                  { label: 'within()', detail: 'Within predicate' },
                  { label: 'without()', detail: 'Without predicate' },
                  { label: 'repeat()', detail: 'Repeat traversal' },
                  { label: 'times()', detail: 'Repeat times' },
                  { label: 'emit()', detail: 'Emit results' },
                  { label: 'until()', detail: 'Until condition' },
                  { label: 'path()', detail: 'Get path' },
                  { label: 'simplePath()', detail: 'Simple path' },
                  { label: 'cyclicPath()', detail: 'Cyclic path' },
                  { label: 'as()', detail: 'Label step' },
                  { label: 'store()', detail: 'Store step' },
                  { label: 'sum()', detail: 'Sum step' },
                  { label: 'max()', detail: 'Max step' },
                  { label: 'min()', detail: 'Min step' },
                  { label: 'mean()', detail: 'Mean step' },
                  { label: 'order()', detail: 'Order step' },
                  { label: 'by()', detail: 'Order by' },
                  { label: 'next()', detail: 'Get next result' },
                  { label: 'toList()', detail: 'Convert to list' },
                ];
                // If triggered by a dot, only show traversal functions
                const prevChar = model.getLineContent(position.lineNumber)[position.column - 2];
                let suggestions = [];
                if (prevChar === '.') {
                  suggestions = traversalFunctions.map(fn => ({
                    label: fn.label,
                    kind: monaco.languages.CompletionItemKind.Method,
                    insertText: fn.label,
                    detail: fn.detail,
                    range,
                  }));
                } else {
                  // Otherwise, show all (including g, schema, etc.)
                  suggestions = [
                    { label: 'g', kind: monaco.languages.CompletionItemKind.Variable, insertText: 'g', detail: 'Graph traversal source', range },
                    ...traversalFunctions.map(fn => ({
                      label: fn.label,
                      kind: monaco.languages.CompletionItemKind.Method,
                      insertText: fn.label,
                      detail: fn.detail,
                      range,
                    })),
                  ];
                  if (schema) {
                    schema.vertexLabels.forEach(label => {
                      suggestions.push({
                        label: label,
                        kind: monaco.languages.CompletionItemKind.Class,
                        insertText: `'${label}'`,
                        detail: 'Vertex label',
                        range,
                      });
                    });
                    schema.edgeLabels.forEach(label => {
                      suggestions.push({
                        label: label,
                        kind: monaco.languages.CompletionItemKind.Enum,
                        insertText: `'${label}'`,
                        detail: 'Edge label',
                        range,
                      });
                    });
                  }
                }
                return { suggestions };
              },
            });
          }}
        />
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <Button type="submit" variant="contained" color="primary" disabled={queryLoading} sx={{ mt: 2, minWidth: 120 }}>
          {queryLoading ? <CircularProgress size={20} /> : 'Run Query'}
        </Button>
      </Box>
      {queryError && <Alert severity="error" sx={{ mt: 2 }}>{queryError}</Alert>}
    </Box>
  );
};

export default QueryBox; 