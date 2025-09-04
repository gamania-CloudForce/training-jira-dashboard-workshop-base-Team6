import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CompletionRateCard } from '@/components/completion-rate-card'
import type { SprintBurndownData } from '@/hooks/use-sprint-burndown'

// Mock data for different health statuses
const mockNormalSprintData: SprintBurndownData = {
  sprint_name: 'Test Sprint',
  total_story_points: 20.0,
  completed_story_points: 13.0,
  remaining_story_points: 7.0,
  completion_rate: 65.0,
  status: 'normal',
  total_working_days: 10,
  days_elapsed: 7,
  remaining_working_days: 3,
}

const mockWarningSprintData: SprintBurndownData = {
  ...mockNormalSprintData,
  completed_story_points: 10.0,
  remaining_story_points: 10.0,
  completion_rate: 50.0,
  status: 'warning',
}

const mockDangerSprintData: SprintBurndownData = {
  ...mockNormalSprintData,
  completed_story_points: 6.0,
  remaining_story_points: 14.0,
  completion_rate: 30.0,
  status: 'danger',
}

describe('CompletionRateCard', () => {
  it('renders sprint name correctly', () => {
    render(<CompletionRateCard sprintData={mockNormalSprintData} />)
    expect(screen.getByText('Test Sprint')).toBeInTheDocument()
  })

  it('displays correct completion rate', () => {
    render(<CompletionRateCard sprintData={mockNormalSprintData} />)
    expect(screen.getByText('65%')).toBeInTheDocument()
  })

  it('shows correct story points breakdown', () => {
    render(<CompletionRateCard sprintData={mockNormalSprintData} />)
    expect(screen.getByText('13')).toBeInTheDocument() // completed (显示为整数)
    expect(screen.getByText('7')).toBeInTheDocument()  // remaining
    expect(screen.getByText('20')).toBeInTheDocument() // total
  })

  it('displays correct time information', () => {
    render(<CompletionRateCard sprintData={mockNormalSprintData} />)
    expect(screen.getByText('7 天')).toBeInTheDocument()  // days elapsed
    expect(screen.getByText('3 天')).toBeInTheDocument()  // remaining days
    expect(screen.getByText('10 天')).toBeInTheDocument() // total days
  })

  describe('Health Status Display', () => {
    it('shows normal status with correct styling', () => {
      render(<CompletionRateCard sprintData={mockNormalSprintData} />)
      expect(screen.getByText('正常進度')).toBeInTheDocument()
      expect(screen.getByText('正常進度')).toHaveClass('text-green-800')
    })

    it('shows warning status with correct styling', () => {
      render(<CompletionRateCard sprintData={mockWarningSprintData} />)
      expect(screen.getByText('稍微落後')).toBeInTheDocument()
      expect(screen.getByText('稍微落後')).toHaveClass('text-yellow-800')
    })

    it('shows danger status with correct styling', () => {
      render(<CompletionRateCard sprintData={mockDangerSprintData} />)
      expect(screen.getByText('嚴重落後')).toBeInTheDocument()
      expect(screen.getByText('嚴重落後')).toHaveClass('text-red-800')
    })
  })

  describe('Progress Bar Color', () => {
    it('displays green progress bar for normal status', () => {
      const { container } = render(<CompletionRateCard sprintData={mockNormalSprintData} />)
      const progressBar = container.querySelector('[style*="width: 65%"]')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveStyle('background-color: #22c55e') // green
    })

    it('displays yellow progress bar for warning status', () => {
      const { container } = render(<CompletionRateCard sprintData={mockWarningSprintData} />)
      const progressBar = container.querySelector('[style*="width: 50%"]')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveStyle('background-color: #eab308') // yellow
    })

    it('displays red progress bar for danger status', () => {
      const { container } = render(<CompletionRateCard sprintData={mockDangerSprintData} />)
      const progressBar = container.querySelector('[style*="width: 30%"]')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveStyle('background-color: #ef4444') // red
    })
  })

  describe('Story Points Formatting', () => {
    it('formats integer story points without decimal', () => {
      const integerData = { ...mockNormalSprintData, completed_story_points: 15.0 }
      render(<CompletionRateCard sprintData={integerData} />)
      expect(screen.getByText('15')).toBeInTheDocument() // Should not show '15.0'
    })

    it('formats decimal story points with one decimal place', () => {
      const decimalData = { ...mockNormalSprintData, completed_story_points: 13.5 }
      render(<CompletionRateCard sprintData={decimalData} />)
      expect(screen.getByText('13.5')).toBeInTheDocument()
    })
  })

  it('renders with custom className', () => {
    const { container } = render(
      <CompletionRateCard sprintData={mockNormalSprintData} className="custom-class" />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})
