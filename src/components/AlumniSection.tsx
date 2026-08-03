import a1 from "@/assets/peraih-1.png";
import a2 from "@/assets/peraih-2.png";
import a3 from "@/assets/peraih-3.png";
import a4 from "@/assets/peraih-4.png";
import { Quote, Trophy } from "lucide-react";

const alumni = [
  {
    img: a1,
    name: "Fahrana Zarifa Walijismi",
    school: "Peraih Beasiswa",
    year: "SECTION #2 - 2023",
    quote: "Beasiswa ini membantu saya fokus belajar tanpa khawatir biaya pendidikan.",
  },
  {
    img: a2,
    name: "Salsabila Aulia Rahmadani",
    school: "Peraih Beasiswa",
    year: "SECTION #2 - 2023",
    quote: "Selain dana, mentoringnya membuka banyak peluang baru bagi saya.",
  },
  {
    img: a3,
    name: "Rahma Fitri Nurhidayah",
    school: "Peraih Beasiswa",
    year: "SECTION #2 - 2023",
    quote: "Prestasi Kita memberi dukungan nyata yang membuat saya semakin termotivasi.",
  },
  {
    img: a4,
    name: "Wasil Mubarok",
    school: "Peraih Beasiswa",
    year: "SECTION #2 - 2023",
    quote: "Proses seleksinya transparan dan benar-benar tanpa pungutan biaya.",
  },
];

export function AlumniSection() {
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

      <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {alumni.map((a) => (
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
