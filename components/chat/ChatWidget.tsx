'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User,
  Minimize2,
  Maximize2,
  Sparkles
} from 'lucide-react'
import SmartSuggestions from './SmartSuggestions'

interface Message {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  intent?: string
  confidence?: number
  suggestions?: string[]
  context?: any[]
  method?: string
}

interface ChatWidgetProps {
  className?: string
  userId?: string
}

export default function ChatWidget({ className = '', userId = 'default' }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus()
    }
  }, [isOpen, isMinimized])

  // Clear conversations when component unmounts (page refresh/close)
  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (isOpen) {
        try {
          await fetch('/api/nlp/clear-conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.error('Error clearing conversations on unload:', error)
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isOpen])

  // Clear conversations when user logs out (session changes)
  useEffect(() => {
    const handleLogout = async () => {
      if (isOpen) {
        try {
          await fetch('/api/nlp/clear-conversations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        } catch (error) {
          console.error('Error clearing conversations on logout:', error)
        }
      }
    }

    // Listen for storage changes (logout clears session storage)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'next-auth.session-token' && e.newValue === null) {
        handleLogout()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [isOpen])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Try ML-enhanced service first
      let response = await fetch('/api/nlp/parse-v3', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: userMessage.content }),
      })

      let result
      if (response.ok) {
        result = await response.json()
      } else {
        // Fallback to basic service
        response = await fetch('/api/nlp/parse-v2', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ query: userMessage.content }),
        })

        if (!response.ok) {
          throw new Error('Failed to process query')
        }
        result = await response.json()
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: result.response,
        timestamp: new Date(),
        intent: result.intent,
        confidence: result.confidence,
        suggestions: result.suggestions,
        context: result.context,
        method: result.method
      }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I couldn't process that request. Please try again.",
        timestamp: new Date(),
        intent: 'error',
        confidence: 1.0
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const toggleChat = async () => {
    if (isOpen) {
      // Closing chat - clear conversations from database
      try {
        await fetch('/api/nlp/clear-conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (error) {
        console.error('Error clearing conversations:', error)
      }
    }
    
    setIsOpen(!isOpen)
    setIsMinimized(false)
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  const clearChat = async () => {
    setMessages([])
    
    // Clear chat history from database
    try {
      await fetch('/api/nlp/clear-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Error clearing conversations:', error)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <Button
          onClick={toggleChat}
          className="rounded-full h-14 w-14 shadow-xl"
          size="icon"
        >
          <MessageCircle className="h-7 w-7" />
        </Button>
      </div>
    )
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Card className={`w-96 shadow-xl transition-all duration-300 ${
        isMinimized ? 'h-16' : 'h-[600px]'
      }`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Ask Crank
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="h-8 w-8 p-0"
                title="Smart Suggestions"
              >
                <Sparkles className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMinimize}
                className="h-8 w-8 p-0"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex flex-col h-[calc(100%-4rem)] p-0">
            {/* Smart Suggestions */}
            {showSuggestions && (
              <div className="border-b p-4 max-h-64 overflow-y-auto">
                <SmartSuggestions 
                  userId={userId} 
                  onSuggestionClick={handleSuggestionClick}
                />
              </div>
            )}
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                  <Bot className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-semibold mb-2">Hi! I'm Crank's AI assistant</h3>
                  <p className="text-sm mb-4">Ask me about your finances!</p>
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-400">Try asking:</p>
                    <div className="space-y-1">
                      <p className="text-xs">"How much did I spend on dining last month?"</p>
                      <p className="text-xs">"What did I save this month?"</p>
                      <p className="text-xs">"Show me my entertainment spending"</p>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-4 py-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {message.type === 'bot' && (
                          <Bot className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        )}
                        {message.type === 'user' && (
                          <User className="h-5 w-5 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          {message.context && message.context.length > 0 && (
                            <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                              <p className="font-medium text-blue-800 mb-1">Context:</p>
                              <div className="space-y-1">
                                {message.context.slice(-2).map((ctx, idx) => (
                                  <p key={idx} className="text-blue-700">
                                    "{ctx.query}" → {ctx.intent}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}
                          {message.suggestions && message.suggestions.length > 0 && message.intent === 'unknown' && (
                            <div className="mt-2">
                              <p className="text-xs font-medium mb-2">Try asking:</p>
                              <div className="flex flex-wrap gap-1">
                                {message.suggestions.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    onClick={() => setInputValue(suggestion)}
                                    className="text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-gray-700 transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-3 flex items-center gap-3">
                    <Bot className="h-5 w-5" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Fixed at Bottom */}
            <div className="border-t bg-white p-4">
              <div className="flex gap-3">
                <Input
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask about your finances..."
                  disabled={isLoading}
                  className="flex-1 h-11"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading}
                  size="icon"
                  className="h-11 w-11"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {messages.length > 0 && (
                <div className="mt-3 flex justify-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Clear chat
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}