"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ExternalLink,
  PenSquare,
  FileText,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Globe,
  Copy,
  Check,
  Sparkles,
  ArrowRight,
  BookOpen,
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
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [copied, setCopied] = useState<boolean>(false)

  // Form Draft Artikel
  const [draftTitle, setDraftTitle] = useState("")
  const [draftLabels, setDraftLabels] = useState("Buletin, Riset, Iklim")
  const [draftContent, setDraftContent] = useState("")
  const [draftSaved, setDraftSaved] = useState(false)

  const blogId = process.env.NEXT_PUBLIC_BLOG_ID || "3729627085550627147"
  const blogUrl = process.env.NEXT_PUBLIC_BLOGGER_URL || "https://jerukagunglabs.blogspot.com/"

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login")
        return
      }

      setUser(currentUser)
      setUserName(currentUser.displayName || currentUser.email?.split("@")[0] || "Admin")

      // Ambil data profil dari Firestore jika ada
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

      // Ambil postingan Blogger yang saat ini aktif
      try {
        const data = await getBloggerPosts(10)
        setPosts(data)
      } catch (err) {
        console.error("Error loading posts:", err)
      } finally {
        setLoading(false)
      }
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

  const handleSaveDraft = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draftTitle.trim()) return

    const draft = {
      title: draftTitle,
      labels: draftLabels,
      content: draftContent,
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem("jeris_blog_draft", JSON.stringify(draft))
    setDraftSaved(true)
    setTimeout(() => setDraftSaved(false), 3000)
  }

  const copyDraftToClipboard = () => {
    const text = `JUDUL: ${draftTitle}\nLABEL: ${draftLabels}\n\nKONTEN:\n${draftContent}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">Memuat Dashboard Pengelola Konten...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Top Bar: User Welcome & Logout */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {userRole}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Laboratorium Jerukagung Seismologi</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Selamat Datang, {userName}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Email: {user?.email}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800"
              >
                <LogOut className="h-4 w-4 mr-1.5" />
                Keluar
              </Button>
            </div>
          </div>

          {/* Blogger Connection Status Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Layanan CMS</CardDescription>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary-500" />
                  Google Blogger API v3
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Terhubung & Aktif
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {blogUrl}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Blog ID Google</CardDescription>
                <CardTitle className="text-base font-mono text-gray-800 dark:text-gray-200">
                  {blogId}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sinkronisasi otomatis setiap 1 jam via Next.js ISR
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Publikasi Live</CardDescription>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary-500" />
                  {posts.length} Artikel Terkini
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href="/publikasi"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center"
                >
                  Lihat Halaman Publikasi &rarr;
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Action Tabs */}
          <Tabs defaultValue="editor" className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
              <TabsTrigger value="editor" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white">
                <PenSquare className="h-4 w-4 mr-2" />
                Tulis Artikel ke Blogger
              </TabsTrigger>
              <TabsTrigger value="draft" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" />
                Draf Artikel Internal
              </TabsTrigger>
              <TabsTrigger value="posts" className="data-[state=active]:bg-primary-500 data-[state=active]:text-white">
                <Globe className="h-4 w-4 mr-2" />
                Daftar Artikel Live ({posts.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Editor Google Blogger */}
            <TabsContent value="editor">
              <Card className="border-gray-100 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl">Editor Konten Google Blogger</CardTitle>
                  <CardDescription>
                    Sesuai standar Google Cloud, penerbitan artikel menggunakan akun Google resmi pemilik blog untuk keamanan autentikasi maksimal.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-lg p-5">
                    <h3 className="font-semibold text-primary-900 dark:text-primary-200 flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Alur Penerbitan Konten yang Cepat & Aman:
                    </h3>
                    <ol className="list-decimal list-inside space-y-1.5 text-sm text-primary-800 dark:text-primary-300">
                      <li>Klik tombol <strong>"Buka Editor Postingan Baru"</strong> di bawah.</li>
                      <li>Tulis judul, konten artikel, pasang foto unggulan, dan beri label (misal: <em>Buletin</em> atau <em>Cuaca</em>).</li>
                      <li>Klik <strong>Publikasikan</strong> di Blogger.</li>
                      <li>Postingan Anda akan langsung tersinkronisasi dan tampil di website JERIS secara otomatis!</li>
                    </ol>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <Button
                      size="lg"
                      asChild
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                    >
                      <a
                        href={`https://www.blogger.com/blog/post/edit/${blogId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <PenSquare className="h-5 w-5" />
                        Buka Editor Postingan Baru di Blogger
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </Button>

                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="border-gray-300 dark:border-gray-600"
                    >
                      <a
                        href={`https://www.blogger.com/blog/posts/${blogId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <Globe className="h-5 w-5" />
                        Kelola Semua Postingan di Blogger
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Draft Builder Internal */}
            <TabsContent value="draft">
              <Card className="border-gray-100 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl">Konsep / Draf Artikel Baru</CardTitle>
                  <CardDescription>
                    Siapkan naskah buletin atau laporan riset Anda di sini sebelum dipublikasikan ke Blogger.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSaveDraft} className="space-y-5">
                    <div>
                      <Label htmlFor="title" className="text-sm font-medium">Judul Artikel</Label>
                      <Input
                        id="title"
                        placeholder="Contoh: Laporan Cuaca Bulanan: Mei 2025"
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="labels" className="text-sm font-medium">Kategori / Label (Pisahkan dengan koma)</Label>
                      <Input
                        id="labels"
                        placeholder="Contoh: Buletin, Cuaca, Iklim"
                        value={draftLabels}
                        onChange={(e) => setDraftLabels(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="content" className="text-sm font-medium">Isi Artikel / Catatan</Label>
                      <textarea
                        id="content"
                        rows={8}
                        placeholder="Tulis naskah laporan, ringkasan fenomena cuaca, atau pengamatan seismologi di sini..."
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        className="w-full mt-1 p-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white">
                        {draftSaved ? "Draf Tersimpan!" : "Simpan Draf Lokal"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={copyDraftToClipboard}
                        className="flex items-center gap-2"
                      >
                        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Tersalin ke Clipboard" : "Salin Draf"}
                      </Button>

                      <Button
                        type="button"
                        variant="secondary"
                        asChild
                      >
                        <a
                          href={`https://www.blogger.com/blog/post/edit/${blogId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5"
                        >
                          Lanjut Buka Editor Blogger <ArrowRight className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 3: Daftar Artikel Live */}
            <TabsContent value="posts">
              <Card className="border-gray-100 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl">Daftar Publikasi yang Sedang Live di Website</CardTitle>
                  <CardDescription>
                    Postingan ini ditarik secara langsung dari Google Blogger API v3 dan dirender dalam layout JERIS.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {posts.map((post) => (
                      <div key={post.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                            <img
                              src={post.thumbnail}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{post.date}</span>
                            <h4 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1">
                              {post.title}
                            </h4>
                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-1 mt-0.5">
                              {post.summary}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/publikasi/${post.id}`} target="_blank">
                              Lihat di Web
                            </Link>
                          </Button>
                          {post.url && (
                            <Button size="sm" variant="ghost" asChild>
                              <a href={post.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </>
  )
}

