import { ArrowRight, Calendar, BookOpen, CloudSun, ExternalLink, Sun } from "lucide-react"
import Link from "next/link"
import Header from "@/components/header"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { getBloggerPosts } from "@/lib/blogger"

export default async function BerandaPage() {
  const posts = await getBloggerPosts(3)

  return (
    <>
      <Header />
      <Navbar />
      <div className="mainpage">
        <div className="mainpagetext">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
            Selamat Datang di Pusat Informasi Laboratorium Jerukagung Seismologi
          </h1>
          <p className="text-xl md:text-2xl drop-shadow-lg mb-8">
            Riset Rumpun Kebumian
          </p>
          <div className="flex flex-wrap justify-center gap-4 [text-shadow:none]">
            <a
              href="https://cuaca.jeris.web.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 text-sm sm:text-base border border-emerald-400/30"
            >
              <CloudSun className="h-5 w-5 text-amber-300" />
              <span>Dashboard Jerukagung Meteorologi</span>
              <ExternalLink className="h-4 w-4 ml-0.5 opacity-80" />
            </a>

            <a
              href="https://meteo.jeris.web.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 text-sm sm:text-base border border-sky-400/30"
            >
              <Sun className="h-5 w-5 text-sky-200" />
              <span>Meteo Sense</span>
              <ExternalLink className="h-4 w-4 ml-0.5 opacity-80" />
            </a>

            <Link
              href="/publikasi"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold backdrop-blur-md border border-white/40 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 text-sm sm:text-base"
            >
              <BookOpen className="h-5 w-5" />
              <span>Publikasi Riset</span>
              <ArrowRight className="h-4 w-4 ml-0.5" />
            </Link>

            <Link
              href="/katalog"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-black/30 hover:bg-black/50 text-white font-semibold backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5 text-sm sm:text-base"
            >
              <span>Katalog Instrumen</span>
            </Link>
          </div>
        </div>
      </div>

      {/* News and Updates Section (100% Blogger) */}
      <section className="bg-primary-50 dark:bg-gray-900 py-12 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                Publikasi & Riset Terbaru
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Catatan riset, Pengamatan cuaca, dan Informasi
              </p>
            </div>
            {posts.length > 0 && (
              <Link
                href="/publikasi"
                className="group text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center text-sm font-semibold transition-colors"
              >
                Lihat Semua Publikasi
                <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </div>

          {posts.length > 0 ? (
            <div className={`grid gap-6 ${posts.length === 1 ? "grid-cols-1 max-w-2xl mx-auto" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
              {posts.map((item) => (
                <div
                  key={item.id}
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="relative h-56 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/95 dark:bg-gray-900/90 text-primary-700 dark:text-primary-300 shadow-sm backdrop-blur-sm">
                        {item.categories?.[0] || "Publikasi"}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2.5 gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{item.date}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-5 line-clamp-3 flex-grow leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 mt-auto">
                      <Link
                        href={`/publikasi/${item.id}`}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-semibold inline-flex items-center gap-1 group-hover:underline"
                      >
                        Baca Selengkapnya
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-8 max-w-xl mx-auto">
              <div className="w-12 h-12 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-3">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                Belum Ada Publikasi Tersedia
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Postingan yang diterbitkan di Google Blogger akan otomatis muncul di sini.
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}
