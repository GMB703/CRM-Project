import { io } from "socket.io-client";

export class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.currentOrganizationId = null;
    this.token = null;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
  }

  /**
   * Initialize socket connection with authentication and organization context
   * @param {string} token - JWT token with organization context
   * @param {string} organizationId - Current organization ID
   */
  connect(token, organizationId) {
    // If already connected to the same organization, return existing socket
    if (
      this.socket &&
      this.isConnected &&
      this.currentOrganizationId === organizationId
    ) {
      return this.socket;
    }

    // Disconnect existing socket if switching organizations
    if (this.socket && this.currentOrganizationId !== organizationId) {
      console.log("🔄 Switching organizations, disconnecting current socket");
      this.disconnect();
    }

    this.token = token;
    this.currentOrganizationId = organizationId;
    this.isConnecting = true;

    const serverUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    console.log(
      `🔌 Connecting to Socket.IO server: ${serverUrl} (Org: ${organizationId})`,
    );

    this.socket = io(serverUrl, {
      auth: {
        token: token,
      },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
      transports: ["websocket", "polling"],
    });

    this.setupEventListeners();
    return this.socket;
  }

  /**
   * Setup core socket event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on("connect", () => {
      console.log("✅ Socket connected successfully");
      this.isConnected = true;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.emit("socket:connected", {
        organizationId: this.currentOrganizationId,
      });
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      this.isConnected = false;
      this.isConnecting = false;
      this.emit("socket:error", {
        error: error.message,
        organizationId: this.currentOrganizationId,
      });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔌 Socket disconnected:", reason);
      this.isConnected = false;
      this.isConnecting = false;
      this.emit("socket:disconnected", {
        reason,
        organizationId: this.currentOrganizationId,
      });
    });

    // Organization-specific events
    this.socket.on("org:message", (data) => {
      console.log("📢 Organization message received:", data);
      this.emit("org:message", data);
    });

    this.socket.on("private:message", (data) => {
      console.log("💬 Private message received:", data);
      this.emit("private:message", data);
    });

    this.socket.on("private:message:sent", (data) => {
      console.log("✅ Private message sent confirmation:", data);
      this.emit("private:message:sent", data);
    });

    this.socket.on("org:update", (data) => {
      console.log("📊 Organization update received:", data);
      this.emit("org:update", data);
    });

    // User connection events
    this.socket.on("user:connected", (data) => {
      console.log("👤 User connected to organization:", data);
      this.emit("user:connected", data);
    });

    this.socket.on("user:disconnected", (data) => {
      console.log("👤 User disconnected from organization:", data);
      this.emit("user:disconnected", data);
    });

    // Room events
    this.socket.on("room:joined", (data) => {
      console.log("👥 Joined room:", data);
      this.emit("room:joined", data);
    });

    this.socket.on("room:left", (data) => {
      console.log("👋 Left room:", data);
      this.emit("room:left", data);
    });

    // Error handling
    this.socket.on("error", (data) => {
      console.error("⚠️ Socket error:", data);
      this.emit("socket:error", data);
    });
  }

  /**
   * Disconnect from socket server
   */
  disconnect() {
    if (this.socket) {
      console.log("🔌 Disconnecting socket");
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.currentOrganizationId = null;
    this.token = null;
  }

  /**
   * Send organization-wide message
   * @param {string} message - Message content
   * @param {Object} metadata - Additional message metadata
   */
  sendOrgMessage(message, metadata = {}) {
    if (!this.isConnected || !this.socket) {
      console.warn("⚠️ Cannot send org message: Socket not connected");
      return false;
    }

    const messageData = {
      message,
      ...metadata,
      timestamp: new Date().toISOString(),
    };

    console.log("📢 Sending organization message:", messageData);
    this.socket.emit("org:message", messageData);
    return true;
  }

  /**
   * Send private message to specific user
   * @param {string} recipientId - User ID of recipient
   * @param {string} message - Message content
   * @param {Object} metadata - Additional message metadata
   */
  sendPrivateMessage(recipientId, message, metadata = {}) {
    if (!this.isConnected || !this.socket) {
      console.warn("⚠️ Cannot send private message: Socket not connected");
      return false;
    }

    if (!recipientId || !message) {
      console.warn(
        "⚠️ Cannot send private message: Missing recipient or message",
      );
      return false;
    }

    const messageData = {
      recipientId,
      message,
      ...metadata,
      timestamp: new Date().toISOString(),
    };

    console.log(`💬 Sending private message to ${recipientId}:`, messageData);
    this.socket.emit("private:message", messageData);
    return true;
  }

  /**
   * Send organization update (for admin users)
   * @param {Object} updateData - Update information
   */
  sendOrgUpdate(updateData) {
    if (!this.isConnected || !this.socket) {
      console.warn("⚠️ Cannot send org update: Socket not connected");
      return false;
    }

    const data = {
      ...updateData,
      timestamp: new Date().toISOString(),
    };

    console.log("📊 Sending organization update:", data);
    this.socket.emit("org:update", data);
    return true;
  }

  /**
   * Join a project/room (with organization context)
   * @param {string} roomId - Room/project ID to join
   */
  joinRoom(roomId) {
    if (!this.isConnected || !this.socket) {
      console.warn("⚠️ Cannot join room: Socket not connected");
      return false;
    }

    console.log(`👥 Joining room: ${roomId}`);
    this.socket.emit("join_room", roomId);
    return true;
  }

  /**
   * Leave a project/room
   * @param {string} roomId - Room/project ID to leave
   */
  leaveRoom(roomId) {
    if (!this.isConnected || !this.socket) {
      console.warn("⚠️ Cannot leave room: Socket not connected");
      return false;
    }

    console.log(`👋 Leaving room: ${roomId}`);
    this.socket.emit("leave_room", roomId);
    return true;
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
   */
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Event callback to remove
   */
  off(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  /**
   * Emit event to local listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      organizationId: this.currentOrganizationId,
      socketId: this.socket?.id || null,
    };
  }

  /**
   * Reconnect with current credentials
   */
  reconnect() {
    if (this.token && this.currentOrganizationId) {
      this.connect(this.token, this.currentOrganizationId);
    }
  }
}

// Create and export a singleton instance
export const socketService = new SocketService();
