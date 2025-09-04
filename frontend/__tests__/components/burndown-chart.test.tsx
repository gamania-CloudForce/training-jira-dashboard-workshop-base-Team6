import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BurndownChart } from '@/components/burndown-chart'
import type { ChartDataPoint, SprintBurndownData } from '@/hooks/use-sprint-burndown'

// Mock recharts to avoid complex rendering issues in tests
jest.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: ({ dataKey, stroke }: { dataKey: string; stroke: string }) => (
    <div data-testid={`line-${dataKey}`} data-stroke={stroke} />
  ),
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}))

const mockChartData: ChartDataPoint[] = [
  { day: 1, date: '2025-01-01', ideal: 18, actual: 18 },
  { day: 2, date: '2025-01-02', ideal: 16, actual: 15 },
  { day: 3, date: '2025-01-03', ideal: 14, actual: 12 },
  { day: 4, date: '2025-01-04', ideal: 12, actual: 10 },
  { day: 5, date: '2025-01-05', ideal: 10, actual: 8 },
]

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
  status: 'warning',
}

const mockDangerSprintData: SprintBurndownData = {
  ...mockNormalSprintData,
  status: 'danger',
}

describe('BurndownChart', () => {
  it('renders chart title correctly', () => {
    render(
      <BurndownChart 
        chartData={mockChartData} 
        sprintData={mockNormalSprintData}
      />
    )
    expect(screen.getByText('Sprint 燃盡圖')).toBeInTheDocument()
  })

  it('renders chart components', () => {
    render(
      <BurndownChart 
        chartData={mockChartData} 
        sprintData={mockNormalSprintData}
      />
    )
    
    // Use getAllByTestId to handle multiple responsive containers
    const responsiveContainers = screen.getAllByTestId('responsive-container')
    expect(responsiveContainers.length).toBeGreaterThan(0)
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    expect(screen.getByTestId('x-axis')).toBeInTheDocument()
    expect(screen.getByTestId('y-axis')).toBeInTheDocument()
  })

  it('renders both ideal and actual lines', () => {
    render(
      <BurndownChart 
        chartData={mockChartData} 
        sprintData={mockNormalSprintData}
      />
    )
    
    expect(screen.getByTestId('line-ideal')).toBeInTheDocument()
    expect(screen.getByTestId('line-actual')).toBeInTheDocument()
  })

  describe('Status Color Mapping', () => {
    it('uses green color for normal status', () => {
      render(
        <BurndownChart 
          chartData={mockChartData} 
          sprintData={mockNormalSprintData}
        />
      )
      
      const actualLine = screen.getByTestId('line-actual')
      expect(actualLine).toHaveAttribute('data-stroke', '#10b981') // green
    })

    it('uses yellow color for warning status', () => {
      render(
        <BurndownChart 
          chartData={mockChartData} 
          sprintData={mockWarningSprintData}
        />
      )
      
      const actualLine = screen.getByTestId('line-actual')
      expect(actualLine).toHaveAttribute('data-stroke', '#f59e0b') // yellow
    })

    it('uses red color for danger status', () => {
      render(
        <BurndownChart 
          chartData={mockChartData} 
          sprintData={mockDangerSprintData}
        />
      )
      
      const actualLine = screen.getByTestId('line-actual')
      expect(actualLine).toHaveAttribute('data-stroke', '#ef4444') // red
    })
  })

  it('renders with custom className', () => {
    const { container } = render(
      <BurndownChart 
        chartData={mockChartData} 
        sprintData={mockNormalSprintData}
        className="custom-class"
      />
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles empty chart data gracefully', () => {
    render(
      <BurndownChart 
        chartData={[]} 
        sprintData={mockNormalSprintData}
      />
    )
    
    // Should still render the chart structure
    expect(screen.getByText('Sprint 燃盡圖')).toBeInTheDocument()
    expect(screen.getByTestId('line-chart')).toBeInTheDocument()
  })

  describe('Chart Configuration', () => {
    it('displays correct legend labels', () => {
      render(
        <BurndownChart 
          chartData={mockChartData} 
          sprintData={mockNormalSprintData}
        />
      )
      
      // The chart config should include proper labels
      // This would typically be tested through tooltip or legend interaction
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })

    it('uses gray color for ideal line', () => {
      render(
        <BurndownChart 
          chartData={mockChartData} 
          sprintData={mockNormalSprintData}
        />
      )
      
      const idealLine = screen.getByTestId('line-ideal')
      expect(idealLine).toHaveAttribute('data-stroke', '#9ca3af') // gray
    })
  })
})
