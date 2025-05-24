import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SchemaObject } from '@/types/openapi';

interface SchemaTreeViewProps {
  schema: any;
  name?: string;
  isRequired?: boolean;
  depth?: number;
  isExpanded?: boolean;
}

const SchemaTreeView: React.FC<SchemaTreeViewProps> = ({ 
  schema, 
  name = '', 
  isRequired = false, 
  depth = 0,
  isExpanded = false
}) => {
  const [expanded, setExpanded] = useState(isExpanded || depth < 1); // Expand first level by default
  
  if (!schema) return null;

  if (schema._circularResolved) {
    return (
      <div className="pl-4 border-l border-gray-200 dark:border-gray-800">
        <div className="flex items-center py-1 px-1">
          {name && (
            <span className="font-medium text-blue-600 dark:text-blue-400 mr-2">
              {name}
            </span>
          )}
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
            ↪ Circular: {schema.title || schema.$ref}
          </Badge>
        </div>
      </div>
    );
  }
  
  // Handle primitive types (string, number, boolean, etc.)
  const isPrimitive = typeof schema.type === 'string' && 
    ['string', 'number', 'integer', 'boolean', 'null'].includes(schema.type);
  
  // Handle array type
  const isArray = schema.type === 'array' && schema.items;
  
  // Handle object type
  const isObject = schema.type === 'object' || schema.properties;
  
  // Handle oneOf, anyOf, allOf
  const isComposition = schema.oneOf || schema.anyOf || schema.allOf;
  
  // Determine if the schema has children that can be expanded
  const hasChildren = isObject || isArray || isComposition;
  
  // Get schema type display
  const getTypeDisplay = () => {
    if (isArray) return 'array';
    if (isObject) return 'object';
    if (schema.oneOf) return 'oneOf';
    if (schema.anyOf) return 'anyOf';
    if (schema.allOf) return 'allOf';
    if (schema.type === 'integer') return 'integer'; // Explicitly show integer
    return schema.type || 'any'; // Default to 'any' if type is missing
  };

  // Format for display
  const typeDisplay = getTypeDisplay();

  return (
    <div className={cn("pl-4 border-l", depth > 0 ? "border-gray-200 dark:border-gray-700" : "border-transparent")}>
      <div 
        className={cn(
          "flex items-start py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md pr-2",
           hasChildren && "cursor-pointer",
           depth > 0 ? "ml-[-17px]" : "" // Adjust for icon alignment with border
        )}
        onClick={(e) => {
          if (hasChildren) {
            e.stopPropagation(); // Prevent event bubbling if nested
            setExpanded(!expanded);
          }
        }}
      >
        {depth > 0 && (
             <div className="w-[16px] flex-shrink-0 self-stretch bg-gray-200 dark:bg-gray-700 mr-2"></div> // Vertical line segment part
        )}
        <div className={cn("flex items-center flex-grow", hasChildren ? "" : "ml-[18px]")}> {/* Indent if no children/icon */}
          {hasChildren && (
            <div className="mr-1 mt-0.5 flex-shrink-0">
              {expanded ? 
                <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              }
            </div>
          )}
          
          <div className="flex-1 min-w-0"> {/* min-w-0 for proper truncation */}
            {name && (
              <span className="font-medium text-sky-600 dark:text-sky-400 break-all">
                {name}
              </span>
            )}
             <span className={cn(
                "ml-2 text-xs font-mono px-1.5 py-0.5 rounded-sm",
                "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
              )}>
                {typeDisplay}
              </span>
            {isRequired && (
              <Badge variant="destructive" className="ml-2 text-xs font-semibold">
                required
              </Badge>
            )}
            
            {schema.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{schema.description}</p>
            )}
            {schema.format && (
              <p className="text-xs text-muted-foreground mt-0.5">Format: {schema.format}</p>
            )}
             {schema.example !== undefined && isPrimitive && (
              <p className="text-xs text-muted-foreground mt-0.5">Example: <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{String(schema.example)}</code></p>
            )}
          </div>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className={cn("mt-1", depth > 0 ? "" : "pl-[calc(1rem+1px)]")}> {/* Extra indent for root children as no line there */}
          {/* Object properties */}
          {isObject && schema.properties && (
            <div>
              {Object.entries(schema.properties).map(([propName, propSchema]: [string, any]) => (
                <SchemaTreeView 
                  key={propName} 
                  schema={propSchema} 
                  name={propName} 
                  isRequired={schema.required?.includes(propName)} 
                  depth={depth + 1}
                  isExpanded={false} // Children start collapsed unless explicitly set
                />
              ))}
            </div>
          )}
          
          {/* Array items */}
          {isArray && schema.items && ( // Added schema.items check
            <div>
              <SchemaTreeView 
                schema={schema.items} 
                name="[] items" 
                depth={depth + 1} 
                isExpanded={false}
              />
            </div>
          )}
          
          {/* Composition types: oneOf, anyOf, allOf */}
          {schema.oneOf && (
            <div className="mt-1">
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-1 ml-1">ONE OF:</p>
              {schema.oneOf.map((item: any, index: number) => (
                <SchemaTreeView 
                  key={index} 
                  schema={item} 
                  name={`Option ${index + 1}`}
                  depth={depth + 1}
                  isExpanded={false}
                />
              ))}
            </div>
          )}
          
          {schema.anyOf && (
             <div className="mt-1">
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-1 ml-1">ANY OF:</p>
              {schema.anyOf.map((item: any, index: number) => (
                <SchemaTreeView 
                  key={index} 
                  schema={item} 
                  name={`Option ${index + 1}`}
                  depth={depth + 1}
                  isExpanded={false}
                />
              ))}
            </div>
          )}
          
          {schema.allOf && (
            <div className="mt-1">
              <p className="text-xs uppercase font-semibold text-muted-foreground mb-1 ml-1">ALL OF:</p>
              {schema.allOf.map((item: any, index: number) => (
                <SchemaTreeView 
                  key={index} 
                  schema={item} 
                  // For allOf, individual items might not have a distinct "name" in this context
                  // but their properties will be merged. We can show it as a group.
                  name={`Constraint ${index + 1}`}
                  depth={depth + 1}
                  isExpanded={true} // Usually allOf parts are all relevant
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchemaTreeView;
