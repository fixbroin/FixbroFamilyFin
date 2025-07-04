import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  const siteUrl = 'https://balance.fixbro.in' // TODO: Replace with your production URL
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/login/',
        '/signup/',
        '/join-family/',
        '/dashboard/',
        '/expenses/',
        '/earnings/',
        '/settings/',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
