/**
 * ProtectedRoute Component
 * Handles route protection, role-based access, and authentication redirects
 */

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Result, Spin, Button, Card, Space, Typography, theme } from 'antd';
import { 
    LockOutlined, 
    UserOutlined, 
    ExclamationCircleOutlined,
    ReloadOutlined,
    HomeOutlined
} from '@ant-design/icons';
import { useAuth, USER_ROLES } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { useToken } = theme;

/**
 * Loading Component
 */
const LoadingComponent = () => {
    const { token } = useToken();
    
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: token.colorBgContainer
        }}>
            <Card 
                style={{ 
                    textAlign: 'center', 
                    minWidth: 300,
                    boxShadow: token.boxShadowTertiary 
                }}
                bodyStyle={{ padding: token.paddingXL }}
            >
                <Spin size="large" />
                <Title level={4} style={{ marginTop: token.marginLG, marginBottom: token.marginSM }}>
                    Đang xác thực...
                </Title>
                <Text type="secondary">
                    Vui lòng chờ trong giây lát
                </Text>
            </Card>
        </div>
    );
};

/**
 * Unauthorized Access Component
 */
const UnauthorizedComponent = ({ requiredRole, userRole, onRetry }) => {
    const { token } = useToken();
    
    const roleNames = {
        [USER_ROLES.ADMIN]: 'Quản trị viên',
        [USER_ROLES.MANAGER]: 'Quản lý',
        [USER_ROLES.CASHIER]: 'Thu ngân',
        [USER_ROLES.STAFF]: 'Nhân viên'
    };
    
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: token.colorBgContainer,
            padding: token.padding
        }}>
            <Result
                status="403"
                title="Truy cập bị từ chối"
                subTitle={
                    <Space direction="vertical" size="small">
                        <Text>
                            Bạn không có quyền truy cập vào trang này.
                        </Text>
                        {requiredRole && (
                            <Text type="secondary">
                                Yêu cầu quyền: <Text strong>{roleNames[requiredRole] || requiredRole}</Text>
                            </Text>
                        )}
                        {userRole && (
                            <Text type="secondary">
                                Quyền hiện tại: <Text strong>{roleNames[userRole] || userRole}</Text>
                            </Text>
                        )}
                    </Space>
                }
                icon={<LockOutlined style={{ color: token.colorError }} />}
                extra={
                    <Space>
                        <Button 
                            type="primary" 
                            icon={<HomeOutlined />}
                            onClick={() => window.location.href = '/'}
                        >
                            Về trang chủ
                        </Button>
                        {onRetry && (
                            <Button 
                                icon={<ReloadOutlined />}
                                onClick={onRetry}
                            >
                                Thử lại
                            </Button>
                        )}
                    </Space>
                }
            />
        </div>
    );
};

/**
 * Unauthenticated Component
 */
const UnauthenticatedComponent = ({ onLogin }) => {
    const { token } = useToken();
    
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: token.colorBgContainer,
            padding: token.padding
        }}>
            <Result
                status="warning"
                title="Yêu cầu đăng nhập"
                subTitle="Bạn cần đăng nhập để truy cập trang này."
                icon={<UserOutlined style={{ color: token.colorWarning }} />}
                extra={
                    <Space>
                        <Button 
                            type="primary" 
                            icon={<UserOutlined />}
                            onClick={onLogin}
                        >
                            Đăng nhập
                        </Button>
                        <Button 
                            icon={<HomeOutlined />}
                            onClick={() => window.location.href = '/'}
                        >
                            Về trang chủ
                        </Button>
                    </Space>
                }
            />
        </div>
    );
};

/**
 * Error Boundary Component
 */
class ProtectedRouteErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    
    componentDidCatch(error, errorInfo) {
        console.error('ProtectedRoute Error:', error, errorInfo);
    }
    
    render() {
        if (this.state.hasError) {
            return (
                <Result
                    status="error"
                    title="Đã xảy ra lỗi"
                    subTitle="Không thể tải trang. Vui lòng thử lại sau."
                    icon={<ExclamationCircleOutlined />}
                    extra={
                        <Space>
                            <Button 
                                type="primary" 
                                onClick={() => window.location.reload()}
                            >
                                Tải lại trang
                            </Button>
                            <Button onClick={() => window.location.href = '/'}>
                                Về trang chủ
                            </Button>
                        </Space>
                    }
                />
            );
        }
        
        return this.props.children;
    }
}

/**
 * Main ProtectedRoute Component
 */
const ProtectedRoute = ({ 
    children, 
    requiredRole = null,
    requiredPermission = null,
    fallback = null,
    redirectTo = '/login',
    allowUnauthenticated = false
}) => {
    const { 
        isAuthenticated, 
        isLoading, 
        user, 
        hasRole, 
        hasPermission,
        refreshTokens 
    } = useAuth();
    const location = useLocation();
    const [retryCount, setRetryCount] = useState(0);
    const [showRetry, setShowRetry] = useState(false);

    // Handle token refresh on mount
    useEffect(() => {
        if (!isAuthenticated && !isLoading) {
            const timer = setTimeout(() => {
                setShowRetry(true);
            }, 3000); // Show retry option after 3 seconds

            return () => clearTimeout(timer);
        }
    }, [isAuthenticated, isLoading]);

    // Auto-retry authentication
    const handleRetry = async () => {
        if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
            setShowRetry(false);
            
            try {
                await refreshTokens();
            } catch (error) {
                console.error('Retry authentication failed:', error);
                setTimeout(() => setShowRetry(true), 2000);
            }
        }
    };

    // Handle login redirect
    const handleLogin = () => {
        const currentPath = location.pathname + location.search;
        const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
        window.location.href = loginUrl;
    };

    // Show loading state
    if (isLoading) {
        return fallback || <LoadingComponent />;
    }

    // Allow unauthenticated access
    if (allowUnauthenticated) {
        return (
            <ProtectedRouteErrorBoundary>
                {children}
            </ProtectedRouteErrorBoundary>
        );
    }

    // Check authentication
    if (!isAuthenticated) {
        // If we're already on the login page, don't redirect
        if (location.pathname === redirectTo) {
            return (
                <ProtectedRouteErrorBoundary>
                    {children}
                </ProtectedRouteErrorBoundary>
            );
        }

        // Show custom unauthenticated component with retry option
        if (showRetry && retryCount < 3) {
            return (
                <UnauthenticatedComponent 
                    onLogin={handleLogin}
                    onRetry={handleRetry}
                />
            );
        }

        // Redirect to login with return path
        const currentPath = location.pathname + location.search;
        return <Navigate to={`${redirectTo}?redirect=${encodeURIComponent(currentPath)}`} replace />;
    }

    // Check role-based access
    if (requiredRole && !hasRole(requiredRole)) {
        return (
            <UnauthorizedComponent 
                requiredRole={requiredRole}
                userRole={user?.role}
                onRetry={showRetry ? handleRetry : null}
            />
        );
    }

    // Check permission-based access
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <UnauthorizedComponent 
                requiredPermission={requiredPermission}
                userRole={user?.role}
                onRetry={showRetry ? handleRetry : null}
            />
        );
    }

    // User is authenticated and authorized
    return (
        <ProtectedRouteErrorBoundary>
            {children}
        </ProtectedRouteErrorBoundary>
    );
};

/**
 * Higher-Order Component for protecting components
 */
export const withProtectedRoute = (Component, options = {}) => {
    return (props) => (
        <ProtectedRoute {...options}>
            <Component {...props} />
        </ProtectedRoute>
    );
};

/**
 * Role-specific route components
 */
export const AdminRoute = ({ children, ...props }) => (
    <ProtectedRoute requiredRole={USER_ROLES.ADMIN} {...props}>
        {children}
    </ProtectedRoute>
);

export const ManagerRoute = ({ children, ...props }) => (
    <ProtectedRoute requiredRole={USER_ROLES.MANAGER} {...props}>
        {children}
    </ProtectedRoute>
);

export const CashierRoute = ({ children, ...props }) => (
    <ProtectedRoute requiredRole={USER_ROLES.CASHIER} {...props}>
        {children}
    </ProtectedRoute>
);

export const StaffRoute = ({ children, ...props }) => (
    <ProtectedRoute requiredRole={USER_ROLES.STAFF} {...props}>
        {children}
    </ProtectedRoute>
);

/**
 * Permission-specific route components
 */
export const PermissionRoute = ({ permission, children, ...props }) => (
    <ProtectedRoute requiredPermission={permission} {...props}>
        {children}
    </ProtectedRoute>
);

/**
 * Public route (no authentication required)
 */
export const PublicRoute = ({ children, ...props }) => (
    <ProtectedRoute allowUnauthenticated {...props}>
        {children}
    </ProtectedRoute>
);

/**
 * Conditional route based on authentication status
 */
export const ConditionalRoute = ({ 
    authenticatedComponent, 
    unauthenticatedComponent, 
    ...props 
}) => {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
        return <LoadingComponent />;
    }
    
    return isAuthenticated ? authenticatedComponent : unauthenticatedComponent;
};

/**
 * Route guard hook for programmatic protection
 */
export const useRouteGuard = (requiredRole = null, requiredPermission = null) => {
    const { isAuthenticated, hasRole, hasPermission, user } = useAuth();
    const location = useLocation();
    
    const canAccess = React.useMemo(() => {
        if (!isAuthenticated) return false;
        if (requiredRole && !hasRole(requiredRole)) return false;
        if (requiredPermission && !hasPermission(requiredPermission)) return false;
        return true;
    }, [isAuthenticated, hasRole, hasPermission, requiredRole, requiredPermission]);
    
    const redirect = React.useCallback((path = '/login') => {
        const currentPath = location.pathname + location.search;
        window.location.href = `${path}?redirect=${encodeURIComponent(currentPath)}`;
    }, [location]);
    
    return {
        canAccess,
        isAuthenticated,
        user,
        redirect,
        hasRole: (role) => hasRole(role),
        hasPermission: (permission) => hasPermission(permission)
    };
};

export default ProtectedRoute;