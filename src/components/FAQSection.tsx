import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import faqIllustration from "@/assets/faq-illustration.png";

const faqs = [
  {
    q: "Apakah pendaftaran beasiswa ini berbayar?",
    a: "Tidak. Beasiswa Prestasi Kita 100% gratis. Tidak ada biaya pendaftaran maupun biaya seleksi dalam bentuk apa pun.",
  },
  {
    q: "Siapa saja yang boleh mendaftar?",
    a: "Pelajar SD, SMP, SMA/SMK/MA, dan Mahasiswa aktif di Indonesia, baik untuk jalur Prestasi maupun Ekonomi.",
  },
  {
    q: "Apakah ada minimal nilai rapor atau IPK?",
    a: "Tidak ada minimal nilai rapor maupun IPK. Seleksi mempertimbangkan prestasi, kebutuhan, dan kelengkapan berkas.",
  },
  {
    q: "Berapa total beasiswa yang akan diterima?",
    a: "Total beasiswa hingga Rp17.000.000 per semester untuk penerima yang lolos seluruh tahapan seleksi.",
  },
  {
    q: "Bagaimana cara mengetahui hasil seleksi?",
    a: "Pengumuman akan diinformasikan melalui email pendaftar dan diumumkan resmi pada laman ini sesuai timeline seleksi.",
  },
  {
    q: "Apakah saya bisa mendaftar di dua jalur sekaligus?",
    a: "Pendaftar hanya diperbolehkan memilih satu jalur, baik Beasiswa Prestasi atau Beasiswa Ekonomi.",
  },
  {
    q: "Bagaimana jika ada kendala saat mendaftar?",
    a: "Silakan hubungi tim Prestasi Kita melalui kontak resmi yang tertera pada footer halaman.",
  },
];

export function FAQSection() {
  return (
    <section className="bg-secondary/40 border-y border-border">
      <div className="container-page py-20">
        <div className="text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            <HelpCircle size={14} /> FAQ
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-extrabold text-foreground">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-3 text-muted-foreground">
            Jawaban singkat untuk pertanyaan paling umum seputar program Beasiswa Prestasi Kita.
          </p>
        </div>

        <div className="mt-10 grid lg:grid-cols-[1fr_1.5fr] gap-8 lg:gap-12 items-center max-w-6xl mx-auto">
          <div className="flex justify-center">
            <img
              src={faqIllustration}
              alt="Ilustrasi FAQ Beasiswa Prestasi Kita"
              loading="lazy"
              width={1024}
              height={1024}
              className="w-full max-w-xs sm:max-w-sm lg:max-w-md h-auto drop-shadow-xl"
            />
          </div>
          <div className="card-block p-2 md:p-4">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-border">
                  <AccordionTrigger className="text-left text-sm md:text-base font-semibold text-foreground hover:no-underline px-3">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground px-3">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
