'use client'

import { useCallback, useEffect, useState } from 'react'

const SIDEBAR_STORAGE_KEY = 'admin-sidebar-collapsed'
const SIDEBAR_CHANGE_EVENT = 'admin-sidebar-collapsed-change'

function parseCollapsedState(value: string | null) {
  if (value === null) return false

  try {
    return JSON.parse(value) === true
  } catch {
    return false
  }
}

function readCollapsedState() {
  if (typeof window === 'undefined') return false
  return parseCollapsedState(window.localStorage.getItem(SIDEBAR_STORAGE_KEY))
}

export function useAdminSidebarCollapsed() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readCollapsedState)

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === SIDEBAR_STORAGE_KEY) {
        setIsSidebarCollapsed(parseCollapsedState(event.newValue))
      }
    }

    const handleLocalChange = () => {
      setIsSidebarCollapsed(readCollapsedState())
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener(SIDEBAR_CHANGE_EVENT, handleLocalChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener(SIDEBAR_CHANGE_EVENT, handleLocalChange)
    }
  }, [])

  const setCollapsed = useCallback((value: boolean) => {
    setIsSidebarCollapsed(value)
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(value))
    window.dispatchEvent(new Event(SIDEBAR_CHANGE_EVENT))
  }, [])

  return [isSidebarCollapsed, setCollapsed] as const
}
