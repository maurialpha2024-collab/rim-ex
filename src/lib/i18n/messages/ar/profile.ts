import type { profile as fr } from "../fr/profile";

export const profile: Record<keyof typeof fr, string> = {
  "profile.memberSince": "عضو منذ {date}",
  "profile.newMember": "عضو جديد",
  "profile.sub.active": "الاشتراك نشط",
  "profile.sub.inactive": "الاشتراك غير نشط",
  "profile.suspended": "الحساب موقوف",
  "profile.verifyCta": "التحقق من الحساب",

  "profile.trust.title": "الثقة",
  "profile.rating": "متوسط التقييم",
  "profile.ratingCount": "{n} تقييم",
  "profile.completed": "الصفقات المكتملة",
  "profile.completion30": "نسبة الإتمام (30 يومًا)",
  "profile.release": "متوسط الوقت",
  "profile.minutes": "{m} د",
  "profile.noData": "لا توجد بيانات بعد",

  "profile.checklist.title": "التحققات",
  "profile.check.whatsapp": "رقم واتساب",
  "profile.check.passport": "جواز السفر",
  "profile.check.email": "البريد الإلكتروني",
  "profile.check.subscription": "الاشتراك",
  "profile.check.provided": "مُدخل",
  "profile.check.missing": "ناقص",
  "profile.check.confirmed": "مؤكَّد",
  "profile.check.unconfirmed": "غير مؤكَّد",

  "profile.stats.title": "النشاط",
  "profile.volume": "حجم التداول",
  "profile.monthTrades": "صفقات هذا الشهر",
  "profile.positive": "التقييمات الإيجابية",

  "profile.reviews.title": "التقييمات المستلَمة",
  "profile.reviews.bought": "شراء MRU",
  "profile.reviews.sold": "بيع MRU",
  "profile.reviews.empty": "لا توجد تقييمات بعد.",
  "profile.reviews.noComment": "بلا تعليق",

  "profile.history.title": "سجل الصفقات",
  "profile.history.empty": "لا توجد صفقات بعد.",
};
