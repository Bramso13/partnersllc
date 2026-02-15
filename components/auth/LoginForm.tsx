"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const emailSchema = z.object({
  email: z.string().email("Email invalide"),
});

const passwordSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  remember: z.boolean().optional(),
});

const otpSchema = z.object({
  token: z
    .string()
    .length(8, "Le code doit contenir 8 chiffres")
    .regex(/^\d+$/, "Le code doit contenir uniquement des chiffres"),
});

type EmailFormData = z.infer<typeof emailSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type OtpFormData = z.infer<typeof otpSchema>;

type LoginMode = "passwordless" | "password";
type PasswordlessStep = "email" | "otp";

export default function LoginForm() {
  const [loginMode, setLoginMode] = useState<LoginMode>("passwordless");
  const [passwordlessStep, setPasswordlessStep] =
    useState<PasswordlessStep>("email");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [otpEmail, setOtpEmail] = useState<string>("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    if (searchParams.get("reset") === "success") {
      setSuccessMessage(
        "Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter."
      );
    }

    const handleMagicLinkCallback = async () => {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type");
      const email = searchParams.get("email");

      if (tokenHash && type === "email" && email) {
        setIsLoading(true);
        try {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            email,
            token: tokenHash,
            type: "email",
          });

          if (verifyError) {
            setError("Lien de connexion invalide ou expiré");
          } else {
            router.push(redirectUrl);
            router.refresh();
            return;
          }
        } catch {
          setError("Une erreur est survenue lors de la vérification");
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleMagicLinkCallback();
  }, [searchParams, supabase, router, redirectUrl]);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      remember: false,
    },
  });

  const {
    register: registerOtp,
    handleSubmit: handleOtpSubmit,
    formState: { errors: otpErrors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
  });

  const sendMagicLink = async (data: EmailFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: {
          emailRedirectTo: `${window.location.origin}/login?redirect=${encodeURIComponent(redirectUrl)}`,
        },
      });

      if (signInError) {
        if (signInError.message.includes("rate limit")) {
          setError(
            "Trop de demandes. Veuillez attendre 60 secondes avant de réessayer."
          );
        } else if (signInError.message.includes("Invalid email")) {
          setError("Adresse email invalide");
        } else {
          setError(signInError.message || "Erreur lors de l'envoi du lien");
        }
        return;
      }

      setOtpEmail(data.email);
      setSuccessMessage(
        "Un code à 6 chiffres a été envoyé à votre adresse email. Ce code est valide pendant 1 heure."
      );
      setPasswordlessStep("otp");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (data: OtpFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: otpEmail,
        token: data.token,
        type: "email",
      });

      if (verifyError) {
        if (
          verifyError.message.includes("Invalid token") ||
          verifyError.message.includes("expired")
        ) {
          setError(
            "Code invalide ou expiré. Veuillez demander un nouveau code."
          );
        } else {
          setError(verifyError.message || "Code invalide");
        }
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordLogin = async (data: PasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (signInError) {
        setError("Identifiants invalides");
        return;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchToPasswordMode = () => {
    setLoginMode("password");
    setError(null);
    setSuccessMessage(null);
    setPasswordlessStep("email");
  };

  const switchToPasswordlessMode = () => {
    setLoginMode("passwordless");
    setError(null);
    setSuccessMessage(null);
    setPasswordlessStep("email");
  };

  const resendCode = async () => {
    if (!otpEmail) return;
    await sendMagicLink({ email: otpEmail });
  };

  const inputBase =
    "w-full bg-[var(--color-surface)]/80 border border-[var(--color-border)] rounded-xl pl-12 pr-4 py-3.5 text-[var(--color-foreground)] placeholder:text-[var(--color-text-secondary)]/80 focus:outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:bg-[var(--color-surface)] transition-all duration-200 text-[15px]";
  const inputError = "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20";
  const labelClass =
    "block text-[13px] font-medium tracking-wide text-[var(--color-text-secondary)] uppercase mb-2.5";
  const errorTextClass = "mt-2 text-[13px] text-[var(--color-danger)] flex items-center gap-1.5";

  return (
    <div className="login-form relative">
      <style>{`
        @keyframes loginReveal {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-form .form-reveal { animation: loginReveal 0.5s ease-out backwards; }
        .login-form .form-reveal-1 { animation-delay: 0.05s; }
        .login-form .form-reveal-2 { animation-delay: 0.1s; }
        .login-form .form-reveal-3 { animation-delay: 0.15s; }
        .login-form .form-reveal-4 { animation-delay: 0.2s; }
        .login-form .form-reveal-5 { animation-delay: 0.25s; }
        .login-form .form-reveal-6 { animation-delay: 0.3s; }
        .login-form .btn-primary {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .login-form .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px -8px color-mix(in srgb, var(--color-accent) 35%, transparent);
        }
        .login-form .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .login-form .input-field:focus { box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-accent) 25%, transparent); }
        .login-form .btn-primary { box-shadow: 0 0 20px color-mix(in srgb, var(--color-accent) 20%, transparent); }
      `}</style>

      {successMessage && (
        <div
          className="form-reveal form-reveal-1 mb-6 flex items-start gap-3 rounded-xl border border-[var(--color-success)]/25 bg-[var(--color-success)]/10 px-4 py-3.5 text-[var(--color-success)]"
          role="status"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm leading-relaxed">{successMessage}</p>
        </div>
      )}
      {error && (
        <div
          className="form-reveal form-reveal-1 mb-6 flex items-start gap-3 rounded-xl border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/10 px-4 py-3.5 text-[var(--color-danger)]"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="text-sm leading-relaxed">{error}</p>
        </div>
      )}

      {loginMode === "passwordless" ? (
        passwordlessStep === "email" ? (
          <form
            onSubmit={handleEmailSubmit(sendMagicLink)}
            className="space-y-6"
          >
            <div className="form-reveal form-reveal-2">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
                  <Mail className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <input
                  {...registerEmail("email")}
                  type="email"
                  id="email"
                  autoComplete="email"
                  placeholder="jean.dupont@example.com"
                  className={`input-field ${inputBase} ${emailErrors.email ? inputError : ""}`}
                />
              </div>
              {emailErrors.email && (
                <p className={errorTextClass}>
                  <AlertCircle className="h-4 w-4" />
                  {emailErrors.email.message}
                </p>
              )}
            </div>

            <div className="form-reveal form-reveal-3 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-3.5 font-semibold text-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    Recevoir un code par email
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <div className="form-reveal form-reveal-4 pt-2 text-center">
              <button
                type="button"
                onClick={switchToPasswordMode}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                <KeyRound className="h-4 w-4" />
                Utiliser un mot de passe
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit(verifyOtp)} className="space-y-6">
            <div className="form-reveal form-reveal-1 text-center">
              <p className="text-[13px] uppercase tracking-wide text-[var(--color-text-secondary)]">
                Code envoyé à
              </p>
              <p className="mt-1 font-medium text-[var(--color-foreground)]">
                {otpEmail}
              </p>
            </div>

            <div className="form-reveal form-reveal-2">
              <label htmlFor="token" className={labelClass}>
                Code de vérification
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
                  <Sparkles className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <input
                  {...registerOtp("token")}
                  type="text"
                  id="token"
                  maxLength={8}
                  autoComplete="one-time-code"
                  placeholder="00000000"
                  className={`input-field ${inputBase} text-center text-2xl tracking-[0.4em] font-mono tabular-nums pl-12 ${otpErrors.token ? inputError : ""}`}
                />
              </div>
              {otpErrors.token && (
                <p className={errorTextClass}>
                  <AlertCircle className="h-4 w-4" />
                  {otpErrors.token.message}
                </p>
              )}
            </div>

            <div className="form-reveal form-reveal-3 pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-3.5 font-semibold text-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Vérification...
                  </>
                ) : (
                  <>
                    Vérifier le code
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

            <div className="form-reveal form-reveal-4 flex flex-col items-center gap-2 pt-2">
              <button
                type="button"
                onClick={resendCode}
                disabled={isLoading}
                className="text-sm font-medium text-[var(--color-accent)] hover:underline disabled:opacity-50"
              >
                Renvoyer le code
              </button>
              <button
                type="button"
                onClick={switchToPasswordlessMode}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] transition-colors"
              >
                Changer d&apos;adresse email
              </button>
            </div>
          </form>
        )
      ) : (
        <form
          onSubmit={handlePasswordSubmit(onPasswordLogin)}
          className="space-y-6"
        >
          <div className="form-reveal form-reveal-2">
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
                <Mail className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <input
                {...registerPassword("email")}
                type="email"
                id="email"
                autoComplete="email"
                placeholder="jean.dupont@example.com"
                className={`input-field ${inputBase} ${passwordErrors.email ? inputError : ""}`}
              />
            </div>
            {passwordErrors.email && (
              <p className={errorTextClass}>
                <AlertCircle className="h-4 w-4" />
                {passwordErrors.email.message}
              </p>
            )}
          </div>

          <div className="form-reveal form-reveal-3">
            <label htmlFor="password" className={labelClass}>
              Mot de passe
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
                <Lock className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <input
                {...registerPassword("password")}
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={`input-field ${inputBase} pr-12 ${passwordErrors.password ? inputError : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-foreground)] transition-colors"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-5 w-5" strokeWidth={1.75} />
                )}
              </button>
            </div>
            {passwordErrors.password && (
              <p className={errorTextClass}>
                <AlertCircle className="h-4 w-4" />
                {passwordErrors.password.message}
              </p>
            )}
          </div>

          <div className="form-reveal form-reveal-4 flex justify-end pt-1">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <div className="form-reveal form-reveal-5 pt-1">
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-accent)] py-3.5 font-semibold text-[var(--color-background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          <div className="form-reveal form-reveal-6 pt-2 text-center">
            <button
              type="button"
              onClick={switchToPasswordlessMode}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-accent)] hover:underline"
            >
              <Sparkles className="h-4 w-4" />
              Recevoir un code par email
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
