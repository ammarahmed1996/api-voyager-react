import React, { useState, useCallback } from 'react';
import * as yaml from 'js-yaml';
import { OpenApiSpec } from '@/types/openapi/index';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FileText, Info, X } from 'lucide-react';
import EndpointAccordion from './EndpointAccordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";

const OpenApiDocsViewer: React.FC = () => {
  const [openApiSpec, setOpenApiSpec] = useState<OpenApiSpec | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setError(null);
      setOpenApiSpec(null);
      try {
        const fileContent = await file.text();
        const spec = yaml.load(fileContent) as OpenApiSpec;
        if (!spec.openapi || !spec.openapi.startsWith('3.')) {
          setError('Invalid OpenAPI 3.x.x specification. Please upload a valid YAML file.');
          return;
        }
        setOpenApiSpec(spec);
      } catch (e: any) {
        console.error("Error parsing YAML:", e);
        setError(`Error parsing YAML file: ${e.message}. Please ensure it's a valid OpenAPI 3.x.x YAML.`);
      }
    }
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <Card className="mb-8 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center">
            <FileText className="mr-2 h-6 w-6 text-primary" />
            OpenAPI Viewer
          </CardTitle>
          <CardDescription>
            Upload an OpenAPI 3.x.x YAML file to view its documentation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Label htmlFor="openapi-file" className="sr-only">Upload OpenAPI YAML</Label>
            <Input
              id="openapi-file"
              type="file"
              accept=".yaml,.yml"
              onChange={handleFileChange}
              className="flex-grow file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </div>
          {fileName && !error && <p className="text-sm text-muted-foreground mt-2">Loaded: {fileName}</p>}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <X className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {openApiSpec && (
        <div>
          <Card className="mb-6 bg-secondary/50">
            <CardHeader>
              <CardTitle className="text-xl">{openApiSpec.info.title}</CardTitle>
              <CardDescription>Version: {openApiSpec.info.version}</CardDescription>
            </CardHeader>
            {openApiSpec.info.description && (
              <CardContent>
                <p className="text-sm text-secondary-foreground">{openApiSpec.info.description}</p>
              </CardContent>
            )}
          </Card>
          
          {openApiSpec.servers && openApiSpec.servers.length > 0 && (
            <Card className="mb-6">
              <CardHeader><CardTitle className="text-lg">Servers</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {openApiSpec.servers.map((server, index) => (
                    <li key={index} className="text-sm">
                      <code className="bg-muted px-1 py-0.5 rounded text-foreground">{server.url}</code>
                      {server.description && <span className="text-muted-foreground"> - {server.description}</span>}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <h2 className="text-2xl font-semibold mb-4 text-foreground border-b pb-2">Endpoints</h2>
          {Object.entries(openApiSpec.paths).map(([path, pathItem]) => (
            <EndpointAccordion key={path} path={path} pathItem={pathItem} openApiSpec={openApiSpec} />
          ))}
        </div>
      )}
      {!openApiSpec && !error && !fileName && (
         <Alert className="mt-8">
            <Info className="h-4 w-4" />
            <AlertTitle>Ready to go!</AlertTitle>
            <AlertDescription>
              Please upload an OpenAPI (v3.x.x) YAML file using the input above to see the interactive documentation.
            </AlertDescription>
          </Alert>
      )}
    </div>
  );
};

export default OpenApiDocsViewer;
