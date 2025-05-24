
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { okaidia } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface JsonViewerProps {
  json: object | string;
  title?: string;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ json, title }) => {
  const dataString = typeof json === 'string' ? json : JSON.stringify(json, null, 2);

  return (
    <div className="my-4">
      {title && <h4 className="text-md font-semibold mb-2 text-foreground">{title}</h4>}
      <div className="bg-muted p-4 rounded-md max-h-96 overflow-auto">
        <SyntaxHighlighter language="json" style={okaidia} customStyle={{ margin: 0, background: 'transparent' }}>
          {dataString}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default JsonViewer;
