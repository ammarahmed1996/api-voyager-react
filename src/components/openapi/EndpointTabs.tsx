
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OpenApiSpec, OperationObject } from '@/types/openapi/index';
import ParametersTabContent from './ParametersTabContent';
import ResponsesTabContent from './ResponsesTabContent';
import SchemaTabContent from './SchemaTabContent';

interface EndpointTabsProps {
  operation: OperationObject;
  openApiSpec: OpenApiSpec;
  path: string;
  method: string;
}

const EndpointTabs: React.FC<EndpointTabsProps> = ({ operation, openApiSpec, path, method }) => {
  return (
    <Tabs defaultValue="parameters" className="w-full mt-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="parameters">Parameters</TabsTrigger>
        <TabsTrigger value="responses">Responses</TabsTrigger>
        <TabsTrigger value="schema">Schema</TabsTrigger>
      </TabsList>
      <TabsContent value="parameters" className="pt-4">
        <ParametersTabContent operation={operation} openApiSpec={openApiSpec} path={path} method={method} />
      </TabsContent>
      <TabsContent value="responses" className="pt-4">
        <ResponsesTabContent operation={operation} openApiSpec={openApiSpec} />
      </TabsContent>
      <TabsContent value="schema" className="pt-4">
        <SchemaTabContent operation={operation} openApiSpec={openApiSpec} />
      </TabsContent>
    </Tabs>
  );
};

export default EndpointTabs;
