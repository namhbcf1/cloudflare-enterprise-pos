// frontend/src/pages/staff/Dashboard/PersonalDashboard.jsx
import React, { useState, useEffect, useContext } from 'react';
import {
  Row,
  Col,
  Card,
  Progress,
  Avatar,
  Typography,
  Space,
  Badge,
  Button,
  Tooltip,
  Tag,
  Statistic,
  List,
  Timeline,
  Alert,
  Tabs,
  Modal,
  message,
  Divider,
  Rate,
  Image
} from 'antd';
import {
  TrophyOutlined,
  FireOutlined,
  StarOutlined,
  GiftOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  TeamOutlined,
  DollarOutlined,
  TargetOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  HeartOutlined,
  SmileOutlined,
  EyeOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { AuthContext } from '../../../auth/AuthContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import './PersonalDashboard.css';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const PersonalDashboard = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [userStats, setUserStats] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);

  // Sample user stats data
  const sampleUserStats = {
    level: 12,
    experience: 8750,
    experienceToNext: 10000,
    totalPoints: 45230,
    availablePoints: 1250,
    rank: 3,
    totalStaff: 25,
    streak: 7,
    todaySales: 850000,
    monthSales: 12500000,
    salesTarget: 15000000,
    commission: 625000,
    customersServed: 45,
    avgRating: 4.7,
    badges: 8,
    completedChallenges: 15
  };

  // Sample achievements data
  const sampleAchievements = [
    {
      id: 1,
      name: 'Sales Superstar',
      description: 'Đạt 1 triệu doanh số trong ngày',
      icon: '🌟',
      rarity: 'epic',
      points: 500,
      unlockedAt: '2025-01-05',
      progress: 100,
      category: 'sales'
    },
    {
      id: 2,
      name: 'Customer Champion',
      description: 'Phục vụ 50 khách hàng trong tuần',
      icon: '👑',
      rarity: 'legendary',
      points: 750,
      unlockedAt: '2025-01-03',
      progress: 100,
      category: 'service'
    },
    {
      id: 3,
      name: 'Speed Demon',
      description: 'Xử lý 20 đơn hàng trong 1 giờ',
      icon: '⚡',
      rarity: 'rare',
      points: 300,
      unlockedAt: null,
      progress: 75,
      category: 'efficiency'
    },
    {
      id: 4,
      name: 'Streak Master',
      description: 'Đạt target 7 ngày liên tiếp',
      icon: '🔥',
      rarity: 'epic',
      points: 600,
      unlockedAt: '2025-01-07',
      progress: 100,
      category: 'consistency'
    }
  ];

  // Sample challenges data
  const sampleChallenges = [
    {
      id: 1,
      name: 'Thử thách tuần này',
      description: 'Bán 50 sản phẩm combo',
      progress: 32,
      target: 50,
      reward: 400,
      endDate: '2025-01-14',
      difficulty: 'medium',
      category: 'sales'
    },
    {
      id: 2,
      name: 'Khách hàng hài lòng',
      description: 'Đạt rating 4.8+ từ 20 khách hàng',
      progress: 15,
      target: 20,
      reward: 300,
      endDate: '2025-01-15',
      difficulty: 'hard',
      category: 'service'
    }
  ];

  // Sample sales data for chart
  const sampleSalesData = [
    { day: 'T2', sales: 750000, target: 800000 },
    { day: 'T3', sales: 920000, target: 800000 },
    { day: 'T4', sales: 680000, target: 800000 },
    { day: 'T5', sales: 1100000, target: 800000 },
    { day: 'T6', sales: 850000, target: 800000 },
    { day: 'T7', sales: 950000, target: 800000 },
    { day: 'CN', sales: 480000, target: 600000 }
  ];

  // Sample leaderboard data
  const sampleLeaderboard = [
    { id: 1, name: 'Nguyễn Văn A', points: 52000, level: 15, avatar: '/api/placeholder/40/40' },
    { id: 2, name: 'Trần Thị B', points: 48500, level: 14, avatar: '/api/placeholder/40/40' },
    { id: 3, name: user?.name || 'Bạn', points: 45230, level: 12, avatar: '/api/placeholder/40/40' },
    { id: 4, name: 'Lê Văn C', points: 42100, level: 11, avatar: '/api/placeholder/40/40' },
    { id: 5, name: 'Phạm Thị D', points: 39800, level: 11, avatar: '/api/placeholder/40/40' }
  ];

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // In production, fetch from API
      // const response = await fetch('/api/staff/dashboard');
      // const data = await response.json();
      
      // For demo, use sample data
      setTimeout(() => {
        setUserStats(sampleUserStats);
        setAchievements(sampleAchievements);
        setChallenges(sampleChallenges);
        setLeaderboard(sampleLeaderboard);
        setSalesData(sampleSalesData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu dashboard');
      setLoading(false);
    }
  };

  // Get rarity color
  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#8c8c8c';
      case 'rare': return '#1890ff';
      case 'epic': return '#722ed1';
      case 'legendary': return '#faad14';
      default: return '#8c8c8c';
    }
  };

  // Get level info
  const getLevelInfo = (level) => {
    const levelColors = ['#52c41a', '#1890ff', '#722ed1', '#faad14', '#f5222d'];
    return {
      color: levelColors[Math.min(Math.floor(level / 5), 4)],
      title: level < 5 ? 'Newbie' : level < 10 ? 'Explorer' : level < 15 ? 'Expert' : level < 20 ? 'Master' : 'Legend'
    };
  };

  const levelInfo = getLevelInfo(userStats.level);

  return (
    <div className="staff-dashboard">
      {/* Header - User Profile & Level */}
      <Card className="dashboard-header" style={{ marginBottom: 24 }}>
        <Row align="middle" justify="space-between">
          <Col>
            <Space size="large">
              <div className="user-avatar-section">
                <Badge.Ribbon text={`Level ${userStats.level}`} color={levelInfo.color}>
                  <Avatar 
                    size={80} 
                    src={user?.avatar || '/api/placeholder/80/80'}
                    icon={<UserOutlined />}
                  />
                </Badge.Ribbon>
              </div>
              
              <div className="user-info">
                <Title level={3} style={{ margin: 0 }}>
                  Chào {user?.name || 'Nhân viên'}! 👋
                </Title>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  {levelInfo.title} • Rank #{userStats.rank}/{userStats.totalStaff}
                </Text>
                
                {/* Experience Bar */}
                <div style={{ marginTop: 8, width: 300 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    EXP: {userStats.experience?.toLocaleString()}/{userStats.experienceToNext?.toLocaleString()}
                  </Text>
                  <Progress
                    percent={(userStats.experience / userStats.experienceToNext) * 100}
                    showInfo={false}
                    strokeColor={{
                      '0%': levelInfo.color,
                      '100%': '#87d068',
                    }}
                  />
                </div>
              </div>
            </Space>
          </Col>
          
          <Col>
            <Space direction="vertical" align="end">
              <div>
                <Statistic
                  title="Points khả dụng"
                  value={userStats.availablePoints}
                  suffix={<GiftOutlined />}
                  valueStyle={{ color: '#faad14' }}
                />
              </div>
              
              <Space>
                <Tag icon={<FireOutlined />} color="red">
                  Streak {userStats.streak} ngày
                </Tag>
                <Button type="primary" icon={<GiftOutlined />}>
                  Đổi thưởng
                </Button>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Left Column */}
        <Col xs={24} lg={16}>
          {/* Performance Stats */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Doanh số hôm nay"
                  value={userStats.todaySales}
                  formatter={(value) => `${value?.toLocaleString('vi-VN')} ₫`}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Hoa hồng tháng"
                  value={userStats.commission}
                  formatter={(value) => `${value?.toLocaleString('vi-VN')} ₫`}
                  prefix={<GiftOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
            
            <Col xs={12} sm={6}>
              <Card>
                <Statistic
                  title="Khách hàng phục vụ"
                  value={userStats.customersServed}
                  prefix={<UserOutlined />}
                  suffix="khách"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            
            <Col xs={12} sm={6}>
              <Card>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary">Đánh giá trung bình</Text>
                  <div style={{ marginTop: 8 }}>
                    <Rate disabled value={userStats.avgRating} allowHalf />
                    <div>
                      <Text strong style={{ fontSize: 18 }}>
                        {userStats.avgRating}/5.0
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Sales Chart */}
          <Card title="Biểu đồ doanh số 7 ngày" style={{ marginBottom: 24 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value, name) => [
                    `${value.toLocaleString('vi-VN')} ₫`,
                    name === 'sales' ? 'Doanh số' : 'Mục tiêu'
                  ]}
                />
                <Bar dataKey="target" fill="#d9d9d9" name="target" />
                <Bar dataKey="sales" fill="#52c41a" name="sales" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Monthly Progress */}
          <Card title="Tiến độ tháng này" style={{ marginBottom: 24 }}>
            <Row gutter={16}>
              <Col span={12}>
                <div style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={(userStats.monthSales / userStats.salesTarget) * 100}
                    format={() => `${Math.round((userStats.monthSales / userStats.salesTarget) * 100)}%`}
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <div style={{ marginTop: 16 }}>
                    <Text strong>Doanh số tháng</Text>
                    <br />
                    <Text type="secondary">
                      {userStats.monthSales?.toLocaleString('vi-VN')} / {userStats.salesTarget?.toLocaleString('vi-VN')} ₫
                    </Text>
                  </div>
                </div>
              </Col>
              
              <Col span={12}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Alert
                    message={
                      userStats.monthSales >= userStats.salesTarget 
                        ? "🎉 Chúc mừng! Bạn đã hoàn thành mục tiêu tháng!"
                        : `Còn ${(userStats.salesTarget - userStats.monthSales).toLocaleString('vi-VN')} ₫ để đạt mục tiêu`
                    }
                    type={userStats.monthSales >= userStats.salesTarget ? "success" : "info"}
                    showIcon
                  />
                  
                  <div>
                    <Text strong>Thống kê nhanh:</Text>
                    <ul style={{ marginTop: 8 }}>
                      <li>Ngày còn lại: {31 - new Date().getDate()} ngày</li>
                      <li>Trung bình/ngày: {Math.round(userStats.monthSales / new Date().getDate()).toLocaleString('vi-VN')} ₫</li>
                      <li>Cần bán/ngày: {Math.round((userStats.salesTarget - userStats.monthSales) / (31 - new Date().getDate())).toLocaleString('vi-VN')} ₫</li>
                    </ul>
                  </div>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} lg={8}>
          {/* Achievements */}
          <Card 
            title={
              <Space>
                <TrophyOutlined />
                Thành tích ({achievements.filter(a => a.unlockedAt).length}/{achievements.length})
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {achievements.slice(0, 4).map(achievement => (
                <div
                  key={achievement.id}
                  className="achievement-item"
                  style={{
                    padding: 12,
                    border: `2px solid ${achievement.unlockedAt ? getRarityColor(achievement.rarity) : '#d9d9d9'}`,
                    borderRadius: 8,
                    background: achievement.unlockedAt ? '#f6ffed' : '#fafafa',
                    cursor: 'pointer',
                    opacity: achievement.unlockedAt ? 1 : 0.6
                  }}
                  onClick={() => {
                    setSelectedAchievement(achievement);
                    setModalVisible(true);
                  }}
                >
                  <Row align="middle">
                    <Col span={4}>
                      <div style={{ fontSize: 24 }}>
                        {achievement.icon}
                      </div>
                    </Col>
                    <Col span={16}>
                      <div>
                        <Text strong>{achievement.name}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {achievement.description}
                        </Text>
                      </div>
                    </Col>
                    <Col span={4}>
                      {achievement.unlockedAt ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
                      ) : (
                        <Progress
                          type="circle"
                          percent={achievement.progress}
                          size={30}
                          format={() => `${achievement.progress}%`}
                        />
                      )}
                    </Col>
                  </Row>
                </div>
              ))}
              
              <Button type="dashed" block>
                Xem tất cả thành tích
              </Button>
            </Space>
          </Card>

          {/* Current Challenges */}
          <Card
            title={
              <Space>
                <TargetOutlined />
                Thử thách hiện tại
              </Space>
            }
            style={{ marginBottom: 24 }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {challenges.map(challenge => (
                <div key={challenge.id} style={{ padding: 12, background: '#f0f2f5', borderRadius: 8 }}>
                  <div style={{ marginBottom: 8 }}>
                    <Row justify="space-between">
                      <Text strong>{challenge.name}</Text>
                      <Tag color={challenge.difficulty === 'easy' ? 'green' : challenge.difficulty === 'medium' ? 'orange' : 'red'}>
                        {challenge.difficulty}
                      </Tag>
                    </Row>
                  </div>
                  
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {challenge.description}
                  </Text>
                  
                  <div style={{ marginTop: 8 }}>
                    <Progress 
                      percent={(challenge.progress / challenge.target) * 100}
                      format={() => `${challenge.progress}/${challenge.target}`}
                    />
                  </div>
                  
                  <Row justify="space-between" style={{ marginTop: 8 }}>
                    <Text type="secondary">
                      <ClockCircleOutlined /> Còn {new Date(challenge.endDate).getDate() - new Date().getDate()} ngày
                    </Text>
                    <Text strong style={{ color: '#faad14' }}>
                      +{challenge.reward} điểm
                    </Text>
                  </Row>
                </div>
              ))}
            </Space>
          </Card>

          {/* Mini Leaderboard */}
          <Card
            title={
              <Space>
                <CrownOutlined />
                Bảng xếp hạng
              </Space>
            }
          >
            <List
              size="small"
              dataSource={leaderboard.slice(0, 5)}
              renderItem={(item, index) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Badge count={index + 1} color={index < 3 ? '#faad14' : '#d9d9d9'}>
                        <Avatar src={item.avatar} />
                      </Badge>
                    }
                    title={
                      <Space>
                        {item.name}
                        {index === 0 && <CrownOutlined style={{ color: '#faad14' }} />}
                        {item.name === user?.name && <Text type="success">(Bạn)</Text>}
                      </Space>
                    }
                    description={`Level ${item.level} • ${item.points.toLocaleString()} điểm`}
                  />
                </List.Item>
              )}
            />
            
            <Button type="dashed" block style={{ marginTop: 16 }}>
              Xem bảng xếp hạng đầy đủ
            </Button>
          </Card>
        </Col>
      </Row>

      {/* Achievement Detail Modal */}
      <Modal
        title={selectedAchievement?.name}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={500}
      >
        {selectedAchievement && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 80, marginBottom: 16 }}>
              {selectedAchievement.icon}
            </div>
            
            <Tag color={getRarityColor(selectedAchievement.rarity)} style={{ marginBottom: 16 }}>
              {selectedAchievement.rarity.toUpperCase()}
            </Tag>
            
            <Paragraph>{selectedAchievement.description}</Paragraph>
            
            <Row gutter={16} style={{ marginTop: 24 }}>
              <Col span={8}>
                <Statistic
                  title="Điểm thưởng"
                  value={selectedAchievement.points}
                  prefix={<StarOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Tiến độ"
                  value={selectedAchievement.progress}
                  suffix="%"
                />
              </Col>
              <Col span={8}>
                <div>
                  <Text type="secondary">Trạng thái</Text>
                  <div>
                    {selectedAchievement.unlockedAt ? (
                      <Tag color="success" icon={<CheckCircleOutlined />}>
                        Đã mở khóa
                      </Tag>
                    ) : (
                      <Tag color="processing">
                        Đang thực hiện
                      </Tag>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
            
            {selectedAchievement.unlockedAt && (
              <div style={{ marginTop: 16 }}>
                <Text type="secondary">
                  Mở khóa vào: {new Date(selectedAchievement.unlockedAt).toLocaleDateString('vi-VN')}
                </Text>
              </div>
            )}
            
            <div style={{ marginTop: 24 }}>
              <Space>
                <Button icon={<ShareAltOutlined />}>
                  Chia sẻ
                </Button>
                <Button type="primary">
                  Xem chi tiết
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PersonalDashboard;