import { renderHook, waitFor } from '@testing-library/react'
import { useTaskDependency } from '@/hooks/use-task-dependency'

// Mock fetch
global.fetch = jest.fn()

describe('useTaskDependency', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8001'
  })

  it('should fetch dependency data successfully', async () => {
    const mockResponse = {
      task: {
        key: 'TEST-123',
        summary: 'Test Task',
        status: 'In Progress',
        assignee: 'John Doe',
        priority: 'High'
      },
      dependencies: [
        {
          key: 'TEST-100',
          summary: 'Dependency Task',
          status: 'Done',
          assignee: 'Jane Smith',
          priority: 'Medium'
        }
      ],
      dependents: [],
      has_dependencies: true
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const { result } = renderHook(() => useTaskDependency({ taskKey: 'TEST-123' }))

    // Initially loading
    expect(result.current.loading).toBe(true)
    expect(result.current.dependencyData).toBeNull()
    expect(result.current.error).toBeNull()

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.dependencyData).toEqual(mockResponse)
    expect(result.current.error).toBeNull()
    expect(fetch).toHaveBeenCalledWith('/api/task/TEST-123/dependencies')
  })

  it('should handle fetch error', async () => {
    ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useTaskDependency({ taskKey: 'TEST-123' }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.dependencyData).toBeNull()
    expect(result.current.error).toBe('Network error')
  })

  it('should handle HTTP error response', async () => {
    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    })

    const { result } = renderHook(() => useTaskDependency({ taskKey: 'TEST-123' }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.dependencyData).toBeNull()
    expect(result.current.error).toBe('Failed to fetch dependency data: 404 Not Found')
  })

  it('should refetch data when refetch is called', async () => {
    const mockResponse = {
      task: {
        key: 'TEST-123',
        summary: 'Test Task',
        status: 'In Progress',
        assignee: 'John Doe',
        priority: 'High'
      },
      dependencies: [],
      dependents: [],
      has_dependencies: false
    }

    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    const { result } = renderHook(() => useTaskDependency({ taskKey: 'TEST-123' }))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Clear previous calls
    ;(fetch as jest.Mock).mockClear()

    // Trigger refetch
    result.current.refetch()

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    expect(fetch).toHaveBeenCalledWith('http://localhost:8001/api/task/TEST-123/dependencies')
  })

  it('should not fetch if taskKey is empty', () => {
    renderHook(() => useTaskDependency({ taskKey: '' }))

    expect(fetch).not.toHaveBeenCalled()
  })

  it('should use fallback API URL when NEXT_PUBLIC_API_URL is not set', async () => {
    delete process.env.NEXT_PUBLIC_API_URL

    const mockResponse = {
      task: {
        key: 'TEST-123',
        summary: 'Test Task',
        status: 'In Progress',
        assignee: 'John Doe',
        priority: 'High'
      },
      dependencies: [],
      dependents: [],
      has_dependencies: false
    }

    ;(fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    })

    renderHook(() => useTaskDependency({ taskKey: 'TEST-123' }))

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('http://localhost:8001/api/task/TEST-123/dependencies')
    })
  })
})
