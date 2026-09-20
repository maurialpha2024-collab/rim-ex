import type { auth as fr } from "../fr/auth";

export const auth: Record<keyof typeof fr, string> = {
  "auth.login.title": "Log in",
  "auth.login.subtitle": "Good to see you again.",
  "auth.login.email": "Email address",
  "auth.login.password": "Password",
  "auth.login.submit": "Log in",
  "auth.login.submitting": "Logging in…",
  "auth.login.noAccount": "No account yet?",
  "auth.login.signup": "Sign up",

  "auth.signup.title": "Create your account",
  "auth.signup.subtitle": "Free to browse. Get verified later to start trading.",
  "auth.signup.email": "Email address",
  "auth.signup.phone": "Phone number",
  "auth.signup.password": "Password",
  "auth.signup.passwordHint": "At least 6 characters",
  "auth.signup.show": "Show",
  "auth.signup.hide": "Hide",
  "auth.signup.strength": "Password strength",
  "auth.signup.submit": "Create my account",
  "auth.signup.submitting": "Creating…",
  "auth.signup.haveAccount": "Already have an account?",
  "auth.signup.login": "Log in",

  "auth.pitch.badge": "For Mauritanian students in Russia",
  "auth.pitch.title": "Exchange MRU and ₽ with people you can trust.",
  "auth.pitch.body":
    "Post your rate, get matched, chat and confirm, peer to peer. RIM-EX never touches your money: it simply connects the two sides.",
  "auth.pitch.f1.title": "Verified traders",
  "auth.pitch.f1.desc":
    "Every account that trades is checked by an admin before it can post or accept ads.",
  "auth.pitch.f2.title": "Built-in chat",
  "auth.pitch.f2.desc": "Agree on payment directly with the other person in a dedicated trade room.",
  "auth.pitch.f3.title": "Ratings that matter",
  "auth.pitch.f3.desc": "Every completed trade adds a public rating: reputation you can see before you trade.",

  "auth.done.title": "Check your email",
  "auth.done.body": "We sent a confirmation link to {email}. Click it, then come back and log in.",
  "auth.done.login": "Log in",

  "auth.err.invalid": "Incorrect email or password.",
  "auth.err.unconfirmed": "Please confirm your email address first (link sent by email).",
  "auth.err.taken": "That email address is already in use.",
};
