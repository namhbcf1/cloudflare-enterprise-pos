/**
 * Header Component
 * Navigation header with user profile, notifications, and role-based menu
 */

import React, { useState, useEffect } from 'react';
import {
    Layout,
    Space,
    Typography,
    Avatar,
    Dropdown,
    Button,
    Badge,
    Drawer,
    Menu,
    Switch,
    Divider,
    Row,
    Col,
    Card,
    List,
    Empty,
    theme,
    Tooltip
} from 'antd';
import {
    UserOutlined,
    LogoutOutlined,
    SettingOutlined,
    BellOutlined,
    MenuOutlined,
    ThunderboltOutlined,
    DashboardOutlined,
    ShoppingCartOutlined,
    TeamOutlined,
    BarChartOutlined,
    GiftOutlined,
    TrophyOutlined,
    SunOutlined,
    MoonOutlined,
    GlobalOutlined,
    WifiOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { useAuth, USER_ROLES } from '../../contexts/AuthContext';

const { Header: AntHeader } = Layout;
const { Text, Title } = Typography;
const { useToken } = theme;

const Header = ({ 
    collapsed, 
    onToggle, 
    darkMode, 
    onThemeChange,
    notifications = [],
    onNotificationRead,
    showMobileMenu = false 
}) => {
    const { user, logout, hasRole, hasPermission } = useAuth();
    const { token } = useToken();
    const [notificationDrawer, setNotificationDrawer] = useState(false);
    const [profileDrawer, setProfileDrawer] = useState(false);
    const [onlineStatus, setOnlineStatus] = useState(navigator.onLine);

    // Monitor online status
    useEffect(() => {
        const handleOnline = () => setOnlineStatus(true);
        const handleOffline = () => setOnlineStatus(false);
        
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Get unread notifications count
    const unreadCount = notifications.filter(n => !n.read).length;

    // Handle logout
    const handleLogout = async () => {
        try {
            await logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // User role badge color
    const getRoleBadgeColor = (role) => {
        const colors = {
            [USER_ROLES.ADMIN]: '#ff4d4f',
            [USER_ROLES.MANAGER]: '#1890ff',
            [USER_ROLES.CASHIER]: '#52c41a',
            [USER_ROLES.STAFF]: '#faad14'
        };
        return colors[role] || '#d9d9d9';
    };

    // User role display name
    const getRoleDisplayName = (role) => {
        const names = {
            [USER_ROLES.ADMIN]: 'Quản trị viên',
            [USER_ROLES.MANAGER]: 'Quản lý',
            [USER_ROLES.CASHIER]: 'Thu ngân',
            [USER_ROLES.STAFF]: 'Nhân viên'
        };
        return names[role] || role;
    };

    // Quick actions based on role
    const getQuickActions = () => {
        const actions = [];
        
        if (hasPermission('process_transactions')) {
            actions.push({
                key: 'pos',
                icon: <ShoppingCartOutlined />,
                label: 'Bán hàng',
                path: '/pos'
            });
        }
        
        if (hasPermission('view_reports')) {
            actions.push({
                key: 'reports',
                icon: <BarChartOutlined />,
                label: 'Báo cáo',
                path: '/reports'
            });
        }
        
        if (hasRole(USER_ROLES.ADMIN)) {
            actions.push({
                key: 'admin',
                icon: <SettingOutlined />,
                label: 'Quản trị',
                path: '/admin'
            });
        }
        
        return actions;
    };

    // Profile dropdown menu
    const profileMenu = {
        items: [
            {
                key: 'profile',
                icon: <UserOutlined />,
                label: 'Thông tin cá nhân',
                onClick: () => setProfileDrawer(true)
            },
            {
                key: 'settings',
                icon: <SettingOutlined />,
                label: 'Cài đặt',
                onClick: () => window.location.href = '/settings'
            },
            {
                type: 'divider'
            },
            {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Đăng xuất',
                onClick: handleLogout
            }
        ]
    };

    // Notification item component
    const NotificationItem = ({ notification }) => (
        <List.Item
            actions={[
                <Button 
                    type="link" 
                    size="small"
                    onClick={() => onNotificationRead?.(notification.id)}
                >
                    {notification.read ? 'Đã đọc' : 'Đánh dấu đã đọc'}
                </Button>
            ]}
            style={{
                backgroundColor: notification.read ? 'transparent' : token.colorFillAlter,
                padding: token.paddingSM,
                borderRadius: token.borderRadius
            }}
        >
            <List.Item.Meta
                avatar={
                    <Avatar 
                        icon={notification.icon || <BellOutlined />} 
                        style={{ backgroundColor: notification.color || token.colorPrimary }}
                    />
                }
                title={
                    <Space>
                        <Text strong={!notification.read}>
                            {notification.title}
                        </Text>
                        {!notification.read && (
                            <Badge status="processing" />
                        )}
                    </Space>
                }
                description={
                    <Space direction="vertical" size={4}>
                        <Text type="secondary">
                            {notification.message}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {notification.timestamp}
                        </Text>
                    </Space>
                }
            />
        </List.Item>
    );

    // Header style
    const headerStyle = {
        background: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        padding: `0 ${token.paddingLG}px`,
        height: 64,
        lineHeight: '64px',
        boxShadow: token.boxShadowTertiary
    };

    return (
        <>
            <AntHeader style={headerStyle}>
                <Row justify="space-between" align="middle" style={{ height: '100%' }}>
                    {/* Left side - Logo and Menu Toggle */}
                    <Col>
                        <Space size="large">
                            {/* Mobile menu toggle */}
                            <Button
                                type="text"
                                icon={<MenuOutlined />}
                                onClick={onToggle}
                                style={{ 
                                    fontSize: 16,
                                    width: 40,
                                    height: 40
                                }}
                            />
                            
                            {/* Logo */}
                            <Space>
                                <ThunderboltOutlined 
                                    style={{ 
                                        fontSize: 24, 
                                        color: token.colorPrimary 
                                    }} 
                                />
                                <Title 
                                    level={4} 
                                    style={{ 
                                        margin: 0,
                                        background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent',
                                        backgroundClip: 'text'
                                    }}
                                >
                                    Cloudflare POS
                                </Title>
                            </Space>
                        </Space>
                    </Col>

                    {/* Right side - Actions and User Menu */}
                    <Col>
                        <Space size="middle">
                            {/* Online Status Indicator */}
                            <Tooltip title={onlineStatus ? 'Đang trực tuyến' : 'Đang ngoại tuyến'}>
                                <Badge 
                                    status={onlineStatus ? 'success' : 'error'} 
                                    text={
                                        <WifiOutlined 
                                            style={{ 
                                                color: onlineStatus ? token.colorSuccess : token.colorError 
                                            }} 
                                        />
                                    }
                                />
                            </Tooltip>

                            {/* Theme Toggle */}
                            <Tooltip title={darkMode ? 'Chế độ sáng' : 'Chế độ tối'}>
                                <Switch
                                    checked={darkMode}
                                    onChange={onThemeChange}
                                    checkedChildren={<MoonOutlined />}
                                    unCheckedChildren={<SunOutlined />}
                                />
                            </Tooltip>

                            {/* Quick Actions */}
                            {getQuickActions().map(action => (
                                <Tooltip key={action.key} title={action.label}>
                                    <Button
                                        type="text"
                                        icon={action.icon}
                                        onClick={() => window.location.href = action.path}
                                        style={{ 
                                            fontSize: 16,
                                            width: 40,
                                            height: 40
                                        }}
                                    />
                                </Tooltip>
                            ))}

                            {/* Notifications */}
                            <Badge count={unreadCount} size="small">
                                <Button
                                    type="text"
                                    icon={<BellOutlined />}
                                    onClick={() => setNotificationDrawer(true)}
                                    style={{ 
                                        fontSize: 16,
                                        width: 40,
                                        height: 40
                                    }}
                                />
                            </Badge>

                            {/* User Profile */}
                            <Dropdown menu={profileMenu} placement="bottomRight">
                                <Space 
                                    style={{ 
                                        cursor: 'pointer',
                                        padding: `${token.paddingXS}px ${token.paddingSM}px`,
                                        borderRadius: token.borderRadius,
                                        ':hover': {
                                            backgroundColor: token.colorFillQuaternary
                                        }
                                    }}
                                >
                                    <Avatar 
                                        src={user?.avatarUrl}
                                        icon={<UserOutlined />}
                                        style={{ 
                                            backgroundColor: getRoleBadgeColor(user?.role) 
                                        }}
                                    />
                                    <Space direction="vertical" size={0}>
                                        <Text strong style={{ fontSize: 14 }}>
                                            {user?.fullName || user?.username}
                                        </Text>
                                        <Text 
                                            type="secondary" 
                                            style={{ 
                                                fontSize: 11,
                                                color: getRoleBadgeColor(user?.role)
                                            }}
                                        >
                                            {getRoleDisplayName(user?.role)}
                                        </Text>
                                    </Space>
                                </Space>
                            </Dropdown>
                        </Space>
                    </Col>
                </Row>
            </AntHeader>

            {/* Notifications Drawer */}
            <Drawer
                title={
                    <Space>
                        <BellOutlined />
                        <span>Thông báo</span>
                        {unreadCount > 0 && (
                            <Badge count={unreadCount} />
                        )}
                    </Space>
                }
                placement="right"
                width={400}
                open={notificationDrawer}
                onClose={() => setNotificationDrawer(false)}
                extra={
                    unreadCount > 0 && (
                        <Button 
                            type="link" 
                            size="small"
                            onClick={() => {
                                notifications.forEach(n => !n.read && onNotificationRead?.(n.id));
                            }}
                        >
                            Đánh dấu tất cả đã đọc
                        </Button>
                    )
                }
            >
                {notifications.length > 0 ? (
                    <List
                        dataSource={notifications}
                        renderItem={(notification) => (
                            <NotificationItem 
                                key={notification.id} 
                                notification={notification} 
                            />
                        )}
                        split={false}
                    />
                ) : (
                    <Empty 
                        description="Không có thông báo mới"
                        image={<BellOutlined style={{ fontSize: 48, color: token.colorTextTertiary }} />}
                    />
                )}
            </Drawer>

            {/* Profile Drawer */}
            <Drawer
                title={
                    <Space>
                        <UserOutlined />
                        <span>Thông tin cá nhân</span>
                    </Space>
                }
                placement="right"
                width={400}
                open={profileDrawer}
                onClose={() => setProfileDrawer(false)}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* User Info Card */}
                    <Card>
                        <Space direction="vertical" style={{ width: '100%' }} size="middle">
                            <div style={{ textAlign: 'center' }}>
                                <Avatar 
                                    size={80}
                                    src={user?.avatarUrl}
                                    icon={<UserOutlined />}
                                    style={{ 
                                        backgroundColor: getRoleBadgeColor(user?.role),
                                        marginBottom: token.marginSM
                                    }}
                                />
                                <Title level={4} style={{ margin: 0 }}>
                                    {user?.fullName}
                                </Title>
                                <Text 
                                    type="secondary"
                                    style={{ 
                                        color: getRoleBadgeColor(user?.role),
                                        fontWeight: 500
                                    }}
                                >
                                    {getRoleDisplayName(user?.role)}
                                </Text>
                            </div>
                            
                            <Divider />
                            
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Row justify="space-between">
                                    <Text type="secondary">Email:</Text>
                                    <Text strong>{user?.email}</Text>
                                </Row>
                                <Row justify="space-between">
                                    <Text type="secondary">Tên đăng nhập:</Text>
                                    <Text strong>{user?.username}</Text>
                                </Row>
                                <Row justify="space-between">
                                    <Text type="secondary">Đăng nhập lần cuối:</Text>
                                    <Text>{user?.lastLogin ? new Date(user.lastLogin).toLocaleString('vi-VN') : 'Chưa có'}</Text>
                                </Row>
                                <Row justify="space-between">
                                    <Text type="secondary">Ngày tạo:</Text>
                                    <Text>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}</Text>
                                </Row>
                            </Space>
                        </Space>
                    </Card>

                    {/* Quick Actions */}
                    <Card title="Thao tác nhanh">
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <Button 
                                block 
                                icon={<SettingOutlined />}
                                onClick={() => {
                                    setProfileDrawer(false);
                                    window.location.href = '/settings';
                                }}
                            >
                                Cài đặt tài khoản
                            </Button>
                            <Button 
                                block 
                                icon={<TrophyOutlined />}
                                onClick={() => {
                                    setProfileDrawer(false);
                                    window.location.href = '/achievements';
                                }}
                            >
                                Thành tích
                            </Button>
                            <Button 
                                block 
                                danger 
                                icon={<LogoutOutlined />}
                                onClick={() => {
                                    setProfileDrawer(false);
                                    handleLogout();
                                }}
                            >
                                Đăng xuất
                            </Button>
                        </Space>
                    </Card>

                    {/* System Status */}
                    <Card title="Trạng thái hệ thống" size="small">
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <Row justify="space-between">
                                <Text type="secondary">Kết nối:</Text>
                                <Badge 
                                    status={onlineStatus ? 'success' : 'error'} 
                                    text={onlineStatus ? 'Trực tuyến' : 'Ngoại tuyến'}
                                />
                            </Row>
                            <Row justify="space-between">
                                <Text type="secondary">Phiên bản:</Text>
                                <Text>v1.0.0</Text>
                            </Row>
                            <Row justify="space-between">
                                <Text type="secondary">Máy chủ:</Text>
                                <Text>Cloudflare Edge</Text>
                            </Row>
                        </Space>
                    </Card>
                </Space>
            </Drawer>
        </>
    );
};

export default Header;