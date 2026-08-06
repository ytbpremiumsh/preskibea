import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  Mail,
  Phone,
  MapPin,
  Instagram,
  Facebook,
  Youtube,
  Send,
  ShieldCheck,
  Clock,
  HeartHandshake,
} from "lucide-react";
import { useBranding } from "@/hooks/use-branding";

export function SiteFooter() {
  const year = new Date().getFullYear();
  const { footerLogo } = useBranding();

  return (
    <footer className="mt-24 border-t border-border bg-secondary/40">
      {/* CTA strip */}
      <div className="bg-gradient-to-r from-primary to-primary/80">
        <div className="container-page py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="text-primary-foreground">
            <h3 className="text-lg md:text-xl font-bold">Siap meraih beasiswamu?</h3>
            <p className="text-sm opacity-90 mt-1">
              Daftar sekarang — gratis, transparan, dan terbuka untuk pelajar &amp; mahasiswa seluruh Indonesia.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/beasiswa-prestasi"
              className="inline-flex items-center gap-2 rounded-full bg-background px-5 py-2.5 text-sm font-semibold text-primary shadow-soft hover:opacity-95 transition"
            >
              Beasiswa Prestasi
            </Link>
            <Link
              to="/beasiswa-ekonomi"
              className="inline-flex items-center gap-2 rounded-full bg-background/15 ring-1 ring-background/40 px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-background/25 transition"
            >
              Beasiswa Ekonomi
            </Link>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="container-page py-14 grid gap-10 md:grid-cols-12">
        {/* Brand */}
        <div className="md:col-span-4">
          <div className="flex items-center">
            <img
              src={footerLogo}
              alt="Logo Prestasi Kita x ATSkolla"
              className="h-10 w-auto"
              loading="lazy"
            />
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Prestasi Kita</strong> adalah program beasiswa
            nasional yang berkolaborasi dengan <strong className="text-foreground">ATSkolla</strong>{" "}
            untuk mendukung pelajar &amp; mahasiswa Indonesia dalam meraih pendidikan dan mewujudkan
            prestasi.
          </p>

          <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-primary" /> Terdaftar &amp; dikelola secara resmi
            </li>
            <li className="flex items-center gap-2">
              <HeartHandshake size={14} className="text-primary" /> 100% gratis — tidak dipungut biaya
            </li>
            <li className="flex items-center gap-2">
              <Clock size={14} className="text-primary" /> Pendaftaran dibuka sepanjang periode aktif
            </li>
          </ul>

          <div className="mt-6 flex items-center gap-3">
            <a
              href="https://instagram.com/kejarprestasi_id"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid h-9 w-9 place-items-center rounded-full bg-background border border-border text-foreground hover:text-primary hover:border-primary transition"
            >
              <Instagram size={16} />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="grid h-9 w-9 place-items-center rounded-full bg-background border border-border text-foreground hover:text-primary hover:border-primary transition"
            >
              <Facebook size={16} />
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              className="grid h-9 w-9 place-items-center rounded-full bg-background border border-border text-foreground hover:text-primary hover:border-primary transition"
            >
              <Youtube size={16} />
            </a>
            <a
              href="https://wa.me/6281280010302"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="grid h-9 w-9 place-items-center rounded-full bg-background border border-border text-foreground hover:text-primary hover:border-primary transition"
            >
              <Send size={16} />
            </a>
          </div>
        </div>


        {/* Program */}
        <div className="md:col-span-2">
          <h4 className="text-sm font-semibold text-foreground">Program</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/beasiswa-prestasi" className="hover:text-primary transition">
                Beasiswa Prestasi
              </Link>
            </li>
            <li>
              <Link to="/beasiswa-ekonomi" className="hover:text-primary transition">
                Beasiswa Ekonomi
              </Link>
            </li>
            <li>
              <Link to="/berkas/prestasi" className="hover:text-primary transition">
                Pengiriman Berkas
              </Link>
            </li>
            <li>
              <Link to="/cek-status" className="hover:text-primary transition">
                Cek Status Pendaftaran
              </Link>
            </li>
            <li>
              <Link to="/bagikan-poster/prestasi" className="hover:text-primary transition">
                Bagikan Poster
              </Link>
            </li>
          </ul>
        </div>

        {/* Bantuan */}
        <div className="md:col-span-3">
          <h4 className="text-sm font-semibold text-foreground">Bantuan &amp; Informasi</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-primary transition">
                Tentang Prestasi Kita
              </Link>
            </li>
            <li>
              <Link to="/" className="hover:text-primary transition">
                FAQ &amp; Tanya Jawab
              </Link>
            </li>
            <li>
              <Link to="/" className="hover:text-primary transition">
                Syarat &amp; Ketentuan
              </Link>
            </li>
            <li>
              <Link to="/" className="hover:text-primary transition">
                Kebijakan Privasi
              </Link>
            </li>
            <li>
              <Link to="/" className="hover:text-primary transition">
                Laporkan Penipuan
              </Link>
            </li>
          </ul>
        </div>

        {/* Kontak */}
        <div className="md:col-span-3">
          <h4 className="text-sm font-semibold text-foreground">Hubungi Kami</h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <Phone size={16} className="mt-0.5 text-primary shrink-0" />
              <a href="tel:+6281280010302" className="hover:text-primary transition">
                0812-8001-0302
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={16} className="mt-0.5 text-primary shrink-0" />
              <a href="mailto:halo@prestasikita.com" className="hover:text-primary transition">
                halo@prestasikita.com
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Clock size={16} className="mt-0.5 text-primary shrink-0" />
              <span>Senin – Jumat, 09.00 – 17.00 WIB</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="border-t border-border">
        <div className="container-page py-5">
          <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-xs text-destructive">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p className="leading-relaxed">
              <strong>Waspada penipuan!</strong> Seluruh proses pendaftaran Prestasi Kita{" "}
              <strong>tidak dipungut biaya apapun</strong>. Laporkan setiap penipuan yang
              mengatasnamakan Prestasi Kita melalui kontak resmi di atas.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border bg-background">
        <div className="container-page py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            © {year} <span className="text-foreground font-semibold">Prestasi Kita</span> ×{" "}
            <span className="text-foreground font-semibold">ATSkolla</span>. Seluruh hak cipta dilindungi.
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary transition">
              Syarat &amp; Ketentuan
            </Link>
            <Link to="/" className="hover:text-primary transition">
              Kebijakan Privasi
            </Link>
            <Link to="/" className="hover:text-primary transition">
              Cookie
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
