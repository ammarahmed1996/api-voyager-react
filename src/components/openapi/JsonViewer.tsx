
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JsonViewerProps {
  json: object | string;
  title?: string;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ json, title }) => {
  const dataString = typeof json === 'string' ? json : JSON.stringify(json, null, 2);
  const customTheme = {
    ...okaidia,
    'property': { color: 'hsl(210, 100%, 60%)' }, // Blue for keys
    'string': { color: 'hsl(25, 100%, 60%)' },    // Orange for values
    'number': { color: 'hsl(25, 100%, 60%)' },    // Orange for number values
    'boolean': { color: 'hsl(25, 100%, 60%)' },   // Orange for boolean values
    'keyword': { color: 'hsl(25, 100%, 60%)' },   // Orange for null keyword
    'null': { color: 'hsl(25, 100%, 60%)' },      // Orange for null values
  };

  return (
    <div className="my-4">
      {title && <h4 className="text-md font-semibold mb-2 text-foreground">{title}</h4>}
      <div className="bg-muted p-4 rounded-md max-h-96 overflow-auto">
        <SyntaxHighlighter language="json" style={customTheme}>
          {dataString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default JsonViewer;
