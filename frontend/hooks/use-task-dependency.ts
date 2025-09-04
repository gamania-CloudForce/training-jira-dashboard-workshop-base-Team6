"use client"

import { useState, useEffect, useCallback } from 'react'

// 型別定義
export interface TaskInfo {
  key: string
  summary: string
  status: string
  assignee?: string | null
  parent?: string | null
  issue_type?: string | null
  story_points?: number | null
  priority?: string | null
}

export interface TaskDependencyResponse {
  task: TaskInfo
  dependencies: TaskInfo[]
  dependents: TaskInfo[]
  has_dependencies: boolean
}

interface UseTaskDependencyOptions {
  taskKey?: string | null
}

interface UseTaskDependencyReturn {
  dependencyData: TaskDependencyResponse | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export const useTaskDependency = ({ taskKey }: UseTaskDependencyOptions): UseTaskDependencyReturn => {
  const [dependencyData, setDependencyData] = useState<TaskDependencyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDependencyData = useCallback(async (key: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/task/${encodeURIComponent(key)}/dependencies`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`任務 "${key}" 不存在`)
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data: TaskDependencyResponse = await response.json()
      setDependencyData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入任務依賴關係時發生未知錯誤'
      setError(errorMessage)
      setDependencyData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const refetch = useCallback(() => {
    if (taskKey) {
      fetchDependencyData(taskKey)
    }
  }, [taskKey, fetchDependencyData])

  useEffect(() => {
    if (taskKey && taskKey.trim() !== '') {
      fetchDependencyData(taskKey)
    } else {
      setDependencyData(null)
      setError(null)
      setLoading(false)
    }
  }, [taskKey, fetchDependencyData])

  return {
    dependencyData,
    loading,
    error,
    refetch
  }
}
