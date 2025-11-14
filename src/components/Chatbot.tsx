import { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  HelpCircle
} from 'lucide-react';
import { searchKnowledge, getRandomSuggestions } from '../utils/chatbotKnowledge';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function Chatbot({ isOpen, onToggle, className = "" }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: "👋 Hi! I'm your GaavConnect assistant. I can help you with route planning, features, troubleshooting, and more. What would you like to know?",
        timestamp: new Date(),
        suggestions: getRandomSuggestions(3)
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const generateBotResponse = (userQuery: string): string => {
    const results = searchKnowledge(userQuery);
    
    if (results.length === 0) {
      return "I'm sorry, I couldn't find specific information about that. Here are some things I can help you with:\n\n• Route planning and optimization\n• Adding multiple destinations\n• Transport modes and pricing\n• Technical features and troubleshooting\n• Account and data security\n• Crowd reporting\n\nTry asking about any of these topics, or contact our support team for more detailed assistance.";
    }

    // Return the best match
    const bestMatch = results[0];
    let response = bestMatch.answer;

    // If there are multiple good matches, mention alternatives
    if (results.length > 1) {
      response += "\n\n💡 Related topics you might be interested in:";
      results.slice(1, 3).forEach((item) => {
        response += `\n• ${item.question}`;
      });
    }

    return response;
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay for better UX
    setTimeout(() => {
      const botResponse = generateBotResponse(content.trim());
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: botResponse,
        timestamp: new Date(),
        suggestions: getRandomSuggestions(3)
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000); // Random delay between 1-2 seconds
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const clearChat = () => {
    setMessages([]);
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: "👋 Chat cleared! How can I help you with GaavConnect today?",
      timestamp: new Date(),
      suggestions: getRandomSuggestions(3)
    };
    setMessages([welcomeMessage]);
  };

  const formatMessageContent = (content: string) => {
    // Split by newlines and render with proper formatting
    return content.split('\n').map((line, index) => {
      if (line.startsWith('•')) {
        return (
          <div key={index} className="ml-4 mb-1">
            <span className="text-[#6A0DAD] mr-2">•</span>
            {line.substring(1).trim()}
          </div>
        );
      }
      if (line.startsWith('💡')) {
        return (
          <div key={index} className="mt-3 mb-2 font-medium text-[#6A0DAD]">
            {line}
          </div>
        );
      }
      if (line.trim() === '') {
        return <div key={index} className="mb-2"></div>;
      }
      return (
        <div key={index} className="mb-1">
          {line}
        </div>
      );
    });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white shadow-lg z-50 ${className}`}
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed bottom-6 right-6 w-96 bg-white border-[#E6E6FA] shadow-xl z-50 ${className} ${isMinimized ? 'h-16' : 'h-[500px]'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#E6E6FA] bg-gradient-to-r from-[#6A0DAD] to-[#8B2DC2] text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">GaavConnect Assistant</h3>
            <p className="text-xs text-purple-100">
              {isTyping ? 'Typing...' : 'Online'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            onClick={() => setIsMinimized(!isMinimized)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 w-8 h-8 p-0"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button
            onClick={clearChat}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 w-8 h-8 p-0"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20 w-8 h-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-80">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {message.type === 'bot' && (
                  <div className="w-8 h-8 bg-[#6A0DAD] rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] ${message.type === 'user' ? 'order-first' : ''}`}>
                  <div className={`p-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-[#6A0DAD] text-white ml-auto' 
                      : 'bg-[#F5F3FF] text-gray-800'
                  }`}>
                    <div className="text-sm">
                      {formatMessageContent(message.content)}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 px-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {/* Suggestions */}
                  {message.type === 'bot' && message.suggestions && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-600 px-2">💡 Try asking:</p>
                      {message.suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          variant="outline"
                          size="sm"
                          className="text-xs border-[#E6E6FA] text-[#6A0DAD] hover:bg-[#F5F3FF] mr-2 mb-2"
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-[#8B2DC2] rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-[#6A0DAD] rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#F5F3FF] p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-[#6A0DAD] rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-[#6A0DAD] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-[#6A0DAD] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#E6E6FA]">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
                placeholder="Ask me anything about GaavConnect..."
                className="flex-1 px-3 py-2 border border-[#E6E6FA] rounded-lg focus:outline-none focus:border-[#6A0DAD] text-sm"
                disabled={isTyping}
              />
              <Button
                onClick={() => handleSendMessage(inputValue)}
                disabled={!inputValue.trim() || isTyping}
                className="bg-[#6A0DAD] hover:bg-[#8B2DC2] text-white px-3"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <HelpCircle className="w-3 h-3 text-gray-400" />
              <p className="text-xs text-gray-500">
                Ask about features, routes, troubleshooting, or pricing
              </p>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
