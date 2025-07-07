// frontend/src/components/ui/LoadingSpinner/LoadingSpinner.jsx
import React from 'react';
import { Spin, Typography, Space, Card } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import './LoadingSpinner.css';

const { Text } = Typography;

const LoadingSpinner = ({
  size = 'large',
  message = 'Đang tải...',
  tip,
  spinning = true,
  children,
  overlay = false,
  fullscreen = false,
  delay = 0,
  className = '',
  style = {},
  icon,
  wrapperClassName = ''
}) => {
  // Custom loading icon
  const loadingIcon = icon || <LoadingOutlined style={{ fontSize: size === 'large' ? 24 : 16 }} spin />;

  // Fullscreen loading
  if (fullscreen) {
    return (
      <div className={`fullscreen-loading ${className}`} style={style}>
        <div className="loading-content">
          <Spin 
            indicator={loadingIcon} 
            size={size}
            spinning={spinning}
            delay={delay}
          />
          {message && (
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">{message}</Text>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Overlay loading
  if (overlay) {
    return (
      <div className={`loading-overlay ${wrapperClassName}`}>
        <Spin
          indicator={loadingIcon}
          size={size}
          spinning={spinning}
          tip={tip || message}
          delay={delay}
          className={className}
          style={style}
        >
          {children}
        </Spin>
      </div>
    );
  }

  // Wrapper loading
  if (children) {
    return (
      <Spin
        indicator={loadingIcon}
        size={size}
        spinning={spinning}
        tip={tip || message}
        delay={delay}
        className={className}
        style={style}
        wrapperClassName={wrapperClassName}
      >
        {children}
      </Spin>
    );
  }

  // Simple loading
  return (
    <div className={`loading-spinner ${className}`} style={{ textAlign: 'center', padding: '20px', ...style }}>
      <Space direction="vertical" align="center">
        <Spin 
          indicator={loadingIcon} 
          size={size}
          spinning={spinning}
          delay={delay}
        />
        {message && (
          <Text type="secondary">{message}</Text>
        )}
      </Space>
    </div>
  );
};

// Skeleton loading for different content types
export const SkeletonLoading = ({ 
  type = 'card', 
  rows = 3, 
  count = 1,
  avatar = false,
  title = true,
  paragraph = true,
  className = ''
}) => {
  const { Skeleton } = require('antd');
  
  if (type === 'table') {
    return (
      <div className={className}>
        {Array.from({ length: count }, (_, i) => (
          <Card key={i} style={{ marginBottom: 16 }}>
            <Skeleton 
              loading 
              avatar={avatar}
              title={title}
              paragraph={{ rows }}
              active
            />
          </Card>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className={className}>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            <Skeleton 
              loading 
              avatar={avatar}
              title={title}
              paragraph={{ rows: 1 }}
              active
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={className}>
      {Array.from({ length: count }, (_, i) => (
        <Card key={i} style={{ marginBottom: 16 }}>
          <Skeleton 
            loading 
            avatar={avatar}
            title={title}
            paragraph={{ rows }}
            active
          />
        </Card>
      ))}
    </div>
  );
};

export default LoadingSpinner;

// ---

// frontend/src/components/ui/ErrorBoundary/ErrorBoundary.jsx
import React from 'react';
import { Result, Button, Typography, Card, Space, Alert } from 'antd';
import { 
  ExclamationCircleOutlined, 
  ReloadOutlined, 
  HomeOutlined,
  BugOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import './ErrorBoundary.css';

const { Paragraph, Text } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console and error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
    
    // Report to error tracking service (Sentry, LogRocket, etc.)
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // In production, send to error tracking service
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId
    };
    
    // Example: Send to your error tracking service
    // errorTrackingService.captureException(errorReport);
    
    console.error('Error Report:', errorReport);
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // In production, open bug report form or send to support
    console.log('Bug report:', errorDetails);
    alert('Báo cáo lỗi đã được gửi. Cảm ơn bạn!');
  };

  render() {
    if (this.state.hasError) {
      const { 
        fallback, 
        showErrorDetails = false,
        showRetryButton = true,
        showHomeButton = true,
        title = 'Oops! Có lỗi xảy ra',
        subtitle = 'Ứng dụng gặp sự cố không mong muốn. Chúng tôi đã ghi nhận và sẽ khắc phục sớm nhất.',
        className = ''
      } = this.props;

      // Custom fallback UI
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(this.state.error, this.state.errorInfo, this.handleRetry)
          : fallback;
      }

      // Default error UI
      return (
        <div className={`error-boundary ${className}`}>
          <Result
            status="error"
            icon={<ExclamationCircleOutlined />}
            title={title}
            subTitle={subtitle}
            extra={
              <Space direction="vertical" align="center">
                <Space wrap>
                  {showRetryButton && (
                    <Button 
                      type="primary" 
                      icon={<ReloadOutlined />}
                      onClick={this.handleRetry}
                    >
                      Thử lại
                    </Button>
                  )}
                  
                  {showHomeButton && (
                    <Button 
                      icon={<HomeOutlined />}
                      onClick={this.handleGoHome}
                    >
                      Về trang chủ
                    </Button>
                  )}
                  
                  <Button 
                    icon={<BugOutlined />}
                    onClick={this.handleReportBug}
                  >
                    Báo cáo lỗi
                  </Button>
                </Space>

                {this.state.errorId && (
                  <Alert
                    message={
                      <Space>
                        <InfoCircleOutlined />
                        <Text>Mã lỗi: {this.state.errorId}</Text>
                      </Space>
                    }
                    type="info"
                    size="small"
                    style={{ marginTop: 16 }}
                  />
                )}
              </Space>
            }
          />

          {/* Error Details (Development only) */}
          {showErrorDetails && this.state.error && (
            <Card 
              title="Chi tiết lỗi (Development)" 
              size="small"
              style={{ margin: '20px', textAlign: 'left' }}
              type="inner"
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Error Message:</Text>
                  <Paragraph code copyable>
                    {this.state.error.message}
                  </Paragraph>
                </div>
                
                <div>
                  <Text strong>Stack Trace:</Text>
                  <Paragraph code copyable style={{ whiteSpace: 'pre-wrap' }}>
                    {this.state.error.stack}
                  </Paragraph>
                </div>
                
                {this.state.errorInfo && (
                  <div>
                    <Text strong>Component Stack:</Text>
                    <Paragraph code copyable style={{ whiteSpace: 'pre-wrap' }}>
                      {this.state.errorInfo.componentStack}
                    </Paragraph>
                  </div>
                )}
              </Space>
            </Card>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for error boundaries
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Hook for error handling
export const useErrorHandler = () => {
  const handleError = (error, errorInfo = {}) => {
    // Log error
    console.error('Handled error:', error);
    
    // Report to error tracking service
    const errorReport = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      ...errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Send to error tracking service
    // errorTrackingService.captureException(errorReport);
  };
  
  return { handleError };
};

// Error fallback components
export const NetworkErrorFallback = ({ onRetry }) => (
  <Result
    status="warning"
    title="Lỗi kết nối mạng"
    subTitle="Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet."
    extra={
      <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry}>
        Thử lại
      </Button>
    }
  />
);

export const NotFoundErrorFallback = ({ onGoHome }) => (
  <Result
    status="404"
    title="404"
    subTitle="Trang bạn tìm kiếm không tồn tại."
    extra={
      <Button type="primary" icon={<HomeOutlined />} onClick={onGoHome}>
        Về trang chủ
      </Button>
    }
  />
);

export const PermissionErrorFallback = ({ onGoBack }) => (
  <Result
    status="403"
    title="403"
    subTitle="Bạn không có quyền truy cập trang này."
    extra={
      <Button type="primary" onClick={onGoBack}>
        Quay lại
      </Button>
    }
  />
);

export const MaintenanceErrorFallback = () => (
  <Result
    status="warning"
    title="Hệ thống đang bảo trì"
    subTitle="Chúng tôi đang nâng cấp hệ thống. Vui lòng quay lại sau."
    extra={
      <Button type="primary" onClick={() => window.location.reload()}>
        Làm mới trang
      </Button>
    }
  />
);

export default ErrorBoundary;

// ---

// frontend/src/components/ui/LoadingSpinner/LoadingSpinner.css
.loading-spinner {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100px;
}

.fullscreen-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-content {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.loading-overlay {
  position: relative;
  min-height: 200px;
}

.loading-overlay .ant-spin-container {
  opacity: 0.6;
  pointer-events: none;
}

/* Custom loading animations */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.pulse-loading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes bounce {
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0,0,0);
  }
  40%, 43% {
    transform: translate3d(0, -8px, 0);
  }
  70% {
    transform: translate3d(0, -4px, 0);
  }
  90% {
    transform: translate3d(0, -2px, 0);
  }
}

.bounce-loading {
  animation: bounce 1s ease-in-out infinite;
}

/* ---

// frontend/src/components/ui/ErrorBoundary/ErrorBoundary.css
.error-boundary {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.error-boundary .ant-result {
  padding: 48px 32px;
}

.error-boundary .ant-result-icon {
  margin-bottom: 24px;
}

.error-boundary .ant-result-icon .anticon {
  font-size: 48px;
  color: #ff4d4f;
}

.error-boundary .ant-result-title {
  color: #262626;
  font-size: 24px;
  line-height: 32px;
  margin-bottom: 16px;
}

.error-boundary .ant-result-subtitle {
  color: #8c8c8c;
  font-size: 14px;
  line-height: 22px;
  margin-bottom: 24px;
}

/* Error details styling */
.error-boundary .ant-card {
  max-height: 400px;
  overflow-y: auto;
}

.error-boundary .ant-typography {
  margin-bottom: 8px;
}

.error-boundary .ant-typography code {
  background: #f5f5f5;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 8px 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

/* Responsive design */
@media (max-width: 768px) {
  .error-boundary {
    padding: 16px;
  }
  
  .error-boundary .ant-result {
    padding: 32px 16px;
  }
  
  .error-boundary .ant-result-icon .anticon {
    font-size: 36px;
  }
  
  .error-boundary .ant-result-title {
    font-size: 20px;
  }
  
  .error-boundary .ant-card {
    margin: 16px;
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .fullscreen-loading {
    background: rgba(0, 0, 0, 0.8);
  }
  
  .loading-content {
    background: #1f1f1f;
    color: white;
  }
  
  .error-boundary .ant-typography code {
    background: #1f1f1f;
    border-color: #434343;
    color: #fff;
  }
}