insert into public.site_settings (key, value)
values ('email_template_esai', jsonb_build_object(
  'enabled', true,
  'subject', 'Esai {{kind_label}} Berhasil Dikirim',
  'html', '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#fff;color:#1a1530">
  <h1 style="color:#5B2A9E;margin:0 0 8px">{{site_name}}</h1>
  <p style="color:#7c7c87;margin:0 0 24px;font-size:12px;letter-spacing:1px;text-transform:uppercase">Beasiswa Batch #8</p>
  <div style="border:1px solid #ece9f5;border-radius:16px;padding:28px">
    <div style="display:inline-block;background:#e8f5ed;border-radius:20px;padding:6px 14px;margin-bottom:16px">
      <span style="font-size:11px;font-weight:800;color:#0e7c4a;letter-spacing:1px">&#10003; ESAI DITERIMA</span>
    </div>
    <h2>Terima kasih, {{full_name}}!</h2>
    <p>Jawaban esai singkat Anda untuk <strong>{{kind_label}}</strong> telah berhasil kami terima.</p>
    <div style="background:#faf8ff;border:1px solid #ece9f5;border-radius:12px;padding:16px 20px;margin:20px 0">
      <p style="margin:6px 0"><span style="color:#7c7c87">Kode Pendaftar</span> &nbsp; <strong style="font-family:monospace">{{token}}</strong></p>
      <p style="margin:6px 0"><span style="color:#7c7c87">Status</span> &nbsp; <strong style="color:#b35900">Lanjut ke Pengiriman Berkas</strong></p>
    </div>
    <p>Silakan lanjutkan ke tahap <em>Pengiriman Berkas Administrasi</em> menggunakan kode pendaftar di atas.</p>
    <hr style="border:none;border-top:1px solid #ece9f5;margin:20px 0">
    <p style="font-size:11px;color:#a09bb0">&copy; {{year}} {{site_name}}</p>
  </div>
</div>'
))
on conflict (key) do nothing;