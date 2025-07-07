import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Divider,
  Space,
  Checkbox,
  Alert,
  Row,
  Col,
  Spin,
  QRCode,
  Modal,
  notification
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MobileOutlined,
  QrcodeOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  ShopOutlined
} from '@ant-design/icons';
import { AuthContext } from '../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useContext(AuthContext);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email', 'qr', 'demo'
  const [qrVisible, setQrVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Demo accounts
  const demoAccounts = [
    { role: 'admin', email: 'admin@pos.com', password: 'admin123', name: 'Admin User' },
    { role: 'manager', email: 'manager@pos.com', password: 'manager123', name: 'Store Manager' },
    { role: 'cashier', email: 'cashier@pos.com', password: 'cashier123', name: 'Cashier' },
    { role: 'staff', email: 'staff@pos.com', password: 'staff123', name: 'Staff Member' }
  ];

  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate('/dashboard');
    }

    // Load saved credentials if remember me was checked
    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedPassword = localStorage.getItem('rememberedPassword');
    if (savedEmail) {
      form.setFieldsValue({ email: savedEmail });
      setRememberMe(true);
      if (savedPassword) {
        form.setFieldsValue({ password: savedPassword });
      }
    }
  }, [user, navigate, form]);

  const handleLogin = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      
      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', values.email);
        localStorage.setItem('rememberedPassword', values.password);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedPassword');
      }

      notification.success({
        message: 'Login Successful',
        description: 'Welcome back to Enterprise POS!',
      });
      
      navigate('/dashboard');
    } catch (error) {
      notification.error({
        message: 'Login Failed',
        description: error.message || 'Invalid email or password',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account) => {
    setLoading(true);
    try {
      form.setFieldsValue({
        email: account.email,
        password: account.password
      });
      
      await login(account.email, account.password);
      
      notification.success({
        message: 'Demo Login Successful',
        description: `Logged in as ${account.name} (${account.role})`,
      });
      
      navigate('/dashboard');
    } catch (error) {
      notification.error({
        message: 'Demo Login Failed',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = () => {
    const qrData = {
      type: 'pos_login',
      timestamp: Date.now(),
      app: 'enterprise-pos'
    };
    return JSON.stringify(qrData);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <Row justify="center" style={{ width: '100%', maxWidth: 1200 }}>
        <Col xs={24} sm={20} md={16} lg={12} xl={10}>
          <Card
            style={{
              borderRadius: 16,
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
              border: 'none'
            }}
          >
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ 
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                borderRadius: '50%',
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <ShopOutlined style={{ fontSize: 40, color: 'white' }} />
              </div>
              <Title level={2} style={{ margin: 0, color: '#1f2937' }}>
                Enterprise POS
              </Title>
              <Text type="secondary">
                Welcome back! Please sign in to your account
              </Text>
            </div>

            {/* Login Methods Toggle */}
            <div style={{ marginBottom: 24 }}>
              <Row gutter={8}>
                <Col span={8}>
                  <Button
                    block
                    type={loginMethod === 'email' ? 'primary' : 'default'}
                    icon={<UserOutlined />}
                    onClick={() => setLoginMethod('email')}
                  >
                    Email
                  </Button>
                </Col>
                <Col span={8}>
                  <Button
                    block
                    type={loginMethod === 'qr' ? 'primary' : 'default'}
                    icon={<QrcodeOutlined />}
                    onClick={() => setLoginMethod('qr')}
                  >
                    QR Code
                  </Button>
                </Col>
                <Col span={8}>
                  <Button
                    block
                    type={loginMethod === 'demo' ? 'primary' : 'default'}
                    icon={<MobileOutlined />}
                    onClick={() => setLoginMethod('demo')}
                  >
                    Demo
                  </Button>
                </Col>
              </Row>
            </div>

            {/* Email Login Form */}
            {loginMethod === 'email' && (
              <Form
                form={form}
                name="login"
                onFinish={handleLogin}
                layout="vertical"
                size="large"
              >
                <Form.Item
                  name="email"
                  label="Email Address"
                  rules={[
                    { required: true, message: 'Please enter your email!' },
                    { type: 'email', message: 'Please enter a valid email!' }
                  ]}
                >
                  <Input
                    prefix={<UserOutlined />}
                    placeholder="admin@pos.com"
                    autoComplete="email"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: true, message: 'Please enter your password!' }]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Password"
                    autoComplete="current-password"
                    iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                  />
                </Form.Item>

                <Form.Item>
                  <Row justify="space-between" align="middle">
                    <Checkbox 
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    >
                      Remember me
                    </Checkbox>
                    <Link to="/forgot-password" style={{ color: '#667eea' }}>
                      Forgot password?
                    </Link>
                  </Row>
                </Form.Item>

                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    block
                    loading={loading}
                    style={{ 
                      height: 48,
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
                      border: 'none'
                    }}
                  >
                    Sign In
                  </Button>
                </Form.Item>
              </Form>
            )}

            {/* QR Code Login */}
            {loginMethod === 'qr' && (
              <div style={{ textAlign: 'center' }}>
                <Paragraph type="secondary">
                  Scan this QR code with the Enterprise POS mobile app
                </Paragraph>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  margin: '24px 0',
                  padding: 16,
                  background: '#f8f9fa',
                  borderRadius: 8
                }}>
                  <QRCode value={generateQRCode()} size={200} />
                </div>
                <Button
                  type="link"
                  onClick={() => setQrVisible(true)}
                >
                  Refresh QR Code
                </Button>
              </div>
            )}

            {/* Demo Login */}
            {loginMethod === 'demo' && (
              <div>
                <Alert
                  message="Demo Mode"
                  description="Choose a demo account to explore the system"
                  type="info"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
                
                <Space direction="vertical" style={{ width: '100%' }}>
                  {demoAccounts.map((account) => (
                    <Button
                      key={account.role}
                      block
                      size="large"
                      loading={loading}
                      onClick={() => handleDemoLogin(account)}
                      style={{
                        height: 'auto',
                        padding: '12px 16px',
                        textAlign: 'left'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold' }}>
                          {account.name}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {account.email} • {account.role.toUpperCase()}
                        </div>
                      </div>
                    </Button>
                  ))}
                </Space>
              </div>
            )}

            <Divider>
              <Text type="secondary">Quick Start</Text>
            </Divider>

            {/* Quick Login Hints */}
            <div style={{ textAlign: 'center' }}>
              <Space direction="vertical" size="small">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Default Admin: admin@pos.com / admin123
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Manager: manager@pos.com / manager123
                </Text>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Cashier: cashier@pos.com / cashier123
                </Text>
              </Space>
            </div>

            {/* Footer */}
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Powered by Cloudflare Edge • 100% Free Tier
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255,255,255,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <Spin size="large" />
        </div>
      )}
    </div>
  );
};

export default Login;