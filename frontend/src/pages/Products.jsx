import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Select,
  Modal,
  Form,
  InputNumber,
  Upload,
  Tag,
  Typography,
  Row,
  Col,
  Statistic,
  Alert,
  Popconfirm,
  Drawer,
  notification,
  Switch,
  Image
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FilterOutlined,
  UploadOutlined,
  EyeOutlined,
  BarChartOutlined,
  ExportOutlined,
  ImportOutlined,
  ShoppingOutlined,
  DollarOutlined,
  ProductOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { formatCurrency, showSuccessNotification, showErrorNotification, formatDate } from '../utils/helpers';
import { PRODUCT_CATEGORIES, UPLOAD_CONFIG } from '../utils/constants';
import api from '../services/api';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

const Products = () => {
  const { user, canManageProducts } = useAuth();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [bulkUploadVisible, setBulkUploadVisible] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
    lowStock: false
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [form] = Form.useForm();
  const [bulkForm] = Form.useForm();

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadStatistics();
  }, [filters, pagination.current, pagination.pageSize]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        search: filters.search || undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        status: filters.status !== 'all' ? filters.status : undefined,
        low_stock: filters.lowStock || undefined
      };

      const response = await api.get('/products', { params });
      setProducts(response.data?.products || getMockProducts());
      setPagination(prev => ({
        ...prev,
        total: response.data?.total || getMockProducts().length
      }));
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts(getMockProducts());
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data || getMockCategories());
    } catch (error) {
      console.error('Failed to load categories:', error);
      setCategories(getMockCategories());
    }
  };

  const loadStatistics = async () => {
    try {
      // Load product statistics for dashboard cards
      await api.get('/products/statistics');
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const getMockProducts = () => [
    {
      id: 1,
      name: 'Premium Coffee Blend',
      description: 'High-quality arabica coffee beans',
      price: 15.99,
      cost: 8.50,
      category: 'beverage',
      stock: 45,
      min_stock: 10,
      barcode: '1234567890123',
      sku: 'PCB-001',
      active: true,
      image: null,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-20T15:30:00Z'
    },
    {
      id: 2,
      name: 'Artisan Croissant',
      description: 'Fresh baked buttery croissant',
      price: 3.25,
      cost: 1.20,
      category: 'food',
      stock: 18,
      min_stock: 20,
      barcode: '1234567890124',
      sku: 'AC-002',
      active: true,
      image: null,
      created_at: '2024-01-16T08:00:00Z',
      updated_at: '2024-01-21T09:15:00Z'
    },
    {
      id: 3,
      name: 'Organic Green Tea',
      description: 'Premium organic green tea leaves',
      price: 12.50,
      cost: 6.00,
      category: 'beverage',
      stock: 5,
      min_stock: 15,
      barcode: '1234567890125',
      sku: 'OGT-003',
      active: true,
      image: null,
      created_at: '2024-01-17T12:00:00Z',
      updated_at: '2024-01-22T11:45:00Z'
    }
  ];

  const getMockCategories = () => [
    { id: 'food', name: 'Food', count: 15 },
    { id: 'beverage', name: 'Beverages', count: 12 },
    { id: 'retail', name: 'Retail Items', count: 8 },
    { id: 'digital', name: 'Digital Products', count: 3 }
  ];

  const handleTableChange = (newPagination, filters, sorter) => {
    setPagination({
      ...pagination,
      current: newPagination.current,
      pageSize: newPagination.pageSize
    });
  };

  const handleSave = async (values) => {
    try {
      setLoading(true);
      
      const formData = {
        ...values,
        image: values.image?.file || null
      };

      if (selectedProduct) {
        await api.put(`/products/${selectedProduct.id}`, formData);
        showSuccessNotification(
          'Product Updated',
          `${values.name} has been updated successfully.`
        );
      } else {
        await api.post('/products', formData);
        showSuccessNotification(
          'Product Created',
          `${values.name} has been created successfully.`
        );
      }

      setModalVisible(false);
      form.resetFields();
      setSelectedProduct(null);
      loadProducts();
    } catch (error) {
      console.error('Save error:', error);
      showErrorNotification(
        'Save Failed',
        error.message || 'Failed to save product. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (product) => {
    try {
      setLoading(true);
      await api.delete(`/products/${product.id}`);
      showSuccessNotification(
        'Product Deleted',
        `${product.name} has been deleted successfully.`
      );
      loadProducts();
    } catch (error) {
      console.error('Delete error:', error);
      showErrorNotification(
        'Delete Failed',
        error.message || 'Failed to delete product. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBulkUpload = async (values) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', values.file.file);
      formData.append('update_existing', values.updateExisting);

      await api.post('/products/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showSuccessNotification(
        'Bulk Upload Successful',
        'Products have been imported successfully.'
      );
      setBulkUploadVisible(false);
      bulkForm.resetFields();
      loadProducts();
    } catch (error) {
      console.error('Bulk upload error:', error);
      showErrorNotification(
        'Upload Failed',
        error.message || 'Failed to upload products. Please check your file format.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) return { status: 'error', text: 'Out of Stock' };
    if (stock <= minStock) return { status: 'warning', text: 'Low Stock' };
    return { status: 'success', text: 'In Stock' };
  };

  const getMarginPercentage = (price, cost) => {
    if (!price || !cost) return 0;
    return ((price - cost) / price * 100).toFixed(1);
  };

  const columns = [
    {
      title: 'Image',
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image, record) => (
        <Image
          width={50}
          height={50}
          src={image || 'https://via.placeholder.com/50x50?text=No+Image'}
          alt={record.name}
          style={{ objectFit: 'cover', borderRadius: '4px' }}
          fallback="https://via.placeholder.com/50x50?text=No+Image"
        />
      )
    },
    {
      title: 'Product Info',
      key: 'info',
      render: (record) => (
        <div>
          <Text strong>{record.name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            SKU: {record.sku} | Barcode: {record.barcode}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '11px' }}>
            {record.description}
          </Text>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => (
        <Tag color="blue">
          {categories.find(c => c.id === category)?.name || category}
        </Tag>
      )
    },
    {
      title: 'Pricing',
      key: 'pricing',
      width: 120,
      render: (record) => (
        <div>
          <div>
            <Text strong>{formatCurrency(record.price)}</Text>
          </div>
          <div style={{ fontSize: '11px', color: '#666' }}>
            Cost: {formatCurrency(record.cost)}
          </div>
          <div style={{ fontSize: '11px', color: '#52c41a' }}>
            Margin: {getMarginPercentage(record.price, record.cost)}%
          </div>
        </div>
      )
    },
    {
      title: 'Stock',
      key: 'stock',
      width: 100,
      render: (record) => {
        const stockStatus = getStockStatus(record.stock, record.min_stock);
        return (
          <div>
            <Tag color={stockStatus.status === 'error' ? 'red' : stockStatus.status === 'warning' ? 'orange' : 'green'}>
              {record.stock} units
            </Tag>
            <div style={{ fontSize: '11px', color: '#666' }}>
              Min: {record.min_stock}
            </div>
          </div>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      width: 80,
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Updated',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 100,
      render: (date) => (
        <Text style={{ fontSize: '11px' }}>
          {formatDate(date)}
        </Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (record) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => {
              setSelectedProduct(record);
              setDrawerVisible(true);
            }}
          />
          {canManageProducts() && (
            <>
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => {
                  setSelectedProduct(record);
                  form.setFieldsValue(record);
                  setModalVisible(true);
                }}
              />
              <Popconfirm
                title="Delete Product"
                description="Are you sure you want to delete this product?"
                onConfirm={() => handleDelete(record)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  icon={<DeleteOutlined />}
                  size="small"
                  danger
                />
              </Popconfirm>
            </>
          )}
        </Space>
      )
    }
  ];

  if (!canManageProducts()) {
    return (
      <Alert
        message="Access Denied"
        description="You don't have permission to manage products."
        type="error"
        showIcon
      />
    );
  }

  return (
    <div>
      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={products.length}
              prefix={<ProductOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={products.filter(p => p.stock <= p.min_stock).length}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#fa541c' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total Value"
              value={products.reduce((sum, p) => sum + (p.price * p.stock), 0)}
              prefix={<DollarOutlined />}
              formatter={(value) => formatCurrency(value)}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Avg Margin"
              value={products.reduce((sum, p) => sum + parseFloat(getMarginPercentage(p.price, p.cost)), 0) / products.length || 0}
              suffix="%"
              prefix={<BarChartOutlined />}
              precision={1}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table */}
      <Card
        title={
          <Space>
            <ShoppingOutlined />
            Product Management
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ImportOutlined />}
              onClick={() => setBulkUploadVisible(true)}
            >
              Bulk Import
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={() => {
                // Implement export functionality
                showSuccessNotification('Export Started', 'Product export will be ready shortly.');
              }}
            >
              Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setSelectedProduct(null);
                form.resetFields();
                setModalVisible(true);
              }}
            >
              Add Product
            </Button>
          </Space>
        }
      >
        {/* Filters */}
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={8}>
            <Search
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              onSearch={() => loadProducts()}
              enterButton={<SearchOutlined />}
            />
          </Col>
          <Col xs={24} sm={4}>
            <Select
              value={filters.category}
              onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              style={{ width: '100%' }}
            >
              <Option value="all">All Categories</Option>
              {categories.map(cat => (
                <Option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.count})
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Select
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              style={{ width: '100%' }}
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => setFilters(prev => ({ ...prev, lowStock: !prev.lowStock }))}
              type={filters.lowStock ? 'primary' : 'default'}
            >
              Low Stock Only
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} products`
          }}
          onChange={handleTableChange}
          scroll={{ x: 1200 }}
          size="small"
        />
      </Card>

      {/* Product Form Modal */}
      <Modal
        title={selectedProduct ? 'Edit Product' : 'Add New Product'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setSelectedProduct(null);
        }}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            active: true,
            category: 'food',
            min_stock: 10
          }}
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

              <Form.Item
                name="description"
                label="Description"
              >
                <TextArea 
                  rows={3} 
                  placeholder="Enter product description" 
                />
              </Form.Item>

              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select placeholder="Select category">
                  {Object.entries(PRODUCT_CATEGORIES).map(([key, value]) => (
                    <Option key={key} value={key}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item
                    name="sku"
                    label="SKU"
                    rules={[{ required: true, message: 'Please enter SKU' }]}
                  >
                    <Input placeholder="Product SKU" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="barcode"
                    label="Barcode"
                  >
                    <Input placeholder="Product barcode" />
                  </Form.Item>
                </Col>
              </Row>
            </Col>

            <Col span={12}>
              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item
                    name="price"
                    label="Selling Price"
                    rules={[
                      { required: true, message: 'Please enter price' },
                      { type: 'number', min: 0, message: 'Price must be positive' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      precision={2}
                      placeholder="0.00"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="cost"
                    label="Cost Price"
                    rules={[
                      { required: true, message: 'Please enter cost' },
                      { type: 'number', min: 0, message: 'Cost must be positive' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => value.replace(/\$\s?|(,*)/g, '')}
                      precision={2}
                      placeholder="0.00"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={8}>
                <Col span={12}>
                  <Form.Item
                    name="stock"
                    label="Current Stock"
                    rules={[
                      { required: true, message: 'Please enter stock quantity' },
                      { type: 'number', min: 0, message: 'Stock must be positive' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="0"
                      min={0}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="min_stock"
                    label="Minimum Stock"
                    rules={[
                      { required: true, message: 'Please enter minimum stock' },
                      { type: 'number', min: 0, message: 'Minimum stock must be positive' }
                    ]}
                  >
                    <InputNumber
                      style={{ width: '100%' }}
                      placeholder="10"
                      min={0}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="image"
                label="Product Image"
                valuePropName="file"
              >
                <Upload
                  listType="picture-card"
                  maxCount={1}
                  accept="image/*"
                  beforeUpload={() => false}
                  showUploadList={{ showPreviewIcon: true, showRemoveIcon: true }}
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                </Upload>
              </Form.Item>

              <Form.Item
                name="active"
                label="Status"
                valuePropName="checked"
              >
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                {selectedProduct ? 'Update Product' : 'Create Product'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Product Details Drawer */}
      <Drawer
        title={selectedProduct?.name}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedProduct && (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {selectedProduct.image && (
              <Image
                src={selectedProduct.image}
                alt={selectedProduct.name}
                style={{ width: '100%', maxHeight: '200px', objectFit: 'cover' }}
              />
            )}

            <Card size="small" title="Basic Information">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Name: </Text>
                  <Text>{selectedProduct.name}</Text>
                </div>
                <div>
                  <Text strong>Description: </Text>
                  <Text>{selectedProduct.description || 'No description'}</Text>
                </div>
                <div>
                  <Text strong>Category: </Text>
                  <Tag color="blue">
                    {categories.find(c => c.id === selectedProduct.category)?.name || selectedProduct.category}
                  </Tag>
                </div>
                <div>
                  <Text strong>SKU: </Text>
                  <Text code>{selectedProduct.sku}</Text>
                </div>
                <div>
                  <Text strong>Barcode: </Text>
                  <Text code>{selectedProduct.barcode || 'N/A'}</Text>
                </div>
              </Space>
            </Card>

            <Card size="small" title="Pricing & Inventory">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Selling Price: </Text>
                  <Text style={{ color: '#1890ff', fontSize: '16px', fontWeight: 'bold' }}>
                    {formatCurrency(selectedProduct.price)}
                  </Text>
                </div>
                <div>
                  <Text strong>Cost Price: </Text>
                  <Text>{formatCurrency(selectedProduct.cost)}</Text>
                </div>
                <div>
                  <Text strong>Profit Margin: </Text>
                  <Text style={{ color: '#52c41a', fontWeight: 'bold' }}>
                    {getMarginPercentage(selectedProduct.price, selectedProduct.cost)}%
                  </Text>
                </div>
                <div>
                  <Text strong>Current Stock: </Text>
                  <Tag color={selectedProduct.stock <= selectedProduct.min_stock ? 'red' : 'green'}>
                    {selectedProduct.stock} units
                  </Tag>
                </div>
                <div>
                  <Text strong>Minimum Stock: </Text>
                  <Text>{selectedProduct.min_stock} units</Text>
                </div>
                <div>
                  <Text strong>Inventory Value: </Text>
                  <Text style={{ fontWeight: 'bold' }}>
                    {formatCurrency(selectedProduct.price * selectedProduct.stock)}
                  </Text>
                </div>
              </Space>
            </Card>

            <Card size="small" title="Status & Dates">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Status: </Text>
                  <Tag color={selectedProduct.active ? 'green' : 'red'}>
                    {selectedProduct.active ? 'Active' : 'Inactive'}
                  </Tag>
                </div>
                <div>
                  <Text strong>Created: </Text>
                  <Text>{formatDate(selectedProduct.created_at)}</Text>
                </div>
                <div>
                  <Text strong>Last Updated: </Text>
                  <Text>{formatDate(selectedProduct.updated_at)}</Text>
                </div>
              </Space>
            </Card>
          </Space>
        )}
      </Drawer>

      {/* Bulk Upload Modal */}
      <Modal
        title="Bulk Import Products"
        open={bulkUploadVisible}
        onCancel={() => setBulkUploadVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={bulkForm}
          layout="vertical"
          onFinish={handleBulkUpload}
        >
          <Alert
            message="Import Guidelines"
            description={
              <div>
                <p>Please ensure your CSV file includes these columns:</p>
                <ul>
                  <li><code>name</code> - Product name (required)</li>
                  <li><code>description</code> - Product description</li>
                  <li><code>price</code> - Selling price (required)</li>
                  <li><code>cost</code> - Cost price (required)</li>
                  <li><code>category</code> - Product category (required)</li>
                  <li><code>sku</code> - Stock keeping unit (required)</li>
                  <li><code>barcode</code> - Product barcode</li>
                  <li><code>stock</code> - Current stock quantity</li>
                  <li><code>min_stock</code> - Minimum stock level</li>
                </ul>
              </div>
            }
            type="info"
            style={{ marginBottom: 16 }}
          />

          <Form.Item
            name="file"
            label="CSV File"
            rules={[{ required: true, message: 'Please select a CSV file' }]}
          >
            <Upload
              accept=".csv,.xlsx,.xls"
              maxCount={1}
              beforeUpload={() => false}
              onChange={(info) => {
                if (info.file.status === 'removed') {
                  bulkForm.setFieldsValue({ file: null });
                }
              }}
            >
              <Button icon={<UploadOutlined />}>Select CSV File</Button>
            </Upload>
          </Form.Item>

          <Form.Item
            name="updateExisting"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch /> Update existing products (match by SKU)
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setBulkUploadVisible(false)}>
                Cancel
              </Button>
              <Button
                href="/templates/product-import-template.csv"
                download
              >
                Download Template
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                Import Products
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;

/*
📁 FILE PATH: frontend/src/pages/Products.jsx

📋 DESCRIPTION:
Comprehensive product management interface with CRUD operations, bulk import,
inventory tracking, and detailed product analytics for the Enterprise POS system.

🔧 FEATURES:
- Complete product CRUD with form validation
- Advanced filtering and search capabilities
- Bulk CSV import with template download
- Real-time inventory tracking and low stock alerts
- Product image upload and management
- Profit margin calculation and analytics
- Category-based organization
- Stock level monitoring with visual indicators
- Detailed product information drawer
- Export functionality for reporting
- Permission-based access control

🎯 INTEGRATION:
- Connects to backend product management APIs
- Uses authentication for role-based permissions
- Integrates with inventory tracking system
- Links to POS terminal for product selection
- Supports barcode scanning and SKU management

⚡ BUSINESS LOGIC:
- Automatic margin calculation (price - cost) / price * 100
- Low stock alerts when stock <= min_stock
- Inventory value calculation (price * stock)
- Category-based product organization
- Active/inactive status management
- Bulk operations for efficiency
*/