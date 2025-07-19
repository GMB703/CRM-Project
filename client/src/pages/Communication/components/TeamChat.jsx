import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { PaperAirplaneIcon, PaperClipIcon } from "@heroicons/react/24/outline";
import { Spinner } from "../../../components/UI/Spinner";

const TeamChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const user = useSelector((state) => state.auth?.user);
  const currentOrganization = useSelector(
    (state) => state.organization?.currentOrganization,
  );

  // Sample messages for demo
  useEffect(() => {
    setIsLoading(true);
    // Simulate loading messages
    setTimeout(() => {
      setMessages([
        {
          id: 1,
          content:
            "Welcome to the team chat! This is where you can communicate with your team members.",
          userId: "system",
          user: { name: "System", email: "system@crm.com" },
          type: "TEXT",
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          content: "Great! The CRM system is looking good.",
          userId: user?.id || "demo-user",
          user: {
            name: user?.name || "Demo User",
            email: user?.email || "demo@example.com",
          },
          type: "TEXT",
          createdAt: new Date().toISOString(),
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      id: Date.now(),
      content: newMessage,
      userId: user?.id || "demo-user",
      user: {
        name: user?.name || "Demo User",
        email: user?.email || "demo@example.com",
      },
      type: "TEXT",
      createdAt: new Date().toISOString(),
    };

    try {
      // Add message to local state immediately for demo
      setMessages((prev) => [...prev, messageData]);
      setNewMessage("");

      // In a real app, this would send to the server
      // const response = await fetch('/api/chat/messages', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   },
      //   body: JSON.stringify(messageData),
      // });
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const messageData = {
        id: Date.now(),
        content: `Shared file: ${file.name}`,
        userId: user?.id || "demo-user",
        user: {
          name: user?.name || "Demo User",
          email: user?.email || "demo@example.com",
        },
        type: "FILE",
        fileName: file.name,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, messageData]);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload file. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => setError(null)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">Team Chat</h3>
        <p className="text-sm text-gray-600">
          Organization: {currentOrganization?.name || "Demo Organization"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.userId === (user?.id || "demo-user")
                ? "justify-end"
                : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.userId === (user?.id || "demo-user")
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <div className="text-sm font-medium mb-1">
                {message.user?.name || "Unknown User"}
              </div>
              {message.type === "TEXT" ? (
                <p className="whitespace-pre-wrap">{message.content}</p>
              ) : (
                <div>
                  <p className="text-sm opacity-75">
                    📎 {message.fileName || "File attachment"}
                  </p>
                  <p>{message.content}</p>
                </div>
              )}
              <div className="text-xs mt-1 opacity-75">
                {new Date(message.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-200"
            title="Attach file"
          >
            <PaperClipIcon className="h-5 w-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="p-2 text-blue-600 hover:text-blue-700 disabled:opacity-50 rounded-md hover:bg-blue-50"
            title="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export { TeamChat };
