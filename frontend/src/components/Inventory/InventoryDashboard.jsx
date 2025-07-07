/**
 * Inventory Dashboard Component
 * Comprehensive inventory management with stock tracking, alerts, and analytics
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Row,
    Col,
    Card,
    Table,
    Button,
    Input,
    Space,
    Typography,
    Select,
    Tag,
    Progress,
    Statistic,
    Alert,
    Modal,
    Form,
    InputNumber,
    Upload,
    Tabs,
    List,
    Avatar,
    Badge,
    DatePicker,
    theme,
    Drawer,
    Switch,
    Tooltip
} from 'antd';
import {
    ShoppingOutlined,
    ExclamationTriangleOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined,
    SearchOutlined,
    FilterOutlined,
    UploadOutlined,
    BarChartOutlined,
    TrendingUpOutlined,
    TrendingDownOutlined,
    AlertOutlined,
    ScanOutlined,
    DownloadOutlined,
    ReloadOutlined,
    EyeOutlined,
    StockOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;
const { useToken } = theme;

const InventoryDashboard = () => {
    const { user, hasPermission } = useAuth();
    const { token } = useToken();

    // State management
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [stockFilter, setStockFilter] = useState('all');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [alertsDrawer, setAlertsDrawer] = useState(false);
    const [form] = Form.useForm();

    // Mock data
    const mockProducts = [
        {
            id: 'P001',
            sku: 'SKU001',
            name: 'Coca Cola 330ml',
            category: 'Đồ uống',
            barcode: '8934673123456',
            currentStock: 5,
            minStock: 10,
            maxStock: 200,
            unitPrice: 12000,
            salePrice: 15000,
            supplier: 'Coca Cola VN',
            location: 'Kệ A1',
            lastUpdated: '2024-01-15',
            status: 'active',
            image: '/products/coca-cola.jpg'
        },
        {
            id: 'P002',
            sku: 'SKU002',
            name: 'Bánh mì sandwich',
            category: 'Thực phẩm',
            barcode: '8934673123457',
            currentStock: 25,
            minStock: 15,
            maxStock: 100,
            unitPrice: 18000,
            salePrice: 25000,
            supplier: 'ABC Bakery',
            location: 'Tủ lạnh B1',
            lastUpdated: '2024-01-14',
            status: 'active',
            image: '/products/sandwich.jpg'
        },
        {
            id: 'P003',
            sku: 'SKU003',
            name: 'Nước suối Lavie 500ml',
            category: 'Đồ uống',
            barcode: '8934673123458',
            currentStock: 150,
            minStock: 50,
            maxStock: 300,
            unitPrice: 6000,
            salePrice: 8000,
            supplier: 'Lavie Vietnam',
            location: 'Kệ A2',
            lastUpdated: '2024-01-16',
            status: 'active',
            image: '/products/lavie.jpg'
        }
    ];

    const categories = ['Tất cả', 'Đồ uống', 'Thực phẩm', 'Đồ gia dụng', 'Văn phòng phẩm'];

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        setLoading(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            setProducts(mockProducts);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filter products
    const filteredProducts = useMemo(() => {
        return products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                product.barcode.includes(searchTerm);
            
            const matchesCategory = selectedCategory === 'all' || 
                                  selectedCategory === 'Tất cả' || 
                                  product.category === selectedCategory;
            
            const matchesStock = stockFilter === 'all' ||
                               (stockFilter === 'low' && product.currentStock <= product.minStock) ||
                               (stockFilter === 'out' && product.currentStock === 0) ||
                               (stockFilter === 'normal' && product.currentStock > product.minStock);
            
            return matchesSearch && matchesCategory && matchesStock;
        });
    }, [products, searchTerm, selectedCategory, stockFilter]);

    // Calculate statistics
    const statistics = useMemo(() => {
        const totalProducts = products.length;
        const lowStockProducts = products.filter(p => p.currentStock <= p.minStock).length;
        const outOfStockProducts = products.filter(p => p.currentStock === 0).length;
        const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.unitPrice), 0);
        
        return {
            totalProducts,
            lowStockProducts,
            outOfStockProducts,
            totalValue
        };
    }, [products]);

    // Get stock status
    const getStockStatus = (product) => {
        if (product.currentStock === 0) {
            return { status: 'error', text: 'Hết hàng', color: '#ff4d4f' };
        } else if (product.currentStock <= product.minStock) {
            return { status: 'warning', text: 'Sắp hết', color: '#faad14' };
        } else {
            return { status: 'success', text: 'Còn hàng', color: '#52c41a' };
        }
    };

    // Get stock percentage
    const getStockPercentage = (product) => {
        return Math.min((product.currentStock / product.maxStock) * 100, 100);
    };

    // Handle product form submission
    const handleProductSubmit = async (values) => {
        try {
            const productData = {
                ...values,
                id: editingProduct?.id || `P${Date.now()}`,
                lastUpdated: new Date().toISOString().split('T')[0]
            };

            if (editingProduct) {
                setProducts(prev => prev.map(p => p.id === editingProduct.id ? productData : p));
            } else {
                setProducts(prev => [...prev, productData]);
            }

            setModalVisible(false);
            setEditingProduct(null);
            form.resetFields();
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    // Handle bulk actions
    const handleBulkDelete = () => {
        Modal.confirm({
            title: 'Xóa sản phẩm đã chọn?',
            content: `Bạn có chắc muốn xóa ${selectedProducts.length} sản phẩm?`,
            onOk: () => {
                setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
                setSelectedProducts([]);
            }
        });
    };

    // Table columns
    const columns = [
        {
            title: 'Sản phẩm',
            key: 'product',
            width: 300,
            render: (_, record) => (
                <Space>
                    <Avatar 
                        src={record.image} 
                        icon={<ShoppingOutlined />}
                        size="large"
                    />
                    <div>
                        <div style={{ fontWeight: 500 }}>{record.name}</div>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            SKU: {record.sku} • {record.category}
                        </Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            Vị trí: {record.location}
                        </Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Tồn kho',
            key: 'stock',
            width: 150,
            sorter: (a, b) => a.currentStock - b.currentStock,
            render: (_, record) => {
                const stockStatus = getStockStatus(record);
                return (
                    <Space direction="vertical" size={4}>
                        <Badge 
                            status={stockStatus.status} 
                            text={
                                <Text strong style={{ color: stockStatus.color }}>
                                    {record.currentStock}
                                </Text>
                            }
                        />
                        <Progress
                            percent={getStockPercentage(record)}
                            size="small"
                            strokeColor={stockStatus.color}
                            showInfo={false}
                        />
                        <Text type="secondary" style={{ fontSize: 11 }}>
                            Min: {record.minStock} • Max: {record.maxStock}
                        </Text>
                    </Space>
                );
            }
        },
        {
            title: 'Giá',
            key: 'price',
            width: 120,
            sorter: (a, b) => a.salePrice - b.salePrice,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong style={{ color: token.colorPrimary }}>
                        {record.salePrice.toLocaleString('vi-VN')}đ
                    </Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                        Vốn: {record.unitPrice.toLocaleString('vi-VN')}đ
                    </Text>
                    <Text type="success" style={{ fontSize: 11 }}>
                        LN: {((record.salePrice - record.unitPrice) / record.unitPrice * 100).toFixed(1)}%
                    </Text>
                </Space>
            )
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 100,
            filters: [
                { text: 'Còn hàng', value: 'normal' },
                { text: 'Sắp hết', value: 'low' },
                { text: 'Hết hàng', value: 'out' }
            ],
            onFilter: (value, record) => {
                if (value === 'low') return record.currentStock <= record.minStock && record.currentStock > 0;
                if (value === 'out') return record.currentStock === 0;
                if (value === 'normal') return record.currentStock > record.minStock;
                return true;
            },
            render: (_, record) => {
                const stockStatus = getStockStatus(record);
                return (
                    <Tag color={stockStatus.status === 'error' ? 'red' : stockStatus.status === 'warning' ? 'orange' : 'green'}>
                        {stockStatus.text}
                    </Tag>
                );
            }
        },
        {
            title: 'Cập nhật',
            dataIndex: 'lastUpdated',
            key: 'lastUpdated',
            width: 100,
            render: (date) => (
                <Text type="secondary">
                    {new Date(date).toLocaleDateString('vi-VN')}
                </Text>
            )
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
                            icon={<EyeOutlined />} 
                            size="small"
                            onClick={() => {/* Handle view details */}}
                        />
                    </Tooltip>
                    {hasPermission('manage_inventory') && (
                        <Tooltip title="Chỉnh sửa">
                            <Button 
                                type="text" 
                                icon={<EditOutlined />} 
                                size="small"
                                onClick={() => {
                                    setEditingProduct(record);
                                    form.setFieldsValue(record);
                                    setModalVisible(true);
                                }}
                            />
                        </Tooltip>
                    )}
                    {hasPermission('manage_inventory') && (
                        <Tooltip title="Xóa">
                            <Button 
                                type="text" 
                                danger 
                                icon={<DeleteOutlined />} 
                                size="small"
                                onClick={() => {
                                    Modal.confirm({
                                        title: 'Xóa sản phẩm?',
                                        content: `Bạn có chắc muốn xóa "${record.name}"?`,
                                        onOk: () => {
                                            setProducts(prev => prev.filter(p => p.id !== record.id));
                                        }
                                    });
                                }}
                            />
                        </Tooltip>
                    )}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Row gutter={[24, 24]}>
                {/* Header */}
                <Col span={24}>
                    <Card>
                        <Row justify="space-between" align="middle">
                            <Col>
                                <Title level={3} style={{ margin: 0 }}>
                                    <StockOutlined /> Quản lý kho hàng
                                </Title>
                                <Text type="secondary">
                                    Theo dõi và quản lý tồn kho sản phẩm
                                </Text>
                            </Col>
                            <Col>
                                <Space>
                                    <Button 
                                        icon={<AlertOutlined />}
                                        onClick={() => setAlertsDrawer(true)}
                                    >
                                        Cảnh báo ({statistics.lowStockProducts + statistics.outOfStockProducts})
                                    </Button>
                                    <Button icon={<DownloadOutlined />}>
                                        Xuất Excel
                                    </Button>
                                    {hasPermission('manage_inventory') && (
                                        <Button 
                                            type="primary" 
                                            icon={<PlusOutlined />}
                                            onClick={() => {
                                                setEditingProduct(null);
                                                form.resetFields();
                                                setModalVisible(true);
                                            }}
                                        >
                                            Thêm sản phẩm
                                        </Button>
                                    )}
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Statistics Cards */}
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng sản phẩm"
                            value={statistics.totalProducts}
                            prefix={<ShoppingOutlined />}
                            valueStyle={{ color: token.colorPrimary }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Sắp hết hàng"
                            value={statistics.lowStockProducts}
                            prefix={<ExclamationTriangleOutlined />}
                            valueStyle={{ color: token.colorWarning }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Hết hàng"
                            value={statistics.outOfStockProducts}
                            prefix={<AlertOutlined />}
                            valueStyle={{ color: token.colorError }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Giá trị tồn kho"
                            value={statistics.totalValue}
                            prefix={<BarChartOutlined />}
                            suffix="đ"
                            precision={0}
                            valueStyle={{ color: token.colorSuccess }}
                        />
                    </Card>
                </Col>

                {/* Filters and Search */}
                <Col span={24}>
                    <Card>
                        <Row gutter={[16, 16]} align="middle">
                            <Col xs={24} sm={12} lg={8}>
                                <Search
                                    placeholder="Tìm theo tên, SKU, hoặc mã vạch..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    allowClear
                                />
                            </Col>
                            <Col xs={24} sm={6} lg={4}>
                                <Select
                                    value={selectedCategory}
                                    onChange={setSelectedCategory}
                                    style={{ width: '100%' }}
                                    placeholder="Danh mục"
                                >
                                    {categories.map(cat => (
                                        <Select.Option key={cat} value={cat === 'Tất cả' ? 'all' : cat}>
                                            {cat}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Col>
                            <Col xs={24} sm={6} lg={4}>
                                <Select
                                    value={stockFilter}
                                    onChange={setStockFilter}
                                    style={{ width: '100%' }}
                                    placeholder="Tình trạng kho"
                                >
                                    <Select.Option value="all">Tất cả</Select.Option>
                                    <Select.Option value="normal">Còn hàng</Select.Option>
                                    <Select.Option value="low">Sắp hết</Select.Option>
                                    <Select.Option value="out">Hết hàng</Select.Option>
                                </Select>
                            </Col>
                            <Col xs={24} sm={12} lg={8}>
                                <Space>
                                    <Button 
                                        icon={<ReloadOutlined />}
                                        onClick={loadProducts}
                                        loading={loading}
                                    >
                                        Làm mới
                                    </Button>
                                    <Button icon={<ScanOutlined />}>
                                        Quét mã vạch
                                    </Button>
                                    {selectedProducts.length > 0 && hasPermission('manage_inventory') && (
                                        <Button 
                                            danger 
                                            icon={<DeleteOutlined />}
                                            onClick={handleBulkDelete}
                                        >
                                            Xóa ({selectedProducts.length})
                                        </Button>
                                    )}
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Product Table */}
                <Col span={24}>
                    <Card>
                        <Table
                            dataSource={filteredProducts}
                            columns={columns}
                            rowKey="id"
                            loading={loading}
                            pagination={{
                                total: filteredProducts.length,
                                pageSize: 10,
                                showSizeChanger: true,
                                showQuickJumper: true,
                                showTotal: (total, range) => 
                                    `${range[0]}-${range[1]} của ${total} sản phẩm`
                            }}
                            rowSelection={hasPermission('manage_inventory') ? {
                                selectedRowKeys: selectedProducts,
                                onChange: setSelectedProducts
                            } : undefined}
                            scroll={{ x: 1200 }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Product Form Modal */}
            <Modal
                title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                open={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingProduct(null);
                    form.resetFields();
                }}
                footer={null}
                width={800}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleProductSubmit}
                >
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="name"
                                label="Tên sản phẩm"
                                rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="sku"
                                label="Mã SKU"
                                rules={[{ required: true, message: 'Vui lòng nhập mã SKU' }]}
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="category"
                                label="Danh mục"
                                rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                            >
                                <Select>
                                    {categories.slice(1).map(cat => (
                                        <Select.Option key={cat} value={cat}>{cat}</Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="barcode"
                                label="Mã vạch"
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="currentStock"
                                label="Tồn kho hiện tại"
                                rules={[{ required: true, message: 'Vui lòng nhập số lượng' }]}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="minStock"
                                label="Tồn kho tối thiểu"
                                rules={[{ required: true, message: 'Vui lòng nhập tồn kho tối thiểu' }]}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item
                                name="maxStock"
                                label="Tồn kho tối đa"
                                rules={[{ required: true, message: 'Vui lòng nhập tồn kho tối đa' }]}
                            >
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="unitPrice"
                                label="Giá vốn"
                                rules={[{ required: true, message: 'Vui lòng nhập giá vốn' }]}
                            >
                                <InputNumber 
                                    min={0} 
                                    style={{ width: '100%' }}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="salePrice"
                                label="Giá bán"
                                rules={[{ required: true, message: 'Vui lòng nhập giá bán' }]}
                            >
                                <InputNumber 
                                    min={0} 
                                    style={{ width: '100%' }}
                                    formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="supplier"
                                label="Nhà cung cấp"
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="location"
                                label="Vị trí trong kho"
                            >
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={24}>
                            <Form.Item
                                name="image"
                                label="Hình ảnh sản phẩm"
                            >
                                <Upload
                                    listType="picture-card"
                                    showUploadList={false}
                                >
                                    <div>
                                        <UploadOutlined />
                                        <div style={{ marginTop: 8 }}>Tải lên</div>
                                    </div>
                                </Upload>
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row justify="end" gutter={8}>
                        <Col>
                            <Button onClick={() => setModalVisible(false)}>
                                Hủy
                            </Button>
                        </Col>
                        <Col>
                            <Button type="primary" htmlType="submit">
                                {editingProduct ? 'Cập nhật' : 'Thêm mới'}
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Modal>

            {/* Stock Alerts Drawer */}
            <StockAlertsDrawer
                open={alertsDrawer}
                onClose={() => setAlertsDrawer(false)}
                products={products}
            />
        </div>
    );
};

// Stock Alerts Drawer Component
const StockAlertsDrawer = ({ open, onClose, products }) => {
    const lowStockProducts = products.filter(p => p.currentStock <= p.minStock && p.currentStock > 0);
    const outOfStockProducts = products.filter(p => p.currentStock === 0);

    return (
        <Drawer
            title="Cảnh báo tồn kho"
            placement="right"
            width={400}
            open={open}
            onClose={onClose}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {outOfStockProducts.length > 0 && (
                    <Card title={<Text type="danger">Hết hàng ({outOfStockProducts.length})</Text>} size="small">
                        <List
                            dataSource={outOfStockProducts}
                            renderItem={(product) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar src={product.image} icon={<AlertOutlined />} />}
                                        title={product.name}
                                        description={`SKU: ${product.sku} • ${product.category}`}
                                    />
                                    <Tag color="red">Hết hàng</Tag>
                                </List.Item>
                            )}
                        />
                    </Card>
                )}

                {lowStockProducts.length > 0 && (
                    <Card title={<Text type="warning">Sắp hết hàng ({lowStockProducts.length})</Text>} size="small">
                        <List
                            dataSource={lowStockProducts}
                            renderItem={(product) => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<Avatar src={product.image} icon={<ExclamationTriangleOutlined />} />}
                                        title={product.name}
                                        description={
                                            <Space direction="vertical" size={0}>
                                                <Text type="secondary">SKU: {product.sku}</Text>
                                                <Text type="warning">
                                                    Còn: {product.currentStock} (Tối thiểu: {product.minStock})
                                                </Text>
                                            </Space>
                                        }
                                    />
                                    <Tag color="orange">Sắp hết</Tag>
                                </List.Item>
                            )}
                        />
                    </Card>
                )}

                {lowStockProducts.length === 0 && outOfStockProducts.length === 0 && (
                    <Card>
                        <div style={{ textAlign: 'center', padding: 20 }}>
                            <ShoppingOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                            <Title level={4} style={{ color: '#52c41a' }}>
                                Tình trạng kho ổn định
                            </Title>
                            <Text type="secondary">
                                Không có sản phẩm nào cần cảnh báo
                            </Text>
                        </div>
                    </Card>
                )}
            </Space>
        </Drawer>
    );
};

export default InventoryDashboard;