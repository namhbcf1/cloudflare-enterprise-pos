/**
 * LoginForm Component
 * Responsive login form with validation, loading states, and error handling
 */

import React, { useState, useEffect } from 'react';
import { 
    Form, 
    Input, 
    Button, 
    Card, 
    Typography, 
    Space, 
    Divider,
    Alert,
    Checkbox,
    Row,
    Col,
    theme
} from 'antd';
import { 
    UserOutlined, 
    LockOutlined, 
    EyeOutlined, 
    EyeInvisibleOutlined,
    LoginOutlined,
    SafetyCertificateOutlined,
    ThunderboltOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text, Link } = Typography;
const { useToken } = theme;

const LoginForm = ({ onForgotPassword, onRegister, redirectPath = '/' }) => {
    const { login, isLoading, error, clearError } = useAuth();
    const { token } = useToken();
    const [form] = Form.useForm();
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'username'

    // Clear errors when component mounts or form changes
    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    // Handle form submission
    const handleSubmit = async (values) => {
        clearError();
        
        const credentials = {
            identifier: values.identifier,
            password: values.password,
            rememberMe
        };

        try {
            const result = await login(credentials);
            
            if (result.success) {
                // Store remember me preference
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                    localStorage.setItem('lastLogin', values.identifier);
                } else {
                    localStorage.removeItem('rememberMe');
                    localStorage.removeItem('lastLogin');
                }
                
                // Redirect will be handled by the auth context
                window.location.href = redirectPath;
            }
        } catch (err) {
            console.error('Login error:', err);
        }
    };

    // Load saved login preferences
    useEffect(() => {
        const savedRememberMe = localStorage.getItem('rememberMe') === 'true';
        const savedLogin = localStorage.getItem('lastLogin');
        
        if (savedRememberMe && savedLogin) {
            setRememberMe(true);
            form.setFieldValue('identifier', savedLogin);
        }
    }, [form]);

    // Handle demo login (for development/demo purposes)
    const handleDemoLogin = async (role) => {
        const demoCredentials = {
            admin: { identifier: 'admin@cloudflarepos.com', password: 'Admin123!' },
            manager: { identifier: 'manager@demo.com', password: 'Manager123!' },
            cashier: { identifier: 'cashier@demo.com', password: 'Cashier123!' },
            staff: { identifier: 'staff@demo.com', password: 'Staff123!' }
        };

        const credentials = demoCredentials[role];
        if (credentials) {
            form.setFieldsValue(credentials);
            await handleSubmit(credentials);
        }
    };

    const cardStyle = {
        maxWidth: 400,
        margin: '0 auto',
        background: token.colorBgContainer,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowTertiary
    };

    const headerStyle = {
        textAlign: 'center',
        marginBottom: token.marginLG,
        background: `linear-gradient(135deg, ${token.colorPrimary}, ${token.colorPrimaryActive})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text'
    };

    return (
        <div style={{ 
            minHeight: '100vh', 
            background: `linear-gradient(135deg, ${token.colorBgBase} 0%, ${token.colorFillQuaternary} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: token.padding
        }}>
            <Card style={cardStyle} bodyStyle={{ padding: token.paddingXL }}>
                {/* Header */}
                <div style={headerStyle}>
                    <ThunderboltOutlined style={{ fontSize: 48, marginBottom: 16, color: token.colorPrimary }} />
                    <Title level={2} style={{ margin: 0, ...headerStyle }}>
                        Cloudflare POS
                    </Title>
                    <Text type="secondary">
                        Hệ thống bán hàng thông minh
                    </Text>
                </div>

                {/* Error Alert */}
                {error && (
                    <Alert
                        message="Đăng nhập thất bại"
                        description={error}
                        type="error"
                        showIcon
                        closable
                        onClose={clearError}
                        style={{ marginBottom: token.marginMD }}
                    />
                )}

                {/* Login Form */}
                <Form
                    form={form}
                    name="login"
                    size="large"
                    onFinish={handleSubmit}
                    autoComplete="off"
                    layout="vertical"
                >
                    {/* Login Method Selector */}
                    <div style={{ marginBottom: token.marginMD, textAlign: 'center' }}>
                        <Button.Group>
                            <Button 
                                type={loginMethod === 'email' ? 'primary' : 'default'}
                                onClick={() => setLoginMethod('email')}
                                size="small"
                            >
                                Email
                            </Button>
                            <Button 
                                type={loginMethod === 'username' ? 'primary' : 'default'}
                                onClick={() => setLoginMethod('username')}
                                size="small"
                            >
                                Username
                            </Button>
                        </Button.Group>
                    </div>

                    {/* Email/Username Input */}
                    <Form.Item
                        name="identifier"
                        label={loginMethod === 'email' ? 'Email' : 'Tên đăng nhập'}
                        rules={[
                            {
                                required: true,
                                message: `Vui lòng nhập ${loginMethod === 'email' ? 'email' : 'tên đăng nhập'}!`
                            },
                            loginMethod === 'email' ? {
                                type: 'email',
                                message: 'Email không hợp lệ!'
                            } : null
                        ].filter(Boolean)}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: token.colorTextTertiary }} />}
                            placeholder={loginMethod === 'email' ? 'your@email.com' : 'Tên đăng nhập'}
                            autoComplete={loginMethod === 'email' ? 'email' : 'username'}
                        />
                    </Form.Item>

                    {/* Password Input */}
                    <Form.Item
                        name="password"
                        label="Mật khẩu"
                        rules={[
                            {
                                required: true,
                                message: 'Vui lòng nhập mật khẩu!'
                            }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />}
                            placeholder="Mật khẩu"
                            autoComplete="current-password"
                            iconRender={(visible) => 
                                visible ? <EyeOutlined /> : <EyeInvisibleOutlined />
                            }
                            visibilityToggle={{
                                visible: showPassword,
                                onVisibleChange: setShowPassword
                            }}
                        />
                    </Form.Item>

                    {/* Remember Me & Forgot Password */}
                    <Form.Item style={{ marginBottom: token.marginLG }}>
                        <Row justify="space-between" align="middle">
                            <Col>
                                <Checkbox 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                >
                                    Ghi nhớ đăng nhập
                                </Checkbox>
                            </Col>
                            <Col>
                                <Link onClick={onForgotPassword}>
                                    Quên mật khẩu?
                                </Link>
                            </Col>
                        </Row>
                    </Form.Item>

                    {/* Login Button */}
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<LoginOutlined />}
                            loading={isLoading}
                            block
                            style={{ 
                                height: 48,
                                fontSize: 16,
                                fontWeight: 500
                            }}
                        >
                            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                        </Button>
                    </Form.Item>
                </Form>

                {/* Demo Logins (Development Mode) */}
                {process.env.NODE_ENV === 'development' && (
                    <>
                        <Divider>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                Demo Accounts
                            </Text>
                        </Divider>
                        
                        <Space direction="vertical" style={{ width: '100%' }} size="small">
                            <Row gutter={8}>
                                <Col span={12}>
                                    <Button 
                                        size="small" 
                                        block 
                                        onClick={() => handleDemoLogin('admin')}
                                        disabled={isLoading}
                                    >
                                        Admin
                                    </Button>
                                </Col>
                                <Col span={12}>
                                    <Button 
                                        size="small" 
                                        block 
                                        onClick={() => handleDemoLogin('manager')}
                                        disabled={isLoading}
                                    >
                                        Manager
                                    </Button>
                                </Col>
                            </Row>
                            <Row gutter={8}>
                                <Col span={12}>
                                    <Button 
                                        size="small" 
                                        block 
                                        onClick={() => handleDemoLogin('cashier')}
                                        disabled={isLoading}
                                    >
                                        Cashier
                                    </Button>
                                </Col>
                                <Col span={12}>
                                    <Button 
                                        size="small" 
                                        block 
                                        onClick={() => handleDemoLogin('staff')}
                                        disabled={isLoading}
                                    >
                                        Staff
                                    </Button>
                                </Col>
                            </Row>
                        </Space>
                    </>
                )}

                {/* Security Notice */}
                <div style={{ 
                    marginTop: token.marginLG, 
                    textAlign: 'center',
                    padding: token.paddingSM,
                    background: token.colorFillAlter,
                    borderRadius: token.borderRadius
                }}>
                    <SafetyCertificateOutlined style={{ color: token.colorSuccess, marginRight: 8 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        Kết nối được bảo mật bởi Cloudflare SSL
                    </Text>
                </div>

                {/* Register Link */}
                {onRegister && (
                    <>
                        <Divider />
                        <div style={{ textAlign: 'center' }}>
                            <Text type="secondary">
                                Chưa có tài khoản?{' '}
                                <Link onClick={onRegister}>
                                    Đăng ký ngay
                                </Link>
                            </Text>
                        </div>
                    </>
                )}

                {/* Footer */}
                <div style={{ 
                    marginTop: token.marginXL,
                    textAlign: 'center',
                    borderTop: `1px solid ${token.colorBorderSecondary}`,
                    paddingTop: token.paddingMD
                }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        Powered by{' '}
                        <Link href="https://cloudflare.com" target="_blank">
                            Cloudflare Workers
                        </Link>
                        {' '}• Version 1.0.0
                    </Text>
                </div>
            </Card>
        </div>
    );
};

export default LoginForm;