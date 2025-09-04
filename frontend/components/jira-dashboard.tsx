"use client"

import React, { useState } from "react"
import {
  ChevronDown,
  CheckCircle2,
  Clock,
  FileText,
  Target,
  Loader2,
} from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ChartContainer } from "@/components/ui/chart"
import { useDashboard } from "@/hooks/use-dashboard"
import { SprintBurndownContainer } from "@/components/sprint-burndown-container"

export default function JiraDashboard() {
  const [selectedSprint, setSelectedSprint] = useState<string>('All')

  const {
    stats,
    statusDistribution,
    sprintOptions,
    loading,
    error,
    refetch
  } = useDashboard({
    sprint: selectedSprint === 'All' ? undefined : selectedSprint,
  })

  // 定義 Status 的正確順序
  const statusOrder = [
    'Backlog',
    'Evaluated', 
    'To Do',
    'In Progress',
    'Waiting',
    'PR Review',
    'Dev Completed',
    'Ready to Test',
    'Ready to Verify',
    'Testing',
    'Ready to Release',
    'Done',
    'Invalid',
    'Routine'
  ]

  // 將狀態分布資料轉換為圖表格式，並按指定順序排序
  const chartData = statusDistribution?.distribution
    .map(item => ({
      name: item.status,
      value: item.count,
      percentage: item.percentage
    }))
    .sort((a, b) => {
      const indexA = statusOrder.indexOf(a.name)
      const indexB = statusOrder.indexOf(b.name)
      
      // 如果狀態不在預定義順序中，放到最後
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      
      return indexA - indexB
    }) || []

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6 z-10">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-blue-600" />
          <h1 className="text-lg font-semibold">Jira Dashboard</h1>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Sprint:</label>
            <Select value={selectedSprint} onValueChange={setSelectedSprint}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Sprint" />
              </SelectTrigger>
              <SelectContent>
                {sprintOptions.map((sprint) => (
                  <SelectItem key={sprint} value={sprint}>
                    {sprint}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* <Avatar className="h-8 w-8">
            <AvatarFallback>JD</AvatarFallback>
          </Avatar> */}
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <p className="text-red-600">Error: {error}</p>
                <Button onClick={refetch} variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {/* Total Issue Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Issue Count</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-2xl font-bold">--</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{stats?.total_issues || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Total issues tracked</p>
            </CardContent>
          </Card>

          {/* Total Story Points */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Story Points</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-2xl font-bold">--</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{stats?.total_story_points?.toFixed(1) || '0.0'}</div>
              )}
              <p className="text-xs text-muted-foreground">Total story points</p>
            </CardContent>
          </Card>

          {/* Total Done Item Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Done Item Count</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-2xl font-bold">--</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{stats?.done_issues || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Completed issues</p>
            </CardContent>
          </Card>

          {/* Total Done Item Story Points */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Done Story Points</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-2xl font-bold">--</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{stats?.done_story_points?.toFixed(1) || '0.0'}</div>
              )}
              <p className="text-xs text-muted-foreground">Completed story points</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-1 xl:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>Issue Status Distribution</CardTitle>
              <CardDescription>
                A breakdown of issues by their current status.
                {statusDistribution && (
                  <span className="ml-2 text-sm">
                    (Total: {statusDistribution.total_count} issues)
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-[300px]">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Loading chart data...</span>
                </div>
              ) : chartData.length === 0 ? (
                <div className="flex items-center justify-center h-[300px] text-gray-500">
                  No status data available
                </div>
              ) : (
                <ChartContainer
                  className="h-[300px] w-full"
                  config={{
                    value: {
                      label: "Issues",
                      color: "hsl(221.2 83.2% 53.3%)",
                    },
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis 
                        dataKey="name" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <ChartTooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-3 border rounded-lg shadow-lg">
                                <p className="font-medium">{label}</p>
                                <p className="text-blue-600">
                                  Issues: {data.value}
                                </p>
                                <p className="text-gray-600">
                                  Percentage: {data.percentage.toFixed(1)}%
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(221.2 83.2% 53.3%)" 
                        radius={[4, 4, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sprint Burndown Section */}
        <div className="grid gap-4 md:gap-8 lg:grid-cols-1 xl:grid-cols-1">
          <SprintBurndownContainer selectedSprint={selectedSprint} />
        </div>

      </main>
    </div>
  )
}
