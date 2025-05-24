
import React, { useState } from 'react';
import { OpenApiSpec, OperationObject, ResponseObject, isReferenceObject, MediaTypeObject, SchemaObject, ExampleObject } from '@/types/openapi/index';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import JsonViewer from './JsonViewer';
import { resolveReference, deepResolveRefs } from './openapiUtils';
import { Button } from '@/components/ui/button';
import SchemaTreeView from './SchemaTreeView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ResponsesTabContentProps {
  operation: OperationObject;
  openApiSpec: OpenApiSpec;
}

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

        const jsonContent = responseObject.content?.['application/json'] as MediaTypeObject | undefined;
        
        let exampleValue: any;
        if (jsonContent?.example) {
          exampleValue = jsonContent.example;
        } else if (jsonContent?.examples?.['default']) {
          const defaultExampleOrRef = jsonContent.examples['default'];
          if (isReferenceObject(defaultExampleOrRef)) {
            const resolvedExample = resolveReference<ExampleObject>(defaultExampleOrRef.$ref, openApiSpec);
            exampleValue = resolvedExample?.value;
          } else {
            exampleValue = defaultExampleOrRef.value;
          }
        }
        
        const schema = jsonContent?.schema;
        let resolvedSchema = schema && isReferenceObject(schema) ? resolveReference<SchemaObject>(schema.$ref, openApiSpec) : schema as SchemaObject;
        
        if (resolvedSchema) {
            resolvedSchema = deepResolveRefs(resolvedSchema, openApiSpec);
        }

        return (
          <Card key={statusCode}>
            <CardHeader>
              <CardTitle className="text-lg">
                Status <span className={`font-bold ${parseInt(statusCode) >= 400 ? 'text-red-600' : 'text-green-600'}`}>{statusCode}</span>
              </CardTitle>
              <CardDescription>{responseObject.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {(exampleValue !== undefined || resolvedSchema) && (
                <Tabs defaultValue="example" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="example">Example</TabsTrigger>
                    <TabsTrigger value="schema">Schema</TabsTrigger>
                  </TabsList>
                  <TabsContent value="example">
                    {exampleValue !== undefined ? (
                      <JsonViewer json={exampleValue} title="Example Response Body" />
                    ) : (
                      <p className="text-sm text-muted-foreground">No example provided for this response content.</p>
                    )}
                  </TabsContent>
                  <TabsContent value="schema">
                    {resolvedSchema ? (
                      <div className="mt-4">
                        <SchemaTreeView schema={resolvedSchema} name="Response" isExpanded={true} />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No schema provided for this response content.</p>
                    )}
                  </TabsContent>
                </Tabs>
              )}
              {exampleValue === undefined && !resolvedSchema && <p className="text-sm text-muted-foreground">No example or schema provided for this response content.</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ResponsesTabContent;
