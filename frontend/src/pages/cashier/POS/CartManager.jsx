// frontend/src/pages/cashier/POS/CartManager.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, List, InputNumber, Button, Tag, Space, Divider, Typography,
  Popconfirm, Tooltip, Alert, Row, Col, Image, Badge, Input, Select
} from 'antd';
import {
  DeleteOutlined, PlusOutlined, MinusOutlined, GiftOutlined,
  PercentageOutlined, UserOutlined, ClearOutlined, CalculatorOutlined,
  BarcodeOutlined, ShoppingCartOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CartManager = ({ 
  cartItems = [], 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart,
  onApplyDiscount,
  onApplyCoupon,
  customer = null,
  onSelectCustomer
}) => {
  const [localCart, setLocalCart] = useState(cartItems);
  const [discountType, setDiscountType] = useState('percentage'); // percentage, fixed
  const [discountValue, setDiscountValue] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [note, setNote] = useState('');
  const [appliedPromos, setAppliedPromos] = useState([]);

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = localCart.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const totalItems = localCart.reduce((sum, item) => sum + item.quantity, 0);
    
    let discount = 0;
    if (discountType === 'percentage') {
      discount = (subtotal * discountValue) / 100;
    } else if (discountType === 'fixed') {
      discount = Math.min(discountValue, subtotal);
    }

    // Apply coupon discounts
    const couponDiscount = appliedPromos.reduce((sum, promo) => {
      if (promo.type === 'percentage') {
        return sum + (subtotal * promo.value / 100);
      } else {
        return sum + Math.min(promo.value, subtotal);
      }
    }, 0);

    const tax = (subtotal - discount - couponDiscount) * 0.1; // 10% VAT
    const total = subtotal - discount - couponDiscount + tax;

    return {
      subtotal,
      discount,
      couponDiscount,
      tax,
      total,
      totalItems,
      savings: discount + couponDiscount
    };
  };

  const totals = calculateTotals();

  // Update parent when cart changes
  useEffect(() => {
    setLocalCart(cartItems);
  }, [cartItems]);

  // Handle quantity change
  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveItem(itemId);
      return;
    }

    const updatedCart = localCart.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    );
    setLocalCart(updatedCart);
    onUpdateQuantity(itemId, newQuantity);
  };

  // Handle remove item
  const handleRemoveItem = (itemId) => {
    const updatedCart = localCart.filter(item => item.id !== itemId);
    setLocalCart(updatedCart);
    onRemoveItem(itemId);
  };

  // Apply manual discount
  const handleApplyDiscount = () => {
    if (discountValue > 0) {
      onApplyDiscount({
        type: discountType,
        value: discountValue,
        amount: discountType === 'percentage' 
          ? (totals.subtotal * discountValue) / 100 
          : discountValue
      });
    }
  };

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    try {
      const response = await fetch('/api/promotions/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: couponCode,
          cartTotal: totals.subtotal,
          customerId: customer?.id 
        })
      });

      if (response.ok) {
        const coupon = await response.json();
        setAppliedPromos([...appliedPromos, coupon]);
        setCouponCode('');
        onApplyCoupon(coupon);
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
    }
  };

  // Remove promo
  const handleRemovePromo = (promoId) => {
    setAppliedPromos(appliedPromos.filter(p => p.id !== promoId));
  };

  // Clear entire cart
  const handleClearCart = () => {
    setLocalCart([]);
    setAppliedPromos([]);
    setDiscountValue(0);
    setCouponCode('');
    setNote('');
    onClearCart();
  };

  if (localCart.length === 0) {
    return (
      <Card 
        title={
          <Space>
            <ShoppingCartOutlined />
            <span>Giỏ hàng</span>
            <Badge count={0} />
          </Space>
        }
        style={{ height: '100%' }}
      >
        <div style={{ 
          textAlign: 'center', 
          padding: '40px 0',
          color: '#8c8c8c'
        }}>
          <ShoppingCartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
          <div>Giỏ hàng trống</div>
          <div style={{ fontSize: 12 }}>Quét mã vạch hoặc chọn sản phẩm để thêm</div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      title={
        <Space>
          <ShoppingCartOutlined />
          <span>Giỏ hàng</span>
          <Badge count={totals.totalItems} />
        </Space>
      }
      extra={
        <Popconfirm
          title="Xóa tất cả sản phẩm?"
          onConfirm={handleClearCart}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button 
            icon={<ClearOutlined />} 
            type="text" 
            danger
            size="small"
          >
            Xóa tất cả
          </Button>
        </Popconfirm>
      }
      style={{ height: '100%' }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Customer Info */}
      {customer && (
        <div style={{ padding: '12px 16px', background: '#f0f2f5', borderBottom: '1px solid #d9d9d9' }}>
          <Space>
            <UserOutlined />
            <Text strong>{customer.name}</Text>
            <Tag color="blue">VIP</Tag>
            <Text type="secondary">Điểm: {customer.loyaltyPoints}</Text>
          </Space>
        </div>
      )}

      {/* Cart Items */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <List
          dataSource={localCart}
          renderItem={(item) => (
            <List.Item style={{ padding: '12px 16px' }}>
              <Row style={{ width: '100%' }} align="middle">
                <Col span={4}>
                  <Image
                    src={item.image || '/placeholder-product.png'}
                    alt={item.name}
                    width={40}
                    height={40}
                    style={{ borderRadius: 4 }}
                    fallback="/placeholder-product.png"
                  />
                </Col>
                
                <Col span={10}>
                  <div>
                    <Text strong style={{ fontSize: 14 }}>{item.name}</Text>
                    {item.variant && (
                      <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {item.variant}
                        </Text>
                      </div>
                    )}
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        ₫{item.price.toLocaleString()}
                      </Text>
                    </div>
                  </div>
                </Col>
                
                <Col span={6}>
                  <Space>
                    <Button
                      icon={<MinusOutlined />}
                      size="small"
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    />
                    <InputNumber
                      min={1}
                      max={item.stock || 999}
                      value={item.quantity}
                      onChange={(value) => handleQuantityChange(item.id, value)}
                      style={{ width: 50 }}
                      size="small"
                    />
                    <Button
                      icon={<PlusOutlined />}
                      size="small"
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    />
                  </Space>
                </Col>
                
                <Col span={3} style={{ textAlign: 'right' }}>
                  <div>
                    <Text strong>
                      ₫{(item.price * item.quantity).toLocaleString()}
                    </Text>
                  </div>
                  <Button
                    icon={<DeleteOutlined />}
                    type="text"
                    danger
                    size="small"
                    onClick={() => handleRemoveItem(item.id)}
                  />
                </Col>
              </Row>
            </List.Item>
          )}
        />
      </div>

      <Divider style={{ margin: 0 }} />

      {/* Applied Promotions */}
      {appliedPromos.length > 0 && (
        <div style={{ padding: '12px 16px', background: '#f6ffed' }}>
          <Text strong style={{ color: '#52c41a', fontSize: 12 }}>
            <GiftOutlined /> ÁP DỤNG KHUYẾN MÃI
          </Text>
          {appliedPromos.map(promo => (
            <div key={promo.id} style={{ marginTop: 4 }}>
              <Space>
                <Tag 
                  color="green" 
                  closable
                  onClose={() => handleRemovePromo(promo.id)}
                >
                  {promo.name}
                </Tag>
                <Text style={{ fontSize: 12 }}>
                  -₫{promo.discountAmount?.toLocaleString()}
                </Text>
              </Space>
            </div>
          ))}
        </div>
      )}

      {/* Discount Section */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #d9d9d9' }}>
        <Text strong style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
          <PercentageOutlined /> GIẢM GIÁ THỦ CÔNG
        </Text>
        <Row gutter={8}>
          <Col span={8}>
            <Select
              size="small"
              value={discountType}
              onChange={setDiscountType}
              style={{ width: '100%' }}
            >
              <Select.Option value="percentage">%</Select.Option>
              <Select.Option value="fixed">₫</Select.Option>
            </Select>
          </Col>
          <Col span={10}>
            <InputNumber
              size="small"
              value={discountValue}
              onChange={setDiscountValue}
              style={{ width: '100%' }}
              min={0}
              max={discountType === 'percentage' ? 100 : totals.subtotal}
            />
          </Col>
          <Col span={6}>
            <Button
              size="small"
              type="primary"
              onClick={handleApplyDiscount}
              style={{ width: '100%' }}
            >
              Áp dụng
            </Button>
          </Col>
        </Row>

        {/* Coupon Code */}
        <Row gutter={8} style={{ marginTop: 8 }}>
          <Col span={14}>
            <Input
              size="small"
              placeholder="Mã coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onPressEnter={handleApplyCoupon}
            />
          </Col>
          <Col span={10}>
            <Button
              size="small"
              onClick={handleApplyCoupon}
              style={{ width: '100%' }}
            >
              Áp dụng
            </Button>
          </Col>
        </Row>
      </div>

      {/* Order Note */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #d9d9d9' }}>
        <TextArea
          placeholder="Ghi chú đơn hàng..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          style={{ fontSize: 12 }}
        />
      </div>

      {/* Total Summary */}
      <div style={{ padding: '16px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Row justify="space-between">
            <Text>Tạm tính ({totals.totalItems} món):</Text>
            <Text>₫{totals.subtotal.toLocaleString()}</Text>
          </Row>
          
          {totals.discount > 0 && (
            <Row justify="space-between">
              <Text type="secondary">Giảm giá:</Text>
              <Text type="secondary">-₫{totals.discount.toLocaleString()}</Text>
            </Row>
          )}
          
          {totals.couponDiscount > 0 && (
            <Row justify="space-between">
              <Text type="secondary">Khuyến mãi:</Text>
              <Text type="secondary">-₫{totals.couponDiscount.toLocaleString()}</Text>
            </Row>
          )}
          
          <Row justify="space-between">
            <Text type="secondary">Thuế VAT (10%):</Text>
            <Text type="secondary">₫{totals.tax.toLocaleString()}</Text>
          </Row>
          
          <Divider style={{ margin: '8px 0' }} />
          
          <Row justify="space-between">
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
              <CalculatorOutlined /> Tổng cộng:
            </Title>
            <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
              ₫{totals.total.toLocaleString()}
            </Title>
          </Row>
          
          {totals.savings > 0 && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <Tag color="green">
                🎉 Tiết kiệm: ₫{totals.savings.toLocaleString()}
              </Tag>
            </div>
          )}
        </Space>
      </div>
    </Card>
  );
};

export default CartManager;