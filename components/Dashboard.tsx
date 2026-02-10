"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { FileText, Plus, Bell, RefreshCw, ExternalLink, ShieldAlert, Target, Trophy, Edit2 } from "lucide-react"
import type { Document, UniversityUpdate } from "../types"
import { GeminiService } from "../services/geminiService"
import { useUser } from "../contexts/UserContext"

interface DashboardProps {
  documents: Document[]
  onOpenDocument: (doc: Document) => void
}

const data = [
  { name: "Mon", hours: 2 },
  { name: "Tue", hours: 4 },
  { name: "Wed", hours: 3 },
  { name: "Thu", hours: 5 },
  { name: "Fri", hours: 2 },
  { name: "Sat", hours: 6 },
  { name: "Sun", hours: 4 },
]

const UNI_ID_TO_NAME: Record<string, string> = {
  uon: "University of Nairobi",
  ku: "Kenyatta University",
  strath: "Strathmore University",
  jkuat: "JKUAT",
}

export const Dashboard: React.FC<DashboardProps> = ({ documents, onOpenDocument }) => {
  const { user, updateUser } = useUser()

  const [updates, setUpdates] = useState<UniversityUpdate[]>([
    {
      id: "1",
      universityId: "uon",
      universityName: "University of Nairobi",
      date: new Date("2023-10-01"),
      title: "Formatting Guideline Update",
      description: "The Graduate School has updated the margin requirements to 2.5cm on all sides for 2024 theses.",
      type: "formatting",
    },
    {
      id: "2",
      universityId: "ku",
      universityName: "Kenyatta University",
      date: new Date("2023-09-15"),
      title: "Digital Submission Portal",
      description: "All final thesis submissions must now be done via the new tracking system by Nov 30th.",
      type: "policy",
    },
  ])
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<Date | null>(null)
  const [isEditingGoal, setIsEditingGoal] = useState(false)

  const [localGoal, setLocalGoal] = useState(user?.dailyGoal || 500)

  useEffect(() => {
    if (user) {
      setLocalGoal(user.dailyGoal)
    }
  }, [user]) // Updated to use the entire user object

  const handleScanUpdates = async () => {
    setIsScanning(true)

    const userUniIds = new Set(documents.map((d) => d.universityId))
    let universitiesToCheck = Array.from(userUniIds)
      .map((id) => UNI_ID_TO_NAME[id as string])
      .filter(Boolean)

    if (universitiesToCheck.length === 0) {
      universitiesToCheck = ["University of Nairobi", "Kenyatta University"]
    }

    universitiesToCheck = Array.from(new Set(universitiesToCheck))
    const newUpdates: UniversityUpdate[] = []

    try {
      for (const uni of universitiesToCheck) {
        const results = await GeminiService.checkUniversityUpdates(uni)
        newUpdates.push(...results)
      }

      setUpdates((prev) => {
        const combined = [...newUpdates, ...prev]
        const unique = combined.filter(
          (update, index, self) =>
            index === self.findIndex((u) => u.title === update.title && u.universityId === update.universityId),
        )
        return unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      })
      setLastScanned(new Date())
    } catch (err) {
      console.error("Scan failed", err)
    } finally {
      setIsScanning(false)
    }
  }

  const dailyGoal = user?.dailyGoal || 500
  const todayWords = user?.todayWords || 0
  const goalPercentage = Math.min(100, Math.round((todayWords / dailyGoal) * 100))
  const userName = user?.name?.split(" ")[0] || "Scholar"

  const completedDocs = documents.filter((d) => d.status === "Completed").length
  const inProgressDocs = documents.filter((d) => d.status !== "Completed").length
  const avgProgress =
    documents.length > 0 ? Math.round(documents.reduce((acc, doc) => acc + doc.progress, 0) / documents.length) : 0

  const handleGoalSave = () => {
    updateUser({ dailyGoal: localGoal })
    setIsEditingGoal(false)
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 font-serif">Welcome back, {userName}</h1>
          <p className="text-slate-500 mt-1 md:mt-2 text-sm md:text-base">
            You have {inProgressDocs} active thesis documents.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-4 w-full lg:w-auto min-w-[300px]">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-slate-100"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={175.9}
                strokeDashoffset={175.9 - (175.9 * goalPercentage) / 100}
                className={`${goalPercentage >= 100 ? "text-green-500" : "text-teal-500"} transition-all duration-1000 ease-out`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              {goalPercentage >= 100 ? (
                <Trophy size={20} className="text-green-500" />
              ) : (
                <Target size={20} className="text-teal-600" />
              )}
            </div>
          </div>

          <div className="flex-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Goal</span>
              <button onClick={() => setIsEditingGoal(!isEditingGoal)} className="text-slate-400 hover:text-teal-600">
                <Edit2 size={12} />
              </button>
            </div>
            {isEditingGoal ? (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  className="w-20 px-2 py-0.5 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-teal-500 outline-none"
                  value={localGoal}
                  onChange={(e) => setLocalGoal(Number(e.target.value))}
                  onBlur={handleGoalSave}
                  onKeyDown={(e) => e.key === "Enter" && handleGoalSave()}
                  autoFocus
                />
                <span className="text-xs text-slate-500">words</span>
              </div>
            ) : (
              <div>
                <span className="text-xl font-bold text-slate-800">{todayWords}</span>
                <span className="text-sm text-slate-500"> / {dailyGoal} words</span>
              </div>
            )}
          </div>

          <button className="bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-lg flex items-center justify-center transition-colors shadow-sm">
            <Plus size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Writing Activity</h3>
            <div className="h-56 md:h-64">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                    cursor={{ fill: "#f1f5f9" }}
                  />
                  <Bar dataKey="hours" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-800">Recent Documents</h3>
              <button className="text-sm text-teal-600 hover:text-teal-700 font-medium">View All</button>
            </div>
            <div className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-sm text-slate-500 italic">No documents yet. Start writing!</p>
              ) : (
                documents.slice(0, 4).map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => onOpenDocument(doc)}
                    className="group p-3 rounded-lg border border-slate-100 hover:border-teal-200 hover:bg-teal-50 cursor-pointer transition-all flex items-start space-x-3"
                  >
                    <FileText className="text-slate-400 group-hover:text-teal-500 mt-1 shrink-0" size={20} />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 group-hover:text-teal-700 text-sm truncate">
                        {doc.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1">
                        {doc.progress}% Complete • {doc.lastModified.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full relative overflow-hidden min-h-[400px]">
          {isScanning && <div className="absolute top-0 left-0 right-0 h-1 bg-teal-500 animate-pulse z-10"></div>}

          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Bell size={18} className="text-teal-600" /> University Updates
              </h3>
              {lastScanned && (
                <p className="text-[10px] text-slate-400 mt-1">Live Check: {lastScanned.toLocaleTimeString()}</p>
              )}
            </div>
            <button
              onClick={handleScanUpdates}
              disabled={isScanning}
              className={`p-2 rounded-full transition-all ${isScanning ? "bg-teal-50 text-teal-600" : "text-slate-500 hover:text-teal-600 hover:bg-teal-50"}`}
              title="Scan for latest updates"
            >
              <RefreshCw size={16} className={isScanning ? "animate-spin" : ""} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-4">
            {isScanning && updates.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 space-y-2">
                <RefreshCw className="animate-spin" size={24} />
                <span className="text-xs">Connecting to University Portals...</span>
              </div>
            )}

            {!isScanning && updates.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 space-y-2">
                <ShieldAlert size={24} />
                <span className="text-xs">No updates found. You're up to date!</span>
              </div>
            )}

            {updates.map((update) => (
              <div
                key={update.id}
                className="p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-teal-200 transition-colors group"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-100 truncate max-w-[100px]">
                    {update.universityName}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      update.type === "deadline"
                        ? "bg-red-100 text-red-600"
                        : update.type === "formatting"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-teal-100 text-teal-600"
                    }`}
                  >
                    {update.type}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 text-sm mb-1 group-hover:text-teal-700 transition-colors">
                  {update.title}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">{update.description}</p>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200/50">
                  <span className="text-[10px] text-slate-400">
                    Detected: {new Date(update.date).toLocaleDateString()}
                  </span>
                  {update.sourceUrl && (
                    <a
                      href={update.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center text-[10px] text-teal-600 hover:underline font-medium"
                    >
                      Verify Source <ExternalLink size={10} className="ml-1" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button className="w-full py-2 text-xs font-medium text-slate-500 hover:text-slate-800 border border-dashed border-slate-300 rounded hover:bg-slate-50 transition-colors">
              View Compliance History
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
