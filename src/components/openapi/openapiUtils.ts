
import { OpenApiSpec, isReferenceObject } from '@/types/openapi/index';

/**
 * Resolves a single $ref string to its actual component in the OpenAPI specification.
 */
export const resolveReference = <T,>(ref: string, spec: OpenApiSpec): T | undefined => {
  if (!ref.startsWith('#/components/')) {
    console.warn(`Unsupported reference format: ${ref}. Only '#/components/...' is supported.`);
    return undefined;
  }
  const parts = ref.split('/').slice(2); // Remove #/components
  let current: any = spec.components;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      console.warn(`Could not resolve reference part: "${part}" in path "${ref}".`);
      return undefined;
    }
  }
  return current as T;
};

/**
 * Recursively traverses an object (like a schema) and resolves all $ref instances.
 * Handles circular references by marking them.
 */
export const deepResolveRefs = (obj: any, spec: OpenApiSpec, visitedRefs: Set<string> = new Set()): any => {
  if (typeof obj !== 'object' || obj === null) {
    return obj; // Primitives or null
  }

  if (isReferenceObject(obj)) {
    const refString = obj.$ref;
    if (visitedRefs.has(refString)) {
      // Return a marker for circular references
      return { $ref: refString, _circularResolved: true, title: `Circular Reference to ${refString}` };
    }
    
    visitedRefs.add(refString); // Mark as visited before resolving

    const resolvedComponent = resolveReference<any>(refString, spec);
    
    if (resolvedComponent === undefined) {
      visitedRefs.delete(refString); // Unmark if resolution failed
      return { $ref: refString, _error: `Could not resolve reference: ${refString}` };
    }

    // Recursively resolve within the newly resolved component
    const result = deepResolveRefs(resolvedComponent, spec, visitedRefs);
    
    visitedRefs.delete(refString); // Unmark after successful resolution and recursion (backtrack)
    return result;
  }

  if (Array.isArray(obj)) {
    // If it's an array, map over its elements and resolve each
    return obj.map(item => deepResolveRefs(item, spec, visitedRefs));
  }

  // For generic objects, iterate over properties
  const newObj: { [key: string]: any } = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = deepResolveRefs(obj[key], spec, visitedRefs);
    }
  }
  return newObj;
};

