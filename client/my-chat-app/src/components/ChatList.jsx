import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, MessageCircle, CheckCheck, BellOff, Users } from "lucide-react";
import { getAssetUrl } from "../api";

const ChatList = ({ chats = [], selectedChat, onSelectChat, search, setSearch, activeTab = "Chats", onCreateChat, isLoading = false }) => {
  const filteredChats = useMemo(() => chats
    .filter((chat) => activeTab !== "Contacts" || chat.type !== "group")
    .filter((chat) => (
    chat.name.toLowerCase().includes(search.toLowerCase())
    || (chat.lastMessage || "").toLowerCase().includes(search.toLowerCase())
    )), [activeTab, chats, search]);

  return (
    <section className="conversation-list">
      <header className="conversation-header">
        <div>
          <div className="eyebrow">YOUR SPACE</div>
          <h1>{activeTab === "Contacts" ? "Contacts" : "Messages"}</h1>
        </div>
        <button type="button" className="round-action" title="New chat" aria-label="New chat" onClick={onCreateChat}>
          <Plus size={21} />
        </button>
      </header>

      <label className="conversation-search">
        <Search size={18} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={activeTab === "Contacts" ? "Search contacts" : "Search or start a new chat"}
          aria-label="Search conversations"
        />
        {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
      </label>

      <div className="list-section-heading">
        <span>{activeTab === "Contacts" ? "ALL CONTACTS" : "RECENT CHATS"}</span>
        <span>{filteredChats.length}</span>
      </div>

      <div className="conversation-items">
        <AnimatePresence initial={false}>
          {filteredChats.length ? filteredChats.map((chat) => {
            const active = selectedChat?._id === chat._id;
            return (
              <motion.button
                type="button"
                key={chat._id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                onClick={() => onSelectChat(chat)}
                className={`conversation-item ${active ? "is-selected" : ""}`}
                aria-current={active ? "true" : undefined}
              >
                <span className={`avatar-wrap ${chat.type === "group" ? "group-avatar-wrap" : ""}`}>
                  {chat.type === "group" ? (
                    <span className="group-avatar"><Users size={20} /></span>
                  ) : (
                    <>
                      <img src={getAssetUrl(chat.avatar) || "https://i.pravatar.cc/100?img=12"} alt="" />
                      {chat.online && <span className="online-indicator" />}
                    </>
                  )}
                </span>
                <span className="conversation-copy">
                  <span className="conversation-topline">
                    <span className="conversation-name">{chat.name}</span>
                    <span className={`conversation-time ${chat.unread ? "has-unread" : ""}`}>{chat.time || ""}</span>
                  </span>
                  <span className="conversation-bottomline">
                    <span className="last-message">
                      {chat.lastMessageFromMe && <CheckCheck size={15} />}
                      {chat.type === "group" && (
                        <span className="group-member-count">{(chat.members?.length || 0) + 1} members ·</span>
                      )}
                      {chat.lastMessage || "Start a conversation"}
                    </span>
                    <span className="conversation-badges">
                      {chat.muted && <BellOff size={14} />}
                      {chat.unread > 0 && <span className="unread-count">{chat.unread > 99 ? "99+" : chat.unread}</span>}
                    </span>
                  </span>
                </span>
              </motion.button>
            );
          }) : (
            <div className="empty-list">
              <span><MessageCircle size={25} /></span>
              <h2>{isLoading ? "Loading conversations" : search ? "No chats found" : "No conversations yet"}</h2>
              <p>{isLoading ? "Syncing your account…" : search ? "Try another name or message." : "Start a chat and say hello."}</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      <footer className="conversation-footer">
        <span className="privacy-dot" />
        Your conversations, all in one place
      </footer>
    </section>
  );
};

export default ChatList;
