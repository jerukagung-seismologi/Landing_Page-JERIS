import { CloudSun, LineChart, FlaskRoundIcon, Server, ArrowRight } from "lucide-react"
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">Selamat Datang di Pusat Informasi Laboratorium Jerukagung Seismologi</h1>
          <p className="text-xl md:text-2xl drop-shadow-lg mb-8">
            Penelitian dan Pengembangan Instrumentasi
          </p>
          <div className="flex flex-wrap justify-center gap-4">
          </div>
        </div>
      </div>

      {/* News and Updates Section */}
      <section className="bg-primary-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-medium text-primary-700 dark:text-primary-300">Publikasi</h2>
            <Link
              href="/publikasi"
              className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 flex items-center text-sm font-medium"
            >
              Lihat Semua <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-md shadow-sm overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700">
                <div className="h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4 flex flex-col flex-grow">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{item.date}</p>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">{item.summary}</p>
                  <Link
                    href={`/publikasi/${item.id}`}
                    className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium"
                  >
                    Baca Selengkapnya
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-medium text-primary-700 dark:text-primary-300 mb-4">Layanan Kami</h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Kami berfokus pada penelitian dan pengembangan instrumentasi kebumian
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white dark:bg-gray-900 rounded-md shadow-sm p-6 border-t-4 border-primary-500">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-full">
                  <CloudSun className="h-8 w-8 text-primary-500" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-center mb-3 text-gray-900 dark:text-white">Pemantauan Fenomena Alam</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Pengamatan fenomena alam untuk memahami dinamika lingkungan hidup dan perubahan 
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-md shadow-sm p-6 border-t-4 border-primary-500">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-full">
                  <LineChart className="h-8 w-8 text-primary-500" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-center mb-3 text-gray-900 dark:text-white">Analisis Data</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Analisis mendalam terhadap data kebumian untuk memberikan wawasan yang lebih baik tentang fenomena alam.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-md shadow-sm p-6 border-t-4 border-primary-500">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-full">
                  <FlaskRoundIcon className="h-8 w-8 text-primary-500" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-center mb-3 text-gray-900 dark:text-white">
                Penelitian dan Pengembangan
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Berpartisipasi dalam penelitian dan pengembangan dengan berbagai lintas bidang ilmu pengetahuan.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-md shadow-sm p-6 border-t-4 border-primary-500">
              <div className="flex justify-center mb-4">
                <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-full">
                  <Server className="h-8 w-8 text-primary-500" />
                </div>
              </div>
              <h3 className="text-xl font-medium text-center mb-3 text-gray-900 dark:text-white">Pernyimpanan Data</h3>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Penyimpanan data untuk memberikan akses penelitian dan pengembangan yang lebih baik.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-primary-700 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-medium mb-4">Bergabunglah dengan Kami</h2>
          <p className="max-w-2xl mx-auto mb-8">
            Ikuti perkembangan terbaru tentang cuaca dan iklim di wilayah Jerukagung. Dapatkan akses ke data dan
            analisis terkini.
          </p>
          <Button size="lg" className="bg-white text-primary-700 hover:bg-gray-100">
            Daftar Sekarang
          </Button>
        </div>
      </section>
      <Footer />
    </>
  )
}
