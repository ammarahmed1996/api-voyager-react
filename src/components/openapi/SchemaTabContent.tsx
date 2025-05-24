
import React from 'react';
import { OpenApiSpec, OperationObject, SchemaObject, isReferenceObject, RequestBodyObject, ResponseObject } from '@/types/openapi/index';
import JsonViewer from './JsonViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveReference, deepResolveRefs } from './openapiUtils';

interface SchemaTabContentProps {
  operation: OperationObject;
  openApiSpec: OpenApiSpec;
}

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
  const fullyResolvedRequestSchema = requestSchema ? deepResolveRefs(requestSchema, openApiSpec) : undefined;


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
  const fullyResolvedResponseSchema = responseSchema ? deepResolveRefs(responseSchema, openApiSpec) : undefined;

  return (
    <div className="space-y-6">
      {fullyResolvedRequestSchema && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Request Body Schema</CardTitle></CardHeader>
          <CardContent>
            <JsonViewer json={fullyResolvedRequestSchema} />
          </CardContent>
        </Card>
      )}
      {!fullyResolvedRequestSchema && <p className="text-sm text-muted-foreground">No request body schema defined (for application/json).</p>}

      {fullyResolvedResponseSchema && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Response Body Schema (Typical Success)</CardTitle></CardHeader>
          <CardContent>
            <JsonViewer json={fullyResolvedResponseSchema} />
          </CardContent>
        </Card>
      )}
      {!fullyResolvedResponseSchema && <p className="text-sm text-muted-foreground mt-4">No primary success response schema defined (for application/json).</p>}
      <p className="text-xs text-muted-foreground italic mt-4">Note: Highlighting required fields within schemas is planned for a future update.</p>
    </div>
  );
};

export default SchemaTabContent;

