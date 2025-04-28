import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Send, Sun, Moon } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  options?: string[];
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [conversationState, setConversationState] = useState<{
    step: string;
    data: Record<string, any>;
  }>({
    step: "greeting",
    data: {}
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Speech recognition setup
  const [isListening, setIsListening] = useState(false);
  const recognition = useRef<SpeechRecognition | null>(null);

  // Initialize speech recognition if supported
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognitionAPI) {
        recognition.current = new SpeechRecognitionAPI();
        recognition.current.continuous = false;
        recognition.current.interimResults = false;
        
        recognition.current.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          handleSendMessage(transcript);
        };
        
        recognition.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  }, []);

  // Load saved messages from localStorage
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        if (Array.isArray(parsedMessages)) {
          setMessages(parsedMessages);
        }
      } catch (error) {
        console.error("Error parsing saved messages", error);
      }
    } else {
      // Add initial welcome message if no saved messages
      const initialMessage: Message = {
        id: Date.now().toString(),
        content: "Hello! I'm Abdullah Assistant. How can I help you today?",
        sender: "assistant",
        options: ["Book a service", "Check availability", "I need help", "Live agent"]
      };
      setMessages([initialMessage]);
    }
  }, []);

  // Save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    setIsDarkMode(!isDarkMode);
  };

  const handleToggleListening = () => {
    if (!recognition.current) return;
    
    if (isListening) {
      recognition.current.stop();
    } else {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputText.trim()) {
      handleSendMessage();
    }
  };

  const handleOptionClick = (option: string) => {
    handleSendMessage(option);
  };

  const handleSendMessage = (text?: string) => {
    const messageContent = text || inputText;
    if (!messageContent.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageContent,
      sender: "user"
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    // Process the message and generate response based on conversation state
    setTimeout(() => {
      const botResponse = generateBotResponse(messageContent, conversationState);
      setIsTyping(false);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse.message,
        sender: "assistant",
        options: botResponse.options
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationState(botResponse.nextState);
      
      // Optionally speak the response
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(botResponse.message);
        window.speechSynthesis.speak(utterance);
      }
    }, 1500);
  };

  // Function to generate bot responses based on conversation state
  const generateBotResponse = (
    userInput: string, 
    currentState: { step: string; data: Record<string, any> }
  ): { 
    message: string; 
    options?: string[]; 
    nextState: { step: string; data: Record<string, any> } 
  } => {
    const input = userInput.toLowerCase();
    const { step, data } = currentState;
    
    // Check for escalation keywords first
    if (input.includes("agent") || input.includes("human") || input.includes("live agent")) {
      return {
        message: "I'll connect you with a live agent. Please wait a moment while I transfer your chat.",
        nextState: { step: "escalated", data }
      };
    }

    switch (step) {
      case "greeting":
        if (input.includes("book") || input.includes("service")) {
          return {
            message: "Great! What type of service would you like to book?",
            options: ["Taxi", "Flight", "Hotel", "Restaurant"],
            nextState: { step: "service_type", data }
          };
        } else if (input.includes("availability") || input.includes("check")) {
          return {
            message: "I can help you check availability. What service are you interested in?",
            options: ["Taxi", "Flight", "Hotel", "Restaurant"],
            nextState: { step: "check_availability", data }
          };
        } else if (input.includes("help")) {
          return {
            message: "I'm here to help! I can assist with booking services, checking availability, or connecting you with a live agent. What would you like help with?",
            options: ["Book a service", "Check availability", "Live agent"],
            nextState: { step: "greeting", data }
          };
        } else {
          return {
            message: "I can help you book services, check availability, or connect you with a live agent. What would you like to do?",
            options: ["Book a service", "Check availability", "Live agent"],
            nextState: { step: "greeting", data }
          };
        }

      case "service_type":
        // Store the selected service type
        const serviceType = input.includes("taxi") ? "taxi" :
                           input.includes("flight") ? "flight" :
                           input.includes("hotel") ? "hotel" :
                           input.includes("restaurant") ? "restaurant" : 
                           "unknown";
        
        if (serviceType === "taxi") {
          return {
            message: "Where would you like to be picked up?",
            nextState: { 
              step: "taxi_pickup", 
              data: { ...data, serviceType } 
            }
          };
        } else if (serviceType === "flight") {
          return {
            message: "Please provide your departure city and destination city.",
            nextState: { 
              step: "flight_details", 
              data: { ...data, serviceType } 
            }
          };
        } else if (serviceType === "hotel") {
          return {
            message: "What city will you be staying in?",
            nextState: { 
              step: "hotel_city", 
              data: { ...data, serviceType } 
            }
          };
        } else if (serviceType === "restaurant") {
          return {
            message: "What type of cuisine are you interested in?",
            options: ["Italian", "Japanese", "Mexican", "Indian", "American"],
            nextState: { 
              step: "restaurant_cuisine", 
              data: { ...data, serviceType } 
            }
          };
        } else {
          return {
            message: "I'm not sure which service you'd like to book. Could you choose one of the following?",
            options: ["Taxi", "Flight", "Hotel", "Restaurant"],
            nextState: { step: "service_type", data }
          };
        }
        
      case "taxi_pickup":
        return {
          message: `Great, I've noted your pickup location: "${userInput}". What's your destination?`,
          nextState: { 
            step: "taxi_destination", 
            data: { ...data, pickupLocation: userInput } 
          }
        };
        
      case "taxi_destination":
        return {
          message: `Thanks! When would you like to be picked up?`,
          options: ["Now", "In 30 minutes", "In 1 hour", "Tomorrow", "Specific time"],
          nextState: { 
            step: "taxi_time", 
            data: { ...data, destination: userInput } 
          }
        };
        
      case "taxi_time":
        return {
          message: `Perfect! I've booked a taxi from ${data.pickupLocation} to ${data.destination} for ${userInput}. Your driver will arrive on time. Is there anything else you'd like help with?`,
          options: ["Book another service", "Check status", "No, thank you"],
          nextState: { 
            step: "completion", 
            data: { ...data, pickupTime: userInput } 
          }
        };
        
      case "check_availability":
        const availService = input.includes("taxi") ? "taxi" :
                            input.includes("flight") ? "flight" :
                            input.includes("hotel") ? "hotel" :
                            input.includes("restaurant") ? "restaurant" : 
                            "unknown";
        
        if (availService === "unknown") {
          return {
            message: "Which service would you like to check availability for?",
            options: ["Taxi", "Flight", "Hotel", "Restaurant"],
            nextState: { step: "check_availability", data }
          };
        } else {
          return {
            message: `I'm checking availability for ${availService} services. When would you need this service?`,
            options: ["Today", "Tomorrow", "This weekend", "Next week", "Specific date"],
            nextState: { 
              step: "availability_date", 
              data: { ...data, serviceType: availService } 
            }
          };
        }
        
      case "availability_date":
        return {
          message: `Great! I can confirm that ${data.serviceType} services are available for ${userInput}. Would you like to proceed with booking?`,
          options: ["Yes, book now", "No, thank you"],
          nextState: { 
            step: "availability_confirmation", 
            data: { ...data, date: userInput } 
          }
        };
        
      case "availability_confirmation":
        if (input.includes("yes") || input.includes("book")) {
          return {
            message: "Excellent! Let's proceed with your booking.",
            options: ["Continue"],
            nextState: { 
              step: "service_type", 
              data: { ...data } 
            }
          };
        } else {
          return {
            message: "No problem! Is there anything else I can help you with?",
            options: ["Book a service", "Check other availability", "No, thank you"],
            nextState: { step: "greeting", data: {} }
          };
        }
        
      case "completion":
      case "escalated":
      default:
        if (input.includes("book") || input.includes("service") || input.includes("another")) {
          return {
            message: "What type of service would you like to book?",
            options: ["Taxi", "Flight", "Hotel", "Restaurant"],
            nextState: { step: "service_type", data: {} }
          };
        } else if (input.includes("check") || input.includes("status")) {
          return {
            message: "Your booking is confirmed and everything is on schedule. Is there anything else you'd like to know?",
            options: ["Book another service", "No, thank you"],
            nextState: { step: "completion", data }
          };
        } else {
          return {
            message: "Thank you for using Abdullah Assistant! Feel free to reach out if you need any assistance in the future.",
            options: ["Book a service", "Check availability"],
            nextState: { step: "greeting", data: {} }
          };
        }
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={toggleTheme}
          className="rounded-full"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </Button>
      </div>

      {/* Chat messages container */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            content={message.content}
            sender={message.sender}
            options={message.options}
            onOptionClick={handleOptionClick}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleToggleListening} 
            className={`rounded-full ${isListening ? 'bg-primary text-primary-foreground' : ''}`}
          >
            <Mic size={20} />
          </Button>
          <Input
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button 
            size="icon"
            onClick={() => handleSendMessage()}
            disabled={!inputText.trim()}
            className="rounded-full"
          >
            <Send size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
