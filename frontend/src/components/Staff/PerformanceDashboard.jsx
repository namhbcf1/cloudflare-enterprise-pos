/**
 * Performance Dashboard Component
 * Individual and team performance metrics with goal tracking
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
    Card,
    Row,
    Col,
    Space,
    Typography,
    Progress,
    Statistic,
    Select,
    DatePicker,
    Button,
    Table,
    Tag,
    Avatar,
    Alert,
    Timeline,
    Tabs,
    Radio,
    Switch,
    Tooltip,
    theme
} from 'antd';
import {
    TrophyOutlined,
    TargetOutlined,
    RiseOutlined,
    FallOutlined,
    UserOutlined,
    TeamOutlined,
    CalendarOutlined,
    ClockCircleOutlined,
    DollarOutlined,
    ShoppingCartOutlined,
    HeartOutlined,
    FireOutlined,
    StarOutlined,
    ThunderboltOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;
const { useToken } = theme;

const PerformanceDashboard = () => {
    const { user } = useAuth();
    const { token } = useToken();

    // State management
    const [timeRange, setTimeRange] = useState('week');
    const [comparisonMode, setComparisonMode] = useState('individual'); // individual | team | department
    const [dateRange, setDateRange] = useState([]);
    const [performanceData, setPerformanceData] = useState(null);
    const [goals, setGoals] = useState([]);
    const [teamData, setTeamData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Mock performance data
    const mockPerformanceData = {
        individual: {
            currentPeriod: {
                sales: 2840000,
                transactions: 67,
                customers: 45,
                averageTransaction: 42388,
                satisfaction: 4.6,
                efficiency: 87,
                accuracy: 96,
                speed: 92
            },
            previousPeriod: {
                sales: 2120000,
                transactions: 52,
                customers: 38,
                averageTransaction: 40769,
                satisfaction: 4.4,
                efficiency: 83,
                accuracy: 94,
                speed: 89
            },
            dailyData: [
                { date: '01/15', sales: 420000, transactions: 12, customers: 8 },
                { date: '01/16', sales: 380000, transactions: 10, customers: 7 },
                { date: '01/17', sales: 450000, transactions: 13, customers: 9 },
                { date: '01/18', sales: 390000, transactions: 11, customers: 8 },
                { date: '01/19', sales: 520000, transactions: 15, customers: 11 },
                { date: '01/20', sales: 340000, transactions: 8, customers: 6 },
                { date: '01/21', sales: 340000, transactions: 8, customers: 6 }
            ],
            skillsRadar: [
                { skill: 'Bán hàng', score: 85, maxScore: 100 },
                { skill: 'Giao tiếp', score: 92, maxScore: 100 },
                { skill: 'Sản phẩm', score: 78, maxScore: 100 },
                { skill: 'Tốc độ', score: 88, maxScore: 100 },
                { skill: 'Chính xác', score: 96, maxScore: 100 },
                { skill: 'Khách hàng', score: 90, maxScore: 100 }
            ]
        },
        team: {
            ranking: 3,
            totalMembers: 8,
            teamSales: 18500000,
            teamTarget: 20000000,
            members: [
                { id: 1, name: 'Nguyễn Văn A', sales: 3200000, target: 2500000, efficiency: 95 },
                { id: 2, name: 'Trần Thị B', sales: 2900000, target: 2500000, efficiency: 89 },
                { id: 3, name: user?.fullName, sales: 2840000, target: 2500000, efficiency: 87 },
                { id: 4, name: 'Lê Văn C', sales: 2650000, target: 2500000, efficiency: 82 },
                { id: 5, name: 'Phạm Thị D', sales: 2400000, target: 2500000, efficiency: 76 },
                { id: 6, name: 'Hoàng Văn E', sales: 2300000, target: 2500000, efficiency: 74 },
                { id: 7, name: 'Vũ Thị F', sales: 2100000, target: 2500000, efficiency: 68 },
                { id: 8, name: 'Đặng Văn G', sales: 2110000, target: 2500000, efficiency: 65 }
            ]
        }
    };

    // Mock goals data
    const mockGoals = [
        {
            id: 'DAILY_SALES',
            title: 'Doanh số hàng ngày',
            target: 400000,
            current: 340000,
            unit: 'đ',
            period: 'daily',
            deadline: new Date().toISOString(),
            status: 'active',
            priority: 'high'
        },
        {
            id: 'WEEKLY_TRANSACTIONS',
            title: 'Giao dịch trong tuần',
            target: 80,
            current: 67,
            unit: 'giao dịch',
            period: 'weekly',
            deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            priority: 'medium'
        },
        {
            id: 'MONTHLY_CUSTOMERS',
            title: 'Khách hàng mới trong tháng',
            target: 50,
            current: 32,
            unit: 'khách hàng',
            period: 'monthly',
            deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            priority: 'low'
        },
        {
            id: 'SATISFACTION_SCORE',
            title: 'Điểm hài lòng khách hàng',
            target: 4.8,
            current: 4.6,
            unit: '/5',
            period: 'monthly',
            deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            priority: 'high'
        }
    ];

    // Load data
    useEffect(() => {
        loadPerformanceData();
    }, [timeRange, comparisonMode]);

    const loadPerformanceData = async () => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setPerformanceData(mockPerformanceData);
            setGoals(mockGoals);
        } catch (error) {
            console.error('Error loading performance data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate percentage change
    const calculateChange = (current, previous) => {
        if (previous === 0) return 0;
        return ((current - previous) / previous) * 100;
    };

    // Get goal status color
    const getGoalStatusColor = (current, target) => {
        const percentage = (current / target) * 100;
        if (percentage >= 100) return '#52c41a';
        if (percentage >= 80) return '#faad14';
        return '#ff4d4f';
    };

    // Get priority color
    const getPriorityColor = (priority) => {
        const colors = {
            high: '#ff4d4f',
            medium: '#faad14',
            low: '#52c41a'
        };
        return colors[priority] || '#d9d9d9';
    };

    // Performance metrics with comparison
    const performanceMetrics = useMemo(() => {
        if (!performanceData) return [];

        const { currentPeriod, previousPeriod } = performanceData.individual;
        
        return [
            {
                title: 'Doanh số',
                current: currentPeriod.sales,
                previous: previousPeriod.sales,
                unit: 'đ',
                icon: <DollarOutlined />,
                color: token.colorSuccess
            },
            {
                title: 'Giao dịch',
                current: currentPeriod.transactions,
                previous: previousPeriod.transactions,
                unit: '',
                icon: <ShoppingCartOutlined />,
                color: token.colorPrimary
            },
            {
                title: 'Khách hàng',
                current: currentPeriod.customers,
                previous: previousPeriod.customers,
                unit: '',
                icon: <UserOutlined />,
                color: token.colorWarning
            },
            {
                title: 'TB/Giao dịch',
                current: currentPeriod.averageTransaction,
                previous: previousPeriod.averageTransaction,
                unit: 'đ',
                icon: <TargetOutlined />,
                color: token.colorInfo
            },
            {
                title: 'Hài lòng',
                current: currentPeriod.satisfaction,
                previous: previousPeriod.satisfaction,
                unit: '/5',
                icon: <HeartOutlined />,
                color: '#eb2f96'
            },
            {
                title: 'Hiệu quả',
                current: currentPeriod.efficiency,
                previous: previousPeriod.efficiency,
                unit: '%',
                icon: <ThunderboltOutlined />,
                color: '#722ed1'
            }
        ];
    }, [performanceData, token]);

    // Team comparison table columns
    const teamColumns = [
        {
            title: 'Xếp hạng',
            key: 'rank',
            width: 80,
            render: (_, record, index) => (
                <Avatar
                    style={{
                        backgroundColor: index < 3 ? 
                            ['#faad14', '#d4edda', '#cd7f32'][index] : 
                            '#d9d9d9',
                        fontWeight: 'bold'
                    }}
                >
                    {index + 1}
                </Avatar>
            )
        },
        {
            title: 'Nhân viên',
            dataIndex: 'name',
            key: 'name',
            render: (name, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} />
                    <span style={{ 
                        fontWeight: record.name === user?.fullName ? 'bold' : 'normal',
                        color: record.name === user?.fullName ? token.colorPrimary : 'inherit'
                    }}>
                        {name}
                        {record.name === user?.fullName && <Tag color="blue" style={{ marginLeft: 8 }}>Bạn</Tag>}
                    </span>
                </Space>
            )
        },
        {
            title: 'Doanh số',
            dataIndex: 'sales',
            key: 'sales',
            render: (sales, record) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{sales.toLocaleString()} đ</Text>
                    <Progress
                        percent={(sales / record.target) * 100}
                        size="small"
                        strokeColor={sales >= record.target ? '#52c41a' : '#1890ff'}
                        showInfo={false}
                    />
                </Space>
            )
        },
        {
            title: 'Target',
            dataIndex: 'target',
            key: 'target',
            render: (target) => (
                <Text type="secondary">{target.toLocaleString()} đ</Text>
            )
        },
        {
            title: 'Hiệu quả',
            dataIndex: 'efficiency',
            key: 'efficiency',
            render: (efficiency) => (
                <Tag color={efficiency >= 90 ? 'green' : efficiency >= 75 ? 'orange' : 'red'}>
                    {efficiency}%
                </Tag>
            )
        }
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    return (
        <div style={{ padding: 24 }}>
            <Row gutter={[24, 24]}>
                {/* Header */}
                <Col span={24}>
                    <Card>
                        <Row justify="space-between" align="middle">
                            <Col>
                                <Title level={3} style={{ margin: 0 }}>
                                    <TrophyOutlined /> Dashboard hiệu suất
                                </Title>
                                <Text type="secondary">
                                    Theo dõi và phân tích hiệu suất công việc
                                </Text>
                            </Col>
                            <Col>
                                <Space>
                                    <Select
                                        value={timeRange}
                                        onChange={setTimeRange}
                                        style={{ width: 120 }}
                                    >
                                        <Select.Option value="day">Hôm nay</Select.Option>
                                        <Select.Option value="week">Tuần này</Select.Option>
                                        <Select.Option value="month">Tháng này</Select.Option>
                                        <Select.Option value="quarter">Quý này</Select.Option>
                                    </Select>
                                    
                                    <Radio.Group
                                        value={comparisonMode}
                                        onChange={(e) => setComparisonMode(e.target.value)}
                                        buttonStyle="solid"
                                    >
                                        <Radio.Button value="individual">Cá nhân</Radio.Button>
                                        <Radio.Button value="team">Nhóm</Radio.Button>
                                    </Radio.Group>
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </Col>

                {/* Performance Metrics */}
                <Col span={24}>
                    <Row gutter={[16, 16]}>
                        {performanceMetrics.map((metric, index) => {
                            const change = calculateChange(metric.current, metric.previous);
                            const isPositive = change > 0;
                            
                            return (
                                <Col key={index} xs={24} sm={12} lg={8} xl={4}>
                                    <Card>
                                        <Statistic
                                            title={metric.title}
                                            value={metric.current}
                                            suffix={metric.unit}
                                            prefix={metric.icon}
                                            valueStyle={{ color: metric.color }}
                                        />
                                        <div style={{ marginTop: 8 }}>
                                            <Space>
                                                {isPositive ? (
                                                    <RiseOutlined style={{ color: '#52c41a' }} />
                                                ) : (
                                                    <FallOutlined style={{ color: '#ff4d4f' }} />
                                                )}
                                                <Text 
                                                    type={isPositive ? 'success' : 'danger'}
                                                    style={{ fontSize: 12 }}
                                                >
                                                    {Math.abs(change).toFixed(1)}%
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    so với kỳ trước
                                                </Text>
                                            </Space>
                                        </div>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                </Col>

                {/* Main Content */}
                <Col span={24}>
                    <Tabs defaultActiveKey="trends">
                        {/* Performance Trends */}
                        <TabPane 
                            tab={
                                <span>
                                    <RiseOutlined />
                                    Xu hướng hiệu suất
                                </span>
                            } 
                            key="trends"
                        >
                            <Row gutter={[24, 24]}>
                                {/* Sales Trend Chart */}
                                <Col xs={24} lg={12}>
                                    <Card title="Xu hướng doanh số">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <LineChart data={performanceData?.individual.dailyData || []}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <RechartsTooltip 
                                                    formatter={(value) => [value.toLocaleString() + ' đ', 'Doanh số']}
                                                />
                                                <Line 
                                                    type="monotone" 
                                                    dataKey="sales" 
                                                    stroke="#1890ff" 
                                                    strokeWidth={2}
                                                    dot={{ fill: '#1890ff' }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>

                                {/* Transactions Chart */}
                                <Col xs={24} lg={12}>
                                    <Card title="Số giao dịch">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={performanceData?.individual.dailyData || []}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="date" />
                                                <YAxis />
                                                <RechartsTooltip />
                                                <Bar dataKey="transactions" fill="#52c41a" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>

                                {/* Skills Radar Chart */}
                                <Col xs={24} lg={12}>
                                    <Card title="Biểu đồ kỹ năng">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <RadarChart data={performanceData?.individual.skillsRadar || []}>
                                                <PolarGrid />
                                                <PolarAngleAxis dataKey="skill" />
                                                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                                                <Radar
                                                    name="Điểm số"
                                                    dataKey="score"
                                                    stroke="#1890ff"
                                                    fill="#1890ff"
                                                    fillOpacity={0.3}
                                                />
                                            </RadarChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>

                                {/* Performance Distribution */}
                                <Col xs={24} lg={12}>
                                    <Card title="Phân bổ hiệu suất">
                                        <ResponsiveContainer width="100%" height={300}>
                                            <PieChart>
                                                <Pie
                                                    data={[
                                                        { name: 'Xuất sắc', value: 25, color: '#52c41a' },
                                                        { name: 'Tốt', value: 45, color: '#1890ff' },
                                                        { name: 'Trung bình', value: 20, color: '#faad14' },
                                                        { name: 'Cần cải thiện', value: 10, color: '#ff4d4f' }
                                                    ]}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={80}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {[
                                                        { name: 'Xuất sắc', value: 25, color: '#52c41a' },
                                                        { name: 'Tốt', value: 45, color: '#1890ff' },
                                                        { name: 'Trung bình', value: 20, color: '#faad14' },
                                                        { name: 'Cần cải thiện', value: 10, color: '#ff4d4f' }
                                                    ].map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Card>
                                </Col>
                            </Row>
                        </TabPane>

                        {/* Goals Tracking */}
                        <TabPane 
                            tab={
                                <span>
                                    <TargetOutlined />
                                    Mục tiêu ({goals.filter(g => g.status === 'active').length})
                                </span>
                            } 
                            key="goals"
                        >
                            <Row gutter={[16, 16]}>
                                {goals.map(goal => {
                                    const progressPercent = (goal.current / goal.target) * 100;
                                    const statusColor = getGoalStatusColor(goal.current, goal.target);
                                    const isCompleted = progressPercent >= 100;
                                    const timeLeft = new Date(goal.deadline) - new Date();
                                    const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

                                    return (
                                        <Col key={goal.id} xs={24} sm={12} lg={6}>
                                            <Card
                                                title={
                                                    <Space>
                                                        <Tag color={getPriorityColor(goal.priority)}>
                                                            {goal.priority.toUpperCase()}
                                                        </Tag>
                                                        {goal.title}
                                                    </Space>
                                                }
                                                extra={
                                                    isCompleted ? (
                                                        <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                                    ) : (
                                                        <ClockCircleOutlined style={{ color: '#faad14' }} />
                                                    )
                                                }
                                                style={{
                                                    borderLeft: `4px solid ${statusColor}`
                                                }}
                                            >
                                                <Space direction="vertical" style={{ width: '100%' }}>
                                                    <div>
                                                        <Row justify="space-between">
                                                            <Text strong>Tiến độ:</Text>
                                                            <Text>
                                                                {goal.current.toLocaleString()}/{goal.target.toLocaleString()} {goal.unit}
                                                            </Text>
                                                        </Row>
                                                        <Progress
                                                            percent={Math.min(progressPercent, 100)}
                                                            strokeColor={statusColor}
                                                            size="small"
                                                            style={{ marginTop: 4 }}
                                                        />
                                                    </div>
                                                    
                                                    <Row justify="space-between" align="middle">
                                                        <Space>
                                                            <CalendarOutlined />
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                {daysLeft > 0 ? `Còn ${daysLeft} ngày` : 'Đã hết hạn'}
                                                            </Text>
                                                        </Space>
                                                        
                                                        {isCompleted && (
                                                            <Tag color="success">Hoàn thành</Tag>
                                                        )}
                                                    </Row>
                                                </Space>
                                            </Card>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </TabPane>

                        {/* Team Comparison */}
                        {comparisonMode === 'team' && (
                            <TabPane 
                                tab={
                                    <span>
                                        <TeamOutlined />
                                        So sánh nhóm
                                    </span>
                                } 
                                key="team"
                            >
                                <Row gutter={[24, 24]}>
                                    {/* Team Overview */}
                                    <Col span={24}>
                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} sm={8}>
                                                <Card>
                                                    <Statistic
                                                        title="Xếp hạng nhóm"
                                                        value={performanceData?.team.ranking}
                                                        suffix={`/ ${performanceData?.team.totalMembers}`}
                                                        prefix={<TrophyOutlined />}
                                                        valueStyle={{ color: token.colorPrimary }}
                                                    />
                                                </Card>
                                            </Col>
                                            <Col xs={24} sm={8}>
                                                <Card>
                                                    <Statistic
                                                        title="Doanh số nhóm"
                                                        value={performanceData?.team.teamSales}
                                                        suffix="đ"
                                                        prefix={<DollarOutlined />}
                                                        valueStyle={{ color: token.colorSuccess }}
                                                    />
                                                </Card>
                                            </Col>
                                            <Col xs={24} sm={8}>
                                                <Card>
                                                    <div>
                                                        <Text type="secondary">Target nhóm</Text>
                                                        <div style={{ marginTop: 8 }}>
                                                            <Progress
                                                                percent={
                                                                    (performanceData?.team.teamSales / 
                                                                     performanceData?.team.teamTarget) * 100
                                                                }
                                                                format={(percent) => 
                                                                    `${percent?.toFixed(1)}%`
                                                                }
                                                            />
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                {performanceData?.team.teamTarget.toLocaleString()} đ
                                                            </Text>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Col>
                                        </Row>
                                    </Col>

                                    {/* Team Members Table */}
                                    <Col span={24}>
                                        <Card title="Bảng xếp hạng nhóm">
                                            <Table
                                                dataSource={performanceData?.team.members || []}
                                                columns={teamColumns}
                                                pagination={false}
                                                size="small"
                                                rowKey="id"
                                                rowClassName={(record) => 
                                                    record.name === user?.fullName ? 'ant-table-row-selected' : ''
                                                }
                                            />
                                        </Card>
                                    </Col>
                                </Row>
                            </TabPane>
                        )}
                    </Tabs>
                </Col>
            </Row>
        </div>
    );
};

export default PerformanceDashboard;