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
  FolderOpen,
  Edit3,
  Upload,
  Trash2,
  Maximize2,
  Sliders,
  FileImage,
  Check,
  Search,
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
import { auth, storage } from "@/lib/ConfigFirebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

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

  // Image insertion states (Upload file, URL, Size presets, Alignment, Caption)
  const [imageModalOpen, setImageModalOpen] = useState<boolean>(false)
  const [imageSourceMode, setImageSourceMode] = useState<"upload" | "url">("upload")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("")
  const [imageUrl, setImageUrl] = useState<string>("")
  const [imageAlt, setImageAlt] = useState<string>("")
  const [imageCaption, setImageCaption] = useState<string>("")
  const [imageSize, setImageSize] = useState<"small" | "medium" | "large" | "xlarge" | "full" | "custom">("medium")
  const [customWidth, setCustomWidth] = useState<string>("400")
  const [imageAlign, setImageAlign] = useState<"left" | "center" | "right">("center")
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)

  // In-canvas selected image node
  const [selectedImageNode, setSelectedImageNode] = useState<HTMLImageElement | null>(null)

  // Existing posts picker state
  const [existingPosts, setExistingPosts] = useState<any[]>([])
  const [loadingPostsList, setLoadingPostsList] = useState<boolean>(false)
  const [postPickerOpen, setPostPickerOpen] = useState<boolean>(false)
  const [pickerTab, setPickerTab] = useState<"all" | "published" | "draft">("all")
  const [pickerSearch, setPickerSearch] = useState<string>("")
  const [isPostDraft, setIsPostDraft] = useState<boolean>(false)

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

  // Fetch list of existing posts for the picker
  useEffect(() => {
    const fetchExistingPosts = async () => {
      setLoadingPostsList(true)
      try {
        const res = await fetch("/api/blogger/posts")
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data)) {
            setExistingPosts(data)
          }
        }
      } catch (err) {
        console.warn("Could not load posts for editor picker:", err)
      } finally {
        setLoadingPostsList(false)
      }
    }
    fetchExistingPosts()

    if (searchParams.get("action") === "pick") {
      setPostPickerOpen(true)
    }
  }, [searchParams])

  // Synchronize content to visual editor canvas
  useEffect(() => {
    if (!loading && visualEditorRef.current && editorMode === "visual") {
      if (document.activeElement !== visualEditorRef.current) {
        visualEditorRef.current.innerHTML = contentHtml
      }
    }
  }, [loading, editorMode, contentHtml])

  // Load existing post if editing via URL ?id=...
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
          setIsPostDraft(Boolean(data.isDraft))
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
      setLoading(false)
    }
  }, [authReady, isEditing, postId])

  const handleSelectPostToEdit = (post: any) => {
    setTitle(post.title || "")
    const content = post.content || post.summary || ""
    setContentHtml(content)
    setIsPostDraft(Boolean(post.isDraft))
    if (visualEditorRef.current) {
      visualEditorRef.current.innerHTML = content
    }
    if (Array.isArray(post.categories) && post.categories.length > 0) {
      setLabels(post.categories)
    }
    setPostPickerOpen(false)
    router.replace(`/editor?id=${post.id}`)
  }

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

  // File selection for image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      alert("Harap pilih berkas gambar (JPG, PNG, WebP, GIF)!")
      return
    }
    setImageFile(file)
    const localUrl = URL.createObjectURL(file)
    setImagePreviewUrl(localUrl)
    if (!imageAlt) {
      setImageAlt(file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "))
    }
  }

  // Handle Image Insert
  const handleInsertImage = async (e: React.FormEvent) => {
    e.preventDefault()

    let finalImageUrl = imageUrl.trim()

    if (imageSourceMode === "upload") {
      if (!imageFile && !imagePreviewUrl) {
        alert("Pilih berkas gambar dari perangkat Anda terlebih dahulu!")
        return
      }

      setUploadingImage(true)
      try {
        if (imageFile) {
          // Coba unggah ke Firebase Storage jika tersedia
          try {
            const cleanName = imageFile.name.replace(/[^a-zA-Z0-9._-]/g, "_")
            const storageRef = ref(storage, `blogger_uploads/${Date.now()}_${cleanName}`)
            const snapshot = await uploadBytes(storageRef, imageFile)
            finalImageUrl = await getDownloadURL(snapshot.ref)
          } catch (storageErr) {
            console.warn("Firebase Storage upload skipped/failed, using optimized data URL:", storageErr)
            // Fallback: baca sebagai Base64 Data URL agar gambar tetap 100% tersisipkan
            finalImageUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.onerror = reject
              reader.readAsDataURL(imageFile)
            })
          }
        }
      } catch (err: any) {
        alert("Gagal memproses gambar: " + (err.message || "Kesalahan berkas"))
        setUploadingImage(false)
        return
      } finally {
        setUploadingImage(false)
      }
    }

    if (!finalImageUrl) {
      alert("Harap masukkan URL gambar atau pilih berkas foto!")
      return
    }

    // Tentukan lebar gambar sesuai pilihan ala Blogger
    let widthStyle = "350px"
    if (imageSize === "small") widthStyle = "200px"
    else if (imageSize === "medium") widthStyle = "350px"
    else if (imageSize === "large") widthStyle = "550px"
    else if (imageSize === "xlarge") widthStyle = "800px"
    else if (imageSize === "full") widthStyle = "100%"
    else if (imageSize === "custom" && customWidth) widthStyle = `${customWidth.replace(/\D/g, "") || "400"}px`

    // Tentukan perataan posisi
    let containerStyle = "clear: both; margin: 16px auto; text-align: center;"
    let imgAlignStyle = "margin: 0 auto; display: block;"

    if (imageAlign === "left") {
      containerStyle = "clear: both; margin: 12px 18px 14px 0; float: left; text-align: left;"
      imgAlignStyle = "display: inline-block;"
    } else if (imageAlign === "right") {
      containerStyle = "clear: both; margin: 12px 0 14px 18px; float: right; text-align: right;"
      imgAlignStyle = "display: inline-block;"
    }

    const captionHtml = imageCaption.trim()
      ? `<div style="font-size: 12px; color: #6b7280; margin-top: 6px; font-style: italic; line-height: 1.4;">${imageCaption.trim()}</div>`
      : ""

    const imageMarkup = `<div class="separator image-container" style="${containerStyle} max-width: 100%;">
  <img src="${finalImageUrl}" alt="${imageAlt.trim() || "Gambar Publikasi Jeris"}" style="width: ${widthStyle}; max-width: 100%; height: auto; border-radius: 8px; cursor: pointer; ${imgAlignStyle}" />
  ${captionHtml}
</div><p><br></p>`

    if (editorMode === "html") {
      setContentHtml((prev) => prev + "\n" + imageMarkup)
    } else {
      executeCommand("insertHTML", imageMarkup)
    }

    // Reset modal form
    setImageModalOpen(false)
    setImageFile(null)
    setImagePreviewUrl("")
    setImageUrl("")
    setImageAlt("")
    setImageCaption("")
    setImageSize("medium")
    setImageAlign("center")
  }

  // Live in-canvas image resizing & alignment
  const handleResizeSelectedImage = (size: "small" | "medium" | "large" | "xlarge" | "full") => {
    if (!selectedImageNode) return
    let targetWidth = "350px"
    if (size === "small") targetWidth = "200px"
    else if (size === "medium") targetWidth = "350px"
    else if (size === "large") targetWidth = "550px"
    else if (size === "xlarge") targetWidth = "800px"
    else if (size === "full") targetWidth = "100%"

    selectedImageNode.style.width = targetWidth
    selectedImageNode.style.maxWidth = "100%"
    selectedImageNode.style.height = "auto"

    handleVisualInput()
  }

  const handleAlignSelectedImage = (align: "left" | "center" | "right") => {
    if (!selectedImageNode) return
    const container = selectedImageNode.closest(".image-container") as HTMLElement | null

    if (align === "left") {
      selectedImageNode.style.float = "left"
      selectedImageNode.style.margin = "0 16px 12px 0"
      selectedImageNode.style.display = "inline-block"
      if (container) {
        container.style.float = "left"
        container.style.margin = "12px 18px 14px 0"
        container.style.textAlign = "left"
      }
    } else if (align === "right") {
      selectedImageNode.style.float = "right"
      selectedImageNode.style.margin = "0 0 12px 16px"
      selectedImageNode.style.display = "inline-block"
      if (container) {
        container.style.float = "right"
        container.style.margin = "12px 0 14px 18px"
        container.style.textAlign = "right"
      }
    } else {
      selectedImageNode.style.float = "none"
      selectedImageNode.style.margin = "16px auto"
      selectedImageNode.style.display = "block"
      if (container) {
        container.style.float = "none"
        container.style.margin = "16px auto"
        container.style.textAlign = "center"
      }
    }

    handleVisualInput()
  }

  const handleDeleteSelectedImage = () => {
    if (!selectedImageNode) return
    const container = selectedImageNode.closest(".image-container")
    if (container) {
      container.remove()
    } else {
      selectedImageNode.remove()
    }
    setSelectedImageNode(null)
    handleVisualInput()
  }

  // Click listener for selecting images inside the visual canvas
  useEffect(() => {
    const editor = visualEditorRef.current
    if (!editor) return

    const handleEditorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target && target.tagName === "IMG") {
        const img = target as HTMLImageElement
        setSelectedImageNode(img)
        editor.querySelectorAll("img").forEach((el) => {
          ;(el as HTMLElement).style.outline = "none"
        })
        img.style.outline = "3px solid #f97316"
        img.style.outlineOffset = "3px"
      } else {
        if (selectedImageNode) {
          selectedImageNode.style.outline = "none"
          setSelectedImageNode(null)
        }
      }
    }

    editor.addEventListener("click", handleEditorClick)
    return () => {
      editor.removeEventListener("click", handleEditorClick)
    }
  }, [selectedImageNode, editorMode])

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
        // Update post (bisa menyimpan perubahan draf atau mempublikasikan draf)
        const willPublishDraft = isPostDraft && publishNow
        const res = await fetch(`/api/blogger/posts/${postId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            content: contentHtml,
            labels,
            publish: willPublishDraft,
          }),
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Gagal memperbarui postingan di Blogger")

        setMessage({
          type: "success",
          text: willPublishDraft
            ? `Draf "${title}" berhasil dipublikasikan ke Blogger!`
            : `Perubahan "${title}" berhasil disimpan di Blogger!`,
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
              {/* Tombol Pilih Postingan Sebelumnya untuk Diedit */}
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setPostPickerOpen(true)}
                className="text-xs flex items-center gap-1.5 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40"
              >
                <FolderOpen className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Pilih Postingan ({existingPosts.length})</span>
                <span className="sm:hidden">Pilih ({existingPosts.length})</span>
              </Button>

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

              {(!isEditing || isPostDraft) && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={saving}
                  onClick={() => handleSavePost(false)}
                  className="text-xs flex items-center gap-1.5 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Save className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
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
                {saving
                  ? "Menyimpan..."
                  : isEditing
                  ? isPostDraft
                    ? "Publikasikan Draf Ini"
                    : "Simpan Perubahan"
                  : "Publikasikan ke Blogger"}
              </Button>
            </div>
          </div>

          {/* Status Mode Edit Postingan */}
          {isEditing && (
            <div
              className={`mb-5 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                isPostDraft
                  ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200"
                  : "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200"
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`font-bold uppercase text-[10px] text-white px-2.5 py-0.5 rounded-full ${
                    isPostDraft ? "bg-amber-600" : "bg-blue-600"
                  }`}
                >
                  {isPostDraft ? "Mode Edit Draf" : "Mode Edit"}
                </span>
                <span>
                  Sedang menyunting {isPostDraft ? "draf" : "artikel"}:{" "}
                  <strong className="underline">{title || "Memuat..."}</strong> (ID: {postId})
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  type="button"
                  onClick={() => setPostPickerOpen(true)}
                  className={`text-xs h-7 px-2.5 ${
                    isPostDraft
                      ? "text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                      : "text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
                  }`}
                >
                  <FolderOpen className="h-3.5 w-3.5 mr-1" />
                  Ganti Artikel Lain
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setTitle("")
                    const starter = "<p>Tuliskan ringkasan artikel baru di sini...</p>"
                    setContentHtml(starter)
                    if (visualEditorRef.current) visualEditorRef.current.innerHTML = starter
                    setLabels(["Publikasi"])
                    setIsPostDraft(false)
                    router.replace("/editor")
                  }}
                  className="text-xs border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 h-7 px-2.5 bg-white dark:bg-gray-800"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Tulis Artikel Baru
                </Button>
              </div>
            </div>
          )}

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
          {/* Interactive Image Toolbar when an image is clicked in canvas */}
          {selectedImageNode && editorMode === "visual" && (
            <div className="mb-4 bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 border-2 border-orange-400 dark:border-orange-500 rounded-2xl p-3.5 shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                  <ImageIcon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <span>Pengaturan Gambar Terpilih</span>
                    <span className="text-[10px] font-semibold text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-950/60 px-2 py-0.5 rounded-full border border-orange-200 dark:border-orange-800">
                      Lebar: {selectedImageNode.style.width || "Asli"}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Klik tombol ukuran atau perataan posisi di bawah untuk memperbarui gambar secara instan:
                  </p>
                </div>
              </div>

              {/* Controls: Size Presets, Alignment, Delete */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Size Presets ala Blogger */}
                <div className="flex items-center bg-white dark:bg-gray-900 rounded-xl p-1 border border-orange-200/80 dark:border-gray-700 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">Ukuran:</span>
                  <button
                    type="button"
                    onClick={() => handleResizeSelectedImage("small")}
                    className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Kecil (200px)"
                  >
                    Kecil
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResizeSelectedImage("medium")}
                    className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Sedang (350px)"
                  >
                    Sedang
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResizeSelectedImage("large")}
                    className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Besar (550px)"
                  >
                    Besar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResizeSelectedImage("xlarge")}
                    className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Sangat Besar (800px)"
                  >
                    X-Besar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResizeSelectedImage("full")}
                    className="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Ukuran Penuh (100%)"
                  >
                    Penuh
                  </button>
                </div>

                {/* Alignment */}
                <div className="flex items-center bg-white dark:bg-gray-900 rounded-xl p-1 border border-orange-200/80 dark:border-gray-700 shadow-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2">Posisi:</span>
                  <button
                    type="button"
                    onClick={() => handleAlignSelectedImage("left")}
                    className="p-1.5 text-gray-700 dark:text-gray-200 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Rata Kiri"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAlignSelectedImage("center")}
                    className="p-1.5 text-gray-700 dark:text-gray-200 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Rata Tengah"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAlignSelectedImage("right")}
                    className="p-1.5 text-gray-700 dark:text-gray-200 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Rata Kanan"
                  >
                    <AlignRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Delete Button */}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleDeleteSelectedImage}
                  className="h-8 text-xs text-red-600 hover:text-red-700 bg-white dark:bg-gray-900 hover:bg-red-50 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-1.5"
                  title="Hapus gambar terpilih"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Hapus</span>
                </Button>

                {/* Close/Deselect */}
                <button
                  type="button"
                  onClick={() => {
                    if (selectedImageNode) selectedImageNode.style.outline = "none"
                    setSelectedImageNode(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1.5 rounded-lg hover:bg-gray-200/50 dark:hover:bg-gray-700"
                  title="Selesai / Batalkan Seleksi"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

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

      {/* Modal: Sisipkan Gambar Lengkap ala Google Blogger */}
      <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
        <DialogContent className="max-w-lg bg-white dark:bg-gray-900 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2 text-gray-900 dark:text-white">
              <ImageIcon className="h-5 w-5 text-orange-500" />
              Sisipkan Gambar ke Artikel
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pilih berkas dari perangkat Anda atau masukkan tautan URL web, lalu atur ukuran dan perataan posisi gambar.
            </DialogDescription>
          </DialogHeader>

          {/* Mode Tabs: Upload File vs Masukkan URL */}
          <div className="flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl my-2">
            <button
              type="button"
              onClick={() => setImageSourceMode("upload")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                imageSourceMode === "upload"
                  ? "bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <Upload className="h-3.5 w-3.5" />
              Upload dari Komputer / HP
            </button>
            <button
              type="button"
              onClick={() => setImageSourceMode("url")}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${
                imageSourceMode === "url"
                  ? "bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
              }`}
            >
              <LinkIcon className="h-3.5 w-3.5" />
              Melalui URL Gambar
            </button>
          </div>

          <form onSubmit={handleInsertImage} className="space-y-4 py-1">
            {/* Tab 1: Upload File */}
            {imageSourceMode === "upload" && (
              <div>
                <Label htmlFor="image-file-input" className="text-xs font-semibold block mb-1.5">
                  Pilih Berkas Foto / Gambar *
                </Label>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl p-4 text-center hover:border-orange-400 transition-colors bg-gray-50/50 dark:bg-gray-800/40">
                  <input
                    type="file"
                    id="image-file-input"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {imagePreviewUrl ? (
                    <div className="space-y-3">
                      <div className="w-full h-40 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        <img
                          src={imagePreviewUrl}
                          alt="Pratinjau"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs px-1">
                        <span className="truncate max-w-[200px] text-gray-700 dark:text-gray-300 font-medium">
                          {imageFile?.name || "Foto Terpilih"}
                        </span>
                        <label
                          htmlFor="image-file-input"
                          className="text-orange-600 hover:underline cursor-pointer font-semibold"
                        >
                          Ganti Berkas
                        </label>
                      </div>
                    </div>
                  ) : (
                    <label
                      htmlFor="image-file-input"
                      className="cursor-pointer flex flex-col items-center justify-center py-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-600 flex items-center justify-center mb-2">
                        <Upload className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                        Klik untuk memilih gambar dari perangkat
                      </span>
                      <span className="text-[11px] text-gray-400 mt-1">
                        Format JPG, PNG, WebP, GIF (Ukuran disarankan &lt; 5MB)
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: URL Input */}
            {imageSourceMode === "url" && (
              <div>
                <Label htmlFor="image-url" className="text-xs font-semibold">
                  Tautan URL Gambar (https://...) *
                </Label>
                <Input
                  id="image-url"
                  placeholder="https://images.unsplash.com/... atau link foto online"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="mt-1 text-xs"
                />
                {imageUrl && (
                  <div className="mt-2.5 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 h-32 bg-gray-100 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Pratinjau"
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        ;(e.target as any).style.display = "none"
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Setting: Pilihan Ukuran Gambar ala Blogger */}
            <div>
              <Label className="text-xs font-semibold block mb-1.5">
                Pengaturan Ukuran Gambar:
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {[
                  { id: "small", label: "Kecil", desc: "200px" },
                  { id: "medium", label: "Sedang", desc: "350px (Standar)" },
                  { id: "large", label: "Besar", desc: "550px" },
                  { id: "xlarge", label: "X-Besar", desc: "800px" },
                  { id: "full", label: "Penuh", desc: "100%" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setImageSize(item.id as any)}
                    className={`py-2 px-1.5 rounded-xl border text-center transition-all ${
                      imageSize === item.id
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold shadow-xs"
                        : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-xs">{item.label}</div>
                    <div className="text-[10px] opacity-75 font-normal">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Setting: Perataan Posisi (Alignment) */}
            <div>
              <Label className="text-xs font-semibold block mb-1.5">
                Perataan Posisi Gambar:
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "left", label: "Rata Kiri", icon: AlignLeft },
                  { id: "center", label: "Rata Tengah", icon: AlignCenter },
                  { id: "right", label: "Rata Kanan", icon: AlignRight },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setImageAlign(item.id as any)}
                      className={`py-2 px-2 rounded-xl border text-center flex items-center justify-center gap-1.5 transition-all text-xs ${
                        imageAlign === item.id
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-bold shadow-xs"
                          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Setting: Keterangan / Caption & Alt Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="image-caption" className="text-xs font-semibold">
                  Keterangan Foto (Caption Bawah)
                </Label>
                <Input
                  id="image-caption"
                  placeholder="Contoh: Sensor seismograf di Stasiun Jerukagung"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="image-alt" className="text-xs font-semibold">
                  Deskripsi Aksesibilitas (Alt Text)
                </Label>
                <Input
                  id="image-alt"
                  placeholder="Deskripsi singkat foto"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setImageModalOpen(false)}
                disabled={uploadingImage}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={uploadingImage}
                className="bg-orange-600 hover:bg-orange-700 text-white font-semibold"
              >
                {uploadingImage ? (
                  <>
                    <Upload className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    Mengunggah Foto...
                  </>
                ) : (
                  "Sisipkan ke Artikel"
                )}
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

      {/* Modal: Pilih Postingan untuk Diedit */}
      <Dialog open={postPickerOpen} onOpenChange={setPostPickerOpen}>
        <DialogContent className="max-w-2xl bg-white dark:bg-gray-900 max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-blue-600" />
              Pilih Postingan Blogger untuk Diedit
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pilih artikel yang dipublikasikan atau draf dari Google Blogger untuk dimuat ke dalam editor.
            </DialogDescription>
          </DialogHeader>

          {/* Subheader: Filter Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 py-2 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1 p-1 bg-gray-100/90 dark:bg-gray-800 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPickerTab("all")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  pickerTab === "all"
                    ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                Semua ({existingPosts.length})
              </button>
              <button
                type="button"
                onClick={() => setPickerTab("published")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  pickerTab === "published"
                    ? "bg-white dark:bg-gray-700 text-emerald-700 dark:text-emerald-400 shadow-xs font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                Dipublikasikan ({existingPosts.filter((p) => !p.isDraft).length})
              </button>
              <button
                type="button"
                onClick={() => setPickerTab("draft")}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  pickerTab === "draft"
                    ? "bg-white dark:bg-gray-700 text-amber-700 dark:text-amber-400 shadow-xs font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
              >
                Draf ({existingPosts.filter((p) => p.isDraft).length})
              </button>
            </div>

            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Telusuri postingan..."
                value={pickerSearch}
                onChange={(e) => setPickerSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-2 divide-y divide-gray-100 dark:divide-gray-800">
            {existingPosts
              .filter((p) => {
                if (pickerTab === "published" && p.isDraft) return false
                if (pickerTab === "draft" && !p.isDraft) return false
                if (pickerSearch.trim()) {
                  const q = pickerSearch.toLowerCase()
                  const titleMatch = p.title?.toLowerCase().includes(q)
                  const labelMatch =
                    Array.isArray(p.categories) &&
                    p.categories.some((c: string) => c.toLowerCase().includes(q))
                  return titleMatch || labelMatch
                }
                return true
              })
              .map((post) => (
                <div
                  key={post.id}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2.5 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700">
                      <img src={post.thumbnail} alt={post.title} className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {post.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 flex-wrap">
                        {post.isDraft ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            Draf
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            Dipublikasikan
                          </span>
                        )}
                        <span>&bull;</span>
                        <span>{post.date}</span>
                        {post.categories && post.categories.length > 0 && (
                          <>
                            <span>&bull;</span>
                            <span className="truncate max-w-[150px]">{post.categories.join(", ")}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    type="button"
                    onClick={() => handleSelectPostToEdit(post)}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex-shrink-0 self-end sm:self-center"
                  >
                    <Edit3 className="h-3.5 w-3.5 mr-1" />
                    Buka &amp; Edit
                  </Button>
                </div>
              ))}

            {existingPosts.length === 0 && loadingPostsList && (
              <div className="text-center py-8 text-xs text-gray-500">
                Memuat daftar artikel dan draf dari Blogger...
              </div>
            )}

            {existingPosts.length === 0 && !loadingPostsList && (
              <div className="text-center py-8 text-xs text-gray-500">
                Belum ada artikel ditemukan di Blogger.
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setPostPickerOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
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

