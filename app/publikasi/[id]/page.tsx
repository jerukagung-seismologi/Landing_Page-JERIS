import { notFound } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { ArrowLeft, Calendar, User, Tag, ExternalLink } from "lucide-react"
import { getBloggerPostById, getBloggerPosts } from "@/lib/blogger"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const post = await getBloggerPostById(id)

  if (!post) {
    return {
      title: "Publikasi Tidak Ditemukan - Jerukagung Seismologi",
    }
  }

  return {
    title: `${post.title} - Pusat Informasi Laboratorium Jerukagung Seismologi`,
    description: post.summary,
    alternates: {
      canonical: `/publikasi/${post.id}`,
    },
    openGraph: {
      title: post.title,
      description: post.summary,
      url: `/publikasi/${post.id}`,
      type: "article",
      publishedTime: post.isoDate,
      authors: post.author ? [post.author] : ["Jerukagung Seismologi"],
      images: post.thumbnail ? [{ url: post.thumbnail }] : [],
    },
  }
}

export default async function PublikasiDetailPage({ params }: PageProps) {
  const { id } = await params
  const post = await getBloggerPostById(id)

  if (!post) {
    notFound()
  }

  // Ambil beberapa artikel lainnya untuk rekomendasi di bawah
  const recentPosts = (await getBloggerPosts(4)).filter((p) => p.id !== post.id).slice(0, 3)

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.summary,
    image: post.thumbnail ? [post.thumbnail] : [],
    datePublished: post.isoDate || new Date().toISOString(),
    dateModified: post.isoDate || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: post.author || "Jerukagung Seismologi",
    },
    publisher: {
      "@type": "Organization",
      name: "Laboratorium Jerukagung Seismologi",
      logo: {
        "@type": "ImageObject",
        url: "https://jerukagunglabs.web.id/img/logo.png",
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://jerukagunglabs.web.id/publikasi/${post.id}`,
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <Navbar />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Navigasi Kembali */}
          <div className="mb-6">
            <Link
              href="/publikasi"
              className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Daftar Publikasi
            </Link>
          </div>

          <article className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            {/* Header Artikel */}
            <div className="p-6 md:p-10 border-b border-gray-100 dark:border-gray-700">
              {post.categories && post.categories.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.categories.map((cat, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300"
                    >
                      <Tag className="mr-1 h-3 w-3" />
                      {cat}
                    </span>
                  ))}
                </div>
              )}

              <h1 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white leading-tight mb-4">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                {post.date && (
                  <div className="flex items-center">
                    <Calendar className="mr-1.5 h-4 w-4 text-gray-400" />
                    <span>{post.date}</span>
                  </div>
                )}
                {post.author && (
                  <div className="flex items-center">
                    <User className="mr-1.5 h-4 w-4 text-gray-400" />
                    <span>{post.author}</span>
                  </div>
                )}
                {post.url && (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-gray-400 hover:text-primary-600 ml-auto"
                    title="Buka sumber asli di Blogger"
                  >
                    Sumber Blogger <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Gambar Unggulan / Thumbnail */}
            {post.thumbnail && (
              <div className="w-full max-h-[460px] overflow-hidden bg-gray-100 dark:bg-gray-900">
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="w-full h-full object-cover max-h-[460px]"
                />
              </div>
            )}

            {/* Isi Konten HTML Artikel */}
            <div className="p-6 md:p-10">
              <div
                className="article-content text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: post.content || "<p>Tidak ada konten yang tersedia.</p>" }}
              />
            </div>
          </article>

          {/* Rekomendasi Publikasi Lainnya */}
          {recentPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Publikasi Lainnya
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentPosts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col"
                  >
                    <div className="h-40 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{item.date}</p>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 flex-grow">
                        {item.summary}
                      </p>
                      <Link
                        href={`/publikasi/${item.id}`}
                        className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-xs font-semibold"
                      >
                        Baca Selengkapnya &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}

