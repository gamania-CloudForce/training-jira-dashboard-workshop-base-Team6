using JiraDashboard.Services;
using JiraDashboard.Models;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddHttpClient();
builder.Services.AddSingleton<GoogleSheetsService>(provider =>
{
    var httpClient = provider.GetRequiredService<IHttpClientFactory>().CreateClient();
    var configuration = provider.GetRequiredService<IConfiguration>();
    return new GoogleSheetsService(httpClient, configuration);
});

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(
        policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

var app = builder.Build();

// Use CORS
app.UseCors();

// Configure the HTTP request pipeline.
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.MapGet("/api/table/summary", async (GoogleSheetsService sheetsService) => 
{
    try
    {
        return Results.Ok(await sheetsService.GetSummaryAsync());
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapGet("/api/table/data", async (
    [FromServices] GoogleSheetsService sheetsService,
    [FromQuery] int page = 1,
    [FromQuery(Name = "page_size")] int pageSize = 100,
    [FromQuery(Name = "sort_by")] string sortBy = "key",
    [FromQuery(Name = "sort_order")] string sortOrder = "asc",
    [FromQuery] string? sprint = null) =>
{
    try
    {
        var result = await sheetsService.GetPaginatedDataAsync(page, pageSize, sortBy, sortOrder, sprint);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapGet("/api/table/sprints", async (GoogleSheetsService sheetsService) => 
{
    try
    {
        var sprints = await sheetsService.GetSprintOptionsAsync();
        return Results.Ok(new { sprints });
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// Dashboard MVP API endpoints
app.MapGet("/api/dashboard/stats", async (
    [FromServices] GoogleSheetsService sheetsService,
    [FromQuery] string? sprint = null) =>
{
    try
    {
        var stats = await sheetsService.GetDashboardStatsAsync(sprint);
        return Results.Ok(stats);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapGet("/api/dashboard/status-distribution", async (
    [FromServices] GoogleSheetsService sheetsService,
    [FromQuery] string? sprint = null) =>
{
    try
    {
        var distribution = await sheetsService.GetStatusDistributionAsync(sprint);
        return Results.Ok(distribution);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

// Sprint Burndown API endpoints
app.MapGet("/api/sprint/burndown/{sprintName}", async (string sprintName, GoogleSheetsService sheetsService) =>
{
    try
    {
        var burndownData = await sheetsService.GetSprintBurndownDataAsync(sprintName);
        return Results.Ok(burndownData);
    }
    catch (ArgumentException ex)
    {
        return Results.NotFound(ex.Message);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Failed to get sprint burndown data: {ex.Message}");
    }
});

app.MapGet("/api/sprint/info/{sprintName}", async (string sprintName, GoogleSheetsService sheetsService) =>
{
    try
    {
        var sprintInfo = await sheetsService.GetSprintInfoAsync(sprintName);
        return Results.Ok(sprintInfo);
    }
    catch (ArgumentException ex)
    {
        return Results.NotFound(ex.Message);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Failed to get sprint info: {ex.Message}");
    }
});

app.MapGet("/api/sprint/list", async (GoogleSheetsService sheetsService) =>
{
    try
    {
        var sprintData = await sheetsService.GetSprintListAsync();
        var sprints = sprintData.Select(row => new
        {
            sprint_name = row.ContainsKey("sprint_name") ? row["sprint_name"]?.ToString() : "",
            sprint_id = row.ContainsKey("sprint_id") && int.TryParse(row["sprint_id"]?.ToString(), out var id) ? id : 0,
            board_name = row.ContainsKey("board_name") ? row["board_name"]?.ToString() : "",
            state = row.ContainsKey("state") ? row["state"]?.ToString() : "",
            start_date = row.ContainsKey("startdate") ? row["startdate"]?.ToString() : null,
            end_date = row.ContainsKey("enddate") ? row["enddate"]?.ToString() : null,
            goal = row.ContainsKey("goal") ? row["goal"]?.ToString() : ""
        }).ToList();

        return Results.Ok(new { sprints });
    }
    catch (Exception ex)
    {
        return Results.Problem($"Failed to get sprint list: {ex.Message}");
    }
});

// Task Dependency API endpoints
app.MapGet("/api/task/{taskKey}/dependencies", async (string taskKey, GoogleSheetsService sheetsService) =>
{
    try
    {
        var dependencies = await sheetsService.GetTaskDependenciesAsync(taskKey);
        return Results.Ok(dependencies);
    }
    catch (ArgumentException ex)
    {
        return Results.NotFound(ex.Message);
    }
    catch (Exception ex)
    {
        return Results.Problem($"Failed to get task dependencies: {ex.Message}");
    }
});

// Configuration API endpoints
app.MapGet("/api/config/sheet", (GoogleSheetsService sheetsService) =>
{
    try
    {
        var sheetId = sheetsService.GetCurrentSheetId();
        var sheetUrl = sheetsService.GetSheetUrl();
        return Results.Ok(new SheetConfigInfo(sheetId, sheetUrl));
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.MapPost("/api/config/sheet", (
    [FromBody] UpdateSheetConfigRequest request,
    [FromServices] GoogleSheetsService sheetsService) =>
{
    try
    {
        var extractedSheetId = GoogleSheetsService.ExtractSheetIdFromUrl(request.GoogleSheetUrl);
        
        if (string.IsNullOrEmpty(extractedSheetId))
        {
            return Results.BadRequest(new UpdateSheetConfigResponse(
                false, 
                "Invalid Google Sheets URL. Please provide a valid Google Sheets URL.", 
                null));
        }

        // 動態更新 SheetId 並清除快取
        sheetsService.UpdateSheetId(extractedSheetId);
        
        return Results.Ok(new UpdateSheetConfigResponse(
            true, 
            $"Sheet ID updated successfully to: {extractedSheetId}. Changes are now active.", 
            extractedSheetId));
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
});

app.Run();

// 讓測試可以存取 Program 類別
public partial class Program { }
