import { notFound } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { ArrowLeft, Calendar, User, Tag, ExternalLink, Globe } from "lucide-react"
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

  // Ambil publikasi lainnya dari Blogger untuk bagian rekomendasi di bawah
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

      <main className="min-h-screen bg-gray-50/70 dark:bg-gray-900/70 py-10">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb & Tombol Kembali */}
          <nav className="flex items-center gap-2 text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Link href="/" className="hover:text-primary-600 transition-colors">
              Beranda
            </Link>
            <span>/</span>
            <Link href="/publikasi" className="hover:text-primary-600 transition-colors">
              Publikasi
            </Link>
            <span>/</span>
            <span className="text-gray-800 dark:text-gray-200 truncate max-w-[200px] md:max-w-md">
              {post.title}
            </span>
          </nav>

          <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80 overflow-hidden">
            {/* Header Artikel */}
            <div className="p-6 md:p-10 border-b border-gray-100 dark:border-gray-700/80">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {post.categories && post.categories.length > 0 && post.categories.map((cat, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                  >
                    <Tag className="mr-1 h-3 w-3" />
                    {cat}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight mb-5">
                {post.title}
              </h1>

              <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs sm:text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                {post.date && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-primary-500" />
                    <span>{post.date}</span>
                  </div>
                )}
                {post.author && (
                  <div className="flex items-center gap-1.5">
                    <User className="h-4 w-4 text-primary-500" />
                    <span>{post.author}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Gambar Sampul Unggulan (HD & Framing Proporsional Tanpa Terpotong) */}
            {post.thumbnail && (
              <div className="relative w-full max-h-[540px] overflow-hidden bg-gray-950/5 dark:bg-gray-900/60 flex items-center justify-center border-b border-gray-100 dark:border-gray-800">
                {/* Ambient blur backdrop untuk estetika modern pada layar lebar */}
                <div
                  className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 dark:opacity-30 scale-110 pointer-events-none"
                  style={{ backgroundImage: `url(${post.thumbnail})` }}
                />
                <img
                  src={post.thumbnail}
                  alt={post.title}
                  className="relative max-h-[500px] w-auto max-w-full object-contain mx-auto shadow-sm"
                />
              </div>
            )}

            {/* Konten HTML Artikel Lengkap */}
            <div className="p-6 md:p-10">
              <div
                className="article-content text-gray-800 dark:text-gray-200 max-w-none"
                dangerouslySetInnerHTML={{
                  __html: post.content || "<p>Tidak ada konten yang tersedia.</p>",
                }}
              />
            </div>

            {/* Footer Artikel & Tombol Aksi */}
            <div className="p-6 md:p-8 bg-gray-50/70 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/publikasi"
                className="inline-flex items-center text-sm font-semibold text-primary-600 dark:text-primary-400 hover:underline gap-1.5"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Daftar Publikasi
              </Link>
            </div>
          </article>

          {/* Rekomendasi Publikasi Lainnya dari Blogger */}
          {recentPosts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                Publikasi Lainnya
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recentPosts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
                  >
                    <div className="h-44 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-full w-full object-cover object-top hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-grow">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                        {item.date}
                      </span>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 flex-grow">
                        {item.summary}
                      </p>
                      <Link
                        href={`/publikasi/${item.id}`}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 text-xs font-semibold"
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
