import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import Navbar from "@/components/navbar"
import { getBloggerPosts } from "@/lib/blogger"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Publikasi & Buletin - Pusat Informasi Laboratorium Jerukagung Seismologi",
  description: "Daftar publikasi, buletin cuaca, dan laporan penelitian Laboratorium Jerukagung Seismologi.",
}

export default async function PublikasiPage() {
  const posts = await getBloggerPosts(12)

  return (
    <>
      <Header />
      <Navbar />
      <section className="bg-primary-50 dark:bg-gray-900 py-10 min-h-[calc(100vh-280px)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-primary-700 dark:text-primary-300">
                Publikasi & Buletin
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Informasi dan laporan riset terbaru dari Laboratorium Jerukagung Seismologi
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-md shadow-sm overflow-hidden flex flex-col border border-gray-100 dark:border-gray-700"
              >
                <div className="h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                  <img
                    src={item.thumbnail}
                    alt={item.title}
                    className="h-full w-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{item.date}</p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">
                    {item.summary}
                  </p>
                  <Link
                    href={`/publikasi/${item.id}`}
                    className="text-primary-500 hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium inline-flex items-center"
                  >
                    Baca Selengkapnya &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}
