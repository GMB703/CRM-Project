import { useEffect, useState, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import socketService from "../services/socket";
import { useOrganization } from "../contexts/OrganizationContext";

/**
 * Custom hook for managing Socket.IO connection with organization context
 * @param {Object} options - Configuration options
 * @param {boolean} options.autoConnect - Automatically connect when token and org are available
 * @param {Array} options.events - Array of events to listen for
 * @returns {Object} Socket utilities and state
 */
export const useSocket = (options = {}) => {
  const { autoConnect = true, events = [] } = options;

  // Get authentication token from Redux store
  const token = useSelector((state) => state.auth?.token);

  // Get current organization context
  const { currentOrganization } = useOrganization();

  // Socket connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [socketId, setSocketId] = useState(null);

  // Event listeners storage
  const eventListeners = useRef(new Map());

  // Connect to socket with current credentials
  const connect = useCallback(() => {
    if (!token || !currentOrganization?.id) {
      console.warn("⚠️ Cannot connect socket: Missing token or organization");
      return false;
    }

    setIsConnecting(true);
    setConnectionError(null);

    try {
      socketService.connect(token, currentOrganization.id);
      return true;
    } catch (error) {
      console.error("Socket connection error:", error);
      setConnectionError(error.message);
      setIsConnecting(false);
      return false;
    }
  }, [token, currentOrganization?.id]);

  // Disconnect from socket
  const disconnect = useCallback(() => {
    socketService.disconnect();
    setIsConnected(false);
    setIsConnecting(false);
    setSocketId(null);
    setConnectionError(null);
  }, []);

  // Send organization message
  const sendOrgMessage = useCallback((message, metadata = {}) => {
    return socketService.sendOrgMessage(message, metadata);
  }, []);

  // Send private message
  const sendPrivateMessage = useCallback(
    (recipientId, message, metadata = {}) => {
      return socketService.sendPrivateMessage(recipientId, message, metadata);
    },
    [],
  );

  // Send organization update
  const sendOrgUpdate = useCallback((updateData) => {
    return socketService.sendOrgUpdate(updateData);
  }, []);

  // Join room
  const joinRoom = useCallback((roomId) => {
    return socketService.joinRoom(roomId);
  }, []);

  // Leave room
  const leaveRoom = useCallback((roomId) => {
    return socketService.leaveRoom(roomId);
  }, []);

  // Add event listener
  const addEventListener = useCallback((event, callback) => {
    socketService.on(event, callback);

    // Store reference for cleanup
    if (!eventListeners.current.has(event)) {
      eventListeners.current.set(event, new Set());
    }
    eventListeners.current.get(event).add(callback);
  }, []);

  // Remove event listener
  const removeEventListener = useCallback((event, callback) => {
    socketService.off(event, callback);

    // Remove from reference storage
    if (eventListeners.current.has(event)) {
      eventListeners.current.get(event).delete(callback);
    }
  }, []);

  // Setup core event listeners
  useEffect(() => {
    const handleConnected = (data) => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      const status = socketService.getStatus();
      setSocketId(status.socketId);
    };

    const handleDisconnected = (data) => {
      setIsConnected(false);
      setIsConnecting(false);
      setSocketId(null);
    };

    const handleError = (data) => {
      setConnectionError(data.error);
      setIsConnecting(false);
      setIsConnected(false);
    };

    // Add core event listeners
    socketService.on("socket:connected", handleConnected);
    socketService.on("socket:disconnected", handleDisconnected);
    socketService.on("socket:error", handleError);

    return () => {
      // Cleanup core event listeners
      socketService.off("socket:connected", handleConnected);
      socketService.off("socket:disconnected", handleDisconnected);
      socketService.off("socket:error", handleError);
    };
  }, []);

  // Setup custom event listeners
  useEffect(() => {
    events.forEach(({ event, callback }) => {
      if (event && callback) {
        addEventListener(event, callback);
      }
    });

    return () => {
      events.forEach(({ event, callback }) => {
        if (event && callback) {
          removeEventListener(event, callback);
        }
      });
    };
  }, [events, addEventListener, removeEventListener]);

  // Auto-connect when credentials are available
  useEffect(() => {
    if (
      autoConnect &&
      token &&
      currentOrganization?.id &&
      !isConnected &&
      !isConnecting
    ) {
      connect();
    }
  }, [
    autoConnect,
    token,
    currentOrganization?.id,
    isConnected,
    isConnecting,
    connect,
  ]);

  // Disconnect when organization changes or token is removed
  useEffect(() => {
    const currentOrgId = socketService.getStatus().organizationId;
    if (
      currentOrgId &&
      currentOrganization?.id &&
      currentOrgId !== currentOrganization.id
    ) {
      // Organization changed, reconnect
      disconnect();
      if (autoConnect && token) {
        setTimeout(() => connect(), 100); // Small delay to ensure cleanup
      }
    } else if (!token || !currentOrganization?.id) {
      // No credentials, disconnect
      disconnect();
    }
  }, [token, currentOrganization?.id, autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Remove all event listeners added by this hook
      eventListeners.current.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          socketService.off(event, callback);
        });
      });
      eventListeners.current.clear();
    };
  }, []);

  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    socketId,
    organizationId: currentOrganization?.id,

    // Connection methods
    connect,
    disconnect,

    // Messaging methods
    sendOrgMessage,
    sendPrivateMessage,
    sendOrgUpdate,

    // Room methods
    joinRoom,
    leaveRoom,

    // Event methods
    addEventListener,
    removeEventListener,

    // Socket service reference
    socket: socketService,
  };
};

/**
 * Hook for listening to specific socket events
 * @param {string} event - Event name to listen for
 * @param {Function} callback - Callback function
 * @param {Array} deps - Dependency array for useCallback
 */
export const useSocketEvent = (event, callback, deps = []) => {
  const { addEventListener, removeEventListener } = useSocket({
    autoConnect: false,
  });

  const memoizedCallback = useCallback(callback, deps);

  useEffect(() => {
    if (event && memoizedCallback) {
      addEventListener(event, memoizedCallback);

      return () => {
        removeEventListener(event, memoizedCallback);
      };
    }
  }, [event, memoizedCallback, addEventListener, removeEventListener]);
};

/**
 * Hook for organization messages
 * @param {Function} onMessage - Callback for organization messages
 * @param {Array} deps - Dependency array
 */
export const useOrgMessages = (onMessage, deps = []) => {
  useSocketEvent("org:message", onMessage, deps);
};

/**
 * Hook for private messages
 * @param {Function} onMessage - Callback for private messages
 * @param {Array} deps - Dependency array
 */
export const usePrivateMessages = (onMessage, deps = []) => {
  useSocketEvent("private:message", onMessage, deps);
};

/**
 * Hook for organization updates
 * @param {Function} onUpdate - Callback for organization updates
 * @param {Array} deps - Dependency array
 */
export const useOrgUpdates = (onUpdate, deps = []) => {
  useSocketEvent("org:update", onUpdate, deps);
};
