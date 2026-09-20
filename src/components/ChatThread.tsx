"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Mic, Paperclip, Send, ShieldAlert } from "lucide-react";
import { useI18n } from "@/components/I18nProvider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { ChatMessageRow } from "@/lib/database.types";
import { formatDate, formatTime } from "@/lib/money";
import { createClient } from "@/lib/supabase/client";

function sameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

// Messages + composer for one trade. Sending, uploading and realtime live in the parent;
// this component owns only what the user sees and the microphone.
export function ChatThread({
  messages,
  myId,
  canSend,
  uploading,
  error,
  onSendText,
  onSendPhoto,
  onSendAudio,
  className,
}: {
  messages: ChatMessageRow[];
  myId: string;
  canSend: boolean;
  uploading: boolean;
  error: string | null;
  onSendText: (text: string) => Promise<boolean>;
  onSendPhoto: (file: File) => void;
  onSendAudio: (blob: Blob, mime: string) => void;
  className?: string;
}) {
  const { t, intl } = useI18n();
  const listRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);
  const firstScroll = useRef(true);

  // Follow new messages unless the reader scrolled up.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    if (stickToBottom.current || last?.sender_id === myId) {
      el.scrollTo({ top: el.scrollHeight, behavior: firstScroll.current ? "auto" : "smooth" });
    }
    firstScroll.current = false;
  }, [messages, myId]);

  function onScroll() {
    const el = listRef.current;
    if (el) stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 96;
  }

  function dayLabel(iso: string) {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return t("chat.today");
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return t("chat.yesterday");
    return formatDate(iso, intl);
  }

  return (
    <section aria-label={t("chat.title")} className={cn("flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card", className)}>
      {/* Persistent safety banner */}
      <div className="flex items-start gap-2.5 border-b border-line bg-warning-soft px-4 py-3 text-warning-ink">
        <ShieldAlert size={18} aria-hidden="true" className="mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed">
          {t("chat.safety")} {t("chat.keep")}
        </p>
      </div>

      <div ref={listRef} onScroll={onScroll} className="flex-1 overflow-y-auto bg-canvas/60 px-3 py-4">
        <div className="flex min-h-full flex-col justify-end text-sm">
          {messages.length === 0 && (
            <p className="m-auto max-w-xs py-10 text-center text-sm text-muted">{t("chat.empty")}</p>
          )}
          {messages.map((m, i) => {
            const prev = messages[i - 1];
            const newDay = !prev || !sameDay(prev.created_at, m.created_at);
            const grouped = !newDay && prev?.sender_id === m.sender_id;
            return (
              <Fragment key={m.id}>
                {newDay && (
                  <div className="my-3 flex justify-center">
                    <span suppressHydrationWarning className="rounded-full bg-surface-2 px-3 py-0.5 text-[11px] font-medium text-muted">
                      {dayLabel(m.created_at)}
                    </span>
                  </div>
                )}
                <Bubble message={m} mine={m.sender_id === myId} grouped={grouped} />
              </Fragment>
            );
          })}
        </div>
      </div>

      {error && (
        <div role="alert" className="border-t border-line bg-negative-soft px-4 py-2 text-xs text-negative-ink">
          {error}
        </div>
      )}

      <Composer
        canSend={canSend}
        uploading={uploading}
        onSendText={onSendText}
        onSendPhoto={onSendPhoto}
        onSendAudio={onSendAudio}
      />
    </section>
  );
}

function Bubble({ message, mine, grouped }: { message: ChatMessageRow; mine: boolean; grouped: boolean }) {
  const { t, intl } = useI18n();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (message.message_type === "text" || !message.attachment_path) return;
    let cancelled = false;
    createClient()
      .storage.from("trade-attachments")
      .createSignedUrl(message.attachment_path, 60 * 60)
      .then(({ data }) => {
        if (!cancelled && data) setUrl(data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [message.attachment_path, message.message_type]);

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start", grouped ? "mt-0.5" : "mt-2")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 shadow-sm",
          mine ? "rounded-ee-sm bg-primary text-on-primary" : "rounded-es-sm bg-surface-2 text-fg"
        )}
      >
        {message.message_type === "text" && <p dir="auto" className="whitespace-pre-wrap break-words">{message.message}</p>}

        {message.message_type === "image" &&
          (url ? (
            <a href={url} target="_blank" rel="noreferrer">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={t("chat.photoAlt")} className="max-h-64 rounded-lg object-cover" />
            </a>
          ) : (
            <div className="flex h-32 w-48 items-center justify-center rounded-lg bg-canvas/40 text-xs">
              {t("chat.loadingPhoto")}
            </div>
          ))}

        {message.message_type === "audio" &&
          (url ? (
            <audio controls src={url} className="h-10 w-56" />
          ) : (
            <div className="flex h-10 w-56 items-center rounded-lg bg-canvas/40 px-3 text-xs">
              {t("chat.loadingVoice")}
            </div>
          ))}

        <div suppressHydrationWarning className={cn("mono mt-1 text-end text-[10px]", mine ? "opacity-80" : "text-muted")}>
          {formatTime(message.created_at, intl)}
        </div>
      </div>
    </div>
  );
}

function Composer({
  canSend,
  uploading,
  onSendText,
  onSendPhoto,
  onSendAudio,
}: {
  canSend: boolean;
  uploading: boolean;
  onSendText: (text: string) => Promise<boolean>;
  onSendPhoto: (file: File) => void;
  onSendAudio: (blob: Blob, mime: string) => void;
}) {
  const { t } = useI18n();
  const [draft, setDraft] = useState("");
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stop the microphone without sending if the user leaves mid-recording.
  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
      const r = recorderRef.current;
      if (r && r.state !== "inactive") {
        r.onstop = null;
        r.stop();
        r.stream.getTracks().forEach((track) => track.stop());
      }
    },
    []
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    if (!(await onSendText(text))) setDraft(text);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const mime = (recorder.mimeType || "audio/webm").split(";")[0];
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: mime });
        if (blob.size > 0) onSendAudio(blob, mime);
      };
      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      // microphone permission denied or unavailable
    }
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  if (!canSend) {
    return <div className="border-t border-line px-4 py-3 text-center text-xs text-muted">{t("chat.readOnly")}</div>;
  }

  if (recording) {
    return (
      <div className="flex items-center gap-3 border-t border-line px-3 py-2.5">
        <span aria-hidden="true" className="h-2.5 w-2.5 animate-pulse rounded-full bg-negative" />
        <span className="flex-1 text-sm">
          {t("chat.recording", { time: `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}` })}
        </span>
        <Button variant="destructive" size="sm" onClick={stopRecording}>
          {t("chat.stopSend")}
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-1.5 border-t border-line px-2 py-2">
      <Button type="button" variant="ghost" size="icon" aria-label={t("chat.attach")} disabled={uploading} onClick={() => fileRef.current?.click()}>
        <Paperclip size={18} aria-hidden="true" />
      </Button>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={uploading ? t("chat.uploading") : t("chat.placeholder")}
        aria-label={t("chat.placeholder")}
        className="h-10 min-w-0 flex-1 rounded-full bg-surface-2 px-4 text-sm outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring/40"
      />
      {draft.trim() ? (
        <Button type="submit" variant="primary" size="icon" aria-label={t("chat.send")} className="rounded-full">
          <Send size={18} aria-hidden="true" className="rtl:-scale-x-100" />
        </Button>
      ) : (
        <Button type="button" variant="ghost" size="icon" aria-label={t("chat.record")} disabled={uploading} onClick={startRecording}>
          <Mic size={18} aria-hidden="true" />
        </Button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSendPhoto(file);
          e.target.value = "";
        }}
      />
    </form>
  );
}
