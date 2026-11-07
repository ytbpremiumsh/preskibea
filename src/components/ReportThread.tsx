import type { ReportMessage } from "@/lib/reports";

export function ReportThread({ messages }: { messages?: ReportMessage[] }) {
  if (!messages?.length) return null;
  return (
    <ol className="mt-4 space-y-3" aria-label="Percakapan tiket">
      {messages.map((m) => (
        <li
          key={m.id}
          className={`max-w-[90%] rounded-xl border p-3 ${m.sender === "admin" ? "border-primary/15 bg-primary/5" : "ml-auto bg-muted/40"}`}
        >
          <p className={`text-xs font-bold ${m.sender === "admin" ? "text-primary" : "text-muted-foreground"}`}>
            {m.sender === "admin" ? "Admin" : "Peserta"} · {new Date(m.created_at).toLocaleString("id-ID")}
          </p>
          <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6">{m.message}</p>
          {m.image_url && (
            <a href={m.image_url} target="_blank" rel="noopener noreferrer">
              <img src={m.image_url} alt="Lampiran balasan" className="mt-2 max-h-40 max-w-full rounded-md border object-contain" />
            </a>
          )}
        </li>
      ))}
    </ol>
  );
}
