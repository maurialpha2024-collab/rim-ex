import type { order as fr } from "../fr/order";

export const order: Record<keyof typeof fr, string> = {
  "order.title": "نشر إعلان",
  "order.subtitle": "حدّد سعرك: يتم ربطك بالطرف الآخر بمجرد قبول أحدهم للإعلان.",
  "order.back": "السوق",
  "order.steps": "الخطوات",
  "order.step.direction": "الاتجاه",
  "order.step.rate": "السعر",
  "order.step.amount": "المبلغ",
  "order.step.review": "الملخص",

  "order.dir.title": "ماذا تريد أن تفعل؟",
  "order.dir.sellUm": "أبيع MRU",
  "order.dir.sellUmHint": "أستلم الروبل (₽)",
  "order.dir.sellRub": "أبيع الروبل (₽)",
  "order.dir.sellRubHint": "أستلم MRU",

  "order.rate.label": "سعرك (MRU مقابل 1 ₽)",
  "order.rate.hint": "مثال: القيمة 5 تعني أن 1 ₽ = 5 MRU.",
  "order.rate.error": "أدخل سعرًا أكبر من 0.",

  "order.amount.label": "المبلغ المراد بيعه ({currency})",
  "order.amount.hint": "المبلغ ثابت: يُنفَّذ الإعلان كاملًا في صفقة واحدة.",
  "order.amount.error": "أدخل مبلغًا أكبر من 0.",
  "order.estimate": "ستستلم ≈",

  "order.review.title": "راجع إعلانك",
  "order.review.give": "أنت تبيع",
  "order.review.get": "ستستلم ≈",
  "order.review.rate": "السعر",
  "order.review.note":
    "بعد قبول الإعلان أمامك 30 دقيقة لإتمام الصفقة. تدفع وتؤكد مباشرةً مع الطرف الآخر: RIM-EX لا تلمس الأموال أبدًا.",

  "order.publish": "نشر الإعلان",
  "order.publishing": "جارٍ النشر…",
  "order.preview.title": "معاينة",
  "order.preview.hint": "هكذا سيظهر إعلانك في السوق.",
  "order.login": "سجّل الدخول للنشر",
};
