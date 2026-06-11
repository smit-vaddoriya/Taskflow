import React, { useState, useRef, useEffect } from "react";
import {
  Zap,
  X,
  Send,
  Loader2,
  Minimize2,
  Maximize2,
  Check,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import apiClient from "../../services/apiClient";
import { useAuthStore } from "../../store/authStore";
import { useProjects } from "../../hooks/useOrg";
import { useBoards, useCreateTask } from "../../services/task.service";
import { PriorityBadge } from "../ui/Badge";
import { clsx } from "clsx";
import toast from "react-hot-toast";
import type { ParsedTask } from "../../types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  type: "text" | "task_preview";
  parsedTask?: ParsedTask;
}

interface Props {
  onClose?: () => void;
  floating?: boolean;
}

const QUICK_PROMPTS = [
  { icon: "🔴", text: "What's overdue?" },
  { icon: "📋", text: "Show my tasks" },
  { icon: "📊", text: "Team velocity" },
  { icon: "✨", text: "Create a task" },
];

export default function AIAssistant({ onClose, floating = false }: Props) {
  const [isOpen, setIsOpen] = useState(!floating);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      type: "text",
      content:
        'Hey! I\'m your AI assistant. Ask me about your tasks, or say something like "create a task to fix the login bug" to get started.',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, currentOrg } = useAuthStore();
  const { data: projects = [] } = useProjects();
  const { data: boards = [] } = useBoards(selectedProjectId);
  const createTask = useCreateTask();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const { data: taskContext } = useQuery({
    queryKey: ["ai-context", currentOrg?.id],
    queryFn: async () => {
      const [overviewRes, tasksRes] = await Promise.all([
        apiClient.get("/analytics/overview"),
        apiClient.get(`/tasks?assigneeId=${user?.id}`),
      ]);
      const overview = overviewRes.data.data;
      const myTasks = tasksRes.data.data.slice(0, 30).map((t: any) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
      }));
      return { ...overview, myTasks };
    },
    enabled: !!currentOrg && isOpen,
    staleTime: 30_000,
  });

  const addMessage = (msg: Omit<Message, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now().toString() }]);
  };

  const sendMessage = async (text?: string) => {
    const messageText = text ?? input.trim();
    if (!messageText || loading) return;

    setInput("");
    setLoading(true);

    addMessage({ role: "user", type: "text", content: messageText });

    const createKeywords = [
      "create",
      "add task",
      "new task",
      "add a task",
      "make a task",
      "create a task",
    ];
    const taskQueryKeywords = [
      "overdue",
      "in progress",
      "todo",
      "my tasks",
      "completed",
      "velocity",
      "how many",
      "show me",
      "list",
      "what tasks",
      "status",
    ];

    const isCreateIntent = createKeywords.some((k) =>
      messageText.toLowerCase().includes(k),
    );
    const isTaskQuery = taskQueryKeywords.some((k) =>
      messageText.toLowerCase().includes(k),
    );

    try {
      if (isCreateIntent) {
        const { data } = await apiClient.post("/ai/parse-task", {
          input: messageText,
        });
        addMessage({
          role: "assistant",
          type: "task_preview",
          content: "Here's what I parsed:",
          parsedTask: data.data as ParsedTask,
        });
      } else {
        // Only include task data when user is actually asking about tasks
        const taskContextStr = isTaskQuery
          ? `Workspace stats: total=${taskContext?.totalTasks ?? 0}, done=${taskContext?.completedTasks ?? 0}, inProgress=${taskContext?.inProgressTasks ?? 0}, overdue=${taskContext?.overdueTasks ?? 0}. My tasks: ${JSON.stringify(taskContext?.myTasks ?? [])}`
          : "";

        const system = `You are TaskFlow AI — a smart, friendly assistant built into a project management app.

${taskContextStr}

RULES:
- Be natural and conversational. Match the user's tone.
- ONLY mention task stats or workspace data if the user explicitly asks about their tasks.
- If someone says they don't need help, just acknowledge briefly and stop. Do NOT list stats.
- Never repeat workspace stats unless directly asked.
- If someone says "nope", "no", "no thanks", "I'm done", "bye" — reply with one short sentence and stop.
- Keep responses SHORT for short messages. No bullet points for simple replies.
- For casual chat, respond like a helpful colleague — not a bot.
- Only mention task management features when the user is clearly asking about tasks.
- NEVER volunteer workspace stats unprompted.`;

        const { data } = await apiClient.post("/ai/chat", {
          systemPrompt: system,
          message: messageText,
        });
        addMessage({
          role: "assistant",
          type: "text",
          content: data.data.reply,
        });
      }
    } catch {
      addMessage({
        role: "assistant",
        type: "text",
        content: "Connection issue. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (parsedTask: ParsedTask) => {
    if (!selectedBoardId) {
      toast.error("Please select a project and board first");
      return;
    }
    await createTask.mutateAsync({
      boardId: selectedBoardId,
      title: parsedTask.title,
      description: parsedTask.description,
      priority: parsedTask.priority,
      status: "TODO",
      dueDate: parsedTask.dueDate,
    });
    addMessage({
      role: "assistant",
      type: "text",
      content: `✅ Task "${parsedTask.title}" created!`,
    });
  };

  if (floating && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary-600 hover:bg-primary-500 rounded-full flex items-center justify-center shadow-2xl shadow-primary-900/50 transition-all hover:scale-110 z-50 group"
        title="AI Assistant"
      >
        <Zap className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
      </button>
    );
  }

  const chatContent = (
    <ChatContent
      messages={messages}
      loading={loading}
      input={input}
      setInput={setInput}
      sendMessage={sendMessage}
      inputRef={inputRef}
      messagesEndRef={messagesEndRef}
      projects={projects}
      boards={boards}
      selectedProjectId={selectedProjectId}
      setSelectedProjectId={setSelectedProjectId}
      selectedBoardId={selectedBoardId}
      setSelectedBoardId={setSelectedBoardId}
      handleCreateTask={handleCreateTask}
      createTaskLoading={createTask.isPending}
    />
  );

  if (!floating) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div style={{ position: "absolute", inset: 0 }} onClick={onClose} />
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "560px",
            height: "580px",
            background: "#111827",
            border: "1px solid #1f2937",
            borderRadius: "20px",
            boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "scaleIn 0.2s ease-out",
          }}
        >
          <ChatHeader isMinimized={false} onClose={onClose ?? (() => {})} />
          {chatContent}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 50,
        width: isMinimized ? "260px" : "380px",
        height: isMinimized ? "48px" : "540px",
        background: "#111827",
        border: "1px solid #1f2937",
        borderRadius: "20px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transition: "all 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      <ChatHeader
        isMinimized={isMinimized}
        onMinimize={() => setIsMinimized(!isMinimized)}
        onClose={() => setIsOpen(false)}
      />
      {!isMinimized && chatContent}
    </div>
  );
}

function ChatHeader({
  isMinimized,
  onMinimize,
  onClose,
}: {
  isMinimized: boolean;
  onMinimize?: () => void;
  onClose: () => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        padding: "0 16px",
        height: "48px",
        borderBottom: isMinimized ? "none" : "1px solid #1f2937",
        flexShrink: 0,
        background: "#0d1117",
      }}
    >
      <div
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 0 12px rgba(124,58,237,0.5)",
        }}
      >
        <Zap size={14} color="white" fill="white" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#f1f5f9",
            lineHeight: 1,
          }}
        >
          AI Assistant
        </p>
        {!isMinimized && (
          <p style={{ fontSize: "10px", color: "#374151", marginTop: "2px" }}>
            Powered by Groq
          </p>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        {onMinimize && (
          <button
            onClick={onMinimize}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#374151",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#141b2d";
              e.currentTarget.style.color = "#6b7280";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#374151";
            }}
          >
            {isMinimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
        )}
        <button
          onClick={onClose}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "8px",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#374151",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#141b2d";
            e.currentTarget.style.color = "#6b7280";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "#374151";
          }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

function ChatContent({
  messages,
  loading,
  input,
  setInput,
  sendMessage,
  inputRef,
  messagesEndRef,
  projects,
  boards,
  selectedProjectId,
  setSelectedProjectId,
  selectedBoardId,
  setSelectedBoardId,
  handleCreateTask,
  createTaskLoading,
}: any) {
  return (
    <>
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.map((msg: Message) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            {msg.role === "assistant" && (
              <div
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              >
                <Zap size={12} color="white" fill="white" />
              </div>
            )}
            <div
              style={{
                maxWidth: "82%",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius:
                    msg.role === "user"
                      ? "18px 18px 4px 18px"
                      : "18px 18px 18px 4px",
                  background:
                    msg.role === "user"
                      ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
                      : "#1a2235",
                  border: msg.role === "user" ? "none" : "1px solid #252d3d",
                  fontSize: "13px",
                  color: msg.role === "user" ? "white" : "#d1d5db",
                  lineHeight: 1.6,
                }}
              >
                {msg.content.split("\n").map((line: string, i: number) => (
                  <p key={i} style={{ margin: i > 0 ? "4px 0 0" : "0" }}>
                    {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                  </p>
                ))}
              </div>

              {/* Task preview card */}
              {msg.type === "task_preview" && msg.parsedTask && (
                <div
                  style={{
                    background: "#0d1117",
                    border: "1px solid rgba(124,58,237,0.3)",
                    borderRadius: "14px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <Zap size={12} color="#8b5cf6" />
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#7c3aed",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Parsed Task
                    </span>
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#f1f5f9",
                        marginBottom: "4px",
                      }}
                    >
                      {msg.parsedTask.title}
                    </p>
                    {msg.parsedTask.description && (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          lineHeight: 1.5,
                        }}
                      >
                        {msg.parsedTask.description}
                      </p>
                    )}
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        marginTop: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <PriorityBadge priority={msg.parsedTask.priority} />
                      {msg.parsedTask.dueDate && (
                        <span
                          style={{
                            fontSize: "11px",
                            color: "#6b7280",
                            background: "#141b2d",
                            padding: "3px 8px",
                            borderRadius: "99px",
                            border: "1px solid #252d3d",
                          }}
                        >
                          📅 {msg.parsedTask.dueDate}
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                    }}
                  >
                    <select
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                      style={{
                        background: "#141b2d",
                        border: "1px solid #252d3d",
                        borderRadius: "8px",
                        padding: "7px 10px",
                        fontSize: "12px",
                        color: "#94a3b8",
                        outline: "none",
                        cursor: "pointer",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#7c3aed";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#252d3d";
                      }}
                    >
                      <option value="" style={{ background: "#111827" }}>
                        Project...
                      </option>
                      {projects.map((p: any) => (
                        <option
                          key={p.id}
                          value={p.id}
                          style={{ background: "#111827" }}
                        >
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={selectedBoardId}
                      onChange={(e) => setSelectedBoardId(e.target.value)}
                      disabled={!selectedProjectId}
                      style={{
                        background: "#141b2d",
                        border: "1px solid #252d3d",
                        borderRadius: "8px",
                        padding: "7px 10px",
                        fontSize: "12px",
                        color: "#94a3b8",
                        outline: "none",
                        cursor: selectedProjectId ? "pointer" : "not-allowed",
                        opacity: selectedProjectId ? 1 : 0.5,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#7c3aed";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#252d3d";
                      }}
                    >
                      <option value="" style={{ background: "#111827" }}>
                        Board...
                      </option>
                      {boards.map((b: any) => (
                        <option
                          key={b.id}
                          value={b.id}
                          style={{ background: "#111827" }}
                        >
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => handleCreateTask(msg.parsedTask)}
                    disabled={!selectedBoardId || createTaskLoading}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      padding: "10px",
                      borderRadius: "10px",
                      border: "none",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: selectedBoardId ? "pointer" : "not-allowed",
                      background: selectedBoardId
                        ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
                        : "#252d3d",
                      color: selectedBoardId ? "white" : "#4b5563",
                      transition: "all 0.15s",
                      boxShadow: selectedBoardId
                        ? "0 2px 10px rgba(124,58,237,0.4)"
                        : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (selectedBoardId)
                        e.currentTarget.style.filter = "brightness(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.filter = "none";
                    }}
                  >
                    {createTaskLoading ? (
                      <>
                        <Loader2
                          size={14}
                          style={{ animation: "spin 1s linear infinite" }}
                        />{" "}
                        Creating...
                      </>
                    ) : (
                      <>
                        <Check size={14} /> Create Task
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-end" }}>
            <div
              style={{
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7c3aed, #5b21b6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Zap size={12} color="white" fill="white" />
            </div>
            <div
              style={{
                background: "#1a2235",
                border: "1px solid #252d3d",
                borderRadius: "18px 18px 18px 4px",
                padding: "12px 16px",
                display: "flex",
                gap: "4px",
                alignItems: "center",
              }}
            >
              <span
                className="animate-bounce-1"
                style={{
                  width: "6px",
                  height: "6px",
                  background: "#4b5563",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              />
              <span
                className="animate-bounce-2"
                style={{
                  width: "6px",
                  height: "6px",
                  background: "#4b5563",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              />
              <span
                className="animate-bounce-3"
                style={{
                  width: "6px",
                  height: "6px",
                  background: "#4b5563",
                  borderRadius: "50%",
                  display: "inline-block",
                }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      <div
        style={{
          padding: "0 12px 8px",
          display: "flex",
          gap: "6px",
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.text}
            onClick={() => sendMessage(p.text)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 10px",
              borderRadius: "99px",
              border: "1px solid #252d3d",
              background: "#141b2d",
              fontSize: "11px",
              color: "#4b5563",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#7c3aed";
              e.currentTarget.style.color = "#a78bfa";
              e.currentTarget.style.background = "rgba(124,58,237,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#252d3d";
              e.currentTarget.style.color = "#4b5563";
              e.currentTarget.style.background = "#141b2d";
            }}
          >
            <span>{p.icon}</span>
            <span>{p.text}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: "8px 12px 12px", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            gap: "8px",
            background: "#141b2d",
            border: "1px solid #252d3d",
            borderRadius: "14px",
            padding: "6px 8px",
            transition: "border-color 0.2s",
          }}
          onFocusCapture={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor = "#7c3aed")
          }
          onBlurCapture={(e) =>
            ((e.currentTarget as HTMLElement).style.borderColor = "#252d3d")
          }
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask anything or create a task..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: "13px",
              color: "#e2e8f0",
              padding: "4px 6px",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "10px",
              border: "none",
              flexShrink: 0,
              background:
                input.trim() && !loading
                  ? "linear-gradient(135deg, #7c3aed, #5b21b6)"
                  : "#252d3d",
              cursor: input.trim() && !loading ? "pointer" : "not-allowed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
              boxShadow: input.trim()
                ? "0 2px 8px rgba(124,58,237,0.4)"
                : "none",
            }}
            onMouseEnter={(e) => {
              if (input.trim())
                e.currentTarget.style.filter = "brightness(1.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = "none";
            }}
          >
            {loading ? (
              <Loader2
                size={14}
                color="white"
                style={{ animation: "spin 1s linear infinite" }}
              />
            ) : (
              <Send size={14} color={input.trim() ? "white" : "#374151"} />
            )}
          </button>
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: "10px",
            color: "#252d3d",
            marginTop: "6px",
          }}
        >
          Powered by Groq · Llama 3.3 70B
        </p>
      </div>
    </>
  );
}
