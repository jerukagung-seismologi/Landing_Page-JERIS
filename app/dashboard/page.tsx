"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
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
  Search,
  Info,
  ChevronDown,
  Tag,
  BarChart2,
  MessageSquare,
  Share2,
  FileText,
  File,
  Layout,
  Palette,
  Settings,
  Bookmark,
  DollarSign,
  Plus,
  Eye,
  Copy,
  FolderOpen,
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

  // Blogger UI states: Search, status filter, category filter, and share tooltip
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null)

  const handleSharePost = (post: BlogPost) => {
    if (typeof window !== "undefined") {
      const postUrl = `${window.location.origin}/publikasi/${post.id}`
      navigator.clipboard.writeText(postUrl)
      setCopiedPostId(post.id)
      setTimeout(() => setCopiedPostId(null), 2500)
    }
  }

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

  const publishedCount = posts.filter((p) => !p.isDraft).length
  const draftCount = posts.filter((p) => Boolean(p.isDraft)).length
  const uniqueCategories = Array.from(
    new Set(posts.flatMap((p) => p.categories || []).filter(Boolean))
  )

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      !searchQuery.trim() ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.categories && post.categories.some((c) => c.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (post.summary && post.summary.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "published"
        ? !post.isDraft
        : Boolean(post.isDraft)

    const matchesCategory =
      selectedCategory === "all"
        ? true
        : Boolean(post.categories && post.categories.includes(selectedCategory))

    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <>
      <Header />
      <Navbar />

      <main className="min-h-screen bg-[#f8f9fa] dark:bg-gray-900 py-6 sm:py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Top Bar: Blogger Header & Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white dark:bg-gray-800 px-5 py-3.5 rounded-2xl shadow-xs border border-gray-200/80 dark:border-gray-700/80">
            {/* Logo & Blog Identity */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                B
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                  Pengelola Blog &amp; Artikel
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {userName} ({user?.email})
                </p>
              </div>
            </div>

            {/* Central Functional Search Bar */}
            <div className="w-full sm:max-w-md relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Telusuri judul, konten, atau label artikel..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/60 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  title="Hapus pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Right Quick Controls */}
            <div className="flex items-center gap-2 self-end sm:self-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadBloggerPosts}
                disabled={refreshing}
                title="Sinkronkan dengan Google Blogger"
                className="text-xs h-8 px-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                <span className="hidden md:inline ml-1.5">{refreshing ? "Memuat..." : "Sinkron"}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                title="Keluar dari akun"
                className="text-xs h-8 px-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full"
              >
                <LogOut className="h-3.5 w-3.5 md:mr-1" />
                <span className="hidden md:inline">Keluar</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-800 border border-primary-200 dark:border-primary-800/60 p-4.5 rounded-2xl shadow-xs mb-6">
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

          {/* Main 2-Column Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-6 items-start">
            {/* Left Sidebar: Focused strictly on blog writing & management */}
            <aside className="space-y-4">
              {/* Blog Info Card */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-xl p-3.5 shadow-xs">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400 dark:text-gray-500 font-medium">Sumber Blog</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Terhubung
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  Jerukagung Seismologi
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {blogUrl || "jerukagunglabs.blogspot.com"}
                </p>
              </div>

              {/* Big CTA Button: + POSTINGAN BARU */}
              <Button
                asChild
                size="lg"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-sm hover:shadow-md transition-all font-bold tracking-wider text-xs sm:text-sm py-5 flex items-center justify-center gap-2"
              >
                <Link href="/editor">
                  <Plus className="h-4 w-4 stroke-[3]" />
                  POSTINGAN BARU
                </Link>
              </Button>

              {/* Status Filter Navigation */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-2 shadow-xs space-y-0.5 text-xs font-medium">
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Status Artikel
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all")
                    setSelectedCategory("all")
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full transition-colors text-left ${
                    statusFilter === "all" && selectedCategory === "all"
                      ? "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className={`h-4 w-4 ${statusFilter === "all" && selectedCategory === "all" ? "text-orange-600 dark:text-orange-400" : "text-gray-400"}`} />
                    <span>Semua Postingan</span>
                  </div>
                  <span className="text-[11px] opacity-75 font-semibold">({posts.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("published")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full transition-colors text-left ${
                    statusFilter === "published"
                      ? "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span>Dipublikasikan</span>
                  </div>
                  <span className="text-[11px] opacity-75 font-semibold">({publishedCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter("draft")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-full transition-colors text-left ${
                    statusFilter === "draft"
                      ? "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-bold"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100/70 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    <span>Draf</span>
                  </div>
                  <span className="text-[11px] opacity-75 font-semibold">({draftCount})</span>
                </button>
              </div>

              {/* Functional Category / Label Filter */}
              {uniqueCategories.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-2xl p-3 shadow-xs text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Filter Label
                    </span>
                    {selectedCategory !== "all" && (
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("all")}
                        className="text-[11px] text-orange-600 hover:underline font-semibold"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {uniqueCategories.map((cat, idx) => {
                      const count = posts.filter((p) => p.categories && p.categories.includes(cat)).length
                      const isSelected = selectedCategory === cat
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedCategory(isSelected ? "all" : cat)}
                          className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${
                            isSelected
                              ? "bg-orange-600 text-white border-orange-600 font-bold shadow-xs"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
                          }`}
                        >
                          {cat} ({count})
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Useful External Link: Lihat Publikasi di Web */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-xl p-3 shadow-xs space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full text-xs font-semibold text-primary-700 dark:text-primary-300 border-primary-200 dark:border-primary-800 hover:bg-primary-50 dark:hover:bg-primary-950/30 flex items-center justify-center gap-1.5"
                >
                  <Link href="/publikasi" target="_blank">
                    <Globe className="h-3.5 w-3.5 text-primary-600" />
                    Lihat Publikasi di Web &rarr;
                  </Link>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center justify-center gap-1.5"
                >
                  <Link href="/editor?action=pick">
                    <Edit3 className="h-3.5 w-3.5 text-blue-600" />
                    Pilih Artikel untuk Diedit
                  </Link>
                </Button>
              </div>
            </aside>

            {/* Right Main Content Area */}
            <section className="space-y-4">
              {/* Filter Sub-header: Dropdown on Left & Info on Right */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-gray-200/90 dark:border-gray-700/80 px-1">
                {/* Left Filter Controls */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 font-semibold text-xs text-gray-800 dark:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer py-1.5 px-3 rounded-lg transition-colors focus:outline-none"
                  >
                    <option value="all">Semua ({posts.length})</option>
                    <option value="published">Dipublikasikan ({publishedCount})</option>
                    <option value="draft">Draf ({draftCount})</option>
                  </select>

                  {/* Active Category Tag Chip */}
                  {selectedCategory !== "all" && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 font-semibold">
                      Label: {selectedCategory}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory("all")}
                        className="hover:text-red-600 ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}

                  {/* Active Search Query Tag */}
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 font-semibold">
                      Cari: &quot;{searchQuery}&quot;
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="hover:text-red-600 ml-0.5"
                      >
                        ✕
                      </button>
                    </span>
                  )}
                </div>

                {/* Right Item Counter */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Menampilkan <strong>{filteredPosts.length}</strong> dari <strong>{posts.length}</strong> artikel
                </div>
              </div>

              {/* Post List Rows: Clean, Functional, Every Button Works */}
              {filteredPosts.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 shadow-xs divide-y divide-gray-100 dark:divide-gray-700/60 overflow-hidden">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 sm:p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/70 dark:hover:bg-gray-750/50 transition-all"
                    >
                      {/* Left Side: Thumbnail & Title & Meta */}
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Square Rounded Thumbnail (Click opens editor) */}
                        <Link
                          href={`/editor?id=${post.id}`}
                          title="Klik untuk mengedit postingan ini"
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0 border border-gray-200/60 dark:border-gray-600 block relative hover:opacity-90 transition-opacity"
                        >
                          {post.thumbnail ? (
                            <img
                              src={post.thumbnail}
                              alt={post.title}
                              className="w-full h-full object-cover object-top"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800">
                              <FileText className="h-6 w-6 opacity-40" />
                            </div>
                          )}
                        </Link>

                        {/* Title & Metadata Line */}
                        <div className="min-w-0 flex-1">
                          <Link
                            href={`/editor?id=${post.id}`}
                            title="Klik untuk mengedit postingan ini"
                            className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 hover:text-orange-600 dark:hover:text-orange-400 transition-colors line-clamp-1 block leading-snug"
                          >
                            {post.title}
                          </Link>

                          <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-gray-500 dark:text-gray-400">
                            <span className={post.isDraft ? "text-amber-600 dark:text-amber-400 font-semibold" : "text-gray-500 dark:text-gray-400"}>
                              {post.isDraft ? "Draf" : "Dipublikasikan"}
                            </span>
                            <span>•</span>
                            <span>{post.date}</span>

                            {/* Clickable Rounded Pill Labels */}
                            {post.categories && post.categories.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap ml-1">
                                {post.categories.map((cat, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setSelectedCategory(cat)}
                                    title={`Saring postingan dengan label ${cat}`}
                                    className="inline-block text-[11px] px-2.5 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50/70 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:border-orange-400 hover:text-orange-600 transition-colors"
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Working Action Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-gray-700/60">
                        {/* Salin Tautan Publikasi */}
                        <button
                          type="button"
                          onClick={() => handleSharePost(post)}
                          title="Salin tautan artikel untuk dibagikan"
                          className="relative p-2 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                        >
                          <Share2 className="h-4 w-4" />
                          {copiedPostId === post.id && (
                            <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-0.5 px-2 rounded shadow font-medium whitespace-nowrap z-10">
                              Tersalin!
                            </span>
                          )}
                        </button>

                        {/* Lihat Artikel di Website */}
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="h-8 text-xs border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750"
                          title="Buka tampilan artikel di website"
                        >
                          <Link href={`/publikasi/${post.id}`} target="_blank">
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            Lihat
                          </Link>
                        </Button>

                        {/* Edit Postingan */}
                        <Button
                          size="sm"
                          asChild
                          className="h-8 text-xs bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-xs"
                          title="Edit artikel di editor postingan"
                        >
                          <Link href={`/editor?id=${post.id}`}>
                            <Edit3 className="h-3.5 w-3.5 mr-1" />
                            Edit
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
                          className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 border-red-200 dark:border-red-900/50"
                          title="Hapus artikel ini secara permanen"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700/80 p-12 text-center shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center mx-auto mb-3">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    {searchQuery || selectedCategory !== "all" || statusFilter !== "all"
                      ? "Tidak ada artikel yang sesuai filter"
                      : "Belum Ada Postingan"}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
                    {searchQuery || selectedCategory !== "all" || statusFilter !== "all"
                      ? "Cobalah ubah filter status, reset label, atau gunakan kata kunci pencarian yang lain."
                      : "Mulai tulis artikel pertama Anda dengan menekan tombol Tulis Postingan Baru."}
                  </p>
                  {(searchQuery || selectedCategory !== "all" || statusFilter !== "all") ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedCategory("all")
                        setStatusFilter("all")
                      }}
                      className="text-xs"
                    >
                      Reset Semua Filter
                    </Button>
                  ) : (
                    <Button asChild size="sm" className="bg-primary-600 hover:bg-primary-700 text-white text-xs">
                      <Link href="/editor">
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Tulis Postingan Sekarang
                      </Link>
                    </Button>
                  )}
                </div>
              )}
            </section>
          </div>
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
