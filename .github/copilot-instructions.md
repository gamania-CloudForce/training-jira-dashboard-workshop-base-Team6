# Copilot Instructions

## 專案概述
這是一個 AI 驅動敏捷開發工作坊專案，採用現代化全端技術建構 Jira Dashboard。專案結構為 monorepo，整合 Google Sheets 作為資料來源。

## 技術堆疊

### 前端技術
- **Next.js 15** (App Router)
- **React 18** + **TypeScript**
- **shadcn/ui** + **Tailwind CSS**
- **Recharts** (資料視覺化)
- **Jest + React Testing Library** (測試)

### 後端技術
- **.NET 8** + **C#**
- **ASP.NET Core Web API**
- **Google Sheets API** 整合
- **xUnit** (測試框架)

### 開發環境
- **Docker** 容器化開發
- **Makefile** / **workshop.bat** 快速指令

## 代碼風格規範

### 前端 (TypeScript/React)
- 使用 **TypeScript** 確保型別安全
- 使用 **2 個空格** 縮排
- 使用 **單引號** 而非雙引號
- 函數名使用 **camelCase**
- 組件名使用 **PascalCase**
- 使用 **函數式組件** 和 **React Hooks**
- 避免使用 `any` 型別，優先使用具體型別

### 後端 (C#/.NET)
- 遵循 **C# 命名約定**
- 類別名使用 **PascalCase**
- 方法名使用 **PascalCase**
- 變數名使用 **camelCase**
- 私有欄位使用 **_camelCase**
- 常數使用 **UPPER_CASE**
- 使用 **async/await** 處理非同步操作

## 專案結構

### 前端結構
```
frontend/
├── app/                    # Next.js App Router
├── components/             # React 元件
│   ├── ui/                # shadcn/ui 基礎元件
│   └── *.tsx              # 業務元件
├── hooks/                 # 自訂 React Hooks
├── lib/                   # 工具函式和配置
├── public/                # 靜態資源
└── __tests__/             # 測試檔案
```

### 後端結構
```
backend-dotnet/
├── Controllers/           # API 控制器
├── Models/               # 資料模型
├── Services/             # 業務邏輯服務
├── Tests/                # 單元測試
├── appsettings.json      # 配置檔案
└── Program.cs            # 應用程式入口
```

## API 設計規範

### RESTful 端點
- 使用標準 HTTP 動詞 (GET, POST, PUT, DELETE)
- 路由使用 **kebab-case**: `/api/health`, `/api/table/summary`
- 回應格式統一使用 JSON
- 錯誤處理使用標準 HTTP 狀態碼

### 常用端點
| 端點 | 方法 | 功能 |
|------|------|------|
| `/api/health` | GET | 健康檢查 |
| `/api/table/summary` | GET | 表格摘要 |
| `/api/table/data` | GET | 分頁資料查詢 |
| `/api/table/filters` | GET | 篩選選項 |

## 測試規範

### 前端測試
- 每個元件都需要有對應的測試檔案
- 使用 **Jest** 和 **React Testing Library**
- 測試檔案命名為 `*.test.tsx`
- 測試檔案放在 `__tests__/` 目錄

### 後端測試
- 使用 **xUnit** 測試框架
- 測試檔案命名為 `*Tests.cs`
- 包含單元測試和整合測試
- 測試 API 端點和服務邏輯

## Docker 開發環境

### 常用指令
```bash
# macOS/Linux
make workshop-start      # 啟動環境
make health             # 檢查狀態
make test               # 執行所有測試
make workshop-stop      # 停止環境

# Windows
workshop.bat workshop-start
workshop.bat health
workshop.bat test
workshop.bat workshop-stop
```

## Google Sheets 整合

### 資料來源
- **Google Sheets** 作為主要資料來源
- 使用 **Google Sheets API** 讀取資料
- 實作 **5 分鐘快取** 提升效能
- 支援 **分頁、排序、篩選** 功能

### 資料處理
- 限制讀取範圍至 **Column W**
- 實作 **錯誤處理** 和 **重試機制**
- 使用 **非同步處理** 避免阻塞

## AI 輔助開發流程

### 四階段開發流程
1. **Feature Spec 撰寫** - 使用 `docs/guides/feature-spec-template.md`
2. **User Story 拆分** - 使用 `docs/guides/user-story-guide.md`
3. **Acceptance Criteria 設計** - 使用 `docs/guides/acceptance-criteria-guide.md`
4. **Test Case 產出** - 使用 `docs/guides/testcase-guide.md`

## 最佳實踐

### 開發流程
- 先討論需求再編碼
- 使用 **Git 分支** 進行功能開發
- 遵循 **約定式提交** 訊息格式
- 程式碼需要通過測試才能合併

### 效能優化
- 前端使用 **React.memo** 避免不必要的重渲染
- 後端實作 **資料快取** 機制
- 使用 **分頁** 避免大量資料載入
- 實作 **樂觀更新** 提升使用者體驗

### 安全性
- API 端點加入適當的 **錯誤處理**
- 驗證所有輸入資料
- 使用 **HTTPS** 進行資料傳輸
- 實作 **CORS** 設定

## 特殊注意事項

### 原型 vs 生產功能
- **Jira Dashboard** 頁面為教學原型，使用硬編碼假資料
- **Google Sheets Table** 頁面為生產就緒功能，整合真實 API
- 工作坊目標是學習如何從原型轉換為生產功能

### 容器化開發
- 所有開發都在 **Docker 容器** 內進行
- 修改程式碼會 **即時生效**，無需重啟容器
- 使用 **Hot Reload** 提升開發效率

## 文件參考
- [學員參與指南](./docs/guides/student-setup-guide.md)
- [技術架構概覽](./docs/tech-overview.md)
- [Docker 設定指南](./docs/guides/docker_setup_guide.md)
- [如何使用 GitHub Copilot](./docs/how-to-use-github-copilot.md)
