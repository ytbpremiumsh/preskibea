import { Award, BookOpen, Wallet, CheckCircle } from "lucide-react";
import posterDefault from "@/assets/poster-beasiswa.png";
import { useBranding } from "@/hooks/use-branding";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const features = [
  {
    icon: Wallet,
    title: "Dana Pendidikan",
    desc: "Bantuan beasiswa hingga Rp17.000.000 per semester langsung ke penerima yang lolos seleksi.",
  },
  {
    icon: BookOpen,
    title: "Akses Terbuka",
    desc: "Terbuka untuk SMP, SMA/SMK/MA, dan Mahasiswa di seluruh Indonesia.",
  },
  {
    icon: Award,
    title: "Apresiasi Prestasi",
    desc: "Mengapresiasi pelajar berprestasi akademik maupun non-akademik tanpa minimal nilai.",
  },
  {
    icon: Gift,
    title: "Merchandise Eksklusif",
    desc: "Paket merchandise menarik dari Prestasi Kita untuk menunjang semangat belajarmu.",
  },
];

export function AboutMockup() {
  const { posterImage } = useBranding();
  const [remotePoster, setRemotePoster] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoster = async () => {
      try {
        const { data } = await supabase
          .from("site_settings")
          .select("value")
          .eq("key", "share_poster")
          .maybeSingle();

        const v = data?.value as any;
        // Check for unified poster first, matching logic in SharePosterPage
        const url = v?.is_unified ? v?.unified?.image_url : v?.prestasi?.image_url;
        if (url) {
          setRemotePoster(url);
        }
      } catch (error) {
        console.error("Error fetching poster:", error);
      }
    };
    fetchPoster();
  }, []);

  const posterImg = remotePoster || posterImage || posterDefault;

  return (
    <section className="container-page py-20">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          Tentang Program
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-foreground">
          Prestasi Kita adalah?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Prestasi Kita adalah sebuah lembaga pemberi beasiswa dan platform pengembangan diri yang berkomitmen 
          untuk mendukung pelajar dan mahasiswa Indonesia dalam mencapai potensi maksimal mereka. 
          Melalui program beasiswa pendidikan nasional, kami memberikan bantuan dana pendidikan dan apresiasi 
          atas pencapaian akademik maupun non-akademik secara transparan dan tanpa biaya pendaftaran.
        </p>
      </div>

      <div className="mt-16 grid lg:grid-cols-2 gap-12 items-center">
        <div className="order-2 lg:order-1 grid sm:grid-cols-2 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="card-block group p-6 transition"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary group-hover:scale-105 transition">
                <f.icon size={20} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
        
        <div className="order-1 lg:order-2 flex justify-center">
          <div className="card-block overflow-hidden max-w-md w-full rotate-2 hover:rotate-0 transition-transform duration-500">
            <img 
              src={posterImg} 
              alt="Poster Beasiswa Prestasi Kita" 
              className="w-full h-auto object-contain shadow-2xl"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.includes('undefined') || target.src.includes('null') || (target.src !== new URL(posterDefault, window.location.origin).href)) {
                  target.src = posterDefault;
                }
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
