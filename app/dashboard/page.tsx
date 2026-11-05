"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  ExternalLink,
  PenSquare,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Globe,
  BookOpen,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
} from "lucide-react"
import { onAuthStateChanged, signOut, type User } from "firebase/auth"
import { auth, db } from "@/lib/ConfigFirebase"
import { doc, getDoc } from "firebase/firestore"
import { getBloggerPosts, type BlogPost } from "@/lib/blogger"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("Admin")
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [posts, setPosts] = useState<BlogPost[]>([])

  const blogId = process.env.NEXT_PUBLIC_BLOG_ID || "3729627085550627147"
  const blogUrl = process.env.NEXT_PUBLIC_BLOGGER_URL || "https://jerukagunglabs.blogspot.com/"

  const loadBloggerPosts = async () => {
    setRefreshing(true)
    try {
      const data = await getBloggerPosts(20)
      setPosts(data)
    } catch (err) {
      console.error("Error loading posts from Blogger:", err)
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login")
        return
      }

      setUser(currentUser)
      setUserName(currentUser.displayName || currentUser.email?.split("@")[0] || "Admin")

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists()) {
          const data = userDoc.data()
          if (data.displayName) setUserName(data.displayName)
          if (data.role) setUserRole(data.role)
        }
      } catch (err) {
        console.warn("Could not fetch user profile from Firestore:", err)
      }

      await loadBloggerPosts()
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      router.push("/login")
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">
            Memuat Dashboard Pengelola Konten Blogger...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="min-h-screen bg-gray-50/70 dark:bg-gray-900/70 py-10">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Top Bar: User Profile & Actions */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/80">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {userRole}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Laboratorium Jerukagung Seismologi
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard Pengelola Publikasi
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                Masuk sebagai: <strong className="text-gray-700 dark:text-gray-200">{userName}</strong> ({user?.email})
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                size="sm"
                onClick={loadBloggerPosts}
                disabled={refreshing}
                className="text-xs flex items-center gap-1.5 border-gray-200 dark:border-gray-700"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                {refreshing ? "Sinkronisasi..." : "Perbarui Data"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-900/40"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Keluar
              </Button>
            </div>
          </div>

          {/* Status Integrasi Google Blogger */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Sumber Konten</CardDescription>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary-500" />
                  Google Blogger API v3
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Terhubung & Sinkron
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {blogUrl}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Blog ID Resmi</CardDescription>
                <CardTitle className="text-base font-mono text-gray-800 dark:text-gray-200">
                  {blogId}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Semua artikel ditarik murni dari blog ini
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700/80 rounded-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Artikel Aktif</CardDescription>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary-500" />
                  {posts.length} Postingan Live
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href="/publikasi"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center font-medium"
                >
                  Buka Halaman Publikasi Web &rarr;
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions Panel */}
          <Card className="border-gray-100 dark:border-gray-700/80 mb-8 rounded-2xl shadow-sm overflow-hidden bg-gradient-to-br from-primary-50/60 to-white dark:from-gray-800 dark:to-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2 text-gray-900 dark:text-white">
                <PenSquare className="h-5 w-5 text-primary-600" />
                Pusat Penerbitan Konten Blogger
              </CardTitle>
              <CardDescription>
                Untuk menulis atau mengedit artikel, buka editor resmi Google Blogger. Setiap perubahan atau artikel baru akan otomatis tersinkronkan ke website JERIS.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4">
                <Button
                  size="lg"
                  asChild
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-md flex items-center gap-2"
                >
                  <a
                    href={`https://www.blogger.com/blog/post/edit/${blogId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <PenSquare className="h-4 w-4" />
                    Tulis Postingan Baru di Blogger
                    <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-80" />
                  </a>
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 font-semibold"
                >
                  <a
                    href={`https://www.blogger.com/blog/posts/${blogId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Layers className="h-4 w-4 text-primary-500" />
                    Kelola Semua Postingan di Blogger
                    <ExternalLink className="h-3.5 w-3.5 ml-1 opacity-80" />
                  </a>
                </Button>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-200/70 dark:border-gray-700/70">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                  Tips Penulisan di Blogger agar Tampil Maksimal di Website:
                </h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li><strong>Foto Sampul:</strong> Sisipkan gambar di bagian atas artikel Blogger untuk otomatis dijadikan thumbnail resolusi tinggi di website.</li>
                  <li><strong>Label / Tag:</strong> Berikan label seperti <em>Buletin</em>, <em>Cuaca</em>, atau <em>Seismologi</em> pada postingan Blogger untuk badge kategori otomatis.</li>
                  <li><strong>Pembaruan Instan:</strong> Klik tombol <em>"Perbarui Data"</em> di pojok kanan atas setelah Anda selesai mempublikasikan postingan baru di Blogger.</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Daftar Postingan Live dari Blogger */}
          <Card className="border-gray-100 dark:border-gray-700/80 rounded-2xl shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">
                    Postingan Google Blogger yang Sedang Aktif
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Semua artikel berikut ditarik murni dari akun Blogger Anda dan tayang di website JERIS.
                  </CardDescription>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-semibold border border-primary-200/60 dark:border-primary-800/60">
                  {posts.length} Artikel
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {posts.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {posts.map((post) => (
                    <div
                      key={post.id}
                      className="py-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 border border-gray-100 dark:border-gray-700">
                          <img
                            src={post.thumbnail}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {post.date}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                              Google Blogger
                            </span>
                          </div>
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {post.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 mt-0.5">
                            {post.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                        <Button size="sm" variant="outline" asChild className="text-xs">
                          <Link href={`/publikasi/${post.id}`} target="_blank">
                            Lihat di Web
                          </Link>
                        </Button>

                        <Button size="sm" variant="ghost" asChild className="text-xs text-primary-600 dark:text-primary-400">
                          <a
                            href={`https://www.blogger.com/blog/post/edit/${blogId}/${post.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            Edit di Blogger
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3 text-gray-400">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Belum Ada Postingan di Blogger
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    Tulis postingan pertama Anda melalui tombol di atas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </>
  )
}
