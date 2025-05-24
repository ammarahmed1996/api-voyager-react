import React, { useState, useMemo } from 'react';
import { OpenApiSpec, OperationObject, ParameterObject, RequestBodyObject, isReferenceObject, SchemaObject, ReferenceObject, SecuritySchemeObject, SecurityRequirementObject } from '@/types/openapi/index';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import JsonViewer from './JsonViewer';
import { Loader2 } from 'lucide-react';

interface ParametersTabContentProps {
  operation: OperationObject;
  openApiSpec: OpenApiSpec;
  path: string;
  method: string;
}

interface ApiResponse {
  data: any;
  status: number | null;
  headers: Record<string, string> | null;
  error: string | null;
  loading: boolean;
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
      console.warn(`Could not resolve reference part: "${part}" in path "${ref}". Full spec components:`, spec.components);
      return undefined;
    }
  }
  return current as T;
};


const ParametersTabContent: React.FC<ParametersTabContentProps> = ({ operation, openApiSpec, path, method }) => {
  const [parameterValues, setParameterValues] = useState<Record<string, string>>({});
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);

  const handleInputChange = (name: string, value: string) => {
    setParameterValues(prev => ({ ...prev, [name]: value }));
  };

  const allApplicableApiKeySchemes = useMemo(() => {
    const schemes: SecuritySchemeObject[] = [];
    const schemeNames = new Set<string>();

    const processSecurityRequirements = (securityRequirements: SecurityRequirementObject[] | undefined) => {
      if (!securityRequirements || !openApiSpec.components?.securitySchemes) return;

      for (const secRequirement of securityRequirements) {
        for (const schemeKey of Object.keys(secRequirement)) {
          const securitySchemeRef = openApiSpec.components.securitySchemes[schemeKey];
          if (securitySchemeRef) {
            const securityScheme = isReferenceObject(securitySchemeRef)
              ? resolveReference<SecuritySchemeObject>(securitySchemeRef.$ref, openApiSpec)
              : securitySchemeRef;

            if (securityScheme && securityScheme.type === 'apiKey' && securityScheme.in === 'header' && securityScheme.name) {
              if (!schemeNames.has(securityScheme.name)) {
                schemes.push(securityScheme);
                schemeNames.add(securityScheme.name);
              }
            }
          }
        }
      }
    };

    // Process global security requirements
    processSecurityRequirements(openApiSpec.security);
    // Process operation-specific security requirements
    processSecurityRequirements(operation.security);
    
    return schemes;
  }, [openApiSpec, operation.security]);

  const handleExecute = async () => {
    setApiResponse({ data: null, status: null, headers: null, error: null, loading: true });
    console.log("Initiating API execution...");

    const serverUrl = openApiSpec.servers?.[0]?.url?.replace(/\/$/, '');
    if (!serverUrl) {
      const errorMsg = 'No server URL defined in OpenAPI spec.';
      console.error(errorMsg);
      setApiResponse({ data: null, status: null, headers: null, error: errorMsg, loading: false });
      return;
    }
    console.log("Server URL:", serverUrl);

    let processedPath = path;
    operation.parameters?.forEach(paramOrRef => {
      const param = isReferenceObject(paramOrRef) ? resolveReference<ParameterObject>(paramOrRef.$ref, openApiSpec) : paramOrRef;
      if (param && param.in === 'path' && parameterValues[param.name]) {
        processedPath = processedPath.replace(`{${param.name}}`, encodeURIComponent(parameterValues[param.name]));
      }
    });
    console.log("Processed path:", processedPath);

    const queryParams = new URLSearchParams();
    operation.parameters?.forEach(paramOrRef => {
      const param = isReferenceObject(paramOrRef) ? resolveReference<ParameterObject>(paramOrRef.$ref, openApiSpec) : paramOrRef;
      if (param && param.in === 'query' && parameterValues[param.name]) {
        queryParams.append(param.name, parameterValues[param.name]);
      }
    });
    const queryString = queryParams.toString();
    const finalUrl = `${serverUrl}${processedPath}${queryString ? `?${queryString}` : ''}`;
    console.log("Final URL for fetch:", finalUrl);

    const requestHeaders = new Headers();
    if (operation.requestBody) {
        requestHeaders.append('Content-Type', 'application/json'); // Assuming JSON, can be made dynamic
    }
    requestHeaders.append('Accept', 'application/json');

    // Add regular header parameters
    operation.parameters?.forEach(paramOrRef => {
      const param = isReferenceObject(paramOrRef) ? resolveReference<ParameterObject>(paramOrRef.$ref, openApiSpec) : paramOrRef;
      if (param && param.in === 'header' && parameterValues[param.name]) {
        requestHeaders.append(param.name, parameterValues[param.name]);
      }
    });

    // Add API Key headers from all applicable schemes (global and operation-specific)
    allApplicableApiKeySchemes.forEach(securityScheme => {
      if (securityScheme.name && parameterValues[securityScheme.name]) {
        requestHeaders.append(securityScheme.name, parameterValues[securityScheme.name]);
        console.log(`Added API Key Header: ${securityScheme.name}`);
      } else if (securityScheme.name) {
        console.warn(`API Key ${securityScheme.name} specified in security scheme but no value provided.`);
      }
    });
    
    // Note: Cookie parameters are not directly settable in standard browser fetch requests this way.
    // They are managed by the browser. This part is a simplification.
    // operation.parameters?.forEach(paramOrRef => { ... cookie logic ... });

    let requestBodyContent: string | undefined = undefined;
    if (operation.requestBody && (method.toLowerCase() !== 'get' && method.toLowerCase() !== 'head')) {
      const bodyInputKey = 'Request Body'; // Matches the 'name' used in renderParameter for requestBody
      const bodyInput = parameterValues[bodyInputKey];
      if (bodyInput) {
        requestBodyContent = bodyInput;
      }
    }
    console.log("Request Body Content:", requestBodyContent);
    
    const headersForLog: Record<string, string> = {};
    requestHeaders.forEach((value, key) => { headersForLog[key] = value; });
    console.log('Executing API Call with details:');
    console.log('Full URL:', finalUrl);
    console.log('Method:', method.toUpperCase());
    console.log('Headers:', headersForLog);
    console.log('Body:', requestBodyContent || '(No body)');

    try {
      const response = await fetch(finalUrl, {
        method: method.toUpperCase(),
        headers: requestHeaders,
        body: requestBodyContent,
      });

      // Determine if there are any API key headers required by security schemes
      const apiKeySecurityHeaders = [];
      if (operation.security && openApiSpec.components?.securitySchemes) {
        for (const secRequirement of operation.security) {
          for (const schemeKey of Object.keys(secRequirement)) {
            const securitySchemeRef = openApiSpec.components.securitySchemes[schemeKey];
            if (securitySchemeRef) {
                const securityScheme = isReferenceObject(securitySchemeRef)
                    ? resolveReference<SecuritySchemeObject>(securitySchemeRef.$ref, openApiSpec)
                    : securitySchemeRef;

                if (securityScheme && securityScheme.type === 'apiKey' && securityScheme.in === 'header' && securityScheme.name) {
                  // Avoid duplicates if multiple security requirements reference the same scheme
                  if (!apiKeySecurityHeaders.find(h => h.name === securityScheme.name)) {
                    apiKeySecurityHeaders.push(securityScheme);
                  }
                }
            }
          }
        }
      }

      const responseStatus = response.status;
      const responseHeadersObj: Record<string, string> = {};
      response.headers.forEach((value, key) => { responseHeadersObj[key] = value; });
      
      let responseData: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        responseData = await response.json();
      } else {
        responseData = await response.text();
      }

      if (!response.ok) {
        console.error(`API Call HTTP Error: ${responseStatus}`, responseData);
        setApiResponse({ data: responseData, status: responseStatus, headers: responseHeadersObj, error: `HTTP error! Status: ${responseStatus}`, loading: false });
        return;
      }
      console.log("API Call successful, Status:", responseStatus);
      setApiResponse({ data: responseData, status: responseStatus, headers: responseHeadersObj, error: null, loading: false });

    } catch (e: any) {
      console.error("API execution error:", e);
      setApiResponse({ data: null, status: null, headers: null, error: e.message || 'Failed to fetch', loading: false });
    }
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
      name = 'Request Body'; // Placeholder name for state key
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
          <strong className="text-sm font-semibold text-foreground">{name === 'Request Body' ? 'Request Body' : name}</strong>
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
      
      {allApplicableApiKeySchemes.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Authentication Headers</CardTitle></CardHeader>
          <CardContent>
            {allApplicableApiKeySchemes.map(secScheme => (
              secScheme.name && // Ensure name exists before rendering
              <div key={secScheme.name} className="mb-4 p-3 border rounded-md bg-card">
                <Label htmlFor={secScheme.name} className="font-semibold text-sm flex items-center">
                  {secScheme.name}
                  <span className="ml-2 text-xs text-muted-foreground">(API Key in header)</span>
                </Label>
                {secScheme.description && <p className="text-xs text-muted-foreground mt-1 mb-1">{secScheme.description}</p>}
                <Input
                  id={secScheme.name}
                  type="text" // Consider "password" type if appropriate, but API keys are often visible
                  placeholder={`Enter value for ${secScheme.name}`}
                  value={parameterValues[secScheme.name] || ''}
                  onChange={(e) => handleInputChange(secScheme.name, e.target.value)}
                  className="mt-1 text-sm"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {cookieParams.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Cookie Parameters</CardTitle></CardHeader>
          <CardContent>{cookieParams.map(p => renderParameter(p, 'parameter'))}</CardContent>
           <CardDescription className="px-6 pb-4 text-xs text-muted-foreground italic">Note: Cookie parameters are typically managed by the browser and cannot be directly set via manual fetch requests in this manner. This section is for informational purposes.</CardDescription>
        </Card>
      )}
      {operation.requestBody && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Request Body</CardTitle></CardHeader>
          <CardContent>{renderParameter(operation.requestBody, 'requestBody')}</CardContent>
        </Card>
      )}
      <div className="mt-6">
        <Button onClick={handleExecute} disabled={apiResponse?.loading}>
          {apiResponse?.loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Execute
        </Button>
      </div>

      {apiResponse && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">API Response</CardTitle>
            {apiResponse.status && (
              <CardDescription>
                Status: <span className={`font-bold ${apiResponse.status >= 400 ? 'text-red-500' : 'text-green-500'}`}>{apiResponse.status}</span>
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {apiResponse.error && (
              <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
                <p className="font-semibold">Error:</p>
                <pre className="text-sm whitespace-pre-wrap">{apiResponse.error}</pre>
                {typeof apiResponse.data === 'string' && <pre className="text-sm whitespace-pre-wrap mt-2">{apiResponse.data}</pre>}
                {typeof apiResponse.data === 'object' && apiResponse.data !== null && <JsonViewer json={apiResponse.data} />}

              </div>
            )}
            {apiResponse.headers && (
              <div>
                <h4 className="font-semibold text-md">Headers:</h4>
                <JsonViewer json={apiResponse.headers} />
              </div>
            )}
            {!apiResponse.error && apiResponse.data !== null && apiResponse.data !== undefined && (
              <div>
                <h4 className="font-semibold text-md">Body:</h4>
                {typeof apiResponse.data === 'string' ? (
                  <pre className="p-2 bg-muted rounded-md text-sm overflow-auto">{apiResponse.data || '(Empty response body)'}</pre>
                ) : (
                  <JsonViewer json={apiResponse.data} />
                )}
              </div>
            )}
            {apiResponse.loading && <p>Loading...</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ParametersTabContent;
