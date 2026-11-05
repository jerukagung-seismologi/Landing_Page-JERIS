export interface BlogPost {
  id: string
  title: string
  date: string
  summary: string
  content?: string
  thumbnail: string
  author?: string
  categories?: string[]
  url?: string
}

export const FALLBACK_POSTS: BlogPost[] = [
  {
    id: "laporan-cuaca-april-2025",
    title: "Laporan Cuaca Bulanan: April 2025",
    date: "5 Mei 2025",
    summary:
      "Ringkasan kondisi cuaca dan iklim selama bulan April 2025 di wilayah Jerukagung dan sekitarnya.",
    thumbnail: "/img/beritaiklim.jpg",
    author: "Laboratorium Jerukagung",
    categories: ["Buletin", "Iklim"],
    content: `
      <p>Berikut adalah ringkasan komprehensif kondisi cuaca dan parameter meteorologi selama bulan April 2025 di wilayah Jerukagung dan sekitarnya.</p>
      <h3>Ringkasan Parameter Meteorologi</h3>
      <ul>
        <li><strong>Suhu Rata-rata:</strong> 27.4 °C (Min: 23.1 °C, Maks: 33.2 °C)</li>
        <li><strong>Kelembapan Relatif:</strong> 79%</li>
        <li><strong>Curah Hujan Total:</strong> 182 mm dengan 14 hari hujan</li>
        <li><strong>Kecepatan Angin Rata-rata:</strong> 8.5 km/jam dominan dari arah Tenggara</li>
      </ul>
      <p>Secara umum, kondisi cuaca berada pada kategori normal untuk masa peralihan musim. Pemantauan instrumen sensor meteorologi dan geofisika berjalan dengan stabil tanpa anomali yang signifikan.</p>
    `,
  },
  {
    id: "laporan-cuaca-maret-2025",
    title: "Laporan Cuaca Bulanan: Maret 2025",
    date: "7 April 2025",
    summary:
      "Ringkasan kondisi cuaca dan iklim selama bulan Maret 2025 di wilayah Jerukagung dan sekitarnya.",
    thumbnail: "/img/beritaiklim.jpg",
    author: "Laboratorium Jerukagung",
    categories: ["Buletin", "Iklim"],
    content: `
      <p>Ringkasan kondisi cuaca dan iklim selama bulan Maret 2025 di wilayah Jerukagung dan sekitarnya.</p>
      <p>Bulan Maret menandai puncak masa transisi dengan peningkatan aktivitas konvektif lokal pada siang hingga sore hari.</p>
      <p>Data stasiun mencatat beberapa kali hujan dengan intensitas lebat disertai petir pada pertengahan bulan. Sistem instrumentasi pemantau lingkungan dan getaran tanah tetap beroperasi 24 jam dengan ketersediaan data mencapai 99.8%.</p>
    `,
  },
  {
    id: "laporan-cuaca-februari-2025",
    title: "Laporan Cuaca Bulanan: Februari 2025",
    date: "10 Maret 2025",
    summary:
      "Ringkasan kondisi cuaca dan iklim selama bulan Februari 2025 di wilayah Jerukagung dan sekitarnya.",
    thumbnail: "/img/beritaiklim.jpg",
    author: "Laboratorium Jerukagung",
    categories: ["Buletin", "Iklim"],
    content: `
      <p>Ringkasan kondisi cuaca dan iklim selama bulan Februari 2025 di wilayah Jerukagung dan sekitarnya.</p>
      <p>Kondisi atmosfer dipengaruhi oleh penguatan monsun barat dengan curah hujan tinggi yang merata di seluruh kawasan lereng dan dataran.</p>
    `,
  },
  {
    id: "laporan-cuaca-januari-2025",
    title: "Laporan Cuaca Bulanan: Januari 2025",
    date: "10 Februari 2025",
    summary:
      "Ringkasan kondisi cuaca dan iklim selama bulan Januari 2025 di wilayah Jerukagung dan sekitarnya.",
    thumbnail: "/img/beritaiklim.jpg",
    author: "Laboratorium Jerukagung",
    categories: ["Buletin", "Iklim"],
    content: `
      <p>Ringkasan kondisi cuaca dan iklim selama bulan Januari 2025 di wilayah Jerukagung dan sekitarnya.</p>
      <p>Awal tahun 2025 ditandai dengan intensitas hujan tinggi sesuai periode puncak musim hujan tahunan di wilayah Jerukagung.</p>
    `,
  },
]

function cleanHtmlEntities(text: string): string {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
}

function formatDateIndo(dateString?: string): string {
  if (!dateString) return ""
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(dateString))
  } catch {
    return dateString.split("T")[0]
  }
}

/**
 * Parser untuk item dari Google Cloud Blogger API v3
 */
function parseApiV3ItemToBlogPost(item: any): BlogPost {
  const id = item.id || ""
  const title = item.title || "Tanpa Judul"
  const fullContent = item.content || ""

  // Thumbnail: ambil dari item.images jika ada, atau cari tag <img> pertama di konten
  let thumbnail = ""
  if (item.images && item.images.length > 0 && item.images[0].url) {
    thumbnail = item.images[0].url
  } else {
    const match = fullContent.match(/<img[^>]+src=["']([^"']+)["']/)
    thumbnail = match ? match[1] : "/img/beritaiklim.jpg"
  }

  // Format tanggal Indonesia
  const dateFormatted = formatDateIndo(item.published)

  // Bersihkan teks ringkasan
  const plainText = cleanHtmlEntities(
    fullContent.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  )
  const summary = plainText.length > 140 ? `${plainText.slice(0, 140)}...` : plainText

  const categories = item.labels || []
  const author = item.author?.displayName || "Laboratorium Jerukagung"
  const originalUrl = item.url || ""

  return {
    id,
    title,
    date: dateFormatted,
    summary,
    content: fullContent,
    thumbnail,
    author,
    categories,
    url: originalUrl,
  }
}

/**
 * Parser untuk item dari Blogger Public Feed (Atom/JSON)
 */
function parseFeedEntryToBlogPost(item: any, fallbackIndex: number = 0): BlogPost {
  const rawId = item.id?.$t || ""
  const id = rawId.includes(".post-")
    ? rawId.split(".post-")[1]
    : rawId.split("-").pop() || `post-${fallbackIndex}`

  const originalUrl = item.link?.find((l: any) => l.rel === "alternate")?.href || ""
  const fullContent = item.content?.$t || item.summary?.$t || ""

  let thumbnail = item.media$thumbnail?.url
  if (thumbnail) {
    thumbnail = thumbnail.replace(/\/s\d+(-c)?\//, "/w800-h450-c/")
  } else {
    const match = fullContent.match(/<img[^>]+src=["']([^"']+)["']/)
    thumbnail = match ? match[1] : "/img/beritaiklim.jpg"
  }

  const dateFormatted = formatDateIndo(item.published?.$t)
  const plainText = cleanHtmlEntities(
    fullContent.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim()
  )
  const summary = plainText.length > 140 ? `${plainText.slice(0, 140)}...` : plainText
  const categories = item.category?.map((c: any) => c.term).filter(Boolean) || []
  const author = item.author?.[0]?.name?.$t || "Laboratorium Jerukagung"

  return {
    id,
    title: item.title?.$t || "Tanpa Judul",
    date: dateFormatted,
    summary,
    content: fullContent,
    thumbnail,
    author,
    categories,
    url: originalUrl,
  }
}

function getCredentials() {
  const apiKey = (process.env.NEXT_PUBLIC_BLOGGER_API_KEY || process.env.BLOGGER_API_KEY || "").trim()
  const blogId = (process.env.NEXT_PUBLIC_BLOG_ID || process.env.BLOGGER_BLOG_ID || "").trim()
  const blogUrl = (process.env.NEXT_PUBLIC_BLOGGER_URL || process.env.BLOGGER_URL || "").trim()

  return { apiKey, blogId, blogUrl }
}

/**
 * Mengambil daftar postingan terbaru dari Blogger
 * Prioritas 1: Google Cloud Blogger API v3
 * Prioritas 2: Public JSON Feed
 * Prioritas 3: Fallback data
 */
export async function getBloggerPosts(maxResults: number = 6): Promise<BlogPost[]> {
  const { apiKey, blogId, blogUrl } = getCredentials()

  // 1. Coba Google Cloud Blogger API v3 (Resmi)
  if (apiKey && blogId) {
    try {
      const endpoint = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${apiKey}&maxResults=${maxResults}`
      const res = await fetch(endpoint, {
        next: { revalidate: 3600 }, // Caching Next.js ISR: perbarui tiap 1 jam
      })

      if (res.ok) {
        const data = await res.json()
        if (data.items && data.items.length > 0) {
          return data.items.map(parseApiV3ItemToBlogPost)
        }
      } else {
        console.warn(`[Blogger API v3] HTTP error ${res.status}: ${res.statusText}`)
      }
    } catch (error) {
      console.error("[Blogger API v3] Fetch error:", error)
    }
  }

  // 2. Coba Blogger Public JSON Feed (Fallback URL)
  if (blogUrl) {
    try {
      const cleanUrl = blogUrl.replace(/\/$/, "")
      const endpoint = `${cleanUrl}/feeds/posts/default?alt=json&max-results=${maxResults}`
      const res = await fetch(endpoint, {
        next: { revalidate: 3600 },
      })

      if (res.ok) {
        const data = await res.json()
        const entries = data.feed?.entry || []
        if (entries.length > 0) {
          return entries.map((item: any, idx: number) => parseFeedEntryToBlogPost(item, idx))
        }
      }
    } catch (error) {
      console.error("[Blogger Feed] Fetch error:", error)
    }
  }

  // 3. Fallback dummy data
  return FALLBACK_POSTS.slice(0, maxResults)
}

/**
 * Mengambil satu artikel lengkap berdasarkan ID postingan
 */
export async function getBloggerPostById(id: string): Promise<BlogPost | null> {
  // Cek apakah ID ada di fallback posts
  const fallback = FALLBACK_POSTS.find((p) => p.id === id)

  const { apiKey, blogId, blogUrl } = getCredentials()

  // 1. Coba Google Cloud Blogger API v3
  if (apiKey && blogId) {
    try {
      const endpoint = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${id}?key=${apiKey}`
      const res = await fetch(endpoint, {
        next: { revalidate: 3600 },
      })

      if (res.ok) {
        const data = await res.json()
        if (data && data.id) {
          return parseApiV3ItemToBlogPost(data)
        }
      }
    } catch (error) {
      console.error(`[Blogger API v3] Error fetching post ${id}:`, error)
    }
  }

  // 2. Coba Blogger Public JSON Feed
  if (blogUrl) {
    try {
      const cleanUrl = blogUrl.replace(/\/$/, "")
      const endpoint = `${cleanUrl}/feeds/posts/default/${id}?alt=json`
      const res = await fetch(endpoint, {
        next: { revalidate: 3600 },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.entry) {
          return parseFeedEntryToBlogPost(data.entry)
        }
      }
    } catch (error) {
      console.error(`[Blogger Feed] Error fetching post ${id}:`, error)
    }
  }

  // 3. Cari di 50 postingan terbaru sebagai cadangan
  const recentPosts = await getBloggerPosts(50)
  const found = recentPosts.find((p) => p.id === id)
  if (found) return found

  return fallback || null
}
