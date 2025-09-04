"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  AlertCircle, 
  ArrowDown, 
  ArrowUp, 
  User, 
  RefreshCw,
  Loader2,
  Network,
  Target
} from "lucide-react"
import { useTaskDependency, TaskInfo } from "@/hooks/use-task-dependency"

interface TaskDependencyViewerProps {
  taskKey: string | null
  onTaskClick?: (taskKey: string) => void
  className?: string
}

// TaskCard 組件用於顯示單個任務
interface TaskCardProps {
  task: TaskInfo
  onClick?: (taskKey: string) => void
  variant?: 'main' | 'dependency' | 'dependent'
}

function TaskCard({ task, onClick, variant = 'main' }: TaskCardProps) {
  const getStatusColor = (status?: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800"
    
    switch (status.toLowerCase()) {
      case 'done':
      case 'closed':
        return "bg-green-100 text-green-800"
      case 'in progress':
      case 'in review':
        return "bg-blue-100 text-blue-800"
      case 'to do':
      case 'open':
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority?: string | null) => {
    if (!priority) return "bg-gray-100 text-gray-800"
    
    switch (priority.toLowerCase()) {
      case 'highest':
      case 'high':
        return "bg-red-100 text-red-800"
      case 'medium':
        return "bg-yellow-100 text-yellow-800"
      case 'low':
      case 'lowest':
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'dependency':
        return "border-orange-200 bg-orange-50"
      case 'dependent':
        return "border-green-200 bg-green-50"
      case 'main':
        return "border-blue-200 bg-blue-50 shadow-md"
      default:
        return "border-gray-200"
    }
  }

  return (
    <Card 
      className={`${getVariantStyles()} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={() => onClick && onClick(task.key)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex flex-col">
            <span className="font-mono text-sm font-bold text-blue-600">{task.key}</span>
            <span className="text-xs text-gray-500">{task.parent || ''}</span>
          </div>
          <div className="flex flex-col gap-1 items-end">
            <Badge variant="outline" className={getStatusColor(task.status)}>
              {task.status}
            </Badge>
            {task.priority && (
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            )}
          </div>
        </div>
        
        <h4 className="font-medium text-sm mb-2 line-clamp-2">
          {task.summary}
        </h4>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{task.assignee || '未指派'}</span>
          </div>
          {task.story_points && (
            <span className="font-mono bg-gray-100 px-1 rounded">
              {task.story_points} SP
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function TaskDependencyViewer({ 
  taskKey, 
  onTaskClick, 
  className 
}: TaskDependencyViewerProps) {
  const { dependencyData, loading, error, refetch } = useTaskDependency({ taskKey })

  // 如果沒有選擇任務
  if (!taskKey) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Network className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">任務依賴關係視覺化</h3>
            <p className="text-muted-foreground text-center max-w-md">
              請點擊任意任務來查看其依賴關係與協作夥伴進度
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 載入中狀態
  if (loading) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">載入中...</h3>
            <p className="text-muted-foreground">
              正在分析任務 "{taskKey}" 的依賴關係...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>載入失敗:</strong> {error}
            </div>
            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              重試
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // 無資料狀態
  if (!dependencyData) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">無資料</h3>
            <p className="text-muted-foreground text-center max-w-md">
              無法載入任務 "{taskKey}" 的依賴關係資料
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { task, dependencies, dependents, has_dependencies } = dependencyData

  // 無依賴關係狀態
  if (!has_dependencies) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              任務依賴關係
            </CardTitle>
            <CardDescription>
              任務 "{task.key}" 的依賴關係分析
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-600 mb-3">目標任務</h4>
              <TaskCard task={task} onClick={onTaskClick} variant="main" />
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>此任務無依賴關係</strong>
                <br />
                此任務不依賴其他任務，也沒有其他任務依賴於它。可以獨立進行開發。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 有依賴關係的主要顯示
  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            任務依賴關係
          </CardTitle>
          <CardDescription>
            任務 "{task.key}" 的依賴關係分析 
            ({dependencies.length} 個依賴，{dependents.length} 個被依賴)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* 🎯 視覺化依賴關係流程 - 符合 spec 要求的箭頭與線條 */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
            <h4 className="text-sm font-medium text-gray-600 mb-6 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              依賴關係視覺化流程 (箭頭與線條)
            </h4>
            
            <div className="flex flex-col items-center space-y-6">
              {/* 依賴的任務（上方） */}
              {dependencies.length > 0 && (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {dependencies.map((dep) => (
                      <div key={dep.key} className="relative">
                        <TaskCard task={dep} onClick={onTaskClick} variant="dependency" />
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                            前置任務
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 🔥 大箭頭向下 - 視覺化突顯依賴關係 */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-px h-8 bg-orange-300"></div>
                      <ArrowDown className="h-8 w-8 text-orange-500 animate-bounce" />
                      <div className="w-px h-8 bg-orange-300"></div>
                    </div>
                    <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-semibold">
                      完成後可開始
                    </div>
                  </div>
                </>
              )}
              
              {/* 🎯 目標任務（中央突出顯示） */}
              <div className="relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-xl opacity-20 blur"></div>
                <div className="relative bg-white rounded-xl shadow-lg">
                  <TaskCard task={task} onClick={onTaskClick} variant="main" />
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-2 shadow-lg">
                    <Target className="h-4 w-4" />
                  </div>
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                      目標任務
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 被依賴的任務（下方） */}
              {dependents.length > 0 && (
                <>
                  {/* 🔥 大箭頭向下 - 視覺化突顯依賴關係 */}
                  <div className="flex flex-col items-center space-y-2">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                      完成後解鎖
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-px h-8 bg-green-300"></div>
                      <ArrowDown className="h-8 w-8 text-green-500 animate-bounce" />
                      <div className="w-px h-8 bg-green-300"></div>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {dependents.map((dependent) => (
                      <div key={dependent.key} className="relative">
                        <TaskCard task={dependent} onClick={onTaskClick} variant="dependent" />
                        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2">
                          <div className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                            後續任務
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 提示說明 */}
          <div className="text-center bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              💡 <strong>提示：</strong>點擊任何任務卡片可以查看該任務的依賴關係，
              箭頭與線條清楚顯示任務間的阻擋關係
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
