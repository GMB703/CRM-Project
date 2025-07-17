import React from "react";

export const ErrorFallback = ({ error }) => (
  <div className="error-fallback">
    <h2>Something went wrong</h2>
    <pre>{error?.message}</pre>
  </div>
);
