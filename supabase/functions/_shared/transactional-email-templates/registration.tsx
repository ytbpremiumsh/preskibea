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

interface RegistrationTemplateProps {
  full_name?: string
  token?: string
  kind?: string
  status?: string
  siteName?: string
}

const RegistrationEmail = ({
  full_name = "Pendaftar",
  token = "PK-XXXX-XXXX",
  kind = "umum",
  status = "approved",
  siteName = "Prestasi Kita",
}: RegistrationTemplateProps) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Konfirmasi Pendaftaran - {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Halo, {full_name}!</Heading>
        <Text style={text}>
          Pendaftaran Anda untuk program <strong>{siteName} Batch #8</strong> telah kami terima.
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
              <Text style={label}>Status:</Text>
              <Text style={value}>{status === 'approved' ? 'Terverifikasi' : 'Menunggu Pembayaran (Fast Track)'}</Text>
            </Column>
          </Row>
        </Section>

        <Text style={text}>
          Simpan nomor pendaftaran di atas untuk melakukan pengecekan status secara berkala melalui website kami.
        </Text>
        
        <Hr style={hr} />
        
        <Text style={footer}>
          Email ini dikirim secara otomatis oleh sistem {siteName}.<br/>
          Jika Anda tidak merasa melakukan pendaftaran, abaikan email ini.
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
  component: RegistrationEmail,
  subject: (data) => `Konfirmasi Pendaftaran ${data.siteName || "Prestasi Kita"} - ${data.token || ""}`,
  displayName: "Registration Confirmation",
  previewData: {
    full_name: "Rizky Arif",
    token: "PK-REG-12345",
    kind: "umum",
    status: "approved",
    siteName: "Prestasi Kita"
  }
}
