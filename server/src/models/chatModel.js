import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 255, required: true },
  type: { type: String, enum: ["image", "file"], required: true },
  mimeType: { type: String, maxlength: 127, required: true },
  data: { type: String, required: true },
  size: { type: Number, min: 1, max: 1024 * 1024, required: true },
}, { _id: false });

const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    trim: true,
    maxlength: 5000,
    default: "",
  },
  attachment: {
    type: attachmentSchema,
    default: null,
  },
}, { timestamps: true });

messageSchema.index({ conversationId: 1, createdAt: 1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;
