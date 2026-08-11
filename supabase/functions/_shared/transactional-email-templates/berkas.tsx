/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Row,
  Column,
  Hr,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface BerkasTemplateProps {
  full_name?: string
  token?: string
  kind?: string
  count?: number | string
  siteName?: string
}

const BerkasEmail = ({
  full_name = "Pendaftar",
  token = "PK-XXXX-XXXX",
  kind = "umum",
  count = 0,
  siteName = "Prestasi Kita",
}: BerkasTemplateProps) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Berkas Diterima - {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Halo, {full_name}!</Heading>
        <Text style={text}>
          Berkas pendukung Anda untuk program <strong>{siteName} Batch #8</strong> telah kami terima dan masuk dalam tahap verifikasi.
        </Text>
        
        <Section style={infoBox}>
          <Row>
            <Column>
              <Text style={label}>Nomor Pendaftaran:</Text>
              <Text style={value}>{token}</Text>
            </Column>
          </Row>
          <Row>
            <Column>
              <Text style={label}>Kategori Beasiswa:</Text>
              <Text style={value}>{kind.charAt(0).toUpperCase() + kind.slice(1)}</Text>
            </Column>
          </Row>
          <Row>
            <Column>
              <Text style={label}>Jumlah Berkas:</Text>
              <Text style={value}>{count} Dokumen</Text>
            </Column>
          </Row>
        </Section>

        <Text style={text}>
          Tim kami akan melakukan verifikasi terhadap berkas yang telah Anda kirimkan. Anda dapat memantau status pendaftaran secara berkala melalui website kami menggunakan nomor pendaftaran di atas.
        </Text>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          Email ini dikirim secara otomatis oleh sistem {siteName}.<br/>
          Jika Anda tidak merasa mengirimkan berkas, silakan abaikan email ini.
        </Text>
      </Container>
    </Body>
  </Html>
)

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif', padding: '40px 0' }
const container = { backgroundColor: '#ffffff', border: '1px solid #e1e4e8', borderRadius: '12px', padding: '40px', maxWidth: '600px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold' as const, color: '#0B1F3A', margin: '0 0 20px' }
const text = { fontSize: '16px', color: '#484848', lineHeight: '1.6', margin: '0 0 20px' }
const infoBox = { background: '#f8fafc', borderRadius: '8px', padding: '20px', border: '1px solid #edf2f7', margin: '20px 0' }
const label = { fontSize: '12px', color: '#718096', textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 4px' }
const value = { fontSize: '18px', fontWeight: 'bold' as const, color: '#0B1F3A', margin: '0 0 16px' }
const hr = { borderColor: '#e2e8f0', margin: '20px 0' }
const footer = { fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }

export const template: TemplateEntry = {
  component: BerkasEmail,
  subject: (data) => `Berkas Terkirim - ${data.siteName || "Prestasi Kita"} (${data.token || ""})`,
  displayName: "Berkas Confirmation",
  previewData: {
    full_name: "Rizky Arif",
    token: "PK-REG-12345",
    kind: "umum",
    count: 5,
    siteName: "Prestasi Kita"
  }
}
