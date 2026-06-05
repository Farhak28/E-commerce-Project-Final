import type { AssistantMessage } from "@/lib/chatbot/assistant-logic";

const SESSION_KEY = "corner_store_assistant_session";
const STATE_KEY = "corner_store_assistant_state";

export type AssistantPersistedState = {
  sessionId: string | null;
  messages: AssistantMessage[];
};

export function getAssistantSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

export function setAssistantSessionId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(SESSION_KEY, id);
  else localStorage.removeItem(SESSION_KEY);
}

export function loadAssistantState(): AssistantPersistedState {
  if (typeof window === "undefined") {
    return { sessionId: null, messages: [] };
  }

  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AssistantPersistedState;
      if (Array.isArray(parsed.messages)) {
        return {
          sessionId: parsed.sessionId ?? getAssistantSessionId(),
          messages: parsed.messages,
        };
      }
    }
  } catch {
    /* ignore corrupt state */
  }

  return { sessionId: getAssistantSessionId(), messages: [] };
}

export function saveAssistantState(state: AssistantPersistedState): void {
  if (typeof window === "undefined") return;
  if (state.sessionId) setAssistantSessionId(state.sessionId);
  else setAssistantSessionId(null);

  if (state.messages.length === 0 && !state.sessionId) {
    localStorage.removeItem(STATE_KEY);
    return;
  }

  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function clearAssistantState(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(STATE_KEY);
}
