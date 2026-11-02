import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  muted: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false },
  clearedAt: { type: Date, default: null },
}, { _id: false });

const conversationSchema = new mongoose.Schema({
  participants: {
    type: [participantSchema],
    required: true,
    validate: {
      validator(participants) {
        return participants.length >= 2;
      },
      message: "A conversation must have at least two participants.",
    },
  },
  isGroup: { type: Boolean, default: false },
  name: { type: String, trim: true, maxlength: 60, default: "" },
  directKey: { type: String, unique: true, sparse: true },
  lastMessage: { type: String, default: "" },
  lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

conversationSchema.index({ "participants.user": 1, lastMessageAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);
export default Conversation;
