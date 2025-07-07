import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  HomeIcon,
  TrophyIcon,
  ChartBarIcon,
  AcademicCapIcon,
  UserIcon,
  StarIcon,
  FireIcon,
  BoltIcon,
  BellIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../../hooks/useAuth';
import { useWebSocket } from '../../../hooks/useWebSocket';

/**
 * StaffLayout - Layout game hóa cho nhân viên với động lực và thành tích
 */
const StaffLayout = () => {
  const [staffStats, setStaffStats] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [levelProgress, setLevelProgress] = useState(0);
  const { user, logout } = useAuth();
  const { isConnected, lastMessage } = useWebSocket();
  const navigate = useNavigate();
  const location = useLocation();

  // Menu items với gamification
  const menuItems = [
    {
      name: 'Dashboard',
      href: '/staff/dashboard',
      icon: HomeIcon,
      description: 'Tổng quan hiệu suất',
      badge: null
    },
    {
      name: 'Leaderboard',
      href: '/staff/leaderboard',
      icon: TrophyIcon,
      description: 'Bảng xếp hạng',
      badge: staffStats.rank ? `#${staffStats.rank}` : null,
      color: 'text-yellow-600'
    },
    {
      name: 'Thành tích',
      href: '/staff/achievements',
      icon: StarIcon,
      description: 'Huy hiệu & thành tích',
      badge: achievements.filter(a => a.isNew).length || null,
      color: 'text-purple-600'
    },
    {
      name: 'Thử thách',
      href: '/staff/challenges',
      icon: BoltIcon,
      description: 'Thử thách hàng ngày',
      badge: currentChallenge?.timeLeft || null,
      color: 'text-blue-600'
    },
    {
      name: 'Doanh số',
      href: '/staff/sales',
      icon: ChartBarIcon,
      description: 'Theo dõi doanh số',
      badge: null,
      color: 'text-green-600'
    },
    {
      name: 'Đào tạo',
      href: '/staff/training',
      icon: AcademicCapIcon,
      description: 'Khóa học & chứng chỉ',
      badge: null,
      color: 'text-indigo-600'
    },
    {
      name: 'Hồ sơ',
      href: '/staff/profile',
      icon: UserIcon,
      description: 'Thông tin cá nhân',
      badge: null
    }
  ];

  // Load staff data
  useEffect(() => {
    // TODO: Load from API
    setStaffStats({
      level: 12,
      xp: 2847,
      xpToNext: 3000,
      rank: 3,
      todaySales: 2500000,
      monthSales: 45000000,
      streakDays: 7
    });

    setAchievements([
      { id: 1, name: 'Siêu sao bán hàng', isNew: true },
      { id: 2, name: 'Khách hàng thân thiết', isNew: false }
    ]);

    setCurrentChallenge({
      name: 'Bán 10 sản phẩm trong ngày',
      progress: 7,
      target: 10,
      timeLeft: '4h 23m'
    });
  }, []);

  // Calculate level progress
  useEffect(() => {
    if (staffStats.xp && staffStats.xpToNext) {
      const progress = (staffStats.xp / staffStats.xpToNext) * 100;
      setLevelProgress(progress);
    }
  }, [staffStats]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Sidebar with gamification */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-72">
          <div className="flex flex-col h-0 flex-1 bg-white shadow-xl rounded-r-2xl">
            {/* Header với level */}
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4 mb-6">
                <div className="w-full">
                  {/* User info với level */}
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="relative">
                      <img
                        className="h-12 w-12 rounded-full border-2 border-purple-400"
                        src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=8b5cf6&color=fff`}
                        alt={user?.name}
                      />
                      <div className="absolute -bottom-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                        {staffStats.level}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
                      <p className="text-sm text-gray-600">Level {staffStats.level} - {user?.role}</p>
                    </div>
                  </div>

                  {/* XP Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-purple-700">XP Progress</span>
                      <span className="text-sm text-gray-500">{staffStats.xp}/{staffStats.xpToNext}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${levelProgress}%` }}
                      />
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg p-3 text-white">
                      <div className="flex items-center justify-between">
                        <TrophyIcon className="w-5 h-5" />
                        <span className="text-lg font-bold">#{staffStats.rank}</span>
                      </div>
                      <p className="text-xs opacity-90">Xếp hạng</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-400 to-blue-500 rounded-lg p-3 text-white">
                      <div className="flex items-center justify-between">
                        <FireIcon className="w-5 h-5" />
                        <span className="text-lg font-bold">{staffStats.streakDays}</span>
                      </div>
                      <p className="text-xs opacity-90">Ngày liên tiếp</p>
                    </div>
                  </div>

                  {/* Current challenge */}
                  {currentChallenge && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-blue-900">Thử thách hiện tại</h4>
                        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          {currentChallenge.timeLeft}
                        </span>
                      </div>
                      <p className="text-sm text-blue-800 mb-2">{currentChallenge.name}</p>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(currentChallenge.progress / currentChallenge.target) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-xs text-blue-600">{currentChallenge.progress}/{currentChallenge.target}</span>
                        <span className="text-xs text-blue-600">
                          {Math.round((currentChallenge.progress / currentChallenge.target) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {menuItems.map((item) => (
                  <MenuItem key={item.name} item={item} location={location} />
                ))}
              </nav>
            </div>

            {/* Footer với logout */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <div className="flex-1 px-4 flex justify-between items-center">
            {/* Page title */}
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                {menuItems.find(item => location.pathname.startsWith(item.href))?.name || 'Dashboard'}
              </h1>
            </div>

            {/* Right side */}
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Connection status */}
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-gray-500">{isConnected ? 'Online' : 'Offline'}</span>
              </div>

              {/* Notifications */}
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                <BellIcon className="h-6 w-6" />
                {achievements.filter(a => a.isNew).length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {achievements.filter(a => a.isNew).length}
                  </span>
                )}
              </button>

              {/* Today's sales */}
              <div className="hidden sm:flex items-center space-x-2 bg-green-50 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-green-700">Hôm nay:</span>
                <span className="text-sm font-bold text-green-900">
                  {new Intl.NumberFormat('vi-VN', { 
                    style: 'currency', 
                    currency: 'VND' 
                  }).format(staffStats.todaySales || 0)}
                </span>
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
 * MenuItem - Component cho menu item với gamification
 */
const MenuItem = ({ item, location }) => {
  const isActive = location.pathname.startsWith(item.href);

  return (
    <a
      href={item.href}
      className={`
        group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200
        ${isActive 
          ? 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-900 border-r-2 border-purple-500' 
          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }
      `}
    >
      <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 ${item.color || ''}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <span>{item.name}</span>
          {item.badge && (
            <span className={`
              ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
              ${isActive 
                ? 'bg-purple-200 text-purple-800' 
                : 'bg-gray-200 text-gray-800'
              }
            `}>
              {item.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
      </div>
    </a>
  );
};

export default StaffLayout;