import { Quote, Trophy } from "lucide-react";
import { useBranding } from "@/hooks/use-branding";
import alumni1 from "@/assets/peraih-batch7-1.png";
import alumni2 from "@/assets/peraih-batch7-2.png";
import alumni3 from "@/assets/peraih-batch7-3.png";

const FALLBACK_ALUMNI_IMAGES = [
  alumni1,
  alumni2,
  alumni3,
];

const alumniBase = [
  {
    name: "Kalaj Nazhiful Haq",
    school: "",
    year: "BATCH #7 - 2025",
    quote: "Beasiswa ini membantu saya fokus belajar tanpa khawatir biaya pendidikan.",
  },
  {
    name: "Amelia Kusuma Suryandari",
    school: "",
    year: "BATCH #7 - 2025",
    quote: "Selain dana, pembinaannya membuka banyak peluang baru bagi saya.",
  },
  {
    name: "Jahwa Aulia Hasan",
    school: "",
    year: "BATCH #7 - 2025",
    quote: "Proses seleksinya transparan dan benar-benar tanpa pungutan biaya.",
  },
];

export function AlumniSection() {
  const { alumniImages } = useBranding();

  const alumni = alumniBase.map((a, i) => {
    const imgUrl = alumniImages[i];
    return {
      ...a,
      img: imgUrl && imgUrl.startsWith('http') ? imgUrl : FALLBACK_ALUMNI_IMAGES[i],
    };
  });

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, index: number) => {
    const target = e.currentTarget;
    const fallback = FALLBACK_ALUMNI_IMAGES[index];
    if (fallback) {
      const fallbackUrl = new URL(fallback, window.location.origin).href;
      if (target.src.includes('undefined') || target.src.includes('null') || target.src !== fallbackUrl) {
        target.src = fallback;
      }
    }
  };

  return (
    <section className="container-page py-20">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-2 rounded-full bg-[oklch(0.92_0.14_85)] px-3 py-1 text-xs font-semibold text-gold-foreground">
          <Trophy size={14} /> Peraih Beasiswa
        </span>
        <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-foreground">
          Mereka Sudah Lebih Dulu Meraih
        </h2>
        <p className="mt-3 text-muted-foreground">
          Cerita singkat dari penerima Beasiswa Prestasi Kita pada gelombang sebelumnya.
        </p>
      </div>

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
        {alumni.map((a, i) => (
          <article
            key={a.name}
            className="group relative overflow-hidden card-block hover:shadow-soft hover:-translate-y-0.5 transition"
          >
            <div className="aspect-[4/5] overflow-hidden bg-secondary">
              <img
                src={a.img}
                alt={`Penerima beasiswa: ${a.name}`}
                width={768}
                height={768}
                loading="lazy"
                onError={(e) => handleImageError(e, i)}
                className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
              />
            </div>
            <div className="p-5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                {a.year}
              </span>
              <h3 className="mt-1 text-base font-bold text-foreground">{a.name}</h3>
              <p className="text-xs text-muted-foreground">{a.school}</p>
              <p className="mt-3 flex gap-1.5 text-xs text-foreground/75">
                <Quote size={14} className="shrink-0 text-primary mt-0.5" />
                <span>{a.quote}</span>
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
