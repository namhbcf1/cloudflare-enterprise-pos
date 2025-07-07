import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  CubeIcon, 
  ShoppingCartIcon, 
  UsersIcon,
  ChartBarIcon,
  CogIcon,
  UserGroupIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../hooks/useAuth';
import { useWebSocket } from '../../../hooks/useWebSocket';
import { AdminOnly, ManagerAndAbove } from '../../../auth/RoleBasedAccess';

/**
 * AdminLayout - Layout chính cho Admin với sidebar và header
 */
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, logout } = useAuth();
  const { isConnected, lastMessage } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Menu items cho Admin
  const menuItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: HomeIcon,
      badge: null
    },
    {
      name: 'Sản phẩm',
      href: '/admin/products',
      icon: CubeIcon,
      badge: null,
      children: [
        { name: 'Danh sách sản phẩm', href: '/admin/products' },
        { name: 'Danh mục', href: '/admin/products/categories' },
        { name: 'Tối ưu giá', href: '/admin/products/pricing' }
      ]
    },
    {
      name: 'Đơn hàng',
      href: '/admin/orders',
      icon: ShoppingCartIcon,
      badge: notifications.filter(n => n.type === 'order').length || null
    },
    {
      name: 'Khách hàng',
      href: '/admin/customers',
      icon: UsersIcon,
      badge: null,
      children: [
        { name: 'Danh sách KH', href: '/admin/customers' },
        { name: 'Chương trình loyalty', href: '/admin/customers/loyalty' },
        { name: 'Phân khúc KH', href: '/admin/customers/segments' }
      ]
    },
    {
      name: 'Nhân viên',
      href: '/admin/staff',
      icon: UserGroupIcon,
      badge: null,
      permission: 'staff.view',
      children: [
        { name: 'Quản lý NV', href: '/admin/staff' },
        { name: 'Hiệu suất', href: '/admin/staff/performance' },
        { name: 'Game hóa', href: '/admin/staff/gamification' }
      ]
    },
    {
      name: 'Báo cáo',
      href: '/admin/analytics',
      icon: ChartBarIcon,
      badge: null,
      children: [
        { name: 'Tổng quan', href: '/admin/analytics' },
        { name: 'Báo cáo tùy chỉnh', href: '/admin/analytics/custom' },
        { name: 'BI Dashboard', href: '/admin/analytics/bi' }
      ]
    },
    {
      name: 'Cài đặt',
      href: '/admin/settings',
      icon: CogIcon,
      badge: null,
      adminOnly: true
    }
  ];

  // Xử lý WebSocket notifications
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      if (message.type === 'notification') {
        setNotifications(prev => [message.data, ...prev.slice(0, 9)]);
      }
    }
  }, [lastMessage]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActivePath = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent menuItems={menuItems} />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent menuItems={menuItems} />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          {/* Search bar */}
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent"
                    placeholder="Tìm kiếm..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            
            {/* Right side of header */}
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* WebSocket status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* Notifications */}
              <div className="relative">
                <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                  <BellIcon className="h-6 w-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* User menu */}
              <div className="relative flex items-center space-x-3">
                <div className="flex flex-col text-right">
                  <span className="text-sm font-medium text-gray-900">{user?.name}</span>
                  <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                </div>
                <img
                  className="h-8 w-8 rounded-full"
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=4f46e5&color=fff`}
                  alt={user?.name}
                />
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

/**
 * SidebarContent - Nội dung sidebar
 */
const SidebarContent = ({ menuItems }) => {
  const [expandedItems, setExpandedItems] = useState(new Set());
  const location = useLocation();

  const toggleExpanded = (itemName) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemName)) {
      newExpanded.delete(itemName);
    } else {
      newExpanded.add(itemName);
    }
    setExpandedItems(newExpanded);
  };

  return (
    <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-600">
        <h1 className="text-white text-lg font-semibold">Admin Panel</h1>
      </div>
      
      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {menuItems.map((item) => {
            // Kiểm tra quyền truy cập
            if (item.adminOnly) {
              return (
                <AdminOnly key={item.name}>
                  <MenuItem 
                    item={item} 
                    expandedItems={expandedItems}
                    toggleExpanded={toggleExpanded}
                    location={location}
                  />
                </AdminOnly>
              );
            }

            if (item.permission) {
              return (
                <ManagerAndAbove key={item.name}>
                  <MenuItem 
                    item={item} 
                    expandedItems={expandedItems}
                    toggleExpanded={toggleExpanded}
                    location={location}
                  />
                </ManagerAndAbove>
              );
            }

            return (
              <MenuItem 
                key={item.name}
                item={item} 
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                location={location}
              />
            );
          })}
        </nav>
      </div>
    </div>
  );
};

/**
 * MenuItem - Component cho từng menu item
 */
const MenuItem = ({ item, expandedItems, toggleExpanded, location }) => {
  const isActive = location.pathname.startsWith(item.href);
  const isExpanded = expandedItems.has(item.name);
  const hasChildren = item.children && item.children.length > 0;

  const handleClick = (e) => {
    if (hasChildren) {
      e.preventDefault();
      toggleExpanded(item.name);
    }
  };

  return (
    <div>
      <a
        href={item.href}
        onClick={handleClick}
        className={`
          group flex items-center px-2 py-2 text-sm font-medium rounded-md
          ${isActive 
            ? 'bg-indigo-100 text-indigo-900' 
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          }
        `}
      >
        <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
        <span className="flex-1">{item.name}</span>
        
        {item.badge && (
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {item.badge}
          </span>
        )}
        
        {hasChildren && (
          <svg
            className={`ml-2 h-4 w-4 transform transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </a>

      {/* Submenu */}
      {hasChildren && isExpanded && (
        <div className="ml-6 mt-1 space-y-1">
          {item.children.map((child) => (
            <a
              key={child.name}
              href={child.href}
              className={`
                group flex items-center px-2 py-1 text-sm rounded-md
                ${location.pathname === child.href
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {child.name}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminLayout;