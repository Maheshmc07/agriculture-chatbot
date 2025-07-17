// File: src/App.jsx

import { useState, useEffect, useRef } from 'react';
import './App.css';

function App() {
  // Replace 'YOUR_GEMINI_API_KEY_HERE' with your actual Gemini API key
  const API_KEY = 'API_KEY ';
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { 
      role: 'bot', 
      content: 'Hello! I\'m your agricultural assistant. Ask me about plant diseases, farming practices, or any agricultural questions you may have.' 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  
  // Suggested questions for users to quickly select
  const suggestions = [
    "How do I identify tomato blight?",
    "What are natural ways to control aphids?",
    "How to improve soil fertility organically?",
    "Signs of nutrient deficiency in corn plants",
    "Best practices for crop rotation"
  ];
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSuggestionClick = (suggestion) => {
    setInput(suggestion);
    setShowSuggestions(false);
    // Optional: immediately submit the suggestion
    handleSubmit(null, suggestion);
  };

  const handleSubmit = async (e, suggestionText = null) => {
    if (e) e.preventDefault();
    
    const textToSend = suggestionText || input;
    if (!textToSend.trim()) return;
    
    // Add user message to chat
    const userMessage = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      // Using the model from your curl example
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are an agricultural expert; give helpful, accurate, and concise farming advice in simple words, using a maximum of 12 short bullet points.


                  User question: ${textToSend}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          }
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message || 'Error communicating with Gemini API');
      }

      // Extract response text
      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 
        "I'm sorry, I couldn't generate a response. Please try again.";
      
      // Add bot response to chat
      setMessages(prev => [...prev, { role: 'bot', content: botResponse }]);
      
      // Show suggestions again after bot response
      setTimeout(() => {
        setShowSuggestions(true);
      }, 500);
      
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: `Error: ${error.message || 'Failed to communicate with the Gemini API. Please check your API key.'}`
      }]);
      setShowSuggestions(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Agricultural Assistant</h1>
      </header>

      <div className="messages-container">
        {messages.map((msg, index) => (
          <div 
            key={index} 
            className={`message ${msg.role === 'user' ? 'user-message' : 'bot-message'} animate-in`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="message-bubble">
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message bot-message animate-in">
            <div className="message-bubble loading">
              <div className="loading-dots">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {showSuggestions && messages.length < 6 && (
        <div className="suggestions-container">
          <p className="suggestions-title">Try asking about:</p>
          <div className="suggestions-list">
            {suggestions.map((suggestion, index) => (
              <button 
                key={index}
                className="suggestion-chip animate-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about plant diseases, farming techniques, etc."
          disabled={isLoading}
          className="input-field"
        />
        <button 
          type="submit" 
          disabled={isLoading || !input.trim()}
          className={`submit-button ${isLoading ? 'loading' : ''}`}
        >
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}

export default App;
