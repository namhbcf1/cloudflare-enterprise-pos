// frontend/src/pages/cashier/POS/PaymentProcessor.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal, Button, Radio, Input, InputNumber, Row, Col, Divider, Space,
  Card, Typography, Tag, Alert, Spin, message, Progress, Image
} from 'antd';
import {
  CreditCardOutlined, WalletOutlined, MobileOutlined, BankOutlined,
  DollarOutlined, CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined,
  QrcodeOutlined, GiftOutlined, PrinterOutlined, SendOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const PaymentProcessor = ({
  visible,
  onClose,
  orderTotal,
  customer,
  orderData,
  onPaymentSuccess,
  onPaymentFailed
}) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState(orderTotal);
  const [processing, setProcessing] = useState(false);
  const [paymentStep, setPaymentStep] = useState('method'); // method, processing, success, failed
  const [qrCode, setQrCode] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [splitPayments, setSplitPayments] = useState([]);
  const [loyaltyPointsUsed, setLoyaltyPointsUsed] = useState(0);
  const [paymentResult, setPaymentResult] = useState(null);

  // Payment methods configuration
  const paymentMethods = [
    {
      key: 'cash',
      label: 'Tiền mặt',
      icon: <DollarOutlined />,
      color: '#52c41a',
      description: 'Thanh toán bằng tiền mặt'
    },
    {
      key: 'card',
      label: 'Thẻ tín dụng/ghi nợ',
      icon: <CreditCardOutlined />,
      color: '#1890ff',
      description: 'Visa, Mastercard, JCB'
    },
    {
      key: 'momo',
      label: 'MoMo',
      icon: <MobileOutlined />,
      color: '#d946ef',
      description: 'Ví điện tử MoMo'
    },
    {
      key: 'zalopay',
      label: 'ZaloPay',
      icon: <WalletOutlined />,
      color: '#0ea5e9',
      description: 'Ví điện tử ZaloPay'
    },
    {
      key: 'banking',
      label: 'Chuyển khoản ngân hàng',
      icon: <BankOutlined />,
      color: '#f59e0b',
      description: 'QR Banking, Internet Banking'
    },
    {
      key: 'loyalty',
      label: 'Điểm thưởng',
      icon: <GiftOutlined />,
      color: '#8b5cf6',
      description: `Có ${customer?.loyaltyPoints || 0} điểm`
    }
  ];

  // Calculate change
  const change = paymentMethod === 'cash' ? Math.max(0, cashReceived - orderTotal) : 0;

  // Calculate max loyalty points usable (1 point = 1000 VND)
  const maxLoyaltyPoints = Math.min(
    customer?.loyaltyPoints || 0,
    Math.floor(orderTotal / 1000)
  );

  // Reset when modal opens
  useEffect(() => {
    if (visible) {
      setPaymentMethod('cash');
      setCashReceived(orderTotal);
      setPaymentStep('method');
      setLoyaltyPointsUsed(0);
      setSplitPayments([]);
      setProcessing(false);
    }
  }, [visible, orderTotal]);

  // Generate QR code for digital payments
  const generateQR = async (method) => {
    try {
      const response = await fetch('/api/payment/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method,
          amount: orderTotal,
          orderId: orderData.id,
          description: `Thanh toán đơn hàng #${orderData.id}`
        })
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
      }
    } catch (error) {
      console.error('Error generating QR:', error);
    }
  };

  // Process payment
  const processPayment = async () => {
    if (paymentMethod === 'cash' && cashReceived < orderTotal) {
      message.error('Số tiền nhận không đủ!');
      return;
    }

    setProcessing(true);
    setPaymentStep('processing');

    try {
      const paymentData = {
        method: paymentMethod,
        amount: orderTotal,
        received: paymentMethod === 'cash' ? cashReceived : orderTotal,
        change: change,
        loyaltyPointsUsed,
        cardNumber: paymentMethod === 'card' ? cardNumber.slice(-4) : null,
        orderId: orderData.id,
        customerId: customer?.id,
        splitPayments
      };

      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const result = await response.json();
        setPaymentResult(result);
        setPaymentStep('success');
        
        // Wait a moment then call success callback
        setTimeout(() => {
          onPaymentSuccess({
            ...result,
            paymentMethod,
            change
          });
        }, 1500);
      } else {
        throw new Error('Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStep('failed');
      onPaymentFailed(error);
    } finally {
      setProcessing(false);
    }
  };

  // Add split payment
  const addSplitPayment = () => {
    const remaining = orderTotal - splitPayments.reduce((sum, p) => sum + p.amount, 0);
    if (remaining > 0) {
      setSplitPayments([
        ...splitPayments,
        {
          id: Date.now(),
          method: 'cash',
          amount: remaining
        }
      ]);
    }
  };

  // Print receipt
  const printReceipt = async () => {
    try {
      await fetch('/api/print/receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.id,
          paymentResult
        })
      });
      message.success('Đã in hóa đơn!');
    } catch (error) {
      console.error('Print error:', error);
      message.error('Lỗi in hóa đơn!');
    }
  };

  // Send receipt via email/SMS
  const sendReceipt = async (method) => {
    try {
      await fetch(`/api/receipt/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: orderData.id,
          customer: customer,
          paymentResult
        })
      });
      message.success(`Đã gửi hóa đơn qua ${method === 'email' ? 'email' : 'SMS'}!`);
    } catch (error) {
      console.error('Send receipt error:', error);
    }
  };

  const renderPaymentMethod = () => {
    return (
      <div>
        <Title level={4} style={{ textAlign: 'center', marginBottom: 24 }}>
          💳 Chọn phương thức thanh toán
        </Title>

        <Row gutter={[16, 16]}>
          {paymentMethods.map(method => (
            <Col span={12} key={method.key}>
              <Card
                hoverable
                style={{
                  border: paymentMethod === method.key ? `2px solid ${method.color}` : '1px solid #d9d9d9',
                  background: paymentMethod === method.key ? `${method.color}10` : 'white'
                }}
                onClick={() => {
                  setPaymentMethod(method.key);
                  if (['momo', 'zalopay', 'banking'].includes(method.key)) {
                    generateQR(method.key);
                  }
                }}
              >
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                  <div style={{ fontSize: 24, color: method.color }}>
                    {method.icon}
                  </div>
                  <Text strong style={{ textAlign: 'center' }}>
                    {method.label}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12, textAlign: 'center' }}>
                    {method.description}
                  </Text>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        <Divider />

        {/* Payment Details */}
        {paymentMethod === 'cash' && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Text>Tổng tiền:</Text>
                <div>
                  <Title level={4} style={{ color: '#1890ff', margin: 0 }}>
                    ₫{orderTotal.toLocaleString()}
                  </Title>
                </div>
              </Col>
              <Col span={12}>
                <Text>Tiền khách đưa:</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={cashReceived}
                  onChange={setCashReceived}
                  min={orderTotal}
                  formatter={value => `₫ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={value => value.replace(/₫\s?|(,*)/g, '')}
                  size="large"
                />
              </Col>
            </Row>

            {change > 0 && (
              <Alert
                style={{ marginTop: 16 }}
                type="success"
                message={
                  <div style={{ textAlign: 'center' }}>
                    <Text strong>Tiền thừa: </Text>
                    <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                      ₫{change.toLocaleString()}
                    </Text>
                  </div>
                }
              />
            )}
          </div>
        )}

        {paymentMethod === 'card' && (
          <div>
            <Input
              placeholder="Nhập 4 số cuối thẻ (tùy chọn)"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              maxLength={4}
              style={{ marginBottom: 16 }}
            />
            <Alert
              type="info"
              message="Vui lòng vuốt thẻ hoặc đưa thẻ vào máy POS"
            />
          </div>
        )}

        {['momo', 'zalopay', 'banking'].includes(paymentMethod) && (
          <div style={{ textAlign: 'center' }}>
            {qrCode ? (
              <div>
                <Image
                  src={qrCode}
                  alt="QR Code"
                  width={200}
                  height={200}
                  style={{ border: '1px solid #d9d9d9' }}
                />
                <div style={{ marginTop: 16 }}>
                  <Alert
                    type="info"
                    message="Quét mã QR để thanh toán"
                    description={`Số tiền: ₫${orderTotal.toLocaleString()}`}
                  />
                </div>
              </div>
            ) : (
              <Spin size="large" />
            )}
          </div>
        )}

        {paymentMethod === 'loyalty' && customer?.loyaltyPoints > 0 && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Text>Điểm có sẵn:</Text>
                <div>
                  <Title level={4} style={{ color: '#8b5cf6', margin: 0 }}>
                    {customer.loyaltyPoints.toLocaleString()} điểm
                  </Title>
                </div>
              </Col>
              <Col span={12}>
                <Text>Sử dụng điểm:</Text>
                <InputNumber
                  style={{ width: '100%' }}
                  value={loyaltyPointsUsed}
                  onChange={setLoyaltyPointsUsed}
                  min={0}
                  max={maxLoyaltyPoints}
                  size="large"
                />
              </Col>
            </Row>
            <div style={{ marginTop: 16 }}>
              <Text type="secondary">
                Giá trị quy đổi: ₫{(loyaltyPointsUsed * 1000).toLocaleString()}
              </Text>
            </div>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <Space>
            <Button onClick={onClose}>
              Hủy
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={processPayment}
              disabled={
                (paymentMethod === 'cash' && cashReceived < orderTotal) ||
                (paymentMethod === 'loyalty' && loyaltyPointsUsed === 0)
              }
            >
              Thanh toán ₫{orderTotal.toLocaleString()}
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  const renderProcessing = () => {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 48 }} />} />
        <Title level={3} style={{ marginTop: 24 }}>
          Đang xử lý thanh toán...
        </Title>
        <Text type="secondary">
          Vui lòng chờ trong giây lát
        </Text>
        <Progress 
          percent={processing ? 100 : 0} 
          status="active"
          style={{ marginTop: 24 }}
        />
      </div>
    );
  };

  const renderSuccess = () => {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <CheckCircleOutlined 
          style={{ fontSize: 64, color: '#52c41a', marginBottom: 24 }} 
        />
        <Title level={2} style={{ color: '#52c41a' }}>
          Thanh toán thành công!
        </Title>
        
        <Card style={{ marginTop: 24, textAlign: 'left' }}>
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary">Mã giao dịch:</Text>
              <div><Text strong>{paymentResult?.transactionId}</Text></div>
            </Col>
            <Col span={12}>
              <Text type="secondary">Phương thức:</Text>
              <div><Text strong>{paymentMethods.find(m => m.key === paymentMethod)?.label}</Text></div>
            </Col>
          </Row>
          
          <Divider />
          
          <Row gutter={16}>
            <Col span={12}>
              <Text type="secondary">Tổng tiền:</Text>
              <div><Text strong>₫{orderTotal.toLocaleString()}</Text></div>
            </Col>
            {change > 0 && (
              <Col span={12}>
                <Text type="secondary">Tiền thừa:</Text>
                <div><Text strong style={{ color: '#52c41a' }}>₫{change.toLocaleString()}</Text></div>
              </Col>
            )}
          </Row>
        </Card>

        <div style={{ marginTop: 24 }}>
          <Space>
            <Button 
              icon={<PrinterOutlined />}
              onClick={printReceipt}
            >
              In hóa đơn
            </Button>
            {customer?.email && (
              <Button 
                icon={<SendOutlined />}
                onClick={() => sendReceipt('email')}
              >
                Gửi email
              </Button>
            )}
            {customer?.phone && (
              <Button 
                icon={<SendOutlined />}
                onClick={() => sendReceipt('sms')}
              >
                Gửi SMS
              </Button>
            )}
          </Space>
        </div>

        <div style={{ marginTop: 24 }}>
          <Button type="primary" size="large" onClick={onClose}>
            Hoàn tất
          </Button>
        </div>
      </div>
    );
  };

  const renderFailed = () => {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <CloseCircleOutlined 
          style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 24 }} 
        />
        <Title level={2} style={{ color: '#ff4d4f' }}>
          Thanh toán thất bại!
        </Title>
        <Text type="secondary">
          Vui lòng thử lại hoặc chọn phương thức khác
        </Text>
        
        <div style={{ marginTop: 24 }}>
          <Space>
            <Button onClick={() => setPaymentStep('method')}>
              Thử lại
            </Button>
            <Button type="primary" onClick={onClose}>
              Đóng
            </Button>
          </Space>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (paymentStep) {
      case 'method':
        return renderPaymentMethod();
      case 'processing':
        return renderProcessing();
      case 'success':
        return renderSuccess();
      case 'failed':
        return renderFailed();
      default:
        return renderPaymentMethod();
    }
  };

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={paymentStep === 'processing' ? null : onClose}
      footer={null}
      width={600}
      maskClosable={paymentStep !== 'processing'}
      destroyOnClose
    >
      {renderContent()}
    </Modal>
  );
};

export default PaymentProcessor;