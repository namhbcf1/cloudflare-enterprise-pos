// frontend/src/components/Admin/Dashboard.jsx
// Enterprise POS System - Admin Dashboard
// Real-time analytics, KPIs, charts, and business intelligence interface

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Select,
  DatePicker,
  Button,
  Progress,
  Tag,
  Avatar,
  List,
  Alert,
  Space,
  Typography,
  Spin,
  Badge,
  Tooltip
} from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  TeamOutlined,
  TrophyOutlined,
  WarningOutlined,
  StockOutlined,
  ClockCircleOutlined,
  FireOutlined,
  GiftOutlined
} from '@ant-design/icons';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { analyticsAPI, staffAPI } from '../../services/api';
import { useWebSocket } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const AdminDashboard = () => {
  // State management
  const [dashboardData, setDashboardData] = useState(null);
  const [realtimeStats, setRealtimeStats] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Hooks
  const { user } = useAuth();
  const { sendMessage, isConnected } = useWebSocket();

  // Chart colors
  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

  // Load dashboard data
  const loadDashboardData = useCallback(async (period = selectedPeriod) => {
    try {
      setRefreshing(true);
      
      const [dashboardResponse, realtimeResponse] = await Promise.all([
        analyticsAPI.getDashboard(period),
        analyticsAPI.getRealTimeStats()
      ]);

      setDashboardData(dashboardResponse);
      setRealtimeStats(realtimeResponse);
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPeriod]);

  // Initial load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!refreshing) {
        loadDashboardData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loadDashboardData, refreshing]);

  // WebSocket real-time updates
  useEffect(() => {
    if (isConnected) {
      sendMessage('request_data', { requestType: 'live_analytics' });
    }
  }, [isConnected, sendMessage]);

  // Handle period change
  const handlePeriodChange = (period) => {
    setSelectedPeriod(period);
    loadDashboardData(period);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>Loading dashboard...</Text>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <Alert
        message="Failed to load dashboard data"
        type="error"
        action={
          <Button size="small" onClick={() => loadDashboardData()}>
            Retry
          </Button>
        }
      />
    );
  }

  const { metrics, trends, topProducts, topCustomers, staffPerformance, paymentBreakdown, inventoryAlerts } = dashboardData;

  // Calculate percentage changes
  const revenueGrowth = metrics.revenue_growth || 0;
  const orderGrowth = metrics.order_growth || 0;

  // Format currency
  const formatCurrency = (value) => `$${Number(value || 0).toLocaleString()}`;
  const formatNumber = (value) => Number(value || 0).toLocaleString();

  // Top products table columns
  const productColumns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.category_name}
          </Text>
        </div>
      )
    },
    {
      title: 'Sold',
      dataIndex: 'quantity_sold',
      key: 'quantity_sold',
      render: (value) => formatNumber(value),
      sorter: (a, b) => a.quantity_sold - b.quantity_sold
    },
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.revenue - b.revenue
    }
  ];

  // Staff performance table columns
  const staffColumns = [
    {
      title: 'Staff',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{text}</Text>
            <br />
            <Tag color="blue">{record.role}</Tag>
          </div>
        </Space>
      )
    },
    {
      title: 'Orders',
      dataIndex: 'orders',
      key: 'orders',
      render: (value) => formatNumber(value),
      sorter: (a, b) => a.orders - b.orders
    },
    {
      title: 'Sales',
      dataIndex: 'sales',
      key: 'sales',
      render: (value) => formatCurrency(value),
      sorter: (a, b) => a.sales - b.sales
    },
    {
      title: 'Level',
      dataIndex: 'current_level',
      key: 'current_level',
      render: (level, record) => (
        <div>
          <Text strong>Level {level}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {formatNumber(record.experience_points)} XP
          </Text>
        </div>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            Dashboard
          </Title>
          {lastUpdated && (
            <Text type="secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
              <Badge 
                status={isConnected ? 'success' : 'error'} 
                text={isConnected ? 'Live' : 'Offline'}
                style={{ marginLeft: 8 }}
              />
            </Text>
          )}
        </Col>
        <Col>
          <Space>
            <Select
              value={selectedPeriod}
              onChange={handlePeriodChange}
              style={{ width: 120 }}
            >
              <Option value="1d">Today</Option>
              <Option value="7d">7 Days</Option>
              <Option value="30d">30 Days</Option>
              <Option value="90d">90 Days</Option>
            </Select>
            <Button 
              loading={refreshing}
              onClick={() => loadDashboardData()}
            >
              Refresh
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Real-time Stats */}
      {realtimeStats && (
        <Alert
          message={
            <Space>
              <Text strong>Today:</Text>
              <Text>{formatNumber(realtimeStats.today.orders_today)} orders</Text>
              <Text>{formatCurrency(realtimeStats.today.revenue_today)} revenue</Text>
              <Text>{formatNumber(realtimeStats.today.customers_today)} customers</Text>
              <Text>({formatNumber(realtimeStats.thisHour.orders_this_hour)} this hour)</Text>
            </Space>
          }
          type="info"
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Key Metrics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={metrics.total_revenue}
              formatter={formatCurrency}
              prefix={<DollarOutlined />}
              valueStyle={{ color: revenueGrowth >= 0 ? '#3f8600' : '#cf1322' }}
              suffix={
                <Text style={{ fontSize: '14px' }}>
                  {revenueGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(revenueGrowth).toFixed(1)}%
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Orders"
              value={metrics.total_orders}
              formatter={formatNumber}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: orderGrowth >= 0 ? '#3f8600' : '#cf1322' }}
              suffix={
                <Text style={{ fontSize: '14px' }}>
                  {orderGrowth >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(orderGrowth).toFixed(1)}%
                </Text>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Average Order"
              value={metrics.avg_order_value}
              formatter={formatCurrency}
              prefix={<CalculatorOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Unique Customers"
              value={metrics.unique_customers}
              formatter={formatNumber}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Revenue Trend */}
        <Col xs={24} lg={16}>
          <Card title="Revenue Trend" extra={<ClockCircleOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends.daily}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis tickFormatter={formatCurrency} />
                <RechartsTooltip 
                  formatter={[formatCurrency, 'Revenue']}
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#1890ff"
                  fill="#1890ff"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Payment Methods */}
        <Col xs={24} lg={8}>
          <Card title="Payment Methods" extra={<CreditCardOutlined />}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentBreakdown}
                  dataKey="total"
                  nameKey="payment_method"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ payment_method, percent }) => 
                    `${payment_method} ${(percent * 100).toFixed(1)}%`
                  }
                >
                  {paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={[formatCurrency, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Hourly Sales Pattern */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Hourly Sales Pattern" extra={<StockOutlined />}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trends.hourly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="hour" 
                  tickFormatter={(value) => `${value}:00`}
                />
                <YAxis yAxisId="left" orientation="left" tickFormatter={formatNumber} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={formatCurrency} />
                <RechartsTooltip 
                  formatter={[
                    [formatNumber, 'Orders'],
                    [formatCurrency, 'Revenue']
                  ]}
                  labelFormatter={(value) => `${value}:00`}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="orders" 
                  fill="#52c41a" 
                  name="Orders"
                />
                <Bar 
                  yAxisId="right"
                  dataKey="revenue" 
                  fill="#1890ff" 
                  name="Revenue"
                />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Data Tables Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Top Products */}
        <Col xs={24} lg={12}>
          <Card title={<><FireOutlined /> Top Products</>}>
            <Table
              columns={productColumns}
              dataSource={topProducts}
              rowKey="name"
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>

        {/* Staff Performance */}
        <Col xs={24} lg={12}>
          <Card title={<><TrophyOutlined /> Staff Performance</>}>
            <Table
              columns={staffColumns}
              dataSource={staffPerformance}
              rowKey="name"
              pagination={false}
              size="small"
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
      </Row>

      {/* Alerts and Notifications */}
      <Row gutter={[16, 16]}>
        {/* Inventory Alerts */}
        <Col xs={24} lg={12}>
          <Card 
            title={<><WarningOutlined /> Inventory Alerts</>}
            extra={
              <Badge count={inventoryAlerts.length} showZero>
                <Button size="small">View All</Button>
              </Badge>
            }
          >
            <List
              dataSource={inventoryAlerts.slice(0, 5)}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<GiftOutlined />} />}
                    title={item.name}
                    description={
                      <Space>
                        <Text type="secondary">SKU: {item.sku}</Text>
                        <Tag color="orange">
                          Stock: {item.current_stock}/{item.low_stock_threshold}
                        </Tag>
                      </Space>
                    }
                  />
                  <Progress
                    percent={(item.current_stock / item.low_stock_threshold) * 100}
                    size="small"
                    status={item.current_stock === 0 ? 'exception' : 'normal'}
                    style={{ width: 100 }}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Top Customers */}
        <Col xs={24} lg={12}>
          <Card title={<><TeamOutlined /> Top Customers</>}>
            <List
              dataSource={topCustomers.slice(0, 5)}
              renderItem={item => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={item.name}
                    description={
                      <Space>
                        <Text>{formatNumber(item.order_count)} orders</Text>
                        <Text type="secondary">•</Text>
                        <Text>{formatCurrency(item.avg_order)} avg</Text>
                      </Space>
                    }
                  />
                  <div style={{ textAlign: 'right' }}>
                    <Text strong>{formatCurrency(item.total_spent)}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {item.loyalty_points} points
                    </Text>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminDashboard;