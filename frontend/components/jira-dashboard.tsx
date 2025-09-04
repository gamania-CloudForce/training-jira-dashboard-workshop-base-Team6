"use client"

import React, { useState, useMemo } from "react"
import {
  ChevronDown,
  CheckCircle2,
  Clock,
  FileText,
  Target,
  Loader2,
  User,
  Users,
  RefreshCw,
  AlertCircle,
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
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All')

  const {
    stats,
    statusDistribution,
    sprintOptions,
    assigneeOptions,
    loading,
    error,
    refetch
  } = useDashboard({
    sprint: selectedSprint === 'All' ? undefined : selectedSprint,
    assignee: selectedAssignee === 'All' ? undefined : selectedAssignee,
  })

  // 模擬當前用戶 - 在實際應用中，這會來自身份驗證系統
  const currentUser = useMemo(() => {
    // 從 assigneeOptions 中找到第一個非 'All' 的選項作為模擬的當前用戶
    return assigneeOptions.find(assignee => assignee !== 'All') || null
  }, [assigneeOptions])

  const handleMyTasksToggle = () => {
    if (selectedAssignee === currentUser) {
      setSelectedAssignee('All')
    } else if (currentUser) {
      setSelectedAssignee(currentUser)
    }
  }

  // 檢查是否沒有資料
  const hasNoData = !loading && stats?.total_issues === 0
  const isPersonalView = selectedAssignee !== 'All'
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
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Assignee:</label>
            <Select value={selectedAssignee} onValueChange={setSelectedAssignee}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Assignee" />
              </SelectTrigger>
              <SelectContent>
                {assigneeOptions.map((assignee) => (
                  <SelectItem key={assignee} value={assignee}>
                    {assignee === 'All' ? 'All Members' : assignee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {currentUser && (
            <Button
              variant={selectedAssignee === currentUser ? "default" : "outline"}
              size="sm"
              onClick={handleMyTasksToggle}
              className="flex items-center gap-2"
            >
              {selectedAssignee === currentUser ? <User className="h-4 w-4" /> : <Users className="h-4 w-4" />}
              {selectedAssignee === currentUser ? 'My Tasks' : 'Show My Tasks'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {stats?.last_updated && (
            <div className="text-xs text-gray-500">
              Last updated: {new Date(stats.last_updated).toLocaleTimeString()}
            </div>
          )}
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
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="text-red-600 font-medium">資料載入失敗，請稍後再試</p>
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                  </div>
                </div>
                <Button onClick={refetch} variant="outline" size="sm" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  重試
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {hasNoData && !error && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <User className="mx-auto h-12 w-12 text-yellow-400 mb-4" />
                <h3 className="text-lg font-medium text-yellow-800 mb-2">
                  {isPersonalView ? `您目前沒有已分配的任務` : '沒有找到任務'}
                </h3>
                <p className="text-yellow-600 text-sm mb-4">
                  {isPersonalView 
                    ? `在當前 Sprint（${selectedSprint}）中沒有分配給您的任務。` 
                    : '在選定的條件下沒有找到任何任務資料。'
                  }
                </p>
                {isPersonalView && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedAssignee('All')}
                    className="flex items-center gap-2"
                  >
                    <Users className="h-4 w-4" />
                    查看所有團隊任務
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {/* Total Issue Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isPersonalView ? '我的任務總數' : 'Total Issue Count'}
              </CardTitle>
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
              <p className="text-xs text-muted-foreground">
                {isPersonalView ? `${selectedAssignee} 的任務` : 'Total issues tracked'}
              </p>
            </CardContent>
          </Card>

          {/* Total Story Points */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isPersonalView ? '我的故事點總數' : 'Total Story Points'}
              </CardTitle>
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
              <p className="text-xs text-muted-foreground">
                {isPersonalView ? `${selectedAssignee} 的故事點` : 'Total story points'}
              </p>
            </CardContent>
          </Card>

          {/* Total Done Item Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isPersonalView ? '我的已完成任務' : 'Total Done Item Count'}
              </CardTitle>
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
              <p className="text-xs text-muted-foreground">
                {isPersonalView ? '已完成的任務' : 'Completed issues'}
              </p>
            </CardContent>
          </Card>

          {/* Total Done Item Story Points */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isPersonalView ? '已完成故事點' : 'Done Story Points'}
              </CardTitle>
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
              <p className="text-xs text-muted-foreground">
                {isPersonalView ? '已完成的故事點' : 'Completed story points'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-1 xl:grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle>
                {isPersonalView ? `${selectedAssignee} 的任務狀態分布` : 'Issue Status Distribution'}
              </CardTitle>
              <CardDescription>
                {isPersonalView 
                  ? `${selectedAssignee} 個人任務在各狀態的分布情況` 
                  : 'A breakdown of issues by their current status.'
                }
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
