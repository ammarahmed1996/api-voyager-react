import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { OpenApiSpec, OperationObject, PathItemObject } from '@/types/openapi/index';
import MethodBadge from './MethodBadge';
import EndpointTabs from './EndpointTabs';

interface EndpointAccordionProps {
  path: string;
  pathItem: PathItemObject;
  openApiSpec: OpenApiSpec;
}

const EndpointAccordion: React.FC<EndpointAccordionProps> = ({ path, pathItem, openApiSpec }) => {
  const operations = Object.entries(pathItem)
    .filter(([method]) => ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'trace'].includes(method))
    .map(([method, operation]) => ({ method, operation: operation as OperationObject }));

  if (operations.length === 0) {
    return null;
  }

  return (
    <Accordion type="single" collapsible className="w-full mb-4 border rounded-md shadow-sm">
      {operations.map(({ method, operation }) => (
        <AccordionItem value={`${path}-${method}`} key={`${path}-${method}`}>
          <AccordionTrigger className="px-4 py-3 hover:bg-muted/50 transition-colors w-full">
            <div className="flex items-center w-full text-left">
              <MethodBadge method={method} />
              <span className="font-mono text-sm font-medium text-foreground mr-2">{path}</span>
              {operation.summary && <span className="text-sm text-muted-foreground truncate">{operation.summary}</span>}
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-4 border-t bg-background">
            {operation.description && <p className="text-sm text-muted-foreground mb-4">{operation.description}</p>}
            <EndpointTabs operation={operation} openApiSpec={openApiSpec} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
};

export default EndpointAccordion;
