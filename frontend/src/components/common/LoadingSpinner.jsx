// LoadingSpinner.jsx - Loading Spinner component import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const LoadingSpinner = ({ 
  size = 'default', 
  tip = 'Loading...', 
  spinning = true, 
  children,
  style = {},
  delay = 0,
  fullScreen = false 
}) => {
  const antIcon = <LoadingOutlined style={{ fontSize: getIconSize(size) }} spin />;

  function getIconSize(size) {
    switch (size) {
      case 'small': return 14;
      case 'default': return 24;
      case 'large': return 32;
      default: return 24;
    }
  }

  const spinnerStyle = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 9999,
    ...style
  } : {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    ...style
  };

  if (children) {
    return (
      <Spin 
        indicator={antIcon} 
        spinning={spinning} 
        tip={tip}
        size={size}
        delay={delay}
        style={style}
      >
        {children}
      </Spin>
    );
  }

  return (
    <div style={spinnerStyle}>
      <Spin 
        indicator={antIcon} 
        spinning={spinning} 
        tip={tip}
        size={size}
        delay={delay}
      />
    </div>
  );
};

// Specific loading components for common use cases
export const ButtonLoading = ({ loading = true, children, ...props }) => (
  <LoadingSpinner 
    size="small" 
    spinning={loading} 
    style={{ minHeight: 'auto', padding: 0 }}
    {...props}
  >
    {children}
  </LoadingSpinner>
);

export const PageLoading = ({ loading = true, tip = 'Loading page...', ...props }) => (
  <LoadingSpinner 
    size="large" 
    spinning={loading} 
    tip={tip}
    style={{ 
      minHeight: '200px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}
    {...props}
  />
);

export const FullScreenLoading = ({ loading = true, tip = 'Processing...', ...props }) => (
  <LoadingSpinner 
    size="large" 
    spinning={loading} 
    tip={tip}
    fullScreen={true}
    {...props}
  />
);

export const TableLoading = ({ loading = true, children, ...props }) => (
  <LoadingSpinner 
    spinning={loading} 
    tip="Loading data..."
    style={{ minHeight: '100px' }}
    {...props}
  >
    {children}
  </LoadingSpinner>
);

export const CardLoading = ({ loading = true, children, height = '200px', ...props }) => (
  <LoadingSpinner 
    spinning={loading} 
    tip="Loading..."
    style={{ minHeight: height }}
    {...props}
  >
    {children}
  </LoadingSpinner>
);

export default LoadingSpinner;