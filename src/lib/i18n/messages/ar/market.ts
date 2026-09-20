import type { market as fr } from "../fr/market";

export const market: Record<keyof typeof fr, string> = {
  "market.title": "سوق التبادل المباشر",
  "market.subtitle": "{count} إعلانات مفتوحة",
  "market.currencies": "MRU = الأوقية الموريتانية · ₽ = الروبل الروسي",
  "market.side.label": "اتجاه التبادل",
  "market.side.buy": "شراء MRU",
  "market.side.sell": "بيع MRU",
  "market.side.buyHint": "تدفع بالروبل (₽) وتستلم MRU",
  "market.side.sellHint": "تدفع بـ MRU وتستلم الروبل (₽)",

  "market.filter.min": "الحد الأدنى للمبلغ ({currency})",
  "market.filter.sort": "ترتيب حسب",
  "market.filter.apply": "تصفية",
  "market.filter.reset": "إعادة تعيين",
  "market.sort.price": "أفضل سعر",
  "market.sort.new": "الأحدث",
  "market.sort.size": "الأكبر مبلغًا",

  "market.card.rate": "1 ₽ = {rate} MRU",
  "market.card.rateLabel": "السعر",
  "market.card.receive": "تستلم",
  "market.card.pay": "تدفع ≈",
  "market.card.fixed": "مبلغ ثابت: يُنفَّذ الإعلان كاملًا في صفقة واحدة.",
  "market.card.trades30": "{n} صفقة · 30 يومًا",
  "market.card.completion": "نسبة الإتمام {p}",
  "market.card.release": "متوسط الوقت ≈ {m} د",
  "market.card.noStats": "لا توجد إحصائيات بعد",
  "market.card.anonymous": "مجهول",

  "market.action.buy": "شراء MRU",
  "market.action.sell": "بيع MRU",
  "market.action.own": "إعلانك",

  "market.gate.guest": "سجّل الدخول للتداول",
  "market.gate.unverified": "وثّق حسابك للتداول",
  "market.gate.pending": "التحقق قيد المراجعة",
  "market.gate.rejected": "تم رفض التحقق",
  "market.gate.no_subscription": "الاشتراك مطلوب",
  "market.gate.suspended": "الحساب موقوف",

  "market.banner.guest": "تصفّح السوق بحرية. سجّل الدخول ووثّق حسابك لتتمكن من التداول.",
  "market.banner.unverified": "أرسل جواز سفرك ورقم واتساب الخاص بك لتتمكن من نشر الإعلانات أو قبولها.",
  "market.banner.pending": "ملفك قيد المراجعة. ستتمكن من التداول بمجرد قبوله.",
  "market.banner.rejected": "تم رفض التحقق. اطّلع على السبب وأعد إرسال ملفك.",
  "market.banner.no_subscription": "حسابك موثّق، لكن اشتراكك لم يُفعَّل بعد. يجب أن يفعّله أحد المشرفين.",
  "market.banner.suspended": "حسابك موقوف. تواصل مع الدعم.",
  "market.banner.cta.guest": "تسجيل الدخول",
  "market.banner.cta.unverified": "التحقق من الحساب",
  "market.banner.cta.pending": "عرض الحالة",
  "market.banner.cta.rejected": "عرض السبب",

  "market.confirm.title": "بدء هذه الصفقة؟",
  "market.confirm.body":
    "يُحجز الإعلان لك لمدة 30 دقيقة وتتحدث مع {name}. إن لم يؤكد الطرفان الصفقة يعود الإعلان إلى السوق.",
  "market.confirm.cta": "بدء الصفقة",
  "market.locking": "جارٍ الحجز…",

  "market.err.notEligible": "يجب أن يكون حسابك موثّقًا ومشتركًا لتتمكن من التداول.",
  "market.err.unavailable": "هذا الإعلان لم يعد متاحًا.",
  "market.err.own": "لا يمكنك قبول إعلانك الخاص.",

  "market.empty.title": "لا توجد إعلانات حاليًا",
  "market.empty.hint": "انشر إعلانك أو غيّر عوامل التصفية.",
  "market.empty.cta": "نشر إعلان",
};
