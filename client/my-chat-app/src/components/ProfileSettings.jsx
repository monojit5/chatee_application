import { useEffect, useRef, useState } from "react";
import { Camera, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { getAssetUrl } from "../api";

export default function ProfileSettings({ user, onSave }) {
  const [name, setName] = useState(user?.name || "");
  const [about, setAbout] = useState(user?.about || "");
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const photoPreviewRef = useRef("");

  useEffect(() => () => {
    if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
  }, []);
  const preview = photoPreview || getAssetUrl(user?.avatar);

  const submit = async (event) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanAbout = about.trim();
    if (cleanName.length < 2 || cleanName.length > 100) {
      toast.error("Name must be between 2 and 100 characters.");
      return;
    }
    if (cleanAbout.length > 160) {
      toast.error("About must be 160 characters or fewer.");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({ name: cleanName, about: cleanAbout, avatar: photo });
      if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
      photoPreviewRef.current = "";
      setPhoto(null);
      setPhotoPreview("");
      toast.success("Your profile is up to date.");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update your profile.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form className="profile-settings-card" onSubmit={submit}>
      <div className="settings-card-icon"><UserRound size={20} /></div>
      <div className="profile-settings-main">
        <div className="settings-card-copy">
          <h2>Your profile</h2>
          <p>Update your name, photo, and about information.</p>
        </div>
        <div className="profile-settings-fields">
          <label className="profile-photo-picker">
            {preview ? <img src={preview} alt="Profile preview" /> : <UserRound size={26} />}
            <span><Camera size={14} /> Change photo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              aria-label="Upload profile photo"
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (!file) return;
                if (file.size > 2 * 1024 * 1024) {
                  toast.error("Profile photos must be smaller than 2 MB.");
                  return;
                }
                if (photoPreviewRef.current) URL.revokeObjectURL(photoPreviewRef.current);
                photoPreviewRef.current = URL.createObjectURL(file);
                setPhotoPreview(photoPreviewRef.current);
                setPhoto(file);
              }}
            />
          </label>
          <label className="profile-field">
            <span>Display name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} maxLength={100} required />
          </label>
          <label className="profile-field">
            <span>About</span>
            <textarea value={about} onChange={(event) => setAbout(event.target.value)} maxLength={160} rows={2} />
          </label>
          <button type="submit" className="secondary-button" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save profile"}
          </button>
        </div>
      </div>
    </form>
  );
}
