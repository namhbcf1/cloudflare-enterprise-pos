// frontend/src/pages/cashier/POS/POSTerminal.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Input,
  Space,
  Typography,
  Divider,
  Tag,
  Modal,
  message,
  Badge,
  Avatar,
  Tooltip,
  Drawer,
  Steps,
  Alert,
  Progress,
  Affix
} from 'antd';
import {
  ShoppingCartOutlined,
  ScanOutlined,
  SearchOutlined,
  UserOutlined,
  CreditCardOutlined,
  PrinterOutlined,
  DeleteOutlined,
  PlusOutlined,
  MinusOutlined,
  DollarOutlined,
  GiftOutlined,
  StarOutlined,
  BarcodeOutlined,
  CameraOutlined,
  PayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalculatorOutlined,
  TagOutlined,
  PhoneOutlined,
  MailOutlined
} from '@ant-design/icons';
import { AuthContext } from '../../../auth/AuthContext';
import ProductSelector from './ProductSelector';
import CartManager from './CartManager';
import PaymentProcessor from './PaymentProcessor';
import CustomerLookup from '../Customers/CustomerLookup';
import SmartSuggestions from './SmartSuggestions';
import './POSTerminal.css';

const { Title, Text } = Typography;
const { Step } = Steps;

const POSTerminal = () => {
  const { user } = useContext(AuthContext);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [customerVisible, setCustomerVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderTotal, setOrderTotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  
  const barcodeInputRef = useRef(null);
  const paymentRef = useRef(null);

  // Steps for POS workflow
  const posSteps = [
    { title: 'Sản phẩm', icon: <ShoppingCartOutlined /> },
    { title: 'Khách hàng', icon: <UserOutlined /> },
    { title: 'Thanh toán', icon: <CreditCardOutlined /> },
    { title: 'Hoàn tất', icon: <CheckCircleOutlined /> }
  ];

  // Calculate totals
  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = subtotal * (discount / 100);
    const taxAmount = (subtotal - discountAmount) * (tax / 100);
    const total = subtotal - discountAmount + taxAmount;
    
    setOrderTotal(total);
    
    // Calculate loyalty points (1 point per 1000 VND)
    setLoyaltyPoints(Math.floor(total / 1000));
  }, [cart, discount, tax]);

  // Add product to cart
  const addToCart = (product, quantity = 1) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      
      return [...prevCart, { ...product, quantity }];
    });
    
    message.success(`Đã thêm ${product.name} vào giỏ hàng`);
    
    // Load AI suggestions based on cart
    loadSmartSuggestions([...cart, { ...product, quantity }]);
  };

  // Update cart item quantity
  const updateCartItem = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    message.info('Đã xóa sản phẩm khỏi giỏ hàng');
  };

  // Clear cart
  const clearCart = () => {
    Modal.confirm({
      title: 'Xóa toàn bộ giỏ hàng?',
      content: 'Tất cả sản phẩm sẽ bị xóa khỏi giỏ hàng.',
      onOk: () => {
        setCart([]);
        setCustomer(null);
        setCurrentStep(0);
        message.success('Đã xóa toàn bộ giỏ hàng');
      }
    });
  };

  // Barcode scanning
  const handleBarcodeSubmit = async () => {
    if (!barcodeInput.trim()) return;
    
    setLoading(true);
    try {
      // Search product by barcode
      const response = await fetch(`/api/products/barcode/${barcodeInput}`);
      const product = await response.json();
      
      if (product) {
        addToCart(product);
        setBarcodeInput('');
        setScannerVisible(false);
      } else {
        message.error('Không tìm thấy sản phẩm với mã vạch này');
      }
    } catch (error) {
      message.error('Lỗi khi tìm kiếm sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  // Load smart suggestions
  const loadSmartSuggestions = async (currentCart) => {
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cart: currentCart,
          customer: customer?.id
        })
      });
      
      const suggestions = await response.json();
      setSuggestions(suggestions.slice(0, 6)); // Limit to 6 suggestions
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  // Process payment
  const processPayment = async (paymentData) => {
    setLoading(true);
    try {
      const orderData = {
        items: cart,
        customer: customer?.id,
        subtotal: orderTotal - tax,
        discount: discount,
        tax: tax,
        total: orderTotal,
        loyaltyPoints: loyaltyPoints,
        payment: paymentData,
        cashier: user.id
      };
      
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCurrentStep(3);
        message.success('Thanh toán thành công!');
        
        // Print receipt
        printReceipt(result.order);
        
        // Reset for next order
        setTimeout(() => {
          setCart([]);
          setCustomer(null);
          setCurrentStep(0);
          setDiscount(0);
          setPaymentVisible(false);
        }, 3000);
      } else {
        message.error(result.message || 'Thanh toán thất bại');
      }
    } catch (error) {
      message.error('Lỗi khi xử lý thanh toán');
    } finally {
      setLoading(false);
    }
  };

  // Print receipt
  const printReceipt = (order) => {
    // In production, integrate with actual printer
    window.print();
  };

  return (
    <div className="pos-terminal">
      {/* Header */}
      <Affix offsetTop={0}>
        <Card className="pos-header" size="small">
          <Row justify="space-between" align="middle">
            <Col>
              <Space>
                <Avatar icon={<ShoppingCartOutlined />} style={{ backgroundColor: '#52c41a' }} />
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    POS Terminal
                  </Title>
                  <Text type="secondary">
                    Ca làm việc: {user?.name} • {new Date().toLocaleDateString('vi-VN')}
                  </Text>
                </div>
              </Space>
            </Col>
            
            <Col>
              <Steps 
                current={currentStep} 
                size="small" 
                items={posSteps}
                style={{ width: 300 }}
              />
            </Col>
            
            <Col>
              <Space>
                <Badge count={cart.length} showZero>
                  <Button 
                    type="primary" 
                    icon={<ShoppingCartOutlined />}
                    size="large"
                  >
                    Giỏ hàng
                  </Button>
                </Badge>
                
                <Tooltip title="Quét mã vạch">
                  <Button 
                    icon={<ScanOutlined />}
                    onClick={() => setScannerVisible(true)}
                    size="large"
                  />
                </Tooltip>
              </Space>
            </Col>
          </Row>
        </Card>
      </Affix>

      {/* Main Content */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Left Panel - Product Selection */}
        <Col xs={24} lg={14}>
          <ProductSelector 
            onAddToCart={addToCart}
            suggestions={suggestions}
          />
          
          {/* Smart Suggestions */}
          {suggestions.length > 0 && (
            <Card 
              title={
                <Space>
                  <StarOutlined style={{ color: '#faad14' }} />
                  Gợi ý thông minh
                </Space>
              }
              size="small"
              style={{ marginTop: 16 }}
            >
              <SmartSuggestions 
                suggestions={suggestions}
                onAddToCart={addToCart}
              />
            </Card>
          )}
        </Col>

        {/* Right Panel - Cart & Actions */}
        <Col xs={24} lg={10}>
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined />
                Giỏ hàng ({cart.length} sản phẩm)
              </Space>
            }
            extra={
              <Button 
                type="text" 
                danger 
                icon={<DeleteOutlined />}
                onClick={clearCart}
                disabled={cart.length === 0}
              >
                Xóa tất cả
              </Button>
            }
          >
            <CartManager
              cart={cart}
              onUpdateQuantity={updateCartItem}
              onRemoveItem={removeFromCart}
              discount={discount}
              onDiscountChange={setDiscount}
              tax={tax}
              onTaxChange={setTax}
            />
            
            {/* Order Summary */}
            <Divider />
            <div className="order-summary">
              <Row justify="space-between">
                <Text>Tạm tính:</Text>
                <Text>{(orderTotal - tax + (orderTotal * discount / 100)).toLocaleString('vi-VN')} ₫</Text>
              </Row>
              
              {discount > 0 && (
                <Row justify="space-between">
                  <Text>Giảm giá ({discount}%):</Text>
                  <Text type="danger">-{((orderTotal - tax) * discount / 100).toLocaleString('vi-VN')} ₫</Text>
                </Row>
              )}
              
              <Row justify="space-between">
                <Text>Thuế VAT:</Text>
                <Text>{tax.toLocaleString('vi-VN')} ₫</Text>
              </Row>
              
              <Divider style={{ margin: '8px 0' }} />
              
              <Row justify="space-between">
                <Title level={4} style={{ margin: 0 }}>Tổng cộng:</Title>
                <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                  {orderTotal.toLocaleString('vi-VN')} ₫
                </Title>
              </Row>
              
              {customer && loyaltyPoints > 0 && (
                <Row justify="space-between" style={{ marginTop: 8 }}>
                  <Text type="secondary">Điểm thưởng:</Text>
                  <Text type="secondary">+{loyaltyPoints} điểm</Text>
                </Row>
              )}
            </div>
            
            {/* Action Buttons */}
            <div style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button
                  type="default"
                  icon={<UserOutlined />}
                  onClick={() => setCustomerVisible(true)}
                  block
                  disabled={cart.length === 0}
                >
                  {customer ? `Khách hàng: ${customer.name}` : 'Chọn khách hàng'}
                </Button>
                
                <Button
                  type="primary"
                  icon={<CreditCardOutlined />}
                  onClick={() => {
                    setCurrentStep(2);
                    setPaymentVisible(true);
                  }}
                  size="large"
                  block
                  disabled={cart.length === 0}
                  loading={loading}
                >
                  Thanh toán • {orderTotal.toLocaleString('vi-VN')} ₫
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Barcode Scanner Modal */}
      <Modal
        title={
          <Space>
            <BarcodeOutlined />
            Quét mã vạch
          </Space>
        }
        open={scannerVisible}
        onCancel={() => setScannerVisible(false)}
        footer={null}
        width={400}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Nhập mã vạch hoặc sử dụng máy quét"
            type="info"
            showIcon
          />
          
          <Input
            ref={barcodeInputRef}
            placeholder="Nhập mã vạch..."
            value={barcodeInput}
            onChange={e => setBarcodeInput(e.target.value)}
            onPressEnter={handleBarcodeSubmit}
            size="large"
            autoFocus
          />
          
          <Row gutter={8}>
            <Col span={12}>
              <Button
                icon={<CameraOutlined />}
                block
                onClick={() => message.info('Tính năng camera đang phát triển...')}
              >
                Quét camera
              </Button>
            </Col>
            <Col span={12}>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                onClick={handleBarcodeSubmit}
                loading={loading}
                block
              >
                Tìm kiếm
              </Button>
            </Col>
          </Row>
        </Space>
      </Modal>

      {/* Customer Selection Drawer */}
      <Drawer
        title="Chọn khách hàng"
        placement="right"
        open={customerVisible}
        onClose={() => setCustomerVisible(false)}
        width={500}
      >
        <CustomerLookup
          onSelectCustomer={(selectedCustomer) => {
            setCustomer(selectedCustomer);
            setCustomerVisible(false);
            setCurrentStep(Math.max(currentStep, 1));
            message.success(`Đã chọn khách hàng: ${selectedCustomer.name}`);
          }}
          selectedCustomer={customer}
        />
      </Drawer>

      {/* Payment Modal */}
      <Modal
        title={
          <Space>
            <CreditCardOutlined />
            Thanh toán
          </Space>
        }
        open={paymentVisible}
        onCancel={() => setPaymentVisible(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <PaymentProcessor
          ref={paymentRef}
          total={orderTotal}
          cart={cart}
          customer={customer}
          onPaymentSuccess={processPayment}
          onCancel={() => setPaymentVisible(false)}
        />
      </Modal>

      {/* Success Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
            Thanh toán thành công!
          </Space>
        }
        open={currentStep === 3}
        footer={null}
        closable={false}
        width={400}
        centered
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Progress
            type="circle"
            percent={100}
            status="success"
            format={() => <CheckCircleOutlined style={{ fontSize: 24 }} />}
          />
          
          <div style={{ marginTop: 20 }}>
            <Title level={4}>Đơn hàng đã được xử lý</Title>
            <Text type="secondary">
              Tổng tiền: {orderTotal.toLocaleString('vi-VN')} ₫
            </Text>
            
            {customer && loyaltyPoints > 0 && (
              <div style={{ marginTop: 8 }}>
                <Tag color="gold" icon={<GiftOutlined />}>
                  +{loyaltyPoints} điểm thưởng
                </Tag>
              </div>
            )}
          </div>
          
          <div style={{ marginTop: 20 }}>
            <Space>
              <Button 
                icon={<PrinterOutlined />}
                onClick={() => printReceipt()}
              >
                In hóa đơn
              </Button>
              
              <Button
                type="primary"
                onClick={() => {
                  setCart([]);
                  setCustomer(null);
                  setCurrentStep(0);
                  setDiscount(0);
                  setPaymentVisible(false);
                }}
              >
                Đơn hàng mới
              </Button>
            </Space>
          </div>
        </div>
      </Modal>

      {/* Quick Actions Floating Button */}
      <div className="pos-quick-actions">
        <Space direction="vertical">
          <Tooltip title="Hủy đơn hàng" placement="left">
            <Button
              type="primary"
              danger
              shape="circle"
              icon={<CloseCircleOutlined />}
              size="large"
              onClick={clearCart}
              disabled={cart.length === 0}
            />
          </Tooltip>
          
          <Tooltip title="Máy tính" placement="left">
            <Button
              type="default"
              shape="circle"
              icon={<CalculatorOutlined />}
              size="large"
              onClick={() => message.info('Tính năng máy tính đang phát triển...')}
            />
          </Tooltip>
          
          <Tooltip title="Ghi chú đơn hàng" placement="left">
            <Button
              type="default"
              shape="circle"
              icon={<TagOutlined />}
              size="large"
              onClick={() => message.info('Tính năng ghi chú đang phát triển...')}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Keyboard Shortcuts Helper */}
      <div className="keyboard-shortcuts" style={{ display: 'none' }}>
        <Card title="Phím tắt" size="small">
          <Space direction="vertical" size="small">
            <Text><kbd>F1</kbd> - Quét mã vạch</Text>
            <Text><kbd>F2</kbd> - Chọn khách hàng</Text>
            <Text><kbd>F3</kbd> - Thanh toán</Text>
            <Text><kbd>F4</kbd> - Xóa giỏ hàng</Text>
            <Text><kbd>Ctrl+Enter</kbd> - Hoàn tất thanh toán</Text>
          </Space>
        </Card>
      </div>
    </div>
  );
};

export default POSTerminal;