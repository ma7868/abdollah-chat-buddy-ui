
import { cn } from "@/lib/utils";
import React from "react";

interface ChatMessageProps {
  content: string;
  sender: "user" | "assistant";
  options?: string[];
  onOptionClick?: (option: string) => void;
}

export function ChatMessage({ 
  content, 
  sender, 
  options = [], 
  onOptionClick 
}: ChatMessageProps) {
  const isUser = sender === "user";
  
  return (
    <div className={cn(
      "chat-message",
      isUser ? "user-message" : "assistant-message"
    )}>
      <div>{content}</div>
      
      {!isUser && options.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => onOptionClick?.(option)}
              className="px-3 py-1 text-sm rounded-full bg-primary/10 hover:bg-primary/20 
                dark:bg-primary/20 dark:hover:bg-primary/30 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
