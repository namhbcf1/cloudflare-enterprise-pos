/**
 * Payment Processor Component
 * Advanced payment processing with multiple methods and validation
 */

import React, { useState, useEffect } from 'react';
import {
    Modal,
    Steps,
    Card,
    Space,
    Typography,
    Button,
    Select,
    Input,
    InputNumber,
    Row,
    Col,
    Statistic,
    Alert,
    Progress,
    Result,
    QRCode,
    Divider,
    Checkbox,
    Form,
    Radio,
    theme,
    message
} from 'antd';
import {
    CreditCardOutlined,
    DollarOutlined,
    MobileOutlined,
    BankOutlined,
    CheckCircleOutlined,
    LoadingOutlined,
    ExclamationCircleOutlined,
    QrcodeOutlined,
    PrinterOutlined,
    SendOutlined,
    WifiOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Step } = Steps;
const { useToken } = theme;

const PaymentProcessor = ({
    visible,
    onClose,
    orderData,
    onPaymentSuccess,
    onPaymentError,
    isOnline = true
}) => {
    const { token } = useToken();
    const [form] = Form.useForm();

    // Payment flow state
    const [currentStep, setCurrentStep] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [processing, setProcessing] = useState(false);
    const [paymentResult, setPaymentResult] = useState(null);

    // Payment data
    const [paymentData, setPaymentData] = useState({
        method: 'cash',
        amount: 0,
        amountReceived: 0,
        change: 0,
        reference: '',
        cardDetails: {},
        bankDetails: {},
        eWalletDetails: {}
    });

    // Receipt options
    const [receiptOptions, setReceiptOptions] = useState({
        print: true,
        email: false,
        sms: false,
        customerEmail: '',
        customerPhone: ''
    });

    // QR Code for digital payments
    const [qrCodeData, setQrCodeData] = useState('');
    const [qrExpiry, setQrExpiry] = useState(300); // 5 minutes

    const { calculations } = orderData || {};
    const total = calculations?.total || 0;

    useEffect(() => {
        if (visible) {
            setCurrentStep(0);
            setPaymentData(prev => ({
                ...prev,
                amount: total,
                amountReceived: total
            }));
            form.resetFields();
        }
    }, [visible, total, form]);

    // Payment method configurations
    const paymentMethods = [
        {
            key: 'cash',
            title: 'Tiền mặt',
            icon: <DollarOutlined />,
            description: 'Thanh toán bằng tiền mặt',
            color: '#52c41a',
            available: true
        },
        {
            key: 'card',
            title: 'Thẻ tín dụng/ghi nợ',
            icon: <CreditCardOutlined />,
            description: 'Visa, Mastercard, JCB',
            color: '#1890ff',
            available: isOnline
        },
        {
            key: 'bank_transfer',
            title: 'Chuyển khoản ngân hàng',
            icon: <BankOutlined />,
            description: 'Internet Banking, QR Code',
            color: '#722ed1',
            available: isOnline
        },
        {
            key: 'e_wallet',
            title: 'Ví điện tử',
            icon: <MobileOutlined />,
            description: 'MoMo, ZaloPay, ViettelPay',
            color: '#fa541c',
            available: isOnline
        }
    ];

    // Handle payment method selection
    const handleMethodSelect = (method) => {
        setPaymentMethod(method);
        setPaymentData(prev => ({ ...prev, method }));
        setCurrentStep(1);

        // Generate QR code for digital payments
        if (['bank_transfer', 'e_wallet'].includes(method)) {
            generateQRCode(method);
        }
    };

    // Generate QR code for digital payments
    const generateQRCode = (method) => {
        const qrData = {
            method,
            amount: total,
            merchant: 'Cloudflare POS',
            orderId: `ORDER_${Date.now()}`,
            timestamp: new Date().toISOString()
        };
        
        setQrCodeData(JSON.stringify(qrData));
        
        // Start countdown for QR expiry
        const interval = setInterval(() => {
            setQrExpiry(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    // Process payment
    const processPayment = async () => {
        setProcessing(true);
        setCurrentStep(2);

        try {
            // Validate payment data
            const isValid = await validatePayment();
            if (!isValid) {
                throw new Error('Dữ liệu thanh toán không hợp lệ');
            }

            // Simulate payment processing
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Simulate random success/failure for demo
            const success = Math.random() > 0.1; // 90% success rate

            if (success) {
                const result = {
                    success: true,
                    transactionId: `TXN_${Date.now()}`,
                    method: paymentMethod,
                    amount: total,
                    timestamp: new Date().toISOString(),
                    reference: paymentData.reference || generateReference(),
                    receiptOptions
                };

                setPaymentResult(result);
                setCurrentStep(3);

                // Call success callback after a delay
                setTimeout(() => {
                    onPaymentSuccess(result);
                    message.success('Thanh toán thành công!');
                }, 1000);
            } else {
                throw new Error('Giao dịch bị từ chối. Vui lòng thử lại.');
            }
        } catch (error) {
            setPaymentResult({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
            setCurrentStep(3);
            onPaymentError(error);
        } finally {
            setProcessing(false);
        }
    };

    // Validate payment data
    const validatePayment = async () => {
        try {
            await form.validateFields();
            
            switch (paymentMethod) {
                case 'cash':
                    return paymentData.amountReceived >= total;
                case 'card':
                    return paymentData.cardDetails.number && paymentData.cardDetails.expiry;
                case 'bank_transfer':
                    return paymentData.bankDetails.bank && paymentData.reference;
                case 'e_wallet':
                    return paymentData.eWalletDetails.provider && paymentData.eWalletDetails.phone;
                default:
                    return false;
            }
        } catch (error) {
            return false;
        }
    };

    // Generate reference number
    const generateReference = () => {
        return `REF${Date.now()}${Math.floor(Math.random() * 1000)}`;
    };

    // Handle form submission
    const handleFormSubmit = (values) => {
        setPaymentData(prev => ({
            ...prev,
            ...values
        }));
        processPayment();
    };

    // Retry payment
    const retryPayment = () => {
        setCurrentStep(1);
        setPaymentResult(null);
        setProcessing(false);
    };

    // Steps configuration
    const steps = [
        {
            title: 'Chọn phương thức',
            icon: <CreditCardOutlined />
        },
        {
            title: 'Nhập thông tin',
            icon: <DollarOutlined />
        },
        {
            title: 'Xử lý thanh toán',
            icon: processing ? <LoadingOutlined /> : <CheckCircleOutlined />
        },
        {
            title: 'Hoàn thành',
            icon: <CheckCircleOutlined />
        }
    ];

    return (
        <Modal
            title="Xử lý thanh toán"
            open={visible}
            onCancel={onClose}
            width={800}
            footer={null}
            destroyOnClose
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* Progress Steps */}
                <Steps current={currentStep} items={steps} />

                {/* Offline Warning */}
                {!isOnline && (
                    <Alert
                        message="Chế độ ngoại tuyến"
                        description="Chỉ có thể thanh toán bằng tiền mặt. Giao dịch sẽ được đồng bộ khi có kết nối."
                        type="warning"
                        icon={<ExclamationCircleOutlined />}
                        showIcon
                    />
                )}

                {/* Order Summary */}
                <Card title="Tóm tắt đơn hàng" size="small">
                    <Row gutter={16}>
                        <Col span={6}>
                            <Statistic
                                title="Tạm tính"
                                value={calculations?.subtotal || 0}
                                suffix="đ"
                                precision={0}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Giảm giá"
                                value={calculations?.discountAmount || 0}
                                suffix="đ"
                                precision={0}
                                valueStyle={{ color: token.colorSuccess }}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Thuế"
                                value={calculations?.taxAmount || 0}
                                suffix="đ"
                                precision={0}
                            />
                        </Col>
                        <Col span={6}>
                            <Statistic
                                title="Tổng cộng"
                                value={total}
                                suffix="đ"
                                precision={0}
                                valueStyle={{ 
                                    color: token.colorPrimary, 
                                    fontSize: 24, 
                                    fontWeight: 'bold' 
                                }}
                            />
                        </Col>
                    </Row>
                </Card>

                {/* Step 0: Payment Method Selection */}
                {currentStep === 0 && (
                    <Card title="Chọn phương thức thanh toán">
                        <Row gutter={[16, 16]}>
                            {paymentMethods.map(method => (
                                <Col key={method.key} xs={24} sm={12} lg={6}>
                                    <Card
                                        hoverable={method.available}
                                        onClick={() => method.available && handleMethodSelect(method.key)}
                                        style={{
                                            textAlign: 'center',
                                            opacity: method.available ? 1 : 0.5,
                                            cursor: method.available ? 'pointer' : 'not-allowed',
                                            borderColor: paymentMethod === method.key ? method.color : undefined
                                        }}
                                        bodyStyle={{ padding: 16 }}
                                    >
                                        <div style={{ fontSize: 32, color: method.color, marginBottom: 8 }}>
                                            {method.icon}
                                        </div>
                                        <Title level={5} style={{ margin: '8px 0 4px' }}>
                                            {method.title}
                                        </Title>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {method.description}
                                        </Text>
                                        {!method.available && (
                                            <div style={{ marginTop: 8 }}>
                                                <Text type="danger" style={{ fontSize: 11 }}>
                                                    <WifiOutlined /> Cần kết nối mạng
                                                </Text>
                                            </div>
                                        )}
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Card>
                )}

                {/* Step 1: Payment Details */}
                {currentStep === 1 && (
                    <Form form={form} onFinish={handleFormSubmit} layout="vertical">
                        {/* Cash Payment */}
                        {paymentMethod === 'cash' && (
                            <CashPaymentForm
                                total={total}
                                onDataChange={(data) => setPaymentData(prev => ({ ...prev, ...data }))}
                            />
                        )}

                        {/* Card Payment */}
                        {paymentMethod === 'card' && (
                            <CardPaymentForm
                                total={total}
                                onDataChange={(data) => setPaymentData(prev => ({ ...prev, cardDetails: data }))}
                            />
                        )}

                        {/* Bank Transfer */}
                        {paymentMethod === 'bank_transfer' && (
                            <BankTransferForm
                                total={total}
                                qrCode={qrCodeData}
                                qrExpiry={qrExpiry}
                                onDataChange={(data) => setPaymentData(prev => ({ ...prev, bankDetails: data }))}
                            />
                        )}

                        {/* E-Wallet Payment */}
                        {paymentMethod === 'e_wallet' && (
                            <EWalletPaymentForm
                                total={total}
                                qrCode={qrCodeData}
                                qrExpiry={qrExpiry}
                                onDataChange={(data) => setPaymentData(prev => ({ ...prev, eWalletDetails: data }))}
                            />
                        )}

                        {/* Receipt Options */}
                        <Card title="Tùy chọn hóa đơn" size="small" style={{ marginTop: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Checkbox
                                    checked={receiptOptions.print}
                                    onChange={(e) => setReceiptOptions(prev => ({ ...prev, print: e.target.checked }))}
                                >
                                    <PrinterOutlined /> In hóa đơn
                                </Checkbox>
                                <Checkbox
                                    checked={receiptOptions.email}
                                    onChange={(e) => setReceiptOptions(prev => ({ ...prev, email: e.target.checked }))}
                                >
                                    <SendOutlined /> Gửi email
                                </Checkbox>
                                {receiptOptions.email && (
                                    <Input
                                        placeholder="Email khách hàng"
                                        value={receiptOptions.customerEmail}
                                        onChange={(e) => setReceiptOptions(prev => ({ ...prev, customerEmail: e.target.value }))}
                                    />
                                )}
                            </Space>
                        </Card>

                        {/* Action Buttons */}
                        <Row justify="space-between" style={{ marginTop: 24 }}>
                            <Button onClick={() => setCurrentStep(0)}>
                                Quay lại
                            </Button>
                            <Button type="primary" htmlType="submit" loading={processing}>
                                Xác nhận thanh toán
                            </Button>
                        </Row>
                    </Form>
                )}

                {/* Step 2: Processing */}
                {currentStep === 2 && (
                    <Card>
                        <div style={{ textAlign: 'center', padding: '40px 0' }}>
                            <LoadingOutlined style={{ fontSize: 48, color: token.colorPrimary }} />
                            <Title level={3} style={{ marginTop: 16 }}>
                                Đang xử lý thanh toán...
                            </Title>
                            <Text type="secondary">
                                Vui lòng chờ trong giây lát
                            </Text>
                            <Progress 
                                percent={processing ? 90 : 100} 
                                status="active" 
                                style={{ marginTop: 16 }}
                            />
                        </div>
                    </Card>
                )}

                {/* Step 3: Result */}
                {currentStep === 3 && paymentResult && (
                    <Card>
                        {paymentResult.success ? (
                            <Result
                                status="success"
                                title="Thanh toán thành công!"
                                subTitle={
                                    <Space direction="vertical">
                                        <Text>Mã giao dịch: {paymentResult.transactionId}</Text>
                                        <Text>Số tiền: {total.toLocaleString('vi-VN')} đ</Text>
                                        <Text>Phương thức: {paymentMethods.find(m => m.key === paymentMethod)?.title}</Text>
                                    </Space>
                                }
                                extra={[
                                    <Button key="print" icon={<PrinterOutlined />}>
                                        In hóa đơn
                                    </Button>,
                                    <Button key="close" type="primary" onClick={onClose}>
                                        Hoàn thành
                                    </Button>
                                ]}
                            />
                        ) : (
                            <Result
                                status="error"
                                title="Thanh toán thất bại"
                                subTitle={paymentResult.error}
                                extra={[
                                    <Button key="retry" type="primary" onClick={retryPayment}>
                                        Thử lại
                                    </Button>,
                                    <Button key="cancel" onClick={onClose}>
                                        Hủy bỏ
                                    </Button>
                                ]}
                            />
                        )}
                    </Card>
                )}
            </Space>
        </Modal>
    );
};

// Cash Payment Form Component
const CashPaymentForm = ({ total, onDataChange }) => {
    const [amountReceived, setAmountReceived] = useState(total);
    const change = amountReceived - total;

    useEffect(() => {
        onDataChange({ amountReceived, change });
    }, [amountReceived, change, onDataChange]);

    const quickAmounts = [
        Math.ceil(total / 1000) * 1000,
        Math.ceil(total / 10000) * 10000,
        Math.ceil(total / 50000) * 50000,
        Math.ceil(total / 100000) * 100000
    ].filter((amount, index, arr) => arr.indexOf(amount) === index && amount >= total);

    return (
        <Card title="Thanh toán tiền mặt">
            <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                    label="Số tiền khách đưa"
                    name="amountReceived"
                    rules={[
                        { required: true, message: 'Vui lòng nhập số tiền' },
                        { 
                            validator: (_, value) => {
                                if (value < total) {
                                    return Promise.reject('Số tiền không đủ');
                                }
                                return Promise.resolve();
                            }
                        }
                    ]}
                    initialValue={total}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        min={0}
                        value={amountReceived}
                        onChange={setAmountReceived}
                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                        suffix="đ"
                        size="large"
                    />
                </Form.Item>

                <div>
                    <Text>Số tiền nhanh:</Text>
                    <div style={{ marginTop: 8 }}>
                        <Space wrap>
                            {quickAmounts.slice(0, 4).map(amount => (
                                <Button
                                    key={amount}
                                    onClick={() => setAmountReceived(amount)}
                                    type={amountReceived === amount ? 'primary' : 'default'}
                                >
                                    {amount.toLocaleString('vi-VN')}
                                </Button>
                            ))}
                        </Space>
                    </div>
                </div>

                <Card size="small" style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
                    <Row justify="space-between">
                        <Text>Tiền thối lại:</Text>
                        <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                            {Math.max(0, change).toLocaleString('vi-VN')} đ
                        </Title>
                    </Row>
                </Card>
            </Space>
        </Card>
    );
};

// Card Payment Form Component
const CardPaymentForm = ({ total, onDataChange }) => {
    const [cardData, setCardData] = useState({
        number: '',
        expiry: '',
        cvv: '',
        name: '',
        type: 'visa'
    });

    useEffect(() => {
        onDataChange(cardData);
    }, [cardData, onDataChange]);

    return (
        <Card title="Thanh toán thẻ">
            <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item
                    label="Loại thẻ"
                    name="cardType"
                    initialValue="visa"
                >
                    <Radio.Group 
                        value={cardData.type}
                        onChange={(e) => setCardData(prev => ({ ...prev, type: e.target.value }))}
                    >
                        <Radio.Button value="visa">Visa</Radio.Button>
                        <Radio.Button value="mastercard">Mastercard</Radio.Button>
                        <Radio.Button value="jcb">JCB</Radio.Button>
                    </Radio.Group>
                </Form.Item>

                <Form.Item
                    label="Số thẻ (4 số cuối)"
                    name="cardNumber"
                    rules={[{ required: true, message: 'Vui lòng nhập 4 số cuối của thẻ' }]}
                >
                    <Input
                        placeholder="1234"
                        maxLength={4}
                        value={cardData.number}
                        onChange={(e) => setCardData(prev => ({ ...prev, number: e.target.value }))}
                    />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            label="Tháng/Năm"
                            name="cardExpiry"
                            rules={[{ required: true, message: 'Vui lòng nhập ngày hết hạn' }]}
                        >
                            <Input
                                placeholder="MM/YY"
                                maxLength={5}
                                value={cardData.expiry}
                                onChange={(e) => setCardData(prev => ({ ...prev, expiry: e.target.value }))}
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            label="Mã bảo mật"
                            name="cardCvv"
                        >
                            <Input
                                placeholder="***"
                                maxLength={4}
                                type="password"
                                value={cardData.cvv}
                                onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value }))}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                <Alert
                    message="Bảo mật"
                    description="Thông tin thẻ được mã hóa và bảo mật theo chuẩn PCI DSS"
                    type="info"
                    showIcon
                />
            </Space>
        </Card>
    );
};

// Bank Transfer Form Component
const BankTransferForm = ({ total, qrCode, qrExpiry, onDataChange }) => {
    const [bankData, setBankData] = useState({
        bank: '',
        accountNumber: '',
        reference: ''
    });

    useEffect(() => {
        onDataChange(bankData);
    }, [bankData, onDataChange]);

    const banks = [
        { value: 'vcb', label: 'Vietcombank' },
        { value: 'tcb', label: 'Techcombank' },
        { value: 'mb', label: 'MB Bank' },
        { value: 'acb', label: 'ACB' },
        { value: 'bidv', label: 'BIDV' }
    ];

    return (
        <Card title="Chuyển khoản ngân hàng">
            <Row gutter={16}>
                <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                            label="Ngân hàng"
                            name="bank"
                            rules={[{ required: true, message: 'Vui lòng chọn ngân hàng' }]}
                        >
                            <Select
                                placeholder="Chọn ngân hàng"
                                options={banks}
                                value={bankData.bank}
                                onChange={(value) => setBankData(prev => ({ ...prev, bank: value }))}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Mã giao dịch"
                            name="reference"
                            rules={[{ required: true, message: 'Vui lòng nhập mã giao dịch' }]}
                        >
                            <Input
                                placeholder="Nhập mã giao dịch từ ngân hàng"
                                value={bankData.reference}
                                onChange={(e) => setBankData(prev => ({ ...prev, reference: e.target.value }))}
                            />
                        </Form.Item>

                        <Alert
                            message={`Số tiền: ${total.toLocaleString('vi-VN')} đ`}
                            description="Vui lòng chuyển khoản đúng số tiền và nhập mã giao dịch"
                            type="warning"
                        />
                    </Space>
                </Col>
                <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                        <Title level={5}>
                            <QrcodeOutlined /> Quét mã QR để chuyển khoản
                        </Title>
                        {qrCode && (
                            <QRCode
                                value={qrCode}
                                size={200}
                                style={{ marginBottom: 16 }}
                            />
                        )}
                        <Progress
                            type="circle"
                            percent={(qrExpiry / 300) * 100}
                            size={80}
                            format={() => `${Math.floor(qrExpiry / 60)}:${(qrExpiry % 60).toString().padStart(2, '0')}`}
                            strokeColor={qrExpiry < 60 ? '#ff4d4f' : '#1890ff'}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">QR Code hết hạn sau</Text>
                        </div>
                    </div>
                </Col>
            </Row>
        </Card>
    );
};

// E-Wallet Payment Form Component
const EWalletPaymentForm = ({ total, qrCode, qrExpiry, onDataChange }) => {
    const [walletData, setWalletData] = useState({
        provider: '',
        phone: '',
        reference: ''
    });

    useEffect(() => {
        onDataChange(walletData);
    }, [walletData, onDataChange]);

    const walletProviders = [
        { value: 'momo', label: 'MoMo', color: '#d70c64' },
        { value: 'zalopay', label: 'ZaloPay', color: '#0068ff' },
        { value: 'viettelpay', label: 'ViettelPay', color: '#f39c12' },
        { value: 'vnpay', label: 'VNPay', color: '#1890ff' }
    ];

    return (
        <Card title="Thanh toán ví điện tử">
            <Row gutter={16}>
                <Col span={12}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Form.Item
                            label="Ví điện tử"
                            name="walletProvider"
                            rules={[{ required: true, message: 'Vui lòng chọn ví điện tử' }]}
                        >
                            <Select
                                placeholder="Chọn ví điện tử"
                                value={walletData.provider}
                                onChange={(value) => setWalletData(prev => ({ ...prev, provider: value }))}
                            >
                                {walletProviders.map(provider => (
                                    <Select.Option key={provider.value} value={provider.value}>
                                        <Space>
                                            <div 
                                                style={{ 
                                                    width: 16, 
                                                    height: 16, 
                                                    backgroundColor: provider.color,
                                                    borderRadius: '50%' 
                                                }} 
                                            />
                                            {provider.label}
                                        </Space>
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            label="Số điện thoại"
                            name="phone"
                            rules={[
                                { required: true, message: 'Vui lòng nhập số điện thoại' },
                                { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                            ]}
                        >
                            <Input
                                placeholder="0901234567"
                                value={walletData.phone}
                                onChange={(e) => setWalletData(prev => ({ ...prev, phone: e.target.value }))}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Mã giao dịch"
                            name="walletReference"
                            rules={[{ required: true, message: 'Vui lòng nhập mã giao dịch' }]}
                        >
                            <Input
                                placeholder="Nhập mã giao dịch từ ví"
                                value={walletData.reference}
                                onChange={(e) => setWalletData(prev => ({ ...prev, reference: e.target.value }))}
                            />
                        </Form.Item>

                        <Alert
                            message={`Số tiền: ${total.toLocaleString('vi-VN')} đ`}
                            description="Vui lòng thanh toán qua ví điện tử và nhập mã giao dịch"
                            type="info"
                        />
                    </Space>
                </Col>
                <Col span={12}>
                    <div style={{ textAlign: 'center' }}>
                        <Title level={5}>
                            <QrcodeOutlined /> Quét mã QR để thanh toán
                        </Title>
                        {qrCode && (
                            <QRCode
                                value={qrCode}
                                size={200}
                                style={{ marginBottom: 16 }}
                            />
                        )}
                        <Progress
                            type="circle"
                            percent={(qrExpiry / 300) * 100}
                            size={80}
                            format={() => `${Math.floor(qrExpiry / 60)}:${(qrExpiry % 60).toString().padStart(2, '0')}`}
                            strokeColor={qrExpiry < 60 ? '#ff4d4f' : '#1890ff'}
                        />
                        <div style={{ marginTop: 8 }}>
                            <Text type="secondary">QR Code hết hạn sau</Text>
                        </div>
                    </div>
                </Col>
            </Row>
        </Card>
    );
};

export default PaymentProcessor;