import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Navbar from "@/components/navbar"
import { getBloggerPosts } from "@/lib/blogger"
import { Calendar, ArrowRight, BookOpen, ExternalLink, Globe } from "lucide-react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Publikasi & Buletin - Pusat Informasi Laboratorium Jerukagung Seismologi",
  description: "Daftar publikasi resmi, buletin cuaca, dan laporan penelitian dari Laboratorium Jerukagung Seismologi melalui Google Blogger.",
}

export default async function PublikasiPage() {
  const posts = await getBloggerPosts(20)

  return (
    <>
      <Header />
      <Navbar />

      <main className="min-h-screen bg-gray-50/60 dark:bg-gray-900/60 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header Banner */}
          <div className="mb-10 text-center md:text-left md:flex md:items-end md:justify-between border-b border-gray-200 dark:border-gray-800 pb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 text-xs font-semibold text-primary-700 dark:text-primary-300 mb-3">
                <Globe className="h-3.5 w-3.5" />
                Google Blogger Feed
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Publikasi & Buletin Ilmiah
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-2 max-w-2xl leading-relaxed">
                Kumpulan buletin resmi, laporan pemantauan cuaca, dan publikasi penelitian dari Laboratorium Jerukagung Seismologi.
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex-shrink-0">
              <span className="inline-block text-xs font-semibold text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                {posts.length} Publikasi Tersedia
              </span>
            </div>
          </div>

          {/* Grid Publikasi */}
          {posts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {posts.map((item) => (
                <article
                  key={item.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg border border-gray-100 dark:border-gray-700/80 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Gambar Sampul */}
                  <div className="relative h-52 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      {item.categories && item.categories.length > 0 ? (
                        item.categories.slice(0, 2).map((cat, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-gray-900/90 text-primary-700 dark:text-primary-300 shadow-sm backdrop-blur-sm"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/95 dark:bg-gray-900/90 text-primary-700 dark:text-primary-300 shadow-sm backdrop-blur-sm">
                          Publikasi
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Konten Card */}
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2.5 gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>{item.date}</span>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug">
                      <Link href={`/publikasi/${item.id}`}>{item.title}</Link>
                    </h2>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-5 line-clamp-3 flex-grow leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 mt-auto flex items-center justify-between">
                      <Link
                        href={`/publikasi/${item.id}`}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-semibold inline-flex items-center gap-1.5 group-hover:underline"
                      >
                        Baca Selengkapnya
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>

                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                          title="Buka sumber asli di Blogger"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-10 max-w-lg mx-auto shadow-sm">
              <div className="w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Belum Ada Publikasi Tersedia
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                Saat ini belum ada artikel yang diterbitkan di blog Google Blogger. Setiap postingan baru yang diterbitkan di Blogger akan otomatis tersinkronisasi ke sini.
              </p>
              <Link
                href="/"
                className="inline-flex items-center text-sm font-semibold text-primary-600 hover:underline"
              >
                &larr; Kembali ke Beranda
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
