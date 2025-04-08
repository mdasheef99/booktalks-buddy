import React from "react";

interface EmptyStateProps {
  message?: string;
  children?: React.ReactNode; // Optional icon or illustration
}

const EmptyState: React.FC<EmptyStateProps> = ({ message = "No data found.", children }) => (
  <div className="text-center p-6 bg-white/80 border border-bookconnect-brown/20 rounded-lg shadow space-y-4">
    {children && <div className="flex justify-center">{children}</div>}
    <p className="text-bookconnect-brown/70 font-serif">{message}</p>
  </div>
);

export default EmptyState;