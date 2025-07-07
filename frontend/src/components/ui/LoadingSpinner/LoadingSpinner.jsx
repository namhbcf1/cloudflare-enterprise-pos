// frontend/src/components/ui/LoadingSpinner/LoadingSpinner.jsx
import React from 'react';
import { Spin, Typography, Space, Card, Progress, Skeleton } from 'antd';
import { 
  LoadingOutlined, ThunderboltOutlined, RobotOutlined,
  SyncOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import './LoadingSpinner.css';

const { Text, Title } = Typography;

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
  wrapperClassName = '',
  type = 'default', // default, pulse, bounce, dots, bars, sync
  progress = null, // 0-100 for progress bar
  theme = 'light' // light, dark, colorful
}) => {
  // Custom loading icons based on type
  const getLoadingIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'pulse':
        return <div className="pulse-loader"><div></div><div></div><div></div></div>;
      case 'bounce':
        return <div className="bounce-loader"><div></div><div></div><div></div></div>;
      case 'dots':
        return <div className="dots-loader"><div></div><div></div><div></div></div>;
      case 'bars':
        return <div className="bars-loader"><div></div><div></div><div></div><div></div></div>;
      case 'sync':
        return <SyncOutlined spin style={{ fontSize: size === 'large' ? 24 : 16 }} />;
      case 'ai':
        return <RobotOutlined spin style={{ fontSize: size === 'large' ? 24 : 16 }} />;
      case 'realtime':
        return <ThunderboltOutlined spin style={{ fontSize: size === 'large' ? 24 : 16 }} />;
      default:
        return <LoadingOutlined style={{ fontSize: size === 'large' ? 24 : 16 }} spin />;
    }
  };

  const loadingIcon = getLoadingIcon();

  // Fullscreen loading with enhanced UI
  if (fullscreen) {
    return (
      <div className={`fullscreen-loading ${theme} ${className}`} style={style}>
        <div className="loading-content">
          <div className="loading-icon-wrapper">
            {type === 'default' ? (
              <Spin 
                indicator={loadingIcon} 
                size={size}
                spinning={spinning}
                delay={delay}
              />
            ) : (
              loadingIcon
            )}
          </div>
          
          {message && (
            <div className="loading-message">
              <Title level={4} style={{ color: theme === 'dark' ? '#fff' : '#595959' }}>
                {message}
              </Title>
            </div>
          )}
          
          {progress !== null && (
            <div className="loading-progress">
              <Progress 
                percent={progress} 
                strokeColor={theme === 'colorful' ? {
                  '0%': '#108ee9',
                  '100%': '#87d068',
                } : undefined}
                trailColor={theme === 'dark' ? '#434343' : '#f0f0f0'}
              />
              <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                {progress}% hoàn thành
              </Text>
            </div>
          )}
          
          {tip && (
            <div className="loading-tip">
              <Text type="secondary">{tip}</Text>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Overlay loading
  if (overlay) {
    return (
      <div className={`loading-overlay ${theme} ${wrapperClassName}`}>
        <Spin
          indicator={type === 'default' ? loadingIcon : undefined}
          size={size}
          spinning={spinning}
          tip={tip || message}
          delay={delay}
          className={className}
          style={style}
        >
          <div className={spinning ? 'loading-overlay-content' : ''}>
            {children}
            {type !== 'default' && spinning && (
              <div className="custom-loading-overlay">
                {loadingIcon}
                {message && <div className="overlay-message">{message}</div>}
              </div>
            )}
          </div>
        </Spin>
      </div>
    );
  }

  // Wrapper loading
  if (children) {
    return (
      <Spin
        indicator={type === 'default' ? loadingIcon : undefined}
        size={size}
        spinning={spinning}
        tip={tip || message}
        delay={delay}
        className={className}
        style={style}
        wrapperClassName={wrapperClassName}
      >
        {children}
        {type !== 'default' && spinning && (
          <div className="custom-loading-wrapper">
            {loadingIcon}
          </div>
        )}
      </Spin>
    );
  }

  // Simple loading
  return (
    <div className={`loading-spinner ${theme} ${className}`} style={{ textAlign: 'center', padding: '20px', ...style }}>
      <Space direction="vertical" align="center" size="large">
        <div className="loading-icon-container">
          {type === 'default' ? (
            <Spin 
              indicator={loadingIcon} 
              size={size}
              spinning={spinning}
              delay={delay}
            />
          ) : (
            loadingIcon
          )}
        </div>
        
        {message && (
          <Text type="secondary" style={{ fontSize: size === 'large' ? 16 : 14 }}>
            {message}
          </Text>
        )}
        
        {progress !== null && (
          <div style={{ width: 200 }}>
            <Progress 
              percent={progress} 
              size="small"
              strokeColor={theme === 'colorful' ? {
                '0%': '#108ee9',
                '100%': '#87d068',
              } : undefined}
            />
          </div>
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
  className = '',
  active = true,
  loading = true
}) => {
  if (!loading) return null;
  
  const renderSkeleton = (index) => {
    switch (type) {
      case 'table':
        return (
          <Card key={index} style={{ marginBottom: 16 }} bodyStyle={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              {avatar && <Skeleton.Avatar size="default" style={{ marginRight: 16 }} />}
              <div style={{ flex: 1 }}>
                {title && <Skeleton.Input style={{ width: 200, height: 20 }} active={active} />}
              </div>
            </div>
            <Skeleton paragraph={{ rows, width: ['100%', '90%', '70%'] }} active={active} />
          </Card>
        );
        
      case 'list':
        return (
          <div key={index} style={{ 
            padding: '16px 0', 
            borderBottom: index < count - 1 ? '1px solid #f0f0f0' : 'none',
            display: 'flex',
            alignItems: 'center'
          }}>
            {avatar && <Skeleton.Avatar style={{ marginRight: 16 }} />}
            <div style={{ flex: 1 }}>
              {title && <Skeleton.Input style={{ width: 150, marginBottom: 8 }} active={active} />}
              <Skeleton paragraph={{ rows: 1, width: '80%' }} active={active} />
            </div>
          </div>
        );
        
      case 'product':
        return (
          <Card key={index} style={{ marginBottom: 16 }}>
            <Skeleton.Image style={{ width: '100%', height: 200 }} />
            <div style={{ padding: 16 }}>
              <Skeleton.Input style={{ width: '70%', marginBottom: 8 }} active={active} />
              <Skeleton.Input style={{ width: '40%', marginBottom: 16 }} active={active} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Skeleton.Button style={{ width: 80 }} active={active} />
                <Skeleton.Button style={{ width: 100 }} active={active} />
              </div>
            </div>
          </Card>
        );
        
      case 'stats':
        return (
          <Card key={index} style={{ marginBottom: 16, textAlign: 'center' }}>
            <Skeleton.Avatar size={64} style={{ marginBottom: 16 }} />
            <Skeleton.Input style={{ width: 120, marginBottom: 8 }} active={active} />
            <Skeleton.Input style={{ width: 80 }} active={active} />
          </Card>
        );
        
      default: // card
        return (
          <Card key={index} style={{ marginBottom: 16 }}>
            <Skeleton 
              loading 
              avatar={avatar}
              title={title}
              paragraph={{ rows }}
              active={active}
            />
          </Card>
        );
    }
  };

  return (
    <div className={`skeleton-loading ${className}`}>
      {Array.from({ length: count }, (_, i) => renderSkeleton(i))}
    </div>
  );
};

// Specialized loading components
export const TableLoading = ({ columns = 4, rows = 5 }) => (
  <div className="table-loading">
    {Array.from({ length: rows }, (_, i) => (
      <div key={i} className="table-row-skeleton">
        {Array.from({ length: columns }, (_, j) => (
          <div key={j} className="table-cell-skeleton">
            <Skeleton.Input active />
          </div>
        ))}
      </div>
    ))}
  </div>
);

export const POSLoading = () => (
  <div className="pos-loading">
    <div className="pos-loading-header">
      <Skeleton.Input style={{ width: 200 }} />
      <Skeleton.Button />
    </div>
    <div className="pos-loading-content">
      <div className="pos-loading-products">
        {Array.from({ length: 8 }, (_, i) => (
          <Card key={i} className="pos-product-skeleton">
            <Skeleton.Image style={{ width: 80, height: 80 }} />
            <Skeleton.Input style={{ width: '100%', marginTop: 8 }} />
          </Card>
        ))}
      </div>
      <div className="pos-loading-cart">
        <SkeletonLoading type="list" count={3} />
      </div>
    </div>
  </div>
);

export const DashboardLoading = () => (
  <div className="dashboard-loading">
    <div className="dashboard-loading-stats">
      {Array.from({ length: 4 }, (_, i) => (
        <SkeletonLoading key={i} type="stats" count={1} />
      ))}
    </div>
    <div className="dashboard-loading-charts">
      <Card style={{ marginBottom: 16 }}>
        <Skeleton.Input style={{ width: 150, marginBottom: 16 }} />
        <div style={{ height: 300, background: '#f5f5f5', borderRadius: 6 }} />
      </Card>
    </div>
  </div>
);

// Smart loading with context
export const SmartLoading = ({ 
  context = 'general', 
  duration = null,
  onTimeout = null,
  ...props 
}) => {
  const [timeElapsed, setTimeElapsed] = React.useState(0);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setTimeElapsed(prev => {
        const newTime = prev + 1;
        if (duration && newTime >= duration && onTimeout) {
          onTimeout();
        }
        return newTime;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [duration, onTimeout]);
  
  const getContextualMessage = () => {
    switch (context) {
      case 'pos':
        return timeElapsed > 5 ? 'Đang đồng bộ dữ liệu POS...' : 'Đang tải POS Terminal...';
      case 'analytics':
        return timeElapsed > 3 ? 'Đang xử lý dữ liệu phân tích...' : 'Đang tải dashboard...';
      case 'ai':
        return timeElapsed > 8 ? 'AI đang xử lý dữ liệu phức tạp...' : 'AI đang phân tích...';
      case 'sync':
        return timeElapsed > 10 ? 'Đồng bộ mất nhiều thời gian hơn dự kiến...' : 'Đang đồng bộ dữ liệu...';
      default:
        return timeElapsed > 5 ? 'Vui lòng đợi thêm chút...' : 'Đang tải...';
    }
  };
  
  return (
    <LoadingSpinner
      {...props}
      message={getContextualMessage()}
      type={context === 'ai' ? 'ai' : context === 'sync' ? 'sync' : 'default'}
      tip={duration && `${timeElapsed}/${duration}s`}
    />
  );
};

export default LoadingSpinner;