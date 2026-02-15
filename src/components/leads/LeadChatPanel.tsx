// FILE: src/components/leads/LeadChatPanel.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Send, Phone, Mail, MessageCircle } from "lucide-react";
import type { LeadMessage } from "@/types/leads/message";
import {
  getMessagesByLeadId,
  sendMessage,
  markMessagesAsRead,
} from "@/data/mockLeadMessages";

interface LeadChatPanelProps {
  leadId: string;
  leadName: string;
  leadPhone: string;
  leadEmail: string;
  currentUserName?: string;
  onMessagesRead?: () => void;
}

export default function LeadChatPanel({
  leadId,
  leadName,
  leadPhone,
  leadEmail,
  currentUserName = "Sarah Johnson",
  onMessagesRead,
}: LeadChatPanelProps) {
  const t = useTranslations("admissions.leads.chat");
  const [messages, setMessages] = useState<LeadMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load messages
    const loadedMessages = getMessagesByLeadId(leadId);
    setMessages(loadedMessages);

    // Mark messages as read
    markMessagesAsRead(leadId);

    // Notify parent component
    if (onMessagesRead) {
      onMessagesRead();
    }

    // Scroll to bottom
    scrollToBottom();
  }, [leadId, onMessagesRead]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);

    try {
      const sentMessage = sendMessage(
        leadId,
        newMessage.trim(),
        "U001",
        currentUserName,
        "staff",
      );

      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInHours < 48) {
      return `Yesterday ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#036b80] rounded-full flex items-center justify-center text-white font-semibold">
            {leadName.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{leadName}</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {leadPhone}
              </span>
              {leadEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {leadEmail}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500 text-sm">{t("no_messages")}</p>
            <p className="text-gray-400 text-xs mt-1">
              {t("start_conversation")}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderType === "staff" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.senderType === "staff"
                    ? "bg-[#036b80] text-white"
                    : "bg-gray-100 text-gray-900"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium opacity-90">
                    {message.senderName}
                  </span>
                  <span
                    className={`text-xs opacity-70 ${
                      message.senderType === "staff"
                        ? "text-white"
                        : "text-gray-500"
                    }`}
                  >
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={t("type_message")}
            rows={2}
            disabled={isSending}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#036b80] focus:border-transparent resize-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
            className="px-4 py-2 bg-[#036b80] hover:bg-[#024d5c] text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{t("send")}</span>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">{t("press_enter")}</p>
      </div>
    </div>
  );
}
