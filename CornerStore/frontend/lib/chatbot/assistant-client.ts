import { getAssistantSessionHistory, sendAssistantChat } from "@/lib/services/assistant";

import { mapProductDTO } from "@/lib/utils/product";

import {

  clearAssistantState,

  getAssistantSessionId,

  loadAssistantState,

  saveAssistantState,

  setAssistantSessionId,

} from "@/lib/utils/assistant-storage";

import {

  runAssistantQuery,

  type AssistantMessage,

  type AssistantQueryOptions,

} from "@/lib/chatbot/assistant-logic";



export type ChatTurn = {

  role: "user" | "assistant";

  content: string;

};



export { getAssistantSessionId, setAssistantSessionId, clearAssistantState, loadAssistantState, saveAssistantState };



export function toChatHistory(messages: AssistantMessage[]): ChatTurn[] {

  return messages

    .filter((m) => m.role === "user" || m.role === "assistant")

    .map((m) => ({ role: m.role, content: m.text }));

}



export function startNewAssistantSession(): void {

  clearAssistantState();

}



export async function restoreAssistantMessages(): Promise<AssistantMessage[]> {

  const local = loadAssistantState();

  if (local.messages.length > 0) {

    return local.messages;

  }



  const sessionId = local.sessionId ?? getAssistantSessionId();

  if (!sessionId) return [];



  try {

    const history = await getAssistantSessionHistory(sessionId);

    const messages: AssistantMessage[] = history.messages.map((m) => ({

      role: m.role,

      text: m.content,

    }));

    saveAssistantState({ sessionId, messages });

    return messages;

  } catch {

    return [];

  }

}



export async function sendAssistantMessage(

  history: ChatTurn[],

  options: AssistantQueryOptions,

): Promise<AssistantMessage> {

  const lastUser = [...history].reverse().find((m) => m.role === "user");

  if (!lastUser?.content.trim()) {

    return { role: "assistant", text: "Please send a message." };

  }



  try {

    const response = await sendAssistantChat({

      sessionId: getAssistantSessionId(),

      message: lastUser.content,

      history: history.map((m) => ({ role: m.role, content: m.content })),

      context: {

        cartProductIds: options.cartProductIds ?? [],

        recentProductIds: options.recentProductIds ?? [],

        compareIds: options.compareIds ?? [],

        basketId: options.basketId ?? null,

      },

    });



    if (response.sessionId) setAssistantSessionId(response.sessionId);



    if (response.text?.trim()) {

      return {

        role: "assistant",

        text: response.text,

        products: response.products?.map(mapProductDTO),

        structured: response.structured ?? null,

      };

    }

  } catch {

    // fall through to rule-based assistant when API is down

  }



  return runAssistantQuery(lastUser.content, options);

}


