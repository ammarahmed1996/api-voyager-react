import React from 'react';
import { OpenApiSpec, OperationObject, ParameterObject, RequestBodyObject, isReferenceObject, SchemaObject, ReferenceObject } from '@/types/openapi';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import JsonViewer from './JsonViewer';

interface ParametersTabContentProps {
  operation: OperationObject;
  openApiSpec: OpenApiSpec; // Needed to resolve references if any
}

// Basic reference resolver (can be expanded)
const resolveReference = <T,>(ref: string, spec: OpenApiSpec): T | undefined => {
  if (!ref.startsWith('#/components/')) {
    console.warn(`Unsupported reference format: ${ref}`);
    return undefined;
  }
  const parts = ref.split('/').slice(2); // Remove #/components
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


const ParametersTabContent: React.FC<ParametersTabContentProps> = ({ operation, openApiSpec }) => {
  const [parameterValues, setParameterValues] = React.useState<Record<string, string>>({});

  const handleInputChange = (name: string, value: string) => {
    setParameterValues(prev => ({ ...prev, [name]: value }));
  };

  const renderParameter = (param: ParameterObject | RequestBodyObject | ReferenceObject, type: 'parameter' | 'requestBody') => {
    let name: string = '';
    let description: string | undefined;
    let required: boolean | undefined = false;
    let schema: SchemaObject | ReferenceObject | undefined;
    let inType: string | undefined;

    if (isReferenceObject(param)) {
        // Handle ReferenceObject first
        if (type === 'parameter' && param.$ref.startsWith('#/components/parameters/')) {
            const resolvedParam = resolveReference<ParameterObject>(param.$ref, openApiSpec);
            if (resolvedParam) {
                name = resolvedParam.name;
                description = resolvedParam.description;
                required = resolvedParam.required;
                schema = resolvedParam.schema;
                inType = resolvedParam.in;
            } else {
                return <p key={param.$ref}>Could not resolve parameter reference: {param.$ref}</p>;
            }
        } else if (type === 'requestBody' && param.$ref.startsWith('#/components/requestBodies/')) {
            const resolvedBody = resolveReference<RequestBodyObject>(param.$ref, openApiSpec);
             if (resolvedBody) {
                name = 'Request Body'; // Placeholder name
                description = resolvedBody.description;
                required = resolvedBody.required;
                if (resolvedBody.content && resolvedBody.content['application/json'] && resolvedBody.content['application/json'].schema) {
                    schema = resolvedBody.content['application/json'].schema;
                }
                inType = 'body';
            } else {
                return <p key={param.$ref}>Could not resolve request body reference: {param.$ref}</p>;
            }
        } else {
             return <p key={param.$ref}>Unsupported reference type or path for {type}: {param.$ref}</p>;
        }
    } else if (type === 'parameter') { // param is ParameterObject
      const p = param as ParameterObject;
      name = p.name;
      description = p.description;
      required = p.required;
      schema = p.schema;
      inType = p.in;
    } else if (type === 'requestBody') { // param is RequestBodyObject
      const rb = param as RequestBodyObject;
      name = 'Request Body'; // Placeholder name
      description = rb.description;
      required = rb.required;
      // Assuming JSON content type for simplicity
      if (rb.content && rb.content['application/json'] && rb.content['application/json'].schema) {
        schema = rb.content['application/json'].schema;
      }
      inType = 'body';
    }


    const resolvedSchema = schema && isReferenceObject(schema) ? resolveReference<SchemaObject>(schema.$ref, openApiSpec) : schema as SchemaObject;

    return (
      <div key={name + (inType || '') + Math.random()} className="mb-6 p-4 border rounded-md bg-card">
        <div className="flex items-center mb-1">
          <strong className="text-sm font-semibold text-foreground">{name}</strong>
          {inType && <span className="ml-2 text-xs text-muted-foreground">({inType})</span>}
          {required && <span className="ml-2 text-red-500 text-xs">* required</span>}
        </div>
        {description && <p className="text-xs text-muted-foreground mb-2">{description}</p>}
        
        {inType !== 'body' && resolvedSchema && (
          <>
            <Label htmlFor={name} className="text-xs">
              Value {resolvedSchema.type ? `(${resolvedSchema.type}${resolvedSchema.format ? ` - ${resolvedSchema.format}` : ''})` : ''}
            </Label>
            <Input
              id={name}
              type="text"
              placeholder={resolvedSchema.example ? String(resolvedSchema.example) : `Enter ${name}`}
              value={parameterValues[name] || ''}
              onChange={(e) => handleInputChange(name, e.target.value)}
              className="mt-1 text-sm"
            />
            {resolvedSchema.description && <p className="text-xs text-muted-foreground mt-1">{resolvedSchema.description}</p>}
          </>
        )}
        {inType === 'body' && resolvedSchema && (
          <>
            <p className="text-xs text-muted-foreground mb-1">Schema:</p>
            <JsonViewer json={resolvedSchema} />
            <Label htmlFor={`${name}-body-input`} className="text-xs">JSON Body</Label>
            <textarea
              id={`${name}-body-input`}
              value={parameterValues[name] || (resolvedSchema.example ? JSON.stringify(resolvedSchema.example, null, 2) : '')}
              onChange={(e) => handleInputChange(name, e.target.value)}
              rows={5}
              className="mt-1 w-full p-2 border rounded-md text-sm bg-input text-foreground placeholder:text-muted-foreground"
              placeholder="Enter JSON body"
            />
          </>
        )}
        {inType === 'body' && !resolvedSchema && <p className="text-xs text-muted-foreground">No schema defined for request body.</p>}
      </div>
    );
  };

  const parameters = operation.parameters || [];
  const pathParams = parameters.filter(p => (isReferenceObject(p) ? resolveReference<ParameterObject>(p.$ref, openApiSpec)?.in === 'path' : (p as ParameterObject).in === 'path'));
  const queryParams = parameters.filter(p => (isReferenceObject(p) ? resolveReference<ParameterObject>(p.$ref, openApiSpec)?.in === 'query' : (p as ParameterObject).in === 'query'));
  const headerParams = parameters.filter(p => (isReferenceObject(p) ? resolveReference<ParameterObject>(p.$ref, openApiSpec)?.in === 'header' : (p as ParameterObject).in === 'header'));
  const cookieParams = parameters.filter(p => (isReferenceObject(p) ? resolveReference<ParameterObject>(p.$ref, openApiSpec)?.in === 'cookie' : (p as ParameterObject).in === 'cookie'));

  return (
    <div className="space-y-6">
      {pathParams.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Path Parameters</CardTitle></CardHeader>
          <CardContent>{pathParams.map(p => renderParameter(p, 'parameter'))}</CardContent>
        </Card>
      )}
      {queryParams.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Query Parameters</CardTitle></CardHeader>
          <CardContent>{queryParams.map(p => renderParameter(p, 'parameter'))}</CardContent>
        </Card>
      )}
      {headerParams.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Header Parameters</CardTitle></CardHeader>
          <CardContent>{headerParams.map(p => renderParameter(p, 'parameter'))}</CardContent>
        </Card>
      )}
      {cookieParams.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Cookie Parameters</CardTitle></CardHeader>
          <CardContent>{cookieParams.map(p => renderParameter(p, 'parameter'))}</CardContent>
        </Card>
      )}
      {operation.requestBody && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Request Body</CardTitle></CardHeader>
          <CardContent>{renderParameter(operation.requestBody, 'requestBody')}</CardContent>
        </Card>
      )}
      <div className="mt-6">
        {/* Placeholder for Execute button. Actual API call logic will be added later. */}
        {/* <Button disabled>Execute (Coming Soon)</Button> */}
        <p className="text-sm text-muted-foreground italic">API execution functionality will be implemented in a future update.</p>
      </div>
    </div>
  );
};

export default ParametersTabContent;
