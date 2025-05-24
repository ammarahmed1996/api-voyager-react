
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
  const [expanded, setExpanded] = useState(isExpanded || depth < 2);
  
  if (!schema) return null;
  
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
    return schema.type || 'unknown';
  };

  // Format for display
  const typeDisplay = getTypeDisplay();

  return (
    <div className="pl-4 border-l border-gray-200 dark:border-gray-800">
      <div 
        className={cn(
          "flex items-center py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded px-1", 
          hasChildren ? "cursor-pointer" : ""
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren && (
          <div className="mr-1">
            {expanded ? 
              <ChevronDown className="h-4 w-4 text-muted-foreground" /> : 
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            }
          </div>
        )}
        
        <div className="flex-1">
          {name && (
            <span className="font-medium text-blue-600 dark:text-blue-400">
              {name}
              {isRequired && (
                <Badge variant="outline" className="ml-2 text-xs font-normal bg-red-50 text-red-600 border-red-200">
                  required
                </Badge>
              )}
            </span>
          )}
          
          <span className="ml-2 text-sm text-gray-500">
            <span className="font-mono">{typeDisplay}</span>
          </span>
          
          {schema.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{schema.description}</p>
          )}
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="ml-2">
          {/* Object properties */}
          {isObject && schema.properties && (
            <div className="mt-1">
              {Object.entries(schema.properties).map(([propName, propSchema]: [string, any]) => (
                <SchemaTreeView 
                  key={propName} 
                  schema={propSchema} 
                  name={propName} 
                  isRequired={schema.required?.includes(propName)} 
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
          
          {/* Array items */}
          {isArray && (
            <div className="mt-1">
              <SchemaTreeView 
                schema={schema.items} 
                name="[]" 
                depth={depth + 1} 
              />
            </div>
          )}
          
          {/* Composition types: oneOf, anyOf, allOf */}
          {schema.oneOf && (
            <div className="mt-1">
              {schema.oneOf.map((item: any, index: number) => (
                <SchemaTreeView 
                  key={index} 
                  schema={item} 
                  name={`oneOf[${index}]`} 
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
          
          {schema.anyOf && (
            <div className="mt-1">
              {schema.anyOf.map((item: any, index: number) => (
                <SchemaTreeView 
                  key={index} 
                  schema={item} 
                  name={`anyOf[${index}]`} 
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
          
          {schema.allOf && (
            <div className="mt-1">
              {schema.allOf.map((item: any, index: number) => (
                <SchemaTreeView 
                  key={index} 
                  schema={item} 
                  name={`allOf[${index}]`} 
                  depth={depth + 1}
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
