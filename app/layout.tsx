import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'PIXMO — Pixel Art Camera & Photo Converter',
  description: 'Turn any photo into pixel art instantly. Free online pixel art camera with retro, pastel, neon, and earth tone filters. No app download needed.',
  keywords: ['pixel art', 'pixel camera', 'photo to pixel art', 'pixel converter', 'retro filter', 'pixel art maker', 'pixelate photo'],
  authors: [{ name: 'PIXMO' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    url: 'https://pixmo.app/',
    title: 'PIXMO — Pixel Art Camera',
    description: 'Turn any photo into pixel art instantly. Free, no install needed.',
    images: [{ url: 'https://pixmo.app/og-image.png', width: 1200, height: 630 }],
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PIXMO — Pixel Art Camera',
    description: 'Turn any photo into pixel art instantly. Free, no install needed.',
    images: ['https://pixmo.app/og-image.png'],
  },
  alternates: {
    canonical: 'https://pixmo.app/',
    languages: {
      ko: 'https://pixmo.app/?lang=ko',
      en: 'https://pixmo.app/?lang=en',
      ja: 'https://pixmo.app/?lang=ja',
      zh: 'https://pixmo.app/?lang=zh',
      es: 'https://pixmo.app/?lang=es',
      fr: 'https://pixmo.app/?lang=fr',
      de: 'https://pixmo.app/?lang=de',
      pt: 'https://pixmo.app/?lang=pt',
      'x-default': 'https://pixmo.app/',
    },
  },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PIXMO',
  url: 'https://pixmo.app/',
  description: 'Free online pixel art camera and photo converter with retro, pastel, neon filters.',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'Any',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  browserRequirements: 'Requires JavaScript and HTML5 Canvas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
