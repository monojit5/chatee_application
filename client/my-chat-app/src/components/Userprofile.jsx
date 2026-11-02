import {
  Phone,
  Video,
  Search,
  FileText,
  Link as LinkIcon,
  Bell,
  Ban,
  ChevronRight,
  X,
  Users,
} from "lucide-react";
import { getAssetUrl } from "../api";

const UserProfile = ({
  selectedChat,
  currentUser,
  messages = [],
  onClose,
  onToggleMute,
  onToggleBlock,
  onSearchMessages,
  onCall,
}) => {
  if (!selectedChat) return null;

  const attachments = messages.filter((message) => message.attachment);
  const sharedImages = attachments.filter((message) => message.attachment.type === "image");
  const sharedFiles = attachments.filter((message) => message.attachment.type === "file");

  return (
    <aside className="contact-panel">
      <div className="contact-panel-header">
        <h2 className="text-base font-semibold">{selectedChat.type === "group" ? "Group info" : "Contact info"}</h2>
        <button
          type="button"
          onClick={onClose}
          title="Close contact info"
          aria-label="Close contact info"
          className="icon-button"
        >
          <X size={19} />
        </button>
      </div>

      <div className="contact-panel-content">
        <div className="contact-identity">
          <div className="relative">
            {selectedChat.type === "group" ? (
              <span className="contact-avatar group-profile-avatar"><Users size={34} /></span>
            ) : (
              <img
                src={getAssetUrl(selectedChat.avatar) || "https://i.pravatar.cc/100?img=12"}
                alt={selectedChat.name}
                className="contact-avatar"
              />
            )}
            {selectedChat.type !== "group" && selectedChat.online && (
              <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-[3px] border-[#151e2e] bg-green-400" />
            )}
          </div>
          <h3>{selectedChat.name}</h3>
          <p className={selectedChat.blocked ? "contact-blocked" : ""}>
            {selectedChat.type === "group"
              ? `${(selectedChat.members?.length || 0) + 1} participants`
              : selectedChat.blocked ? "Blocked" : selectedChat.online ? "Online" : "Offline"}
          </p>
          <p className="contact-about">
            {selectedChat.about || "Hey there! I am using ChatApp."}
          </p>
        </div>

        {selectedChat.type === "group" && (
          <div className="contact-section group-participants">
            <div className="contact-section-heading">
              <h4>Participants</h4>
              <span>{(selectedChat.members?.length || 0) + 1}</span>
            </div>
            <div className="participant-list">
              <div className="participant-row">
                <img src={getAssetUrl(currentUser?.avatar) || "https://i.pravatar.cc/100?img=12"} alt="" />
                <span>You</span>
                <small>Admin</small>
              </div>
              {(selectedChat.members || []).map((member) => (
                <div className="participant-row" key={member._id}>
                  <img src={getAssetUrl(member.avatar) || "https://i.pravatar.cc/100?img=12"} alt="" />
                  <span>{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="contact-actions">
          {selectedChat.type !== "group" && (
            <>
              <button type="button" onClick={() => onCall("audio")} className="contact-action">
                <span><Phone size={19} /></span>
                <span>Audio</span>
              </button>
              <button type="button" onClick={() => onCall("video")} className="contact-action">
                <span><Video size={19} /></span>
                <span>Video</span>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onSearchMessages}
            className="contact-action"
          >
            <span><Search size={19} /></span>
            <span>Search</span>
          </button>
        </div>

        <div className="contact-section">
          <div className="contact-section-heading">
            <h4>Shared media</h4>
            <span>
              {sharedImages.length} photos <ChevronRight size={14} />
            </span>
          </div>
          {sharedImages.length ? (
            <div className="grid grid-cols-3 gap-2">
              {sharedImages.slice(-9).map((message) => (
                <a
                  key={message._id}
                  href={message.attachment.data}
                  target="_blank"
                  rel="noreferrer"
                  className="shared-image"
                >
                  <img
                    src={message.attachment.data}
                    alt={message.attachment.name}
                    className="h-full w-full object-cover"
                  />
                </a>
              ))}
            </div>
          ) : (
            <p className="contact-empty">No shared photos yet.</p>
          )}
        </div>

        <div className="contact-section">
          <div className="contact-section-heading">
            <h4>Shared files</h4>
            <span>{sharedFiles.length}</span>
          </div>
          {sharedFiles.length ? (
            <div className="shared-files">
              {sharedFiles.map((message) => (
                <a
                  key={message._id}
                  href={message.attachment.data}
                  download={message.attachment.name}
                  className="shared-file"
                >
                  <span>
                    <FileText size={20} />
                  </span>
                  <span>{message.attachment.name}</span>
                  <LinkIcon size={16} />
                </a>
              ))}
            </div>
          ) : (
            <p className="contact-empty">No shared files yet.</p>
          )}
        </div>

        <div className="contact-section">
          <h4 className="contact-section-title">Privacy &amp; settings</h4>
          <button
            type="button"
            role="switch"
            aria-checked={Boolean(selectedChat.muted)}
            onClick={onToggleMute}
            className="privacy-setting"
          >
            <span>
              <Bell size={18} />
              <span>Mute notifications</span>
            </span>
            <span className={`settings-switch ${selectedChat.muted ? "is-on" : ""}`}>
              <span />
            </span>
          </button>
          {selectedChat.type !== "group" && <button
            type="button"
            onClick={onToggleBlock}
            className="block-contact"
          >
            <Ban size={18} />
            <span>{selectedChat.blocked ? "Unblock contact" : "Block contact"}</span>
          </button>}
        </div>
      </div>

      <div className="contact-panel-footer">
        <p>ChatApp · Contact information</p>
      </div>
    </aside>
  );
};

export default UserProfile;
