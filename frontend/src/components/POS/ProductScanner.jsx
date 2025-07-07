/**
 * Product Scanner Component
 * Camera-based barcode scanning with manual search fallback
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Modal,
    Button,
    Space,
    Typography,
    Alert,
    Card,
    Input,
    List,
    Avatar,
    Badge,
    Switch,
    Row,
    Col,
    Spin,
    Result,
    Tag,
    theme
} from 'antd';
import {
    ScanOutlined,
    CameraOutlined,
    SearchOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined,
    ReloadOutlined,
    SettingOutlined,
    BarcodeOutlined,
    CloseOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Search } = Input;
const { useToken } = theme;

const ProductScanner = ({ 
    visible, 
    onClose, 
    onProductFound, 
    onProductNotFound,
    searchProducts,
    isLoading = false 
}) => {
    const { token } = useToken();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const scanIntervalRef = useRef(null);

    // Scanner state
    const [isScanning, setIsScanning] = useState(false);
    const [cameraEnabled, setCameraEnabled] = useState(false);
    const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'manual'
    const [manualBarcode, setManualBarcode] = useState('');
    const [lastScannedCode, setLastScannedCode] = useState('');
    const [scanHistory, setScanHistory] = useState([]);
    const [cameraError, setCameraError] = useState(null);
    const [foundProducts, setFoundProducts] = useState([]);

    // Scanner settings
    const [scanSettings, setScanSettings] = useState({
        continuous: true,
        beepEnabled: true,
        flashEnabled: false,
        scanInterval: 500
    });

    // Initialize camera when modal opens
    useEffect(() => {
        if (visible && scanMode === 'camera') {
            initializeCamera();
        } else {
            stopScanning();
        }

        return () => {
            stopScanning();
        };
    }, [visible, scanMode]);

    // Initialize camera stream
    const initializeCamera = async () => {
        try {
            setCameraError(null);
            
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('Camera not supported on this device');
            }

            const constraints = {
                video: {
                    facingMode: 'environment', // Use back camera if available
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    setCameraEnabled(true);
                    if (scanSettings.continuous) {
                        startScanning();
                    }
                };
            }
        } catch (error) {
            console.error('Camera initialization error:', error);
            setCameraError(error.message);
            setScanMode('manual'); // Fallback to manual mode
        }
    };

    // Start barcode scanning
    const startScanning = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || isScanning) return;

        setIsScanning(true);
        
        scanIntervalRef.current = setInterval(() => {
            try {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                if (video.readyState === video.HAVE_ENOUGH_DATA) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    context.drawImage(video, 0, 0);

                    // Get image data for barcode detection
                    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
                    
                    // Simulate barcode detection (replace with actual library like ZXing)
                    const detectedCode = simulateBarcodeDetection(imageData);
                    
                    if (detectedCode && detectedCode !== lastScannedCode) {
                        handleBarcodeDetected(detectedCode);
                    }
                }
            } catch (error) {
                console.error('Scanning error:', error);
            }
        }, scanSettings.scanInterval);
    }, [isScanning, lastScannedCode, scanSettings.scanInterval]);

    // Stop scanning
    const stopScanning = useCallback(() => {
        setIsScanning(false);
        
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        setCameraEnabled(false);
    }, []);

    // Simulate barcode detection (replace with actual barcode library)
    const simulateBarcodeDetection = (imageData) => {
        // This is a placeholder - in production, use a library like:
        // - @zxing/library for web-based scanning
        // - quagga2 for JavaScript barcode scanning
        // - ZBar for native scanning
        
        // For demo purposes, we'll simulate finding specific barcodes
        const mockBarcodes = [
            '8934673123456', // Coca Cola
            '8934673123457', // Sandwich
            '8934673123458', // Lavie
            '1234567890123', // Generic barcode
            '9876543210987'  // Another test barcode
        ];

        // Simulate random detection with low probability
        if (Math.random() < 0.1) { // 10% chance per scan
            return mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)];
        }
        
        return null;
    };

    // Handle detected barcode
    const handleBarcodeDetected = async (code) => {
        setLastScannedCode(code);
        
        // Add to scan history
        setScanHistory(prev => [{
            code,
            timestamp: new Date().toISOString(),
            id: Date.now()
        }, ...prev.slice(0, 9)]); // Keep last 10 scans

        // Play beep sound if enabled
        if (scanSettings.beepEnabled) {
            playBeepSound();
        }

        try {
            // Search for product
            const products = await searchProducts(code);
            
            if (products && products.length > 0) {
                setFoundProducts(products);
                onProductFound(products[0], code);
                
                if (!scanSettings.continuous) {
                    stopScanning();
                }
            } else {
                onProductNotFound(code);
            }
        } catch (error) {
            console.error('Product search error:', error);
            onProductNotFound(code);
        }
    };

    // Handle manual barcode entry
    const handleManualScan = async () => {
        if (!manualBarcode.trim()) return;

        await handleBarcodeDetected(manualBarcode.trim());
        setManualBarcode('');
    };

    // Play beep sound
    const playBeepSound = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.value = 0.1;
            
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
        } catch (error) {
            console.log('Audio playback not supported');
        }
    };

    // Toggle flash (if supported)
    const toggleFlash = async () => {
        try {
            if (streamRef.current) {
                const track = streamRef.current.getVideoTracks()[0];
                const capabilities = track.getCapabilities();
                
                if (capabilities.torch) {
                    await track.applyConstraints({
                        advanced: [{ torch: !scanSettings.flashEnabled }]
                    });
                    
                    setScanSettings(prev => ({
                        ...prev,
                        flashEnabled: !prev.flashEnabled
                    }));
                }
            }
        } catch (error) {
            console.error('Flash toggle error:', error);
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <ScanOutlined />
                    <span>Quét mã vạch sản phẩm</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            width={800}
            footer={null}
            destroyOnClose
        >
            <Space direction="vertical" style={{ width: '100%' }} size="large">
                {/* Mode Selector */}
                <Card size="small">
                    <Row justify="space-between" align="middle">
                        <Col>
                            <Space>
                                <Text strong>Chế độ quét:</Text>
                                <Button.Group>
                                    <Button
                                        type={scanMode === 'camera' ? 'primary' : 'default'}
                                        icon={<CameraOutlined />}
                                        onClick={() => setScanMode('camera')}
                                    >
                                        Camera
                                    </Button>
                                    <Button
                                        type={scanMode === 'manual' ? 'primary' : 'default'}
                                        icon={<BarcodeOutlined />}
                                        onClick={() => setScanMode('manual')}
                                    >
                                        Nhập tay
                                    </Button>
                                </Button.Group>
                            </Space>
                        </Col>
                        <Col>
                            <Space>
                                <Text type="secondary">Quét liên tục:</Text>
                                <Switch
                                    checked={scanSettings.continuous}
                                    onChange={(checked) => setScanSettings(prev => ({
                                        ...prev,
                                        continuous: checked
                                    }))}
                                />
                            </Space>
                        </Col>
                    </Row>
                </Card>

                {/* Camera Scanner */}
                {scanMode === 'camera' && (
                    <Card
                        title={
                            <Space>
                                <CameraOutlined />
                                <span>Camera Scanner</span>
                                <Badge status={isScanning ? 'processing' : 'default'} />
                            </Space>
                        }
                        extra={
                            <Space>
                                {cameraEnabled && (
                                    <>
                                        <Button
                                            type={scanSettings.flashEnabled ? 'primary' : 'default'}
                                            size="small"
                                            onClick={toggleFlash}
                                        >
                                            Flash
                                        </Button>
                                        <Button
                                            type={isScanning ? 'danger' : 'primary'}
                                            size="small"
                                            onClick={isScanning ? stopScanning : startScanning}
                                        >
                                            {isScanning ? 'Dừng' : 'Bắt đầu'}
                                        </Button>
                                    </>
                                )}
                                <Button
                                    size="small"
                                    icon={<ReloadOutlined />}
                                    onClick={initializeCamera}
                                    loading={!cameraEnabled && !cameraError}
                                >
                                    Khởi động lại
                                </Button>
                            </Space>
                        }
                    >
                        {cameraError ? (
                            <Result
                                status="error"
                                title="Không thể truy cập camera"
                                subTitle={cameraError}
                                extra={
                                    <Space>
                                        <Button 
                                            type="primary" 
                                            onClick={initializeCamera}
                                        >
                                            Thử lại
                                        </Button>
                                        <Button onClick={() => setScanMode('manual')}>
                                            Chuyển sang nhập tay
                                        </Button>
                                    </Space>
                                }
                            />
                        ) : (
                            <div style={{ position: 'relative', textAlign: 'center' }}>
                                <video
                                    ref={videoRef}
                                    style={{
                                        width: '100%',
                                        maxWidth: 500,
                                        height: 300,
                                        backgroundColor: '#000',
                                        borderRadius: token.borderRadius
                                    }}
                                    autoPlay
                                    playsInline
                                    muted
                                />
                                <canvas
                                    ref={canvasRef}
                                    style={{ display: 'none' }}
                                />
                                
                                {/* Scanning overlay */}
                                {isScanning && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: 200,
                                            height: 100,
                                            border: '2px solid #1890ff',
                                            borderRadius: 8,
                                            pointerEvents: 'none'
                                        }}
                                    >
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: -2,
                                                left: -2,
                                                right: -2,
                                                height: 2,
                                                background: '#1890ff',
                                                animation: 'scan-line 2s linear infinite'
                                            }}
                                        />
                                    </div>
                                )}
                                
                                {!cameraEnabled && !cameraError && (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            color: 'white'
                                        }}
                                    >
                                        <Spin size="large" />
                                        <div style={{ marginTop: 16 }}>
                                            <Text style={{ color: 'white' }}>
                                                Đang khởi động camera...
                                            </Text>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                )}

                {/* Manual Input */}
                {scanMode === 'manual' && (
                    <Card
                        title={
                            <Space>
                                <BarcodeOutlined />
                                <span>Nhập mã vạch</span>
                            </Space>
                        }
                    >
                        <Space.Compact style={{ width: '100%' }}>
                            <Input
                                placeholder="Nhập mã vạch sản phẩm..."
                                value={manualBarcode}
                                onChange={(e) => setManualBarcode(e.target.value)}
                                onPressEnter={handleManualScan}
                                size="large"
                                prefix={<BarcodeOutlined />}
                            />
                            <Button
                                type="primary"
                                size="large"
                                icon={<SearchOutlined />}
                                onClick={handleManualScan}
                                loading={isLoading}
                            >
                                Tìm kiếm
                            </Button>
                        </Space.Compact>
                    </Card>
                )}

                {/* Found Products */}
                {foundProducts.length > 0 && (
                    <Card
                        title={
                            <Space>
                                <CheckCircleOutlined style={{ color: token.colorSuccess }} />
                                <span>Sản phẩm tìm thấy</span>
                            </Space>
                        }
                    >
                        <List
                            dataSource={foundProducts}
                            renderItem={(product) => (
                                <List.Item
                                    actions={[
                                        <Button
                                            type="primary"
                                            onClick={() => onProductFound(product, lastScannedCode)}
                                        >
                                            Thêm vào giỏ
                                        </Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={
                                            <Avatar 
                                                src={product.image} 
                                                icon={<ScanOutlined />}
                                                size="large"
                                            />
                                        }
                                        title={product.name}
                                        description={
                                            <Space direction="vertical" size={0}>
                                                <Text type="secondary">
                                                    Mã: {product.id} • Mã vạch: {product.barcode}
                                                </Text>
                                                <Space>
                                                    <Text strong style={{ color: token.colorPrimary }}>
                                                        {product.price?.toLocaleString('vi-VN')} đ
                                                    </Text>
                                                    <Tag color="blue">
                                                        Kho: {product.stock}
                                                    </Tag>
                                                </Space>
                                            </Space>
                                        }
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                )}

                {/* Scan History */}
                {scanHistory.length > 0 && (
                    <Card
                        title="Lịch sử quét"
                        size="small"
                        extra={
                            <Button
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={() => setScanHistory([])}
                            >
                                Xóa
                            </Button>
                        }
                    >
                        <List
                            size="small"
                            dataSource={scanHistory}
                            renderItem={(scan) => (
                                <List.Item>
                                    <Space>
                                        <BarcodeOutlined />
                                        <Text code>{scan.code}</Text>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {new Date(scan.timestamp).toLocaleTimeString('vi-VN')}
                                        </Text>
                                    </Space>
                                </List.Item>
                            )}
                        />
                    </Card>
                )}

                {/* Settings */}
                <Card title="Cài đặt" size="small">
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Row justify="space-between">
                            <Text>Âm thanh báo hiệu:</Text>
                            <Switch
                                checked={scanSettings.beepEnabled}
                                onChange={(checked) => setScanSettings(prev => ({
                                    ...prev,
                                    beepEnabled: checked
                                }))}
                            />
                        </Row>
                        <Row justify="space-between">
                            <Text>Quét liên tục:</Text>
                            <Switch
                                checked={scanSettings.continuous}
                                onChange={(checked) => setScanSettings(prev => ({
                                    ...prev,
                                    continuous: checked
                                }))}
                            />
                        </Row>
                    </Space>
                </Card>
            </Space>

            <style jsx>{`
                @keyframes scan-line {
                    0% { top: -2px; }
                    100% { top: 100%; }
                }
            `}</style>
        </Modal>
    );
};

export default ProductScanner;