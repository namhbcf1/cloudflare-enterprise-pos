import React from 'react';
import { Result, Button, Typography, Card, Space, Alert, Collapse, Tag } from 'antd';
import { 
  ExclamationCircleOutlined, ReloadOutlined, HomeOutlined, BugOutlined,
  InfoCircleOutlined, WarningOutlined, CloseCircleOutlined, 
  WifiOutlined, LockOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import './ErrorBoundary.css';

const { Paragraph, Text, Title } = Typography;
const { Panel } = Collapse;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      errorType: 'unknown'
    };
  }

  static getDerivedStateFromError(error) {
    const errorType = ErrorBoundary.categorizeError(error);
    return { 
      hasError: true,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      errorType
    };
  }

  static categorizeError(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('chunk') || message.includes('loading')) {
      return 'loading';
    }
    if (message.includes('memory') || message.includes('heap')) {
      return 'memory';
    }
    
    return 'application';
  }

  componentDidCatch(error, errorInfo) {
    console.error('🚨 ErrorBoundary caught error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });
    
    // Enhanced error reporting
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    const errorReport = {
      errorId: this.state.errorId,
      type: this.state.errorType,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      props: this.props,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: this.props.user?.id,
      sessionId: sessionStorage.getItem('session_id'),
      buildVersion: process.env.REACT_APP_VERSION || '2.0.0',
      environment: process.env.NODE_ENV
    };
    
    // Send to error tracking service
    this.sendErrorReport(errorReport);
  };

  sendErrorReport = async (errorReport) => {
    try {
      // In production, send to error tracking service (Sentry, Bugsnag, etc.)
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorReport)
      });
      
      console.log('✅ Error report sent:', errorReport.errorId);
    } catch (reportError) {
      console.error('❌ Failed to send error report:', reportError);
      // Store in localStorage as fallback
      this.storeErrorLocally(errorReport);
    }
  };

  storeErrorLocally = (errorReport) => {
    try {
      const existingErrors = JSON.parse(localStorage.getItem('pos_error_reports') || '[]');
      existingErrors.push(errorReport);
      
      // Keep only last 10 errors
      if (existingErrors.length > 10) {
        existingErrors.splice(0, existingErrors.length - 10);
      }
      
      localStorage.setItem('pos_error_reports', JSON.stringify(existingErrors));
    } catch (e) {
      console.error('Failed to store error locally:', e);
    }
  };

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      errorType: 'unknown'
    });
    
    // Force component remount if needed
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportBug = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      type: this.state.errorType,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
    
    // Create bug report
    const bugReport = encodeURIComponent(JSON.stringify(errorDetails, null, 2));
    const subject = encodeURIComponent(`[Enterprise POS] Bug Report - ${this.state.errorType}`);
    const body = encodeURIComponent(`
Chi tiết lỗi:
${JSON.stringify(errorDetails, null, 2)}

Mô tả thêm:
[Hãy mô tả những gì bạn đang làm khi gặp lỗi]

Các bước tái hiện:
1. 
2. 
3. 
    `);
    
    // Open email client or show modal
    window.open(`mailto:support@enterprisepos.com?subject=${subject}&body=${body}`);
  };

  getErrorIcon = () => {
    switch (this.state.errorType) {
      case 'network':
        return <WifiOutlined style={{ fontSize: 48, color: '#fa8c16' }} />;
      case 'permission':
        return <LockOutlined style={{ fontSize: 48, color: '#f5222d' }} />;
      case 'timeout':
        return <ClockCircleOutlined style={{ fontSize: 48, color: '#722ed1' }} />;
      case 'loading':
        return <WarningOutlined style={{ fontSize: 48, color: '#faad14' }} />;
      default:
        return <ExclamationCircleOutlined style={{ fontSize: 48, color: '#ff4d4f' }} />;
    }
  };

  getErrorTitle = () => {
    switch (this.state.errorType) {
      case 'network':
        return 'Lỗi kết nối mạng';
      case 'permission':
        return 'Lỗi phân quyền';
      case 'timeout':
        return 'Hết thời gian chờ';
      case 'loading':
        return 'Lỗi tải tài nguyên';
      case 'memory':
        return 'Lỗi bộ nhớ';
      default:
        return 'Lỗi ứng dụng';
    }
  };

  getErrorDescription = () => {
    switch (this.state.errorType) {
      case 'network':
        return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra internet và thử lại.';
      case 'permission':
        return 'Bạn không có quyền truy cập tính năng này. Vui lòng liên hệ quản trị viên.';
      case 'timeout':
        return 'Yêu cầu mất quá nhiều thời gian. Vui lòng thử lại.';
      case 'loading':
        return 'Không thể tải một số tài nguyên. Vui lòng làm mới trang.';
      case 'memory':
        return 'Ứng dụng sử dụng quá nhiều bộ nhớ. Vui lòng đóng một số tab và thử lại.';
      default:
        return 'Ứng dụng gặp sự cố không mong muốn. Chúng tôi đã ghi nhận và sẽ khắc phục sớm nhất.';
    }
  };

  getSuggestions = () => {
    switch (this.state.errorType) {
      case 'network':
        return [
          'Kiểm tra kết nối internet',
          'Thử tải lại trang',
          'Kiểm tra tường lửa/proxy',
          'Liên hệ IT nếu vấn đề tiếp tục'
        ];
      case 'permission':
        return [
          'Đăng nhập lại với tài khoản phù hợp',
          'Liên hệ quản trị viên để cấp quyền',
          'Kiểm tra vai trò của bạn trong hệ thống'
        ];
      case 'timeout':
        return [
          'Thử lại sau ít phút',
          'Kiểm tra tốc độ internet',
          'Đóng các ứng dụng khác đang chạy'
        ];
      default:
        return [
          'Làm mới trang',
          'Đóng và mở lại trình duyệt',
          'Xóa cache và cookies',
          'Báo cáo lỗi nếu vấn đề tiếp tục'
        ];
    }
  };

  render() {
    if (this.state.hasError) {
      const { 
        fallback, 
        showErrorDetails = process.env.NODE_ENV === 'development',
        showRetryButton = true,
        showHomeButton = true,
        className = '',
        minimal = false
      } = this.props;

      // Custom fallback UI
      if (fallback) {
        return typeof fallback === 'function' 
          ? fallback(this.state.error, this.state.errorInfo, this.handleRetry)
          : fallback;
      }

      // Minimal error UI
      if (minimal) {
        return (
          <div className={`error-boundary-minimal ${className}`}>
            <Alert
              message={this.getErrorTitle()}
              description={this.getErrorDescription()}
              type="error"
              showIcon
              action={
                <Space>
                  {showRetryButton && (
                    <Button size="small" danger onClick={this.handleRetry}>
                      Thử lại
                    </Button>
                  )}
                </Space>
              }
            />
          </div>
        );
      }

      // Full error UI
      return (
        <div className={`error-boundary ${className}`}>
          <Result
            icon={this.getErrorIcon()}
            title={this.getErrorTitle()}
            subTitle={this.getErrorDescription()}
            extra={
              <Space direction="vertical" align="center" size="large">
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

                {/* Error metadata */}
                <Space align="center">
                  <Tag color="red">
                    <InfoCircleOutlined /> Mã lỗi: {this.state.errorId}
                  </Tag>
                  <Tag color="blue">
                    Loại: {this.state.errorType}
                  </Tag>
                  <Tag color="default">
                    {new Date().toLocaleString('vi-VN')}
                  </Tag>
                </Space>

                {/* Suggestions */}
                <Card 
                  title="💡 Gợi ý khắc phục" 
                  size="small"
                  style={{ maxWidth: 400, textAlign: 'left' }}
                >
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    {this.getSuggestions().map((suggestion, index) => (
                      <li key={index} style={{ marginBottom: 4 }}>
                        <Text>{suggestion}</Text>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Space>
            }
          />

          {/* Error Details (Development/Debug) */}
          {showErrorDetails && this.state.error && (
            <Card 
              title="🔧 Chi tiết lỗi (Debug)" 
              size="small"
              style={{ margin: '20px', textAlign: 'left' }}
              type="inner"
            >
              <Collapse ghost>
                <Panel header="Error Message" key="message">
                  <Paragraph code copyable style={{ background: '#f5f5f5', padding: 8 }}>
                    {this.state.error.message}
                  </Paragraph>
                </Panel>
                
                <Panel header="Stack Trace" key="stack">
                  <Paragraph 
                    code 
                    copyable 
                    style={{ 
                      whiteSpace: 'pre-wrap', 
                      background: '#f5f5f5', 
                      padding: 8,
                      maxHeight: 200,
                      overflow: 'auto'
                    }}
                  >
                    {this.state.error.stack}
                  </Paragraph>
                </Panel>
                
                {this.state.errorInfo && (
                  <Panel header="Component Stack" key="component">
                    <Paragraph 
                      code 
                      copyable 
                      style={{ 
                        whiteSpace: 'pre-wrap', 
                        background: '#f5f5f5', 
                        padding: 8,
                        maxHeight: 200,
                        overflow: 'auto'
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </Paragraph>
                  </Panel>
                )}
              </Collapse>
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
  const [error, setError] = React.useState(null);
  
  const handleError = React.useCallback((error, errorInfo = {}) => {
    console.error('🚨 Handled error:', error);
    
    const errorReport = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      ...errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      handled: true
    };
    
    // Store error state
    setError(errorReport);
    
    // Send to error tracking service
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorReport)
    }).catch(console.error);
    
    // Auto-clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  }, []);
  
  const clearError = React.useCallback(() => {
    setError(null);
  }, []);
  
  return { error, handleError, clearError };
};

// Specialized error fallback components
export const NetworkErrorFallback = ({ onRetry, className = '' }) => (
  <Result
    status="warning"
    icon={<WifiOutlined style={{ color: '#fa8c16' }} />}
    title="Lỗi kết nối mạng"
    subTitle="Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối internet."
    extra={[
      <Button type="primary" icon={<ReloadOutlined />} onClick={onRetry} key="retry">
        Thử lại
      </Button>,
      <Button key="offline" onClick={() => window.location.href = '/offline'}>
        Chế độ offline
      </Button>
    ]}
    className={className}
  />
);

export const NotFoundErrorFallback = ({ onGoHome, className = '' }) => (
  <Result
    status="404"
    title="404"
    subTitle="Trang bạn tìm kiếm không tồn tại."
    extra={
      <Button type="primary" icon={<HomeOutlined />} onClick={onGoHome}>
        Về trang chủ
      </Button>
    }
    className={className}
  />
);

export const PermissionErrorFallback = ({ onGoBack, className = '' }) => (
  <Result
    status="403"
    icon={<LockOutlined style={{ color: '#f5222d' }} />}
    title="403"
    subTitle="Bạn không có quyền truy cập trang này."
    extra={[
      <Button type="primary" onClick={onGoBack} key="back">
        Quay lại
      </Button>,
      <Button key="contact" onClick={() => window.location.href = 'mailto:admin@enterprisepos.com'}>
        Liên hệ quản trị
      </Button>
    ]}
    className={className}
  />
);

export const MaintenanceErrorFallback = ({ className = '' }) => (
  <Result
    status="warning"
    icon={<ClockCircleOutlined style={{ color: '#722ed1' }} />}
    title="Hệ thống đang bảo trì"
    subTitle="Chúng tôi đang nâng cấp hệ thống để mang đến trải nghiệm tốt hơn. Vui lòng quay lại sau."
    extra={
      <Button type="primary" onClick={() => window.location.reload()}>
        Kiểm tra lại
      </Button>
    }
    className={className}
  />
);

export default ErrorBoundary;