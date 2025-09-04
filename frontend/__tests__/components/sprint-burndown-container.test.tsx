import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SprintBurndownContainer } from '@/components/sprint-burndown-container'
import { useSprintBurndown } from '@/hooks/use-sprint-burndown'

// Mock the hook
jest.mock('@/hooks/use-sprint-burndown')
const mockUseSprintBurndown = useSprintBurndown as jest.MockedFunction<typeof useSprintBurndown>

// Mock child components to simplify testing
jest.mock('@/components/completion-rate-card', () => ({
  CompletionRateCard: ({ sprintData }: { sprintData: any }) => (
    <div data-testid="completion-rate-card">
      Sprint: {sprintData.sprint_name}, Rate: {sprintData.completion_rate}%
    </div>
  ),
}))

jest.mock('@/components/burndown-chart', () => ({
  BurndownChart: ({ sprintData }: { sprintData: any }) => (
    <div data-testid="burndown-chart">
      Chart for: {sprintData.sprint_name}, Status: {sprintData.status}
    </div>
  ),
}))

const mockBurndownData = {
  sprint_data: {
    sprint_name: 'Test Sprint',
    total_story_points: 20.0,
    completed_story_points: 13.0,
    remaining_story_points: 7.0,
    completion_rate: 65.0,
    status: 'normal' as const,
    total_working_days: 10,
    days_elapsed: 7,
    remaining_working_days: 3,
  },
  daily_progress: [],
  chart_data: [],
}

describe('SprintBurndownContainer', () => {
  beforeEach(() => {
    mockUseSprintBurndown.mockClear()
  })

  it('shows selection prompt when selectedSprint is "All"', () => {
    mockUseSprintBurndown.mockReturnValue({
      burndownData: null,
      sprintInfo: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<SprintBurndownContainer selectedSprint="All" />)

    expect(screen.getByText('Sprint 燃盡圖')).toBeInTheDocument()
    expect(screen.getByText('請選擇一個特定的 Sprint 來查看燃盡圖和完成率分析')).toBeInTheDocument()
  })

  it('shows loading state correctly', () => {
    mockUseSprintBurndown.mockReturnValue({
      burndownData: null,
      sprintInfo: null,
      loading: true,
      error: null,
      refetch: jest.fn(),
    })

    const { container } = render(<SprintBurndownContainer selectedSprint="Test Sprint" />)

    // 檢查載入骨架組件是否存在 (透過 animate-pulse 類別)
    const skeletonElements = container.querySelectorAll('.animate-pulse')
    expect(skeletonElements.length).toBeGreaterThan(0)
    
    // 檢查 space-y-6 容器存在 (表示是載入狀態的布局)
    expect(container.querySelector('.space-y-6')).toBeInTheDocument()
  })

  it('shows error state correctly', () => {
    mockUseSprintBurndown.mockReturnValue({
      burndownData: null,
      sprintInfo: null,
      loading: false,
      error: 'API Error: Failed to fetch data',
      refetch: jest.fn(),
    })

    render(<SprintBurndownContainer selectedSprint="Test Sprint" />)

    expect(screen.getByText('載入失敗:')).toBeInTheDocument()
    expect(screen.getByText('API Error: Failed to fetch data')).toBeInTheDocument()
  })

  it('renders burndown components when data is available', () => {
    mockUseSprintBurndown.mockReturnValue({
      burndownData: mockBurndownData,
      sprintInfo: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<SprintBurndownContainer selectedSprint="Test Sprint" />)

    // Should render both child components
    expect(screen.getByTestId('completion-rate-card')).toBeInTheDocument()
    expect(screen.getByTestId('burndown-chart')).toBeInTheDocument()

    // Check that data is passed correctly
    expect(screen.getByText('Sprint: Test Sprint, Rate: 65%')).toBeInTheDocument()
    expect(screen.getByText('Chart for: Test Sprint, Status: normal')).toBeInTheDocument()
  })

  it('calls useSprintBurndown with correct parameters', () => {
    mockUseSprintBurndown.mockReturnValue({
      burndownData: null,
      sprintInfo: null,
      loading: false,
      error: null,
      refetch: jest.fn(),
    })

    render(<SprintBurndownContainer selectedSprint="Test Sprint" />)

    expect(mockUseSprintBurndown).toHaveBeenCalledWith({
      sprintName: 'Test Sprint'
    })
  })
})
