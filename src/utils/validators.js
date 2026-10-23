/* ------------------------------------------------------------------
   قواعد الباسورد (عدّل هنا بس):
   1) أول حرف كابيتال
   2) الطول من 8 إلى 16
   3) لازم يحتوي على رمز واحد على الأقل
------------------------------------------------------------------- */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 16;

export const passwordRules = [
  {
    id: "length",
    label: `${PASSWORD_MIN}–${PASSWORD_MAX} characters`,
    test: (p) => p.length >= PASSWORD_MIN && p.length <= PASSWORD_MAX,
  },
  {
    id: "capital",
    label: "Starts with a capital letter",
    test: (p) => /^[A-Z]/.test(p),
  },
  {
    id: "symbol",
    label: "Includes a symbol (e.g. @ # $ !)",
    test: (p) => /[^A-Za-z0-9\s]/.test(p),
  },
];

export const isPasswordValid = (p) => passwordRules.every((rule) => rule.test(p));
export const isEmailValid = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
