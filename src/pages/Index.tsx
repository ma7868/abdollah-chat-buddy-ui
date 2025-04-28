
import React from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-radial from-background to-secondary/50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl h-[80vh] glass rounded-2xl overflow-hidden shadow-xl">
        <div className="flex flex-col h-full">
          <div className="bg-gradient-to-r from-primary to-accent py-4 px-6">
            <h1 className="text-xl font-semibold text-white">Abdullah Assistant</h1>
            <p className="text-sm text-white/80">Your personal AI assistant</p>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <ChatInterface />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
