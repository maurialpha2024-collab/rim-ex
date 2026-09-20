import { fr } from "./fr";
import { ar } from "./ar";
import { en } from "./en";
import type { Locale } from "../config";

export type MessageKey = keyof typeof fr;
export type Messages = Record<MessageKey, string>;

export const MESSAGES: Record<Locale, Messages> = { fr, en, ar };
