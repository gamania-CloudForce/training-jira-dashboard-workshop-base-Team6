import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { TaskDependencyViewer } from '@/components/task-dependency-viewer'

// Mock the custom hook
jest.mock('@/hooks/use-task-dependency', () => ({
  useTaskDependency: jest.fn()
}))

// Mock next/dynamic
jest.mock('next/dynamic', () => {
  return function dynamic(component: any) {
    return component()
  }
})

const mockUseTaskDependency = require('@/hooks/use-task-dependency').useTaskDependency

describe('TaskDependencyViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders loading state', () => {
    mockUseTaskDependency.mockReturnValue({
      dependencyData: null,
      loading: true,
      error: null,
      refetch: jest.fn()
    })

    render(<TaskDependencyViewer taskKey="TEST-123" />)
    
    expect(screen.getByText('載入中...')).toBeInTheDocument()
    expect(screen.getByText(/正在分析任務.*的依賴關係/)).toBeInTheDocument()
  })

  it('renders error state', () => {
    mockUseTaskDependency.mockReturnValue({
      dependencyData: null,
      loading: false,
      error: 'Failed to load dependencies',
      refetch: jest.fn()
    })

    render(<TaskDependencyViewer taskKey="TEST-123" />)
    
    expect(screen.getByText('載入失敗:')).toBeInTheDocument()
    expect(screen.getByText('Failed to load dependencies')).toBeInTheDocument()
    expect(screen.getByText('重試')).toBeInTheDocument()
  })

  it('renders no dependencies found', () => {
    mockUseTaskDependency.mockReturnValue({
      dependencyData: {
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
      },
      loading: false,
      error: null,
      refetch: jest.fn()
    })

    render(<TaskDependencyViewer taskKey="TEST-123" />)
    
    expect(screen.getByText('TEST-123')).toBeInTheDocument()
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    expect(screen.getByText('此任務無依賴關係')).toBeInTheDocument()
  })

  it('renders task with dependencies and dependents', async () => {
    const mockDependencyData = {
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
      dependents: [
        {
          key: 'TEST-200',
          summary: 'Dependent Task',
          status: 'To Do',
          assignee: 'Bob Johnson',
          priority: 'Low'
        }
      ],
      has_dependencies: true
    }

    mockUseTaskDependency.mockReturnValue({
      dependencyData: mockDependencyData,
      loading: false,
      error: null,
      refetch: jest.fn()
    })

    render(<TaskDependencyViewer taskKey="TEST-123" />)
    
    // Check main task
    expect(screen.getByText('TEST-123')).toBeInTheDocument()
    expect(screen.getByText('Test Task')).toBeInTheDocument()
    
    // Check dependencies section (使用中文)
    expect(screen.getByText(/依賴的任務.*\(1\)/)).toBeInTheDocument()
    expect(screen.getByText('TEST-100')).toBeInTheDocument()
    expect(screen.getByText('Dependency Task')).toBeInTheDocument()
    
    // Check dependents section (使用中文)
    expect(screen.getByText(/被依賴的任務.*\(1\)/)).toBeInTheDocument()
    expect(screen.getByText('TEST-200')).toBeInTheDocument()
    expect(screen.getByText('Dependent Task')).toBeInTheDocument()
  })

  it('displays correct status colors', () => {
    const mockDependencyData = {
      task: {
        key: 'TEST-123',
        summary: 'Test Task',
        status: 'Done',
        assignee: 'John Doe',
        priority: 'High'
      },
      dependencies: [
        {
          key: 'TEST-100',
          summary: 'In Progress Task',
          status: 'In Progress',
          assignee: 'Jane Smith',
          priority: 'Medium'
        },
        {
          key: 'TEST-101',
          summary: 'Todo Task',
          status: 'To Do',
          assignee: 'Bob Johnson',
          priority: 'Low'
        }
      ],
      dependents: [],
      has_dependencies: true
    }

    mockUseTaskDependency.mockReturnValue({
      dependencyData: mockDependencyData,
      loading: false,
      error: null,
      refetch: jest.fn()
    })

    render(<TaskDependencyViewer taskKey="TEST-123" />)
    
    // Check that status badges are rendered
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('In Progress')).toBeInTheDocument()
    expect(screen.getByText('To Do')).toBeInTheDocument()
  })
})
