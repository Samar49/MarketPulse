import { useEffect, useRef, useState } from "react";

import { sendChatMessage } from "../services/marketApi";

// Format AI response text into JSX blocks
function formatAIResponse(text) {
  if (!text) return null;

  const cleanedText = text
    .replace(/\r\n/g, "\n")
    .replace(/\*\*\*/g, "")
    .replace(/```/g, "")
    .trim();

  const lines = cleanedText.split("\n");

  return lines.map((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return <div key={index} className="ai-response-space" />;
    }

    if (trimmed.startsWith("### ")) {
      return (
        <h4 key={index} className="ai-response-heading">
          {formatInlineMarkdown(trimmed.substring(4))}
        </h4>
      );
    }

    if (trimmed.startsWith("## ")) {
      return (
        <h4 key={index} className="ai-response-heading">
          {formatInlineMarkdown(trimmed.substring(3))}
        </h4>
      );
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
      return (
        <div key={index} className="ai-response-bullet">
          <span className="ai-bullet-dot"></span>
          <p>{formatInlineMarkdown(trimmed.substring(2))}</p>
        </div>
      );
    }

    const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);

    if (numberedMatch) {
      return (
        <div key={index} className="ai-response-numbered">
          <span>{numberedMatch[1]}</span>
          <p>{formatInlineMarkdown(numberedMatch[2])}</p>
        </div>
      );
    }

    return (
      <p key={index} className="ai-response-paragraph">
        {formatInlineMarkdown(trimmed)}
      </p>
    );
  });
}

// Format inline **bold** markdown
function formatInlineMarkdown(text) {
  const parts = text.split(/(\*\*.*?\*\*)/);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }

    return <span key={index}>{part}</span>;
  });
}

// Map tool names to human-readable labels
function getToolLabel(tool) {
  const labels = {
    getMarketOverview: "Market Overview",
    getSectorPerformance: "Sector Performance",
    getInstitutionalFlows: "FII / DII",
    getLatestNews: "Financial News",
    getMarketMovers: "Market Movers",
    getStockPerformance: "Stock Data",
    compareStocks: "Stock Comparison",
  };

  return labels[tool] || tool.replace("get", "").replace(/([A-Z])/g, " $1").trim();
}

const QUICK_QUESTIONS = [
  { label: "Why is NIFTY moving?", prompt: "Why is NIFTY moving today?" },
  { label: "Strongest sectors", prompt: "Which sectors are strongest today?" },
  { label: "FII / DII flows", prompt: "What are the latest FII and DII flows?" },
  { label: "Top gainers", prompt: "Which stocks are the top gainers today?" },
  { label: "Market news", prompt: "What are today's major market news drivers?" },
  { label: "Compare TCS vs Reliance", prompt: "Compare TCS and Reliance" },
];

const MarketPulseAI = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([
    {
      id: Date.now(),
      role: "assistant",
      content:
        "Good morning. I'm MarketPulse AI. Ask me about the market, sectors, FII/DII flows, stocks, news, or market movers.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    const container = chatBodyRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });
  }, [messages, loading]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [message]);

  const sendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || loading) return;

    const userMessage = { id: Date.now(), role: "user", content: trimmedMessage };

    setMessages((previous) => [...previous, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const aiData = await sendChatMessage(trimmedMessage);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: aiData.answer,
          toolsUsed: aiData.toolsUsed || [],
          model: aiData.model,
        },
      ]);
    } catch (error) {
      console.error("AI chat error:", error);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "assistant",
          error: true,
          content: "I couldn't retrieve the required market data right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const useSuggestion = (text) => {
    setMessage(text);
    inputRef.current?.focus();
  };

  return (
    <section className="ai-chat-section">
      {/* Header */}
      <div className="ai-chat-header">
        <div className="ai-header-left">
          <div className="ai-logo">
            <img src="/logo2.png" alt="MarketPulse AI" />
          </div>

          <div>
            <div className="ai-title-row">
              <h2>MarketPulse AI</h2>
              <span className="ai-version">BETA</span>
            </div>
            <p>Market intelligence powered by your market data</p>
          </div>
        </div>

        <div className="ai-status">
          <span className="ai-status-dot"></span>
          <span>Ready</span>
        </div>
      </div>

      {/* Chat body */}
      <div className="ai-chat-body" ref={chatBodyRef}>
        <div className="ai-messages">
          {messages.map((chat) => (
            <div
              key={chat.id}
              className={
                chat.role === "user"
                  ? "ai-message ai-message-user"
                  : "ai-message ai-message-assistant"
              }
            >
              {chat.role === "user" ? (
                <div className="ai-user-row">
                  <div className="ai-user-bubble">{chat.content}</div>
                </div>
              ) : (
                <div
                  className={
                    chat.error ? "ai-assistant-message ai-assistant-error" : "ai-assistant-message"
                  }
                >
                  <div className="ai-assistant-content">
                    <div className="ai-assistant-top">
                      <div className={chat.error ? "ai-avatar ai-avatar-error" : "ai-avatar"}>
                        <img src="/logo2.png" alt="MarketPulse AI" />
                      </div>

                      <div className="ai-assistant-name">
                        <span>MarketPulse AI</span>
                        {!chat.error && <small>Intelligence</small>}
                      </div>
                    </div>

                    <div className="ai-response">{formatAIResponse(chat.content)}</div>

                    {!chat.error && chat.toolsUsed && chat.toolsUsed.length > 0 && (
                      <div className="ai-data-sources">
                        <span className="ai-source-label">Based on</span>
                        <div className="ai-source-pills">
                          {chat.toolsUsed.map((tool) => (
                            <span key={tool} className="ai-source-pill">
                              {getToolLabel(tool)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Thinking indicator */}
          {loading && (
            <div className="ai-message ai-message-assistant">
              <div className="ai-assistant-message">
                <div className="ai-assistant-content">
                  <div className="ai-assistant-top">
                    <div className="ai-avatar ai-avatar-thinking">
                      <img src="/logo2.png" alt="MarketPulse AI" />
                    </div>

                    <div className="ai-assistant-name">
                      <span>MarketPulse AI</span>
                      <small>Working</small>
                    </div>
                  </div>

                  <div className="ai-thinking">
                    <span className="thinking-text">Analyzing market data</span>
                    <div className="thinking-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick questions */}
        {!loading && messages.length <= 2 && (
          <div className="ai-suggestions">
            <div className="ai-suggestions-title">Try asking</div>
            <div className="ai-suggestions-list">
              {QUICK_QUESTIONS.map((question) => (
                <button
                  key={question.prompt}
                  type="button"
                  onClick={() => useSuggestion(question.prompt)}
                >
                  {question.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Input */}
      <div className="ai-input-area">
        <div className="ai-input-wrapper">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              loading
                ? "MarketPulse AI is analyzing..."
                : "Ask about NIFTY, stocks, sectors, FII/DII or news..."
            }
            rows={1}
            disabled={loading}
          />
          <button
            type="button"
            className="ai-send-button"
            onClick={sendMessage}
            disabled={loading || !message.trim()}
            aria-label="Send message"
          >
            {loading ? <span className="ai-send-spinner"></span> : "↑"}
          </button>
        </div>
        <div className="ai-input-hint">
          <span>Enter to send</span>
          <span>Shift + Enter for new line</span>
        </div>
      </div>
      {/* Footer */}
      <div className="ai-footer">
        <span>Responses are grounded in MarketPulse data.</span>
      </div>
    </section>
  );
};
export default MarketPulseAI;