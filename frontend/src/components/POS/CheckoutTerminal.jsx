/**
 * Enhanced Checkout Terminal Component
 * Full-featured POS terminal with barcode scanning, payment processing, and receipt generation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Row,
    Col,
    Card,
    Table,
    Button,
    Input,
    Space,
    Typography,
    Divider,
    Select,
    InputNumber,
    Modal,
    message,
    Badge,
    Avatar,
    Tooltip,
    Drawer,
    List,
    Empty,
    Statistic,
    Progress,
    theme,
    Tag,
    Checkbox,
    Radio,
    Alert,
    Steps,
    QRCode,
    Image
} from 'antd';
import {
    ShoppingCartOutlined,
    ScanOutlined,
    DeleteOutlined,
    PlusOutlined,
    MinusOutlined,
    DollarOutlined,
    PrinterOutlined,
    UserOutlined,
    GiftOutlined,
    PercentageOutlined,
    ClearOutlined,
    SaveOutlined,
    HistoryOutlined,
    WifiOutlined,
    ExclamationCircleOutlined,
    CreditCardOutlined,
    BankOutlined,
    MobileOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    SearchOutlined,
    PhoneOutlined,
    MailOutlined,
    HomeOutlined,
    StarOutlined,
    HeartOutlined,
    CalendarOutlined,
    TeamOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Search } = Input;
const { useToken } = theme;
const { Step } = Steps;

const CheckoutTerminal = () => {
    const { user, hasPermission } = useAuth();
    const { token } = useToken();
    const scannerRef = useRef(null);

    // Cart state
    const [cart, setCart] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [discount, setDiscount] = useState({ type: 'none', value: 0 });
    const [taxRate, setTaxRate] = useState(10); // 10% default tax
    const [notes, setNotes] = useState('');

    // UI state
    const [scannerActive, setScannerActive] = useState(false);
    const [paymentDrawer, setPaymentDrawer] = useState(false);
    const [customerDrawer, setCustomerDrawer] = useState(false);
    const [transactionHistory, setTransactionHistory] = useState([]);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [offlineQueue, setOfflineQueue] = useState([]);

    // Product search state
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Payment state
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentStep, setPaymentStep] = useState(0);

    // Mock product data (replace with actual API calls)
    const mockProducts = [
        {
            id: 'P001',
            name: 'Coca Cola 330ml',
            barcode: '8934673123456',
            price: 15000,
            stock: 150,
            category: 'Đồ uống',
            image: '/products/coca-cola.jpg'
        },
        {
            id: 'P002',
            name: 'Bánh mì sandwich',
            barcode: '8934673123457',
            price: 25000,
            stock: 50,
            category: 'Thực phẩm',
            image: '/products/sandwich.jpg'
        },
        {
            id: 'P003',
            name: 'Nước suối Lavie 500ml',
            barcode: '8934673123458',
            price: 8000,
            stock: 200,
            category: 'Đồ uống',
            image: '/products/lavie.jpg'
        },
        {
            id: 'P004',
            name: 'Snack khoai tây Lays',
            barcode: '8934673123459',
            price: 12000,
            stock: 80,
            category: 'Snacks',
            image: '/products/lays.jpg'
        }
    ];

    // Mock customers data
    const mockCustomers = [
        {
            id: 'C001',
            name: 'Nguyễn Văn A',
            phone: '0912345678',
            email: 'nguyenvana@email.com',
            address: '123 Đường ABC, Quận 1, TP.HCM',
            loyaltyPoints: 450,
            membershipLevel: 'Gold',
            totalSpent: 5500000,
            visitCount: 23
        },
        {
            id: 'C002',
            name: 'Trần Thị B',
            phone: '0987654321',
            email: 'tranthib@email.com',
            address: '456 Đường XYZ, Quận 3, TP.HCM',
            loyaltyPoints: 280,
            membershipLevel: 'Silver',
            totalSpent: 3200000,
            visitCount: 15
        }
    ];

    // Network status monitoring
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            syncOfflineTransactions();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Calculate totals
    const calculations = React.useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        let discountAmount = 0;
        if (discount.type === 'percentage') {
            discountAmount = (subtotal * discount.value) / 100;
        } else if (discount.type === 'fixed') {
            discountAmount = discount.value;
        }

        const discountedSubtotal = subtotal - discountAmount;
        const taxAmount = (discountedSubtotal * taxRate) / 100;
        const total = discountedSubtotal + taxAmount;

        // Calculate loyalty points (1 point per 1000 VND)
        const loyaltyPointsEarned = Math.floor(total / 1000);

        return {
            subtotal,
            discountAmount,
            taxAmount,
            total,
            itemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
            loyaltyPointsEarned
        };
    }, [cart, discount, taxRate]);

    // Search products
    const searchProducts = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 300));
            
            const results = mockProducts.filter(product =>
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.barcode.includes(query) ||
                product.id.toLowerCase().includes(query.toLowerCase())
            );
            
            setSearchResults(results);
        } catch (error) {
            message.error('Lỗi tìm kiếm sản phẩm');
        } finally {
            setLoading(false);
        }
    }, []);

    // Add product to cart
    const addToCart = (product, quantity = 1) => {
        setCart(prev => {
            const existingItem = prev.find(item => item.id === product.id);
            
            if (existingItem) {
                return prev.map(item =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                return [...prev, {
                    ...product,
                    quantity,
                    addedAt: new Date().toISOString()
                }];
            }
        });
        
        message.success(`Đã thêm ${product.name} vào giỏ hàng`);
        setProductSearch('');
        setSearchResults([]);
    };

    // Update cart item quantity
    const updateCartQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(prev =>
            prev.map(item =>
                item.id === productId
                    ? { ...item, quantity: newQuantity }
                    : item
            )
        );
    };

    // Remove item from cart
    const removeFromCart = (productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
        message.info('Đã xóa sản phẩm khỏi giỏ hàng');
    };

    // Clear cart
    const clearCart = () => {
        Modal.confirm({
            title: 'Xóa toàn bộ giỏ hàng?',
            content: 'Hành động này không thể hoàn tác.',
            onOk: () => {
                setCart([]);
                setSelectedCustomer(null);
                setDiscount({ type: 'none', value: 0 });
                setNotes('');
                message.success('Đã xóa toàn bộ giỏ hàng');
            }
        });
    };

    // Handle barcode scan
    const handleBarcodeScan = async (barcode) => {
        try {
            const product = mockProducts.find(p => p.barcode === barcode);
            
            if (product) {
                addToCart(product);
            } else {
                message.warning(`Không tìm thấy sản phẩm với mã vạch: ${barcode}`);
            }
        } catch (error) {
            message.error('Lỗi quét mã vạch');
        }
    };

    // Save transaction for offline processing
    const saveOfflineTransaction = (transactionData) => {
        const offlineTransaction = {
            ...transactionData,
            id: `OFFLINE_${Date.now()}`,
            timestamp: new Date().toISOString(),
            status: 'pending_sync',
            cashier: user?.fullName || user?.username
        };
        
        setOfflineQueue(prev => [...prev, offlineTransaction]);
        localStorage.setItem('posOfflineQueue', JSON.stringify([...offlineQueue, offlineTransaction]));
        
        message.success('Giao dịch đã được lưu để đồng bộ sau');
    };

    // Sync offline transactions
    const syncOfflineTransactions = async () => {
        if (offlineQueue.length === 0) return;

        try {
            // Simulate API sync
            for (const transaction of offlineQueue) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                console.log('Syncing transaction:', transaction);
            }
            
            setOfflineQueue([]);
            localStorage.removeItem('posOfflineQueue');
            message.success(`Đã đồng bộ ${offlineQueue.length} giao dịch`);
        } catch (error) {
            message.error('Lỗi đồng bộ giao dịch');
        }
    };

    // Process payment
    const processPayment = async (paymentData) => {
        const transactionData = {
            cart,
            customer: selectedCustomer,
            discount,
            calculations,
            payment: paymentData,
            notes,
            cashier: user?.fullName || user?.username,
            timestamp: new Date().toISOString()
        };

        if (!isOnline) {
            saveOfflineTransaction(transactionData);
            clearCart();
            setPaymentDrawer(false);
            return;
        }

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const transaction = {
                ...transactionData,
                id: `TXN_${Date.now()}`,
                status: 'completed'
            };
            
            setTransactionHistory(prev => [transaction, ...prev]);
            message.success('Thanh toán thành công!');
            
            // Print receipt if enabled
            if (paymentData.printReceipt) {
                printReceipt(transaction);
            }
            
            clearCart();
            setPaymentDrawer(false);
        } catch (error) {
            message.error('Lỗi xử lý thanh toán');
        }
    };

    // Print receipt
    const printReceipt = (transaction) => {
        const receiptContent = generateReceiptContent(transaction);
        
        if (window.print) {
            const printWindow = window.open('', '_blank');
            printWindow.document.write(receiptContent);
            printWindow.document.close();
            printWindow.print();
            printWindow.close();
        } else {
            message.warning('Không thể in hóa đơn trên thiết bị này');
        }
    };

    // Generate receipt content
    const generateReceiptContent = (transaction) => {
        return `
            <html>
                <head>
                    <title>Hóa đơn - ${transaction.id}</title>
                    <style>
                        body { font-family: monospace; font-size: 12px; margin: 20px; }
                        .header { text-align: center; margin-bottom: 20px; }
                        .line { border-bottom: 1px dashed #000; margin: 10px 0; }
                        .total { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h2>CLOUDFLARE POS</h2>
                        <p>Hóa đơn bán hàng</p>
                        <p>${transaction.timestamp}</p>
                        <p>Thu ngân: ${transaction.cashier}</p>
                    </div>
                    
                    <div class="line"></div>
                    
                    ${transaction.cart.map(item => `
                        <div>
                            ${item.name} x${item.quantity}
                            <span style="float: right;">${(item.price * item.quantity).toLocaleString('vi-VN')} đ</span>
                        </div>
                    `).join('')}
                    
                    <div class="line"></div>
                    
                    <div>
                        Tạm tính: <span style="float: right;">${transaction.calculations.subtotal.toLocaleString('vi-VN')} đ</span>
                    </div>
                    
                    ${transaction.calculations.discountAmount > 0 ? `
                        <div>
                            Giảm giá: <span style="float: right;">-${transaction.calculations.discountAmount.toLocaleString('vi-VN')} đ</span>
                        </div>
                    ` : ''}
                    
                    <div>
                        Thuế (${taxRate}%): <span style="float: right;">${transaction.calculations.taxAmount.toLocaleString('vi-VN')} đ</span>
                    </div>
                    
                    <div class="line"></div>
                    
                    <div class="total">
                        TỔNG CỘNG: <span style="float: right;">${transaction.calculations.total.toLocaleString('vi-VN')} đ</span>
                    </div>
                    
                    <div class="line"></div>
                    
                    <div class="header">
                        <p>Cảm ơn quý khách!</p>
                        <p>Powered by Cloudflare</p>
                    </div>
                </body>
            </html>
        `;
    };

    // Cart table columns
    const cartColumns = [
        {
            title: 'Sản phẩm',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <Avatar 
                        src={record.image} 
                        icon={<ShoppingCartOutlined />}
                        size="small"
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>{text}</div>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            {record.id} • {record.category}
                        </Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 120,
            render: (quantity, record) => (
                <Space.Compact>
                    <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => updateCartQuantity(record.id, quantity - 1)}
                        disabled={quantity <= 1}
                    />
                    <InputNumber
                        size="small"
                        min={1}
                        max={record.stock}
                        value={quantity}
                        onChange={(value) => updateCartQuantity(record.id, value)}
                        style={{ width: 60 }}
                    />
                    <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => updateCartQuantity(record.id, quantity + 1)}
                        disabled={quantity >= record.stock}
                    />
                </Space.Compact>
            )
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            width: 100,
            render: (price) => (
                <Text strong>
                    {price.toLocaleString('vi-VN')} đ
                </Text>
            )
        },
        {
            title: 'Thành tiền',
            key: 'total',
            width: 120,
            render: (_, record) => (
                <Text strong style={{ color: token.colorPrimary }}>
                    {(record.price * record.quantity).toLocaleString('vi-VN')} đ
                </Text>
            )
        },
        {
            title: '',
            key: 'actions',
            width: 50,
            render: (_, record) => (
                <Button
                    type="text"
                    danger
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => removeFromCart(record.id)}
                />
            )
        }
    ];

    return (
        <div>
            <Row gutter={[16, 16]} style={{ height: '100vh', padding: 16 }}>
                {/* Left Panel - Product Search & Cart */}
                <Col xs={24} lg={16}>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        {/* Header with status */}
                        <Card size="small">
                            <Row justify="space-between" align="middle">
                                <Col>
                                    <Space>
                                        <Title level={4} style={{ margin: 0 }}>
                                            <ShoppingCartOutlined /> Bán hàng
                                        </Title>
                                        <Badge 
                                            status={isOnline ? 'success' : 'error'} 
                                            text={isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                                        />
                                        {offlineQueue.length > 0 && (
                                            <Tag color="orange">
                                                {offlineQueue.length} giao dịch chờ đồng bộ
                                            </Tag>
                                        )}
                                    </Space>
                                </Col>
                                <Col>
                                    <Space>
                                        <Text type="secondary">Thu ngân: {user?.fullName}</Text>
                                        <Button
                                            type="primary"
                                            icon={<ScanOutlined />}
                                            onClick={() => setScannerActive(!scannerActive)}
                                        >
                                            {scannerActive ? 'Tắt' : 'Quét'} mã vạch
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </Card>

                        {/* Product Search */}
                        <Card title="Tìm kiếm sản phẩm" size="small">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Search
                                    placeholder="Tìm theo tên, mã vạch hoặc mã sản phẩm"
                                    value={productSearch}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        searchProducts(e.target.value);
                                    }}
                                    loading={loading}
                                    allowClear
                                    size="large"
                                />
                                
                                {searchResults.length > 0 && (
                                    <List
                                        grid={{ gutter: 8, xs: 1, sm: 2, md: 3, lg: 4 }}
                                        dataSource={searchResults}
                                        renderItem={(product) => (
                                            <List.Item>
                                                <Card
                                                    size="small"
                                                    hoverable
                                                    cover={
                                                        <div style={{ 
                                                            height: 60, 
                                                            background: token.colorFillQuaternary,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}>
                                                            <Avatar 
                                                                src={product.image}
                                                                icon={<ShoppingCartOutlined />}
                                                                size={40}
                                                            />
                                                        </div>
                                                    }
                                                    onClick={() => addToCart(product)}
                                                >
                                                    <Card.Meta
                                                        title={
                                                            <Text style={{ fontSize: 12 }} ellipsis>
                                                                {product.name}
                                                            </Text>
                                                        }
                                                        description={
                                                            <Space direction="vertical" size={0}>
                                                                <Text strong style={{ color: token.colorPrimary }}>
                                                                    {product.price.toLocaleString('vi-VN')} đ
                                                                </Text>
                                                                <Text type="secondary" style={{ fontSize: 10 }}>
                                                                    Kho: {product.stock}
                                                                </Text>
                                                            </Space>
                                                        }
                                                    />
                                                </Card>
                                            </List.Item>
                                        )}
                                    />
                                )}
                            </Space>
                        </Card>

                        {/* Shopping Cart */}
                        <Card 
                            title={
                                <Space>
                                    <span>Giỏ hàng</span>
                                    <Badge count={calculations.itemCount} />
                                </Space>
                            }
                            extra={
                                <Space>
                                    <Button 
                                        icon={<ClearOutlined />}
                                        onClick={clearCart}
                                        disabled={cart.length === 0}
                                    >
                                        Xóa tất cả
                                    </Button>
                                </Space>
                            }
                            style={{ flex: 1 }}
                            bodyStyle={{ padding: 0 }}
                        >
                            {cart.length > 0 ? (
                                <Table
                                    dataSource={cart}
                                    columns={cartColumns}
                                    rowKey="id"
                                    pagination={false}
                                    size="small"
                                    scroll={{ y: 300 }}
                                />
                            ) : (
                                <Empty
                                    description="Giỏ hàng trống"
                                    image={<ShoppingCartOutlined style={{ fontSize: 48, color: token.colorTextTertiary }} />}
                                />
                            )}
                        </Card>
                    </Space>
                </Col>

                {/* Right Panel - Summary & Actions */}
                <Col xs={24} lg={8}>
                    <Space direction="vertical" style={{ width: '100%' }} size="middle">
                        {/* Customer Selection */}
                        <Card title="Khách hàng" size="small">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                {selectedCustomer ? (
                                    <div>
                                        <Row justify="space-between" align="middle">
                                            <Col>
                                                <Space>
                                                    <Avatar icon={<UserOutlined />} />
                                                    <div>
                                                        <Text strong>{selectedCustomer.name}</Text>
                                                        <br />
                                                        <Text type="secondary">{selectedCustomer.phone}</Text>
                                                        <br />
                                                        <Tag color="gold">
                                                            {selectedCustomer.membershipLevel} • {selectedCustomer.loyaltyPoints} điểm
                                                        </Tag>
                                                    </div>
                                                </Space>
                                            </Col>
                                            <Col>
                                                <Button 
                                                    type="link" 
                                                    size="small"
                                                    onClick={() => setSelectedCustomer(null)}
                                                >
                                                    Xóa
                                                </Button>
                                            </Col>
                                        </Row>
                                    </div>
                                ) : (
                                    <Button 
                                        block 
                                        icon={<UserOutlined />}
                                        onClick={() => setCustomerDrawer(true)}
                                    >
                                        Chọn khách hàng
                                    </Button>
                                )}
                            </Space>
                        </Card>

                        {/* Discount */}
                        <Card title="Giảm giá" size="small">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Select
                                    value={discount.type}
                                    onChange={(value) => setDiscount({ type: value, value: 0 })}
                                    style={{ width: '100%' }}
                                    options={[
                                        { label: 'Không giảm giá', value: 'none' },
                                        { label: 'Theo phần trăm', value: 'percentage' },
                                        { label: 'Số tiền cố định', value: 'fixed' }
                                    ]}
                                />
                                
                                {discount.type !== 'none' && (
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        value={discount.value}
                                        onChange={(value) => setDiscount(prev => ({ ...prev, value }))}
                                        min={0}
                                        max={discount.type === 'percentage' ? 100 : calculations.subtotal}
                                        suffix={discount.type === 'percentage' ? '%' : 'đ'}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                    />
                                )}
                            </Space>
                        </Card>

                        {/* Order Summary */}
                        <Card title="Tổng kết đơn hàng" size="small">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Row justify="space-between">
                                    <Text>Tạm tính:</Text>
                                    <Text>{calculations.subtotal.toLocaleString('vi-VN')} đ</Text>
                                </Row>
                                
                                {calculations.discountAmount > 0 && (
                                    <Row justify="space-between">
                                        <Text>Giảm giá:</Text>
                                        <Text style={{ color: token.colorSuccess }}>
                                            -{calculations.discountAmount.toLocaleString('vi-VN')} đ
                                        </Text>
                                    </Row>
                                )}
                                
                                <Row justify="space-between">
                                    <Text>Thuế ({taxRate}%):</Text>
                                    <Text>{calculations.taxAmount.toLocaleString('vi-VN')} đ</Text>
                                </Row>
                                
                                {selectedCustomer && calculations.loyaltyPointsEarned > 0 && (
                                    <Row justify="space-between">
                                        <Text>Điểm thưởng:</Text>
                                        <Text style={{ color: token.colorWarning }}>
                                            +{calculations.loyaltyPointsEarned} điểm
                                        </Text>
                                    </Row>
                                )}
                                
                                <Divider style={{ margin: '8px 0' }} />
                                
                                <Row justify="space-between">
                                    <Title level={4} style={{ margin: 0 }}>Tổng cộng:</Title>
                                    <Title level={4} style={{ margin: 0, color: token.colorPrimary }}>
                                        {calculations.total.toLocaleString('vi-VN')} đ
                                    </Title>
                                </Row>
                            </Space>
                        </Card>

                        {/* Notes */}
                        <Card title="Ghi chú" size="small">
                            <Input.TextArea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Ghi chú cho đơn hàng..."
                                rows={2}
                            />
                        </Card>

                        {/* Action Buttons */}
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Button
                                type="primary"
                                size="large"
                                block
                                icon={<DollarOutlined />}
                                onClick={() => setPaymentDrawer(true)}
                                disabled={cart.length === 0}
                            >
                                Thanh toán ({calculations.total.toLocaleString('vi-VN')} đ)
                            </Button>
                            
                            <Row gutter={8}>
                                <Col span={12}>
                                    <Button
                                        block
                                        icon={<SaveOutlined />}
                                        disabled={cart.length === 0}
                                    >
                                        Lưu tạm
                                    </Button>
                                </Col>
                                <Col span={12}>
                                    <Button
                                        block
                                        icon={<HistoryOutlined />}
                                        onClick={() => {/* Show transaction history */}}
                                    >
                                        Lịch sử
                                    </Button>
                                </Col>
                            </Row>
                        </Space>
                    </Space>
                </Col>
            </Row>

            {/* Payment Drawer */}
            <Drawer
                title="Thanh toán"
                width={600}
                open={paymentDrawer}
                onClose={() => setPaymentDrawer(false)}
                footer={
                    <Space>
                        <Button onClick={() => setPaymentDrawer(false)}>
                            Hủy
                        </Button>
                        <Button 
                            type="primary" 
                            onClick={() => {
                                processPayment({
                                    method: paymentMethod,
                                    amount: paymentAmount,
                                    printReceipt: true
                                });
                            }}
                        >
                            Xác nhận thanh toán
                        </Button>
                    </Space>
                }
            >
                <Steps current={paymentStep} size="small" style={{ marginBottom: 24 }}>
                    <Step title="Chọn phương thức" />
                    <Step title="Nhập số tiền" />
                    <Step title="Xác nhận" />
                </Steps>

                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Card title="Phương thức thanh toán" size="small">
                        <Radio.Group 
                            value={paymentMethod} 
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Radio value="cash">
                                    <Space>
                                        <DollarOutlined />
                                        Tiền mặt
                                    </Space>
                                </Radio>
                                <Radio value="card">
                                    <Space>
                                        <CreditCardOutlined />
                                        Thẻ tín dụng/ghi nợ
                                    </Space>
                                </Radio>
                                <Radio value="bank">
                                    <Space>
                                        <BankOutlined />
                                        Chuyển khoản
                                    </Space>
                                </Radio>
                                <Radio value="ewallet">
                                    <Space>
                                        <MobileOutlined />
                                        Ví điện tử
                                    </Space>
                                </Radio>
                            </Space>
                        </Radio.Group>
                    </Card>

                    <Card title="Thông tin thanh toán" size="small">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Row justify="space-between">
                                <Text>Tổng tiền:</Text>
                                <Text strong style={{ fontSize: 16, color: token.colorPrimary }}>
                                    {calculations.total.toLocaleString('vi-VN')} đ
                                </Text>
                            </Row>
                            
                            <Divider style={{ margin: '8px 0' }} />
                            
                            <div>
                                <Text>Số tiền khách đưa:</Text>
                                <InputNumber
                                    style={{ width: '100%', marginTop: 8 }}
                                    size="large"
                                    value={paymentAmount}
                                    onChange={setPaymentAmount}
                                    min={calculations.total}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                    addonAfter="đ"
                                />
                            </div>
                            
                            {paymentAmount > calculations.total && (
                                <Alert
                                    message={`Tiền thừa: ${(paymentAmount - calculations.total).toLocaleString('vi-VN')} đ`}
                                    type="info"
                                    showIcon
                                />
                            )}
                        </Space>
                    </Card>

                    <Card title="Tùy chọn" size="small">
                        <Space direction="vertical">
                            <Checkbox defaultChecked>
                                In hóa đơn
                            </Checkbox>
                            <Checkbox>
                                Gửi hóa đơn qua email
                            </Checkbox>
                            <Checkbox>
                                Gửi SMS xác nhận
                            </Checkbox>
                        </Space>
                    </Card>
                </Space>
            </Drawer>

            {/* Customer Selection Drawer */}
            <Drawer
                title="Chọn khách hàng"
                width={500}
                open={customerDrawer}
                onClose={() => setCustomerDrawer(false)}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="middle">
                    <Search
                        placeholder="Tìm kiếm khách hàng..."
                        allowClear
                        size="large"
                    />
                    
                    <List
                        dataSource={mockCustomers}
                        renderItem={(customer) => (
                            <List.Item
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    setSelectedCustomer(customer);
                                    setCustomerDrawer(false);
                                }}
                            >
                                <List.Item.Meta
                                    avatar={<Avatar icon={<UserOutlined />} />}
                                    title={
                                        <Space>
                                            <span>{customer.name}</span>
                                            <Tag color="gold">{customer.membershipLevel}</Tag>
                                        </Space>
                                    }
                                    description={
                                        <Space direction="vertical" size={0}>
                                            <Text type="secondary">
                                                <PhoneOutlined /> {customer.phone}
                                            </Text>
                                            <Text type="secondary">
                                                <MailOutlined /> {customer.email}
                                            </Text>
                                            <Text type="secondary">
                                                <StarOutlined /> {customer.loyaltyPoints} điểm
                                            </Text>
                                        </Space>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                </Space>
            </Drawer>

            {/* Barcode Scanner Modal */}
            <Modal
                title="Quét mã vạch"
                open={scannerActive}
                onCancel={() => setScannerActive(false)}
                footer={null}
                width={600}
            >
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <div 
                        ref={scannerRef}
                        style={{
                            width: '100%',
                            height: 300,
                            border: '2px dashed #d9d9d9',
                            borderRadius: 8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 16
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <ScanOutlined style={{ fontSize: 48, color: token.colorTextTertiary }} />
                            <div style={{ marginTop: 16 }}>
                                <Text type="secondary">Đưa mã vạch vào khung hình</Text>
                            </div>
                        </div>
                    </div>
                    
                    <Alert
                        message="Hướng dẫn sử dụng"
                        description="Đưa mã vạch sản phẩm vào khung hình để quét tự động. Đảm bảo mã vạch rõ nét và đủ ánh sáng."
                        type="info"
                        showIcon
                    />
                </div>
            </Modal>
        </div>
    );
};

export default CheckoutTerminal;