import type { MessageKey, Messages } from "./messages";

export type TFn = (key: MessageKey, vars?: Record<string, string | number>) => string;

// Looks a key up and fills {placeholders}. Falls back to the key itself so a
// missing translation is visible instead of blank.
export function createT(messages: Messages): TFn {
  return (key, vars) => {
    let text: string = messages[key] ?? key;
    if (vars) {
      for (const [name, value] of Object.entries(vars)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  };
}
