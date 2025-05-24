
// A simplified subset of OpenAPI 3.0.x types
// For a full spec, consider using a dedicated library or more comprehensive type definitions.

export interface OpenApiSpec {
  openapi: string;
  info: InfoObject;
  servers?: ServerObject[];
  paths: PathsObject;
  components?: ComponentsObject;
  security?: SecurityRequirementObject[];
  tags?: TagObject[];
}

export interface InfoObject {
  title: string;
  version: string;
  description?: string;
}

export interface ServerObject {
  url: string;
  description?: string;
}

export interface PathsObject {
  [path: string]: PathItemObject;
}

export interface PathItemObject {
  summary?: string;
  description?: string;
  get?: OperationObject;
  put?: OperationObject;
  post?: OperationObject;
  delete?: OperationObject;
  options?: OperationObject;
  head?: OperationObject;
  patch?: OperationObject;
  trace?: OperationObject;
  // parameters?: (ParameterObject | ReferenceObject)[]; // Common parameters for all operations in this path
}

export interface OperationObject {
  tags?: string[];
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: (ParameterObject | ReferenceObject)[];
  requestBody?: RequestBodyObject | ReferenceObject;
  responses: ResponsesObject;
  security?: SecurityRequirementObject[];
  servers?: ServerObject[];
}

export interface ParameterObject {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  allowEmptyValue?: boolean;
  schema?: SchemaObject | ReferenceObject;
  example?: any;
  examples?: { [media: string]: ExampleObject | ReferenceObject };
}

export interface RequestBodyObject {
  description?: string;
  content: { [mediaType: string]: MediaTypeObject };
  required?: boolean;
}

export interface ResponsesObject {
  [statusCode: string]: ResponseObject | ReferenceObject; // Default response can be 'default'
}

export interface ResponseObject {
  description: string;
  headers?: { [headerName: string]: HeaderObject | ReferenceObject };
  content?: { [mediaType: string]: MediaTypeObject };
  links?: { [linkName: string]: LinkObject | ReferenceObject };
}

export interface MediaTypeObject {
  schema?: SchemaObject | ReferenceObject;
  example?: any;
  examples?: { [exampleName: string]: ExampleObject | ReferenceObject };
}

export interface SchemaObject {
  type?: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';
  format?: string;
  properties?: { [propertyName: string]: SchemaObject | ReferenceObject };
  items?: SchemaObject | ReferenceObject;
  required?: string[];
  description?: string;
  example?: any;
  // Many more properties...
}

export interface ComponentsObject {
  schemas?: { [schemaName: string]: SchemaObject | ReferenceObject };
  responses?: { [responseName: string]: ResponseObject | ReferenceObject };
  parameters?: { [parameterName: string]: ParameterObject | ReferenceObject };
  examples?: { [exampleName: string]: ExampleObject | ReferenceObject };
  requestBodies?: { [requestBodyName: string]: RequestBodyObject | ReferenceObject };
  headers?: { [headerName: string]: HeaderObject | ReferenceObject };
  securitySchemes?: { [securitySchemeName: string]: SecuritySchemeObject | ReferenceObject };
  links?: { [linkName: string]: LinkObject | ReferenceObject };
  callbacks?: { [callbackName: string]: CallbackObject | ReferenceObject };
}

export interface ReferenceObject {
  $ref: string;
}

export interface TagObject {
  name: string;
  description?: string;
}

export interface ExampleObject {
  summary?: string;
  description?: string;
  value?: any;
  externalValue?: string;
}

export interface HeaderObject extends Omit<ParameterObject, 'name' | 'in'> {}

export interface SecurityRequirementObject {
  [name: string]: string[];
}

export interface SecuritySchemeObject {
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  description?: string;
  // Specific properties based on type
  name?: string; // For apiKey
  in?: 'query' | 'header' | 'cookie'; // For apiKey
  scheme?: string; // For http
  bearerFormat?: string; // For http bearer
  flows?: OAuthFlowsObject; // For oauth2
  openIdConnectUrl?: string; // For openIdConnect
}

export interface OAuthFlowsObject {
  // Different OAuth2 flows
  implicit?: OAuthFlowObject;
  password?: OAuthFlowObject;
  clientCredentials?: OAuthFlowObject;
  authorizationCode?: OAuthFlowObject;
}

export interface OAuthFlowObject {
  authorizationUrl?: string; // Required for implicit, authorizationCode
  tokenUrl?: string; // Required for password, clientCredentials, authorizationCode
  refreshUrl?: string;
  scopes: { [scopeName: string]: string };
}

export interface LinkObject {
  operationRef?: string;
  operationId?: string;
  parameters?: { [parameterName: string]: any | string };
  requestBody?: any | string;
  description?: string;
  server?: ServerObject;
}

export interface CallbackObject {
  [expression: string]: PathItemObject | ReferenceObject;
}

// Helper type to check if an object is a ReferenceObject
export function isReferenceObject(obj: any): obj is ReferenceObject {
  return obj && typeof obj.$ref === 'string';
}

