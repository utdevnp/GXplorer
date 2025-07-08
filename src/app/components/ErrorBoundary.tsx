import React from 'react';

const ErrorBoundary: React.FC<{ children: React.ReactNode; logToConsole?: (...args: any[]) => void }> = ({ children }) => <>{children}</>;

export default ErrorBoundary; 