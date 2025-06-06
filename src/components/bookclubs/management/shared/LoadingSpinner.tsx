import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Loading spinner component for management panels
 */
const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex justify-center items-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  );
};

export default LoadingSpinner;
