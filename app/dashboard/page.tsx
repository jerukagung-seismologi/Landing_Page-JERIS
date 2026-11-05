"use client"

import { useEffect, useState, useRef } from "react"
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
  Trash2,
  Sparkles,
  Eye,
  PlusCircle,
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  Quote,
  ImageIcon,
  Send,
  BookOpen,
} from "lucide-react"
import { onAuthStateChanged, signOut, type User } from "firebase/auth"
import { auth, db } from "@/lib/ConfigFirebase"
import {
  doc,
  getDoc,
  collection,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore"
import { getBloggerPosts, type BlogPost } from "@/lib/blogger"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("Admin")
  const [loading, setLoading] = useState<boolean>(true)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [successMessage, setSuccessMessage] = useState<string>("")

  // Form Tulis Artikel Langsung di Website
  const [title, setTitle] = useState("")
  const [categoryInput, setCategoryInput] = useState("Buletin, Cuaca")
  const [thumbnail, setThumbnail] = useState("/img/beritaiklim.jpg")
  const [summary, setSummary] = useState("")
  const [content, setContent] = useState("")
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit")

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const blogId = process.env.NEXT_PUBLIC_BLOG_ID || "3729627085550627147"
  const blogUrl = process.env.NEXT_PUBLIC_BLOGGER_URL || "https://jerukagunglabs.blogspot.com/"

  const loadAllPosts = async () => {
    try {
      const data = await getBloggerPosts(20)
      setPosts(data)
    } catch (err) {
      console.error("Error loading posts:", err)
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

      await loadAllPosts()
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

  // Sisipkan tag formatting ke textarea
  const insertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    const replacement = prefix + (selectedText || "teks") + suffix

    const newContent =
      textarea.value.substring(0, start) + replacement + textarea.value.substring(end)

    setContent(newContent)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText.length || 4))
    }, 0)
  }

  // Terbitkan postingan langsung ke website (disimpan di Firestore)
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return

    setSubmitting(true)
    setSuccessMessage("")

    try {
      const categoriesArray = categoryInput
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)

      // Ringkasan otomatis jika kosong
      const cleanSummary =
        summary.trim() ||
        content.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim().slice(0, 140) + "..."

      await addDoc(collection(db, "publications"), {
        title: title.trim(),
        categories: categoriesArray,
        thumbnail: thumbnail.trim() || "/img/beritaiklim.jpg",
        summary: cleanSummary,
        content: content.trim(),
        author: userName || "Tim Riset Jerukagung",
        authorEmail: user?.email || "",
        createdAt: serverTimestamp(),
        source: "website",
      })

      setSuccessMessage("Artikel berhasil diterbitkan langsung ke website JERIS!")
      setTitle("")
      setContent("")
      setSummary("")
      setCategoryInput("Buletin, Cuaca")
      setThumbnail("/img/beritaiklim.jpg")
      setPreviewMode("edit")

      // Muat ulang daftar postingan
      await loadAllPosts()
    } catch (error) {
      console.error("Error publishing post:", error)
      alert("Gagal menerbitkan artikel. Silakan cek koneksi atau coba lagi.")
    } finally {
      setSubmitting(false)
    }
  }

  // Hapus artikel lokal yang dibuat dari website
  const handleDeletePost = async (postId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus artikel ini dari website?")) return

    try {
      await deleteDoc(doc(db, "publications", postId))
      await loadAllPosts()
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Gagal menghapus artikel.")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">
            Memuat Dashboard Pengelola Konten...
          </p>
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
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Laboratorium Jerukagung Seismologi
                </span>
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

          {/* Connection Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Penerbitan Website</CardDescription>
                <CardTitle className="text-base flex items-center gap-2">
                  <PenSquare className="h-4 w-4 text-emerald-600" />
                  CMS Internal JERIS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Tulis & Terbit Langsung Aktif
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Artikel tersimpan di database dan langsung live seketika.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Sinkronisasi Blogger</CardDescription>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-primary-500" />
                  Google Blogger API v3
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400 font-semibold mb-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Terhubung ({blogId})
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {blogUrl}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Total Artikel Live</CardDescription>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary-500" />
                  {posts.length} Publikasi Aktif
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href="/publikasi"
                  className="text-xs text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center"
                >
                  Buka Halaman Publikasi &rarr;
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Main Action Tabs */}
          <Tabs defaultValue="create" className="space-y-6">
            <TabsList className="bg-white dark:bg-gray-800 p-1 border border-gray-200 dark:border-gray-700">
              <TabsTrigger
                value="create"
                className="data-[state=active]:bg-primary-500 data-[state=active]:text-white flex items-center gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Tulis Artikel di Website
              </TabsTrigger>
              <TabsTrigger
                value="manage"
                className="data-[state=active]:bg-primary-500 data-[state=active]:text-white flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Daftar Artikel Live ({posts.length})
              </TabsTrigger>
              <TabsTrigger
                value="blogger"
                className="data-[state=active]:bg-primary-500 data-[state=active]:text-white flex items-center gap-2"
              >
                <Globe className="h-4 w-4" />
                Kirim ke Google Blogger
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: Tulis & Terbitkan Artikel Langsung di Website */}
            <TabsContent value="create">
              <Card className="border-gray-100 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <PenSquare className="h-5 w-5 text-primary-600" />
                    Tulis & Terbitkan Artikel Langsung di Website
                  </CardTitle>
                  <CardDescription>
                    Ketik artikel, laporan cuaca, atau buletin kebumian Anda di sini. Postingan akan langsung terbit dan tampil di website JERIS seketika!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {successMessage && (
                    <div className="mb-6 p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                      <span>{successMessage}</span>
                      <Link
                        href="/publikasi"
                        className="ml-auto font-semibold underline text-emerald-700 dark:text-emerald-400"
                      >
                        Lihat di Publikasi &rarr;
                      </Link>
                    </div>
                  )}

                  <form onSubmit={handlePublishPost} className="space-y-6">
                    {/* Judul Artikel */}
                    <div>
                      <Label htmlFor="post-title" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Judul Artikel *
                      </Label>
                      <Input
                        id="post-title"
                        placeholder="Contoh: Laporan Pengamatan Seismik & Cuaca: Mei 2025"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="mt-1.5 text-base"
                        required
                      />
                    </div>

                    {/* Kategori & Thumbnail Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="post-categories" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          Kategori / Label (Pisahkan dengan koma)
                        </Label>
                        <Input
                          id="post-categories"
                          placeholder="Buletin, Cuaca, Seismologi"
                          value={categoryInput}
                          onChange={(e) => setCategoryInput(e.target.value)}
                          className="mt-1.5"
                        />
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-xs text-gray-500">Pilihan cepat:</span>
                          {["Buletin", "Iklim", "Seismologi", "Penelitian", "Instrumen"].map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                if (!categoryInput.includes(cat)) {
                                  setCategoryInput((prev) => (prev ? `${prev}, ${cat}` : cat))
                                }
                              }}
                              className="text-xs px-2 py-0.5 rounded bg-gray-100 hover:bg-primary-50 hover:text-primary-600 dark:bg-gray-800 dark:hover:bg-primary-900/30"
                            >
                              +{cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="post-thumbnail" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          URL Gambar Sampul / Thumbnail
                        </Label>
                        <Input
                          id="post-thumbnail"
                          placeholder="/img/beritaiklim.jpg atau URL gambar https://..."
                          value={thumbnail}
                          onChange={(e) => setThumbnail(e.target.value)}
                          className="mt-1.5"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">Pilihan:</span>
                          <button
                            type="button"
                            onClick={() => setThumbnail("/img/beritaiklim.jpg")}
                            className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 hover:text-primary-600"
                          >
                            Default Cuaca
                          </button>
                          <button
                            type="button"
                            onClick={() => setThumbnail("/img/aquaponic.jpg")}
                            className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 hover:text-primary-600"
                          >
                            Laboratorium
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Ringkasan Singkat (Summary) */}
                    <div>
                      <Label htmlFor="post-summary" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Ringkasan Pengantar (Tampil di Kartu Depan)
                      </Label>
                      <textarea
                        id="post-summary"
                        rows={2}
                        placeholder="Ringkasan 1-2 kalimat kondisi pengamatan cuaca atau seismologi..."
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="w-full mt-1.5 p-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>

                    {/* Toolbar & Isi Artikel */}
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <Label htmlFor="post-content" className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          Isi Konten Artikel *
                        </Label>

                        {/* Toggle Edit vs Pratinjau */}
                        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-0.5 rounded-md">
                          <button
                            type="button"
                            onClick={() => setPreviewMode("edit")}
                            className={`px-3 py-1 text-xs font-medium rounded ${
                              previewMode === "edit"
                                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                            }`}
                          >
                            <PenSquare className="h-3 w-3 inline mr-1" />
                            Tulis
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewMode("preview")}
                            className={`px-3 py-1 text-xs font-medium rounded ${
                              previewMode === "preview"
                                ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                            }`}
                          >
                            <Eye className="h-3 w-3 inline mr-1" />
                            Pratinjau
                          </button>
                        </div>
                      </div>

                      {previewMode === "edit" ? (
                        <div className="border border-input rounded-md overflow-hidden bg-background">
                          {/* Formatting Toolbar */}
                          <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-input text-gray-700 dark:text-gray-300">
                            <button
                              type="button"
                              onClick={() => insertFormatting("<strong>", "</strong>")}
                              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                              title="Tebal (Bold)"
                            >
                              <Bold className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting("<em>", "</em>")}
                              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                              title="Miring (Italic)"
                            >
                              <Italic className="h-4 w-4" />
                            </button>
                            <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                            <button
                              type="button"
                              onClick={() => insertFormatting("<h2>", "</h2>\n")}
                              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                              title="Subjudul H2"
                            >
                              <Heading2 className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => insertFormatting("<h3>", "</h3>\n")}
                              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                              title="Subjudul H3"
                            >
                              <Heading3 className="h-4 w-4" />
                            </button>
                            <div className="w-[1px] h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                            <button
                              type="button"
                              onClick={() =>
                                insertFormatting(
                                  "<ul>\n  <li>Poin pertama</li>\n  <li>Poin kedua</li>\n</ul>\n"
                                )
                              }
                              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                              title="Daftar Poin"
                            >
                              <List className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                insertFormatting("<blockquote>\n  ", "\n</blockquote>\n")
                              }
                              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                              title="Kutipan"
                            >
                              <Quote className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                insertFormatting(
                                  '<img src="/img/beritaiklim.jpg" alt="Grafik Pengamatan" />\n'
                                )
                              }
                              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                              title="Sisipkan Tag Gambar"
                            >
                              <ImageIcon className="h-4 w-4" />
                            </button>
                          </div>

                          <textarea
                            ref={textareaRef}
                            id="post-content"
                            rows={12}
                            placeholder="Tulis paragraf artikel di sini... Mendukung tag HTML seperti <p>, <h2>, <ul>, <li>, <strong>, dsb."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full p-4 text-sm focus:outline-none bg-transparent"
                            required
                          />
                        </div>
                      ) : (
                        <div className="border border-input rounded-md p-6 bg-white dark:bg-gray-800 min-h-[300px]">
                          <h2 className="text-2xl font-bold mb-4">{title || "Judul Artikel"}</h2>
                          <div
                            className="article-content"
                            dangerouslySetInnerHTML={{
                              __html: content || "<p><em>Konten artikel masih kosong...</em></p>",
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Tombol Terbitkan */}
                    <div className="pt-2 flex flex-wrap items-center gap-4">
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-2.5 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
                      >
                        <Send className="h-4 w-4" />
                        {submitting ? "Menerbitkan..." : "Terbitkan Langsung ke Website JERIS"}
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const sample = `<h2>Ringkasan Kondisi Meteorologi</h2>\n<p>Pengamatan sensor meteorologi selama periode ini mencatat suhu rata-rata 27.5 °C dengan tingkat kelembapan 80%.</p>\n<h3>Parameter Utama:</h3>\n<ul>\n  <li><strong>Tekanan Udara:</strong> 1012 hPa</li>\n  <li><strong>Curah Hujan:</strong> 15 mm</li>\n  <li><strong>Aktivitas Seismik:</strong> Normal tanpa tremor anomali</li>\n</ul>\n<p>Seluruh instrumen pemantau beroperasi optimal.</p>`
                          setContent(sample)
                        }}
                        className="text-xs text-gray-600 dark:text-gray-300"
                      >
                        Gunakan Contoh Template Laporan
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: Kelola Daftar Artikel Live */}
            <TabsContent value="manage">
              <Card className="border-gray-100 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl">Daftar Publikasi yang Sedang Aktif di Website</CardTitle>
                  <CardDescription>
                    Gabungan artikel yang diterbitkan langsung dari website JERIS dan artikel dari Google Blogger.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                            <img
                              src={post.thumbnail}
                              alt={post.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{post.date}</span>
                              {post.source === "website" ? (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                  Dibuat di Website
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                                  Google Blogger
                                </span>
                              )}
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
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/publikasi/${post.id}`} target="_blank">
                              Lihat di Web
                            </Link>
                          </Button>

                          {post.source === "website" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeletePost(post.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                              title="Hapus artikel ini"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}

                          {post.source === "blogger" && post.url && (
                            <Button size="sm" variant="ghost" asChild title="Buka di Blogger">
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

            {/* TAB 3: Kirim ke Google Blogger */}
            <TabsContent value="blogger">
              <Card className="border-gray-100 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-xl">Kirim ke Google Blogger</CardTitle>
                  <CardDescription>
                    Jika Anda juga ingin menerbitkan artikel ke blog Blogger resmi Google.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary-200 dark:border-primary-800 rounded-lg p-5">
                    <h3 className="font-semibold text-primary-900 dark:text-primary-200 flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      Pilihan Fleksibel untuk Anda:
                    </h3>
                    <p className="text-sm text-primary-800 dark:text-primary-300 mb-3">
                      Anda bebas memilih: menulis langsung di tab <strong>"Tulis Artikel di Website"</strong>, ATAU menulis di Google Blogger. Keduanya akan otomatis digabungkan dan tampil rapi di website JERIS!
                    </p>
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
                        Buka Editor Google Blogger (Tab Baru)
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
                        Kelola Postingan di Blogger
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </a>
                    </Button>
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
