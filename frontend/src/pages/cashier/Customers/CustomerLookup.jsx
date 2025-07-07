// frontend/src/pages/cashier/Customers/CustomerLookup.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal, Input, Button, List, Avatar, Tag, Space, Typography, Row, Col,
  Card, Divider, Badge, Tooltip, Empty, Spin, message, Form, Select
} from 'antd';
import {
  SearchOutlined, UserOutlined, PhoneOutlined, MailOutlined,
  GiftOutlined, StarOutlined, CalendarOutlined, ShoppingOutlined,
  PlusOutlined, CrownOutlined, HeartOutlined, TrophyOutlined
} from '@ant-design/icons';
import { debounce } from 'lodash';

const { Text, Title } = Typography;
const { Search } = Input;

const CustomerLookup = ({
  visible,
  onClose,
  onSelectCustomer,
  selectedCustomer = null
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm] = Form.useForm();

  // Customer tiers configuration
  const customerTiers = {
    bronze: { name: 'Đồng', color: '#cd7f32', icon: '🥉', minSpent: 0 },
    silver: { name: 'Bạc', color: '#c0c0c0', icon: '🥈', minSpent: 5000000 },
    gold: { name: 'Vàng', color: '#ffd700', icon: '🥇', minSpent: 20000000 },
    platinum: { name: 'Bạch kim', color: '#e5e4e2', icon: '💎', minSpent: 50000000 },
    diamond: { name: 'Kim cương', color: '#b9f2ff', icon: '💠', minSpent: 100000000 }
  };

  // Debounced search function
  const debouncedSearch = debounce(async (term) => {
    if (!term || term.length < 2) {
      setCustomers([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/customers/search?q=${encodeURIComponent(term)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Search error:', error);
      message.error('Lỗi tìm kiếm khách hàng');
    } finally {
      setLoading(false);
    }
  }, 300);

  // Search when term changes
  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm]);

  // Get customer tier based on total spent
  const getCustomerTier = (totalSpent) => {
    if (totalSpent >= customerTiers.diamond.minSpent) return customerTiers.diamond;
    if (totalSpent >= customerTiers.platinum.minSpent) return customerTiers.platinum;
    if (totalSpent >= customerTiers.gold.minSpent) return customerTiers.gold;
    if (totalSpent >= customerTiers.silver.minSpent) return customerTiers.silver;
    return customerTiers.bronze;
  };

  // Format last visit
  const formatLastVisit = (date) => {
    if (!date) return 'Chưa có';
    const now = new Date();
    const lastVisit = new Date(date);
    const diffDays = Math.floor((now - lastVisit) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hôm nay';
    if (diffDays === 1) return 'Hôm qua';
    if (diffDays <= 7) return `${diffDays} ngày trước`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} tuần trước`;
    return `${Math.floor(diffDays / 30)} tháng trước`;
  };

  // Create new customer
  const createCustomer = async (values) => {
    try {
      const response = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        const newCustomer = await response.json();
        message.success('Tạo khách hàng mới thành công!');
        setShowCreateForm(false);
        createForm.resetFields();
        onSelectCustomer(newCustomer);
        onClose();
      }
    } catch (error) {
      console.error('Create customer error:', error);
      message.error('Lỗi tạo khách hàng mới');
    }
  };

  // Select customer
  const handleSelectCustomer = (customer) => {
    onSelectCustomer(customer);
    onClose();
  };

  // Remove selected customer
  const handleRemoveCustomer = () => {
    onSelectCustomer(null);
    onClose();
  };

  const renderCustomerItem = (customer) => {
    const tier = getCustomerTier(customer.totalSpent || 0);
    const isVIP = customer.isVIP || tier.name !== 'Đồng';

    return (
      <List.Item
        key={customer.id}
        onClick={() => handleSelectCustomer(customer)}
        style={{
          cursor: 'pointer',
          padding: '16px',
          border: selectedCustomer?.id === customer.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
          borderRadius: 8,
          marginBottom: 8,
          background: selectedCustomer?.id === customer.id ? '#f0f8ff' : 'white'
        }}
        hoverable
      >
        <List.Item.Meta
          avatar={
            <Badge 
              count={isVIP ? <CrownOutlined style={{ color: '#ffd700' }} /> : 0}
              offset={[-8, 8]}
            >
              <Avatar 
                size={48} 
                icon={<UserOutlined />}
                style={{ 
                  backgroundColor: tier.color,
                  fontSize: 18
                }}
              >
                {customer.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </Badge>
          }
          title={
            <Space>
              <Text strong style={{ fontSize: 16 }}>
                {customer.name}
              </Text>
              <Tag color={tier.color.replace('#', '')} style={{ margin: 0 }}>
                {tier.icon} {tier.name}
              </Tag>
              {customer.birthday && (
                <Tooltip title="Sinh nhật trong tháng">
                  <Tag color="pink" icon={<GiftOutlined />}>
                    Sinh nhật
                  </Tag>
                </Tooltip>
              )}
            </Space>
          }
          description={
            <div>
              <Row gutter={[16, 8]}>
                <Col span={24}>
                  <Space size="large">
                    {customer.phone && (
                      <Space size={4}>
                        <PhoneOutlined style={{ color: '#1890ff' }} />
                        <Text>{customer.phone}</Text>
                      </Space>
                    )}
                    {customer.email && (
                      <Space size={4}>
                        <MailOutlined style={{ color: '#52c41a' }} />
                        <Text>{customer.email}</Text>
                      </Space>
                    )}
                  </Space>
                </Col>
                
                <Col span={24}>
                  <Row gutter={24}>
                    <Col>
                      <Tooltip title="Điểm tích lũy">
                        <Space size={4}>
                          <StarOutlined style={{ color: '#faad14' }} />
                          <Text strong>{customer.loyaltyPoints?.toLocaleString() || 0}</Text>
                          <Text type="secondary">điểm</Text>
                        </Space>
                      </Tooltip>
                    </Col>
                    
                    <Col>
                      <Tooltip title="Tổng chi tiêu">
                        <Space size={4}>
                          <ShoppingOutlined style={{ color: '#722ed1' }} />
                          <Text strong>₫{(customer.totalSpent || 0).toLocaleString()}</Text>
                        </Space>
                      </Tooltip>
                    </Col>
                    
                    <Col>
                      <Tooltip title="Số đơn hàng">
                        <Space size={4}>
                          <TrophyOutlined style={{ color: '#13c2c2' }} />
                          <Text strong>{customer.totalOrders || 0}</Text>
                          <Text type="secondary">đơn</Text>
                        </Space>
                      </Tooltip>
                    </Col>
                    
                    <Col>
                      <Tooltip title="Lần mua cuối">
                        <Space size={4}>
                          <CalendarOutlined style={{ color: '#f5222d' }} />
                          <Text type="secondary">{formatLastVisit(customer.lastVisit)}</Text>
                        </Space>
                      </Tooltip>
                    </Col>
                  </Row>
                </Col>
              </Row>

              {/* Customer preferences */}
              {customer.preferences && customer.preferences.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Sở thích: {customer.preferences.join(', ')}
                  </Text>
                </div>
              )}

              {/* Special notes */}
              {customer.notes && (
                <div style={{ marginTop: 4 }}>
                  <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>
                    📝 {customer.notes}
                  </Text>
                </div>
              )}
            </div>
          }
        />
      </List.Item>
    );
  };

  const renderCreateForm = () => {
    return (
      <Form
        form={createForm}
        layout="vertical"
        onFinish={createCustomer}
        style={{ marginTop: 16 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Họ và tên"
              rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
            >
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="phone"
              label="Số điện thoại"
              rules={[
                { required: true, message: 'Vui lòng nhập số điện thoại!' },
                { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
              ]}
            >
              <Input placeholder="0901234567" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ type: 'email', message: 'Email không hợp lệ!' }]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="gender"
              label="Giới tính"
            >
              <Select placeholder="Chọn giới tính">
                <Select.Option value="male">Nam</Select.Option>
                <Select.Option value="female">Nữ</Select.Option>
                <Select.Option value="other">Khác</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="address"
          label="Địa chỉ"
        >
          <Input.TextArea rows={2} placeholder="Địa chỉ khách hàng" />
        </Form.Item>

        <Form.Item
          name="notes"
          label="Ghi chú"
        >
          <Input.TextArea rows={2} placeholder="Ghi chú về khách hàng..." />
        </Form.Item>

        <div style={{ textAlign: 'right' }}>
          <Space>
            <Button onClick={() => setShowCreateForm(false)}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit">
              Tạo khách hàng
            </Button>
          </Space>
        </div>
      </Form>
    );
  };

  return (
    <Modal
      title={
        <Space>
          <UserOutlined />
          <span>Tra cứu khách hàng</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={
        <div style={{ textAlign: 'center' }}>
          <Space>
            {selectedCustomer && (
              <Button onClick={handleRemoveCustomer}>
                Bỏ chọn khách hàng
              </Button>
            )}
            <Button onClick={onClose}>
              Đóng
            </Button>
          </Space>
        </div>
      }
    >
      {/* Search Section */}
      <div style={{ marginBottom: 16 }}>
        <Search
          placeholder="Tìm theo tên, số điện thoại, email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="large"
          allowClear
          suffix={loading && <Spin size="small" />}
        />
      </div>

      {/* Selected Customer Display */}
      {selectedCustomer && (
        <Card 
          size="small" 
          style={{ marginBottom: 16, border: '2px solid #52c41a' }}
          title={
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <Text style={{ color: '#52c41a' }}>Đã chọn khách hàng</Text>
            </Space>
          }
        >
          {renderCustomerItem(selectedCustomer)}
        </Card>
      )}

      {/* Create New Customer Button */}
      <div style={{ marginBottom: 16, textAlign: 'center' }}>
        <Button 
          type="dashed" 
          icon={<PlusOutlined />}
          onClick={() => setShowCreateForm(true)}
          style={{ width: '100%' }}
        >
          Tạo khách hàng mới
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card title="Tạo khách hàng mới" style={{ marginBottom: 16 }}>
          {renderCreateForm()}
        </Card>
      )}

      {/* Search Results */}
      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Đang tìm kiếm...</Text>
            </div>
          </div>
        ) : customers.length > 0 ? (
          <List
            dataSource={customers}
            renderItem={renderCustomerItem}
            pagination={false}
          />
        ) : searchTerm.length >= 2 ? (
          <Empty 
            description="Không tìm thấy khách hàng nào"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
            <UserOutlined style={{ fontSize: 48, marginBottom: 16 }} />
            <div>Nhập ít nhất 2 ký tự để tìm kiếm</div>
            <div style={{ fontSize: 12 }}>Hoặc tạo khách hàng mới</div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {customers.length > 0 && (
        <div style={{ marginTop: 16, padding: 16, background: '#f0f2f5', borderRadius: 8 }}>
          <Row gutter={16} style={{ textAlign: 'center' }}>
            <Col span={8}>
              <Statistic 
                title="Tìm thấy" 
                value={customers.length} 
                suffix="khách hàng"
                valueStyle={{ fontSize: 16 }}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="VIP" 
                value={customers.filter(c => c.isVIP).length} 
                suffix="khách hàng"
                valueStyle={{ fontSize: 16, color: '#ffd700' }}
              />
            </Col>
            <Col span={8}>
              <Statistic 
                title="Có sinh nhật" 
                value={customers.filter(c => c.birthday).length} 
                suffix="khách hàng"
                valueStyle={{ fontSize: 16, color: '#eb2f96' }}
              />
            </Col>
          </Row>
        </div>
      )}
    </Modal>
  );
};

export default CustomerLookup;