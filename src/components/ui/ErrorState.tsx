import React from "react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message = "Something went wrong.", onRetry }) => (
  <div className="text-center p-6 bg-white/80 border border-bookconnect-terracotta/30 rounded-lg shadow space-y-4">
    <p className="text-bookconnect-terracotta font-serif">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 rounded bg-bookconnect-terracotta text-white font-semibold hover:bg-bookconnect-terracotta/90 transition"
      >
        Retry
      </button>
    )}
  </div>
);

export default ErrorState;