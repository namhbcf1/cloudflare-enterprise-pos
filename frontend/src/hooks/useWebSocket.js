// frontend/src/hooks/useWebSocket.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { message } from 'antd';

const useWebSocket = (endpoint, options = {}) => {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    protocols = []
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('disconnected'); // disconnected, connecting, connected, reconnecting

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const messageQueueRef = useRef([]);

  // Get WebSocket URL
  const getWebSocketUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NODE_ENV === 'development' 
      ? 'localhost:8787' 
      : window.location.host;
    return `${protocol}//${host}/ws${endpoint}`;
  }, [endpoint]);

  // Send message
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      const messageString = typeof message === 'string' ? message : JSON.stringify(message);
      wsRef.current.send(messageString);
      return true;
    } else {
      // Queue message if not connected
      messageQueueRef.current.push(message);
      console.warn('WebSocket not connected. Message queued.');
      return false;
    }
  }, []);

  // Process queued messages
  const processQueuedMessages = useCallback(() => {
    while (messageQueueRef.current.length > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
      const queuedMessage = messageQueueRef.current.shift();
      const messageString = typeof queuedMessage === 'string' ? queuedMessage : JSON.stringify(queuedMessage);
      wsRef.current.send(messageString);
    }
  }, []);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    setConnectionState('connecting');
    setError(null);

    try {
      const wsUrl = getWebSocketUrl();
      wsRef.current = new WebSocket(wsUrl, protocols);

      wsRef.current.onopen = (event) => {
        console.log('WebSocket connected:', endpoint);
        setIsConnected(true);
        setConnectionState('connected');
        setError(null);
        reconnectCountRef.current = 0;
        
        // Process any queued messages
        processQueuedMessages();
        
        // Send authentication if available
        const token = localStorage.getItem('auth_token');
        if (token) {
          sendMessage({
            type: 'auth',
            token: token
          });
        }

        onConnect?.(event);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          
          // Handle different message types
          switch (parsedData.type) {
            case 'ping':
              // Respond to ping with pong
              sendMessage({ type: 'pong', timestamp: Date.now() });
              break;
              
            case 'auth_success':
              console.log('WebSocket authenticated successfully');
              break;
              
            case 'auth_error':
              console.error('WebSocket authentication failed');
              setError('Authentication failed');
              break;
              
            case 'notification':
              // Show notification
              if (parsedData.level === 'success') {
                message.success(parsedData.message);
              } else if (parsedData.level === 'error') {
                message.error(parsedData.message);
              } else if (parsedData.level === 'warning') {
                message.warning(parsedData.message);
              } else {
                message.info(parsedData.message);
              }
              break;
              
            default:
              // Update data state with received data
              setData(parsedData);
              break;
          }

          onMessage?.(parsedData, event);
        } catch (parseError) {
          console.warn('Failed to parse WebSocket message:', event.data);
          setData(event.data);
          onMessage?.(event.data, event);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', endpoint, event.code, event.reason);
        setIsConnected(false);
        setConnectionState('disconnected');
        
        onDisconnect?.(event);

        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectCountRef.current < reconnectAttempts) {
          setConnectionState('reconnecting');
          reconnectCountRef.current += 1;
          
          console.log(`Attempting to reconnect (${reconnectCountRef.current}/${reconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval * Math.pow(1.5, reconnectCountRef.current - 1)); // Exponential backoff
        }
      };

      wsRef.current.onerror = (event) => {
        console.error('WebSocket error:', endpoint, event);
        const errorMessage = `WebSocket connection error: ${endpoint}`;
        setError(errorMessage);
        onError?.(errorMessage, event);
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError(err.message);
      setConnectionState('disconnected');
    }
  }, [endpoint, protocols, onConnect, onDisconnect, onError, onMessage, getWebSocketUrl, processQueuedMessages, sendMessage, reconnectAttempts, reconnectInterval]);

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
    setConnectionState('disconnected');
    reconnectCountRef.current = 0;
  }, []);

  // Reconnect manually
  const reconnect = useCallback(() => {
    disconnect();
    setTimeout(() => {
      reconnectCountRef.current = 0;
      connect();
    }, 100);
  }, [disconnect, connect]);

  // Subscribe to specific event type
  const subscribe = useCallback((eventType, handler) => {
    const subscription = {
      eventType,
      handler,
      id: Date.now() + Math.random()
    };

    sendMessage({
      type: 'subscribe',
      eventType: eventType
    });

    return () => {
      sendMessage({
        type: 'unsubscribe',
        eventType: eventType
      });
    };
  }, [sendMessage]);

  // Send heartbeat/ping
  const ping = useCallback(() => {
    sendMessage({
      type: 'ping',
      timestamp: Date.now()
    });
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Heartbeat mechanism
  useEffect(() => {
    if (!isConnected) return;

    const heartbeatInterval = setInterval(() => {
      ping();
    }, 30000); // Send ping every 30 seconds

    return () => clearInterval(heartbeatInterval);
  }, [isConnected, ping]);

  // Handle page visibility change (reconnect when page becomes visible)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !isConnected && autoConnect) {
        reconnect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isConnected, autoConnect, reconnect]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (!isConnected && autoConnect) {
        reconnect();
      }
    };

    const handleOffline = () => {
      setError('Network offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isConnected, autoConnect, reconnect]);

  return {
    // Connection state
    isConnected,
    connectionState,
    error,
    
    // Data
    data,
    
    // Methods
    sendMessage,
    connect,
    disconnect,
    reconnect,
    subscribe,
    ping,
    
    // Stats
    reconnectAttempts: reconnectCountRef.current,
    queuedMessages: messageQueueRef.current.length
  };
};

export default useWebSocket;