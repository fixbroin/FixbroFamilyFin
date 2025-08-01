import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://balance.fixbro.in';
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
