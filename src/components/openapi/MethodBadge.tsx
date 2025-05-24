
import React from 'react';
import { Badge } from '@/components/ui/badge'; // Assuming Badge component is available

interface MethodBadgeProps {
  method: string;
}

const MethodBadge: React.FC<MethodBadgeProps> = ({ method }) => {
  const methodUpper = method.toUpperCase();
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
  let className = 'text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-md ';

  switch (methodUpper) {
    case 'GET':
      className += 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      break;
    case 'POST':
      className += 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      break;
    case 'PUT':
      className += 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      break;
    case 'DELETE':
      className += 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      break;
    case 'PATCH':
      className += 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      break;
    default:
      className += 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      variant = 'secondary';
  }

  return <Badge variant={variant} className={className}>{methodUpper}</Badge>;
};

export default MethodBadge;
