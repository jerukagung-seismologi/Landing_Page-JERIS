import { db } from "@/lib/ConfigFirebase"
import { collection, getDocs, doc, getDoc, query, orderBy, limit } from "firebase/firestore"

export interface BlogPost {
  id: string
  title: string
  date: string
  isoDate?: string
  summary: string
  content?: string
  thumbnail: string
  author?: string
  categories?: string[]
  url?: string
  source?: "website" | "blogger" | "fallback"
}

export const FALLBACK_POSTS: BlogPost[] = [
  {
    id: "laporan-cuaca-april-2025",
    title: "Laporan Cuaca Bulanan: April 2025",
    date: "5 Mei 2025",
    isoDate: "2025-05-05T08:00:00.000Z",
    summary:
      "Ringkasan kondisi cuaca dan iklim selama bulan April 2025 di wilayah Jerukagung dan sekitarnya.",
    thumbnail: "/img/beritaiklim.jpg",
    author: "Laboratorium Jerukagung",
    categories: ["Buletin", "Iklim"],
    source: "fallback",
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
    isoDate: "2025-04-07T08:00:00.000Z",
    summary:
      "Ringkasan kondisi cuaca dan iklim selama bulan Maret 2025 di wilayah Jerukagung dan sekitarnya.",
    thumbnail: "/img/beritaiklim.jpg",
    author: "Laboratorium Jerukagung",
    categories: ["Buletin", "Iklim"],
    source: "fallback",
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
    isoDate: "2025-03-10T08:00:00.000Z",
    summary:
      "Ringkasan kondisi cuaca dan iklim selama bulan Februari 2025 di wilayah Jerukagung dan sekitarnya.",
    thumbnail: "/img/beritaiklim.jpg",
    author: "Laboratorium Jerukagung",
    categories: ["Buletin", "Iklim"],
    source: "fallback",
    content: `
      <p>Ringkasan kondisi cuaca dan iklim selama bulan Februari 2025 di wilayah Jerukagung dan sekitarnya.</p>
      <p>Kondisi atmosfer dipengaruhi oleh penguatan monsun barat dengan curah hujan tinggi yang merata di seluruh kawasan lereng dan dataran.</p>
    `,
  },
  {
    id: "laporan-cuaca-januari-2025",
    title: "Laporan Cuaca Bulanan: Januari 2025",
    date: "10 Februari 2025",
    isoDate: "2025-02-10T08:00:00.000Z",
    summary:
      "Ringkasan kondisi cuaca dan iklim selama bulan Januari 2025 di wilayah Jerukagung dan sekitarnya.",
    thumbnail: "/img/beritaiklim.jpg",
    author: "Laboratorium Jerukagung",
    categories: ["Buletin", "Iklim"],
    source: "fallback",
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

export function formatDateIndo(dateString?: string): string {
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

  let thumbnail = ""
  if (item.images && item.images.length > 0 && item.images[0].url) {
    thumbnail = item.images[0].url
  } else {
    const match = fullContent.match(/<img[^>]+src=["']([^"']+)["']/)
    thumbnail = match ? match[1] : "/img/beritaiklim.jpg"
  }

  const dateFormatted = formatDateIndo(item.published)
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
    isoDate: item.published || item.updated || "",
    summary,
    content: fullContent,
    thumbnail,
    author,
    categories,
    url: originalUrl,
    source: "blogger",
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
    isoDate: item.published?.$t || item.updated?.$t || "",
    summary,
    content: fullContent,
    thumbnail,
    author,
    categories,
    url: originalUrl,
    source: "blogger",
  }
}

function getCredentials() {
  const apiKey = (process.env.NEXT_PUBLIC_BLOGGER_API_KEY || process.env.BLOGGER_API_KEY || "").trim()
  const blogId = (process.env.NEXT_PUBLIC_BLOG_ID || process.env.BLOGGER_BLOG_ID || "").trim()
  const blogUrl = (process.env.NEXT_PUBLIC_BLOGGER_URL || process.env.BLOGGER_URL || "").trim()

  return { apiKey, blogId, blogUrl }
}

/**
 * Mengambil artikel lokal dari Firebase Firestore (dibuat langsung di website JERIS)
 */
async function getFirestorePosts(maxResults: number = 20): Promise<BlogPost[]> {
  try {
    const q = query(
      collection(db, "publications"),
      orderBy("createdAt", "desc"),
      limit(maxResults)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data()
      let dateFormatted = ""
      let isoDate = ""

      if (data.createdAt?.toDate) {
        const d = data.createdAt.toDate()
        isoDate = d.toISOString()
        dateFormatted = formatDateIndo(isoDate)
      } else if (data.createdAt) {
        isoDate = new Date(data.createdAt).toISOString()
        dateFormatted = formatDateIndo(isoDate)
      } else {
        isoDate = new Date().toISOString()
        dateFormatted = formatDateIndo(isoDate)
      }

      return {
        id: docSnap.id,
        title: data.title || "Tanpa Judul",
        date: dateFormatted,
        isoDate,
        summary: data.summary || "",
        content: data.content || "",
        thumbnail: data.thumbnail || "/img/beritaiklim.jpg",
        author: data.author || "Laboratorium Jerukagung",
        categories: Array.isArray(data.categories)
          ? data.categories
          : typeof data.categories === "string"
          ? data.categories.split(",").map((c: string) => c.trim()).filter(Boolean)
          : [],
        url: data.url || "",
        source: "website" as const,
      }
    })
  } catch (error) {
    console.warn("[Firestore Publications] Fetch notice:", error)
    return []
  }
}

/**
 * Mengambil daftar postingan terbaru (Hybrid: Website Firestore + Google Blogger API)
 */
export async function getBloggerPosts(maxResults: number = 6): Promise<BlogPost[]> {
  // 1. Ambil artikel yang dibuat langsung di website dari Firebase Firestore
  const localPosts = await getFirestorePosts(maxResults)

  // 2. Ambil artikel dari Google Cloud Blogger API v3
  let bloggerPosts: BlogPost[] = []
  const { apiKey, blogId, blogUrl } = getCredentials()

  if (apiKey && blogId) {
    try {
      const endpoint = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${apiKey}&maxResults=${maxResults}`
      const res = await fetch(endpoint, {
        next: { revalidate: 3600 },
      })

      if (res.ok) {
        const data = await res.json()
        if (data.items && data.items.length > 0) {
          bloggerPosts = data.items.map(parseApiV3ItemToBlogPost)
        }
      }
    } catch (error) {
      console.warn("[Blogger API v3] Fetch error:", error)
    }
  }

  // Jika API v3 belum ada atau kosong tapi ada blogUrl, coba feed publik
  if (bloggerPosts.length === 0 && blogUrl) {
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
          bloggerPosts = entries.map((item: any, idx: number) => parseFeedEntryToBlogPost(item, idx))
        }
      }
    } catch (error) {
      console.warn("[Blogger Feed] Fetch error:", error)
    }
  }

  // 3. Gabungkan postingan internal website + Blogger, urutkan dari yang paling baru
  const combined = [...localPosts, ...bloggerPosts]
  if (combined.length > 0) {
    combined.sort((a, b) => {
      const timeA = a.isoDate ? new Date(a.isoDate).getTime() : 0
      const timeB = b.isoDate ? new Date(b.isoDate).getTime() : 0
      return timeB - timeA
    })
    return combined.slice(0, maxResults)
  }

  // 4. Fallback jika dua-duanya belum terisi
  return FALLBACK_POSTS.slice(0, maxResults)
}

/**
 * Mengambil satu artikel lengkap berdasarkan ID postingan
 */
export async function getBloggerPostById(id: string): Promise<BlogPost | null> {
  // 1. Cek terlebih dahulu di Firebase Firestore (artikel buatan langsung di website)
  try {
    const docRef = doc(db, "publications", id)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      let dateFormatted = ""
      let isoDate = ""

      if (data.createdAt?.toDate) {
        const d = data.createdAt.toDate()
        isoDate = d.toISOString()
        dateFormatted = formatDateIndo(isoDate)
      } else if (data.createdAt) {
        isoDate = new Date(data.createdAt).toISOString()
        dateFormatted = formatDateIndo(isoDate)
      } else {
        isoDate = new Date().toISOString()
        dateFormatted = formatDateIndo(isoDate)
      }

      return {
        id: docSnap.id,
        title: data.title || "Tanpa Judul",
        date: dateFormatted,
        isoDate,
        summary: data.summary || "",
        content: data.content || "",
        thumbnail: data.thumbnail || "/img/beritaiklim.jpg",
        author: data.author || "Laboratorium Jerukagung",
        categories: Array.isArray(data.categories)
          ? data.categories
          : typeof data.categories === "string"
          ? data.categories.split(",").map((c: string) => c.trim()).filter(Boolean)
          : [],
        url: data.url || "",
        source: "website",
      }
    }
  } catch (err) {
    // Abaikan jika ID bukan format Firestore
  }

  // 2. Cek apakah ID ada di fallback posts
  const fallback = FALLBACK_POSTS.find((p) => p.id === id)

  const { apiKey, blogId, blogUrl } = getCredentials()

  // 3. Cek di Google Cloud Blogger API v3
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
      console.warn(`[Blogger API v3] Error fetching post ${id}:`, error)
    }
  }

  // 4. Cek di Blogger Public JSON Feed
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
      console.warn(`[Blogger Feed] Error fetching post ${id}:`, error)
    }
  }

  // 5. Cari di daftar postingan terbaru sebagai cadangan
  const recentPosts = await getBloggerPosts(50)
  const found = recentPosts.find((p) => p.id === id)
  if (found) return found

  return fallback || null
}
