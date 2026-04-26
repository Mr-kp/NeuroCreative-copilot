import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Sparkles,
  User,
  Bot,
  Upload,
  Wrench,
  Loader2,
  Brain,
} from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { copilotChat } from "../../lib/copilotApi";
import type { CopilotAnalysis, ChatMessage } from "../../types/copilot";

interface Props {
  analyses: CopilotAnalysis[];
  activeAnalysis: CopilotAnalysis | null;
  onUploadMore: (file: File) => void;
}

const SUGGESTIONS = [
  "Explain my brain scores",
  "What should I improve?",
  "When will fatigue hit?",
  "Give me the executive summary",
];

export function CopilotChat({ analyses, activeAnalysis, onUploadMore }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [toolCallLabel, setToolCallLabel] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  useEffect(() => {
    if (activeAnalysis && analyses.length > 0) {
      setMessages((prev) => {
        if (prev.length > 0) return prev;
        return [
          {
            role: "assistant",
            text: `I've analyzed **${activeAnalysis.filename}**. Grade: **${activeAnalysis.executive_summary.grade}** (${activeAnalysis.executive_summary.overall_score}/100).\n\nBrain scores: attention=${activeAnalysis.brain_scores.attention}, reward=${activeAnalysis.brain_scores.reward}, memory=${activeAnalysis.brain_scores.memory}, emotion=${activeAnalysis.brain_scores.emotion}, visualLoad=${activeAnalysis.brain_scores.visualLoad}.\n\nStatus: **${activeAnalysis.ml_prediction.status}**, fatigue risk: **${Math.round(activeAnalysis.ml_prediction.fatigue_probability * 100)}%**.\n\nAsk me anything about this creative!`,
            timestamp: Date.now(),
          },
        ];
      });
    }
  }, [activeAnalysis?.id]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = text || input.trim();
      if (!msg || isStreaming) return;

      const userMsg: ChatMessage = { role: "user", text: msg, timestamp: Date.now() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsStreaming(true);
      setToolCallLabel(null);

      const assistantMsg: ChatMessage = {
        role: "assistant",
        text: "",
        timestamp: Date.now(),
        toolCalls: [],
      };
      setMessages((prev) => [...prev, assistantMsg]);

      try {
        await copilotChat(
          msg,
          analyses.map((a) => a.id),
          [],
          {
            onToken: (t) => {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  updated[updated.length - 1] = { ...last, text: last.text + t };
                }
                return updated;
              });
            },
            onToolCall: (name, label) => {
              setToolCallLabel(label);
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === "assistant") {
                  const tc = last.toolCalls || [];
                  updated[updated.length - 1] = {
                    ...last,
                    toolCalls: [...tc, { name, label }],
                  };
                }
                return updated;
              });
            },
            onToolResult: () => {
              setToolCallLabel(null);
            },
            onThinking: () => {},
            onDone: () => {
              setIsStreaming(false);
              setToolCallLabel(null);
            },
            onError: (err) => {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  text: `Error: ${err}`,
                  isError: true,
                };
                return updated;
              });
              setIsStreaming(false);
            },
          },
        );
      } catch (e: any) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: `Connection error: ${e.message}`,
            isError: true,
          };
          return updated;
        });
        setIsStreaming(false);
      }
    },
    [input, isStreaming, analyses],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUploadMore(file);
    e.target.value = "";
  };

  return (
    <Card className="flex h-full flex-col border-border/50 bg-card/80 backdrop-blur">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Brain className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Copilot Agent</span>
        {analyses.length > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            {analyses.length} creative{analyses.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <ScrollArea className="flex-1 p-4" innerRef={scrollRef}>
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center gap-4 py-12 text-center">
            <Sparkles className="h-8 w-8 text-primary/40" />
            <p className="text-sm text-muted-foreground">
              {analyses.length > 0
                ? "Ask me about your creative analysis"
                : "Upload a creative to get started"}
            </p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3 w-3 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : msg.isError
                      ? "bg-red-500/10 text-red-400"
                      : "bg-muted"
                }`}
              >
                {msg.text || (
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {toolCallLabel || "Thinking..."}
                  </span>
                )}
              </div>
              {msg.role === "user" && (
                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </ScrollArea>

      {messages.length <= 1 && analyses.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              disabled={isStreaming}
              className="rounded-full border border-border/50 bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground disabled:opacity-50"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="border-t p-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder={
              analyses.length > 0
                ? "Ask about your creative..."
                : "Upload a creative first..."
            }
            disabled={isStreaming || analyses.length === 0}
            className="flex-1 rounded-lg border border-border/50 bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 disabled:opacity-50"
          />
          <input
            id="chat-upload-input"
            type="file"
            accept="image/*,video/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              document.getElementById("chat-upload-input")?.click()
            }
            title="Upload another creative"
          >
            <Upload className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            onClick={() => sendMessage()}
            disabled={isStreaming || !input.trim()}
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
