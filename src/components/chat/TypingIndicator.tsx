
import React from "react";

export function TypingIndicator() {
  return (
    <div className="chat-message assistant-message !py-3">
      <div className="typing-indicator">
        <span className="animate-typing-dot-1"></span>
        <span className="animate-typing-dot-2"></span>
        <span className="animate-typing-dot-3"></span>
      </div>
    </div>
  );
}
