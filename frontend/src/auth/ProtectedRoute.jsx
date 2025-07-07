import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/Common/LoadingSpinner';

/**
 * ProtectedRoute - Route bảo vệ với xác thực và phân quyền
 * Kiểm tra user đã đăng nhập và có quyền truy cập không
 */
const ProtectedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredPermissions = [],
  fallbackUrl = '/login' 
}) => {
  const { user, loading, hasRole, hasPermission } = useAuth();
  const location = useLocation();

  // Đang tải thông tin auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Đang xác thực..." />
      </div>
    );
  }

  // Chưa đăng nhập
  if (!user) {
    return (
      <Navigate 
        to={fallbackUrl} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Kiểm tra role nếu được yêu cầu
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          message: `Bạn cần quyền ${requiredRole} để truy cập trang này`,
          from: location.pathname 
        }} 
        replace 
      />
    );
  }

  // Kiểm tra permissions nếu được yêu cầu
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasPermission(permission)
    );
    
    if (!hasAllPermissions) {
      return (
        <Navigate 
          to="/unauthorized" 
          state={{ 
            message: "Bạn không có quyền truy cập trang này",
            requiredPermissions,
            from: location.pathname 
          }} 
          replace 
        />
      );
    }
  }

  // Tất cả điều kiện đều thỏa mãn
  return children;
};

/**
 * MultiRoleRoute - Route cho phép nhiều role
 */
export const MultiRoleRoute = ({ 
  children, 
  allowedRoles = [], 
  fallbackUrl = '/login' 
}) => {
  const { user, loading, hasAnyRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" text="Đang xác thực..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallbackUrl} state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return (
      <Navigate 
        to="/unauthorized" 
        state={{ 
          message: `Bạn cần một trong các quyền: ${allowedRoles.join(', ')}`,
          from: location.pathname 
        }} 
        replace 
      />
    );
  }

  return children;
};

/**
 * AdminRoute - Route chỉ dành cho Admin
 */
export const AdminRoute = ({ children }) => (
  <ProtectedRoute requiredRole="admin">
    {children}
  </ProtectedRoute>
);

/**
 * CashierRoute - Route cho Thu ngân và Admin
 */
export const CashierRoute = ({ children }) => (
  <MultiRoleRoute allowedRoles={['admin', 'cashier']}>
    {children}
  </MultiRoleRoute>
);

/**
 * StaffRoute - Route cho tất cả nhân viên
 */
export const StaffRoute = ({ children }) => (
  <MultiRoleRoute allowedRoles={['admin', 'manager', 'cashier', 'staff']}>
    {children}
  </MultiRoleRoute>
);

/**
 * ManagerRoute - Route cho Manager và Admin
 */
export const ManagerRoute = ({ children }) => (
  <MultiRoleRoute allowedRoles={['admin', 'manager']}>
    {children}
  </MultiRoleRoute>
);

export default ProtectedRoute;