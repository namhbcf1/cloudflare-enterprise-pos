import React, { useState, useContext } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Layout, 
  Menu, 
  Avatar, 
  Dropdown, 
  Badge, 
  Drawer,
  Button,
  Space,
  Typography,
  Divider,
  Switch,
  notification
} from 'antd';
import {
  DashboardOutlined,
  ShoppingCartOutlined,
  ProductsOutlined,
  UserOutlined,
  TeamOutlined,
  BarChartOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuOutlined,
  SunOutlined,
  MoonOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { AuthContext } from '../../contexts/AuthContext';

const { Header, Sider } = Layout;
const { Text } = Typography;

const Navigation = ({ darkMode, setDarkMode, collapsed, setCollapsed }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [notifications] = useState([
    { id: 1, message: 'New order #1234 received', time: '2 min ago' },
    { id: 2, message: 'Stock alert: Coffee beans low', time: '15 min ago' },
    { id: 3, message: 'Daily sales target achieved!', time: '1 hour ago' }
  ]);

  // Menu items based on user role
  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: <Link to="/dashboard">Dashboard</Link>,
      },
      {
        key: '/pos',
        icon: <ShoppingCartOutlined />,
        label: <Link to="/pos">POS Terminal</Link>,
      }
    ];

    if (user?.role === 'admin' || user?.role === 'manager') {
      baseItems.push(
        {
          key: '/products',
          icon: <ProductsOutlined />,
          label: <Link to="/products">Products</Link>,
        },
        {
          key: '/orders',
          icon: <ShoppingCartOutlined />,
          label: <Link to="/orders">Orders</Link>,
        },
        {
          key: '/customers',
          icon: <UserOutlined />,
          label: <Link to="/customers">Customers</Link>,
        },
        {
          key: '/staff',
          icon: <TeamOutlined />,
          label: <Link to="/staff">Staff</Link>,
        },
        {
          key: '/analytics',
          icon: <BarChartOutlined />,
          label: <Link to="/analytics">Analytics</Link>,
        },
        {
          key: '/settings',
          icon: <SettingOutlined />,
          label: <Link to="/settings">Settings</Link>,
        }
      );
    }

    return baseItems;
  };

  const handleLogout = async () => {
    try {
      await logout();
      notification.success({
        message: 'Logged out successfully',
        description: 'See you soon!',
      });
      navigate('/login');
    } catch (error) {
      notification.error({
        message: 'Logout failed',
        description: error.message,
      });
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  const notificationMenuItems = notifications.map(notification => ({
    key: notification.id,
    label: (
      <div style={{ width: 250 }}>
        <Text strong>{notification.message}</Text>
        <br />
        <Text type="secondary" style={{ fontSize: '12px' }}>
          {notification.time}
        </Text>
      </div>
    ),
  }));

  const siderContent = (
    <>
      <div 
        style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}
      >
        <ShopOutlined style={{ fontSize: '24px', marginRight: collapsed ? 0 : 8 }} />
        {!collapsed && <Text strong style={{ fontSize: '16px' }}>Enterprise POS</Text>}
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={getMenuItems()}
        style={{ borderRight: 0, flex: 1 }}
      />
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        className="desktop-sider"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 100,
          display: window.innerWidth >= 768 ? 'block' : 'none'
        }}
      >
        {siderContent}
      </Sider>

      {/* Header */}
      <Header
        style={{
          padding: '0 16px',
          background: darkMode ? '#001529' : '#fff',
          borderBottom: '1px solid #f0f0f0',
          position: 'fixed',
          top: 0,
          right: 0,
          left: window.innerWidth >= 768 ? (collapsed ? 80 : 200) : 0,
          zIndex: 99,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Space>
          {/* Mobile menu button */}
          <Button
            className="mobile-menu-button"
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setDrawerVisible(true)}
            style={{ 
              display: window.innerWidth < 768 ? 'inline-flex' : 'none' 
            }}
          />
          
          {/* Desktop collapse button */}
          <Button
            className="desktop-collapse-button"
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{ 
              display: window.innerWidth >= 768 ? 'inline-flex' : 'none' 
            }}
          />
        </Space>

        <Space size="middle">
          {/* Dark mode toggle */}
          <Space>
            <SunOutlined />
            <Switch
              checked={darkMode}
              onChange={setDarkMode}
              size="small"
            />
            <MoonOutlined />
          </Space>

          {/* Notifications */}
          <Dropdown
            menu={{ items: notificationMenuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Badge count={notifications.length} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                style={{ color: darkMode ? '#fff' : '#000' }}
              />
            </Badge>
          </Dropdown>

          {/* User menu */}
          <Dropdown
            menu={{ items: userMenuItems }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar 
                size="small" 
                icon={<UserOutlined />}
                src={user?.avatar}
              />
              <Text style={{ color: darkMode ? '#fff' : '#000' }}>
                {user?.name || 'User'}
              </Text>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      {/* Mobile Drawer */}
      <Drawer
        title="Enterprise POS"
        placement="left"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        bodyStyle={{ padding: 0 }}
        width={250}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={getMenuItems()}
          style={{ borderRight: 0 }}
        />
        
        <Divider />
        
        <div style={{ padding: '16px' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Space>
              <Avatar size="small" icon={<UserOutlined />} />
              <Text strong>{user?.name}</Text>
            </Space>
            <Text type="secondary">{user?.email}</Text>
            <Button 
              type="primary" 
              danger 
              icon={<LogoutOutlined />}
              onClick={handleLogout}
              block
            >
              Logout
            </Button>
          </Space>
        </div>
      </Drawer>

      <style jsx>{`
        @media (max-width: 767px) {
          .desktop-sider {
            display: none !important;
          }
          .desktop-collapse-button {
            display: none !important;
          }
        }
        
        @media (min-width: 768px) {
          .mobile-menu-button {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default Navigation;