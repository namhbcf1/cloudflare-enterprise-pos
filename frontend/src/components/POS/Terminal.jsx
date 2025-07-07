// frontend/src/components/POS/Terminal.jsx
// Enterprise POS System - Main POS Terminal Interface
// Touch-optimized cashier interface with barcode scanning, cart management, and payment processing

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Button, 
  Input, 
  Card, 
  Table, 
  Select, 
  Modal, 
  InputNumber, 
  message, 
  Badge, 
  Tooltip,
  Row,
  Col,
  Typography,
  Space,
  Divider,
  Avatar,
  Tag
} from 'antd';
import {
  ShoppingCartOutlined,
  ScanOutlined,
  DeleteOutlined,
  UserOutlined,
  CreditCardOutlined,
  PrinterOutlined,
  PlusOutlined,
  MinusOutlined,
  SearchOutlined,
  CalculatorOutlined,
  GiftOutlined,
  PercentageOutlined
} from '@ant-design/icons';
import { productsAPI, ordersAPI, customersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useWebSocket } from '../../contexts/WebSocketContext';

const { Text, Title } = Typography;
const { Option } = Select;

const POSTerminal = () => {
  // State management
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [discount, setDiscount] = useState({ type: 'none', value: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [quickProducts, setQuickProducts] = useState([]);

  // Refs
  const barcodeInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const videoRef = useRef(null);

  // Hooks
  const { user } = useAuth();
  const { sendMessage, isConnected } = useWebSocket();

  // Load initial data
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadQuickProducts();
    
    // Focus on barcode input
    if (barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, []);

  // WebSocket notifications
  useEffect(() => {
    if (isConnected) {
      sendMessage('pos_activity', {
        activity: 'terminal_opened',
        details: { timestamp: new Date().toISOString() }
      });
    }
  }, [isConnected, sendMessage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'f':
            e.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 'p':
            e.preventDefault();
            if (cart.length > 0) {
              setShowPaymentModal(true);
            }
            break;
          case 'c':
            e.preventDefault();
            setShowCustomerModal(true);
            break;
          case 'n':
            e.preventDefault();
            clearCart();
            break;
        }
      }
      
      if (e.key === 'F1') {
        e.preventDefault();
        startBarcodeScanning();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cart.length]);

  // Load functions
  const loadProducts = async () => {
    try {
      const response = await productsAPI.getAll({ 
        active: true, 
        limit: 100,
        include_stock: true 
      });
      setProducts(response.data || []);
    } catch (error) {
      message.error('Failed to load products');
    }
  };

  const loadCategories = async () => {
    try {
      const response = await productsAPI.getCategories();
      setCategories(response || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadQuickProducts = async () => {
    try {
      const response = await productsAPI.getTopSelling({ limit: 12 });
      setQuickProducts(response.data || []);
    } catch (error) {
      console.error('Failed to load quick products:', error);
    }
  };

  // Cart management
  const addToCart = useCallback((product, quantity = 1) => {
    if (product.current_stock < quantity) {
      message.warning(`Only ${product.current_stock} items available in stock`);
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > product.current_stock) {
          message.warning('Not enough stock available');
          return prevCart;
        }
        
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity, subtotal: newQuantity * item.price }
            : item
        );
      } else {
        return [...prevCart, {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity,
          subtotal: quantity * product.price,
          category: product.category_name || 'General'
        }];
      }
    });

    // WebSocket notification
    if (isConnected) {
      sendMessage('pos_activity', {
        activity: 'item_added',
        details: { 
          productId: product.id, 
          productName: product.name, 
          quantity 
        }
      });
    }
  }, [isConnected, sendMessage]);

  const updateCartItemQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && quantity > product.current_stock) {
      message.warning('Not enough stock available');
      return;
    }

    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId
          ? { ...item, quantity, subtotal: quantity * item.price }
          : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
    message.success('Item removed from cart');
  };

  const clearCart = () => {
    Modal.confirm({
      title: 'Clear Cart',
      content: 'Are you sure you want to clear all items from the cart?',
      onOk: () => {
        setCart([]);
        setSelectedCustomer(null);
        setDiscount({ type: 'none', value: 0 });
        setReceivedAmount(0);
        message.success('Cart cleared');
      }
    });
  };

  // Barcode scanning
  const handleBarcodeInput = async (e) => {
    if (e.key === 'Enter') {
      const barcode = e.target.value.trim();
      if (barcode) {
        await searchByBarcode(barcode);
        e.target.value = '';
      }
    }
  };

  const searchByBarcode = async (barcode) => {
    try {
      const product = products.find(p => p.sku === barcode || p.barcode === barcode);
      
      if (product) {
        addToCart(product);
        message.success(`Added ${product.name} to cart`);
      } else {
        // Search in database
        const response = await productsAPI.search(barcode);
        if (response.data && response.data.length > 0) {
          addToCart(response.data[0]);
          message.success(`Added ${response.data[0].name} to cart`);
        } else {
          message.warning('Product not found');
        }
      }
    } catch (error) {
      message.error('Failed to search product');
    }
  };

  const startBarcodeScanning = async () => {
    try {
      setScanning(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // In a real implementation, you would integrate with a barcode scanning library
      // like QuaggaJS or ZXing
      message.info('Camera scanning started - point at barcode');
      
    } catch (error) {
      message.error('Camera access denied');
      setScanning(false);
    }
  };

  const stopBarcodeScanning = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  };

  // Product search and filtering
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || 
      product.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory && product.current_stock > 0;
  });

  // Customer management
  const selectCustomer = async (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerModal(false);
    message.success(`Customer ${customer.name} selected`);
  };

  // Discount calculations
  const applyDiscount = (type, value) => {
    setDiscount({ type, value });
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    
    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = (subtotal * discount.value) / 100;
    } else if (discount.type === 'fixed') {
      discountAmount = discount.value;
    }
    
    const taxRate = 0.1; // 10% tax
    const taxAmount = (subtotal - discountAmount) * taxRate;
    const total = subtotal - discountAmount + taxAmount;
    
    return {
      subtotal: subtotal.toFixed(2),
      discount: discountAmount.toFixed(2),
      tax: taxAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  // Payment processing
  const processPayment = async () => {
    const totals = calculateTotals();
    
    if (paymentMethod === 'cash' && receivedAmount < parseFloat(totals.total)) {
      message.error('Insufficient payment amount');
      return;
    }

    setIsProcessing(true);

    try {
      const orderData = {
        customer_id: selectedCustomer?.id || null,
        staff_id: user.staffId,
        items: cart.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          subtotal: item.subtotal
        })),
        subtotal: parseFloat(totals.subtotal),
        discount_amount: parseFloat(totals.discount),
        tax_amount: parseFloat(totals.tax),
        total_amount: parseFloat(totals.total),
        payment_method: paymentMethod,
        payment_status: 'completed',
        status: 'completed'
      };

      const response = await ordersAPI.create(orderData);
      
      if (response.id) {
        // Success
        message.success('Order completed successfully!');
        
        // WebSocket notification
        if (isConnected) {
          sendMessage('pos_activity', {
            activity: 'sale_completed',
            details: {
              orderId: response.id,
              total: parseFloat(totals.total),
              itemCount: cart.length,
              customerId: selectedCustomer?.id
            }
          });
        }

        // Print receipt
        printReceipt(response, totals);
        
        // Clear cart and close modal
        setCart([]);
        setSelectedCustomer(null);
        setDiscount({ type: 'none', value: 0 });
        setReceivedAmount(0);
        setShowPaymentModal(false);
        
        // Reload products to update stock
        loadProducts();
      }
      
    } catch (error) {
      message.error('Failed to process payment');
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = (order, totals) => {
    // In a real implementation, this would interface with a receipt printer
    const receiptWindow = window.open('', '_blank');
    const receiptContent = `
      <html>
        <head>
          <title>Receipt #${order.id}</title>
          <style>
            body { font-family: monospace; width: 300px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .item { display: flex; justify-content: space-between; }
            .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Enterprise POS</h2>
            <p>Receipt #${order.id}</p>
            <p>${new Date().toLocaleString()}</p>
            <p>Cashier: ${user.name}</p>
            ${selectedCustomer ? `<p>Customer: ${selectedCustomer.name}</p>` : ''}
          </div>
          
          ${cart.map(item => `
            <div class="item">
              <span>${item.name} x${item.quantity}</span>
              <span>$${item.subtotal.toFixed(2)}</span>
            </div>
          `).join('')}
          
          <div class="total">
            <div class="item">
              <span>Subtotal:</span>
              <span>$${totals.subtotal}</span>
            </div>
            ${parseFloat(totals.discount) > 0 ? `
              <div class="item">
                <span>Discount:</span>
                <span>-$${totals.discount}</span>
              </div>
            ` : ''}
            <div class="item">
              <span>Tax:</span>
              <span>$${totals.tax}</span>
            </div>
            <div class="item" style="font-weight: bold;">
              <span>Total:</span>
              <span>$${totals.total}</span>
            </div>
            ${paymentMethod === 'cash' ? `
              <div class="item">
                <span>Cash Received:</span>
                <span>$${receivedAmount.toFixed(2)}</span>
              </div>
              <div class="item">
                <span>Change:</span>
                <span>$${(receivedAmount - parseFloat(totals.total)).toFixed(2)}</span>
              </div>
            ` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 20px;">
            <p>Thank you for your business!</p>
          </div>
          
          <script>
            window.print();
            window.close();
          </script>
        </body>
      </html>
    `;
    
    receiptWindow.document.write(receiptContent);
    receiptWindow.document.close();
  };

  // Cart table columns
  const cartColumns = [
    {
      title: 'Item',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            SKU: {record.sku}
          </Text>
        </div>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price.toFixed(2)}`,
      width: 80,
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (quantity, record) => (
        <Space>
          <Button
            size="small"
            icon={<MinusOutlined />}
            onClick={() => updateCartItemQuantity(record.id, quantity - 1)}
          />
          <InputNumber
            size="small"
            value={quantity}
            min={1}
            max={99}
            style={{ width: 60 }}
            onChange={(value) => updateCartItemQuantity(record.id, value)}
          />
          <Button
            size="small"
            icon={<PlusOutlined />}
            onClick={() => updateCartItemQuantity(record.id, quantity + 1)}
          />
        </Space>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'subtotal',
      key: 'subtotal',
      render: (subtotal) => `$${subtotal.toFixed(2)}`,
      width: 80,
    },
    {
      title: 'Action',
      key: 'action',
      width: 60,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeFromCart(record.id)}
        />
      ),
    },
  ];

  const totals = calculateTotals();

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Card size="small" style={{ marginBottom: 8 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Avatar icon={<UserOutlined />} />
              <div>
                <Text strong>{user.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Terminal • {new Date().toLocaleString()}
                </Text>
              </div>
            </Space>
          </Col>
          <Col>
            <Space>
              <Badge status={isConnected ? 'success' : 'error'} text="Connection" />
              <Button
                icon={<ScanOutlined />}
                onClick={scanning ? stopBarcodeScanning : startBarcodeScanning}
                type={scanning ? 'danger' : 'default'}
              >
                {scanning ? 'Stop Scan' : 'Scan (F1)'}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <div style={{ flex: 1, display: 'flex', gap: 8 }}>
        {/* Left Panel - Products */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
          {/* Search and Controls */}
          <Card size="small" style={{ marginBottom: 8 }}>
            <Row gutter={8}>
              <Col flex={1}>
                <Input
                  ref={barcodeInputRef}
                  placeholder="Scan barcode or enter SKU..."
                  prefix={<ScanOutlined />}
                  onKeyPress={handleBarcodeInput}
                  size="large"
                />
              </Col>
              <Col flex={1}>
                <Input
                  ref={searchInputRef}
                  placeholder="Search products... (Ctrl+F)"
                  prefix={<SearchOutlined />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  size="large"
                />
              </Col>
              <Col>
                <Select
                  placeholder="Category"
                  style={{ width: 120 }}
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  allowClear
                  size="large"
                >
                  {categories.map(cat => (
                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                  ))}
                </Select>
              </Col>
            </Row>
          </Card>

          {/* Quick Products */}
          <Card title="Quick Access" size="small" style={{ marginBottom: 8 }}>
            <Row gutter={[8, 8]}>
              {quickProducts.map(product => (
                <Col span={6} key={product.id}>
                  <Button
                    style={{ 
                      height: 60, 
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      fontSize: '12px'
                    }}
                    onClick={() => addToCart(product)}
                    disabled={product.current_stock === 0}
                  >
                    <div style={{ fontWeight: 'bold' }}>{product.name}</div>
                    <div>${product.price}</div>
                  </Button>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Product Grid */}
          <Card title="Products" size="small" style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ height: '100%', overflowY: 'auto' }}>
              <Row gutter={[8, 8]}>
                {filteredProducts.map(product => (
                  <Col span={8} key={product.id}>
                    <Card
                      size="small"
                      hoverable
                      onClick={() => addToCart(product)}
                      style={{ 
                        height: 120,
                        cursor: product.current_stock > 0 ? 'pointer' : 'not-allowed',
                        opacity: product.current_stock > 0 ? 1 : 0.6
                      }}
                      bodyStyle={{ 
                        padding: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        height: '100%'
                      }}
                    >
                      <div>
                        <Text strong style={{ fontSize: '12px' }}>
                          {product.name}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '10px' }}>
                          {product.sku}
                        </Text>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div>
                          <Text strong>${product.price.toFixed(2)}</Text>
                        </div>
                        <div>
                          <Tag 
                            color={product.current_stock > 10 ? 'green' : 'orange'}
                            style={{ fontSize: '10px' }}
                          >
                            Stock: {product.current_stock}
                          </Tag>
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          </Card>
        </div>

        {/* Right Panel - Cart */}
        <div style={{ width: 400, display: 'flex', flexDirection: 'column' }}>
          {/* Customer Selection */}
          <Card size="small" style={{ marginBottom: 8 }}>
            <Button
              block
              icon={<UserOutlined />}
              onClick={() => setShowCustomerModal(true)}
              style={{ textAlign: 'left' }}
            >
              {selectedCustomer ? selectedCustomer.name : 'Select Customer (Ctrl+C)'}
            </Button>
          </Card>

          {/* Cart */}
          <Card 
            title={
              <Space>
                <ShoppingCartOutlined />
                Cart ({cart.length} items)
                {cart.length > 0 && (
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={clearCart}
                  >
                    Clear
                  </Button>
                )}
              </Space>
            }
            size="small"
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, padding: 0 }}
          >
            <Table
              columns={cartColumns}
              dataSource={cart}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ y: 'calc(100vh - 400px)' }}
              locale={{ emptyText: 'No items in cart' }}
            />
          </Card>

          {/* Order Summary */}
          <Card size="small" style={{ marginTop: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {/* Discount Controls */}
              <Row justify="space-between">
                <Text>Discount:</Text>
                <Space>
                  <Select
                    value={discount.type}
                    style={{ width: 80 }}
                    size="small"
                    onChange={(type) => applyDiscount(type, discount.value)}
                  >
                    <Option value="none">None</Option>
                    <Option value="percentage">%</Option>
                    <Option value="fixed">$</Option>
                  </Select>
                  {discount.type !== 'none' && (
                    <InputNumber
                      size="small"
                      value={discount.value}
                      onChange={(value) => applyDiscount(discount.type, value)}
                      style={{ width: 80 }}
                    />
                  )}
                </Space>
              </Row>

              <Divider style={{ margin: '8px 0' }} />

              {/* Totals */}
              <Row justify="space-between">
                <Text>Subtotal:</Text>
                <Text>${totals.subtotal}</Text>
              </Row>
              
              {parseFloat(totals.discount) > 0 && (
                <Row justify="space-between">
                  <Text>Discount:</Text>
                  <Text>-${totals.discount}</Text>
                </Row>
              )}
              
              <Row justify="space-between">
                <Text>Tax (10%):</Text>
                <Text>${totals.tax}</Text>
              </Row>
              
              <Row justify="space-between">
                <Text strong style={{ fontSize: '16px' }}>Total:</Text>
                <Text strong style={{ fontSize: '16px' }}>${totals.total}</Text>
              </Row>

              <Button
                type="primary"
                size="large"
                block
                icon={<CreditCardOutlined />}
                onClick={() => setShowPaymentModal(true)}
                disabled={cart.length === 0}
              >
                Pay Now (Ctrl+P)
              </Button>
            </Space>
          </Card>
        </div>
      </div>

      {/* Camera Modal for Scanning */}
      {scanning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}
          onClick={stopBarcodeScanning}
        >
          <video
            ref={videoRef}
            autoPlay
            style={{ maxWidth: '80%', maxHeight: '80%' }}
          />
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        title="Process Payment"
        open={showPaymentModal}
        onCancel={() => setShowPaymentModal(false)}
        footer={null}
        width={500}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Order Summary */}
          <Card title="Order Summary" size="small">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Row justify="space-between">
                <Text>Subtotal:</Text>
                <Text>${totals.subtotal}</Text>
              </Row>
              {parseFloat(totals.discount) > 0 && (
                <Row justify="space-between">
                  <Text>Discount:</Text>
                  <Text>-${totals.discount}</Text>
                </Row>
              )}
              <Row justify="space-between">
                <Text>Tax:</Text>
                <Text>${totals.tax}</Text>
              </Row>
              <Row justify="space-between">
                <Text strong style={{ fontSize: '18px' }}>Total:</Text>
                <Text strong style={{ fontSize: '18px' }}>${totals.total}</Text>
              </Row>
            </Space>
          </Card>

          {/* Payment Method */}
          <div>
            <Text strong>Payment Method:</Text>
            <Select
              value={paymentMethod}
              onChange={setPaymentMethod}
              style={{ width: '100%', marginTop: 8 }}
              size="large"
            >
              <Option value="cash">Cash</Option>
              <Option value="card">Credit/Debit Card</Option>
              <Option value="digital">Digital Wallet</Option>
            </Select>
          </div>

          {/* Cash Payment */}
          {paymentMethod === 'cash' && (
            <div>
              <Text strong>Amount Received:</Text>
              <InputNumber
                value={receivedAmount}
                onChange={setReceivedAmount}
                style={{ width: '100%', marginTop: 8 }}
                size="large"
                formatter={value => `$ ${value}`}
                parser={value => value.replace(/\$\s?|(,*)/g, '')}
                step={0.01}
              />
              {receivedAmount > 0 && (
                <div style={{ marginTop: 8 }}>
                  <Text>
                    Change: ${Math.max(0, receivedAmount - parseFloat(totals.total)).toFixed(2)}
                  </Text>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => setShowPaymentModal(false)}>
              Cancel
            </Button>
            <Button
              type="primary"
              loading={isProcessing}
              onClick={processPayment}
              disabled={
                paymentMethod === 'cash' && 
                receivedAmount < parseFloat(totals.total)
              }
            >
              Complete Payment
            </Button>
          </Space>
        </Space>
      </Modal>

      {/* Customer Selection Modal */}
      <Modal
        title="Select Customer"
        open={showCustomerModal}
        onCancel={() => setShowCustomerModal(false)}
        footer={null}
        width={600}
      >
        {/* Customer search and selection would go here */}
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Text type="secondary">Customer selection interface would be implemented here</Text>
          <br />
          <Button 
            type="primary" 
            style={{ marginTop: 16 }}
            onClick={() => setShowCustomerModal(false)}
          >
            Continue without customer
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default POSTerminal;