import { useContext, useEffect, useRef, useState } from "react";
import { Bell, RotateCcw, MessageCircle, X, Plus } from "lucide-react";
import toast from "react-hot-toast";
import userContext from "../context/Usercontext";
import { useChat } from "../context/Chatcontext";
import Sidebar from "../components/Sideber";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import UserProfile from "../components/Userprofile";
import VideoCall from "../components/VideoCall";
import ThemeToggle from "../components/ThemeToggle";
import ProfileSettings from "../components/ProfileSettings";

const Homepage = () => {
  const { handleLogout, currentUser, updateProfile } = useContext(userContext);
  const {
    chats,
    contacts,
    selectedChat,
    messages,
    isChatOpen,
    isLoading,
    notificationsEnabled,
    setNotificationsEnabled,
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
    callSocket,
    incomingCall,
  } = useChat();

  const [activeTab, setActiveTab] = useState("Chats");
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState("");
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [newChatName, setNewChatName] = useState("");
  const [selectedContactId, setSelectedContactId] = useState("");
  const [newChatMode, setNewChatMode] = useState("direct");
  const [groupMemberIds, setGroupMemberIds] = useState([]);
  const [messageSearchOpen, setMessageSearchOpen] = useState(false);
  const [call, setCall] = useState(null);
  const handledIncomingCallRef = useRef(null);
  const incomingChat = incomingCall
    ? chats.find((item) => item._id === incomingCall.conversationId)
    : null;
  const activeCall = call || (incomingCall && incomingChat
    ? { chat: incomingChat, type: incomingCall.callType, incomingCall }
    : null);

  useEffect(() => {
    if (
      !incomingCall
      || incomingChat
      || handledIncomingCallRef.current === incomingCall.callId
    ) return;
    handledIncomingCallRef.current = incomingCall.callId;
    refreshChats()
      .then((refreshedChats) => {
        const refreshedChat = refreshedChats.find((item) => item._id === incomingCall.conversationId);
        if (!refreshedChat) {
          toast.error("Could not find the conversation for this call.");
        }
      })
      .catch((error) => {
        toast.error(error?.response?.data?.message || "Could not load the incoming call.");
      });
  }, [chats, incomingCall, incomingChat, refreshChats]);

  const changeTab = (tab) => {
    setActiveTab(tab);
    backToChats();
    setShowProfile(false);
  };

  const startChat = async (event) => {
    event.preventDefault();
    let created;
    if (newChatMode === "group") {
      if (!groupMemberIds.length) return;
      if (!newChatName.trim()) return;
      created = await createGroup(newChatName, groupMemberIds);
    } else {
      if (!selectedContactId) return;
      created = await createChat(selectedContactId);
    }
    if (!created) return;
    setNewChatName("");
    setSelectedContactId("");
    setGroupMemberIds([]);
    setNewChatOpen(false);
    setNewChatMode("direct");
    setActiveTab("Chats");
    setShowProfile(false);
  };

  const handleRefreshChats = async () => {
    try {
      await refreshChats();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not refresh conversations.");
    }
  };

  return (
    <main className={`messenger-app ${isChatOpen ? "mobile-chat-open" : ""}`}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={changeTab}
        onNewChat={() => setNewChatOpen(true)}
        onLogout={handleLogout}
        currentUser={currentUser}
      />

      {activeTab === "Settings" ? (
        <section className="settings-page">
          <div className="settings-heading">
            <h1>Settings</h1>
            <p>Make ChatApp feel like yours.</p>
          </div>
          <ProfileSettings user={currentUser} onSave={updateProfile} />
          <div className="settings-card">
            <div className="settings-card-icon"><MessageCircle size={20} /></div>
            <div className="settings-card-copy">
              <h2>Appearance</h2>
              <p>Choose the light or dark theme for the whole app.</p>
            </div>
            <ThemeToggle />
          </div>
          <div className="settings-card">
            <div className="settings-card-icon"><Bell size={20} /></div>
            <div className="settings-card-copy">
              <h2>Notifications</h2>
              <p>Manage your in-app notification preference.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={notificationsEnabled}
              aria-label="Toggle notifications"
              onClick={() => setNotificationsEnabled((enabled) => !enabled)}
              className={`settings-switch ${notificationsEnabled ? "is-on" : ""}`}
            >
              <span />
            </button>
          </div>
          <div className="settings-card">
            <div className="settings-card-icon"><RotateCcw size={20} /></div>
            <div className="settings-card-copy">
              <h2>Refresh conversations</h2>
              <p>Reload your chats and contacts from the server.</p>
            </div>
            <button type="button" className="secondary-button" onClick={handleRefreshChats}>Refresh</button>
          </div>
          <p className="settings-note">
            Messages, contacts, and conversation settings are synced with your account.
          </p>
        </section>
      ) : (
        <>
          <div className={`chat-list-pane ${isChatOpen ? "mobile-hidden" : ""}`}>
            <ChatList
              chats={chats}
              selectedChat={selectedChat}
              onSelectChat={(chat) => {
                selectChat(chat);
                setShowProfile(false);
                setMessageSearchOpen(false);
              }}
              search={search}
              setSearch={setSearch}
              activeTab={activeTab}
              isLoading={isLoading}
              onCreateChat={() => setNewChatOpen(true)}
            />
          </div>

          <div className={`chat-window-pane ${isChatOpen ? "mobile-active" : ""}`}>
            <ChatWindow
              selectedChat={selectedChat}
              messages={messages}
              onSendMessage={sendMessage}
              onBack={backToChats}
              onToggleProfile={() => setShowProfile((visible) => !visible)}
              onClearConversation={() => clearConversation()}
              onCall={(type) => setCall({ chat: selectedChat, type })}
              searchOpen={messageSearchOpen}
              onSearchOpenChange={setMessageSearchOpen}
              replySuggestions={selectedChat ? suggestionsByChat[selectedChat._id]?.suggestions || [] : []}
              isLoadingSuggestions={selectedChat ? Boolean(suggestionsByChat[selectedChat._id]?.loading) : false}
              suggestionError={selectedChat ? suggestionsByChat[selectedChat._id]?.error || "" : ""}
              onRetrySuggestions={() => requestReplySuggestions(selectedChat?._id, messages.at(-1))}
            />
          </div>

          {selectedChat && (
            <div className={`profile-pane ${showProfile ? "profile-visible" : ""}`}>
              <UserProfile
                selectedChat={selectedChat}
                currentUser={currentUser}
                messages={messages}
                onClose={() => setShowProfile(false)}
                onToggleMute={() => updateChat(selectedChat._id, { muted: !selectedChat.muted })}
                onToggleBlock={() => updateChat(selectedChat._id, { blocked: !selectedChat.blocked })}
                onSearchMessages={() => {
                  setShowProfile(false);
                  setMessageSearchOpen(true);
                }}
                onCall={(type) => setCall({ chat: selectedChat, type })}
              />
            </div>
          )}
        </>
      )}

      {newChatOpen && (
        <div className="dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setNewChatOpen(false);
            setNewChatMode("direct");
            setSelectedContactId("");
            setGroupMemberIds([]);
          }
        }}>
          <form className="new-chat-dialog" onSubmit={startChat}>
            <div className="dialog-heading">
              <div className="dialog-title-icon"><MessageCircle size={19} /></div>
              <h2>{newChatMode === "group" ? "Create a group" : "Start a new chat"}</h2>
              <button type="button" className="icon-button" aria-label="Close dialog" onClick={() => {
                setNewChatOpen(false);
                setNewChatMode("direct");
                setSelectedContactId("");
                setGroupMemberIds([]);
              }}><X size={20} /></button>
            </div>
            <div className="chat-mode-switch" role="tablist" aria-label="Conversation type">
              <button type="button" role="tab" aria-selected={newChatMode === "direct"} className={newChatMode === "direct" ? "is-selected" : ""} onClick={() => setNewChatMode("direct")}>Direct chat</button>
              <button type="button" role="tab" aria-selected={newChatMode === "group"} className={newChatMode === "group" ? "is-selected" : ""} onClick={() => setNewChatMode("group")}>Group chat</button>
            </div>
            <p>{newChatMode === "group" ? "Give your group a name, then choose its participants." : "Choose a name to start a conversation."}</p>
            {newChatMode === "group" ? (
              <>
                <label htmlFor="new-chat-name">Group name</label>
                <input
                  id="new-chat-name"
                  autoFocus
                  value={newChatName}
                  onChange={(event) => setNewChatName(event.target.value)}
                  placeholder="For example, Weekend plans"
                  maxLength={60}
                />
              </>
            ) : (
              <>
                <label htmlFor="new-chat-contact">Contact</label>
                <select
                  id="new-chat-contact"
                  autoFocus
                  value={selectedContactId}
                  onChange={(event) => setSelectedContactId(event.target.value)}
                  disabled={isLoading || contacts.length === 0}
                >
                  <option value="">
                    {isLoading ? "Loading contacts…" : contacts.length ? "Choose a contact" : "No registered contacts yet"}
                  </option>
                  {contacts.map((contact) => (
                    <option key={contact._id} value={contact._id}>
                      {contact.name} · {contact.email}
                    </option>
                  ))}
                </select>
              </>
            )}
            {newChatMode === "group" && (
              <fieldset className="group-member-picker">
                <legend>Choose participants</legend>
                {contacts.length ? contacts.map((contact) => (
                  <label className="group-member-option" key={contact._id}>
                    <input
                      type="checkbox"
                      checked={groupMemberIds.includes(contact._id)}
                      onChange={(event) => setGroupMemberIds((current) => (
                        event.target.checked
                          ? [...current, contact._id]
                          : current.filter((id) => id !== contact._id)
                      ))}
                    />
                    <img src={contact.avatar || "https://i.pravatar.cc/100?img=12"} alt="" />
                    <span>{contact.name}</span>
                  </label>
                )) : <p className="no-group-contacts">No other registered users are available yet.</p>}
              </fieldset>
            )}
            <button
              type="submit"
              className="primary-button"
              disabled={newChatMode === "group"
                ? !newChatName.trim() || !groupMemberIds.length
                : !selectedContactId}
            >
              <Plus size={18} /> {newChatMode === "group" ? "Create group" : "Start conversation"}
            </button>
          </form>
        </div>
      )}
      {activeCall && (
        <VideoCall
          chat={activeCall.chat}
          callType={activeCall.type}
          socket={callSocket}
          incomingCall={activeCall.incomingCall}
          onClose={() => setCall(null)}
        />
      )}
    </main>
  );
};

export default Homepage;
