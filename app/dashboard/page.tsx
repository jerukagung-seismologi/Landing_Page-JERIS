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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  KeyRound,
  Trash2,
  Edit3,
  PlusCircle,
  AlertCircle,
  HelpCircle,
  Check,
} from "lucide-react"
import { onAuthStateChanged, signOut, type User } from "firebase/auth"
import { auth, db } from "@/lib/ConfigFirebase"
import { doc, getDoc } from "firebase/firestore"
import { getBloggerPosts, type BlogPost } from "@/lib/blogger"

interface OAuthStatus {
  hasClientConfig: boolean
  isConnected: boolean
  clientIdConfigured: boolean
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [userRole, setUserRole] = useState<string>("Admin")
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [posts, setPosts] = useState<BlogPost[]>([])

  // OAuth status state
  const [oauthStatus, setOauthStatus] = useState<OAuthStatus>({
    hasClientConfig: false,
    isConnected: false,
    clientIdConfigured: false,
  })
  const [oauthMessage, setOauthMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Create Post Modal State
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)
  const [createTitle, setCreateTitle] = useState<string>("")
  const [createContent, setCreateContent] = useState<string>("")
  const [createLabels, setCreateLabels] = useState<string>("Publikasi, Riset")
  const [createIsDraft, setCreateIsDraft] = useState<boolean>(false)
  const [submittingCreate, setSubmittingCreate] = useState<boolean>(false)

  // Edit Post Modal State
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false)
  const [editingPostId, setEditingPostId] = useState<string>("")
  const [editTitle, setEditTitle] = useState<string>("")
  const [editContent, setEditContent] = useState<string>("")
  const [editLabels, setEditLabels] = useState<string>("")
  const [submittingEdit, setSubmittingEdit] = useState<boolean>(false)

  // Delete Post Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false)
  const [deletingPost, setDeletingPost] = useState<BlogPost | null>(null)
  const [submittingDelete, setSubmittingDelete] = useState<boolean>(false)

  const blogId = process.env.NEXT_PUBLIC_BLOG_ID
  const blogUrl = process.env.NEXT_PUBLIC_BLOGGER_URL

  const checkOAuthStatus = async () => {
    try {
      const res = await fetch("/api/blogger/auth/status")
      if (res.ok) {
        const data = await res.json()
        setOauthStatus(data)
      }
    } catch (err) {
      console.warn("Could not check OAuth status:", err)
    }
  }

  const loadBloggerPosts = async () => {
    setRefreshing(true)
    try {
      const res = await fetch("/api/blogger/posts")
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setPosts(data)
          return
        }
      }
      const direct = await getBloggerPosts(20)
      setPosts(direct)
    } catch (err) {
      console.error("Error loading posts from Blogger:", err)
      try {
        const direct = await getBloggerPosts(20)
        setPosts(direct)
      } catch (directErr) {
        console.error("Direct fetch error:", directErr)
      }
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Check URL parameters for OAuth redirect status
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const oauth = params.get("oauth")
      const oauthError = params.get("oauth_error")

      if (oauth === "connected") {
        setOauthMessage({
          type: "success",
          text: "Akun Google Blogger berhasil terhubung! Akses Tulis, Edit, dan Hapus artikel kini aktif.",
        })
        window.history.replaceState({}, "", "/dashboard")
      } else if (oauthError) {
        setOauthMessage({
          type: "error",
          text: `Gagal menghubungkan Google Blogger: ${decodeURIComponent(oauthError)}`,
        })
        window.history.replaceState({}, "", "/dashboard")
      }
    }

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

      await Promise.all([loadBloggerPosts(), checkOAuthStatus()])
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

  // Handle Create Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!createTitle.trim() || !createContent.trim()) {
      alert("Judul dan isi artikel tidak boleh kosong!")
      return
    }

    setSubmittingCreate(true)
    try {
      const res = await fetch("/api/blogger/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createTitle,
          content: createContent,
          labels: createLabels,
          isDraft: createIsDraft,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat postingan")
      }

      setCreateModalOpen(false)
      setCreateTitle("")
      setCreateContent("")
      setCreateLabels("Publikasi, Riset")
      setCreateIsDraft(false)

      setOauthMessage({
        type: "success",
        text: `Postingan "${createTitle}" berhasil diterbitkan ke Blogger!`,
      })

      await loadBloggerPosts()
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat membuat postingan")
    } finally {
      setSubmittingCreate(false)
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (post: BlogPost) => {
    setEditingPostId(post.id)
    setEditTitle(post.title)
    setEditContent(post.content || post.summary || "")
    setEditLabels(post.categories ? post.categories.join(", ") : "")
    setEditModalOpen(true)
  }

  // Handle Submit Edit Post
  const handleUpdatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editTitle.trim() || !editContent.trim()) {
      alert("Judul dan isi artikel tidak boleh kosong!")
      return
    }

    setSubmittingEdit(true)
    try {
      const res = await fetch(`/api/blogger/posts/${editingPostId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          labels: editLabels,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui postingan")
      }

      setEditModalOpen(false)
      setOauthMessage({
        type: "success",
        text: `Postingan "${editTitle}" berhasil diperbarui di Blogger!`,
      })

      await loadBloggerPosts()
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat memperbarui postingan")
    } finally {
      setSubmittingEdit(false)
    }
  }

  // Handle Delete Post
  const handleConfirmDelete = async () => {
    if (!deletingPost) return

    setSubmittingDelete(true)
    try {
      const res = await fetch(`/api/blogger/posts/${deletingPost.id}`, {
        method: "DELETE",
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Gagal menghapus postingan")
      }

      setDeleteModalOpen(false)
      setDeletingPost(null)
      setOauthMessage({
        type: "success",
        text: `Postingan "${deletingPost.title}" berhasil dihapus dari Blogger.`,
      })

      await loadBloggerPosts()
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan saat menghapus postingan")
    } finally {
      setSubmittingDelete(false)
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
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {userRole}
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

          {/* Flash Alert Messages */}
          {oauthMessage && (
            <div
              className={`mb-6 p-4 rounded-xl flex items-start gap-3 border text-sm ${
                oauthMessage.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
                  : "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200"
              }`}
            >
              {oauthMessage.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              )}
              <div className="flex-1 font-medium">{oauthMessage.text}</div>
              <button
                onClick={() => setOauthMessage(null)}
                className="text-xs underline opacity-70 hover:opacity-100"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Status Singkat OAuth Blogger (Hanya Muncul Jika Belum Terhubung) */}
          {!oauthStatus.isConnected && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 border border-primary-200 dark:border-primary-800/60 p-4.5 rounded-2xl shadow-xs mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center text-primary-600 flex-shrink-0">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Sambungkan Akun Google Blogger
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Hubungkan akun Google sekali saja untuk mengaktifkan izin tulis, edit, dan hapus artikel langsung dari website.
                  </p>
                </div>
              </div>
              <Button asChild size="sm" className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold flex-shrink-0">
                <a href="/api/blogger/auth">
                  <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                  Hubungkan Sekarang
                </a>
              </Button>
            </div>
          )}

          {/* Quick Actions Panel */}
          <Card className="border-gray-100 dark:border-gray-700/80 mb-8 rounded-2xl shadow-sm overflow-hidden bg-gradient-to-br from-primary-50/60 to-white dark:from-gray-800 dark:to-gray-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-2 text-gray-900 dark:text-white">
                <PenSquare className="h-5 w-5 text-primary-600" />
                Pusat Pengelolaan Konten Blogger
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4">
                {/* Tombol Tulis di Web */}
                <Button
                  size="lg"
                  asChild
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-md flex items-center gap-2"
                >
                  <Link href="/editor">
                    <PenSquare className="h-4 w-4" />
                    Postingan Baru
                  </Link>
                </Button>

                {/* Tombol Edit Postingan Sebelumnya */}
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800/60 text-blue-700 dark:text-blue-300 font-semibold shadow-xs flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                >
                  <Link href="/editor?action=pick">
                    <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Edit Postingan Sebelumnya ({posts.length})
                  </Link>
                </Button>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-200/70 dark:border-gray-700/70">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                  Tips Penulisan Konten Blogger:
                </h4>
                <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li><strong>Foto Sampul:</strong> Sisipkan tag gambar <code className="font-mono text-[11px]">&lt;img src=&quot;...&quot; /&gt;</code> di dalam isi artikel untuk otomatis dijadikan thumbnail halaman publikasi.</li>
                  <li><strong>Kategori/Label:</strong> Pisahkan label dengan tanda koma (misal: <em>Buletin, Cuaca, Seismologi</em>) untuk pengelompokan otomatis.</li>
                  <li><strong>Sinkronisasi Instan:</strong> Setiap kali Anda membuat, mengedit, atau menghapus postingan, website akan langsung menyinkronkan data secara otomatis.</li>
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
                        {/* Lihat di Web */}
                        <Button size="sm" variant="outline" asChild className="text-xs">
                          <Link href={`/publikasi/${post.id}`} target="_blank">
                            Lihat di Web
                          </Link>
                        </Button>

                        {/* Edit Langsung di Web */}
                        <Button
                          size="sm"
                          asChild
                          className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs"
                        >
                          <Link href={`/editor?id=${post.id}`}>
                            <Edit3 className="h-3.5 w-3.5 mr-1" />
                            Edit Postingan
                          </Link>
                        </Button>

                        {/* Hapus Postingan */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (!oauthStatus.isConnected) {
                              alert("Silakan hubungkan Akun Google Blogger terlebih dahulu untuk menghapus postingan.")
                              return
                            }
                            setDeletingPost(post)
                            setDeleteModalOpen(true)
                          }}
                          className="text-xs text-red-600 hover:text-red-700 border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Modal: Tulis Postingan Baru */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-primary-600" />
              Tulis Postingan Baru ke Blogger
            </DialogTitle>
            <DialogDescription className="text-xs">
              Artikel ini akan langsung dibuat dan diterbitkan di Google Blogger (<code className="font-mono text-gray-700 dark:text-gray-300">{blogUrl}</code>).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreatePost} className="space-y-4 py-2">
            <div>
              <Label htmlFor="create-title" className="text-xs font-semibold">
                Judul Postingan *
              </Label>
              <Input
                id="create-title"
                placeholder="Contoh: Laporan Analisis Gempa Bumi dan Cuaca Mingguan"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                required
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="create-labels" className="text-xs font-semibold">
                Kategori / Label (Pisahkan dengan koma)
              </Label>
              <Input
                id="create-labels"
                placeholder="Publikasi, Riset, Cuaca"
                value={createLabels}
                onChange={(e) => setCreateLabels(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="create-content" className="text-xs font-semibold">
                Isi Artikel (Mendukung Teks Biasa &amp; Format HTML) *
              </Label>
              <Textarea
                id="create-content"
                rows={9}
                placeholder="Tuliskan isi laporan atau artikel Anda di sini..."
                value={createContent}
                onChange={(e) => setCreateContent(e.target.value)}
                required
                className="mt-1 text-sm font-sans"
              />
              <p className="text-[11px] text-gray-500 mt-1">
                Tip: Anda dapat memasukkan gambar dengan tag HTML: <code className="font-mono">&lt;img src=&quot;https://...&quot; /&gt;</code>
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="create-draft"
                checked={createIsDraft}
                onChange={(e) => setCreateIsDraft(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4"
              />
              <Label htmlFor="create-draft" className="text-xs cursor-pointer font-medium">
                Simpan sebagai Draf terlebih dahulu (tidak langsung dipublikasikan)
              </Label>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
                disabled={submittingCreate}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingCreate}
                className="bg-primary-600 hover:bg-primary-700 text-white"
              >
                {submittingCreate ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Menyimpan ke Blogger...
                  </>
                ) : (
                  "Terbitkan ke Blogger"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Edit Postingan */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Edit3 className="h-5 w-6 text-blue-600" />
              Sunting Postingan Blogger
            </DialogTitle>
            <DialogDescription className="text-xs">
              Perubahan akan langsung disimpan ke Google Blogger dan diperbarui di website.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePost} className="space-y-4 py-2">
            <div>
              <Label htmlFor="edit-title" className="text-xs font-semibold">
                Judul Postingan *
              </Label>
              <Input
                id="edit-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="edit-labels" className="text-xs font-semibold">
                Kategori / Label (Pisahkan dengan koma)
              </Label>
              <Input
                id="edit-labels"
                value={editLabels}
                onChange={(e) => setEditLabels(e.target.value)}
                className="mt-1 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="edit-content" className="text-xs font-semibold">
                Isi Artikel *
              </Label>
              <Textarea
                id="edit-content"
                rows={9}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                required
                className="mt-1 text-sm font-sans"
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditModalOpen(false)}
                disabled={submittingEdit}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={submittingEdit}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submittingEdit ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Menyimpan Perubahan...
                  </>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Konfirmasi Hapus Postingan */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" />
              Hapus Postingan dari Blogger?
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-600 dark:text-gray-300">
              Apakah Anda yakin ingin menghapus postingan <strong>&quot;{deletingPost?.title}&quot;</strong>? Tindakan ini akan menghapus postingan secara permanen dari Google Blogger dan website.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              disabled={submittingDelete}
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleConfirmDelete}
              disabled={submittingDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {submittingDelete ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Ya, Hapus Postingan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </>
  )
}
