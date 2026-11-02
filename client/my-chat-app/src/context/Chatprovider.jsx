import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import api from "../api";
import userContext from "./Usercontext";
import { ChatContext } from "./Chatcontext";

const sortChats = (chats) => [...chats].sort(
  (first, second) => new Date(second.lastMessageAt || 0) - new Date(first.lastMessageAt || 0),
);
const EMPTY_LIST = [];

const getErrorMessage = (error, fallback) => (
  error?.response?.data?.message || fallback
);

export function Chatprovider({ children }) {
  const { authToken, currentUser } = useContext(userContext);
  const [chats, setChats] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [dataOwnerId, setDataOwnerId] = useState(null);
  const [messagesByChat, setMessagesByChat] = useState({});
  const [suggestionsByChat, setSuggestionsByChat] = useState({});
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => (
    localStorage.getItem("chatapp-notifications") !== "off"
  ));
  const [callSocket, setCallSocket] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const socketRef = useRef(null);
  const selectedChatIdRef = useRef(null);
  const chatsRef = useRef(chats);
  const latestSuggestionIdsRef = useRef(new Map());

  const userId = currentUser?._id;
  const visibleChats = dataOwnerId === userId ? chats : EMPTY_LIST;
  const visibleContacts = dataOwnerId === userId ? contacts : EMPTY_LIST;
  const isLoading = Boolean(userId && loadedUserId !== userId);
  const selectedChat = visibleChats.find((chat) => chat._id === selectedChatId) || null;
  const messages = selectedChat ? messagesByChat[selectedChat._id] || [] : [];

  useEffect(() => {
    selectedChatIdRef.current = selectedChatId;
  }, [selectedChatId]);

  useEffect(() => {
    chatsRef.current = visibleChats;
  }, [visibleChats]);

  const refreshChats = useCallback(async () => {
    const [{ data: chatData }, { data: contactData }] = await Promise.all([
      api.get("/chat"),
      api.get("/user/contacts"),
    ]);
    setChats(sortChats(chatData.chats));
    setContacts(contactData.contacts);
    setDataOwnerId(userId);
    chatData.chats.forEach((chat) => {
      socketRef.current?.emit("conversation:join", chat._id);
    });
    return chatData.chats;
  }, [userId]);

  const requestReplySuggestions = useCallback(async (chatId, message) => {
    if (!chatId || !message?._id || message.sender !== "other") {
      if (chatId) {
        latestSuggestionIdsRef.current.set(chatId, null);
        setSuggestionsByChat((current) => ({ ...current, [chatId]: null }));
      }
      return;
    }

    const messageId = message._id;
    latestSuggestionIdsRef.current.set(chatId, messageId);
    setSuggestionsByChat((current) => ({
      ...current,
      [chatId]: { messageId, suggestions: [], loading: true, error: "" },
    }));

    try {
      const { data } = await api.post(`/chat/${chatId}/suggestions`);
      if (latestSuggestionIdsRef.current.get(chatId) !== messageId) return;
      setSuggestionsByChat((current) => ({
        ...current,
        [chatId]: {
          messageId,
          suggestions: data.messageId === messageId ? data.suggestions : [],
          loading: false,
          error: "",
        },
      }));
    } catch (error) {
      console.error("Could not load AI reply suggestions:", error);
      if (latestSuggestionIdsRef.current.get(chatId) !== messageId) return;
      setSuggestionsByChat((current) => ({
        ...current,
        [chatId]: {
          messageId,
          suggestions: [],
          loading: false,
          error: getErrorMessage(error, "AI reply suggestions are unavailable right now."),
        },
      }));
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (!authToken || !userId) return undefined;

    Promise.resolve()
      .then(() => refreshChats())
      .catch((error) => {
        if (active) toast.error(getErrorMessage(error, "Could not load your conversations."));
      })
      .finally(() => {
        if (active) setLoadedUserId(userId);
      });

    return () => {
      active = false;
    };
  }, [authToken, userId, refreshChats]);

  useEffect(() => {
    if (!authToken || !currentUser) return undefined;

    const socket = io(api.defaults.baseURL, { auth: { token: authToken } });
    socketRef.current = socket;
    setCallSocket(socket);

    socket.on("connect", () => {
      chatsRef.current.forEach((chat) => socket.emit("conversation:join", chat._id));
    });
    socket.on("connect_error", (error) => {
      console.error("Could not connect to chat updates:", error);
      toast.error("Live chat updates are unavailable. Messages can still be refreshed.");
    });
    socket.on("chat:error", ({ message }) => toast.error(message));
    socket.on("call:incoming", (call) => setIncomingCall(call));
    socket.on("call:ended", ({ callId }) => {
      setIncomingCall((current) => current?.callId === callId ? null : current);
    });
    socket.on("conversation:updated", () => {
      refreshChats().catch((error) => {
        toast.error(getErrorMessage(error, "Could not refresh your conversations."));
      });
    });
    socket.on("presence:update", ({ userId, online }) => {
      setChats((current) => current.map((chat) => (
        chat.type !== "group" && chat.members?.some((member) => member._id === userId)
          ? { ...chat, online }
          : chat
      )));
    });
    socket.on("message:new", (incoming) => {
      const conversationId = incoming.conversationId;
      const message = {
        ...incoming,
        sender: incoming.senderId === currentUser._id ? "me" : "other",
      };

      setMessagesByChat((current) => {
        const existing = current[conversationId] || [];
        return existing.some((item) => item._id === message._id)
          ? current
          : { ...current, [conversationId]: [...existing, message] };
      });
      if (!chatsRef.current.some((chat) => chat._id === conversationId)) {
        refreshChats().catch((error) => {
          toast.error(getErrorMessage(error, "Could not refresh your conversations."));
        });
      }
      setChats((current) => sortChats(current.map((chat) => chat._id === conversationId
          ? {
            ...chat,
            lastMessage: message.text || (message.attachment?.type === "image" ? "Photo" : message.attachment?.name || ""),
            lastMessageAt: message.createdAt,
            time: message.time,
            lastMessageFromMe: message.sender === "me",
            unread: message.sender === "me" || selectedChatIdRef.current === conversationId
              ? 0
              : (chat.unread || 0) + 1,
          }
          : chat)));
      if (message.sender === "other" && selectedChatIdRef.current === conversationId) {
        requestReplySuggestions(conversationId, message);
      } else if (message.sender === "me") {
        latestSuggestionIdsRef.current.set(conversationId, message._id);
        setSuggestionsByChat((current) => ({ ...current, [conversationId]: null }));
      }
      if (
        notificationsEnabled
        && message.sender !== "me"
        && selectedChatIdRef.current !== conversationId
      ) {
        const senderName = message.senderName || "New message";
        toast(`${senderName}: ${message.text || message.attachment?.name || "Attachment"}`);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setCallSocket((current) => current === socket ? null : current);
    };
  }, [authToken, currentUser, notificationsEnabled, refreshChats, requestReplySuggestions]);

  useEffect(() => {
    try {
      localStorage.setItem("chatapp-notifications", notificationsEnabled ? "on" : "off");
    } catch (error) {
      console.error("Could not save notification preference:", error);
      toast.error("Could not save your settings.");
    }
  }, [notificationsEnabled]);

  const selectChat = async (chat) => {
    setSelectedChatId(chat._id);
    setIsChatOpen(true);
    setSuggestionsByChat((current) => ({ ...current, [chat._id]: null }));
    setChats((current) => current.map((item) => (
      item._id === chat._id ? { ...item, unread: 0 } : item
    )));
    socketRef.current?.emit("conversation:join", chat._id);
    try {
      const { data } = await api.get(`/chat/${chat._id}/messages`);
      setMessagesByChat((current) => ({ ...current, [chat._id]: data.messages }));
      const latestMessage = data.messages.at(-1);
      await requestReplySuggestions(chat._id, latestMessage);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not load this conversation."));
    }
  };

  const backToChats = () => setIsChatOpen(false);

  const createChat = async (userId) => {
    try {
      const { data } = await api.post("/chat/direct", { userId });
      setChats((current) => sortChats([
        data.chat,
        ...current.filter((chat) => chat._id !== data.chat._id),
      ]));
      await selectChat(data.chat);
      return data.chat;
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not start this conversation."));
      return null;
    }
  };

  const createGroup = async (name, memberIds) => {
    try {
      const { data } = await api.post("/chat/group", { name, memberIds });
      setChats((current) => sortChats([data.chat, ...current]));
      await selectChat(data.chat);
      return data.chat;
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not create this group."));
      return null;
    }
  };

  const sendMessage = async (text, attachment) => {
    if (!selectedChat || selectedChat.blocked) {
      toast.error("Unblock this contact before sending a message.");
      return;
    }
    if (!text?.trim() && !attachment) return;

    try {
      const { data } = await api.post(`/chat/${selectedChat._id}/messages`, {
        text: text || "",
        ...(attachment ? { attachment } : {}),
      });
      const message = { ...data.message, sender: "me" };
      latestSuggestionIdsRef.current.set(selectedChat._id, message._id);
      setSuggestionsByChat((current) => ({ ...current, [selectedChat._id]: null }));
      setMessagesByChat((current) => {
        const existing = current[selectedChat._id] || [];
        return existing.some((item) => item._id === message._id)
          ? current
          : { ...current, [selectedChat._id]: [...existing, message] };
      });
      setChats((current) => sortChats(current.map((chat) => (
        chat._id === selectedChat._id
          ? {
            ...chat,
            lastMessage: text.trim() || (attachment.type === "image" ? "Photo" : attachment.name),
            lastMessageAt: message.createdAt,
            time: message.time,
            lastMessageFromMe: true,
            unread: 0,
          }
          : chat
      ))));
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not send this message."));
    }
  };

  const updateChat = async (chatId, changes) => {
    try {
      const { data } = await api.patch(`/chat/${chatId}/preferences`, changes);
      setChats((current) => current.map((chat) => (
        chat._id === chatId ? { ...chat, ...data.chat } : chat
      )));
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update conversation settings."));
    }
  };

  const clearConversation = async (chatId = selectedChatId) => {
    if (!chatId) return;
    try {
      await api.delete(`/chat/${chatId}/messages`);
      latestSuggestionIdsRef.current.set(chatId, null);
      setMessagesByChat((current) => ({ ...current, [chatId]: [] }));
      setSuggestionsByChat((current) => ({ ...current, [chatId]: null }));
      setChats((current) => current.map((chat) => chat._id === chatId
        ? { ...chat, lastMessage: "", time: "", lastMessageAt: null, unread: 0, lastMessageFromMe: false }
        : chat));
      toast.success("Conversation history cleared for you.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not clear this conversation."));
    }
  };

  const value = {
    chats: visibleChats,
    contacts: visibleContacts,
    messagesByChat,
    selectedChat,
    selectedChatId,
    messages,
    isChatOpen,
    isLoading,
    notificationsEnabled,
    setNotificationsEnabled,
    callSocket,
    incomingCall,
    selectChat,
    backToChats,
    createChat,
    createGroup,
    sendMessage,
    updateChat,
    clearConversation,
    refreshChats,
    suggestionsByChat,
    requestReplySuggestions,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export default Chatprovider;
