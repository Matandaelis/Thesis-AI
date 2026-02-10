"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User } from "../types"

interface UserContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  updateUser: (updates: Partial<User>) => void
  updateDailyWords: (words: number) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

// Default user for demo - in production this would come from auth
const DEFAULT_USER: User = {
  id: "user_1",
  name: "Edwin Ochieng",
  email: "edwin@uon.ac.ke",
  university: "University of Nairobi",
  avatarUrl: "https://i.pravatar.cc/150?img=11",
  plan: "pro",
  degreeLevel: "masters",
  dailyGoal: 500,
  todayWords: 320,
  joinedDate: new Date("2023-06-15"),
  isOnline: true,
}

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Simulate auth check on mount
  useEffect(() => {
    const initAuth = async () => {
      // In production: check session/token
      await new Promise((resolve) => setTimeout(resolve, 500))
      setUser(DEFAULT_USER)
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // In production: validate credentials against backend
      if (email && password) {
        setUser({
          ...DEFAULT_USER,
          email,
          name: email
            .split("@")[0]
            .replace(/[._]/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase()),
        })
        return true
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
  }

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates })
    }
  }

  const updateDailyWords = (words: number) => {
    if (user) {
      setUser({ ...user, todayWords: user.todayWords + words })
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        updateUser,
        updateDailyWords,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export const useUser = (): UserContextType => {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
