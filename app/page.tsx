import { CloudSun, LineChart, FlaskRoundIcon, Server, ArrowRight, Calendar, BookOpen } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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
            Penelitian dan Pengembangan Instrumentasi
          </p>
          <div className="flex flex-wrap justify-center gap-4"></div>
        </div>
      </div>

      {/* News and Updates Section (100% Blogger) */}
      <section className="bg-primary-50 dark:bg-gray-900 py-12 border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Pembaruan Resmi
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mt-1">
                Publikasi & Riset Terbaru
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Catatan riset, pengamatan cuaca, dan instrumen kebumian resmi dari Google Blogger
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

      {/* Services Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Fokus Utama
            </span>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-1 mb-3">
              Layanan & Bidang Riset
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto text-sm md:text-base">
              Kami berfokus pada penelitian dan pengembangan instrumentasi kebumian serta analisis data sains atmosfer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border-t-4 border-primary-500 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-full">
                  <CloudSun className="h-7 w-7 text-primary-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center mb-2 text-gray-900 dark:text-white">
                Pemantauan Fenomena Alam
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center text-sm leading-relaxed">
                Pengamatan fenomena alam untuk memahami dinamika lingkungan hidup dan perubahan iklim mikro.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border-t-4 border-primary-500 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-full">
                  <LineChart className="h-7 w-7 text-primary-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center mb-2 text-gray-900 dark:text-white">
                Analisis Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center text-sm leading-relaxed">
                Analisis mendalam terhadap data kebumian untuk memberikan wawasan yang lebih baik tentang fenomena alam.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border-t-4 border-primary-500 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-full">
                  <FlaskRoundIcon className="h-7 w-7 text-primary-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center mb-2 text-gray-900 dark:text-white">
                Riset & Pengembangan
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center text-sm leading-relaxed">
                Berpartisipasi dalam riset dan pengembangan instrumentasi lintas bidang ilmu pengetahuan.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border-t-4 border-primary-500 hover:shadow-md transition-shadow">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-full">
                  <Server className="h-7 w-7 text-primary-500" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-center mb-2 text-gray-900 dark:text-white">
                Penyimpanan Data
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center text-sm leading-relaxed">
                Infrastruktur penyimpanan data sensor untuk memberikan akses penelitian yang andal dan berkelanjutan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary-700 text-white py-14">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Laboratorium Jerukagung Seismologi</h2>
          <p className="max-w-2xl mx-auto mb-8 text-primary-100 text-sm md:text-base leading-relaxed">
            Pusat riset dan pemantauan sains atmosfer dan kebumian. Dapatkan wawasan ilmiah dan publikasi terkini.
          </p>
          <Button size="lg" asChild className="bg-white text-primary-700 hover:bg-gray-100 font-semibold shadow-md">
            <Link href="/publikasi">Jelajahi Publikasi</Link>
          </Button>
        </div>
      </section>
      <Footer />
    </>
  )
}
