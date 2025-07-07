import React, { useState, useEffect, useCallback } from 'react';
import {
    Layout,
    Drawer,
    Menu,
    Button,
    Avatar,
    Badge,
    FloatButton,
    Space,
    Typography,
    Divider,
    Switch,
    Card,
    Row,
    Col,
    message,
    Dropdown
} from 'antd';
import {
    MenuOutlined,
    HomeOutlined,
    ShoppingCartOutlined,
    BarChartOutlined,
    TeamOutlined,
    SettingOutlined,
    BellOutlined,
    ScanOutlined,
    PlusOutlined,
    UserOutlined,
    LogoutOutlined,
    WifiOutlined,
    MoonOutlined,
    SunOutlined,
    SearchOutlined,
    CloseOutlined,
    InstagramOutlined,
    DownloadOutlined,
    ReloadOutlined
} from '@ant-design/icons';

const { Header, Content } = Layout;
const { Text } = Typography;

// Mock auth context
const useAuth = () => ({
    user: { name: 'John Doe', avatar: null, role: 'user' },
    logout: () => message.success('Đăng xuất thành công'),
    hasPermission: (permission) => true
});

const MobileLayout = ({ 
    children, 
    currentPath = '/',
    onThemeChange,
    darkMode = false 
}) => {
    const { user, logout, hasPermission } = useAuth();

    // Mobile state
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isInstallable, setIsInstallable] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [pullToRefresh, setPullToRefresh] = useState(false);
    const [notifications, setNotifications] = useState(3);

    // Device detection
    const [deviceInfo, setDeviceInfo] = useState({
        isMobile: false,
        isTablet: false,
        isTouch: false,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    });

    // Detect device type and capabilities
    useEffect(() => {
        const checkDevice = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            
            setDeviceInfo({
                isMobile: width <= 768,
                isTablet: width > 768 && width <= 1024,
                isTouch,
                screenWidth: width,
                screenHeight: height,
                orientation: width > height ? 'landscape' : 'portrait'
            });
        };

        checkDevice();
        window.addEventListener('resize', checkDevice);
        window.addEventListener('orientationchange', checkDevice);

        return () => {
            window.removeEventListener('resize', checkDevice);
            window.removeEventListener('orientationchange', checkDevice);
        };
    }, []);

    // Network status monitoring
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            message.success('Kết nối mạng đã được khôi phục');
        };
        const handleOffline = () => {
            setIsOnline(false);
            message.warning('Mất kết nối mạng');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // PWA install prompt
    useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    // Touch gestures for navigation
    useEffect(() => {
        let startY = 0;
        let currentY = 0;
        let startTime = 0;

        const handleTouchStart = (e) => {
            startY = e.touches[0].clientY;
            startTime = Date.now();
        };

        const handleTouchMove = (e) => {
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            // Pull to refresh logic
            if (diff > 0 && window.scrollY === 0 && diff > 80) {
                setPullToRefresh(true);
            }
        };

        const handleTouchEnd = () => {
            if (pullToRefresh) {
                handleRefresh();
                setPullToRefresh(false);
            }
        };

        if (deviceInfo.isTouch) {
            document.addEventListener('touchstart', handleTouchStart, { passive: true });
            document.addEventListener('touchmove', handleTouchMove, { passive: true });
            document.addEventListener('touchend', handleTouchEnd, { passive: true });
        }

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [deviceInfo.isTouch, pullToRefresh]);

    // Handle PWA installation
    const handleInstallPWA = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                message.success('Ứng dụng đã được cài đặt thành công!');
                setIsInstallable(false);
            }
            setDeferredPrompt(null);
        }
    };

    // Handle refresh
    const handleRefresh = () => {
        message.loading('Đang làm mới...', 1);
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    // Menu items
    const menuItems = [
        {
            key: '/',
            icon: <HomeOutlined />,
            label: 'Trang chủ',
            path: '/'
        },
        {
            key: '/products',
            icon: <ShoppingCartOutlined />,
            label: 'Sản phẩm',
            path: '/products'
        },
        {
            key: '/analytics',
            icon: <BarChartOutlined />,
            label: 'Thống kê',
            path: '/analytics'
        },
        {
            key: '/team',
            icon: <TeamOutlined />,
            label: 'Nhóm',
            path: '/team'
        },
        {
            key: '/settings',
            icon: <SettingOutlined />,
            label: 'Cài đặt',
            path: '/settings'
        }
    ];

    // User menu items
    const userMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Hồ sơ cá nhân',
        },
        {
            key: 'settings',
            icon: <SettingOutlined />,
            label: 'Cài đặt',
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            onClick: logout
        }
    ];

    const handleMenuClick = (item) => {
        setDrawerVisible(false);
        message.info(`Điều hướng đến: ${item.label}`);
    };

    const closeDrawer = () => {
        setDrawerVisible(false);
    };

    // Dynamic styling based on device
    const getHeaderStyle = () => ({
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: '0 16px',
        height: deviceInfo.isMobile ? '56px' : '64px',
        lineHeight: deviceInfo.isMobile ? '56px' : '64px',
        background: darkMode ? '#001529' : '#fff',
        borderBottom: `1px solid ${darkMode ? '#303030' : '#f0f0f0'}`,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    });

    const getContentStyle = () => ({
        marginTop: deviceInfo.isMobile ? '56px' : '64px',
        minHeight: `calc(100vh - ${deviceInfo.isMobile ? '56px' : '64px'})`,
        padding: deviceInfo.isMobile ? '12px' : '24px',
        background: darkMode ? '#000' : '#f5f5f5'
    });

    return (
        <Layout style={{ minHeight: '100vh', background: darkMode ? '#000' : '#f5f5f5' }}>
            {/* Pull to refresh indicator */}
            {pullToRefresh && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 9999,
                    background: '#1890ff',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '0 0 8px 8px',
                    fontSize: '12px'
                }}>
                    <ReloadOutlined spin /> Thả để làm mới
                </div>
            )}

            {/* Header */}
            <Header style={getHeaderStyle()}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Space>
                        <Button 
                            type="text" 
                            icon={<MenuOutlined />} 
                            onClick={() => setDrawerVisible(true)}
                            style={{ color: darkMode ? '#fff' : '#000' }}
                        />
                        <Text strong style={{ color: darkMode ? '#fff' : '#000', fontSize: deviceInfo.isMobile ? '16px' : '18px' }}>
                            MyApp
                        </Text>
                    </Space>

                    <Space>
                        {!isOnline && (
                            <WifiOutlined style={{ color: '#ff4d4f' }} />
                        )}
                        
                        <Badge count={notifications} size="small">
                            <Button 
                                type="text" 
                                icon={<BellOutlined />}
                                style={{ color: darkMode ? '#fff' : '#000' }}
                            />
                        </Badge>

                        <Dropdown 
                            menu={{ items: userMenuItems }}
                            trigger={['click']}
                            placement="bottomRight"
                        >
                            <Avatar 
                                size={deviceInfo.isMobile ? 32 : 40}
                                icon={<UserOutlined />}
                                style={{ cursor: 'pointer' }}
                            />
                        </Dropdown>
                    </Space>
                </div>
            </Header>

            {/* Navigation Drawer */}
            <Drawer
                title={
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Space>
                            <Avatar icon={<UserOutlined />} />
                            <div>
                                <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                                <div style={{ fontSize: '12px', color: '#888' }}>
                                    {deviceInfo.isMobile ? 'Mobile' : 'Desktop'} • {deviceInfo.orientation}
                                </div>
                            </div>
                        </Space>
                        <Button 
                            type="text" 
                            icon={<CloseOutlined />} 
                            onClick={closeDrawer}
                        />
                    </div>
                }
                placement="left"
                width={deviceInfo.isMobile ? '80%' : 320}
                onClose={closeDrawer}
                open={drawerVisible}
                closable={false}
                styles={{
                    body: { padding: 0 }
                }}
            >
                <div style={{ padding: '16px' }}>
                    {/* Status indicators */}
                    <Card size="small" style={{ marginBottom: '16px' }}>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Space>
                                    <WifiOutlined style={{ color: isOnline ? '#52c41a' : '#ff4d4f' }} />
                                    <Text style={{ fontSize: '12px' }}>
                                        {isOnline ? 'Online' : 'Offline'}
                                    </Text>
                                </Space>
                            </Col>
                            <Col span={12}>
                                <Space>
                                    <Switch 
                                        checkedChildren={<MoonOutlined />}
                                        unCheckedChildren={<SunOutlined />}
                                        checked={darkMode}
                                        onChange={onThemeChange}
                                        size="small"
                                    />
                                    <Text style={{ fontSize: '12px' }}>Theme</Text>
                                </Space>
                            </Col>
                        </Row>
                    </Card>

                    {/* PWA Install prompt */}
                    {isInstallable && (
                        <Card size="small" style={{ marginBottom: '16px' }}>
                            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: '12px' }}>Cài đặt ứng dụng</Text>
                                <Button 
                                    size="small" 
                                    type="primary" 
                                    icon={<DownloadOutlined />}
                                    onClick={handleInstallPWA}
                                >
                                    Cài đặt
                                </Button>
                            </Space>
                        </Card>
                    )}
                </div>

                <Divider style={{ margin: 0 }} />

                {/* Navigation Menu */}
                <Menu
                    mode="inline"
                    selectedKeys={[currentPath]}
                    style={{ border: 'none' }}
                >
                    {menuItems.map(item => (
                        <Menu.Item 
                            key={item.key} 
                            icon={item.icon}
                            onClick={() => handleMenuClick(item)}
                        >
                            {item.label}
                        </Menu.Item>
                    ))}
                </Menu>
            </Drawer>

            {/* Main Content */}
            <Content style={getContentStyle()}>
                {children || (
                    <div>
                        <Card>
                            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                <h2>Welcome to Mobile Layout</h2>
                                <p>Device Info:</p>
                                <ul style={{ textAlign: 'left', maxWidth: '300px', margin: '0 auto' }}>
                                    <li>Screen: {deviceInfo.screenWidth} x {deviceInfo.screenHeight}</li>
                                    <li>Type: {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}</li>
                                    <li>Touch: {deviceInfo.isTouch ? 'Yes' : 'No'}</li>
                                    <li>Orientation: {deviceInfo.orientation}</li>
                                    <li>Network: {isOnline ? 'Online' : 'Offline'}</li>
                                </ul>
                            </div>
                        </Card>
                    </div>
                )}
            </Content>

            {/* Floating Action Buttons */}
            <FloatButton.Group
                trigger="hover"
                type="primary"
                style={{ right: 24, bottom: 24 }}
                icon={<PlusOutlined />}
            >
                <FloatButton 
                    icon={<SearchOutlined />} 
                    tooltip="Tìm kiếm"
                    onClick={() => message.info('Mở tìm kiếm')}
                />
                <FloatButton 
                    icon={<ScanOutlined />} 
                    tooltip="Quét QR"
                    onClick={() => message.info('Mở máy quét QR')}
                />
                <FloatButton 
                    icon={<ReloadOutlined />} 
                    tooltip="Làm mới"
                    onClick={handleRefresh}
                />
            </FloatButton.Group>
        </Layout>
    );
};

export default MobileLayout;