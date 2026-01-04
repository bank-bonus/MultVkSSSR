import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          background: '#D92B2B', 
          color: 'white', 
          height: '100vh', 
          overflowY: 'auto',
          fontFamily: 'monospace',
          zIndex: 9999 
        }}>
          <h2>🚨 Произошла ошибка:</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.2)', padding: '10px' }}>
            {this.state.error?.toString()}
          </pre>
          <p>Попробуйте перезапустить приложение.</p>
        </div>
      );
    }

    return this.children;
  }
}

export default ErrorBoundary;
