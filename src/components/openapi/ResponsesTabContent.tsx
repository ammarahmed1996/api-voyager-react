
import React from 'react';
import { OpenApiSpec, OperationObject, ResponseObject, isReferenceObject, MediaTypeObject, SchemaObject } from '@/types/openapi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import JsonViewer from './JsonViewer';

interface ResponsesTabContentProps {
  operation: OperationObject;
  openApiSpec: OpenApiSpec;
}

const resolveReference = <T,>(ref: string, spec: OpenApiSpec): T | undefined => {
  if (!ref.startsWith('#/components/')) {
    console.warn(`Unsupported reference format: ${ref}`);
    return undefined;
  }
  const parts = ref.split('/').slice(2);
  let current: any = spec.components;
  for (const part of parts) {
    if (current && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return current as T;
};

const ResponsesTabContent: React.FC<ResponsesTabContentProps> = ({ operation, openApiSpec }) => {
  if (!operation.responses) {
    return <p>No responses defined for this operation.</p>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(operation.responses).map(([statusCode, responseObjectOrRef]) => {
        const responseObject = isReferenceObject(responseObjectOrRef)
          ? resolveReference<ResponseObject>(responseObjectOrRef.$ref, openApiSpec)
          : responseObjectOrRef;

        if (!responseObject) {
          return <p key={statusCode}>Could not resolve response: {isReferenceObject(responseObjectOrRef) ? responseObjectOrRef.$ref : statusCode}</p>;
        }

        // Assuming JSON content type for simplicity
        const jsonContent = responseObject.content?.['application/json'] as MediaTypeObject | undefined;
        const example = jsonContent?.example || jsonContent?.examples?.['default']?.value; // Simple example picking
        const schema = jsonContent?.schema;
        const resolvedSchema = schema && isReferenceObject(schema) ? resolveReference<SchemaObject>(schema.$ref, openApiSpec) : schema as SchemaObject;


        return (
          <Card key={statusCode}>
            <CardHeader>
              <CardTitle className="text-lg">
                Status <span className={`font-bold ${parseInt(statusCode) >= 400 ? 'text-red-600' : 'text-green-600'}`}>{statusCode}</span>
              </CardTitle>
              <CardDescription>{responseObject.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {example && <JsonViewer json={example} title="Example Response Body" />}
              {resolvedSchema && !example && <JsonViewer json={resolvedSchema} title="Response Schema" />}
              {!example && !resolvedSchema && <p className="text-sm text-muted-foreground">No example or schema provided for this response content.</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ResponsesTabContent;
