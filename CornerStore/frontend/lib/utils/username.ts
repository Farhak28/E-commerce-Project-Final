/** Build a unique, Identity-safe username from an email (avoids collisions on local-part only). */
export function buildUserNameFromEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  const [local = "user", domain = "user"] = normalized.split("@");
  const safeLocal = local.replace(/[^a-zA-Z0-9]/g, "") || "user";
  const safeDomain = domain.replace(/[^a-zA-Z0-9]/g, "") || "user";
  return `${safeLocal}_${safeDomain}`.slice(0, 256);
}

export type PasswordCheck = { ok: true } | { ok: false; message: string };

/** Matches default ASP.NET Identity password rules in this project. */
export function validatePassword(password: string, language: "en" | "ar" = "en"): PasswordCheck {
  if (password.length < 6) {
    return {
      ok: false,
      message: language === "ar" ? "كلمة المرور 6 أحرف على الأقل." : "Password must be at least 6 characters.",
    };
  }
  if (!/[0-9]/.test(password)) {
    return {
      ok: false,
      message: language === "ar" ? "أضف رقماً واحداً على الأقل." : "Password must include at least one digit.",
    };
  }
  if (!/[A-Z]/.test(password)) {
    return {
      ok: false,
      message:
        language === "ar" ? "أضف حرفاً كبيراً واحداً على الأقل." : "Password must include at least one uppercase letter.",
    };
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    return {
      ok: false,
      message:
        language === "ar"
          ? "أضف رمزاً خاصاً واحداً على الأقل (مثل !@#)."
          : "Password must include at least one special character (e.g. !@#).",
    };
  }
  return { ok: true };
}
