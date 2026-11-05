"use client"

import { useEffect, useRef, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Header from "@/components/header"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import {
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
  RemoveFormatting,
  Code,
  PenTool,
  Eye,
  Send,
  Save,
  CheckCircle2,
  AlertCircle,
  Tag,
  Calendar,
  Globe,
  Sparkles,
  ExternalLink,
  HelpCircle,
  X,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/ConfigFirebase"

const RECOMMENDED_LABELS = [
  "Publikasi",
  "Buletin",
  "Cuaca",
  "Gempa",
  "Seismologi",
  "Riset",
  "Instrumentasi",
  "Edukasi",
]

function BloggerEditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const postId = searchParams.get("id")
  const isEditing = Boolean(postId)

  const [loading, setLoading] = useState<boolean>(true)
  const [saving, setSaving] = useState<boolean>(false)
  const [authReady, setAuthReady] = useState<boolean>(false)

  // Editor states
  const [title, setTitle] = useState<string>("")
  const [contentHtml, setContentHtml] = useState<string>("")
  const [labels, setLabels] = useState<string[]>(["Publikasi"])
  const [newTagInput, setNewTagInput] = useState<string>("")
  const [isDraft, setIsDraft] = useState<boolean>(false)

  // Mode: "visual" (WYSIWYG), "html" (Raw Source), "preview" (Live Web Look)
  const [editorMode, setEditorMode] = useState<"visual" | "html" | "preview">("visual")

  // Modals for Link and Image insertion
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false)
  const [linkUrl, setLinkUrl] = useState<string>("")
  const [linkText, setLinkText] = useState<string>("")

  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [imageAlt, setImageAlt] = useState<string>("")

  // Notification message
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const visualEditorRef = useRef<HTMLDivElement>(null)

  // Check auth
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login")
        return
      }
      setAuthReady(true)
    })
    return () => unsubscribe()
  }, [router])

  // Load existing post if editing
  useEffect(() => {
    if (!authReady) return

    if (isEditing && postId) {
      const fetchPost = async () => {
        try {
          const res = await fetch(`/api/blogger/posts/${postId}`)
          if (!res.ok) {
            throw new Error("Postingan tidak ditemukan di Blogger")
          }
          const data = await res.json()
          setTitle(data.title || "")
          const initialContent = data.content || data.summary || ""
          setContentHtml(initialContent)
          if (visualEditorRef.current) {
            visualEditorRef.current.innerHTML = initialContent
          }
          if (Array.isArray(data.categories) && data.categories.length > 0) {
            setLabels(data.categories)
          }
        } catch (err: any) {
          setMessage({
            type: "error",
            text: err.message || "Gagal memuat artikel dari Blogger",
          })
        } finally {
          setLoading(false)
        }
      }
      fetchPost()
    } else {
      // Default initial dummy starter template
      const defaultContent = `<p>Tuliskan ringkasan hasil penelitian atau informasi cuaca di sini...</p>
<h2>1. Pengantar dan Analisis</h2>
<p>Laboratorium Jerukagung Seismologi terus memantau dinamika kebumian secara berkala.</p>`
      setContentHtml(defaultContent)
      if (visualEditorRef.current) {
        visualEditorRef.current.innerHTML = defaultContent
      }
      setLoading(false)
    }
  }, [authReady, isEditing, postId])

  // Sync content between visual editor and state
  const handleVisualInput = () => {
    if (visualEditorRef.current) {
      setContentHtml(visualEditorRef.current.innerHTML)
    }
  }

  // Switch modes safely
  const handleSwitchMode = (mode: "visual" | "html" | "preview") => {
    if (mode === "visual" && visualEditorRef.current) {
      visualEditorRef.current.innerHTML = contentHtml
    }
    setEditorMode(mode)
  }

  // Execute formatting command in visual editor
  const executeCommand = (command: string, value: string | undefined = undefined) => {
    if (editorMode !== "visual") {
      setEditorMode("visual")
      setTimeout(() => {
        if (visualEditorRef.current) {
          visualEditorRef.current.focus()
          document.execCommand(command, false, value)
          handleVisualInput()
        }
      }, 50)
      return
    }

    if (visualEditorRef.current) {
      visualEditorRef.current.focus()
      document.execCommand(command, false, value)
      handleVisualInput()
    }
  }

  // Label handlers
  const handleAddLabel = (tag: string) => {
    const cleanTag = tag.trim()
    if (!cleanTag) return
    if (!labels.includes(cleanTag)) {
      setLabels([...labels, cleanTag])
    }
    setNewTagInput("")
  }

  const handleRemoveLabel = (tagToRemove: string) => {
    setLabels(labels.filter((t) => t !== tagToRemove))
  }

  // Handle Image Insert
  const handleInsertImage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!imageUrl.trim()) return

    const imageHtml = `<p><img src="${imageUrl.trim()}" alt="${imageAlt.trim() || "Foto Publikasi Jeris"}" style="max-width: 100%; height: auto; border-radius: 8px; margin: 12px 0;" /></p>`

    if (editorMode === "html") {
      setContentHtml((prev) => prev + "\n" + imageHtml)
    } else {
      executeCommand("insertHTML", imageHtml)
    }

    setImageModalOpen(false)
    setImageUrl("")
    setImageAlt("")
  }

  // Handle Link Insert
  const handleInsertLink = (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkUrl.trim()) return

    const selectedText = linkText.trim() || linkUrl.trim()
    const linkHtml = `<a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer" style="color: #0284c7; text-decoration: underline;">${selectedText}</a>`

    if (editorMode === "html") {
      setContentHtml((prev) => prev + " " + linkHtml)
    } else {
      executeCommand("insertHTML", linkHtml)
    }

    setLinkModalOpen(false)
    setLinkUrl("")
    setLinkText("")
  }

  // Detect thumbnail image from content
  const firstImageMatch = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/)
  const detectedThumbnail = firstImageMatch ? firstImageMatch[1] : null

  // Save to Blogger
  const handleSavePost = async (publishNow: boolean) => {
    if (!title.trim()) {
      alert("Harap isi judul postingan terlebih dahulu!")
      return
    }
    if (!contentHtml.trim() || contentHtml === "<p><br></p>") {
      alert("Isi artikel tidak boleh kosong!")
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      if (isEditing && postId) {
        // Update post
        const res = await fetch(`/api/blogger/posts/${postId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content: contentHtml,
            labels,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui postingan di Blogger")

        setMessage({
          type: "success",
          text: `Postingan "${title}" berhasil diperbarui di Blogger!`,
        })

        setTimeout(() => {
          router.push("/dashboard")
        }, 1200)
      } else {
        // Create new post
        const res = await fetch("/api/blogger/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content: contentHtml,
            labels,
            isDraft: !publishNow,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Gagal menerbitkan postingan ke Blogger")

        setMessage({
          type: "success",
          text: publishNow
            ? `Postingan "${title}" berhasil dipublikasikan ke Blogger!`
            : `Draf postingan "${title}" berhasil disimpan di Blogger!`,
        })

        setTimeout(() => {
          router.push("/dashboard")
        }, 1200)
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err.message || "Terjadi kesalahan saat menyimpan ke Blogger",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium text-sm">
            Menyiapkan Editor Blogger JERIS...
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <Navbar />

      <main className="min-h-screen bg-gray-50/70 dark:bg-gray-950 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Top Control Bar: Judul & Aksi */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 sm:p-5 shadow-xs mb-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Back button & Title input */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs flex-shrink-0 border-gray-200 dark:border-gray-700"
              >
                <Link href="/dashboard" className="flex items-center gap-1.5">
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>
              </Button>

              <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block" />

              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Ketik Judul Postingan di sini..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-base sm:text-xl font-bold bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
              {/* Pratinjau Toggle */}
              <Button
                variant={editorMode === "preview" ? "secondary" : "outline"}
                size="sm"
                onClick={() => handleSwitchMode(editorMode === "preview" ? "visual" : "preview")}
                className="text-xs flex items-center gap-1.5 border-gray-200 dark:border-gray-700"
              >
                <Eye className="h-3.5 w-3.5 text-primary-500" />
                <span>
                  {editorMode === "preview" ? "Tutup Pratinjau" : "Pratinjau"}
                </span>
              </Button>

              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => handleSavePost(false)}
                  className="text-xs flex items-center gap-1.5 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Simpan Draf</span>
                </Button>
              )}

              <Button
                size="sm"
                disabled={saving}
                onClick={() => handleSavePost(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs"
              >
                <Send className={`h-3.5 w-3.5 ${saving ? "animate-spin" : ""}`} />
                {saving ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Publikasikan ke Blogger"}
              </Button>
            </div>
          </div>

          {/* Flash Alert Banner */}
          {message && (
            <div
              className={`mb-5 p-3 rounded-xl text-xs flex items-center justify-between border ${
                message.type === "success"
                  ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800"
                  : "bg-red-50 dark:bg-red-950/50 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {message.type === "success" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span>{message.text}</span>
              </div>
              <button onClick={() => setMessage(null)} className="text-xs underline ml-2">
                Tutup
              </button>
            </div>
          )}

          {/* Blogger-Style Formatting Toolbar */}
          {editorMode !== "preview" && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-2 shadow-xs mb-6 overflow-x-auto">
              <div className="flex items-center gap-1 min-w-[760px]">
            {/* View Mode Toggle: Compose (Visual) vs HTML */}
            <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 mr-2">
              <button
                type="button"
                title="Tampilan Menulis (Visual WYSIWYG)"
                onClick={() => handleSwitchMode("visual")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                  editorMode === "visual"
                    ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                <PenTool className="h-3.5 w-3.5" />
                <span className="text-[11px]">Tulis</span>
              </button>
              <button
                type="button"
                title="Tampilan HTML (Kode Sumber)"
                onClick={() => handleSwitchMode("html")}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                  editorMode === "html"
                    ? "bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-300 shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span className="text-[11px]">&lt;&gt; HTML</span>
              </button>
            </div>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Undo & Redo */}
            <button
              type="button"
              title="Urungkan (Ctrl+Z)"
              onClick={() => executeCommand("undo")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Ulangi (Ctrl+Y)"
              onClick={() => executeCommand("redo")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Redo2 className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Paragraph / Heading Style Dropdown */}
            <select
              aria-label="Gaya Paragraf"
              onChange={(e) => {
                const val = e.target.value
                if (val === "p") executeCommand("formatBlock", "<p>")
                else if (val === "h1") executeCommand("formatBlock", "<h1>")
                else if (val === "h2") executeCommand("formatBlock", "<h2>")
                else if (val === "h3") executeCommand("formatBlock", "<h3>")
              }}
              defaultValue="p"
              className="text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-gray-700 dark:text-gray-300 focus:outline-none"
            >
              <option value="p">Paragraf Normal</option>
              <option value="h1">Judul Utama (H1)</option>
              <option value="h2">Subjudul (H2)</option>
              <option value="h3">Judul Kecil (H3)</option>
            </select>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Font Styling: Bold, Italic, Underline, Strike */}
            <button
              type="button"
              title="Tebal (Ctrl+B)"
              onClick={() => executeCommand("bold")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-bold"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Miring (Ctrl+I)"
              onClick={() => executeCommand("italic")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Garis Bawah (Ctrl+U)"
              onClick={() => executeCommand("underline")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Underline className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Coret"
              onClick={() => executeCommand("strikeThrough")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Strikethrough className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Color Palette Quick Buttons */}
            <button
              type="button"
              title="Warna Teks Hitam / Gelap"
              onClick={() => executeCommand("foreColor", "#111827")}
              className="w-4 h-4 rounded-full bg-gray-900 border border-gray-300 mx-0.5"
            />
            <button
              type="button"
              title="Warna Teks Biru Utama JERIS"
              onClick={() => executeCommand("foreColor", "#0284c7")}
              className="w-4 h-4 rounded-full bg-primary-600 border border-gray-300 mx-0.5"
            />
            <button
              type="button"
              title="Warna Teks Merah Penting"
              onClick={() => executeCommand("foreColor", "#dc2626")}
              className="w-4 h-4 rounded-full bg-red-600 border border-gray-300 mx-0.5"
            />
            <button
              type="button"
              title="Warna Teks Hijau / Sukses"
              onClick={() => executeCommand("foreColor", "#16a34a")}
              className="w-4 h-4 rounded-full bg-emerald-600 border border-gray-300 mx-0.5"
            />

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Link & Image Insertion */}
            <button
              type="button"
              title="Sisipkan Tautan / Link"
              onClick={() => setLinkModalOpen(true)}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <LinkIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Sisipkan Gambar (URL)"
              onClick={() => setImageModalOpen(true)}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 text-primary-600"
            >
              <ImageIcon className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Alignment */}
            <button
              type="button"
              title="Rata Kiri"
              onClick={() => executeCommand("justifyLeft")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <AlignLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Rata Tengah"
              onClick={() => executeCommand("justifyCenter")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <AlignCenter className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Rata Kanan"
              onClick={() => executeCommand("justifyRight")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <AlignRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Rata Kanan-Kiri (Justify)"
              onClick={() => executeCommand("justifyFull")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <AlignJustify className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Lists & Quotes */}
            <button
              type="button"
              title="Daftar Berbutir (Bullet)"
              onClick={() => executeCommand("insertUnorderedList")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Daftar Bernomor (Numbered)"
              onClick={() => executeCommand("insertOrderedList")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ListOrdered className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Kutipan (Blockquote)"
              onClick={() => executeCommand("formatBlock", "<blockquote>")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Quote className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Garis Pemisah Horizontal"
              onClick={() => executeCommand("insertHorizontalRule")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Minus className="h-4 w-4" />
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

            {/* Clear Formatting */}
            <button
              type="button"
              title="Hapus Pemformatan"
              onClick={() => executeCommand("removeFormat")}
              className="p-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <RemoveFormatting className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace (Editor Canvas + Blogger Sidebar Settings) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Writing Area (Visual, HTML, or Preview) */}
        <div className="lg:col-span-3 flex flex-col">
          {editorMode === "visual" && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xs min-h-[600px] p-6 md:p-8 flex flex-col">
              <div
                ref={visualEditorRef}
                contentEditable
                onInput={handleVisualInput}
                className="prose prose-slate dark:prose-invert max-w-none flex-1 focus:outline-none min-h-[520px] text-gray-800 dark:text-gray-200 leading-relaxed font-sans"
                style={{
                  minHeight: "520px",
                }}
              />
            </div>
          )}

          {editorMode === "html" && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xs min-h-[600px] p-4 flex flex-col">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-800 text-xs text-gray-400">
                <span className="font-mono flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-primary-400" />
                  Editor Kode HTML Blogger
                </span>
                <span>Teks mentah HTML yang dikirim ke Google Blogger API</span>
              </div>
              <textarea
                aria-label="Editor Kode HTML Blogger"
                value={contentHtml}
                onChange={(e) => setContentHtml(e.target.value)}
                rows={22}
                className="w-full flex-1 bg-transparent text-emerald-400 font-mono text-sm leading-relaxed p-2 focus:outline-none resize-y"
                placeholder="<p>Ketikkan kode HTML atau teks di sini...</p>"
              />
            </div>
          )}

          {editorMode === "preview" && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-6 md:p-10">
              <div className="border-b border-gray-200 dark:border-gray-800 pb-4 mb-6">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300">
                  Pratinjau Live Website JERIS
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-white mt-3">
                  {title || "Judul Postingan Belum Diisi"}
                </h1>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                  <span>Laboratorium Jerukagung Seismologi</span>
                  <span>&bull;</span>
                  <span>Kategori: {labels.join(", ") || "Publikasi"}</span>
                </div>
              </div>

              {/* Rendered content */}
              <div
                className="prose prose-slate dark:prose-invert max-w-none text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: contentHtml }}
              />
            </div>
          )}
        </div>

        {/* Right Column: Setelan Postingan ala Google Blogger */}
        <div className="space-y-6">
          {/* Panel Setelan Label / Kategori */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Tag className="h-4 w-4 text-primary-500" />
              Label &amp; Kategori
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
              Label akan otomatis menjadi kategori navigasi dan tag pencarian di website.
            </p>

            {/* Input tag baru */}
            <div className="flex items-center gap-1.5 mb-3">
              <Input
                placeholder="Ketik label baru..."
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddLabel(newTagInput)
                  }
                }}
                className="text-xs h-8"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleAddLabel(newTagInput)}
                className="h-8 text-xs px-2.5"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Active Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {labels.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 font-medium border border-primary-200/50 dark:border-primary-800/50"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(tag)}
                    className="hover:text-red-500 ml-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Rekomendasi Label Cepat */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
                Rekomendasi Cepat:
              </span>
              <div className="flex flex-wrap gap-1">
                {RECOMMENDED_LABELS.map((rec) => (
                  <button
                    key={rec}
                    type="button"
                    onClick={() => handleAddLabel(rec)}
                    className={`text-[11px] px-2 py-0.5 rounded border transition-colors ${
                      labels.includes(rec)
                        ? "bg-gray-100 text-gray-400 border-gray-200 cursor-default"
                        : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:text-primary-600"
                    }`}
                  >
                    + {rec}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Foto Sampul / Thumbnail Otomatis */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
              <ImageIcon className="h-4 w-4 text-emerald-500" />
              Foto Sampul Artikel
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Foto pertama yang Anda sisipkan di artikel otomatis dijadikan gambar sampul di halaman Beranda &amp; Publikasi.
            </p>

            {detectedThumbnail ? (
              <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 relative">
                <img
                  src={detectedThumbnail}
                  alt="Sampul Terdeteksi"
                  className="w-full h-32 object-cover"
                />
                <span className="absolute bottom-2 left-2 text-[10px] bg-black/70 text-white px-2 py-0.5 rounded font-semibold">
                  Foto Sampul Terdeteksi
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                <ImageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1.5" />
                <p className="text-xs text-gray-500">Belum ada gambar disisipkan</p>
                <button
                  type="button"
                  onClick={() => setImageModalOpen(true)}
                  className="text-xs text-primary-600 dark:text-primary-400 font-semibold underline mt-1"
                >
                  Sisipkan Gambar Sekarang
                </button>
              </div>
            )}
          </div>

          {/* Panel Setelan Publikasi */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-blue-500" />
              Status Publikasi
            </h3>
            <ul className="text-xs space-y-2 text-gray-600 dark:text-gray-400">
              <li className="flex items-center justify-between">
                <span>Platform Sinkronisasi:</span>
                <strong className="text-gray-800 dark:text-gray-200">Google Blogger API v3</strong>
              </li>
              <li className="flex items-center justify-between">
                <span>Blog Tujuan:</span>
                <span className="truncate max-w-[140px] font-mono text-[11px]">
                  jerukagunglabs.blogspot.com
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span>Status Postingan:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  {isEditing ? "Tersimpan di Blogger" : "Baru"}
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal: Sisipkan Gambar */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-primary-600" />
              Sisipkan Gambar ke Artikel
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan tautan URL gambar (misal dari Google Photos, Imgur, atau link hosting gambar Anda).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInsertImage} className="space-y-3 py-2">
            <div>
              <Label htmlFor="image-url" className="text-xs font-semibold">
                URL Gambar (https://...) *
              </Label>
              <Input
                id="image-url"
                placeholder="https://images.unsplash.com/photo-..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="image-alt" className="text-xs font-semibold">
                Keterangan / Deskripsi Foto (Alt Text)
              </Label>
              <Input
                id="image-alt"
                placeholder="Stasiun Pengamatan Cuaca Jerukagung"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            {imageUrl && (
              <div className="mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 h-28 bg-gray-100">
                <img
                  src={imageUrl}
                  alt="Pratinjau"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    ;(e.target as any).style.display = "none"
                  }}
                />
              </div>
            )}

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImageModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="bg-primary-600 hover:bg-primary-700 text-white">
                Sisipkan ke Artikel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Sisipkan Tautan (Link) */}
      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <LinkIcon className="h-5 w-5 text-primary-600" />
              Sisipkan Tautan Web
            </DialogTitle>
            <DialogDescription className="text-xs">
              Masukkan alamat web tujuan dan teks yang ingin ditampilkan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInsertLink} className="space-y-3 py-2">
            <div>
              <Label htmlFor="link-text" className="text-xs font-semibold">
                Teks Tautan
              </Label>
              <Input
                id="link-text"
                placeholder="Contoh: Baca Laporan Selengkapnya"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <Label htmlFor="link-url" className="text-xs font-semibold">
                URL Tujuan (https://...) *
              </Label>
              <Input
                id="link-url"
                placeholder="https://bmkg.go.id"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                required
                className="mt-1 text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLinkModalOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" size="sm" className="bg-primary-600 hover:bg-primary-700 text-white">
                Sisipkan Tautan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
        </div>
      </main>

      <Footer />
    </>
  )
}

export default function BloggerEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <BloggerEditorContent />
    </Suspense>
  )
}

