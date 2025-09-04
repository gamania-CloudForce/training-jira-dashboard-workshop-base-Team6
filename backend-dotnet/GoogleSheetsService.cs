using System.Globalization;
using System.Text.RegularExpressions;
using CsvHelper;
using CsvHelper.Configuration;
using JiraDashboard.Models;

namespace JiraDashboard.Services;

public class GoogleSheetsService
{
    private readonly HttpClient _httpClient;
    private string _sheetId; // 改為可變更
    //private readonly string _sheetName;
    private readonly string _sheetRawData;
    private readonly string _sheetRawStatusTime;
    private readonly string _sheetSprintInfo;
    private readonly TimeSpan _cacheDuration = TimeSpan.FromMinutes(5);
    private List<Dictionary<string, object?>>? _cache;
    private DateTime _cacheTimestamp;
    private List<string>? _sprintCache;
    private DateTime _sprintCacheTimestamp;

    public GoogleSheetsService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        var defaultSheetId = configuration["GoogleSheets:SheetId"] ?? throw new InvalidOperationException("SheetId not configured");
        
        // 從檔案載入持久化的 Sheet ID，如果沒有則使用預設值
        _sheetId = LoadSheetIdFromFile(defaultSheetId);
        
        //_sheetName = configuration["GoogleSheets:Sheet_rawData"] ?? throw new InvalidOperationException("Sheet_rawData not configured");
        _sheetRawData = configuration["GoogleSheets:Sheet_rawData"] ?? throw new InvalidOperationException("Sheet_rawData not configured");
        _sheetRawStatusTime = configuration["GoogleSheets:Sheet_rawStatusTime"] ?? throw new InvalidOperationException("Sheet_rawStatusTime not configured");
        _sheetSprintInfo = configuration["GoogleSheets:Sheet_sprintInfo"] ?? throw new InvalidOperationException("Sheet_sprintInfo not configured");
    }

    private string GetCsvUrl() => $"https://docs.google.com/spreadsheets/d/{_sheetId}/gviz/tq?tqx=out:csv&sheet={_sheetRawData}&range=A:Y";
    
    private string GetSprintCsvUrl() => $"https://docs.google.com/spreadsheets/d/{_sheetId}/gviz/tq?tqx=out:csv&sheet={_sheetSprintInfo}&range=C:C";

    private async Task<List<Dictionary<string, object?>>> FetchAndCacheDataAsync()
    {
        if (_cache != null && DateTime.UtcNow - _cacheTimestamp < _cacheDuration)
        {
            return _cache;
        }

        var url = GetCsvUrl();
        using var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync();
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            PrepareHeaderForMatch = args => args.Header.ToLower().Replace(" ", "_").Replace(".", "_")
        });

        var records = new List<Dictionary<string, object?>>();
        await foreach (var record in csv.GetRecordsAsync<dynamic>())
        {
            records.Add(new Dictionary<string, object?>(record));
        }

        _cache = records;
        _cacheTimestamp = DateTime.UtcNow;
        return _cache;
    }

    private async Task<List<string>> FetchAndCacheSprintDataAsync()
    {
        if (_sprintCache != null && DateTime.UtcNow - _sprintCacheTimestamp < _cacheDuration)
        {
            return _sprintCache;
        }

        var url = GetSprintCsvUrl();
        using var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync();
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture));

        var sprints = new List<string> { "All" }; // 預設第一個選項
        
        await foreach (var record in csv.GetRecordsAsync<dynamic>())
        {
            var sprintDict = new Dictionary<string, object?>(record);
            var sprintValue = sprintDict.Values.FirstOrDefault()?.ToString()?.Trim();
            
            if (!string.IsNullOrEmpty(sprintValue) && 
                sprintValue != "N/A" && 
                sprintValue != "Sprint Name" && // 跳過表頭
                !sprints.Contains(sprintValue))
            {
                sprints.Add(sprintValue);
            }
        }
        
        // 排序（除了 "All"）
        var sortedSprints = sprints.Skip(1).OrderBy(s => s).ToList();
        sprints = new List<string> { "All" };
        sprints.AddRange(sortedSprints);
        sprints.Add("No Sprints");

        _sprintCache = sprints;
        _sprintCacheTimestamp = DateTime.UtcNow;
        return _sprintCache;
    }

    public async Task<TableSummary> GetSummaryAsync()
    {
        var data = await FetchAndCacheDataAsync();
        var firstRecord = data.FirstOrDefault();
        var columns = firstRecord?.Keys.Select(key => new ColumnInfo(key, "string")).ToList() ?? new List<ColumnInfo>();

        return new TableSummary(
            SheetId: _sheetId,
            SheetName: _sheetRawData,
            TotalRows: data.Count,
            TotalColumns: columns.Count,
            Columns: columns,
            LastUpdated: _cacheTimestamp
        );
    }

    public async Task<TableDataResponse> GetPaginatedDataAsync(
        int page, int pageSize, string sortBy, string sortOrder, string? sprintFilter = null)
    {
        var allData = await FetchAndCacheDataAsync();

        // Apply sprint filter first
        var filteredData = ApplySprintFilter(allData, sprintFilter);

        // Sorting
        if (!string.IsNullOrEmpty(sortBy) && filteredData.Any() && filteredData.First().ContainsKey(sortBy))
        {
            var orderedData = sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase) 
                ? filteredData.OrderByDescending(r => r[sortBy]) 
                : filteredData.OrderBy(r => r[sortBy]);
            filteredData = orderedData.ToList();
        }

        // Pagination
        var totalRecords = filteredData.Count;
        var totalPages = (int)Math.Ceiling(totalRecords / (double)pageSize);
        var paginatedData = filteredData.Skip((page - 1) * pageSize).Take(pageSize).ToList();

        var paginationInfo = new PaginationInfo(
            CurrentPage: page,
            PageSize: pageSize,
            TotalPages: totalPages,
            TotalRecords: totalRecords,
            HasNext: page < totalPages,
            HasPrev: page > 1
        );


        return new TableDataResponse(
            Data: paginatedData,
            Pagination: paginationInfo
        );
    }

    public async Task<List<string>> GetSprintOptionsAsync()
    {
        return await FetchAndCacheSprintDataAsync();
    }

    public async Task<List<string>> GetAssigneeOptionsAsync()
    {
        var data = await FetchAndCacheDataAsync();
        
        var assignees = data
            .Where(row => row.ContainsKey("assignee") && row["assignee"] != null)
            .Select(row => row["assignee"]?.ToString()?.Trim())
            .Where(assignee => !string.IsNullOrEmpty(assignee))
            .Distinct()
            .OrderBy(assignee => assignee)
            .ToList();

        // 加入特殊選項
        var result = new List<string> { "All" };
        result.AddRange(assignees);
        
        return result;
    }

    public async Task<DashboardStats> GetDashboardStatsAsync(string? sprintFilter = null, string? assigneeFilter = null)
    {
        var allData = await FetchAndCacheDataAsync();
        var filteredData = ApplySprintFilter(allData, sprintFilter);
        filteredData = ApplyAssigneeFilter(filteredData, assigneeFilter);

        var totalIssues = filteredData.Count;
        
        // 尋找 Story Points 欄位
        var storyPointsColumn = FindStoryPointsColumn(filteredData);
        var totalStoryPoints = CalculateTotalStoryPoints(filteredData, storyPointsColumn);

        // 計算已完成的 Issues
        var doneData = filteredData.Where(row => IsDoneStatus(row)).ToList();
        var doneIssues = doneData.Count;
        var doneStoryPoints = CalculateTotalStoryPoints(doneData, storyPointsColumn);

        return new DashboardStats(
            TotalIssues: totalIssues,
            TotalStoryPoints: totalStoryPoints,
            DoneIssues: doneIssues,
            DoneStoryPoints: doneStoryPoints,
            LastUpdated: _cacheTimestamp
        );
    }

    public async Task<StatusDistribution> GetStatusDistributionAsync(string? sprintFilter = null, string? assigneeFilter = null)
    {
        var allData = await FetchAndCacheDataAsync();
        var filteredData = ApplySprintFilter(allData, sprintFilter);
        filteredData = ApplyAssigneeFilter(filteredData, assigneeFilter);

        var totalCount = filteredData.Count;
        var statusCounts = new Dictionary<string, int>();

        // 計算各狀態的數量
        foreach (var row in filteredData)
        {
            var status = GetStatusValue(row);
            if (!string.IsNullOrEmpty(status))
            {
                statusCounts[status] = statusCounts.GetValueOrDefault(status, 0) + 1;
            }
        }

        // 定義狀態顯示順序
        var statusOrder = new List<string>
        {
            "Backlog", "Evaluated", "To Do", "In Progress", "Waiting",
            "Dev Completed", "Ready to Verify", "Testing", "Ready to Release",
            "Done", "Invalid", "Routine"
        };

        var distribution = new List<StatusDistributionItem>();

        // 按照指定順序排列狀態
        foreach (var status in statusOrder)
        {
            if (statusCounts.TryGetValue(status, out var count))
            {
                var percentage = totalCount > 0 ? Math.Round((double)count / totalCount * 100, 1) : 0;
                distribution.Add(new StatusDistributionItem(
                    Status: status,
                    Count: count,
                    Percentage: percentage
                ));
            }
        }

        // 處理未在預定義列表中的其他狀態
        foreach (var kvp in statusCounts)
        {
            if (!statusOrder.Contains(kvp.Key))
            {
                var percentage = totalCount > 0 ? Math.Round((double)kvp.Value / totalCount * 100, 1) : 0;
                distribution.Add(new StatusDistributionItem(
                    Status: kvp.Key,
                    Count: kvp.Value,
                    Percentage: percentage
                ));
            }
        }

        return new StatusDistribution(
            Distribution: distribution,
            TotalCount: totalCount,
            LastUpdated: _cacheTimestamp
        );
    }

    private static string? FindStoryPointsColumn(List<Dictionary<string, object?>> data)
    {
        if (!data.Any()) return null;
        
        var firstRow = data.First();
        foreach (var key in firstRow.Keys)
        {
            var keyLower = key.ToLower();
            if (keyLower.Contains("story") && keyLower.Contains("point"))
            {
                return key;
            }
        }
        return null;
    }

    private static double CalculateTotalStoryPoints(List<Dictionary<string, object?>> data, string? storyPointsColumn)
    {
        if (string.IsNullOrEmpty(storyPointsColumn)) return 0;

        double total = 0;
        foreach (var row in data)
        {
            if (row.TryGetValue(storyPointsColumn, out var value) && value != null)
            {
                if (double.TryParse(value.ToString(), out var points))
                {
                    total += points;
                }
            }
        }
        return total;
    }

    private static bool IsDoneStatus(Dictionary<string, object?> row)
    {
        var status = GetStatusValue(row);
        if (string.IsNullOrEmpty(status)) return false;
        
        var statusLower = status.ToLower();
        return statusLower.Contains("done") || statusLower.Contains("resolved") || statusLower.Contains("closed");
    }

    private static string GetStatusValue(Dictionary<string, object?> row)
    {
        // 嘗試不同的狀態欄位名稱
        var statusKeys = new[] { "status", "Status", "issue_status", "Issue_Status" };
        
        foreach (var key in statusKeys)
        {
            if (row.TryGetValue(key, out var value) && value != null)
            {
                return value.ToString()?.Trim() ?? "";
            }
        }
        return "";
    }

    private static double ParseStoryPoints(Dictionary<string, object?> row, string storyPointsColumn)
    {
        if (string.IsNullOrEmpty(storyPointsColumn)) return 0;

        if (row.TryGetValue(storyPointsColumn, out var value) && value != null)
        {
            if (double.TryParse(value.ToString(), out var points))
            {
                return points;
            }
        }
        return 0;
    }

    private static List<Dictionary<string, object?>> ApplySprintFilter(List<Dictionary<string, object?>> data, string? sprintFilter)
    {
        if (string.IsNullOrEmpty(sprintFilter) || sprintFilter == "All")
        {
            return data;
        }

        if (sprintFilter == "No Sprints")
        {
            return data.Where(row => 
            {
                if (!row.ContainsKey("sprint")) return true;
                var sprintValue = row["sprint"]?.ToString()?.Trim();
                return string.IsNullOrEmpty(sprintValue);
            }).ToList();
        }

        return data.Where(row => 
        {
            if (!row.ContainsKey("sprint")) return false;
            var sprintValue = row["sprint"]?.ToString()?.Trim();
            return sprintValue == sprintFilter;
        }).ToList();
    }

    private static List<Dictionary<string, object?>> ApplyAssigneeFilter(List<Dictionary<string, object?>> data, string? assigneeFilter)
    {
        if (string.IsNullOrEmpty(assigneeFilter) || assigneeFilter == "All")
        {
            return data;
        }

        return data.Where(row => 
        {
            if (!row.ContainsKey("assignee")) return false;
            var assigneeValue = row["assignee"]?.ToString()?.Trim();
            return assigneeValue == assigneeFilter;
        }).ToList();
    }

    public static string? ExtractSheetIdFromUrl(string googleSheetUrl)
    {
        if (string.IsNullOrWhiteSpace(googleSheetUrl))
            return null;

        // Google Sheets URL patterns:
        // https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit#gid=0
        // https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit?usp=sharing
        // https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit
        // https://docs.google.com/spreadsheets/d/{SHEET_ID}
        var pattern = @"https://docs\.google\.com/spreadsheets/d/([a-zA-Z0-9-_]+)";
        var match = Regex.Match(googleSheetUrl, pattern);
        
        return match.Success ? match.Groups[1].Value : null;
    }

    public string GetCurrentSheetId() => _sheetId;

    public string GetSheetUrl() => $"https://docs.google.com/spreadsheets/d/{_sheetId}";

    public void UpdateSheetId(string newSheetId)
    {
        if (string.IsNullOrWhiteSpace(newSheetId))
            throw new ArgumentException("Sheet ID cannot be null or empty", nameof(newSheetId));

        _sheetId = newSheetId;
        ClearCache();
        
        // 持久化到檔案
        SaveSheetIdToFile(newSheetId);
    }

    private void SaveSheetIdToFile(string sheetId)
    {
        try
        {
            var configPath = "/app/current_sheet_id.txt";
            File.WriteAllText(configPath, sheetId);
        }
        catch (Exception ex)
        {
            // 記錄錯誤但不中斷服務
            Console.WriteLine($"Warning: Failed to save Sheet ID to file: {ex.Message}");
        }
    }

    private string LoadSheetIdFromFile(string defaultSheetId)
    {
        try
        {
            var configPath = "/app/current_sheet_id.txt";
            if (File.Exists(configPath))
            {
                var savedSheetId = File.ReadAllText(configPath).Trim();
                if (!string.IsNullOrWhiteSpace(savedSheetId))
                {
                    Console.WriteLine($"Loaded Sheet ID from file: {savedSheetId}");
                    return savedSheetId;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Warning: Failed to load Sheet ID from file: {ex.Message}");
        }
        
        return defaultSheetId;
    }

    public void ClearCache()
    {
        _cache = null;
        _cacheTimestamp = DateTime.MinValue;
        _sprintCache = null;
        _sprintCacheTimestamp = DateTime.MinValue;
    }

    // 新增：獲取 GetJiraSprintValues 表格的完整資料
    private string GetSprintValuesFullCsvUrl() => $"https://docs.google.com/spreadsheets/d/{_sheetId}/gviz/tq?tqx=out:csv&sheet={_sheetSprintInfo}";

    private async Task<List<Dictionary<string, object?>>> FetchSprintValuesDataAsync()
    {
        var url = GetSprintValuesFullCsvUrl();
        using var response = await _httpClient.GetAsync(url);
        response.EnsureSuccessStatusCode();

        using var stream = await response.Content.ReadAsStreamAsync();
        using var reader = new StreamReader(stream);
        using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
        {
            PrepareHeaderForMatch = args => args.Header.ToLower().Replace(" ", "_").Replace(".", "_")
        });

        var records = new List<Dictionary<string, object?>>();
        await foreach (var record in csv.GetRecordsAsync<dynamic>())
        {
            records.Add(new Dictionary<string, object?>(record));
        }

        return records;
    }

    public async Task<SprintInfo> GetSprintInfoAsync(string sprintName)
    {
        var sprintData = await FetchSprintValuesDataAsync();
        var sprintRecord = sprintData.FirstOrDefault(row => 
            row.ContainsKey("sprint_name") && 
            row["sprint_name"]?.ToString() == sprintName);

        if (sprintRecord == null)
        {
            throw new ArgumentException($"Sprint '{sprintName}' not found");
        }

        return new SprintInfo(
            SprintName: sprintRecord["sprint_name"]?.ToString() ?? "",
            SprintId: int.TryParse(sprintRecord["sprint_id"]?.ToString(), out var id) ? id : 0,
            BoardName: sprintRecord["board_name"]?.ToString() ?? "",
            State: sprintRecord["state"]?.ToString() ?? "",
            StartDate: TryParseDateTime(sprintRecord["startdate"]?.ToString()),
            EndDate: TryParseDateTime(sprintRecord["enddate"]?.ToString()),
            CompleteDate: TryParseDateTime(sprintRecord["completedate"]?.ToString()),
            Goal: sprintRecord["goal"]?.ToString() ?? ""
        );
    }

    public async Task<SprintBurndownResponse> GetSprintBurndownDataAsync(string sprintName)
    {
        // 獲取 Sprint 基本資訊
        var sprintInfo = await GetSprintInfoAsync(sprintName);
        
        // 獲取該 Sprint 的所有 Issues
        var allData = await FetchAndCacheDataAsync();
        var sprintIssues = allData.Where(row => 
            row.ContainsKey("sprint") && 
            row["sprint"]?.ToString() == sprintName).ToList();

        if (!sprintIssues.Any())
        {
            throw new ArgumentException($"No issues found for Sprint '{sprintName}'");
        }

        // 計算基本統計
        var storyPointsColumn = FindStoryPointsColumn(sprintIssues);
        var totalStoryPoints = CalculateTotalStoryPoints(sprintIssues, storyPointsColumn);
        
        var completedIssues = sprintIssues.Where(row => IsDoneStatus(row)).ToList();
        var completedStoryPoints = CalculateTotalStoryPoints(completedIssues, storyPointsColumn);
        var remainingStoryPoints = totalStoryPoints - completedStoryPoints;
        var completionRate = totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints * 100) : 0;

        // 計算工作日
        var startDate = sprintInfo.StartDate ?? DateTime.Now.AddDays(-14);
        var endDate = sprintInfo.EndDate ?? DateTime.Now;
        var now = DateTime.Now;

        var totalWorkingDays = CalculateWorkingDays(startDate, endDate);
        var daysElapsed = CalculateWorkingDays(startDate, DateTime.Now < endDate ? DateTime.Now : endDate);
        var remainingWorkingDays = Math.Max(0, totalWorkingDays - daysElapsed);

        // 判斷健康狀態
        string status;
        if (totalWorkingDays > 0)
        {
            var expectedCompletion = (double)daysElapsed / totalWorkingDays * 100;
            var deviation = completionRate - expectedCompletion;

            if (deviation >= -10) status = "normal";
            else if (deviation >= -25) status = "warning";
            else status = "danger";
        }
        else
        {
            status = "normal";
        }

        // 生成每日進度資料
        var dailyProgress = GenerateDailyProgress(startDate, endDate, totalStoryPoints, sprintIssues, storyPointsColumn ?? "Story Points", daysElapsed);
        var chartData = FormatChartData(dailyProgress);

        var sprintData = new SprintBurndownData(
            SprintName: sprintName,
            TotalStoryPoints: totalStoryPoints,
            CompletedStoryPoints: completedStoryPoints,
            RemainingStoryPoints: remainingStoryPoints,
            CompletionRate: Math.Round(completionRate, 2),
            Status: status,
            TotalWorkingDays: totalWorkingDays,
            DaysElapsed: daysElapsed,
            RemainingWorkingDays: remainingWorkingDays
        );

        return new SprintBurndownResponse(sprintData, dailyProgress, chartData);
    }

    public async Task<List<Dictionary<string, object?>>> GetSprintListAsync()
    {
        return await FetchSprintValuesDataAsync();
    }

    private int CalculateWorkingDays(DateTime startDate, DateTime endDate)
    {
        if (startDate >= endDate) return 0;

        var workingDays = 0;
        var current = startDate;

        while (current < endDate)
        {
            // Monday = 1, Sunday = 0
            if (current.DayOfWeek != DayOfWeek.Saturday && current.DayOfWeek != DayOfWeek.Sunday)
            {
                workingDays++;
            }
            current = current.AddDays(1);
        }

        return workingDays;
    }

    private List<DayProgress> GenerateDailyProgress(DateTime startDate, DateTime endDate, double totalPoints, 
        List<Dictionary<string, object?>> sprintIssues, string storyPointsColumn, int currentWorkingDay)
    {
        var dailyProgress = new List<DayProgress>();
        var current = startDate;
        var dayNumber = 0;
        var totalWorkingDays = CalculateWorkingDays(startDate, endDate);

        while (current <= endDate)
        {
            var isWorkingDay = current.DayOfWeek != DayOfWeek.Saturday && current.DayOfWeek != DayOfWeek.Sunday;

            if (isWorkingDay)
            {
                dayNumber++;

                // 理想燃燒線：線性下降（顯示完整的理想線）
                var idealRemaining = totalWorkingDays > 0 
                    ? totalPoints * (1.0 - (double)dayNumber / totalWorkingDays)
                    : totalPoints;

                // 實際燃燒線：只顯示到當前工作日為止
                double? actualRemaining = null;
                if (dayNumber <= currentWorkingDay)
                {
                    var completedByDate = sprintIssues
                        .Where(row => IsDoneStatus(row) && IsResolvedByDate(row, current))
                        .Sum(row => ParseStoryPoints(row, storyPointsColumn));
                    
                    actualRemaining = totalPoints - completedByDate;
                }

                dailyProgress.Add(new DayProgress(
                    Day: dayNumber,
                    Date: current.ToString("yyyy-MM-dd"),
                    IdealRemaining: Math.Round(idealRemaining, 2),
                    ActualRemaining: actualRemaining.HasValue ? Math.Round(actualRemaining.Value, 2) : (double?)null,
                    IsWorkingDay: true
                ));
            }

            current = current.AddDays(1);
        }

        return dailyProgress;
    }

    private List<Dictionary<string, object>> FormatChartData(List<DayProgress> dailyProgress)
    {
        return dailyProgress
            .Where(item => item.IsWorkingDay)
            .Select(item => new Dictionary<string, object>
            {
                ["day"] = item.Day,
                ["date"] = item.Date,
                ["ideal"] = item.IdealRemaining,
                ["actual"] = item.ActualRemaining
            })
            .ToList();
    }

    private bool IsResolvedByDate(Dictionary<string, object?> row, DateTime date)
    {
        var resolvedValue = row.ContainsKey("resolved") ? row["resolved"]?.ToString() : null;
        if (string.IsNullOrEmpty(resolvedValue)) return false;

        if (TryParseDateTime(resolvedValue) is DateTime resolvedDate)
        {
            return resolvedDate.Date <= date.Date;
        }

        return false;
    }

    private DateTime? TryParseDateTime(string? dateStr)
    {
        if (string.IsNullOrWhiteSpace(dateStr)) return null;

        var formats = new[] {
            "yyyy-MM-dd HH:mm:ss",
            "yyyy-MM-dd",
            "M/d/yyyy H:mm:ss",
            "M/d/yyyy",
            "MM/dd/yyyy HH:mm:ss",
            "MM/dd/yyyy"
        };

        foreach (var format in formats)
        {
            if (DateTime.TryParseExact(dateStr, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var result))
            {
                return result;
            }
        }

        if (DateTime.TryParse(dateStr, out var parsed))
        {
            return parsed;
        }

        return null;
    }

    // Task Dependency Methods
    public async Task<TaskDependencyResponse> GetTaskDependenciesAsync(string taskKey)
    {
        var data = await FetchAndCacheDataAsync();
        
        // 找到目標任務
        var task = data.FirstOrDefault(row => 
            row.TryGetValue("key", out var key) && key?.ToString() == taskKey);
        
        if (task == null)
        {
            throw new ArgumentException($"Task with key '{taskKey}' not found");
        }
        
        var taskInfo = ConvertToTaskInfo(task);
        
        // 解析依賴關係
        var dependencies = GetTaskDependencies(data, taskKey);
        var dependents = GetTaskDependents(data, taskKey);
        
        return new TaskDependencyResponse(
            Task: taskInfo,
            Dependencies: dependencies,
            Dependents: dependents,
            HasDependencies: dependencies.Count > 0 || dependents.Count > 0
        );
    }
    
    private static List<TaskInfo> GetTaskDependencies(List<Dictionary<string, object?>> data, string taskKey)
    {
        var dependencies = new List<TaskInfo>();
        
        // 找到目標任務的 Dependency 欄位
        var task = data.FirstOrDefault(row => 
            row.TryGetValue("key", out var key) && key?.ToString() == taskKey);
        
        if (task != null && task.TryGetValue("dependency", out var dependencyValue) && dependencyValue != null)
        {
            var dependencyStr = dependencyValue.ToString()?.Trim();
            if (!string.IsNullOrEmpty(dependencyStr))
            {
                // 解析依賴的任務 Key（可能是逗號分隔）
                var dependencyKeys = dependencyStr.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(k => k.Trim())
                    .Where(k => !string.IsNullOrEmpty(k));
                
                foreach (var depKey in dependencyKeys)
                {
                    var depTask = data.FirstOrDefault(row => 
                        row.TryGetValue("key", out var key) && key?.ToString() == depKey);
                    
                    if (depTask != null)
                    {
                        dependencies.Add(ConvertToTaskInfo(depTask));
                    }
                }
            }
        }
        
        return dependencies;
    }
    
    private static List<TaskInfo> GetTaskDependents(List<Dictionary<string, object?>> data, string taskKey)
    {
        var dependents = new List<TaskInfo>();
        
        // 找到所有依賴於此任務的其他任務
        foreach (var row in data)
        {
            if (row.TryGetValue("dependency", out var dependencyValue) && dependencyValue != null)
            {
                var dependencyStr = dependencyValue.ToString()?.Trim();
                if (!string.IsNullOrEmpty(dependencyStr))
                {
                    var dependencyKeys = dependencyStr.Split(',', StringSplitOptions.RemoveEmptyEntries)
                        .Select(k => k.Trim())
                        .Where(k => !string.IsNullOrEmpty(k));
                    
                    if (dependencyKeys.Contains(taskKey))
                    {
                        dependents.Add(ConvertToTaskInfo(row));
                    }
                }
            }
        }
        
        return dependents;
    }
    
    private static TaskInfo ConvertToTaskInfo(Dictionary<string, object?> row)
    {
        return new TaskInfo(
            Key: row.TryGetValue("key", out var key) ? key?.ToString() ?? "" : "",
            Summary: row.TryGetValue("summary", out var summary) ? summary?.ToString() ?? "" : "",
            Status: row.TryGetValue("status", out var status) ? status?.ToString() ?? "" : "",
            Assignee: row.TryGetValue("assignee", out var assignee) ? assignee?.ToString() : null,
            Parent: row.TryGetValue("parent", out var parent) ? parent?.ToString() : null,
            IssueType: row.TryGetValue("issue_type", out var issueType) ? issueType?.ToString() : null,
            StoryPoints: row.TryGetValue("story_points", out var storyPoints) ? 
                (double.TryParse(storyPoints?.ToString(), out var sp) ? sp : null) : null,
            Priority: row.TryGetValue("priority", out var priority) ? priority?.ToString() : null
        );
    }
}
