import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Mail, Lock, KeyRound, ArrowLeft, Sparkles } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Login Admin — Beasiswa Prestasi Kita" },
      { name: "description", content: "Akses dashboard admin program Beasiswa Pendidikan Prestasi Kita." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: LoginPage,
});

type Step = "credentials" | "mfa";

function LoginPage() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // jika sudah login & MFA terpenuhi, langsung ke admin
        supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data: aal }) => {
          if (!aal || aal.currentLevel === aal.nextLevel) navigate({ to: "/admin" });
        });
      }
    });
  }, [navigate]);

  const proceedAfterPassword = async () => {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel === "aal1") {
      const { data: factors, error: fErr } = await supabase.auth.mfa.listFactors();
      if (fErr) throw fErr;
      const totp = factors.totp.find((f) => f.status === "verified");
      if (!totp) {
        toast.success("Berhasil masuk");
        navigate({ to: "/admin" });
        return;
      }
      const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({ factorId: totp.id });
      if (cErr) throw cErr;
      setFactorId(totp.id);
      setChallengeId(ch.id);
      setStep("mfa");
      toast.info("Masukkan kode 6-digit dari aplikasi Authenticator Anda");
    } else {
      toast.success("Berhasil masuk");
      navigate({ to: "/admin" });
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      await proceedAfterPassword();

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId || !challengeId) return;
    setLoading(true);
    try {
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code: otp.trim(),
      });
      if (error) throw error;
      toast.success("Verifikasi berhasil");
      navigate({ to: "/admin" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Kode tidak valid";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const cancelMfa = async () => {
    await supabase.auth.signOut();
    setStep("credentials");
    setOtp("");
    setFactorId(null);
    setChallengeId(null);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-background via-muted/30 to-primary/5 px-4 py-12 sm:py-20">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-[oklch(0.65_0.18_290)]/20 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-[oklch(0.75_0.15_80)]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-md">
        <Card className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 p-0 shadow-2xl shadow-primary/10 backdrop-blur-xl">
          {/* Header band */}
          <div className="relative bg-gradient-to-br from-primary via-primary to-[oklch(0.55_0.22_290)] px-8 py-8 text-primary-foreground">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)]" />
            <div className="relative flex flex-col items-center text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 backdrop-blur-sm">
                {step === "mfa" ? <KeyRound className="h-7 w-7" /> : <ShieldCheck className="h-7 w-7" />}
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {step === "mfa" ? "Verifikasi 2 Langkah" : "Admin Dashboard"}
              </h1>
              <p className="mt-1 text-sm text-white/80">
                {step === "mfa"
                  ? "Masukkan kode dari Google Authenticator"
                  : "Masuk untuk mengelola pendaftar"}

              </p>
            </div>
          </div>

          <div className="px-8 py-7">
            {step === "credentials" ? (
              <form onSubmit={submit} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Email
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@prestasikita.com"
                      autoComplete="email"
                      className="h-11 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimal 8 karakter"
                      autoComplete="current-password"
                      className="h-11 pl-10"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-primary to-[oklch(0.55_0.22_290)] text-base font-semibold shadow-lg shadow-primary/25 transition-transform hover:translate-y-[-1px] hover:shadow-xl hover:shadow-primary/30"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Masuk ke Dashboard
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Akses dashboard terbatas untuk satu akun admin resmi.
                </p>

              </form>
            ) : (
              <form onSubmit={verifyMfa} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Kode Authenticator
                  </Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="h-14 text-center text-2xl font-bold tracking-[0.5em]"
                    autoFocus
                  />
                  <p className="pt-1 text-xs text-muted-foreground">
                    Buka aplikasi Google Authenticator dan masukkan kode 6-digit untuk akun ini.
                  </p>
                </div>
                <Button
                  type="submit"
                  className="h-11 w-full bg-gradient-to-r from-primary to-[oklch(0.55_0.22_290)] font-semibold shadow-lg shadow-primary/25"
                  disabled={loading || otp.length !== 6}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verifikasi & Masuk
                </Button>
                <button
                  type="button"
                  onClick={cancelMfa}
                  className="flex w-full items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3 w-3" /> Kembali ke login
                </button>
              </form>
            )}

            <div className="mt-5 text-center">
              <Link to="/" className="text-xs text-muted-foreground hover:text-foreground hover:underline">
                ← Kembali ke beranda
              </Link>
            </div>
          </div>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Dilindungi dengan enkripsi & verifikasi 2 langkah opsional
        </p>
      </div>
    </div>
  );
}
