import { motion } from "framer-motion";
import { MessageCircle, Users, Settings, Plus, LogOut, UserRound } from "lucide-react";
import { getAssetUrl } from "../api";

const Sidebar = ({ activeTab, setActiveTab, onNewChat, onLogout, currentUser }) => {
  const menus = [
    { name: "Chats", icon: MessageCircle },
    { name: "Contacts", icon: Users },
    { name: "Settings", icon: Settings },
  ];

  return (
    <aside className="app-rail">
      <button type="button" className="brand-mark" title="ChatApp" onClick={() => setActiveTab("Chats")}>
        <MessageCircle size={23} />
      </button>
      <div className="rail-divider" />
      <nav className="rail-navigation" aria-label="Main navigation">
        {menus.map(({ name, icon: Icon }) => (
          <motion.button
            type="button"
            key={name}
            whileTap={{ scale: 0.94 }}
            onClick={() => setActiveTab(name)}
            title={name}
            aria-label={name}
            aria-current={activeTab === name ? "page" : undefined}
            className={`rail-button ${activeTab === name ? "is-active" : ""}`}
          >
            <Icon size={21} />
            <span>{name}</span>
          </motion.button>
        ))}
      </nav>
      <button type="button" className="rail-button rail-new-chat" onClick={onNewChat} title="New chat" aria-label="New chat">
        <Plus size={21} />
        <span>New chat</span>
      </button>
      <div className="rail-spacer" />
      <button type="button" className="rail-button rail-logout" onClick={onLogout} title="Log out" aria-label="Log out">
        <LogOut size={20} />
        <span>Log out</span>
      </button>
      <button type="button" className="rail-profile" title={`${currentUser?.name || "Your"} profile`} onClick={() => setActiveTab("Settings")} aria-label="Edit your profile">
        {currentUser?.avatar
          ? <img src={getAssetUrl(currentUser.avatar)} alt={`${currentUser?.name || "Your"} profile`} />
          : <span className="rail-profile-fallback"><UserRound size={19} /></span>}
        <span className="rail-profile-status" />
      </button>
    </aside>
  );
};

export default Sidebar;
