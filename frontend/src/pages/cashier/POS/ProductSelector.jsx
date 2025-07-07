// frontend/src/pages/cashier/POS/ProductSelector.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Input,
  Button,
  Select,
  Space,
  Typography,
  Tag,
  Image,
  Badge,
  Tooltip,
  Tabs,
  Grid,
  message,
  Empty,
  Spin,
  InputNumber
} from 'antd';
import {
  SearchOutlined,
  AppstoreOutlined,
  BarsOutlined,
  ShoppingCartOutlined,
  StarOutlined,
  FireOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  TagOutlined,
  PlusOutlined,
  HeartOutlined,
  EyeOutlined
} from '@ant-design/icons';
import './ProductSelector.css';

const { Text, Title } = Typography;
const { TabPane } = Tabs;
const { useBreakpoint } = Grid;

const ProductSelector = ({ onAddToCart, suggestions = [] }) => {
  // States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [quickAddQuantity, setQuickAddQuantity] = useState({});
  const [favoriteProducts, setFavoriteProducts] = useState(new Set());
  
  const screens = useBreakpoint();

  // Sample categories with icons
  const defaultCategories = [
    { id: 'all', name: 'Tất cả', icon: <AppstoreOutlined />, color: '#1890ff' },
    { id: 'food', name: 'Thực phẩm', icon: '🍎', color: '#52c41a' },
    { id: 'drinks', name: 'Đồ uống', icon: '🥤', color: '#13c2c2' },
    { id: 'snacks', name: 'Snacks', icon: '🍿', color: '#faad14' },
    { id: 'personal', name: 'Cá nhân', icon: '🧴', color: '#722ed1' },
    { id: 'household', name: 'Gia dụng', icon: '🏠', color: '#fa541c' },
    { id: 'electronics', name: 'Điện tử', icon: '📱', color: '#2f54eb' },
    { id: 'hot', name: 'Bán chạy', icon: <FireOutlined />, color: '#f5222d' }
  ];

  // Sample products data
  const sampleProducts = [
    {
      id: 1,
      name: 'Coca Cola 330ml',
      price: 15000,
      category: 'drinks',
      image: '/api/placeholder/200/200',
      barcode: '8934567890123',
      stock: 150,
      description: 'Nước ngọt có ga Coca Cola',
      tags: ['Bán chạy', 'Mới'],
      discount: 0,
      rating: 4.5,
      isHot: true
    },
    {
      id: 2,
      name: 'Bánh mì sandwich',
      price: 25000,
      category: 'food',
      image: '/api/placeholder/200/200',
      barcode: '8934567890124',
      stock: 50,
      description: 'Bánh mì sandwich thịt nguội',
      tags: ['Tươi sống'],
      discount: 10,
      rating: 4.2
    },
    {
      id: 3,
      name: 'Nước suối Lavie 500ml',
      price: 8000,
      category: 'drinks',
      image: '/api/placeholder/200/200',
      barcode: '8934567890125',
      stock: 200,
      description: 'Nước suối tinh khiết Lavie',
      tags: [],
      discount: 0,
      rating: 4.0
    },
    {
      id: 4,
      name: 'Snack khoai tây Lays',
      price: 12000,
      category: 'snacks',
      image: '/api/placeholder/200/200',
      barcode: '8934567890126',
      stock: 80,
      description: 'Snack khoai tây chiên vị tự nhiên',
      tags: ['Giòn tan'],
      discount: 5,
      rating: 4.3,
      isHot: true
    },
    {
      id: 5,
      name: 'Dầu gội Head & Shoulders',
      price: 85000,
      category: 'personal',
      image: '/api/placeholder/200/200',
      barcode: '8934567890127',
      stock: 25,
      description: 'Dầu gội chống gàu 400ml',
      tags: ['Chăm sóc'],
      discount: 15,
      rating: 4.4
    },
    {
      id: 6,
      name: 'iPhone Lightning Cable',
      price: 450000,
      category: 'electronics',
      image: '/api/placeholder/200/200',
      barcode: '8934567890128',
      stock: 15,
      description: 'Cáp sạc iPhone Lightning chính hãng',
      tags: ['Chính hãng'],
      discount: 0,
      rating: 4.8
    }
  ];

  // Load data
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      // const response = await fetch('/api/products');
      // const data = await response.json();
      
      // For demo, use sample data
      setTimeout(() => {
        setProducts(sampleProducts);
        setLoading(false);
      }, 500);
    } catch (error) {
      message.error('Lỗi khi tải sản phẩm');
      setLoading(false);
    }
  };

  const loadCategories = () => {
    setCategories(defaultCategories);
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'hot') {
        filtered = filtered.filter(p => p.isHot);
      } else {
        filtered = filtered.filter(p => p.category === selectedCategory);
      }
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.includes(searchTerm) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by price range
    filtered = filtered.filter(p => 
      p.price >= priceRange[0] && p.price <= priceRange[1]
    );

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'stock':
          return b.stock - a.stock;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'hot':
          return (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [products, selectedCategory, searchTerm, priceRange, sortBy]);

  // Handle add to cart
  const handleAddToCart = (product, quantity = 1) => {
    if (product.stock < quantity) {
      message.warning('Không đủ tồn kho!');
      return;
    }
    
    onAddToCart(product, quantity);
    
    // Reset quick add quantity
    setQuickAddQuantity(prev => ({
      ...prev,
      [product.id]: 1
    }));
  };

  // Handle quick add quantity change
  const handleQuantityChange = (productId, quantity) => {
    setQuickAddQuantity(prev => ({
      ...prev,
      [productId]: quantity || 1
    }));
  };

  // Toggle favorite
  const toggleFavorite = (productId) => {
    setFavoriteProducts(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(productId)) {
        newFavorites.delete(productId);
        message.info('Đã xóa khỏi yêu thích');
      } else {
        newFavorites.add(productId);
        message.success('Đã thêm vào yêu thích');
      }
      return newFavorites;
    });
  };

  // Product card component
  const ProductCard = ({ product }) => {
    const quantity = quickAddQuantity[product.id] || 1;
    const discountedPrice = product.discount > 0 
      ? product.price * (1 - product.discount / 100)
      : product.price;

    return (
      <Card
        className="product-card"
        hoverable
        cover={
          <div className="product-image-container">
            <Image
              src={product.image}
              alt={product.name}
              preview={false}
              fallback="/api/placeholder/200/200"
            />
            
            {/* Badges */}
            <div className="product-badges">
              {product.isHot && (
                <Badge count={<FireOutlined style={{ color: '#f5222d' }} />} />
              )}
              {product.discount > 0 && (
                <Tag color="red" className="discount-tag">
                  -{product.discount}%
                </Tag>
              )}
            </div>
            
            {/* Quick actions */}
            <div className="product-overlay">
              <Space>
                <Button
                  type="primary"
                  ghost
                  icon={<EyeOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    message.info('Chi tiết sản phẩm');
                  }}
                />
                <Button
                  type={favoriteProducts.has(product.id) ? 'primary' : 'default'}
                  ghost
                  icon={<HeartOutlined />}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(product.id);
                  }}
                />
              </Space>
            </div>
          </div>
        }
        actions={[
          <div key="quantity" className="quantity-selector">
            <InputNumber
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(value) => handleQuantityChange(product.id, value)}
              size="small"
              style={{ width: 60 }}
            />
          </div>,
          <Button
            key="add"
            type="primary"
            icon={<ShoppingCartOutlined />}
            onClick={() => handleAddToCart(product, quantity)}
            disabled={product.stock === 0}
            block
          >
            Thêm
          </Button>
        ]}
      >
        <Card.Meta
          title={
            <div>
              <Text strong ellipsis={{ tooltip: product.name }}>
                {product.name}
              </Text>
              {product.rating && (
                <div style={{ marginTop: 4 }}>
                  <Space size="small">
                    <StarOutlined style={{ color: '#faad14' }} />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {product.rating}
                    </Text>
                  </Space>
                </div>
              )}
            </div>
          }
          description={
            <div>
              <div className="product-price">
                {product.discount > 0 ? (
                  <Space>
                    <Text strong style={{ color: '#f5222d' }}>
                      {discountedPrice.toLocaleString('vi-VN')} ₫
                    </Text>
                    <Text delete type="secondary" style={{ fontSize: '12px' }}>
                      {product.price.toLocaleString('vi-VN')} ₫
                    </Text>
                  </Space>
                ) : (
                  <Text strong style={{ color: '#52c41a' }}>
                    {product.price.toLocaleString('vi-VN')} ₫
                  </Text>
                )}
              </div>
              
              <div className="product-stock">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Tồn: {product.stock}
                </Text>
              </div>
              
              {product.tags.length > 0 && (
                <div className="product-tags" style={{ marginTop: 4 }}>
                  {product.tags.slice(0, 2).map(tag => (
                    <Tag key={tag} size="small" color="blue">
                      {tag}
                    </Tag>
                  ))}
                </div>
              )}
            </div>
          }
        />
      </Card>
    );
  };

  return (
    <div className="product-selector">
      {/* Search and Filters */}
      <Card size="small" className="product-filters">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Tìm sản phẩm..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          
          <Col xs={12} sm={6} md={4}>
            <Select
              placeholder="Sắp xếp"
              value={sortBy}
              onChange={setSortBy}
              style={{ width: '100%' }}
            >
              <Select.Option value="name">Tên A-Z</Select.Option>
              <Select.Option value="price-low">Giá thấp</Select.Option>
              <Select.Option value="price-high">Giá cao</Select.Option>
              <Select.Option value="stock">Tồn kho</Select.Option>
              <Select.Option value="rating">Đánh giá</Select.Option>
              <Select.Option value="hot">Bán chạy</Select.Option>
            </Select>
          </Col>
          
          <Col xs={12} sm={6} md={4}>
            <Button.Group>
              <Button
                type={viewMode === 'grid' ? 'primary' : 'default'}
                icon={<AppstoreOutlined />}
                onClick={() => setViewMode('grid')}
              />
              <Button
                type={viewMode === 'list' ? 'primary' : 'default'}
                icon={<BarsOutlined />}
                onClick={() => setViewMode('list')}
              />
            </Button.Group>
          </Col>
          
          <Col xs={24} md={8}>
            <Text type="secondary">
              Hiển thị {filteredProducts.length} / {products.length} sản phẩm
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Categories */}
      <Card size="small" style={{ marginTop: 16 }}>
        <div className="category-tabs">
          <Tabs
            activeKey={selectedCategory}
            onChange={setSelectedCategory}
            type="card"
            size="small"
          >
            {categories.map(category => (
              <TabPane
                key={category.id}
                tab={
                  <Space>
                    {typeof category.icon === 'string' ? (
                      <span style={{ fontSize: '16px' }}>{category.icon}</span>
                    ) : (
                      category.icon
                    )}
                    {category.name}
                  </Space>
                }
              />
            ))}
          </Tabs>
        </div>
      </Card>

      {/* Products Grid */}
      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>Đang tải sản phẩm...</Text>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <Empty
            description="Không tìm thấy sản phẩm"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredProducts.map(product => (
              <Col
                key={product.id}
                xs={12}
                sm={8}
                md={6}
                lg={6}
                xl={4}
              >
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Quick Stats */}
      <div className="product-quick-stats" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">Tổng sản phẩm</Text>
                <div>
                  <Text strong style={{ fontSize: '18px' }}>
                    {products.length}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
          
          <Col span={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">Bán chạy</Text>
                <div>
                  <Text strong style={{ fontSize: '18px', color: '#f5222d' }}>
                    {products.filter(p => p.isHot).length}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
          
          <Col span={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">Giảm giá</Text>
                <div>
                  <Text strong style={{ fontSize: '18px', color: '#faad14' }}>
                    {products.filter(p => p.discount > 0).length}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
          
          <Col span={6}>
            <Card size="small">
              <div style={{ textAlign: 'center' }}>
                <Text type="secondary">Sắp hết</Text>
                <div>
                  <Text strong style={{ fontSize: '18px', color: '#ff7875' }}>
                    {products.filter(p => p.stock < 10).length}
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProductSelector;