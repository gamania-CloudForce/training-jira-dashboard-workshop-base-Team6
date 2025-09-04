import { renderHook, waitFor } from '@testing-library/react'
import { useSprintBurndown } from '@/hooks/use-sprint-burndown'

// Mock fetch globally
const mockFetch = jest.fn()
global.fetch = mockFetch

// Mock data
const mockBurndownResponse = {
  sprint_data: {
    sprint_name: 'Test Sprint',
    total_story_points: 20.0,
    completed_story_points: 13.0,
    remaining_story_points: 7.0,
    completion_rate: 65.0,
    status: 'normal',
    total_working_days: 10,
    days_elapsed: 7,
    remaining_working_days: 3,
  },
  daily_progress: [
    { day: 1, date: '2025-01-01', ideal_remaining: 18, actual_remaining: 18, is_working_day: true },
    { day: 2, date: '2025-01-02', ideal_remaining: 16, actual_remaining: 15, is_working_day: true },
  ],
  chart_data: [
    { day: 1, date: '2025-01-01', ideal: 18, actual: 18 },
    { day: 2, date: '2025-01-02', ideal: 16, actual: 15 },
  ],
}

const mockSprintInfo = {
  sprint_name: 'Test Sprint',
  sprint_id: 123,
  board_name: 'Test Board',
  state: 'active',
  start_date: '2025-01-01',
  end_date: '2025-01-15',
  complete_date: null,
  goal: 'Test Sprint Goal',
}

describe('useSprintBurndown', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('returns initial state correctly', () => {
    const { result } = renderHook(() => useSprintBurndown())
    
    expect(result.current.burndownData).toBeNull()
    expect(result.current.sprintInfo).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('does not fetch data when no sprint name is provided', () => {
    renderHook(() => useSprintBurndown())
    
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('does not fetch data when sprint name is "All"', () => {
    renderHook(() => useSprintBurndown({ sprintName: 'All' }))
    
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('fetches data successfully for valid sprint', async () => {
    // Mock successful API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBurndownResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSprintInfo,
      })

    const { result } = renderHook(() => useSprintBurndown({ sprintName: 'Test Sprint' }))

    // Should start loading
    expect(result.current.loading).toBe(true)

    // Wait for data to be fetched
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Verify data is set correctly
    expect(result.current.burndownData).toEqual(mockBurndownResponse)
    expect(result.current.sprintInfo).toEqual(mockSprintInfo)
    expect(result.current.error).toBeNull()

    // Verify correct API calls
    expect(mockFetch).toHaveBeenCalledTimes(2)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8001/api/sprint/burndown/Test%20Sprint'
    )
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:8001/api/sprint/info/Test%20Sprint'
    )
  })

  it('handles burndown API error correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const { result } = renderHook(() => useSprintBurndown({ sprintName: 'Nonexistent Sprint' }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.burndownData).toBeNull()
    expect(result.current.sprintInfo).toBeNull()
    expect(result.current.error).toBe('Sprint "Nonexistent Sprint" not found')
  })

  it('handles 404 error with correct message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })

    const { result } = renderHook(() => useSprintBurndown({ sprintName: 'Missing Sprint' }))

    await waitFor(() => {
      expect(result.current.error).toBe('Sprint "Missing Sprint" not found')
    })
  })

  it('handles general API error correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useSprintBurndown({ sprintName: 'Test Sprint' }))

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch sprint burndown data')
    })
  })

  it('handles network error correctly', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useSprintBurndown({ sprintName: 'Test Sprint' }))

    await waitFor(() => {
      expect(result.current.error).toBe('Network error')
    })
  })

  it('continues if sprint info API fails', async () => {
    // Mock successful burndown but failed sprint info
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBurndownResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
      })

    const { result } = renderHook(() => useSprintBurndown({ sprintName: 'Test Sprint' }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should have burndown data but no sprint info
    expect(result.current.burndownData).toEqual(mockBurndownResponse)
    expect(result.current.sprintInfo).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('URL encodes sprint names correctly', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBurndownResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSprintInfo,
      })

    renderHook(() => useSprintBurndown({ sprintName: 'Sprint With Spaces' }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8001/api/sprint/burndown/Sprint%20With%20Spaces'
      )
    })
  })

  it('refetches data when sprint name changes', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockBurndownResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSprintInfo,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockBurndownResponse, sprint_data: { ...mockBurndownResponse.sprint_data, sprint_name: 'New Sprint' } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ ...mockSprintInfo, sprint_name: 'New Sprint' }),
      })

    const { result, rerender } = renderHook(
      ({ sprintName }) => useSprintBurndown({ sprintName }),
      { initialProps: { sprintName: 'Test Sprint' } }
    )

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledTimes(2)

    // Change sprint name
    rerender({ sprintName: 'New Sprint' })

    // Wait for new fetch
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockFetch).toHaveBeenCalledTimes(4)
    expect(result.current.burndownData?.sprint_data.sprint_name).toBe('New Sprint')
  })

  it('clears data when sprint name becomes undefined', () => {
    const { result, rerender } = renderHook(
      ({ sprintName }) => useSprintBurndown({ sprintName }),
      { initialProps: { sprintName: 'Test Sprint' as string | undefined } }
    )

    // Change to undefined
    rerender({ sprintName: undefined })

    expect(result.current.burndownData).toBeNull()
    expect(result.current.sprintInfo).toBeNull()
    expect(result.current.loading).toBe(false)
  })
})
