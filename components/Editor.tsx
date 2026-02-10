"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  Bot,
  X,
  RefreshCw,
  Quote,
  Bold,
  Italic,
  List,
  Sparkles,
  Search,
  MessageSquare,
  BookOpen,
  ExternalLink,
  Maximize2,
  Minimize2,
  Pen,
  Book,
  FileText,
  Mic,
  Volume2,
  Plus,
  PieChart,
  Trash2,
  Copy,
  BrainCircuit,
  Clock,
  Pause,
  Play,
  Sigma,
  Layout,
  Layers,
  ArrowRight,
  History,
  RotateCcw,
  ChevronDown,
  Type,
  MoreHorizontal,
  Headphones,
  CloudRain,
  Coffee,
  Wind,
  DownloadCloud,
  FileCode,
  Heading1,
  Heading2,
  Heading3,
  Share2,
  Wifi,
  ArrowDown,
  MessageCircle,
} from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts"
import type {
  Document,
  AISuggestion,
  University,
  ChatMessage,
  ResearchResponse,
  Reference,
  ChartData,
  LibraryItem,
} from "../types"
import { GeminiService } from "../services/geminiService"
import { OpenCitationsService } from "../services/openCitationsService"

interface EditorProps {
  document: Document
  university: University | null
  onSave: (doc: Document) => void
  onBack: () => void
  libraryItems: LibraryItem[]
}

interface OutlineItem {
  id: string
  text: string
  level: number
  index: number
}

interface Version {
  id: string
  timestamp: number
  content: string
  wordCount: number
  description?: string
}

interface Collaborator {
  id: string
  name: string
  color: string
  avatar: string
  isActive: boolean
}

interface RemoteCursor {
  userId: string
  position: { top: number; left: number }
  label: string
  color: string
}

const PHRASE_BANK = {
  Introduction: [
    "The primary objective of this study is to...",
    "This research aims to investigate...",
    "Recent developments in [field] have heightened the need for...",
    "This study addresses the gap in...",
    "The significance of this study lies in...",
  ],
  "Literature Review": [
    "Previous research has established that...",
    "Smith (2020) argues that...",
    "However, these studies fail to account for...",
    "A recurrent theme in the literature is...",
    "While there is consensus on X, Y remains controversial...",
  ],
  Methodology: [
    "Data was collected using...",
    "The research design utilized a...",
    "Participants were recruited via...",
    "This approach was chosen because...",
    "To ensure reliability, the study employed...",
  ],
  Results: [
    "As shown in Table 1, there is a significant...",
    "The results indicate that...",
    "Interestingly, the data suggests...",
    "Figure 2 illustrates the relationship between...",
    "Contrary to expectations, no correlation was found...",
  ],
  Discussion: [
    "These findings suggest that...",
    "In contrast to earlier findings, this study...",
    "One possible explanation for this is...",
    "The implications of this are...",
    "It is plausible that these results reflect...",
  ],
  Conclusion: [
    "In conclusion, this study has shown...",
    "Future research should focus on...",
    "The main contribution of this work is...",
    "Ideally, these findings should be replicated...",
    "Practitioners should consider...",
  ],
  "Critical Analysis": [
    "The evidence seems to indicate...",
    "This argument is flawed because...",
    "A limitation of this approach is...",
    "However, one must consider...",
  ],
}

export const Editor: React.FC<EditorProps> = ({ document: thesisDoc, university, onSave, onBack, libraryItems }) => {
  const [content, setContent] = useState(thesisDoc.content)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isWriting, setIsWriting] = useState(false)
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [activeTab, setActiveTab] = useState<
    | "write"
    | "review"
    | "research"
    | "chat"
    | "thesaurus"
    | "figures"
    | "references"
    | "sections"
    | "history"
    | "phrases"
  >("write")
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isStructureOpen, setIsStructureOpen] = useState(true) // Control left sidebar

  // Review Mode: 'suggestions' (Flash) or 'critique' (Pro Thinking)
  const [reviewMode, setReviewMode] = useState<"suggestions" | "critique">("suggestions")
  const [critiqueText, setCritiqueText] = useState("")
  const [isCritiquing, setIsCritiquing] = useState(false)

  // Stats
  const [wordCount, setWordCount] = useState(0)
  const wordTarget = 5000

  // Outline
  const [outline, setOutline] = useState<OutlineItem[]>([])

  // Sections Generation State
  const [generatingSectionId, setGeneratingSectionId] = useState<string | null>(null)
  const [isGeneratingOutline, setIsGeneratingOutline] = useState(false)

  // Research State
  const [searchQuery, setSearchQuery] = useState("")
  const [researchResults, setResearchResults] = useState<ResearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)

  // Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      role: "model",
      text: "Hello! I am your AI Supervisor. Ask me anything about your thesis structure, methodology, or analysis.",
      timestamp: new Date(),
    },
  ])
  const [chatInput, setChatInput] = useState("")
  const [isChatting, setIsChatting] = useState(false)

  // Thesaurus State
  const [selectedWord, setSelectedWord] = useState("")
  const [synonyms, setSynonyms] = useState<string[]>([])
  const [isLoadingSynonyms, setIsLoadingSynonyms] = useState(false)

  // Figures State
  const [figures, setFigures] = useState<ChartData[]>([])
  const [figurePrompt, setFigurePrompt] = useState("")
  const [isGeneratingFigure, setIsGeneratingFigure] = useState(false)

  // References State
  const [references, setReferences] = useState<Reference[]>([])
  const [refInput, setRefInput] = useState("")
  const [isParsingRef, setIsParsingRef] = useState(false)

  // Version History State
  const [versions, setVersions] = useState<Version[]>([])

  // Citation Modal State
  const [citationModalOpen, setCitationModalOpen] = useState(false)
  const [citationFields, setCitationFields] = useState({ author: "", year: "", title: "", source: "" })
  const [citationResult, setCitationResult] = useState("")
  const [isGeneratingCitation, setIsGeneratingCitation] = useState(false)
  const [showLibraryPicker, setShowLibraryPicker] = useState(false)

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false)

  // Voice State
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)

  // Pomodoro State
  const [pomodoroActive, setPomodoroActive] = useState(false)
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60) // 25 mins

  // Soundscape State
  const [activeSound, setActiveSound] = useState<"none" | "rain" | "white" | "cafe">("none")
  const [showSoundMenu, setShowSoundMenu] = useState(false)

  // Collaboration State
  const [collaborators, setCollaborators] = useState<Collaborator[]>([
    { id: "u1", name: "Dr. Kimani (Sup)", color: "#ef4444", avatar: "https://i.pravatar.cc/150?u=a", isActive: true },
    { id: "u2", name: "Sarah (Editor)", color: "#f59e0b", avatar: "https://i.pravatar.cc/150?u=b", isActive: true },
  ])
  const [remoteCursors, setRemoteCursors] = useState<RemoteCursor[]>([])
  const [isConnected, setIsConnected] = useState(true)

  // Toolbar Dropdown States
  const [isFormatMenuOpen, setIsFormatMenuOpen] = useState(false)
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false)
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false)
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false)

  const formatMenuRef = useRef<HTMLDivElement>(null)
  const insertMenuRef = useRef<HTMLDivElement>(null)
  const toolsMenuRef = useRef<HTMLDivElement>(null)
  const aiMenuRef = useRef<HTMLDivElement>(null)

  // Text Selection
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null)

  // Styles - Apply university standards
  const editorStyle = {
    fontFamily: university?.standards?.font || "Times New Roman",
    fontSize: university?.standards?.size ? `${university.standards.size}pt` : "12pt",
    lineHeight:
      university?.standards?.spacing === "Double"
        ? "2.0"
        : university?.standards?.spacing === "1.5"
          ? "1.5"
          : university?.standards?.spacing === "1.0"
            ? "1.0"
            : "1.5",
  }

  // Effects
  useEffect(() => {
    // Auto-close structure on mobile initially
    if (window.innerWidth < 768) {
      setIsStructureOpen(false)
    }

    const timer = setTimeout(() => {
      onSave({ ...thesisDoc, content, lastModified: new Date() })
    }, 5000)

    const words = content
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length
    setWordCount(words)

    const lines = content.split("\n")
    const newOutline: OutlineItem[] = []
    let currentIndex = 0
    lines.forEach((line) => {
      const match = line.match(/^(Chapter \d+|[0-9]+\.[0-9]+|[A-Z][A-Z\s]+$)/)
      if (match && line.length < 100) {
        newOutline.push({
          id: `line-${currentIndex}`,
          text: line,
          level: line.startsWith("Chapter") ? 1 : 2,
          index: currentIndex,
        })
      }
      currentIndex += line.length + 1
    })
    setOutline(newOutline)

    return () => clearTimeout(timer)
  }, [content, thesisDoc, onSave])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formatMenuRef.current && !formatMenuRef.current.contains(event.target as Node)) setIsFormatMenuOpen(false)
      if (insertMenuRef.current && !insertMenuRef.current.contains(event.target as Node)) setIsInsertMenuOpen(false)
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) setIsToolsMenuOpen(false)
      if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) setIsAiMenuOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Version History Loader
  useEffect(() => {
    const savedVersions = localStorage.getItem(`doc_versions_${thesisDoc.id}`)
    if (savedVersions) {
      try {
        setVersions(JSON.parse(savedVersions))
      } catch (e) {
        console.error("Failed to parse versions", e)
      }
    }
  }, [thesisDoc.id])

  // Pomodoro Timer Effect
  useEffect(() => {
    let interval: any
    if (pomodoroActive && pomodoroTime > 0) {
      interval = setInterval(() => {
        setPomodoroTime((prev) => prev - 1)
      }, 1000)
    } else if (pomodoroTime === 0) {
      setPomodoroActive(false)
      if (Notification.permission === "granted") {
        new Notification("Focus Session Complete!")
      } else {
        alert("Focus session complete! Take a break.")
      }
      setPomodoroTime(25 * 60)
    }
    return () => clearInterval(interval)
  }, [pomodoroActive, pomodoroTime])

  // Collaboration Simulation Effect
  useEffect(() => {
    // 1. Initial Position Setup
    const updateCursors = () => {
      setRemoteCursors((prev) => {
        // Only update active collaborators
        return collaborators
          .filter((c) => c.isActive)
          .map((c) => {
            // Simulate somewhat natural movement or typing near previous position
            // Just random for mockup
            return {
              userId: c.id,
              label: c.name,
              color: c.color,
              position: {
                top: Math.max(50, Math.min(600, Math.random() * 600)),
                left: Math.max(50, Math.min(600, Math.random() * 600)),
              },
            }
          })
      })
    }

    // 2. Simulate random edits (rarely)
    const simulateTyping = () => {
      if (Math.random() > 0.8) {
        // 20% chance to simulate a type event
        const phrases = [" (citation needed) ", " [clarify] ", " excellent point ", " needs data "]
        // Just append to end for safety in this mockup to avoid cursor jumping issues
        // In real app, OT/CRDT handles this
        // setContent(prev => prev + ' ' + phrases[Math.floor(Math.random() * phrases.length)]);
        // Commented out to avoid annoying the user during demo, but visual cursors remain.
      }
    }

    const interval = setInterval(() => {
      updateCursors()
      simulateTyping()
    }, 3000) // Update every 3 seconds

    return () => clearInterval(interval)
  }, [collaborators])

  // AI Handlers (analyze, critique, research, chat, rewrite, autocomplete, synonyms, figures, reference) remain same...
  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    setReviewMode("suggestions")
    setActiveTab("review")
    try {
      const results = await GeminiService.analyzeText(content, university?.name || "Standard")
      setSuggestions(results)
    } catch (e) {
      console.error(e)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleDeepCritique = async () => {
    if (!content || content.length < 50) return
    setIsCritiquing(true)
    setCritiqueText("")
    try {
      const result = await GeminiService.deepCritique(content)
      setCritiqueText(result)
    } catch (e) {
      console.error(e)
    } finally {
      setIsCritiquing(false)
    }
  }

  const handleResearch = async () => {
    if (!searchQuery.trim()) return
    setIsSearching(true)
    try {
      const result = await GeminiService.researchTopic(searchQuery)
      setResearchResults(result)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSearching(false)
    }
  }

  const handleChat = async () => {
    if (!chatInput.trim()) return
    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: "user", text: chatInput, timestamp: new Date() }
    setChatMessages((prev) => [...prev, newUserMsg])
    setChatInput("")
    setIsChatting(true)
    try {
      const response = await GeminiService.chatWithTutor(chatInput, content)
      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        text: response,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, newAiMsg])
    } catch (e) {
      console.error(e)
    } finally {
      setIsChatting(false)
    }
  }

  const handleRewrite = async (mode: "paraphrase" | "expand" | "shorten") => {
    if (!textareaRef.current || !selectionRange || selectionRange.start === selectionRange.end) {
      alert("Please select some text to rewrite.")
      return
    }
    const selectedText = content.substring(selectionRange.start, selectionRange.end)
    const newText = await GeminiService.rewriteText(selectedText, mode)
    const newContent = content.substring(0, selectionRange.start) + newText + content.substring(selectionRange.end)
    setContent(newContent)
    setIsFormatMenuOpen(false) // Close menu if open
  }

  const handleAutocomplete = async () => {
    setIsWriting(true)
    try {
      const newText = await GeminiService.continueWriting(content)
      if (newText) {
        setContent((prev) => prev + (prev.endsWith(" ") ? "" : " ") + newText)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsWriting(false)
    }
  }

  const handleSynonyms = async () => {
    if (!textareaRef.current || !selectionRange || selectionRange.start === selectionRange.end) return
    const word = content.substring(selectionRange.start, selectionRange.end)
    if (word.split(" ").length > 1) {
      alert("Please select a single word.")
      return
    }
    setSelectedWord(word)
    setActiveTab("thesaurus")
    setIsLoadingSynonyms(true)
    try {
      const results = await GeminiService.getSynonyms(
        word,
        content.substring(Math.max(0, selectionRange.start - 50), Math.min(content.length, selectionRange.end + 50)),
      )
      setSynonyms(results)
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoadingSynonyms(false)
    }
  }

  const handleGenerateFigure = async () => {
    if (!figurePrompt) return
    setIsGeneratingFigure(true)
    try {
      const result = await GeminiService.generateChartData(figurePrompt)
      if (result) {
        setFigures((prev) => [...prev, result])
        setFigurePrompt("")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsGeneratingFigure(false)
    }
  }

  const handleAddReference = async () => {
    if (!refInput) return
    setIsParsingRef(true)
    try {
      let result: Reference | null = null

      // Check for DOI pattern
      const cleanInput = refInput.trim()
      const isDoi = cleanInput.match(/^(doi:)?10\.\d{4,9}\/[-._;()/:a-zA-Z0-9]+$/i)

      if (isDoi) {
        const metadata = await OpenCitationsService.getMetadata(cleanInput)
        if (metadata) {
          const year = metadata.pub_date ? metadata.pub_date.substring(0, 4) : "n.d."
          result = {
            id: Date.now().toString(),
            raw: cleanInput,
            author: metadata.author ? metadata.author.replace(/;/g, ", ") : "Unknown Author",
            year: year,
            title: metadata.title || "Untitled",
            source: metadata.venue || "",
            formatted: `${metadata.author ? metadata.author.split(";")[0] : "Unknown"} (${year}). ${metadata.title}. ${metadata.venue || ""}.`,
          }
        }
      }

      // Fallback to Gemini if not a DOI or OC failed
      if (!result) {
        result = await GeminiService.parseReference(refInput)
      }

      if (result) {
        setReferences((prev) => [...prev, result!])
        setRefInput("")
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsParsingRef(false)
    }
  }

  // Version History Handlers
  const handleSaveVersion = (description = "Snapshot") => {
    const newVersion: Version = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      content: content,
      wordCount: content.trim().split(/\s+/).length,
      description,
    }
    const updatedVersions = [newVersion, ...versions]
    setVersions(updatedVersions)
    localStorage.setItem(`doc_versions_${thesisDoc.id}`, JSON.stringify(updatedVersions))
  }

  const handleRestoreVersion = (version: Version) => {
    if (
      window.confirm(
        `Are you sure you want to revert to the version from ${new Date(version.timestamp).toLocaleString()}? Unsaved changes will be lost.`,
      )
    ) {
      // Save current state as a backup before reverting
      handleSaveVersion("Auto-Backup before Revert")
      setContent(version.content)
    }
  }

  const handleDeleteVersion = (id: string) => {
    const updated = versions.filter((v) => v.id !== id)
    setVersions(updated)
    localStorage.setItem(`doc_versions_${thesisDoc.id}`, JSON.stringify(updated))
  }

  // Citation Handlers
  const handleGenerateCitation = async () => {
    if (!citationFields.title && !citationFields.source) return
    setIsGeneratingCitation(true)
    try {
      const details = `Author: ${citationFields.author}, Year: ${citationFields.year}, Title: ${citationFields.title}, Source: ${citationFields.source}`
      const res = await GeminiService.generateCitation(details)
      setCitationResult(res)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGeneratingCitation(false)
    }
  }

  const insertCitation = () => {
    const textToInsert = ` ${citationResult}`
    if (selectionRange) {
      const newContent = content.substring(0, selectionRange.end) + textToInsert + content.substring(selectionRange.end)
      setContent(newContent)
    } else {
      setContent((prev) => prev + textToInsert)
    }
    resetCitationModal()
  }

  const clearCitationForm = () => {
    setCitationFields({ author: "", year: "", title: "", source: "" })
    setCitationResult("")
  }

  const resetCitationModal = () => {
    setCitationResult("")
    setCitationFields({ author: "", year: "", title: "", source: "" })
    setCitationModalOpen(false)
    setShowLibraryPicker(false)
    setIsFormatMenuOpen(false)
  }

  const handleSelectFromLibrary = (item: LibraryItem) => {
    setCitationFields({
      author: item.author,
      year: item.year,
      title: item.title,
      source: item.source,
    })
    setCitationResult(item.formatted)
    setShowLibraryPicker(false)
  }

  const insertLatex = () => {
    setContent((prev) => prev + " $ E = mc^2 $ ")
    setIsInsertMenuOpen(false)
  }

  const handleFormatting = (type: "bold" | "italic" | "list" | "h1" | "h2" | "h3") => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const selectedText = content.substring(start, end)
    let newText = ""

    switch (type) {
      case "bold":
        newText = `**${selectedText}**`
        break
      case "italic":
        newText = `*${selectedText}*`
        break
      case "list":
        newText = `\n- ${selectedText}`
        break
      case "h1":
        newText = `\n# ${selectedText}`
        break
      case "h2":
        newText = `\n## ${selectedText}`
        break
      case "h3":
        newText = `\n### ${selectedText}`
        break
    }

    const newContent = content.substring(0, start) + newText + content.substring(end)
    setContent(newContent)
    setIsFormatMenuOpen(false)
  }

  const handleInsertPhrase = (phrase: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const newContent = content.substring(0, start) + phrase + content.substring(end)
      setContent(newContent)
    } else {
      setContent((prev) => prev + phrase)
    }
  }

  const handleInsertResearchSummary = (text: string) => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart
      const end = textareaRef.current.selectionEnd
      const newContent = content.substring(0, start) + text + content.substring(end)
      setContent(newContent)
    } else {
      setContent((prev) => prev + text)
    }
  }

  // Sections Generation
  const handleGenerateOutline = () => {
    const standardOutline = `Chapter 1: Introduction\n1.1 Background of the Study\n1.2 Problem Statement\n1.3 Objectives\n\nChapter 2: Literature Review\n2.1 Theoretical Framework\n2.2 Empirical Review\n\nChapter 3: Methodology\n3.1 Research Design\n3.2 Data Collection\n\nChapter 4: Results\n\nChapter 5: Discussion\n\nChapter 6: Conclusion\n\nReferences`
    setContent((prev) => prev + (prev ? "\n\n" : "") + standardOutline)
  }

  const handleGenerateSmartOutline = async () => {
    setIsGeneratingOutline(true)
    try {
      const outlineText = await GeminiService.generateThesisOutline(thesisDoc.title)
      setContent((prev) => prev + (prev ? "\n\n" : "") + outlineText)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGeneratingOutline(false)
    }
  }

  const handleGenerateSectionContent = async (section: OutlineItem) => {
    setGeneratingSectionId(section.id)
    try {
      const newText = await GeminiService.generateSectionContent(section.text, thesisDoc.title, content)
      const insertionPoint = section.index + section.text.length
      const newContent = content.slice(0, insertionPoint) + "\n\n" + newText + content.slice(insertionPoint)
      setContent(newContent)
    } catch (e) {
      console.error(e)
    } finally {
      setGeneratingSectionId(null)
    }
  }

  const handleReadAloud = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    const utterance = new SpeechSynthesisUtterance(content)
    utterance.rate = 0.9
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setIsSpeaking(true)
    setIsToolsMenuOpen(false)
  }

  const handleDictation = () => {
    if (isListening) {
      // Handled via UI toggle usually, but here simple toggle
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = false
        recognition.interimResults = false
        recognition.onstart = () => setIsListening(true)
        recognition.onend = () => setIsListening(false)
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript
          setContent((prev) => prev + " " + transcript)
        }
        recognition.start()
      } else {
        alert("Browser does not support Speech Recognition")
      }
    }
    setIsToolsMenuOpen(false)
  }

  // Utils
  const handleSelect = () => {
    if (textareaRef.current) {
      setSelectionRange({
        start: textareaRef.current.selectionStart,
        end: textareaRef.current.selectionEnd,
      })
    }
  }

  const scrollToSection = (index: number) => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(index, index)
      const lineHeight = 24
      const lines = content.substring(0, index).split("\n").length
      textareaRef.current.scrollTop = lines * lineHeight
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert("Copied!")
  }

  const renderCritique = (text: string) => {
    return text.split("\n").map((line, i) => {
      const trimLine = line.trim()
      if (!trimLine) return <br key={i} />
      if (trimLine.startsWith("**") || trimLine.startsWith("##")) {
        return (
          <h4 key={i} className="font-bold text-teal-800 mt-3 mb-1">
            {trimLine.replace(/^[*#]+/, "").replace(/[*#]+$/, "")}
          </h4>
        )
      }
      if (trimLine.startsWith("- ")) {
        return (
          <li key={i} className="ml-4 list-disc text-slate-700 text-sm mb-1">
            {trimLine.substring(2)}
          </li>
        )
      }
      return (
        <p key={i} className="text-slate-700 text-sm mb-2 leading-relaxed">
          {line}
        </p>
      )
    })
  }

  const renderChart = (fig: ChartData) => {
    const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

    if (fig.type === "bar") {
      return (
        <BarChart data={fig.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={fig.xKey} hide />
          <YAxis />
          <ReTooltip />
          <Legend />
          {fig.dataKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={COLORS[i % COLORS.length]} />
          ))}
        </BarChart>
      )
    }
    if (fig.type === "line") {
      return (
        <LineChart data={fig.data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={fig.xKey} hide />
          <YAxis />
          <ReTooltip />
          <Legend />
          {fig.dataKeys.map((key, i) => (
            <Line key={key} type="monotone" dataKey={key} stroke={COLORS[i % COLORS.length]} />
          ))}
        </LineChart>
      )
    }
    if (fig.type === "pie") {
      return (
        <RePieChart>
          <Pie
            data={fig.data}
            dataKey={fig.dataKeys[0]}
            nameKey={fig.xKey}
            cx="50%"
            cy="50%"
            outerRadius={60}
            fill="#8884d8"
            label
          >
            {fig.data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <ReTooltip />
        </RePieChart>
      )
    }
    return null
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  return (
    <div
      className={`fixed inset-0 bg-slate-100 flex overflow-hidden z-50 transition-all duration-300 ${isFocusMode ? "p-0" : ""}`}
    >
      {/* Structure Sidebar (Left) */}
      {!isFocusMode && (
        <div
          className={`
          bg-white border-r border-slate-200 flex flex-col shadow-xl md:shadow-sm transition-all duration-300 overflow-hidden z-40
          fixed inset-y-0 left-0 h-full
          md:relative
          ${isStructureOpen ? "translate-x-0 w-64" : "-translate-x-full w-64 md:translate-x-0 md:w-0"}
        `}
        >
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider flex items-center whitespace-nowrap">
              <List size={14} className="mr-2" /> Structure
            </h3>
            <button onClick={() => setIsStructureOpen(false)} className="md:hidden p-1 text-slate-400">
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 w-64">
            {outline.length === 0 ? (
              <p className="text-xs text-slate-400 p-4 italic">
                Add headings (e.g. "Chapter 1") to see document structure.
              </p>
            ) : (
              <ul className="space-y-1">
                {outline.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => scrollToSection(item.index)}
                      className={`w-full text-left px-3 py-2 rounded text-sm hover:bg-slate-100 truncate ${item.level === 1 ? "font-bold text-slate-800" : "pl-6 text-slate-600"}`}
                    >
                      {item.text}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="p-4 border-t border-slate-200 bg-slate-50 w-64">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Progress</span>
              <span>{Math.round((wordCount / wordTarget) * 100)}%</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full">
              <div
                className="bg-teal-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (wordCount / wordTarget) * 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              {wordCount} / {wordTarget} words
            </p>
          </div>
        </div>
      )}

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col min-w-0 relative bg-slate-100 h-full">
        {/* Toolbar */}
        {!isFocusMode && (
          <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shadow-sm z-10 overflow-x-auto no-scrollbar gap-4">
            <div className="flex items-center space-x-4 shrink-0">
              <button
                onClick={onBack}
                className="text-slate-500 hover:text-slate-800 text-sm font-medium whitespace-nowrap"
              >
                ← Back
              </button>
              <div className="h-6 w-px bg-slate-200"></div>
              {/* Hide Structure toggle on mobile as it's in bottom nav */}
              <div className="hidden md:block">
                {!isStructureOpen && (
                  <button
                    onClick={() => setIsStructureOpen(true)}
                    className="p-2 text-slate-500 hover:bg-slate-100 rounded"
                    title="Open Structure"
                  >
                    <Layout size={20} />
                  </button>
                )}
              </div>
              <h2 className="font-serif font-bold text-lg text-slate-800 truncate max-w-[150px] md:max-w-xs">
                {thesisDoc.title}
              </h2>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {/* Collaboration Avatars - Hidden on small mobile */}
              <div className="hidden sm:flex items-center -space-x-2 mr-2">
                {collaborators.map((c) => (
                  <div key={c.id} className="relative group/avatar">
                    <img
                      src={c.avatar || "/placeholder.svg"}
                      alt={c.name}
                      className="w-8 h-8 rounded-full border-2 border-white cursor-pointer hover:scale-110 transition-transform"
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${c.isActive ? "bg-green-500" : "bg-slate-300"}`}
                    ></div>
                    <div className="absolute top-full right-0 mt-1 hidden group-hover/avatar:block bg-slate-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-50">
                      {c.name}
                    </div>
                  </div>
                ))}
                <button className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-500 hover:bg-slate-200 text-xs font-bold">
                  +
                </button>
              </div>

              {/* Status Indicator */}
              <div
                className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded bg-slate-50 ${isConnected ? "text-green-600" : "text-red-500"}`}
              >
                {isConnected ? <Wifi size={10} /> : <Wifi size={10} className="text-red-500" />}
                <span className="hidden md:inline">{isConnected ? "Online" : "Offline"}</span>
              </div>

              <div className="h-6 w-px bg-slate-200 mx-2"></div>

              {/* Formatting Dropdown */}
              <div className="relative" ref={formatMenuRef}>
                <button
                  onClick={() => setIsFormatMenuOpen(!isFormatMenuOpen)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isFormatMenuOpen ? "bg-slate-200 text-slate-900" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  <Type size={16} />
                  <span className="hidden sm:inline">Format</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isFormatMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isFormatMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in-down">
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Text Style
                    </div>
                    <button
                      onClick={() => handleFormatting("bold")}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                    >
                      <Bold size={14} /> Bold
                    </button>
                    <button
                      onClick={() => handleFormatting("italic")}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                    >
                      <Italic size={14} /> Italic
                    </button>
                    <button
                      onClick={() => handleFormatting("list")}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                    >
                      <List size={14} /> Bullet List
                    </button>

                    <div className="h-px bg-slate-100 my-1"></div>
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Headers
                    </div>
                    <button
                      onClick={() => handleFormatting("h1")}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                    >
                      <Heading1 size={14} /> Heading 1
                    </button>
                    <button
                      onClick={() => handleFormatting("h2")}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                    >
                      <Heading2 size={14} /> Heading 2
                    </button>
                    <button
                      onClick={() => handleFormatting("h3")}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                    >
                      <Heading3 size={14} /> Heading 3
                    </button>

                    <div className="h-px bg-slate-100 my-1"></div>
                    <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      AI Edit
                    </div>
                    <button
                      onClick={() => handleRewrite("paraphrase")}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-indigo-700 text-sm flex items-center gap-2"
                    >
                      <RefreshCw size={14} /> Paraphrase
                    </button>
                    <button
                      onClick={() => handleRewrite("expand")}
                      className="w-full text-left px-4 py-2 hover:bg-indigo-50 text-indigo-700 text-sm flex items-center gap-2"
                    >
                      <Maximize2 size={14} /> Expand
                    </button>
                  </div>
                )}
              </div>

              {/* Insert Dropdown */}
              <div className="relative" ref={insertMenuRef}>
                <button
                  onClick={() => setIsInsertMenuOpen(!isInsertMenuOpen)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isInsertMenuOpen ? "bg-slate-200 text-slate-900" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Insert</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isInsertMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isInsertMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in-down">
                    <button
                      onClick={() => setCitationModalOpen(true)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                    >
                      <Quote size={14} /> Citation
                    </button>
                    <button
                      onClick={insertLatex}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                    >
                      <Sigma size={14} /> Math / LaTeX
                    </button>
                    <button
                      onClick={() => setActiveTab("phrases")}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                    >
                      <MessageSquare size={14} /> Phrase
                    </button>
                  </div>
                )}
              </div>

              {/* Tools Dropdown - Desktop Only */}
              <div className="relative hidden md:block" ref={toolsMenuRef}>
                <button
                  onClick={() => setIsToolsMenuOpen(!isToolsMenuOpen)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isToolsMenuOpen ? "bg-slate-200 text-slate-900" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                >
                  <MoreHorizontal size={16} />
                  <span className="hidden sm:inline">Tools</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-200 ${isToolsMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isToolsMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in-down">
                    <button
                      onClick={handleReadAloud}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${isSpeaking ? "text-indigo-600 font-bold" : "text-slate-700"}`}
                    >
                      <Volume2 size={14} /> {isSpeaking ? "Stop Reading" : "Read Aloud"}
                    </button>
                    <button
                      onClick={handleDictation}
                      className={`w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2 ${isListening ? "text-red-600 font-bold" : "text-slate-700"}`}
                    >
                      <Mic size={14} /> {isListening ? "Stop Dictation" : "Dictation"}
                    </button>
                    <button
                      onClick={handleSynonyms}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                    >
                      <Book size={14} /> Thesaurus
                    </button>
                    <button
                      onClick={handleAutocomplete}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                      disabled={isWriting}
                    >
                      {isWriting ? <RefreshCw className="animate-spin" size={14} /> : <Pen size={14} />} Auto-Complete
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button
                      onClick={() => setShowExportModal(true)}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2"
                    >
                      <DownloadCloud size={14} /> Export
                    </button>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm flex items-center gap-2">
                      <Share2 size={14} /> Share Document
                    </button>
                  </div>
                )}
              </div>

              {/* AI Tools Group - Desktop Only */}
              <div className="hidden md:flex items-center" ref={aiMenuRef}>
                <div className="h-6 w-px bg-slate-200 mx-2"></div>
                <div className="flex items-center space-x-2">
                  <button
                    className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors shadow-sm whitespace-nowrap"
                    onClick={() => setActiveTab("research")}
                  >
                    <Search size={18} />
                    <span>Research</span>
                  </button>
                  <button
                    className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors shadow-sm whitespace-nowrap"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                  >
                    <Sparkles size={18} />
                    <span>Review</span>
                  </button>
                  <button
                    className="flex items-center space-x-2 px-3 md:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-sm whitespace-nowrap"
                    onClick={() => setActiveTab("sections")}
                  >
                    <Layers size={18} />
                    <span>Sections</span>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setIsFocusMode(true)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg hidden md:block"
                title="Focus Mode"
              >
                <Maximize2 size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Focus Mode Header */}
        {isFocusMode && (
          <div className="fixed top-0 left-0 right-0 h-16 flex justify-center items-center z-50 pointer-events-none">
            <div className="pointer-events-auto bg-white/90 backdrop-blur shadow-sm rounded-full px-6 py-2 flex items-center space-x-4 border border-slate-200 mt-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
              <span className="text-sm font-bold text-slate-700">{wordCount} words</span>
              <div className="h-4 w-px bg-slate-300"></div>
              <button
                onClick={() => setIsFocusMode(false)}
                className="text-slate-500 hover:text-red-500 flex items-center space-x-1 text-sm font-medium"
              >
                <Minimize2 size={14} /> <span>Exit Focus</span>
              </button>
            </div>
          </div>
        )}

        {/* Sub-toolbar (Formatting) - Hidden in Focus Mode, and potentially hidden on very small screens or adaptable */}
        {!isFocusMode && (
          <div className="bg-slate-50 border-b border-slate-200 px-4 md:px-6 py-2 flex items-center justify-between overflow-x-auto no-scrollbar gap-4">
            <div className="flex items-center space-x-4 whitespace-nowrap shrink-0">
              <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                {university?.name || "Standard"}: {editorStyle.fontFamily}, {editorStyle.fontSize},{" "}
                {editorStyle.lineHeight === "2.0" ? "Double" : editorStyle.lineHeight === "1.5" ? "1.5" : "Single"}{" "}
                Spacing
              </span>
            </div>

            {/* Pomodoro Timer & Soundscape */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setShowSoundMenu(!showSoundMenu)}
                  className={`flex items-center bg-white border border-slate-200 rounded-md px-2 py-1 space-x-2 hover:bg-slate-50 ${activeSound !== "none" ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "text-slate-500"}`}
                >
                  <Headphones size={14} />
                  <span className="text-xs font-mono font-bold hidden sm:inline">
                    {activeSound === "none" ? "Silence" : activeSound.charAt(0).toUpperCase() + activeSound.slice(1)}
                  </span>
                </button>
                {showSoundMenu && (
                  <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-20">
                    <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Soundscapes
                    </div>
                    <button
                      onClick={() => {
                        setActiveSound("none")
                        setShowSoundMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2"
                    >
                      <Headphones size={14} /> Silence
                    </button>
                    <button
                      onClick={() => {
                        setActiveSound("white")
                        setShowSoundMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2"
                    >
                      <Wind size={14} /> White Noise
                    </button>
                    <button
                      onClick={() => {
                        setActiveSound("rain")
                        setShowSoundMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2"
                    >
                      <CloudRain size={14} /> Heavy Rain
                    </button>
                    <button
                      onClick={() => {
                        setActiveSound("cafe")
                        setShowSoundMenu(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm flex items-center gap-2"
                    >
                      <Coffee size={14} /> Cafe Ambience
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center bg-white border border-slate-200 rounded-md px-2 py-1 space-x-2">
                <Clock size={14} className="text-slate-400" />
                <span className={`text-xs font-mono font-bold ${pomodoroActive ? "text-teal-600" : "text-slate-600"}`}>
                  {formatTime(pomodoroTime)}
                </span>
                <button
                  onClick={() => setPomodoroActive(!pomodoroActive)}
                  className="text-slate-500 hover:text-teal-600"
                >
                  {pomodoroActive ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                </button>
              </div>
            </div>

            {/* Hidden on mobile, actions moved to bottom nav/right sidebar */}
            <div className="hidden md:flex space-x-2 shrink-0">
              <button
                onClick={() => setActiveTab(activeTab === "figures" ? "write" : "figures")}
                className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === "figures" ? "bg-orange-100 text-orange-700" : "text-slate-600 hover:bg-slate-200"}`}
              >
                <PieChart size={14} /> <span>Figures</span>
              </button>
              <button
                onClick={() => setActiveTab(activeTab === "references" ? "write" : "references")}
                className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === "references" ? "bg-purple-100 text-purple-700" : "text-slate-600 hover:bg-slate-200"}`}
              >
                <BookOpen size={14} /> <span>Biblio</span>
              </button>
              <button
                onClick={() => setActiveTab(activeTab === "research" ? "write" : "research")}
                className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === "research" ? "bg-teal-100 text-teal-700" : "text-slate-600 hover:bg-slate-200"}`}
              >
                <Search size={14} /> <span>Research</span>
              </button>
              <button
                onClick={() => setActiveTab(activeTab === "phrases" ? "write" : "phrases")}
                className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === "phrases" ? "bg-blue-100 text-blue-700" : "text-slate-600 hover:bg-slate-200"}`}
              >
                <Quote size={14} /> <span>Phrases</span>
              </button>
              <button
                onClick={() => setActiveTab(activeTab === "history" ? "write" : "history")}
                className={`p-1.5 rounded flex items-center space-x-1 text-xs font-medium ${activeTab === "history" ? "bg-amber-100 text-amber-700" : "text-slate-600 hover:bg-slate-200"}`}
              >
                <History size={14} /> <span>History</span>
              </button>
            </div>
          </div>
        )}

        {/* Typing Area with Relative Container for Cursors */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center scroll-smooth bg-slate-100 relative pb-20 md:pb-8">
          <div className="relative w-full max-w-[21cm]">
            {/* Remote Cursors Overlay */}
            {remoteCursors.map((cursor, idx) => (
              <div
                key={idx}
                className="absolute pointer-events-none transition-all duration-500 ease-in-out z-10"
                style={{ top: cursor.position.top, left: cursor.position.left }}
              >
                <div className="w-0.5 h-5 absolute" style={{ backgroundColor: cursor.color }}></div>
                <div
                  className="absolute top-5 left-0 text-[10px] text-white px-1.5 py-0.5 rounded-br rounded-bl rounded-tr whitespace-nowrap shadow-sm"
                  style={{ backgroundColor: cursor.color }}
                >
                  {cursor.label}
                </div>
              </div>
            ))}

            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onSelect={handleSelect}
              style={editorStyle}
              className={`w-full min-h-[50vh] md:min-h-[29.7cm] bg-white shadow-lg p-4 md:p-[2.54cm] text-slate-900 resize-none focus:outline-none selection:bg-indigo-100 selection:text-indigo-900 transition-all duration-300 ${isFocusMode ? "shadow-2xl scale-100 md:scale-105" : ""}`}
              placeholder="Start typing your thesis chapter here..."
            />
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 h-16 flex items-center justify-around z-50 px-2 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button
            onClick={() => {
              setIsStructureOpen(!isStructureOpen)
              setActiveTab("write")
            }}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${isStructureOpen ? "text-teal-600 bg-teal-50" : "text-slate-500"}`}
          >
            <List size={20} />
            <span className="text-[10px] mt-1 font-medium">Outline</span>
          </button>
          <button
            onClick={() => {
              setIsStructureOpen(false)
              setActiveTab("write")
            }}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${!isStructureOpen && activeTab === "write" ? "text-teal-600 bg-teal-50" : "text-slate-500"}`}
          >
            <Pen size={20} />
            <span className="text-[10px] mt-1 font-medium">Write</span>
          </button>
          <button
            onClick={() => {
              setIsStructureOpen(false)
              setActiveTab("research")
            }}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === "research" ? "text-teal-600 bg-teal-50" : "text-slate-500"}`}
          >
            <Search size={20} />
            <span className="text-[10px] mt-1 font-medium">Research</span>
          </button>
          <button
            onClick={() => {
              setIsStructureOpen(false)
              setActiveTab("review")
            }}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === "review" ? "text-teal-600 bg-teal-50" : "text-slate-500"}`}
          >
            <Sparkles size={20} />
            <span className="text-[10px] mt-1 font-medium">Review</span>
          </button>
          <button
            onClick={() => {
              setIsStructureOpen(false)
              setActiveTab("chat")
            }}
            className={`flex flex-col items-center p-2 rounded-lg transition-colors ${activeTab === "chat" ? "text-teal-600 bg-teal-50" : "text-slate-500"}`}
          >
            <MessageCircle size={20} />
            <span className="text-[10px] mt-1 font-medium">Chat</span>
          </button>
        </div>

        {/* Status Bar - Hidden on mobile if needed, or streamlined */}
        <div className="bg-white border-t border-slate-200 px-4 md:px-6 py-2 flex justify-between items-center text-xs text-slate-500 hidden md:flex">
          <div className="flex items-center space-x-4">
            <span>Words: {wordCount}</span>
            <span className="hidden sm:inline">Reading Time: {Math.ceil(wordCount / 200)} min</span>
            {activeSound !== "none" && (
              <span className="flex items-center gap-1 text-indigo-500 animate-pulse">
                <Headphones size={10} /> Sound Active
              </span>
            )}
          </div>
          <div>
            {thesisDoc.lastModified ? `Saved ${new Date(thesisDoc.lastModified).toLocaleTimeString()}` : "Unsaved"}
          </div>
        </div>
      </div>

      {/* AI Sidebar - Tabbed Interface (Right) - Hidden in Focus Mode */}
      {!isFocusMode && (
        <div
          className={`
          bg-white border-l border-slate-200 shadow-xl transform transition-all duration-300 flex flex-col absolute right-0 top-0 z-20
          ${activeTab !== "write" ? "translate-x-0" : "translate-x-full"}
          w-full md:w-96
          bottom-16 md:bottom-0 
        `}
        >
          {/* Sidebar Header with Tabs */}
          <div className="flex items-center border-b border-slate-200 px-1 overflow-x-auto no-scrollbar">
            {["review", "research", "chat"].map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t as any)}
                className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 capitalize ${activeTab === t ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => setActiveTab("sections")}
              className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 ${activeTab === "sections" ? "border-emerald-600 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              Sections
            </button>
            <button
              onClick={() => setActiveTab("phrases")}
              className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 ${activeTab === "phrases" ? "border-blue-600 text-blue-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              Phrases
            </button>
            <button
              onClick={() => setActiveTab("figures")}
              className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 ${activeTab === "figures" ? "border-orange-600 text-orange-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              Figures
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-3 px-2 text-xs font-medium border-b-2 ${activeTab === "history" ? "border-amber-600 text-amber-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
            >
              History
            </button>

            <button onClick={() => setActiveTab("write")} className="px-3 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>

          {/* Tab Content: Review */}
          {activeTab === "review" && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col bg-slate-50">
              <div className="bg-white p-2 rounded-lg border border-slate-200 mb-4 flex space-x-1">
                <button
                  onClick={() => setReviewMode("suggestions")}
                  className={`flex-1 text-xs py-2 rounded-md font-medium transition-colors ${reviewMode === "suggestions" ? "bg-indigo-100 text-indigo-700" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  Quick Fixes
                </button>
                <button
                  onClick={() => setReviewMode("critique")}
                  className={`flex-1 text-xs py-2 rounded-md font-medium transition-colors flex items-center justify-center space-x-1 ${reviewMode === "critique" ? "bg-teal-100 text-teal-700" : "text-slate-500 hover:bg-slate-100"}`}
                >
                  <BrainCircuit size={14} /> <span>Deep Critique</span>
                </button>
              </div>

              {reviewMode === "suggestions" && (
                <div className="space-y-4">
                  {suggestions.length === 0 && !isAnalyzing && (
                    <div className="text-center text-slate-500 mt-10">
                      <Sparkles className="mx-auto mb-2 text-indigo-300" size={40} />
                      <p className="text-sm">Click "Review" in the toolbar to analyze your writing.</p>
                    </div>
                  )}
                  {isAnalyzing && (
                    <div className="flex flex-col items-center justify-center mt-20 space-y-4">
                      <RefreshCw className="animate-spin text-indigo-600" size={32} />
                      <p className="text-sm text-slate-500">Analyzing document...</p>
                    </div>
                  )}
                  {suggestions.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-lg shadow-sm p-4 hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${item.type === "grammar" ? "bg-red-100 text-red-700" : item.type === "citation" ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-700"}`}
                        >
                          {item.type}
                        </span>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-red-500 line-through bg-red-50 inline px-1">{item.originalText}</p>
                        <div className="my-1 flex justify-center text-slate-300">↓</div>
                        <p className="text-sm text-green-700 font-medium bg-green-50 px-1">{item.suggestion}</p>
                      </div>
                      <p className="text-xs text-slate-600 italic mb-3">"{item.explanation}"</p>
                    </div>
                  ))}
                </div>
              )}

              {reviewMode === "critique" && (
                <div className="flex-1 flex flex-col">
                  {!critiqueText && !isCritiquing && (
                    <div className="text-center text-slate-500 mt-10 p-4">
                      <BrainCircuit className="mx-auto mb-3 text-teal-300" size={40} />
                      <h3 className="text-slate-800 font-bold mb-2">Deep Thinking Mode</h3>
                      <p className="text-sm mb-4">
                        Uses advanced reasoning to critique your logic, flow, and argumentation. Takes ~30s.
                      </p>
                      <button
                        onClick={handleDeepCritique}
                        className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
                      >
                        Generate Critique
                      </button>
                    </div>
                  )}
                  {isCritiquing && (
                    <div className="flex flex-col items-center justify-center mt-20 space-y-4">
                      <BrainCircuit className="animate-pulse text-teal-600" size={40} />
                      <p className="text-sm text-slate-500">Thinking deeply about your thesis...</p>
                    </div>
                  )}
                  {critiqueText && (
                    <div className="bg-white p-4 rounded-lg border border-teal-100 shadow-sm overflow-y-auto">
                      <div className="prose prose-sm prose-teal">
                        <h4 className="text-teal-800 font-bold mb-2 flex items-center gap-2">
                          <Bot size={16} /> Supervisor's Critique
                        </h4>
                        <div className="text-slate-700 text-sm">{renderCritique(critiqueText)}</div>
                      </div>
                      <button
                        onClick={handleDeepCritique}
                        className="mt-4 text-xs text-teal-600 underline text-center w-full"
                      >
                        Regenerate
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Research */}
          {activeTab === "research" && (
            <div className="flex-1 flex flex-col bg-slate-50">
              <div className="p-4 bg-white border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-2">Academic Research</h3>
                <div className="relative">
                  <input
                    className="w-full bg-slate-100 border-none rounded-lg pl-3 pr-10 py-2 text-sm focus:ring-2 focus:ring-teal-500"
                    placeholder="Search topic..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleResearch()}
                  />
                  <button
                    onClick={handleResearch}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-teal-600"
                    disabled={isSearching}
                  >
                    {isSearching ? <RefreshCw className="animate-spin" size={16} /> : <Search size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {researchResults && (
                  <>
                    <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                      <h4 className="font-bold text-slate-800 text-sm mb-2 flex items-center justify-between gap-2">
                        <span className="flex items-center gap-2">
                          <Sparkles size={14} className="text-teal-500" /> AI Summary
                        </span>
                        <button
                          onClick={() => handleInsertResearchSummary(researchResults.content)}
                          className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 font-medium p-1 hover:bg-teal-50 rounded"
                          title="Insert summary into document"
                        >
                          <ArrowDown size={12} /> Insert
                        </button>
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{researchResults.content}</p>
                    </div>

                    {researchResults.links.length > 0 && (
                      <div>
                        <h4 className="font-bold text-slate-700 text-xs uppercase tracking-wider mb-2 mt-2">Sources</h4>
                        <div className="space-y-2">
                          {researchResults.links.map((link, i) => (
                            <div
                              key={i}
                              className="block bg-white p-3 rounded-lg border border-slate-200 hover:border-teal-400 hover:shadow-sm transition-all group"
                            >
                              <a href={link.uri} target="_blank" rel="noreferrer">
                                <div className="flex items-start justify-between">
                                  <span className="text-sm font-medium text-teal-700 group-hover:underline line-clamp-2">
                                    {link.title}
                                  </span>
                                  <ExternalLink size={12} className="text-slate-400 flex-shrink-0 mt-1" />
                                </div>
                                <span className="text-xs text-slate-400 mt-1 block truncate mb-2">{link.uri}</span>
                              </a>
                              <div className="flex justify-end pt-2 border-t border-slate-100">
                                <button
                                  onClick={() => {
                                    setRefInput(link.uri) // Pre-fill ref manager input
                                    setActiveTab("references")
                                  }}
                                  className="text-[10px] font-bold text-slate-500 hover:text-teal-600 flex items-center gap-1"
                                >
                                  <Plus size={10} /> Add to References
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {!researchResults && !isSearching && (
                  <div className="text-center text-slate-400 mt-10 p-4">
                    <Search className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">Enter a topic to search academic sources.</p>
                  </div>
                )}
                {isSearching && (
                  <div className="flex flex-col items-center justify-center mt-10 space-y-4">
                    <RefreshCw className="animate-spin text-teal-600" size={32} />
                    <p className="text-sm text-slate-500">Searching academic databases...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Chat */}
          {activeTab === "chat" && (
            <div className="flex-1 flex flex-col bg-slate-50">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.role === "user" ? "bg-indigo-600 text-white rounded-br-none" : "bg-white border border-slate-200 text-slate-700 rounded-bl-none"}`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm rounded-bl-none">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChat()}
                    placeholder="Ask your AI supervisor..."
                    className="flex-1 bg-slate-100 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={handleChat}
                    disabled={isChatting || !chatInput.trim()}
                    className="bg-indigo-600 text-white px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Thesaurus */}
          {activeTab === "thesaurus" && (
            <div className="flex-1 flex flex-col bg-slate-50 p-4">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Thesaurus</h3>
              {selectedWord ? (
                <div>
                  <p className="text-slate-600 text-sm mb-3">
                    Synonyms for: <span className="font-bold text-slate-800">"{selectedWord}"</span>
                  </p>
                  {isLoadingSynonyms ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="animate-spin text-slate-400" size={24} />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {synonyms.map((syn, i) => (
                        <button
                          key={i}
                          onClick={() => {
                            if (selectionRange) {
                              const newContent =
                                content.substring(0, selectionRange.start) + syn + content.substring(selectionRange.end)
                              setContent(newContent)
                            }
                          }}
                          className="px-3 py-1.5 bg-white border border-slate-200 rounded-full text-sm text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                        >
                          {syn}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 text-sm italic">
                  Select a word in the editor, then click the synonyms button to find alternatives.
                </p>
              )}
            </div>
          )}

          {/* Tab Content: History */}
          {activeTab === "history" && (
            <div className="flex-1 flex flex-col bg-slate-50">
              <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-700">Version History</h3>
                <button
                  onClick={() => handleSaveVersion("Manual Snapshot")}
                  className="text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700"
                >
                  Save Snapshot
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {versions.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm mt-10 italic">No saved versions yet.</p>
                ) : (
                  versions.map((v) => (
                    <div key={v.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">{v.description}</span>
                        <span className="text-[10px] text-slate-400">{new Date(v.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-slate-500 mb-2">{v.wordCount} words</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRestoreVersion(v)}
                          className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                        >
                          <RotateCcw size={12} /> Restore
                        </button>
                        <button
                          onClick={() => handleDeleteVersion(v.id)}
                          className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Phrases */}
          {activeTab === "phrases" && (
            <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
              <div className="p-4 bg-white border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-700">Academic Phrase Bank</h3>
                <p className="text-xs text-slate-500 mt-1">Click to insert phrases into your document</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {Object.entries(PHRASE_BANK).map(([section, phrases]) => (
                  <div key={section}>
                    <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">{section}</h4>
                    <div className="space-y-1">
                      {phrases.map((phrase, i) => (
                        <button
                          key={i}
                          onClick={() =>
                            setContent((prev) => prev + (prev.endsWith(" ") || prev.endsWith("\n") ? "" : " ") + phrase)
                          }
                          className="w-full text-left px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 transition-colors"
                        >
                          {phrase}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content: Sections Generator */}
          {activeTab === "sections" && (
            <div className="flex-1 flex flex-col bg-slate-50">
              <div className="p-4 bg-white border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-2">AI Section Generator</h3>
                <button
                  onClick={handleGenerateSmartOutline} // Changed to use the AI outline generation
                  disabled={isGeneratingOutline}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGeneratingOutline ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  Generate Outline
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {outline.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center mt-8">
                    Outline the document first to enable section generation.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {outline.map((section) => (
                      <div
                        key={section.id}
                        className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-emerald-300 transition-all"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`text-sm font-bold text-slate-800 ${section.level === 1 ? "" : "ml-4"}`}>
                            {section.text}
                          </h4>
                          <button
                            onClick={() => scrollToSection(section.index)}
                            className="text-slate-400 hover:text-emerald-600"
                          >
                            <ArrowRight size={14} />
                          </button>
                        </div>
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleGenerateSectionContent(section)}
                            disabled={generatingSectionId === section.id}
                            className="flex-1 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded text-xs font-medium hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors flex items-center justify-center space-x-1"
                          >
                            {generatingSectionId === section.id ? (
                              <RefreshCw className="animate-spin" size={12} />
                            ) : (
                              <Pen size={12} />
                            )}
                            <span>Draft Content</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: Figures (Generative UI) */}
          {activeTab === "figures" && (
            <div className="flex-1 flex flex-col bg-slate-50">
              <div className="p-4 bg-white border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-2">AI Chart Generator</h3>
                <textarea
                  className="w-full bg-slate-100 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-orange-500 resize-none"
                  rows={3}
                  placeholder="Describe a chart e.g., 'Bar chart of Kenya's Coffee Exports 2018-2022: 45k, 48k, 52k, 50k, 55k tons'"
                  value={figurePrompt}
                  onChange={(e) => setFigurePrompt(e.target.value)}
                />
                <button
                  onClick={handleGenerateFigure}
                  disabled={isGeneratingFigure}
                  className="w-full mt-2 bg-orange-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isGeneratingFigure ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  <span>Generate Figure</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {figures.map((fig) => (
                  <div key={fig.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="font-bold text-slate-800 mb-1 text-center text-sm">{fig.title}</h4>
                    <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        {renderChart(fig) as any}
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-slate-500 italic mt-2 text-center">{fig.description}</p>
                    <div className="mt-3 flex justify-end space-x-2">
                      <button
                        onClick={() => setFigures((prev) => prev.filter((f) => f.id !== fig.id))}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                      <button className="p-1.5 text-slate-500 hover:bg-slate-100 rounded" title="Copy Data">
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                {figures.length === 0 && !isGeneratingFigure && (
                  <p className="text-center text-slate-400 text-sm mt-10 italic">
                    No figures yet. Describe data to visualize it.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab Content: References (Bibliography Manager) */}
          {activeTab === "references" && (
            <div className="flex-1 flex flex-col bg-slate-50">
              <div className="p-4 bg-white border-b border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-2">Reference Manager</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    className="flex-1 bg-slate-100 border-none rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                    placeholder="Paste DOI, URL or title..."
                    value={refInput}
                    onChange={(e) => setRefInput(e.target.value)}
                  />
                  <button
                    onClick={handleAddReference}
                    disabled={isParsingRef}
                    className="bg-purple-600 text-white px-3 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {references.length === 0 ? (
                  <div className="text-center text-slate-400 mt-10 p-4">
                    <BookOpen className="mx-auto mb-2 opacity-50" size={32} />
                    <p className="text-sm">Add references to generate bibliography.</p>
                    <button
                      onClick={() => setShowLibraryPicker(true)}
                      className="mt-4 text-xs font-bold text-purple-600 hover:text-purple-800"
                    >
                      + Select from Library
                    </button>
                  </div>
                ) : (
                  references.map((ref) => (
                    <div
                      key={ref.id}
                      className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:border-purple-300 transition-all text-xs"
                    >
                      <p className="text-slate-800 font-medium mb-1">{ref.formatted}</p>
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(ref.formatted)
                            alert("Copied")
                          }}
                          className="text-slate-400 hover:text-purple-600"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          onClick={() => setReferences((prev) => prev.filter((r) => r.id !== ref.id))}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {citationModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Generate Citation</h3>
              <button onClick={() => setCitationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Author(s)"
                value={citationFields.author}
                onChange={(e) => setCitationFields({ ...citationFields, author: e.target.value })}
                className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Year"
                value={citationFields.year}
                onChange={(e) => setCitationFields({ ...citationFields, year: e.target.value })}
                className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Title"
                value={citationFields.title}
                onChange={(e) => setCitationFields({ ...citationFields, title: e.target.value })}
                className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                placeholder="Source/Journal"
                value={citationFields.source}
                onChange={(e) => setCitationFields({ ...citationFields, source: e.target.value })}
                className="w-full bg-slate-100 rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleGenerateCitation}
                disabled={isGeneratingCitation}
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isGeneratingCitation ? "Generating..." : "Generate"}
              </button>
              {citationResult && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-700 mb-2">{citationResult}</p>
                  <button
                    onClick={insertCitation}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                  >
                    Insert into document
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Export Document</h3>
              <button onClick={() => setShowExportModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-2">
              <button
                onClick={() => {
                  const blob = new Blob([content], { type: "text/plain" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `${thesisDoc.title}.txt`
                  a.click()
                  setShowExportModal(false)
                }}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 text-left"
              >
                <FileText size={20} className="text-slate-500" />
                <div>
                  <p className="font-medium text-slate-800 text-sm">Plain Text (.txt)</p>
                  <p className="text-xs text-slate-500">Simple text format</p>
                </div>
              </button>
              <button
                onClick={() => {
                  const blob = new Blob([content], { type: "text/markdown" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `${thesisDoc.title}.md`
                  a.click()
                  setShowExportModal(false)
                }}
                className="w-full flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 text-left"
              >
                <FileCode size={20} className="text-slate-500" />
                <div>
                  <p className="font-medium text-slate-800 text-sm">Markdown (.md)</p>
                  <p className="text-xs text-slate-500">For further editing</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {showLibraryPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">Select from Library</h3>
              <button onClick={() => setShowLibraryPicker(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {libraryItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    const newRef: Reference = {
                      id: Date.now().toString(),
                      raw: item.raw,
                      author: item.author,
                      year: item.year,
                      title: item.title,
                      source: item.source,
                      formatted: item.formatted,
                    }
                    setReferences((prev) => [...prev, newRef])
                    setShowLibraryPicker(false)
                  }}
                  className="w-full text-left p-3 bg-slate-50 rounded-lg hover:bg-purple-50 hover:border-purple-300 border border-transparent transition-colors"
                >
                  <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {item.author} ({item.year})
                  </p>
                </button>
              ))}
              {libraryItems.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-8">Your library is empty.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Editor
