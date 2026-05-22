import { useEffect, useRef, useCallback, useState } from 'react';

interface ChatMessage {
  id: string;
  type: 'chat_message';
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: string;
  payload: {
    text: string;
    replyTo?: string;
    fileUrl?: string;
    fileName?: string;
    readBy?: string[];
    reactions?: Array<{ emoji: string; users: string[] }>;
    edited?: boolean;
  };
}

interface TypingEvent {
  type: 'typing';
  roomId: string;
  senderId: string;
  senderName: string;
  payload: { isTyping: boolean; userId: string; userName: string };
  timestamp: string;
}

interface ReadReceipt {
  type: 'read_receipt';
  roomId: string;
  senderId: string;
  payload: { messageId: string; readBy: string[] };
  timestamp: string;
}

interface PresenceEvent {
  type: 'presence';
  roomId: string;
  senderId: string;
  senderName: string;
  payload: { event: 'join' | 'leave'; userId: string; userName: string };
  timestamp: string;
}

export type WsEvent = ChatMessage | TypingEvent | ReadReceipt | PresenceEvent;

export function useWebSocket(userId: string, userName: string, roomId: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [participants, setParticipants] = useState<Array<{ userId: string; userName: string }>>([]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}&roomId=${encodeURIComponent(roomId)}`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WsEvent | { type: string; payload: Record<string, unknown> };

        switch (data.type) {
          case 'chat_message':
            setMessages((prev) => [...prev, data as ChatMessage]);
            break;
          case 'history':
            if ('payload' in data && Array.isArray((data as { payload: { messages: ChatMessage[] } }).payload.messages)) {
              setMessages((data as { payload: { messages: ChatMessage[] } }).payload.messages);
            }
            break;
          case 'typing':
            handleTyping(data as TypingEvent);
            break;
          case 'read_receipt':
            handleReadReceipt(data as ReadReceipt);
            break;
          case 'presence':
            handlePresence(data as PresenceEvent);
            break;
          case 'connected':
            if ('payload' in data && Array.isArray((data as { payload: { onlineUsers: string[] } }).payload.onlineUsers)) {
              setOnlineUsers((data as { payload: { onlineUsers: string[] } }).payload.onlineUsers);
            }
            break;
        }
      } catch {
        // Silently handle parse errors
      }
    };

    wsRef.current = ws;

    // Fetch room participants
    fetch(`/api/rooms/${roomId}/participants`)
      .then((r) => r.json())
      .then((data) => setParticipants(data.participants || []))
      .catch(() => {});

    return () => {
      ws.close();
    };
  }, [userId, userName, roomId]);

  const handleTyping = useCallback((event: TypingEvent) => {
    setTypingUsers((prev) => {
      const next = new Map(prev);
      if (event.payload.isTyping) {
        next.set(event.payload.userId, event.payload.userName);
      } else {
        next.delete(event.payload.userId);
      }
      return next;
    });
  }, []);

  const handleReadReceipt = useCallback((event: ReadReceipt) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === event.payload.messageId) {
          return {
            ...msg,
            payload: { ...msg.payload, readBy: event.payload.readBy },
          };
        }
        return msg;
      })
    );
  }, []);

  const handlePresence = useCallback((event: PresenceEvent) => {
    setParticipants((prev) => {
      if (event.payload.event === 'join') {
        const exists = prev.find((p) => p.userId === event.payload.userId);
        if (!exists) return [...prev, { userId: event.payload.userId, userName: event.payload.userName }];
        return prev;
      } else {
        return prev.filter((p) => p.userId !== event.payload.userId);
      }
    });
    setOnlineUsers((prev) => {
      if (event.payload.event === 'join') {
        return prev.includes(event.payload.userId) ? prev : [...prev, event.payload.userId];
      }
      return prev.filter((u) => u !== event.payload.userId);
    });
  }, []);

  const sendMessage = useCallback((text: string, replyTo?: string, fileUrl?: string, fileName?: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        roomId,
        senderId: userId,
        senderName: userName,
        payload: { text, replyTo, fileUrl, fileName },
        timestamp: new Date().toISOString(),
      }));
    }
  }, [roomId, userId, userName]);

  const sendTyping = useCallback((isTyping: boolean) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'typing',
        roomId,
        senderId: userId,
        senderName: userName,
        payload: { isTyping },
        timestamp: new Date().toISOString(),
      }));
    }
  }, [roomId, userId, userName]);

  const sendReadReceipt = useCallback((messageId: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'read_receipt',
        roomId,
        senderId: userId,
        senderName: userName,
        payload: { messageId },
        timestamp: new Date().toISOString(),
      }));
    }
  }, [roomId, userId, userName]);

  const sendReaction = useCallback((messageId: string, emoji: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'reaction',
        roomId,
        senderId: userId,
        senderName: userName,
        payload: { messageId, emoji },
        timestamp: new Date().toISOString(),
      }));
    }
  }, [roomId, userId, userName]);

  return {
    connected,
    messages,
    typingUsers,
    onlineUsers,
    participants,
    sendMessage,
    sendTyping,
    sendReadReceipt,
    sendReaction,
  };
}
