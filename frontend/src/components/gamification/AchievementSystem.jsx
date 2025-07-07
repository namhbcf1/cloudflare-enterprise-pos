/**
 * Achievement System Component
 * Comprehensive staff gamification with badges, levels, and rewards
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    Row,
    Col,
    Space,
    Typography,
    Progress,
    Avatar,
    Badge,
    Tag,
    Button,
    Modal,
    List,
    Statistic,
    Timeline,
    Tabs,
    Alert,
    Tooltip,
    Image,
    Empty,
    Select,
    DatePicker,
    theme,
    message
} from 'antd';
import {
    TrophyOutlined,
    StarOutlined,
    GiftOutlined,
    FireOutlined,
    CrownOutlined,
    RocketOutlined,
    TargetOutlined,
    ThunderboltOutlined,
    HeartOutlined,
    DiamondOutlined,
    MedalOutlined,
    CalendarOutlined,
    TeamOutlined,
    CheckCircleOutlined,
    LockOutlined,
    UnlockOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { useToken } = theme;

const AchievementSystem = () => {
    const { user } = useAuth();
    const { token } = useToken();

    // State management
    const [selectedAchievement, setSelectedAchievement] = useState(null);
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [userStats, setUserStats] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [rewards, setRewards] = useState([]);
    const [loading, setLoading] = useState(false);

    // Mock user statistics
    const mockUserStats = {
        userId: user?.id,
        level: 15,
        experience: 2450,
        experienceToNext: 500,
        totalSales: 15240000,
        transactionsCompleted: 324,
        customersServed: 198,
        averageTransactionValue: 47037,
        streak: 7,
        rank: 3,
        badges: 12,
        points: 8750,
        joinedDate: '2023-06-15',
        lastActive: new Date().toISOString()
    };

    // Mock achievements data
    const mockAchievements = [
        {
            id: 'FIRST_SALE',
            title: 'Giao dịch đầu tiên',
            description: 'Hoàn thành giao dịch bán hàng đầu tiên',
            icon: '🎯',
            category: 'milestone',
            rarity: 'common',
            points: 100,
            unlocked: true,
            unlockedAt: '2023-06-15T09:30:00Z',
            progress: 1,
            target: 1
        },
        {
            id: 'SALES_WARRIOR',
            title: 'Chiến binh bán hàng',
            description: 'Hoàn thành 100 giao dịch bán hàng',
            icon: '⚔️',
            category: 'sales',
            rarity: 'rare',
            points: 500,
            unlocked: true,
            unlockedAt: '2023-08-22T14:15:00Z',
            progress: 324,
            target: 100
        },
        {
            id: 'MILLION_SELLER',
            title: 'Triệu phú doanh số',
            description: 'Đạt doanh số 10 triệu đồng trong tháng',
            icon: '💰',
            category: 'revenue',
            rarity: 'epic',
            points: 1000,
            unlocked: true,
            unlockedAt: '2023-09-30T23:59:00Z',
            progress: 15240000,
            target: 10000000
        },
        {
            id: 'CUSTOMER_LOVER',
            title: 'Người yêu khách hàng',
            description: 'Phục vụ 500 khách hàng khác nhau',
            icon: '❤️',
            category: 'customer',
            rarity: 'rare',
            points: 750,
            unlocked: false,
            progress: 198,
            target: 500
        },
        {
            id: 'SPEED_DEMON',
            title: 'Thần tốc độ',
            description: 'Hoàn thành 20 giao dịch trong 1 giờ',
            icon: '⚡',
            category: 'speed',
            rarity: 'epic',
            points: 1200,
            unlocked: false,
            progress: 15,
            target: 20
        },
        {
            id: 'PERFECT_WEEK',
            title: 'Tuần hoàn hảo',
            description: 'Đạt target 7 ngày liên tiếp',
            icon: '🔥',
            category: 'streak',
            rarity: 'legendary',
            points: 2000,
            unlocked: true,
            unlockedAt: '2024-01-08T18:00:00Z',
            progress: 7,
            target: 7
        }
    ];

    // Mock leaderboard data
    const mockLeaderboard = [
        {
            rank: 1,
            userId: 'USER_001',
            name: 'Nguyễn Văn A',
            avatar: null,
            level: 18,
            points: 12500,
            badges: 15,
            totalSales: 22500000,
            change: 0
        },
        {
            rank: 2,
            userId: 'USER_002',
            name: 'Trần Thị B',
            avatar: null,
            level: 16,
            points: 9800,
            badges: 13,
            totalSales: 18200000,
            change: 1
        },
        {
            rank: 3,
            userId: user?.id,
            name: user?.fullName,
            avatar: user?.avatarUrl,
            level: 15,
            points: 8750,
            badges: 12,
            totalSales: 15240000,
            change: -1
        },
        {
            rank: 4,
            userId: 'USER_004',
            name: 'Lê Văn C',
            avatar: null,
            level: 14,
            points: 7200,
            badges: 10,
            totalSales: 12800000,
            change: 2
        },
        {
            rank: 5,
            userId: 'USER_005',
            name: 'Phạm Thị D',
            avatar: null,
            level: 13,
            points: 6500,
            badges: 9,
            totalSales: 11500000,
            change: -1
        }
    ];

    // Mock challenges data
    const mockChallenges = [
        {
            id: 'DAILY_TARGET',
            title: 'Target hôm nay',
            description: 'Đạt doanh số 500.000đ trong ngày',
            type: 'daily',
            target: 500000,
            progress: 320000,
            reward: 50,
            deadline: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        },
        {
            id: 'WEEKLY_SALES',
            title: 'Thách thức tuần',
            description: 'Bán 50 sản phẩm trong tuần này',
            type: 'weekly',
            target: 50,
            progress: 32,
            reward: 200,
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        },
        {
            id: 'MONTHLY_REVENUE',
            title: 'Siêu thách thức tháng',
            description: 'Đạt doanh số 5 triệu đồng trong tháng',
            type: 'monthly',
            target: 5000000,
            progress: 2100000,
            reward: 1000,
            deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
        }
    ];

    // Load data on component mount
    useEffect(() => {
        loadUserData();
    }, []);

    const loadUserData = async () => {
        setLoading(true);
        try {
            // Simulate API calls
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            setUserStats(mockUserStats);
            setAchievements(mockAchievements);
            setLeaderboard(mockLeaderboard);
            setChallenges(mockChallenges);
        } catch (error) {
            console.error('Error loading gamification data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get rarity color
    const getRarityColor = (rarity) => {
        const colors = {
            common: '#52c41a',
            rare: '#1890ff',
            epic: '#722ed1',
            legendary: '#fa8c16'
        };
        return colors[rarity] || '#d9d9d9';
    };

    // Get rarity gradient
    const getRarityGradient = (rarity) => {
        const gradients = {
            common: 'linear-gradient(135deg, #52c41a, #73d13d)',
            rare: 'linear-gradient(135deg, #1890ff, #40a9ff)',
            epic: 'linear-gradient(135deg, #722ed1, #9254de)',
            legendary: 'linear-gradient(135deg, #fa8c16, #ffa940)'
        };
        return gradients[rarity] || 'linear-gradient(135deg, #d9d9d9, #f0f0f0)';
    };

    // Get achievement category icon
    const getCategoryIcon = (category) => {
        const icons = {
            milestone: <TargetOutlined />,
            sales: <ThunderboltOutlined />,
            revenue: <TrophyOutlined />,
            customer: <HeartOutlined />,
            speed: <RocketOutlined />,
            streak: <FireOutlined />
        };
        return icons[category] || <StarOutlined />;
    };

    // Handle achievement click
    const handleAchievementClick = (achievement) => {
        setSelectedAchievement(achievement);
        setDetailsVisible(true);
    };

    // Claim reward
    const claimReward = (challengeId) => {
        message.success('Đã nhận thưởng thành công!');
        setChallenges(prev => 
            prev.map(c => 
                c.id === challengeId 
                    ? { ...c, status: 'completed' }
                    : c
            )
        );
    };

    return (
        <div style={{ padding: 24 }}>
            <Row gutter={[24, 24]}>
                {/* Header */}
                <Col span={24}>
                    <Card>
                        <Row justify="space-between" align="middle">
                            <Col>
                                <Space>
                                    <Avatar 
                                        size={64} 
                                        src={user?.avatarUrl}
                                        icon={<CrownOutlined />}
                                        style={{
                                            background: getRarityGradient('legendary'),
                                            border: `3px solid ${getRarityColor('legendary')}`
                                        }}
                                    />
                                    <div>
                                        <Title level={3} style={{ margin: 0 }}>
                                            {user?.fullName || 'Nhân viên'}
                                        </Title>
                                        <Space>
                                            <Text type="secondary">Level {userStats?.level}</Text>
                                            <Badge count={userStats?.badges} color="gold" />
                                            <Text type="secondary">#{userStats?.rank} trong bảng xếp hạng</Text>
                                        </Space>
                                    </div>
                                </Space>
                            </Col>
                            <Col>
                                <Space size="large">
                                    <Statistic
                                        title="Điểm"
                                        value={userStats?.points}
                                        prefix={<StarOutlined style={{ color: '#faad14' }} />}
                                        valueStyle={{ color: '#faad14' }}
                                    />
                                    <Statistic
                                        title="Streak"
                                        value={userStats?.streak}
                                        suffix="ngày"
                                        prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
                                        valueStyle={{ color: '#ff4d4f' }}
                                    />
                                </Space>
                            </Col>
                        </Row>
                        
                        {/* Level Progress */}
                        <div style={{ marginTop: 24 }}>
                            <Row justify="space-between" align="middle">
                                <Text>Tiến độ lên level:</Text>
                                <Text>
                                    {userStats?.experience}/{userStats?.experience + userStats?.experienceToNext} EXP
                                </Text>
                            </Row>
                            <Progress
                                percent={(userStats?.experience / (userStats?.experience + userStats?.experienceToNext)) * 100}
                                strokeColor={{
                                    '0%': '#87d068',
                                    '50%': '#ffe58f',
                                    '100%': '#ffccc7'
                                }}
                                style={{ marginTop: 8 }}
                            />
                        </div>
                    </Card>
                </Col>

                {/* Statistics Cards */}
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Tổng doanh số"
                            value={userStats?.totalSales}
                            suffix="đ"
                            prefix={<TrophyOutlined />}
                            valueStyle={{ color: token.colorSuccess }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Giao dịch hoàn thành"
                            value={userStats?.transactionsCompleted}
                            prefix={<CheckCircleOutlined />}
                            valueStyle={{ color: token.colorPrimary }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Khách hàng phục vụ"
                            value={userStats?.customersServed}
                            prefix={<TeamOutlined />}
                            valueStyle={{ color: token.colorWarning }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Giá trị TB/giao dịch"
                            value={userStats?.averageTransactionValue}
                            suffix="đ"
                            prefix={<DiamondOutlined />}
                            valueStyle={{ color: token.colorInfo }}
                        />
                    </Card>
                </Col>

                {/* Main Content */}
                <Col span={24}>
                    <Tabs defaultActiveKey="achievements">
                        {/* Achievements Tab */}
                        <TabPane 
                            tab={
                                <span>
                                    <MedalOutlined />
                                    Thành tích ({achievements.filter(a => a.unlocked).length}/{achievements.length})
                                </span>
                            } 
                            key="achievements"
                        >
                            <Row gutter={[16, 16]}>
                                {achievements.map(achievement => (
                                    <Col key={achievement.id} xs={24} sm={12} lg={8} xl={6}>
                                        <Card
                                            hoverable
                                            onClick={() => handleAchievementClick(achievement)}
                                            style={{
                                                background: achievement.unlocked 
                                                    ? getRarityGradient(achievement.rarity)
                                                    : '#f5f5f5',
                                                border: `2px solid ${getRarityColor(achievement.rarity)}`,
                                                opacity: achievement.unlocked ? 1 : 0.6,
                                                cursor: 'pointer'
                                            }}
                                            bodyStyle={{ padding: 16, textAlign: 'center' }}
                                        >
                                            <div style={{ position: 'relative' }}>
                                                {!achievement.unlocked && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: -8,
                                                        right: -8,
                                                        zIndex: 1
                                                    }}>
                                                        <LockOutlined style={{ 
                                                            fontSize: 16, 
                                                            color: '#999' 
                                                        }} />
                                                    </div>
                                                )}
                                                
                                                <div style={{
                                                    fontSize: 48,
                                                    marginBottom: 8,
                                                    filter: achievement.unlocked ? 'none' : 'grayscale(100%)'
                                                }}>
                                                    {achievement.icon}
                                                </div>
                                                
                                                <Title 
                                                    level={5} 
                                                    style={{ 
                                                        margin: '8px 0 4px',
                                                        color: achievement.unlocked ? '#fff' : '#666'
                                                    }}
                                                >
                                                    {achievement.title}
                                                </Title>
                                                
                                                <Text 
                                                    style={{ 
                                                        fontSize: 12,
                                                        color: achievement.unlocked ? 'rgba(255,255,255,0.9)' : '#999'
                                                    }}
                                                >
                                                    {achievement.description}
                                                </Text>
                                                
                                                <div style={{ marginTop: 8 }}>
                                                    <Tag color={achievement.rarity}>
                                                        {achievement.rarity.toUpperCase()}
                                                    </Tag>
                                                    <Tag color="gold">
                                                        +{achievement.points} điểm
                                                    </Tag>
                                                </div>
                                                
                                                {!achievement.unlocked && (
                                                    <Progress
                                                        percent={(achievement.progress / achievement.target) * 100}
                                                        size="small"
                                                        style={{ marginTop: 8 }}
                                                        format={(percent) => 
                                                            `${achievement.progress}/${achievement.target}`
                                                        }
                                                    />
                                                )}
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        </TabPane>

                        {/* Challenges Tab */}
                        <TabPane 
                            tab={
                                <span>
                                    <TargetOutlined />
                                    Thách thức ({challenges.filter(c => c.status === 'active').length})
                                </span>
                            } 
                            key="challenges"
                        >
                            <Row gutter={[16, 16]}>
                                {challenges.map(challenge => {
                                    const progressPercent = (challenge.progress / challenge.target) * 100;
                                    const isCompleted = progressPercent >= 100;
                                    const timeLeft = new Date(challenge.deadline) - new Date();
                                    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                                    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

                                    return (
                                        <Col key={challenge.id} xs={24} lg={12} xl={8}>
                                            <Card
                                                title={
                                                    <Space>
                                                        <Tag color={challenge.type === 'daily' ? 'blue' : challenge.type === 'weekly' ? 'green' : 'purple'}>
                                                            {challenge.type === 'daily' ? 'Hàng ngày' : 
                                                             challenge.type === 'weekly' ? 'Hàng tuần' : 'Hàng tháng'}
                                                        </Tag>
                                                        {challenge.title}
                                                    </Space>
                                                }
                                                extra={
                                                    <Tag color="gold">
                                                        <GiftOutlined /> +{challenge.reward} điểm
                                                    </Tag>
                                                }
                                                style={{
                                                    borderColor: isCompleted ? '#52c41a' : '#d9d9d9'
                                                }}
                                            >
                                                <Space direction="vertical" style={{ width: '100%' }}>
                                                    <Text>{challenge.description}</Text>
                                                    
                                                    <div>
                                                        <Row justify="space-between" align="middle">
                                                            <Text strong>Tiến độ:</Text>
                                                            <Text>
                                                                {challenge.progress.toLocaleString()}/{challenge.target.toLocaleString()}
                                                            </Text>
                                                        </Row>
                                                        <Progress
                                                            percent={Math.min(progressPercent, 100)}
                                                            strokeColor={isCompleted ? '#52c41a' : '#1890ff'}
                                                            style={{ marginTop: 4 }}
                                                        />
                                                    </div>
                                                    
                                                    <Row justify="space-between" align="middle">
                                                        <Space>
                                                            <CalendarOutlined />
                                                            <Text type="secondary">
                                                                {timeLeft > 0 ? 
                                                                    `Còn ${hoursLeft}h ${minutesLeft}m` : 
                                                                    'Đã hết hạn'
                                                                }
                                                            </Text>
                                                        </Space>
                                                        
                                                        {isCompleted && challenge.status === 'active' && (
                                                            <Button
                                                                type="primary"
                                                                size="small"
                                                                icon={<GiftOutlined />}
                                                                onClick={() => claimReward(challenge.id)}
                                                            >
                                                                Nhận thưởng
                                                            </Button>
                                                        )}
                                                    </Row>
                                                </Space>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </TabPane>

                        {/* Leaderboard Tab */}
                        <TabPane 
                            tab={
                                <span>
                                    <CrownOutlined />
                                    Bảng xếp hạng
                                </span>
                            } 
                            key="leaderboard"
                        >
                            <Card>
                                <List
                                    dataSource={leaderboard}
                                    renderItem={(item, index) => {
                                        const isCurrentUser = item.userId === user?.id;
                                        const medalColors = ['#faad14', '#d4edda', '#cd7f32'];
                                        const medalColor = index < 3 ? medalColors[index] : '#d9d9d9';
                                        
                                        return (
                                            <List.Item
                                                style={{
                                                    background: isCurrentUser ? '#f6ffed' : 'transparent',
                                                    border: isCurrentUser ? '2px solid #52c41a' : 'none',
                                                    borderRadius: 8,
                                                    marginBottom: 8,
                                                    padding: 16
                                                }}
                                            >
                                                <List.Item.Meta
                                                    avatar={
                                                        <Badge
                                                            count={item.rank}
                                                            style={{ 
                                                                backgroundColor: medalColor,
                                                                fontSize: 14,
                                                                fontWeight: 'bold'
                                                            }}
                                                        >
                                                            <Avatar 
                                                                size={64}
                                                                src={item.avatar}
                                                                icon={<CrownOutlined />}
                                                                style={{
                                                                    background: index < 3 ? 
                                                                        getRarityGradient('legendary') : 
                                                                        token.colorPrimary
                                                                }}
                                                            />
                                                        </Badge>
                                                    }
                                                    title={
                                                        <Space>
                                                            <Text strong style={{ fontSize: 16 }}>
                                                                {item.name}
                                                            </Text>
                                                            {isCurrentUser && (
                                                                <Tag color="green">Bạn</Tag>
                                                            )}
                                                            {index < 3 && (
                                                                <CrownOutlined style={{ color: medalColor }} />
                                                            )}
                                                        </Space>
                                                    }
                                                    description={
                                                        <Row gutter={16}>
                                                            <Col>
                                                                <Text type="secondary">Level: </Text>
                                                                <Text strong>{item.level}</Text>
                                                            </Col>
                                                            <Col>
                                                                <Text type="secondary">Điểm: </Text>
                                                                <Text strong style={{ color: '#faad14' }}>
                                                                    {item.points.toLocaleString()}
                                                                </Text>
                                                            </Col>
                                                            <Col>
                                                                <Text type="secondary">Huy hiệu: </Text>
                                                                <Text strong>{item.badges}</Text>
                                                            </Col>
                                                            <Col>
                                                                <Text type="secondary">Doanh số: </Text>
                                                                <Text strong>
                                                                    {item.totalSales.toLocaleString()} đ
                                                                </Text>
                                                            </Col>
                                                        </Row>
                                                    }
                                                />
                                                <div style={{ textAlign: 'right' }}>
                                                    {item.change !== 0 && (
                                                        <Tag color={item.change > 0 ? 'red' : 'green'}>
                                                            {item.change > 0 ? '↓' : '↑'} {Math.abs(item.change)}
                                                        </Tag>
                                                    )}
                                                </div>
                                            </List.Item>
                                        );
                                    }}
                                />
                            </Card>
                        </TabPane>
                    </Tabs>
                </Col>
            </Row>

            {/* Achievement Details Modal */}
            <Modal
                title={
                    <Space>
                        <span style={{ fontSize: 32 }}>
                            {selectedAchievement?.icon}
                        </span>
                        <div>
                            <Text strong>{selectedAchievement?.title}</Text>
                            <br />
                            <Tag color={selectedAchievement?.rarity}>
                                {selectedAchievement?.rarity?.toUpperCase()}
                            </Tag>
                        </div>
                    </Space>
                }
                open={detailsVisible}
                onCancel={() => setDetailsVisible(false)}
                footer={null}
                width={600}
            >
                {selectedAchievement && (
                    <Space direction="vertical" style={{ width: '100%' }} size="large">
                        <Card 
                            style={{
                                background: getRarityGradient(selectedAchievement.rarity),
                                color: 'white',
                                textAlign: 'center'
                            }}
                        >
                            <div style={{ fontSize: 64, marginBottom: 16 }}>
                                {selectedAchievement.icon}
                            </div>
                            <Title level={3} style={{ color: 'white', margin: 0 }}>
                                {selectedAchievement.title}
                            </Title>
                            <Paragraph style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, margin: '8px 0' }}>
                                {selectedAchievement.description}
                            </Paragraph>
                            <Space>
                                <Tag color="gold" style={{ fontSize: 14, padding: '4px 8px' }}>
                                    <StarOutlined /> +{selectedAchievement.points} điểm
                                </Tag>
                                {getCategoryIcon(selectedAchievement.category)}
                                <Text style={{ color: 'white' }}>
                                    {selectedAchievement.category}
                                </Text>
                            </Space>
                        </Card>

                        {selectedAchievement.unlocked ? (
                            <Alert
                                message="Thành tích đã mở khóa"
                                description={
                                    <Space>
                                        <UnlockOutlined />
                                        <Text>
                                            Hoàn thành vào {new Date(selectedAchievement.unlockedAt).toLocaleString('vi-VN')}
                                        </Text>
                                    </Space>
                                }
                                type="success"
                                showIcon
                            />
                        ) : (
                            <Card title="Tiến độ hoàn thành">
                                <Progress
                                    percent={(selectedAchievement.progress / selectedAchievement.target) * 100}
                                    format={(percent) => 
                                        `${selectedAchievement.progress}/${selectedAchievement.target}`
                                    }
                                />
                                <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
                                    Còn cần {selectedAchievement.target - selectedAchievement.progress} để hoàn thành
                                </Text>
                            </Card>
                        )}
                    </Space>
                )}
            </Modal>
        </div>
    );
};

export default AchievementSystem;