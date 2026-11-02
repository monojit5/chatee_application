import { createContext, useContext } from "react";

export const ChatContext = createContext(null);

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error("useChat must be used inside Chatprovider.");
  return context;
}
