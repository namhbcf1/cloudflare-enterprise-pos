import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Avatar,
  Modal,
  Form,
  InputNumber,
  Upload,
  message,
  Popconfirm,
  Tooltip,
  Row,
  Col,
  Statistic,
  Progress
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UploadOutlined,
  BarcodeOutlined,
  AlertOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { api } from '../../services/api';

const { Option } = Select;
const { TextArea } = Input;

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [form] = Form.useForm();

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    inStock: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [products]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || []);
    } catch (error) {
      message.error('Failed to fetch products');
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const total = products.length;
    const inStock = products.filter(p => p.stock > p.min_stock).length;
    const lowStock = products.filter(p => p.stock <= p.min_stock && p.stock > 0).length;
    const outOfStock = products.filter(p => p.stock === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);

    setStats({ total, inStock, lowStock, outOfStock, totalValue });
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      ...product,
      image: product.image ? [{ uid: '-1', name: 'image', status: 'done', url: product.image }] : []
    });
    setModalVisible(true);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await api.delete(`/products/${productId}`);
      message.success('Product deleted successfully');
      fetchProducts();
    } catch (error) {
      message.error('Failed to delete product');
    }
  };

  const handleModalSubmit = async (values) => {
    try {
      const productData = {
        ...values,
        image: values.image?.[0]?.response?.url || values.image?.[0]?.url || null
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productData);
        message.success('Product updated successfully');
      } else {
        await api.post('/products', productData);
        message.success('Product created successfully');
      }

      setModalVisible(false);
      fetchProducts();
    } catch (error) {
      message.error(editingProduct ? 'Failed to update product' : 'Failed to create product');
    }
  };

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { status: 'error', text: 'Out of Stock' };
    if (stock <= minStock) return { status: 'warning', text: 'Low Stock' };
    return { status: 'success', text: 'In Stock' };
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchText.toLowerCase()) ||
                         product.barcode?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'in_stock') matchesStock = product.stock > product.min_stock;
    else if (stockFilter === 'low_stock') matchesStock = product.stock <= product.min_stock && product.stock > 0;
    else if (stockFilter === 'out_of_stock') matchesStock = product.stock === 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

  const categories = [...new Set(products.map(p => p.category))];

  const columns = [
    {
      title: 'Product',
      key: 'product',
      render: (_, record) => (
        <Space>
          <Avatar 
            src={record.image} 
            icon={<BarcodeOutlined />}
            size="large"
            shape="square"
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              SKU: {record.sku} | Barcode: {record.barcode || 'N/A'}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `$${price?.toFixed(2)}`,
      sorter: (a, b) => a.price - b.price,
    },
    {
      title: 'Stock',
      key: 'stock',
      render: (_, record) => {
        const stockStatus = getStockStatus(record.stock, record.min_stock);
        return (
          <Space direction="vertical" size="small">
            <Tag color={stockStatus.status === 'success' ? 'green' : stockStatus.status === 'warning' ? 'orange' : 'red'}>
              {stockStatus.text}
            </Tag>
            <div style={{ fontSize: '12px' }}>
              Current: {record.stock} | Min: {record.min_stock}
            </div>
            <Progress 
              percent={Math.min((record.stock / (record.min_stock * 2)) * 100, 100)}
              size="small"
              status={stockStatus.status}
              showInfo={false}
            />
          </Space>
        );
      },
      sorter: (a, b) => a.stock - b.stock,
    },
    {
      title: 'Value',
      key: 'value',
      render: (_, record) => `$${(record.price * record.stock).toFixed(2)}`,
      sorter: (a, b) => (a.price * a.stock) - (b.price * b.stock),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => handleEditProduct(record)}
            />
          </Tooltip>
          <Tooltip title="Edit Product">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEditProduct(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this product?"
            onConfirm={() => handleDeleteProduct(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete Product">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Stats Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={stats.total}
              prefix={<BarcodeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="In Stock"
              value={stats.inStock}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Low Stock"
              value={stats.lowStock}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={stats.totalValue}
              prefix="$"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Card */}
      <Card
        title="Products"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddProduct}>
            Add Product
          </Button>
        }
      >
        {/* Filters */}
        <Space style={{ marginBottom: 16, width: '100%' }} wrap>
          <Input
            placeholder="Search products..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 250 }}
          />
          <Select
            placeholder="Category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 150 }}
          >
            <Option value="all">All Categories</Option>
            {categories.map(category => (
              <Option key={category} value={category}>{category}</Option>
            ))}
          </Select>
          <Select
            placeholder="Stock Status"
            value={stockFilter}
            onChange={setStockFilter}
            style={{ width: 150 }}
          >
            <Option value="all">All Stock</Option>
            <Option value="in_stock">In Stock</Option>
            <Option value="low_stock">Low Stock</Option>
            <Option value="out_of_stock">Out of Stock</Option>
          </Select>
        </Space>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredProducts}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredProducts.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`,
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={800}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Product Name"
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sku"
                label="SKU"
                rules={[{ required: true, message: 'Please enter SKU' }]}
              >
                <Input placeholder="Enter SKU" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please enter category' }]}
              >
                <Input placeholder="Enter category" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="barcode"
                label="Barcode"
              >
                <Input placeholder="Enter barcode" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Price ($)"
                rules={[{ required: true, message: 'Please enter price' }]}
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  placeholder="0.00"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="stock"
                label="Current Stock"
                rules={[{ required: true, message: 'Please enter stock' }]}
              >
                <InputNumber
                  min={0}
                  placeholder="0"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="min_stock"
                label="Minimum Stock"
                rules={[{ required: true, message: 'Please enter minimum stock' }]}
              >
                <InputNumber
                  min={0}
                  placeholder="0"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter product description" />
          </Form.Item>

          <Form.Item
            name="image"
            label="Product Image"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) return e;
              return e?.fileList;
            }}
          >
            <Upload
              action="/api/upload"
              listType="picture-card"
              maxCount={1}
              accept="image/*"
            >
              <div>
                <UploadOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
              </div>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductList;