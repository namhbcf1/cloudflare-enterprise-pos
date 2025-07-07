import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  ComputerDesktopIcon,
  ClockIcon,
  ShoppingCartIcon,
  UsersIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  BellIcon,
  ArrowRightOnRectangleIcon,
  PauseIcon,
  PlayIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../hooks/useAuth';
import { useWebSocket } from '../../../hooks/useWebSocket';

/**
 * CashierLayout - Layout tối ưu cho Thu ngân với giao diện POS
 */
const CashierLayout = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [shiftInfo, setShiftInfo] = useState(null);
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const { user, logout } = useAuth();
  const { isConnected, lastMessage } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle WebSocket notifications
  useEffect(() => {
    if (lastMessage) {
      const message = JSON.parse(lastMessage.data);
      if (message.type === 'notification') {
        setNotifications(prev => [message.data, ...prev.slice(0, 4)]);
      }
    }
  }, [lastMessage]);

  // Quick action buttons cho cashier
  const quickActions = [
    {
      name: 'POS Terminal',
      href: '/cashier/pos',
      icon: ComputerDesktopIcon,
      color: 'bg-green-500 hover:bg-green-600',
      active: location.pathname.includes('/pos')
    },
    {
      name: 'Đơn hàng',
      href: '/cashier/orders',
      icon: ShoppingCartIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      badge: notifications.filter(n => n.type === 'order').length,
      active: location.pathname.includes('/orders')
    },
    {
      name: 'Khách hàng',
      href: '/cashier/customers',
      icon: UsersIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      active: location.pathname.includes('/customers')
    },
    {
      name: 'Ca làm việc',
      href: '/cashier/session',
      icon: ClockIcon,
      color: 'bg-orange-500 hover:bg-orange-600',
      active: location.pathname.includes('/session')
    }
  ];

  const handleLogout = async () => {
    try {
      // Kiểm tra ca làm việc trước khi đăng xuất
      if (shiftInfo?.isActive) {
        const confirmEnd = window.confirm('Bạn có muốn kết thúc ca làm việc trước khi đăng xuất?');
        if (confirmEnd) {
          // TODO: End shift logic
        }
      }
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleBreak = () => {
    setIsOnBreak(!isOnBreak);
    // TODO: API call to update break status
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Header - Compact for POS efficiency */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14 items-center">
            {/* Left side - Store info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <ComputerDesktopIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">POS Terminal</h1>
                  <p className="text-xs text-gray-500">Ca {shiftInfo?.shiftNumber || '1'} - Quầy {user?.terminalId || '01'}</p>
                </div>
              </div>

              {/* Current time */}
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <ClockIcon className="w-4 h-4" />
                <span>{currentTime.toLocaleTimeString('vi-VN')}</span>
                <span className="text-gray-400">|</span>
                <span>{currentTime.toLocaleDateString('vi-VN')}</span>
              </div>
            </div>

            {/* Center - Connection status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Kết nối ổn định' : 'Mất kết nối'}
                </span>
              </div>

              {/* Shift status */}
              {shiftInfo && (
                <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-700">
                    Ca đang hoạt động: {shiftInfo.startTime}
                  </span>
                </div>
              )}
            </div>

            {/* Right side - User & actions */}
            <div className="flex items-center space-x-3">
              {/* Break button */}
              <button
                onClick={toggleBreak}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isOnBreak 
                    ? 'bg-orange-100 text-orange-800 hover:bg-orange-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isOnBreak ? <PlayIcon className="w-4 h-4" /> : <PauseIcon className="w-4 h-4" />}
                <span>{isOnBreak ? 'Kết thúc nghỉ' : 'Nghỉ giải lao'}</span>
              </button>

              {/* Notifications */}
              <div className="relative">
                <button className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md">
                  <BellIcon className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* User info */}
              <div className="flex items-center space-x-2">
                <img
                  className="h-8 w-8 rounded-full"
                  src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=10b981&color=fff`}
                  alt={user?.name}
                />
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md"
                title="Đăng xuất"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Actions Bar */}
      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-2 py-3">
          {quickActions.map((action) => (
            <QuickActionButton
              key={action.name}
              action={action}
              onClick={() => navigate(action.href)}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Primary content */}
          <div className="flex-1 overflow-y-auto">
            <Outlet />
          </div>

          {/* Side Panel for notifications/quick info (optional) */}
          {notifications.length > 0 && (
            <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Thông báo</h3>
                <div className="space-y-3">
                  {notifications.map((notification, index) => (
                    <NotificationItem key={index} notification={notification} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="bg-white border-t border-gray-200 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-12 text-sm">
          <div className="flex items-center space-x-4 text-gray-600">
            <span>Phiên bản: 2.1.0</span>
            <span>•</span>
            <span>Server: {isConnected ? 'Online' : 'Offline'}</span>
            <span>•</span>
            <span>Máy in: Sẵn sàng</span>
          </div>
          
          {shiftInfo && (
            <div className="flex items-center space-x-4 text-gray-600">
              <span>Ca bắt đầu: {shiftInfo.startTime}</span>
              <span>•</span>
              <span>Giao dịch: {shiftInfo.transactionCount || 0}</span>
              <span>•</span>
              <span className="font-medium text-green-600">
                Doanh thu: {new Intl.NumberFormat('vi-VN', { 
                  style: 'currency', 
                  currency: 'VND' 
                }).format(shiftInfo.revenue || 0)}
              </span>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
};

/**
 * QuickActionButton - Button cho các hành động nhanh
 */
const QuickActionButton = ({ action, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center space-x-2 px-4 py-2 rounded-lg text-white font-medium
        transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
        ${action.color}
        ${action.active ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}
      `}
    >
      <action.icon className="w-5 h-5" />
      <span className="hidden sm:inline">{action.name}</span>
      
      {action.badge && action.badge > 0 && (
        <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
          {action.badge}
        </span>
      )}
    </button>
  );
};

/**
 * NotificationItem - Item thông báo
 */
const NotificationItem = ({ notification }) => {
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order':
        return <ShoppingCartIcon className="w-5 h-5 text-blue-500" />;
      case 'payment':
        return <CurrencyDollarIcon className="w-5 h-5 text-green-500" />;
      case 'system':
        return <BellIcon className="w-5 h-5 text-orange-500" />;
      default:
        return <DocumentTextIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} giờ trước`;
    return time.toLocaleDateString('vi-VN');
  };

  return (
    <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-shrink-0">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {notification.title}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {notification.message}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {getTimeAgo(notification.timestamp)}
        </p>
      </div>
    </div>
  );
};

export default CashierLayout;