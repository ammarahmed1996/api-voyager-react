
import React from 'react';
import { OpenApiSpec, OperationObject, SchemaObject, isReferenceObject, RequestBodyObject, ResponseObject } from '@/types/openapi';
import JsonViewer from './JsonViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SchemaTabContentProps {
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

const SchemaTabContent: React.FC<SchemaTabContentProps> = ({ operation, openApiSpec }) => {
  let requestSchema: SchemaObject | undefined = undefined;
  if (operation.requestBody) {
    const requestBody = isReferenceObject(operation.requestBody)
      ? resolveReference<RequestBodyObject>(operation.requestBody.$ref, openApiSpec)
      : operation.requestBody;
    if (requestBody?.content?.['application/json']?.schema) {
      const schemaOrRef = requestBody.content['application/json'].schema;
      requestSchema = isReferenceObject(schemaOrRef)
        ? resolveReference<SchemaObject>(schemaOrRef.$ref, openApiSpec)
        : schemaOrRef;
    }
  }

  // For simplicity, showing schema for the first successful response (e.g., 200 or 201)
  // This could be made more sophisticated to show all response schemas
  let responseSchema: SchemaObject | undefined = undefined;
  const successResponseCode = Object.keys(operation.responses).find(code => code.startsWith('2'));
  if (successResponseCode) {
    const responseOrRef = operation.responses[successResponseCode];
    const responseObject = isReferenceObject(responseOrRef)
      ? resolveReference<ResponseObject>(responseOrRef.$ref, openApiSpec)
      : responseOrRef;
    if (responseObject?.content?.['application/json']?.schema) {
      const schemaOrRef = responseObject.content['application/json'].schema;
      responseSchema = isReferenceObject(schemaOrRef)
        ? resolveReference<SchemaObject>(schemaOrRef.$ref, openApiSpec)
        : schemaOrRef;
    }
  }

  return (
    <div className="space-y-6">
      {requestSchema && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Request Body Schema</CardTitle></CardHeader>
          <CardContent>
            <JsonViewer json={requestSchema} />
          </CardContent>
        </Card>
      )}
      {!requestSchema && <p className="text-sm text-muted-foreground">No request body schema defined (for application/json).</p>}

      {responseSchema && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Response Body Schema (Typical Success)</CardTitle></CardHeader>
          <CardContent>
            <JsonViewer json={responseSchema} />
          </CardContent>
        </Card>
      )}
      {!responseSchema && <p className="text-sm text-muted-foreground mt-4">No primary success response schema defined (for application/json).</p>}
      <p className="text-xs text-muted-foreground italic mt-4">Note: Highlighting required fields within schemas is planned for a future update.</p>
    </div>
  );
};

export default SchemaTabContent;
