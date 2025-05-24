
import React from 'react';
import { OpenApiSpec, OperationObject, SchemaObject, isReferenceObject, RequestBodyObject, ResponseObject } from '@/types/openapi/index';
import JsonViewer from './JsonViewer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { resolveReference, deepResolveRefs } from './openapiUtils';
import SchemaTreeView from './SchemaTreeView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  let responseCardTitle = "Response Body Schema";
  let targetResponseCodeForSchema = '200';
  let responseDefinition = operation.responses[targetResponseCodeForSchema];

  if (!responseDefinition) {
    // Fallback to the first 2xx response if 200 is not found
    const firstSuccessCode = Object.keys(operation.responses).find(code => code.startsWith('2'));
    if (firstSuccessCode) {
      targetResponseCodeForSchema = firstSuccessCode;
      responseDefinition = operation.responses[targetResponseCodeForSchema];
      responseCardTitle = `Response Body Schema (${targetResponseCodeForSchema} - Typical Success)`;
    } else {
      responseCardTitle = "Response Body Schema (No 2xx Success Response Defined)";
    }
  } else {
    responseCardTitle = `Response Body Schema (200)`;
  }

  if (responseDefinition) {
    const responseObject = isReferenceObject(responseDefinition)
      ? resolveReference<ResponseObject>(responseDefinition.$ref, openApiSpec)
      : responseDefinition;
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
            <SchemaTreeView schema={fullyResolvedRequestSchema} name="Request" isExpanded={true} />
          </CardContent>
        </Card>
      )}
      {!fullyResolvedRequestSchema && <p className="text-sm text-muted-foreground">No request body schema defined (for application/json).</p>}

      {fullyResolvedResponseSchema && (
        <Card>
          <CardHeader><CardTitle className="text-lg">{responseCardTitle}</CardTitle></CardHeader>
          <CardContent>
            <SchemaTreeView schema={fullyResolvedResponseSchema} name="Response" isExpanded={true} />
          </CardContent>
        </Card>
      )}
      {!fullyResolvedResponseSchema && targetResponseCodeForSchema && (
          <p className="text-sm text-muted-foreground mt-4">
            No response body schema defined for {targetResponseCodeForSchema === '200' ? '200 response' : `response ${targetResponseCodeForSchema}`} (application/json).
          </p>
      )}
       {!fullyResolvedResponseSchema && !targetResponseCodeForSchema && (
          <p className="text-sm text-muted-foreground mt-4">
            No primary success response schema defined (for application/json).
          </p>
       )}
    </div>
  );
};

export default SchemaTabContent;
