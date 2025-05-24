
import React from 'react';
import { OpenApiSpec, OperationObject, ResponseObject, isReferenceObject, MediaTypeObject, SchemaObject, ExampleObject } from '@/types/openapi/index';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import JsonViewer from './JsonViewer';
import { resolveReference, deepResolveRefs } from './openapiUtils';

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
          // This paragraph will use the global foreground color
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
          <Card key={statusCode} className="bg-[hsl(0_0%_14%)] border-[hsl(0_0%_20%)]">
            <CardHeader>
              <CardTitle className="text-lg text-[hsl(0_0%_83%)]">
                Status <span className={`font-bold ${parseInt(statusCode) >= 400 ? 'text-red-500' : 'text-green-500'}`}>{statusCode}</span> {/* Adjusted red/green for better contrast if needed, but 500 is usually fine */}
              </CardTitle>
              <CardDescription className="text-[hsl(0_0%_60%)]">{responseObject.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {exampleValue !== undefined && <JsonViewer json={exampleValue} title="Example Response Body" />}
              {resolvedSchema && exampleValue === undefined && <JsonViewer json={resolvedSchema} title="Response Schema" />}
              {exampleValue === undefined && !resolvedSchema && <p className="text-sm text-[hsl(0_0%_60%)]">No example or schema provided for this response content.</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ResponsesTabContent;
