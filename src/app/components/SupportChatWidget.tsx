"use client";

import * as React from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/components/ui/tooltip";
import { cn } from "@/app/components/ui/utils";

const STORAGE_KEY = "zvezda_support_chat";
const WELCOME_TEXT =
  "Здравствуйте! Чем могу помочь? Опишите вопрос — ответим в ближайшее время. Работаем пн–пт 9:00–21:00 МСК.";
const MOCK_REPLY =
  "Спасибо за обращение! Оператор получил ваше сообщение и ответит в ближайшее время. Для срочных вопросов: support@zvezda.ru или Telegram @zvezda_support.";

export interface ChatMessage {
  id: string;
  author: "user" | "support";
  text: string;
  createdAt: string;
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw) as { messages: ChatMessage[] };
    return Array.isArray(data.messages) ? data.messages : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ messages, updatedAt: new Date().toISOString() })
    );
  } catch {
    /* ignore storage errors */
  }
}

export function SupportChatWidget({
  openChatRef,
}: {
  openChatRef: React.MutableRefObject<(() => void) | null>;
}) {
  const [open, setOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>(() => {
    const loaded = loadMessages();
    if (loaded.length === 0) {
      const welcome: ChatMessage = {
        id: "welcome",
        author: "support",
        text: WELCOME_TEXT,
        createdAt: new Date().toISOString(),
      };
      const next = [welcome];
      saveMessages(next);
      return next;
    }
    return loaded;
  });
  const [input, setInput] = React.useState("");
  const [supportTyping, setSupportTyping] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    openChatRef.current = () => setOpen(true);
    return () => {
      openChatRef.current = null;
    };
  }, [openChatRef]);

  React.useEffect(() => {
    if (!open || !scrollRef.current) return;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [open, messages, supportTyping]);

  const sendMessage = React.useCallback(() => {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      author: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setInput("");
    setMessages((prev) => {
      const next = [...prev, userMsg];
      saveMessages(next);
      return next;
    });
    setSupportTyping(true);

    setTimeout(() => {
      const supportMsg: ChatMessage = {
        id: `s-${Date.now()}`,
        author: "support",
        text: MOCK_REPLY,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => {
        const next = [...prev, supportMsg];
        saveMessages(next);
        return next;
      });
      setSupportTyping(false);
    }, 1200);
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  React.useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [open]);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg"
            onClick={() => setOpen(true)}
            aria-label="Чат с поддержкой"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left" sideOffset={8}>
          Чат с поддержкой
        </TooltipContent>
      </Tooltip>

      {open && (
        <>
          <div
            role="presentation"
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-chat-title"
            className="fixed bottom-20 right-6 z-50 flex h-[min(32rem,70vh)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border bg-background shadow-xl animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4 duration-200"
          >
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
              <div>
                <h2 id="support-chat-title" className="font-semibold">
                  Чат с поддержкой
                </h2>
                <p className="text-xs text-muted-foreground">
                  Пн–пт 9:00–21:00 МСК
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => setOpen(false)}
                aria-label="Закрыть"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4"
              role="log"
              aria-live="polite"
            >
              <div className="flex flex-col gap-3 py-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      "flex",
                      m.author === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
                        m.author === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p
                        className={cn(
                          "mt-1 text-xs",
                          m.author === "user"
                            ? "text-primary-foreground/80"
                            : "text-muted-foreground"
                        )}
                      >
                        {new Date(m.createdAt).toLocaleTimeString("ru-RU", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {supportTyping && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                      Печатает…
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 border-t p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Сообщение..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={supportTyping}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={sendMessage}
                  disabled={!input.trim() || supportTyping}
                  aria-label="Отправить"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
