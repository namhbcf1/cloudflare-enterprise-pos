/**
 * Transaction History Component
 * View and manage transaction history with search, filters, and details
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Drawer,
    Table,
    Space,
    Typography,
    Input,
    Button,
    Tag,
    Card,
    Row,
    Col,
    Statistic,
    Select,
    DatePicker,
    Modal,
    List,
    Avatar,
    Divider,
    Alert,
    Empty,
    Tooltip,
    Badge,
    theme
} from 'antd';
import {
    HistoryOutlined,
    SearchOutlined,
    EyeOutlined,
    PrinterOutlined,
    RefundOutlined,
    FilterOutlined,
    CalendarOutlined,
    DollarOutlined,
    UserOutlined,
    ShoppingCartOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    ClockCircleOutlined,
    DownloadOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;
const { useToken } = theme;

const TransactionHistory = ({ 
    visible, 
    onClose, 
    onRefund,
    onReprint 
}) => {
    const { user, hasPermission } = useAuth();
    const { token } = useToken();

    // State management
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [dateRange, setDateRange] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');

    // Mock transaction data
    const mockTransactions = [
        {
            id: 'TXN_1704123456789',
            orderId: 'ORD_001',
            timestamp: '2024-01-16T10:30:00Z',
            cashier: 'Nguyễn Văn A',
            cashierId: 'USER_001',
            customer: {
                name: 'Trần Thị B',
                phone: '0901234567',
                email: 'tranthib@email.com'
            },
            items: [
                { id: 'P001', name: 'Coca Cola 330ml', quantity: 2, price: 15000, total: 30000 },
                { id: 'P002', name: 'Bánh mì sandwich', quantity: 1, price: 25000, total: 25000 }
            ],
            subtotal: 55000,
            discount: 5000,
            tax: 5000,
            total: 55000,
            paymentMethod: 'cash',
            amountReceived: 60000,
            change: 5000,
            status: 'completed',
            receiptPrinted: true,
            refunded: false,
            notes: 'Khách hàng VIP'
        },
        {
            id: 'TXN_1704123456790',
            orderId: 'ORD_002',
            timestamp: '2024-01-16T11:15:00Z',
            cashier: 'Lê Văn C',
            cashierId: 'USER_002',
            customer: null,
            items: [
                { id: 'P003', name: 'Nước suối Lavie 500ml', quantity: 3, price: 8000, total: 24000 }
            ],
            subtotal: 24000,
            discount: 0,
            tax: 2400,
            total: 26400,
            paymentMethod: 'card',
            cardDetails: { type: 'visa', lastFour: '1234' },
            status: 'completed',
            receiptPrinted: false,
            refunded: false,
            notes: ''
        },
        {
            id: 'TXN_1704123456791',
            orderId: 'ORD_003',
            timestamp: '2024-01-16T09:45:00Z',
            cashier: 'Nguyễn Văn A',
            cashierId: 'USER_001',
            customer: {
                name: 'Phạm Văn D',
                phone: '0909876543'
            },
            items: [
                { id: 'P001', name: 'Coca Cola 330ml', quantity: 1, price: 15000, total: 15000 },
                { id: 'P002', name: 'Bánh mì sandwich', quantity: 2, price: 25000, total: 50000 }
            ],
            subtotal: 65000,
            discount: 6500,
            tax: 5850,
            total: 64350,
            paymentMethod: 'e_wallet',
            eWalletDetails: { provider: 'momo', phone: '0909876543' },
            status: 'refunded',
            receiptPrinted: true,
            refunded: true,
            refundAmount: 64350,
            refundReason: 'Khách hàng không hài lòng',
            refundedAt: '2024-01-16T12:00:00Z',
            notes: 'Hoàn tiền theo yêu cầu khách hàng'
        }
    ];

    // Load transactions on component mount
    useEffect(() => {
        if (visible) {
            loadTransactions();
        }
    }, [visible]);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setTransactions(mockTransactions);
        } catch (error) {
            console.error('Error loading transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return transactions.filter(transaction => {
            const matchesSearch = 
                transaction.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.cashier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                transaction.customer?.phone.includes(searchTerm);

            const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
            
            const matchesPaymentMethod = 
                paymentMethodFilter === 'all' || transaction.paymentMethod === paymentMethodFilter;

            const matchesDateRange = 
                dateRange.length === 0 || 
                (new Date(transaction.timestamp) >= dateRange[0] && 
                 new Date(transaction.timestamp) <= dateRange[1]);

            return matchesSearch && matchesStatus && matchesPaymentMethod && matchesDateRange;
        });
    }, [transactions, searchTerm, statusFilter, paymentMethodFilter, dateRange]);

    // Calculate statistics
    const statistics = useMemo(() => {
        const totalTransactions = filteredTransactions.length;
        const totalRevenue = filteredTransactions
            .filter(t => t.status === 'completed')
            .reduce((sum, t) => sum + t.total, 0);
        const totalRefunded = filteredTransactions
            .filter(t => t.status === 'refunded')
            .reduce((sum, t) => sum + (t.refundAmount || 0), 0);
        const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        return {
            totalTransactions,
            totalRevenue,
            totalRefunded,
            averageTransaction
        };
    }, [filteredTransactions]);

    // Get status color and text
    const getStatusInfo = (status) => {
        switch (status) {
            case 'completed':
                return { color: 'success', text: 'Hoàn thành', icon: <CheckCircleOutlined /> };
            case 'pending':
                return { color: 'processing', text: 'Đang xử lý', icon: <ClockCircleOutlined /> };
            case 'refunded':
                return { color: 'error', text: 'Đã hoàn tiền', icon: <ExclamationCircleOutlined /> };
            default:
                return { color: 'default', text: 'Không xác định', icon: <ExclamationCircleOutlined /> };
        }
    };

    // Get payment method display
    const getPaymentMethodDisplay = (method, details = {}) => {
        switch (method) {
            case 'cash':
                return { text: 'Tiền mặt', color: 'green', icon: <DollarOutlined /> };
            case 'card':
                return { 
                    text: `Thẻ ${details.type?.toUpperCase() || ''} ***${details.lastFour || ''}`, 
                    color: 'blue', 
                    icon: <DollarOutlined /> 
                };
            case 'bank_transfer':
                return { text: 'Chuyển khoản', color: 'purple', icon: <DollarOutlined /> };
            case 'e_wallet':
                return { 
                    text: `${details.provider?.toUpperCase() || 'Ví điện tử'}`, 
                    color: 'orange', 
                    icon: <DollarOutlined /> 
                };
            default:
                return { text: 'Khác', color: 'default', icon: <DollarOutlined /> };
        }
    };

    // Handle transaction actions
    const handleViewDetails = (transaction) => {
        setSelectedTransaction(transaction);
        setDetailsVisible(true);
    };

    const handleRefund = (transaction) => {
        Modal.confirm({
            title: 'Xác nhận hoàn tiền',
            content: `Bạn có chắc muốn hoàn tiền cho giao dịch ${transaction.id}?`,
            okText: 'Hoàn tiền',
            cancelText: 'Hủy',
            onOk: () => {
                onRefund?.(transaction);
                // Update transaction status locally
                setTransactions(prev => 
                    prev.map(t => 
                        t.id === transaction.id 
                            ? { ...t, status: 'refunded', refunded: true }
                            : t
                    )
                );
            }
        });
    };

    const handleReprint = (transaction) => {
        onReprint?.(transaction);
    };

    // Table columns
    const columns = [
        {
            title: 'Mã giao dịch',
            dataIndex: 'id',
            key: 'id',
            width: 150,
            render: (id, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ fontSize: 12 }}>{id}</Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>
                        {record.orderId}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Thời gian',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 120,
            render: (timestamp) => (
                <Space direction="vertical" size={0}>
                    <Text style={{ fontSize: 12 }}>
                        {new Date(timestamp).toLocaleDateString('vi-VN')}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 10 }}>
                        {new Date(timestamp).toLocaleTimeString('vi-VN')}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Thu ngân',
            dataIndex: 'cashier',
            key: 'cashier',
            width: 100,
            render: (cashier) => (
                <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <Text style={{ fontSize: 12 }}>{cashier}</Text>
                </Space>
            )
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            width: 120,
            render: (_, record) => (
                record.customer ? (
                    <Space direction="vertical" size={0}>
                        <Text style={{ fontSize: 12 }}>{record.customer.name}</Text>
                        <Text type="secondary" style={{ fontSize: 10 }}>
                            {record.customer.phone}
                        </Text>
                    </Space>
                ) : (
                    <Text type="secondary" style={{ fontSize: 12 }}>Khách vãng lai</Text>
                )
            )
        },
        {
            title: 'Số tiền',
            dataIndex: 'total',
            key: 'total',
            width: 100,
            render: (total, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ color: token.colorPrimary, fontSize: 12 }}>
                        {total.toLocaleString('vi-VN')} đ
                    </Text>
                    {record.refunded && (
                        <Text type="danger" style={{ fontSize: 10 }}>
                            Đã hoàn: {record.refundAmount?.toLocaleString('vi-VN')} đ
                        </Text>
                    )}
                </Space>
            )
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            width: 100,
            render: (_, record) => {
                const paymentInfo = getPaymentMethodDisplay(
                    record.paymentMethod, 
                    record.cardDetails || record.eWalletDetails || {}
                );
                return (
                    <Tag color={paymentInfo.color} style={{ fontSize: 10 }}>
                        {paymentInfo.icon} {paymentInfo.text}
                    </Tag>
                );
            }
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status) => {
                const statusInfo = getStatusInfo(status);
                return (
                    <Tag color={statusInfo.color} style={{ fontSize: 10 }}>
                        {statusInfo.icon} {statusInfo.text}
                    </Tag>
                );
            }
        },
        {
            title: 'Thao tác',
            key: 'actions',
            width: 120,
            render: (_, record) => (
                <Space>
                    <Tooltip title="Xem chi tiết">
                        <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => handleViewDetails(record)}
                        />
                    </Tooltip>
                    <Tooltip title="In lại hóa đơn">
                        <Button
                            type="text"
                            size="small"
                            icon={<PrinterOutlined />}
                            onClick={() => handleReprint(record)}
                        />
                    </Tooltip>
                    {record.status === 'completed' && hasPermission('refund_transactions') && (
                        <Tooltip title="Hoàn tiền">
                            <Button
                                type="text"
                                size="small"
                                icon={<RefundOutlined />}
                                onClick={() => handleRefund(record)}
                                danger
                            />
                        </Tooltip>
                    )}
                </Space>
            )
        }
    ];

    return (
        <>
            <Drawer
                title={
                    <Space>
                        <HistoryOutlined />
                        <span>Lịch sử giao dịch</span>
                        <Badge count={filteredTransactions.length} />
                    </Space>
                }
                placement="right"
                width="90%"
                open={visible}
                onClose={onClose}
                extra={
                    <Space>
                        <Button 
                            icon={<DownloadOutlined />}
                            onClick={() => {/* Export functionality */}}
                        >
                            Xuất Excel
                        </Button>
                        <Button 
                            icon={<ReloadOutlined />}
                            onClick={loadTransactions}
                            loading={loading}
                        >
                            Làm mới
                        </Button>
                    </Space>
                }
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    {/* Statistics Cards */}
                    <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Tổng giao dịch"
                                    value={statistics.totalTransactions}
                                    prefix={<HistoryOutlined />}
                                    valueStyle={{ color: token.colorPrimary }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Doanh thu"
                                    value={statistics.totalRevenue}
                                    suffix="đ"
                                    prefix={<DollarOutlined />}
                                    valueStyle={{ color: token.colorSuccess }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Đã hoàn tiền"
                                    value={statistics.totalRefunded}
                                    suffix="đ"
                                    prefix={<RefundOutlined />}
                                    valueStyle={{ color: token.colorError }}
                                />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} lg={6}>
                            <Card>
                                <Statistic
                                    title="Trung bình/giao dịch"
                                    value={statistics.averageTransaction}
                                    suffix="đ"
                                    prefix={<BarChartOutlined />}
                                    valueStyle={{ color: token.colorWarning }}
                                />
                            </Card>
                        </Col>
                    </Row>

                    {/* Filters */}
                    <Card title="Bộ lọc" size="small">
                        <Row gutter={[16, 16]}>
                            <Col xs={24} sm={12} lg={6}>
                                <Search
                                    placeholder="Tìm theo mã, thu ngân, khách hàng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    allowClear
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={4}>
                                <Select
                                    placeholder="Trạng thái"
                                    value={statusFilter}
                                    onChange={setStatusFilter}
                                    style={{ width: '100%' }}
                                >
                                    <Select.Option value="all">Tất cả</Select.Option>
                                    <Select.Option value="completed">Hoàn thành</Select.Option>
                                    <Select.Option value="pending">Đang xử lý</Select.Option>
                                    <Select.Option value="refunded">Đã hoàn tiền</Select.Option>
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} lg={4}>
                                <Select
                                    placeholder="Thanh toán"
                                    value={paymentMethodFilter}
                                    onChange={setPaymentMethodFilter}
                                    style={{ width: '100%' }}
                                >
                                    <Select.Option value="all">Tất cả</Select.Option>
                                    <Select.Option value="cash">Tiền mặt</Select.Option>
                                    <Select.Option value="card">Thẻ</Select.Option>
                                    <Select.Option value="bank_transfer">Chuyển khoản</Select.Option>
                                    <Select.Option value="e_wallet">Ví điện tử</Select.Option>
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} lg={6}>
                                <RangePicker
                                    style={{ width: '100%' }}
                                    value={dateRange}
                                    onChange={setDateRange}
                                    placeholder={['Từ ngày', 'Đến ngày']}
                                />
                            </Col>
                            <Col xs={24} sm={12} lg={4}>
                                <Button
                                    icon={<FilterOutlined />}
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('all');
                                        setPaymentMethodFilter('all');
                                        setDateRange([]);
                                    }}
                                >
                                    Xóa bộ lọc
                                </Button>
                            </Col>
                        </Row>
                    </Card>

                    {/* Transactions Table */}
                    <Card>
                        <Table
                            dataSource={filteredTransactions}
                            columns={columns}
                            rowKey="id"
                            loading={loading}
                            size="small"
                            pagination={{
                                total: filteredTransactions.length,
                                pageSize: 20,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => 
                                    `${range[0]}-${range[1]} của ${total} giao dịch`
                            }}
                            scroll={{ x: 1000 }}
                        />
                    </Card>
                </Space>
            </Drawer>

            {/* Transaction Details Modal */}
            <TransactionDetailsModal
                visible={detailsVisible}
                transaction={selectedTransaction}
                onClose={() => {
                    setDetailsVisible(false);
                    setSelectedTransaction(null);
                }}
                onRefund={handleRefund}
                onReprint={handleReprint}
            />
        </>
    );
};

// Transaction Details Modal Component
const TransactionDetailsModal = ({ 
    visible, 
    transaction, 
    onClose, 
    onRefund, 
    onReprint 
}) => {
    const { hasPermission } = useAuth();
    const { token } = useToken();

    if (!transaction) return null;

    const statusInfo = {
        completed: { color: 'success', text: 'Hoàn thành' },
        pending: { color: 'processing', text: 'Đang xử lý' },
        refunded: { color: 'error', text: 'Đã hoàn tiền' }
    }[transaction.status] || { color: 'default', text: 'Không xác định' };

    return (
        <Modal
            title={`Chi tiết giao dịch - ${transaction.id}`}
            open={visible}
            onCancel={onClose}
            width={800}
            footer={[
                <Button key="close" onClick={onClose}>
                    Đóng
                </Button>,
                <Button
                    key="reprint"
                    icon={<PrinterOutlined />}
                    onClick={() => onReprint(transaction)}
                >
                    In lại hóa đơn
                </Button>,
                transaction.status === 'completed' && hasPermission('refund_transactions') && (
                    <Button
                        key="refund"
                        danger
                        icon={<RefundOutlined />}
                        onClick={() => onRefund(transaction)}
                    >
                        Hoàn tiền
                    </Button>
                )
            ].filter(Boolean)}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* Transaction Info */}
                <Card title="Thông tin giao dịch" size="small">
                    <Row gutter={[16, 8]}>
                        <Col span={12}>
                            <Text type="secondary">Mã giao dịch:</Text>
                            <br />
                            <Text strong>{transaction.id}</Text>
                        </Col>
                        <Col span={12}>
                            <Text type="secondary">Mã đơn hàng:</Text>
                            <br />
                            <Text strong>{transaction.orderId}</Text>
                        </Col>
                        <Col span={12}>
                            <Text type="secondary">Thời gian:</Text>
                            <br />
                            <Text>{new Date(transaction.timestamp).toLocaleString('vi-VN')}</Text>
                        </Col>
                        <Col span={12}>
                            <Text type="secondary">Thu ngân:</Text>
                            <br />
                            <Text>{transaction.cashier}</Text>
                        </Col>
                        <Col span={12}>
                            <Text type="secondary">Khách hàng:</Text>
                            <br />
                            <Text>
                                {transaction.customer 
                                    ? `${transaction.customer.name} (${transaction.customer.phone})`
                                    : 'Khách vãng lai'
                                }
                            </Text>
                        </Col>
                        <Col span={12}>
                            <Text type="secondary">Trạng thái:</Text>
                            <br />
                            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                        </Col>
                    </Row>
                </Card>

                {/* Items */}
                <Card title="Sản phẩm" size="small">
                    <List
                        dataSource={transaction.items}
                        renderItem={(item) => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<Avatar icon={<ShoppingCartOutlined />} />}
                                    title={item.name}
                                    description={`Mã: ${item.id}`}
                                />
                                <Space direction="vertical" style={{ textAlign: 'right' }}>
                                    <Text>SL: {item.quantity}</Text>
                                    <Text>Đơn giá: {item.price.toLocaleString('vi-VN')} đ</Text>
                                    <Text strong>
                                        Thành tiền: {item.total.toLocaleString('vi-VN')} đ
                                    </Text>
                                </Space>
                            </List.Item>
                        )}
                    />
                </Card>

                {/* Payment Summary */}
                <Card title="Tổng kết thanh toán" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Row justify="space-between">
                            <Text>Tạm tính:</Text>
                            <Text>{transaction.subtotal.toLocaleString('vi-VN')} đ</Text>
                        </Row>
                        {transaction.discount > 0 && (
                            <Row justify="space-between">
                                <Text>Giảm giá:</Text>
                                <Text style={{ color: token.colorSuccess }}>
                                    -{transaction.discount.toLocaleString('vi-VN')} đ
                                </Text>
                            </Row>
                        )}
                        <Row justify="space-between">
                            <Text>Thuế:</Text>
                            <Text>{transaction.tax.toLocaleString('vi-VN')} đ</Text>
                        </Row>
                        <Divider style={{ margin: '8px 0' }} />
                        <Row justify="space-between">
                            <Text strong>Tổng cộng:</Text>
                            <Text strong style={{ color: token.colorPrimary, fontSize: 16 }}>
                                {transaction.total.toLocaleString('vi-VN')} đ
                            </Text>
                        </Row>
                        
                        {transaction.paymentMethod === 'cash' && (
                            <>
                                <Row justify="space-between">
                                    <Text>Tiền nhận:</Text>
                                    <Text>{transaction.amountReceived?.toLocaleString('vi-VN')} đ</Text>
                                </Row>
                                <Row justify="space-between">
                                    <Text>Tiền thối:</Text>
                                    <Text>{transaction.change?.toLocaleString('vi-VN')} đ</Text>
                                </Row>
                            </>
                        )}
                    </Space>
                </Card>

                {/* Refund Info */}
                {transaction.refunded && (
                    <Alert
                        message="Thông tin hoàn tiền"
                        description={
                            <Space direction="vertical">
                                <Text>Số tiền hoàn: {transaction.refundAmount?.toLocaleString('vi-VN')} đ</Text>
                                <Text>Thời gian hoàn: {new Date(transaction.refundedAt).toLocaleString('vi-VN')}</Text>
                                <Text>Lý do: {transaction.refundReason}</Text>
                            </Space>
                        }
                        type="warning"
                        showIcon
                    />
                )}

                {/* Notes */}
                {transaction.notes && (
                    <Card title="Ghi chú" size="small">
                        <Text>{transaction.notes}</Text>
                    </Card>
                )}
            </Space>
        </Modal>
    );
};

export default TransactionHistory;