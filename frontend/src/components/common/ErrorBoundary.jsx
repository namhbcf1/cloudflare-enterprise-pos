// ErrorBoundary.jsx - Error Boundary component import React from 'react';
import { Result, Button, Card, Typography, Alert } from 'antd';
import { 
  BugOutlined, 
  ReloadOutlined, 
  HomeOutlined, 
  WarningOutlined 
} from '@ant-design/icons';

const { Paragraph, Text } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo,
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // In production, you might want to log to an error reporting service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService = (error, errorInfo) => {
    // Example: Send error to monitoring service
    try {
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: error.toString(),
          fatal: false
        });
      }
    } catch (e) {
      console.warn('Failed to log error to service:', e);
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount } = this.state;
      const { 
        title = 'Something went wrong',
        showDetails = process.env.NODE_ENV === 'development',
        showRetry = true,
        maxRetries = 3
      } = this.props;

      const canRetry = showRetry && retryCount < maxRetries;

      return (
        <div style={{ 
          padding: '50px 20px', 
          minHeight: '100vh', 
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Card style={{ maxWidth: 600, width: '100%' }}>
            <Result
              status="error"
              icon={<BugOutlined />}
              title={title}
              subTitle="An unexpected error occurred. Our team has been notified."
              extra={[
                canRetry && (
                  <Button 
                    type="primary" 
                    icon={<ReloadOutlined />}
                    onClick={this.handleRetry}
                    key="retry"
                  >
                    Try Again ({maxRetries - retryCount} attempts left)
                  </Button>
                ),
                <Button 
                  icon={<HomeOutlined />}
                  onClick={this.handleGoHome}
                  key="home"
                >
                  Go to Dashboard
                </Button>,
                <Button 
                  icon={<ReloadOutlined />}
                  onClick={this.handleReload}
                  key="reload"
                >
                  Reload Page
                </Button>
              ].filter(Boolean)}
            />

            {retryCount > 0 && (
              <Alert
                message="Multiple Errors Detected"
                description={`This error has occurred ${retryCount} time(s). Consider reloading the page or contacting support.`}
                type="warning"
                icon={<WarningOutlined />}
                style={{ marginTop: 16 }}
                showIcon
              />
            )}

            {showDetails && error && (
              <Card 
                title="Error Details (Development Mode)"
                style={{ marginTop: 16 }}
                size="small"
              >
                <Paragraph>
                  <Text strong>Error:</Text>
                </Paragraph>
                <Paragraph>
                  <Text code copyable>
                    {error.toString()}
                  </Text>
                </Paragraph>

                {errorInfo && (
                  <>
                    <Paragraph>
                      <Text strong>Component Stack:</Text>
                    </Paragraph>
                    <Paragraph>
                      <Text code style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                        {errorInfo.componentStack}
                      </Text>
                    </Paragraph>
                  </>
                )}

                {error.stack && (
                  <>
                    <Paragraph>
                      <Text strong>Stack Trace:</Text>
                    </Paragraph>
                    <Paragraph>
                      <Text code style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
                        {error.stack}
                      </Text>
                    </Paragraph>
                  </>
                )}
              </Card>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for functional components
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  return function WithErrorBoundaryComponent(props) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Hook for error handling in functional components
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError };
};

// Simple error fallback component
export const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div style={{ 
    padding: '20px', 
    textAlign: 'center',
    border: '1px solid #ff4d4f',
    borderRadius: '6px',
    background: '#fff2f0'
  }}>
    <h3 style={{ color: '#ff4d4f' }}>Something went wrong</h3>
    <p style={{ color: '#666' }}>
      {error?.message || 'An unexpected error occurred'}
    </p>
    <Button onClick={resetErrorBoundary}>
      Try again
    </Button>
  </div>
);

export default ErrorBoundary;