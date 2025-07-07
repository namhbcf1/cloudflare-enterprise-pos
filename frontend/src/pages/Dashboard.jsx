import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  Space,
  Button,
  Alert,
  Progress,
  Avatar,
  List,
  Tag,
  Divider,
  Timeline,
  Badge
} from 'antd';
import {
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  ClockCircleOutlined,
  BellOutlined,
  TeamOutlined,
  ProductOutlined,
  BarChartOutlined,
  RightOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import api from '../services/api';

const { Title, Text } = Typography;

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    recentOrders: [],
    notifications: [],
    topProducts: [],
    staffPerformance: [],
    quickActions: []
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard data based on user role
      const endpoints = {
        admin: [
          'analytics/overview',
          'orders/recent',
          'products/top-selling',
          'staff/performance',
          'notifications'
        ],
        manager: [
          'analytics/overview',
          'orders/recent', 
          'products/top-selling',
          'staff/performance'
        ],
        cashier: [
          'orders/my-orders',
          'products/popular',
          'staff/my-performance'
        ],
        staff: [
          'orders/my-orders',
          'staff/my-performance'
        ]
      };

      const userEndpoints = endpoints[user.role] || endpoints.staff;
      const promises = userEndpoints.map(endpoint => 
        api.get(`/${endpoint}`).catch(err => ({ error: err.message }))
      );

      const results = await Promise.all(promises);

      setDashboardData({
        stats: results[0]?.data || getMockStats(),
        recentOrders: results[1]?.data || getMockOrders(),
        topProducts: results[2]?.data || getMockProducts(),
        staffPerformance: results[3]?.data || getMockStaff(),
        notifications: results[4]?.data || getMockNotifications(),
        quickActions: getQuickActions(user.role)
      });

    } catch (error) {
      console.error('Dashboard loading error:', error);
      // Load mock data on error
      setDashboardData({
        stats: getMockStats(),
        recentOrders: getMockOrders(),
        topProducts: getMockProducts(),
        staffPerformance: getMockStaff(),
        notifications: getMockNotifications(),
        quickActions: getQuickActions(user.role)
      });
    } finally {
      setLoading(false);
    }
  };

  const getMockStats = () => ({
    todayRevenue: 15420.50,
    todayOrders: 127,
    totalCustomers: 1834,
    averageOrderValue: 121.42,
    revenueGrowth: 12.5,
    ordersGrowth: 8.3,
    customersGrowth: 15.2,
    conversionRate: 4.2
  });

  const getMockOrders = () => [
    { id: 'ORD-2024-001', customer: 'John Doe', amount: 89.50, status: 'completed', time: '2 minutes ago' },
    { id: 'ORD-2024-002', customer: 'Jane Smith', amount: 156.25, status: 'processing', time: '5 minutes ago' },
    { id: 'ORD-2024-003', customer: 'Mike Johnson', amount: 75.00, status: 'completed', time: '8 minutes ago' },
    { id: 'ORD-2024-004', customer: 'Sarah Wilson', amount: 203.75, status: 'pending', time: '12 minutes ago' },
    { id: 'ORD-2024-005', customer: 'David Brown', amount: 95.30, status: 'completed', time: '15 minutes ago' }
  ];

  const getMockProducts = () => [
    { name: 'Premium Coffee Blend', sales: 156, revenue: 2340, growth: 15 },
    { name: 'Organic Green Tea', sales: 134, revenue: 1876, growth: 23 },
    { name: 'Artisan Pastries', sales: 98, revenue: 1470, growth: -5 },
    { name: 'Fresh Sandwiches', sales: 87, revenue: 1305, growth: 8 },
    { name: 'Energy Drinks', sales: 76, revenue: 912, growth: 31 }
  ];

  const getMockStaff = () => [
    { name: 'Alice Johnson', role: 'Cashier', score: 94, orders: 45, badges: 3 },
    { name: 'Bob Smith', role: 'Staff', score: 87, orders: 38, badges: 2 },
    { name: 'Carol Davis', role: 'Cashier', score: 91, orders: 42, badges: 4 },
    { name: 'David Wilson', role: 'Staff', score: 82, orders: 35, badges: 1 }
  ];

  const getMockNotifications = () => [
    { id: 1, type: 'info', message: 'Low stock alert: Premium Coffee Blend (5 units left)', time: '10 minutes ago' },
    { id: 2, type: 'success', message: 'Daily sales target achieved!', time: '2 hours ago' },
    { id: 3, type: 'warning', message: 'Staff training reminder for this week', time: '4 hours ago' },
    { id: 4, type: 'info', message: 'New customer loyalty program launched', time: '1 day ago' }
  ];

  const getQuickActions = (role) => {
    const actions = {
      admin: [
        { title: 'View Analytics', icon: BarChartOutlined, path: '/analytics', color: '#1890ff' },
        { title: 'Manage Products', icon: ProductOutlined, path: '/products', color: '#52c41a' },
        { title: 'Staff Management', icon: TeamOutlined, path: '/staff', color: '#722ed1' },
        { title: 'POS Terminal', icon: ShoppingCartOutlined, path: '/pos', color: '#fa541c' }
      ],
      manager: [
        { title: 'POS Terminal', icon: ShoppingCartOutlined, path: '/pos', color: '#fa541c' },
        { title: 'Manage Products', icon: ProductOutlined, path: '/products', color: '#52c41a' },
        { title: 'View Reports', icon: BarChartOutlined, path: '/analytics', color: '#1890ff' },
        { title: 'Staff Performance', icon: TeamOutlined, path: '/staff', color: '#722ed1' }
      ],
      cashier: [
        { title: 'POS Terminal', icon: ShoppingCartOutlined, path: '/pos', color: '#fa541c' },
        { title: 'Order History', icon: ClockCircleOutlined, path: '/orders', color: '#1890ff' },
        { title: 'Customer Lookup', icon: UserOutlined, path: '/customers', color: '#52c41a' },
        { title: 'My Performance', icon: TrophyOutlined, path: '/staff', color: '#722ed1' }
      ],
      staff: [
        { title: 'POS Terminal', icon: ShoppingCartOutlined, path: '/pos', color: '#fa541c' },
        { title: 'My Orders', icon: ClockCircleOutlined, path: '/orders', color: '#1890ff' },
        { title: 'My Performance', icon: TrophyOutlined, path: '/staff', color: '#722ed1' }
      ]
    };
    return actions[role] || actions.staff;
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'green',
      processing: 'blue',
      pending: 'orange',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return <LoadingSpinner tip="Loading dashboard..." />;
  }

  const { stats, recentOrders, topProducts, staffPerformance, notifications, quickActions } = dashboardData;

  return (
    <div>
      {/* Welcome Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2}>
          Welcome back, {user?.name || user?.email}! 👋
        </Title>
        <Text type="secondary">
          Here's what's happening with your business today.
        </Text>
      </div>

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today's Revenue"
              value={stats.todayRevenue}
              precision={2}
              prefix={<DollarOutlined />}
              suffix={
                <Tag color={stats.revenueGrowth > 0 ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                  {stats.revenueGrowth > 0 ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(stats.revenueGrowth)}%
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Orders Today"
              value={stats.todayOrders}
              prefix={<ShoppingCartOutlined />}
              suffix={
                <Tag color={stats.ordersGrowth > 0 ? 'green' : 'red'} style={{ marginLeft: 8 }}>
                  {stats.ordersGrowth > 0 ? <RiseOutlined /> : <FallOutlined />}
                  {Math.abs(stats.ordersGrowth)}%
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Customers"
              value={stats.totalCustomers}
              prefix={<UserOutlined />}
              suffix={
                <Tag color="blue" style={{ marginLeft: 8 }}>
                  +{stats.customersGrowth}%
                </Tag>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Order Value"
              value={stats.averageOrderValue}
              precision={2}
              prefix={<DollarOutlined />}
              suffix={
                <Tag color="purple" style={{ marginLeft: 8 }}>
                  {stats.conversionRate}% conv.
                </Tag>
              }
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Quick Actions */}
        <Col xs={24} lg={8}>
          <Card title="Quick Actions" size="small">
            <Row gutter={[8, 8]}>
              {quickActions.map((action, index) => (
                <Col span={12} key={index}>
                  <Button
                    block
                    size="large"
                    style={{
                      height: '60px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderColor: action.color,
                      color: action.color
                    }}
                    onClick={() => navigate(action.path)}
                  >
                    <action.icon style={{ fontSize: '18px', marginBottom: '4px' }} />
                    <span style={{ fontSize: '12px' }}>{action.title}</span>
                  </Button>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Notifications */}
          <Card 
            title={
              <Space>
                <BellOutlined />
                Notifications
                <Badge count={notifications.length} size="small" />
              </Space>
            } 
            style={{ marginTop: 16 }}
            size="small"
          >
            <List
              size="small"
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    description={
                      <div>
                        <Text style={{ fontSize: '12px' }}>{item.message}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '11px' }}>
                          {item.time}
                        </Text>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Recent Orders */}
        <Col xs={24} lg={8}>
          <Card 
            title="Recent Orders" 
            size="small"
            extra={
              <Button type="link" size="small" onClick={() => navigate('/orders')}>
                View All <RightOutlined />
              </Button>
            }
          >
            <List
              size="small"
              dataSource={recentOrders}
              renderItem={(order) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text strong>{order.id}</Text>
                        <Tag color={getStatusColor(order.status)}>
                          {order.status.toUpperCase()}
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <Text>{order.customer}</Text>
                        <br />
                        <Space>
                          <Text strong>${order.amount}</Text>
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {order.time}
                          </Text>
                        </Space>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Performance & Analytics */}
        <Col xs={24} lg={8}>
          {/* Top Products */}
          <Card 
            title="Top Products Today" 
            size="small"
            extra={
              <Button type="link" size="small" onClick={() => navigate('/products')}>
                View All <RightOutlined />
              </Button>
            }
          >
            <List
              size="small"
              dataSource={topProducts}
              renderItem={(product) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Text>{product.name}</Text>
                        <Tag color={product.growth > 0 ? 'green' : 'red'}>
                          {product.growth > 0 ? '+' : ''}{product.growth}%
                        </Tag>
                      </div>
                    }
                    description={
                      <Space>
                        <Text type="secondary">{product.sales} sales</Text>
                        <Text strong>${product.revenue}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* Staff Performance */}
          {(user.role === 'admin' || user.role === 'manager') && (
            <Card 
              title="Staff Performance" 
              style={{ marginTop: 16 }}
              size="small"
              extra={
                <Button type="link" size="small" onClick={() => navigate('/staff')}>
                  View All <RightOutlined />
                </Button>
              }
            >
              <List
                size="small"
                dataSource={staffPerformance}
                renderItem={(staff) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Text>{staff.name}</Text>
                          <Space>
                            <Tag>{staff.role}</Tag>
                            <Badge count={staff.badges} showZero color="gold" />
                          </Space>
                        </div>
                      }
                      description={
                        <div>
                          <Progress 
                            percent={staff.score} 
                            size="small" 
                            format={() => `${staff.score}%`}
                          />
                          <Text type="secondary" style={{ fontSize: '11px' }}>
                            {staff.orders} orders today
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;

/*
📁 FILE PATH: frontend/src/pages/Dashboard.jsx

📋 DESCRIPTION:
Main dashboard page showing real-time business metrics, recent activity,
staff performance, and role-based quick actions for Enterprise POS.

🔧 FEATURES:
- Real-time business metrics with growth indicators
- Role-based dashboard content (Admin/Manager/Cashier/Staff)
- Recent orders and top products display
- Staff performance tracking with gamification
- Quick action buttons for common tasks
- Responsive design for all screen sizes
- Live notifications and alerts
- Mock data fallback for offline/demo mode

🎯 INTEGRATION:
- Connects to backend analytics APIs
- Uses AuthContext for role-based content
- Integrates with all major POS modules
- Mobile-optimized for tablet POS use
*/