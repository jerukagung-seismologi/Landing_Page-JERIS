import { MetadataRoute } from 'next'
import { getBloggerPosts } from '@/lib/blogger'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://jerukagunglabs.web.id'

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/publikasi`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/katalog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/teams`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]

  try {
    const posts = await getBloggerPosts(50)
    const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
      url: `${baseUrl}/publikasi/${post.id}`,
      lastModified: post.isoDate ? new Date(post.isoDate) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    return [...staticRoutes, ...postRoutes]
  } catch (error) {
    console.error('[Sitemap] Failed to fetch blogger posts for sitemap:', error)
    return staticRoutes
  }
}
