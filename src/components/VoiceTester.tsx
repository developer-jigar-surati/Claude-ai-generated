"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Phone,
  PhoneOff,
  Mic,
  Loader2,
  Volume2,
  Send,
  AudioLines,
} from "lucide-react";

type Role = "agent" | "customer";
interface Turn {
  role: Role;
  text: string;
}

interface AgentLite {
  id: string;
  name: string;
  greeting: string;
  voice: string;
  objective: string;
}

// Minimal typing for the browser Speech Recognition API (not in TS lib.dom).
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

export default function VoiceTester({
  agent,
  onEnded,
}: {
  agent: AgentLite;
  onEnded?: () => void;
}) {
  const [active, setActive] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [text, setText] = useState("");
  const [sttSupported, setSttSupported] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [company, setCompany] = useState("our company");

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const turnsRef = useRef<Turn[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  turnsRef.current = turns;

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      speechSynthesis?: SpeechSynthesis;
    };
    setSttSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    setTtsSupported(!!w.speechSynthesis);
    fetch("/api/config")
      .then((r) => r.json())
      .then((d) => d?.features?.workspaceName && setCompany(d.features.workspaceName))
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns, thinking]);

  const speak = useCallback(
    (message: string) =>
      new Promise<void>((resolve) => {
        const synth = (window as unknown as { speechSynthesis?: SpeechSynthesis })
          .speechSynthesis;
        if (!synth) return resolve();
        synth.cancel();
        const u = new SpeechSynthesisUtterance(message);
        const female = /female/i.test(agent.voice);
        u.pitch = female ? 1.1 : 0.9;
        u.rate = 1.02;
        const pick = () => {
          const voices = synth.getVoices();
          const en = voices.filter((v) => v.lang.startsWith("en"));
          const byName = en.find((v) =>
            (female ? /female|samantha|victoria|zira|aria|joanna|eva/i : /male|david|daniel|alex|mark|guy/i).test(
              v.name
            )
          );
          u.voice = byName || en[0] || voices[0] || null;
        };
        pick();
        u.onend = () => {
          setSpeaking(false);
          resolve();
        };
        u.onerror = () => {
          setSpeaking(false);
          resolve();
        };
        setSpeaking(true);
        synth.speak(u);
      }),
    [agent.voice]
  );

  const addTurn = (t: Turn) => setTurns((prev) => [...prev, t]);

  const sendMessage = useCallback(
    async (msg: string) => {
      const clean = msg.trim();
      if (!clean || thinking) return;
      addTurn({ role: "customer", text: clean });
      setText("");
      setThinking(true);
      try {
        const res = await fetch(`/api/agents/${agent.id}/converse`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: clean, history: turnsRef.current }),
        });
        const data = await res.json();
        const reply = data.reply || "Sorry, could you repeat that?";
        addTurn({ role: "agent", text: reply });
        setThinking(false);
        await speak(reply);
      } catch {
        setThinking(false);
      }
    },
    [agent.id, speak, thinking]
  );

  async function startCall() {
    setActive(true);
    const greeting = agent.greeting.replace(/\{company\}/g, company);
    setTurns([{ role: "agent", text: greeting }]);
    turnsRef.current = [{ role: "agent", text: greeting }];
    await speak(greeting);
  }

  function startListening() {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) return;
    const synth = (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis;
    synth?.cancel();
    setSpeaking(false);

    const rec = new Ctor();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      sendMessage(transcript);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  function stopListening() {
    recRef.current?.stop();
    setListening(false);
  }

  async function endCall() {
    stopListening();
    (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis?.cancel();
    setSpeaking(false);
    const history = turnsRef.current;
    setActive(false);
    setThinking(false);
    try {
      await fetch(`/api/agents/${agent.id}/converse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalize: true, history }),
      });
    } catch {
      /* ignore */
    }
    onEnded?.();
  }

  // ---- render ----

  if (!active) {
    return (
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700 dark:bg-brand-600/20">
            <AudioLines className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Talk to this agent (live voice)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Have a real spoken conversation in your browser — the agent speaks and listens.
              {!sttSupported &&
                " (Your browser can't capture the mic — you can still type and hear replies. Chrome or Edge works best.)"}
            </p>
          </div>
        </div>
        <button className="btn-primary mt-4" onClick={startCall} disabled={!ttsSupported}>
          <Phone className="h-4 w-4" /> Start voice call
        </button>
        {!ttsSupported && (
          <p className="mt-2 text-xs text-rose-500">
            Speech isn&apos;t available in this browser.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-brand-600 px-4 py-3 text-white dark:border-white/10">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          On a call with {agent.name}
        </div>
        <span className="text-xs text-white/80">
          {speaking ? "Speaking…" : listening ? "Listening…" : thinking ? "Thinking…" : "Connected"}
        </span>
      </div>

      {/* transcript */}
      <div ref={scrollRef} className="max-h-72 space-y-3 overflow-y-auto p-4">
        {turns.map((t, i) => (
          <div
            key={i}
            className={`flex ${t.role === "agent" ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${
                t.role === "agent"
                  ? "bg-slate-100 text-slate-800 dark:bg-white/10 dark:text-slate-100"
                  : "bg-brand-600 text-white"
              }`}
            >
              {t.text}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-slate-100 px-3.5 py-2 text-sm text-slate-500 dark:bg-white/10">
              <Loader2 className="inline h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* controls */}
      <div className="space-y-3 border-t border-slate-100 p-4 dark:border-white/10">
        {speaking ? (
          <div className="flex items-center justify-center gap-2 text-sm text-brand-600">
            <Volume2 className="h-4 w-4" /> Agent is speaking…
          </div>
        ) : sttSupported ? (
          <div className="flex justify-center">
            <button
              onMouseDown={startListening}
              onMouseUp={stopListening}
              onTouchStart={(e) => {
                e.preventDefault();
                startListening();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                stopListening();
              }}
              disabled={thinking}
              className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-pop transition disabled:opacity-50 ${
                listening ? "animate-pulse bg-rose-500" : "bg-brand-600 hover:bg-brand-700"
              }`}
            >
              <Mic className="h-5 w-5" />
              {listening ? "Listening — release to send" : "Hold to speak"}
            </button>
          </div>
        ) : null}

        {/* text fallback / alternative */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(text);
          }}
          className="flex gap-2"
        >
          <input
            className="input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={sttSupported ? "…or type your reply" : "Type your reply"}
            disabled={thinking}
          />
          <button type="submit" className="btn-secondary shrink-0" disabled={thinking || !text.trim()}>
            <Send className="h-4 w-4" />
          </button>
        </form>

        <button onClick={endCall} className="btn-secondary w-full text-rose-600">
          <PhoneOff className="h-4 w-4" /> End call
        </button>
      </div>
    </div>
  );
}
