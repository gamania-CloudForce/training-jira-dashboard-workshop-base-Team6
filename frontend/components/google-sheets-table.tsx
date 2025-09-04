'use client'

import React, { useState, useMemo } from 'react'
import { useGoogleSheets } from '@/hooks/use-google-sheets'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown, Loader2, Settings, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'
import { TaskDependencyViewer } from './task-dependency-viewer'

export function GoogleSheetsTable() {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(100)
  const [sortBy, setSortBy] = useState('Key')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedSprint, setSelectedSprint] = useState<string>('All')
  const [showConfigDialog, setShowConfigDialog] = useState(false)
  const [googleSheetUrl, setGoogleSheetUrl] = useState('')
  const [configLoading, setConfigLoading] = useState(false)
  const [configMessage, setConfigMessage] = useState('')
  const [currentSheetInfo, setCurrentSheetInfo] = useState<{sheet_id: string; sheet_url: string} | null>(null)
  const [selectedTaskKey, setSelectedTaskKey] = useState<string | null>(null)

  const {
    data,
    pagination,
    summary,
    sprintOptions,
    loading,
    error,
    refetch
  } = useGoogleSheets({
    page,
    pageSize,
    sortBy,
    sortOrder,
    sprint: selectedSprint === 'All' ? undefined : selectedSprint,
  })

  // 獲取當前 sheet 配置
  const fetchSheetConfig = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
      const response = await fetch(`${apiUrl}/api/config/sheet`)
      if (response.ok) {
        const config = await response.json()
        setCurrentSheetInfo(config)
      }
    } catch (error) {
      console.error('Failed to fetch sheet config:', error)
    }
  }

  // 更新 sheet 配置
  const updateSheetConfig = async () => {
    if (!googleSheetUrl.trim()) {
      setConfigMessage('Please enter a valid Google Sheets URL')
      return
    }

    setConfigLoading(true)
    setConfigMessage('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'
      const response = await fetch(`${apiUrl}/api/config/sheet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          google_sheet_url: googleSheetUrl.trim()
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        setConfigMessage(`✅ ${result.message}`)
        setGoogleSheetUrl('')
        await fetchSheetConfig() // 重新獲取配置
        // 重新載入資料以反映新的資料來源
        refetch()
        // 自動關閉對話框
        setTimeout(() => {
          setShowConfigDialog(false)
          setConfigMessage('')
        }, 2000)
      } else {
        setConfigMessage(`❌ ${result.message || 'Failed to update configuration'}`)
      }
    } catch (error) {
      setConfigMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setConfigLoading(false)
    }
  }

  // 組件掛載時獲取當前配置
  React.useEffect(() => {
    fetchSheetConfig()
  }, [])

  // 從資料和 summary 中動態獲取所有欄位
  const allColumns = useMemo(() => {
    if (summary && summary.columns) {
      return summary.columns.map(col => ({
        key: col.name.replace(/ /g, '_').replace(/\./g, '_').toLowerCase(),
        label: col.name,
        type: col.type,
        sortable: true
      }))
    }
    
    // 如果沒有 summary，從第一筆資料推斷欄位
    if (data.length > 0) {
      return Object.keys(data[0]).map(key => ({
        key: key,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: 'string',
        sortable: true
      }))
    }
    
    return []
  }, [data, summary])

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm')
    } catch {
      return dateString
    }
  }

  const formatCellValue = (value: any, columnType: string, columnKey: string) => {
    if (value === null || value === undefined || value === '') return '-'
    
    // 日期欄位
    if (columnType === 'date' || ['created', 'updated', 'resolved', 'due_date'].includes(columnKey)) {
      return formatDate(value)
    }
    
    // 數字欄位
    if (columnType === 'number' && typeof value === 'number') {
      return value % 1 === 0 ? value.toString() : value.toFixed(2)
    }
    
    return String(value)
  }

  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortOrder === 'asc' ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />
  }

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower.includes('done') || statusLower.includes('resolved')) return 'bg-green-100 text-green-800'
    if (statusLower.includes('progress')) return 'bg-blue-100 text-blue-800'
    if (statusLower.includes('backlog')) return 'bg-gray-100 text-gray-800'
    if (statusLower.includes('todo') || statusLower.includes('to do')) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getPriorityColor = (priority: string) => {
    const priorityLower = priority?.toLowerCase() || ''
    if (priorityLower.includes('highest') || priorityLower.includes('high')) return 'bg-red-100 text-red-800'
    if (priorityLower.includes('medium')) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <p className="text-red-500 mb-4">Error: {error}</p>
        <Button onClick={refetch}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="w-full space-y-4 h-full flex flex-col">
      {/* Header with summary info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Google Sheets Table View</h1>
          <div className="space-y-1">
            {summary && (
              <p className="text-sm text-gray-500">
                Sheet: {summary.sheetName} | Total Rows: {summary.totalRows} | Showing {summary.columns.length} columns
              </p>
            )}
            <p className="text-xs text-gray-400 font-mono">
              Sheet ID: {currentSheetInfo?.sheet_id || 'Loading...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentSheetInfo && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(currentSheetInfo.sheet_url, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Sheet
            </Button>
          )}
          <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Configure Data Source
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Configure Google Sheets Data Source</DialogTitle>
                <DialogDescription>
                  Update the Google Sheets URL to change the data source for this table.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {currentSheetInfo && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Current Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <label className="text-xs font-medium text-gray-500">Sheet ID:</label>
                        <p className="text-sm font-mono bg-gray-100 p-2 rounded break-all">
                          {currentSheetInfo.sheet_id}
                        </p>
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto"
                        onClick={() => window.open(currentSheetInfo.sheet_url, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Current Sheet
                      </Button>
                    </CardContent>
                  </Card>
                )}
                
                <div className="space-y-2">
                  <label htmlFor="sheet-url" className="text-sm font-medium">
                    New Google Sheets URL:
                  </label>
                  <Input
                    id="sheet-url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={googleSheetUrl}
                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Paste the full Google Sheets URL. The system will extract the Sheet ID automatically.
                  </p>
                </div>

                {configMessage && (
                  <div className={`p-3 rounded text-sm ${
                    configMessage.startsWith('✅') 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {configMessage}
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowConfigDialog(false)
                      setGoogleSheetUrl('')
                      setConfigMessage('')
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={updateSheetConfig}
                    disabled={configLoading || !googleSheetUrl.trim()}
                  >
                    {configLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Update Configuration'
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Sprint Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Sprint:</label>
        <Select value={selectedSprint} onValueChange={(value) => {
          setSelectedSprint(value)
          setPage(1) // Reset to first page when filter changes
        }}>
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

      {/* Table container with fixed height and scroll */}
      <div className="flex-1 min-h-0 rounded-md border bg-white">
        <div className="h-full overflow-auto relative">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20 bg-gray-50">
              <tr>
                {allColumns.map((column) => (
                  <th
                    key={column.key}
                    className={`${
                      column.sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    } border-b border-gray-200 px-4 py-3 text-left text-sm font-medium text-gray-900 bg-gray-50`}
                    onClick={() => column.sortable && handleSort(column.label)}
                  >
                    <div className="flex items-center min-w-[120px] max-w-[200px]">
                      <span className="truncate">{column.label}</span>
                      {column.sortable && renderSortIcon(column.label)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={allColumns.length || 1} className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                    <p className="mt-2 text-gray-500">Loading data...</p>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={allColumns.length || 1} className="text-center py-8 text-gray-500">
                    No data found
                  </td>
                </tr>
              ) : (
                data.map((row, index) => (
                  <tr key={row.key || index} className="hover:bg-gray-50">
                    {allColumns.map((column) => {
                      const value = row[column.key]
                      
                      // 特殊處理 Key 欄位 - 添加點擊查看依賴關係
                      if (column.key === 'key' || column.label === 'Key') {
                        return (
                          <td key={column.key} className="px-4 py-3 text-sm">
                            <button
                              onClick={() => setSelectedTaskKey(value)}
                              className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer"
                              title="Click to view task dependencies"
                            >
                              {value || '-'}
                            </button>
                          </td>
                        )
                      }

                      // 特殊處理 Status 欄位
                      if (column.key === 'status' || column.label === 'Status') {
                        return (
                          <td key={column.key} className="px-4 py-3 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
                              {value || '-'}
                            </span>
                          </td>
                        )
                      }
                      
                      // 特殊處理 Priority 欄位
                      if (column.key === 'priority' || column.label === 'Priority') {
                        return (
                          <td key={column.key} className="px-4 py-3 text-sm">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(value)}`}>
                              {value || '-'}
                            </span>
                          </td>
                        )
                      }
                      
                      // 一般欄位 - 限制最大寬度並允許換行
                      return (
                        <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                          <div className="min-w-[120px] max-w-[200px] break-words">
                            {formatCellValue(value, column.type, column.key)}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between px-2 py-3 bg-white border-t">
          <div className="text-sm text-gray-700">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalRecords)} of{' '}
            {pagination.totalRecords} results
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center space-x-1">
              <Input
                type="number"
                min={1}
                max={pagination.totalPages}
                value={page}
                onChange={(e) => {
                  const newPage = parseInt(e.target.value)
                  if (newPage >= 1 && newPage <= pagination.totalPages) {
                    setPage(newPage)
                  }
                }}
                className="w-16 text-center"
              />
              <span className="text-sm text-gray-700">/ {pagination.totalPages}</span>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage(pagination.totalPages)}
              disabled={!pagination.hasNext}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Task Dependency Viewer Modal */}
      {selectedTaskKey && (
        <Dialog open={!!selectedTaskKey} onOpenChange={() => setSelectedTaskKey(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Task Dependencies - {selectedTaskKey}</DialogTitle>
              <DialogDescription>
                View dependencies and relationships for this task
              </DialogDescription>
            </DialogHeader>
            <TaskDependencyViewer taskKey={selectedTaskKey} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}