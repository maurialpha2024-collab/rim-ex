import type { verify as fr } from "../fr/verify";

export const verify: Record<keyof typeof fr, string> = {
  "verify.title": "Verify your account",
  "verify.subtitle": "Required to post or accept ads.",
  "verify.steps": "Steps",
  "verify.step.whatsapp": "WhatsApp",
  "verify.step.photo": "Passport",
  "verify.step.review": "Submit",

  "verify.whatsapp.title": "Your WhatsApp number",
  "verify.whatsapp.hint": "An admin may contact you on it to finish the verification.",
  "verify.whatsapp.country": "Country code",
  "verify.whatsapp.number": "Number",
  "verify.whatsapp.error": "Enter a valid number (6 to 12 digits).",
  "verify.cc.222": "Mauritania (+222)",
  "verify.cc.7": "Russia (+7)",
  "verify.cc.212": "Morocco (+212)",
  "verify.cc.221": "Senegal (+221)",
  "verify.cc.223": "Mali (+223)",
  "verify.cc.33": "France (+33)",

  "verify.photo.title": "Photo of your passport",
  "verify.photo.hint": "The page with your photo and details, fully visible.",
  "verify.photo.drop": "Drag the photo here or tap to choose",
  "verify.photo.formats": "JPG, PNG or HEIC",
  "verify.photo.change": "Change",
  "verify.photo.remove": "Remove",
  "verify.photo.preview": "Preview of your passport",
  "verify.photo.error": "Add a photo of your passport.",
  "verify.photo.example": "Example of good framing",
  "verify.photo.tip1": "All 4 corners of the document are visible",
  "verify.photo.tip2": "No glare or blur",
  "verify.photo.tip3": "The text is readable",
  "verify.photo.warn.blur": "The photo looks blurry: retake it if the text isn't readable.",
  "verify.photo.warn.glare": "Glare detected: avoid direct light.",
  "verify.photo.warn.small": "The resolution is low: move closer to the document.",

  "verify.review.title": "Last step",
  "verify.review.whatsapp": "WhatsApp",
  "verify.review.photo": "Passport",
  "verify.review.photoKept": "Original photo kept on file",
  "verify.consent":
    "I agree that my passport photo is kept permanently as an audit record and seen only by RIM-EX admins.",
  "verify.consent.note": "Nobody can delete it: not you, and not the admins.",
  "verify.consent.error": "You must agree to continue.",
  "verify.submit": "Submit for verification",
  "verify.submitting": "Submitting…",
  "verify.err.upload": "Couldn't upload the photo. Please try again.",
  "verify.err.rpc": "Couldn't save your request. Please try again.",

  "verify.pending.title": "Under review",
  "verify.pending.body":
    "We review your file manually and may contact you on WhatsApp. The result will show up here.",
  "verify.pending.ref": "Reference",
  "verify.pending.submitted": "Submitted on",
  "verify.pending.whatsapp": "WhatsApp",

  "verify.verified.title": "Account verified",
  "verify.verified.body": "Your identity is confirmed. You can post and accept ads (with an active subscription).",
  "verify.verified.cta": "Go to the market",

  "verify.rejected.title": "Verification rejected",
  "verify.rejected.reason": "Reason",
  "verify.rejected.noReason": "No reason given.",
  "verify.rejected.resubmit":
    "You can correct your WhatsApp number and resubmit your file. Your original photo stays on file.",
};
