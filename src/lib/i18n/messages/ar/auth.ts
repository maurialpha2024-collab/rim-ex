import type { auth as fr } from "../fr/auth";

export const auth: Record<keyof typeof fr, string> = {
  "auth.login.title": "تسجيل الدخول",
  "auth.login.subtitle": "سعداء بعودتك.",
  "auth.login.email": "البريد الإلكتروني",
  "auth.login.password": "كلمة المرور",
  "auth.login.submit": "تسجيل الدخول",
  "auth.login.submitting": "جارٍ الدخول…",
  "auth.login.noAccount": "ليس لديك حساب؟",
  "auth.login.signup": "إنشاء حساب",

  "auth.signup.title": "إنشاء حسابك",
  "auth.signup.subtitle": "التصفح مجاني. وثّق حسابك لاحقًا لتتمكن من التداول.",
  "auth.signup.email": "البريد الإلكتروني",
  "auth.signup.phone": "رقم الهاتف",
  "auth.signup.password": "كلمة المرور",
  "auth.signup.passwordHint": "6 أحرف على الأقل",
  "auth.signup.show": "إظهار",
  "auth.signup.hide": "إخفاء",
  "auth.signup.strength": "قوة كلمة المرور",
  "auth.signup.submit": "إنشاء حسابي",
  "auth.signup.submitting": "جارٍ الإنشاء…",
  "auth.signup.haveAccount": "لديك حساب بالفعل؟",
  "auth.signup.login": "تسجيل الدخول",

  "auth.pitch.badge": "للطلاب الموريتانيين في روسيا",
  "auth.pitch.title": "بادل الأوقية (MRU) والروبل (₽) مع أشخاص موثوقين.",
  "auth.pitch.body":
    "انشر سعرك، وتواصل مع الطرف الآخر، وتحدثا وأكّدا الصفقة، مباشرةً بين الأفراد. لا تلمس RIM-EX أموالك أبدًا: هي فقط تربط بين الطرفين.",
  "auth.pitch.f1.title": "متداولون موثّقون",
  "auth.pitch.f1.desc": "يتحقق أحد المشرفين من كل حساب يتداول قبل أن يتمكن من نشر الإعلانات أو قبولها.",
  "auth.pitch.f2.title": "محادثة مدمجة",
  "auth.pitch.f2.desc": "اتفق على الدفع مباشرةً مع الطرف الآخر داخل غرفة صفقة مخصصة.",
  "auth.pitch.f3.title": "تقييمات لها وزنها",
  "auth.pitch.f3.desc": "كل صفقة مكتملة تضيف تقييمًا عامًا: سمعة ظاهرة قبل أن تتبادل.",

  "auth.done.title": "تحقق من بريدك الإلكتروني",
  "auth.done.body": "أرسلنا رابط تأكيد إلى {email}. اضغط عليه ثم عد لتسجيل الدخول.",
  "auth.done.login": "تسجيل الدخول",

  "auth.err.invalid": "البريد الإلكتروني أو كلمة المرور غير صحيحة.",
  "auth.err.unconfirmed": "أكّد بريدك الإلكتروني أولًا (الرابط الذي وصلك عبر البريد).",
  "auth.err.taken": "هذا البريد الإلكتروني مستخدم بالفعل.",
};
