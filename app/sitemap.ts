import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://pixmo.app'
  const langs = ['ko', 'en', 'ja', 'zh', 'es', 'fr', 'de', 'pt']

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    ...langs.map(lang => ({
      url: `${base}/?lang=${lang}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
