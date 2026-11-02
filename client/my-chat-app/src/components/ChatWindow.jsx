import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  Image,
  FileText,
  CheckCheck,
  Search,
  Trash2,
  X,
  Download,
  Mic,
  PanelRightOpen,
  MessageCircle,
  Users,
} from "lucide-react";
import { getAssetUrl } from "../api";

const QUICK_EMOJIS = ["😀", "😂", "❤️", "👍", "🎉", "🙏", "🔥", "😊"];

const ChatWindow = ({
  selectedChat,
  messages = [],
  onSendMessage,
  onBack,
  onToggleProfile,
  onClearConversation,
  onCall,
  searchOpen = false,
  onSearchOpenChange,
  replySuggestions = [],
  isLoadingSuggestions = false,
  suggestionError = "",
  onRetrySuggestions,
}) => {
  const [message, setMessage] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (event) => {
    event.preventDefault();
    if (!message.trim() || !selectedChat || selectedChat.blocked) return;
    onSendMessage(message.trim());
    setMessage("");
    setShowEmojis(false);
  };

  const handleSuggestionClick = (suggestion) => {
    if (!selectedChat || selectedChat.blocked) return;
    onSendMessage(suggestion);
    setMessage("");
  };

  const handleComposerKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend(event);
    }
  };

  const handleFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setShowAttachments(false);
    if (!file || !selectedChat) return;
    if (file.size > 1024 * 1024) {
      toast.error("Choose a file smaller than 1 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        toast.error("Could not read this file.");
        return;
      }
      onSendMessage("", {
        name: file.name,
        type: file.type.startsWith("image/") ? "image" : "file",
        mimeType: file.type || "application/octet-stream",
        data: reader.result,
        size: file.size,
      });
    };
    reader.onerror = () => toast.error("Could not read this file.");
    reader.readAsDataURL(file);
  };

  const visibleMessages = messageSearch.trim()
    ? messages.filter((item) => (
      (item.text || "").toLowerCase().includes(messageSearch.trim().toLowerCase())
      || (item.attachment?.name || "").toLowerCase().includes(messageSearch.trim().toLowerCase())
    ))
    : messages;

  if (!selectedChat) {
    return (
      <section className="welcome-panel">
        <div className="welcome-art">
          <div className="welcome-orbit orbit-one" />
          <div className="welcome-orbit orbit-two" />
          <div className="welcome-logo"><MessageCircleIcon /></div>
          <span className="welcome-bubble bubble-one">Hey there! 👋</span>
          <span className="welcome-bubble bubble-two">Let's catch up</span>
        </div>
        <h1>A little more connected.</h1>
        <p>Pick a conversation and make someone&apos;s day.</p>
        <div className="welcome-encryption"><CheckCheck size={15} /> Private conversations stay on this device</div>
      </section>
    );
  }

  return (
    <section className="active-chat">
      <header className="chat-header">
        <button type="button" className="icon-button mobile-back" onClick={onBack} title="Back to chats" aria-label="Back to chats">
          <ArrowLeft size={21} />
        </button>
        <button type="button" className="chat-contact" onClick={onToggleProfile} title="Contact details">
          <span className={`avatar-wrap chat-header-avatar ${selectedChat.type === "group" ? "group-avatar-wrap" : ""}`}>
            {selectedChat.type === "group" ? (
              <span className="group-avatar"><Users size={19} /></span>
            ) : (
              <>
                <img src={getAssetUrl(selectedChat.avatar) || "https://i.pravatar.cc/100?img=12"} alt="" />
                {selectedChat.online && <span className="online-indicator" />}
              </>
            )}
          </span>
          <span className="chat-contact-copy">
            <strong>{selectedChat.name}</strong>
            <span className={selectedChat.blocked ? "contact-blocked" : ""}>
              {selectedChat.type === "group"
                ? `${(selectedChat.members?.length || 0) + 1} members`
                : selectedChat.blocked ? "Blocked" : selectedChat.online ? "online now" : "last seen recently"}
            </span>
          </span>
        </button>

        <div className="chat-header-actions">
          <button type="button" className="icon-button call-action" title="Start audio call" disabled={selectedChat.type === "group"} onClick={() => onCall("audio")}>
            <Phone size={19} />
          </button>
          <button type="button" className="icon-button call-action" title="Start video call" disabled={selectedChat.type === "group"} onClick={() => onCall("video")}>
            <Video size={20} />
          </button>
          <button type="button" className={`icon-button ${searchOpen ? "is-pressed" : ""}`} title="Search messages" aria-label="Search messages" onClick={() => {
            if (searchOpen) setMessageSearch("");
            onSearchOpenChange(!searchOpen);
          }}>
            <Search size={19} />
          </button>
          <button type="button" className="icon-button desktop-profile-toggle" title="Contact info" aria-label="Contact info" onClick={onToggleProfile}>
            <PanelRightOpen size={19} />
          </button>
          <div className="options-wrap">
            <button type="button" className="icon-button" title="More options" aria-label="More options" aria-expanded={showOptions} onClick={() => setShowOptions((open) => !open)}>
              <MoreVertical size={20} />
            </button>
            {showOptions && (
              <div className="chat-options-menu">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Clear all messages in this conversation?")) onClearConversation();
                    setShowOptions(false);
                  }}
                >
                  <Trash2 size={16} /> Clear conversation
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {searchOpen && (
        <div className="message-search-bar">
          <Search size={17} />
          <input
            autoFocus
            value={messageSearch}
            onChange={(event) => setMessageSearch(event.target.value)}
            placeholder="Search in this conversation"
            aria-label="Search messages"
          />
          {messageSearch && <span>{visibleMessages.length} found</span>}
          <button type="button" className="icon-button" aria-label="Close search" onClick={() => {
            setMessageSearch("");
            onSearchOpenChange(false);
          }}><X size={17} /></button>
        </div>
      )}

      <div className="message-area">
        <div className="message-list">
          <div className="date-divider"><span>Today</span></div>
          <AnimatePresence initial={false}>
            {visibleMessages.map((msg, index) => {
              const isMe = msg.sender === "me";
              return (
                <motion.div
                  key={msg._id || msg.id || index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`message-row ${msg.sender === "system" ? "message-system" : isMe ? "message-outgoing" : "message-incoming"}`}
                >
                  <div className={`message-bubble ${msg.sender === "system" ? "system-bubble" : isMe ? "outgoing-bubble" : "incoming-bubble"}`}>
                    {selectedChat.type === "group" && !isMe && msg.sender !== "system" && msg.senderName && (
                      <span className="group-sender-name">{msg.senderName}</span>
                    )}
                    {msg.attachment?.type === "image" && (
                      <a href={msg.attachment.data} target="_blank" rel="noreferrer">
                        <img src={msg.attachment.data} alt={msg.attachment.name} className="message-image" />
                      </a>
                    )}
                    {msg.attachment?.type === "file" && (
                      <a href={msg.attachment.data} download={msg.attachment.name} className="message-file">
                        <span><FileText size={20} /></span>
                        <span className="file-name">{msg.attachment.name}</span>
                        <Download size={16} />
                      </a>
                    )}
                    {msg.text && <p>{msg.text}</p>}
                    <span className="message-meta">
                      {msg.time || ""}
                      {isMe && <CheckCheck size={14} />}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {messageSearch && !visibleMessages.length && <p className="empty-search">No matching messages.</p>}
          {!messages.length && !messageSearch && (
            <div className="conversation-start">
              <MessageCircle size={20} />
              <span>This is the beginning of your conversation. Say hello!</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <footer className="composer-wrap">
        {!selectedChat.blocked && (isLoadingSuggestions || suggestionError || replySuggestions.length > 0) && (
          <section className="reply-suggestion-panel" aria-live="polite" aria-label="AI reply suggestions">
            <div className="reply-suggestion-heading">
              <span>Suggested replies</span>
              <span>Gemini uses recent messages in this chat</span>
            </div>
            {isLoadingSuggestions ? (
              <p className="reply-suggestion-status">Generating three reply ideas…</p>
            ) : suggestionError ? (
              <div className="reply-suggestion-error">
                <span>{suggestionError}</span>
                <button type="button" onClick={onRetrySuggestions}>Try again</button>
              </div>
            ) : (
              <div className="reply-suggestion-options">
                {replySuggestions.map((suggestion, index) => (
                  <button
                    type="button"
                    key={`${index}-${suggestion}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    disabled={selectedChat.blocked}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
        {selectedChat.blocked && <p className="blocked-notice">This contact is blocked. Unblock them to send a message.</p>}
        {showAttachments && (
          <div className="attachment-menu">
            <button type="button" onClick={() => fileInputRef.current?.click()}><Image size={20} /><span>Photo</span></button>
            <button type="button" onClick={() => fileInputRef.current?.click()}><FileText size={20} /><span>Document</span></button>
          </div>
        )}
        {showEmojis && (
          <div className="emoji-menu">
            {QUICK_EMOJIS.map((emoji) => (
              <button type="button" key={emoji} onClick={() => setMessage((current) => `${current}${emoji}`)} aria-label={`Add ${emoji}`}>{emoji}</button>
            ))}
          </div>
        )}
        <input ref={fileInputRef} type="file" accept="image/*,.pdf,.txt,.doc,.docx,.xls,.xlsx" onChange={handleFile} hidden />
        <form className="composer" onSubmit={handleSend}>
          <div className="composer-control-wrap">
            <button
              type="button"
              className={`icon-button composer-attach ${showAttachments ? "is-pressed" : ""}`}
              title="Attach file"
              aria-label="Attach file"
              disabled={selectedChat.blocked}
              onClick={() => {
                setShowAttachments((open) => !open);
                setShowEmojis(false);
              }}
            >
              <Paperclip size={20} />
            </button>
          </div>
          <div className="composer-field">
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder={selectedChat.blocked ? "Unblock this contact to reply" : "Write a message"}
              aria-label="Write a message"
              disabled={selectedChat.blocked}
              maxLength={5000}
              rows={1}
            />
            <button
              type="button"
              className="icon-button emoji-toggle"
              title="Emoji"
              aria-label="Choose an emoji"
              disabled={selectedChat.blocked}
              onClick={() => {
                setShowEmojis((open) => !open);
                setShowAttachments(false);
              }}
            >
              <Smile size={20} />
            </button>
          </div>
          {message.trim() ? (
            <button type="submit" className="send-button" disabled={selectedChat.blocked} title="Send message" aria-label="Send message"><Send size={19} /></button>
          ) : (
            <button type="button" className="send-button voice-button" title="Voice message" aria-label="Voice messages are not available yet" onClick={() => toast("Voice messages are not available yet.")}><Mic size={20} /></button>
          )}
        </form>
        <p className="composer-hint">Enter to send <span>·</span> Shift + Enter for a new line</p>
      </footer>
    </section>
  );
};

function MessageCircleIcon() {
  return <MessageCircle size={34} strokeWidth={1.6} />;
}

export default ChatWindow;
