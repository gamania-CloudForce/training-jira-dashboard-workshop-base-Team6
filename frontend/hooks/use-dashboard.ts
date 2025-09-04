import { useState, useEffect, useCallback } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

export interface DashboardStats {
  total_issues: number
  total_story_points: number
  done_issues: number
  done_story_points: number
  last_updated: string
}

export interface StatusDistributionItem {
  status: string
  count: number
  percentage: number
}

export interface StatusDistribution {
  distribution: StatusDistributionItem[]
  total_count: number
  last_updated: string
}

export interface UseDashboardParams {
  sprint?: string
  assignee?: string
}

export function useDashboard(params: UseDashboardParams = {}) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution | null>(null)
  const [sprintOptions, setSprintOptions] = useState<string[]>([])
  const [assigneeOptions, setAssigneeOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { sprint, assignee } = params

  // Fetch sprint options
  const fetchSprintOptions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/table/sprints`)
      if (!response.ok) throw new Error('Failed to fetch sprint options')
      const data = await response.json()
      setSprintOptions(data.sprints || [])
    } catch (err) {
      console.error('Error fetching sprint options:', err)
    }
  }, [])

  // Fetch assignee options
  const fetchAssigneeOptions = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/table/assignees`)
      if (!response.ok) throw new Error('Failed to fetch assignee options')
      const data = await response.json()
      setAssigneeOptions(data.assignees || [])
    } catch (err) {
      console.error('Error fetching assignee options:', err)
    }
  }, [])

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams()
      if (sprint) {
        queryParams.append('sprint', sprint)
      }
      if (assignee) {
        queryParams.append('assignee', assignee)
      }

      const queryString = queryParams.toString()
      const url = `${API_BASE_URL}/api/dashboard/stats${queryString ? `?${queryString}` : ''}`
      console.log('Fetching stats from:', url)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText}`)
      }

      const data: DashboardStats = await response.json()
      setStats(data)
    } catch (err) {
      console.error('Error fetching stats:', err)
      throw err
    }
  }, [sprint, assignee])

  // Fetch status distribution
  const fetchStatusDistribution = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams()
      if (sprint) {
        queryParams.append('sprint', sprint)
      }
      if (assignee) {
        queryParams.append('assignee', assignee)
      }

      const queryString = queryParams.toString()
      const url = `${API_BASE_URL}/api/dashboard/status-distribution${queryString ? `?${queryString}` : ''}`
      console.log('Fetching status distribution from:', url)
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch status distribution: ${response.status} ${response.statusText}`)
      }

      const data: StatusDistribution = await response.json()
      setStatusDistribution(data)
    } catch (err) {
      console.error('Error fetching status distribution:', err)
      throw err
    }
  }, [sprint, assignee])

  // Fetch all dashboard data
  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        fetchStats(),
        fetchStatusDistribution()
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [fetchStats, fetchStatusDistribution])

  // Initial load
  useEffect(() => {
    fetchSprintOptions()
    fetchAssigneeOptions()
  }, [fetchSprintOptions, fetchAssigneeOptions])

  // Fetch data when params change
  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const refetch = () => {
    fetchDashboardData()
  }

  return {
    stats,
    statusDistribution,
    sprintOptions,
    assigneeOptions,
    loading,
    error,
    refetch
  }
}