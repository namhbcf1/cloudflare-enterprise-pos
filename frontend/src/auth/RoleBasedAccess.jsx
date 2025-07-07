import React from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * RoleBasedAccess - Component kiểm soát hiển thị theo role/permission
 * Sử dụng để ẩn/hiện các phần tử UI dựa trên quyền
 */
const RoleBasedAccess = ({ 
  children, 
  roles = [], 
  permissions = [], 
  requireAll = false,
  fallback = null,
  user: customUser = null 
}) => {
  const { user: authUser, hasRole, hasPermission, hasAnyRole, hasAllRoles } = useAuth();
  const user = customUser || authUser;

  // Nếu không có user thì không hiển thị
  if (!user) {
    return fallback;
  }

  // Kiểm tra roles
  let hasRequiredRoles = true;
  if (roles.length > 0) {
    hasRequiredRoles = requireAll 
      ? hasAllRoles(roles)
      : hasAnyRole(roles);
  }

  // Kiểm tra permissions
  let hasRequiredPermissions = true;
  if (permissions.length > 0) {
    hasRequiredPermissions = requireAll
      ? permissions.every(permission => hasPermission(permission))
      : permissions.some(permission => hasPermission(permission));
  }

  // Hiển thị nội dung nếu thỏa mãn điều kiện
  if (hasRequiredRoles && hasRequiredPermissions) {
    return children;
  }

  return fallback;
};

/**
 * AdminOnly - Chỉ Admin mới thấy
 */
export const AdminOnly = ({ children, fallback = null }) => (
  <RoleBasedAccess roles={['admin']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

/**
 * ManagerAndAbove - Manager và Admin
 */
export const ManagerAndAbove = ({ children, fallback = null }) => (
  <RoleBasedAccess roles={['admin', 'manager']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

/**
 * CashierAndAbove - Thu ngân, Manager và Admin
 */
export const CashierAndAbove = ({ children, fallback = null }) => (
  <RoleBasedAccess roles={['admin', 'manager', 'cashier']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

/**
 * StaffAndAbove - Tất cả nhân viên
 */
export const StaffAndAbove = ({ children, fallback = null }) => (
  <RoleBasedAccess roles={['admin', 'manager', 'cashier', 'staff']} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

/**
 * WithPermission - Kiểm tra permission cụ thể
 */
export const WithPermission = ({ children, permission, fallback = null }) => (
  <RoleBasedAccess permissions={[permission]} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

/**
 * WithAnyPermission - Có ít nhất 1 permission
 */
export const WithAnyPermission = ({ children, permissions, fallback = null }) => (
  <RoleBasedAccess permissions={permissions} requireAll={false} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

/**
 * WithAllPermissions - Phải có tất cả permissions
 */
export const WithAllPermissions = ({ children, permissions, fallback = null }) => (
  <RoleBasedAccess permissions={permissions} requireAll={true} fallback={fallback}>
    {children}
  </RoleBasedAccess>
);

/**
 * ConditionalRender - Render có điều kiện nâng cao
 */
export const ConditionalRender = ({ 
  children, 
  condition, 
  fallback = null,
  loading = false,
  loadingComponent = <div>Loading...</div>
}) => {
  if (loading) {
    return loadingComponent;
  }
  
  return condition ? children : fallback;
};

/**
 * FeatureFlag - Kiểm soát tính năng
 */
export const FeatureFlag = ({ 
  children, 
  flag, 
  fallback = null,
  user: customUser = null 
}) => {
  const { user: authUser } = useAuth();
  const user = customUser || authUser;

  // Kiểm tra feature flag từ user settings hoặc config
  const isFeatureEnabled = user?.features?.[flag] || 
                          user?.permissions?.includes(`feature.${flag}`) ||
                          false;

  return isFeatureEnabled ? children : fallback;
};

/**
 * BusinessHours - Hiển thị theo giờ hoạt động
 */
export const BusinessHours = ({ 
  children, 
  fallback = null,
  timezone = 'Asia/Ho_Chi_Minh',
  businessHours = { start: 8, end: 22 }
}) => {
  const now = new Date();
  const currentHour = now.getHours();
  
  const isBusinessTime = currentHour >= businessHours.start && 
                        currentHour < businessHours.end;

  return isBusinessTime ? children : fallback;
};

/**
 * Demo component để test các quyền
 */
export const PermissionDemo = () => {
  const { user } = useAuth();
  
  return (
    <div className="p-4 space-y-4 bg-gray-50 rounded-lg">
      <h3 className="font-bold text-lg">Permission Demo</h3>
      <div className="space-y-2">
        <div>Current User: {user?.email || 'Not logged in'}</div>
        <div>Role: {user?.role || 'No role'}</div>
        
        <AdminOnly>
          <div className="p-2 bg-red-100 text-red-800 rounded">
            🔴 Admin Only Content
          </div>
        </AdminOnly>
        
        <ManagerAndAbove>
          <div className="p-2 bg-orange-100 text-orange-800 rounded">
            🟠 Manager & Above Content
          </div>
        </ManagerAndAbove>
        
        <CashierAndAbove>
          <div className="p-2 bg-yellow-100 text-yellow-800 rounded">
            🟡 Cashier & Above Content
          </div>
        </CashierAndAbove>
        
        <StaffAndAbove>
          <div className="p-2 bg-green-100 text-green-800 rounded">
            🟢 All Staff Content
          </div>
        </StaffAndAbove>
        
        <WithPermission permission="products.create">
          <div className="p-2 bg-blue-100 text-blue-800 rounded">
            🔵 Can Create Products
          </div>
        </WithPermission>
        
        <FeatureFlag flag="gamification">
          <div className="p-2 bg-purple-100 text-purple-800 rounded">
            🟣 Gamification Feature Enabled
          </div>
        </FeatureFlag>
      </div>
    </div>
  );
};

export default RoleBasedAccess;