# rawData 資料表架構文件

本文件詳細說明| 17 | **Story Points** | number | 敏捷開發故事點數 | `1`, `3`, `5`, `8` |
| 18 | **Status Category** | string | 狀態大分類 | `To Do`, `In Progress`, `Done` |
| 19 | **Status Category Changed** | date | 狀態分類最後變更時間 | `2024-08-17 14:30:00` |
| 20 | **Time Spent** | number | 總計花費時間（秒為單位） | `3600`, `7200` |
| 21 | **Created** | date | Issue 建立時間 | `2024-07-19 13:20:52` |
| 22 | **Updated** | date | 最後更新時間 | `2024-08-17 16:45:12` |
| 23 | **Resolved** | date | 解決/完成時間 | `2024-08-20 09:15:30` |
| 24 | **Project.name** | string | Jira 專案完整識別名稱 | `training-jira-dashboard` |
| 25 | **Dependency** | string | 任務依賴關係，記錄此任務所依賴的其他任務 Key | `PS-25,IHAIC-3`, `PS-27`, 空值表示無依賴 |
| 26 | **Refine Sprint 公式** | string | Sprint 精煉相關的計算公式或標記 | 公式內容或標記值 |Sheets 中 rawData 資料表的欄位定義，以支援嚴格限制下的產品開發流程。

## rawData 資料表完整架構

此架構按照 Google Sheets 的實際欄位順序定義，共包含 26 個欄位。所有 vibe coding 開發都必須基於此嚴格的資料結構限制。

### 完整欄位列表（按順序排列）

| 欄位順序 | 欄位名稱 | 類型 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| 1 | **Key** | string | Issue 的唯一識別碼，格式為 `PROJECT-NUMBER` | `IHAIC-1`, `PS-28` |
| 2 | **Issue Type** | string | Issue 的類型分類 | `Epic`, `Story`, `Task`, `Bug` |
| 3 | **Projects** | string | 所屬專案的簡稱或代碼 | `Project Phoenix`, `IHAIC` |
| 4 | **Summary** | string | Issue 的標題或簡短描述 | `使用者登入功能優化` |
| 5 | **parent** | string | 父級 Issue 的 Key（建立層級關係） | `IHAIC-1`, 空值表示無父級 |
| 6 | **Status** | string | 當前工作流程狀態 | `Backlog`, `Evaluated`, `To Do`, `In Progress`, `Waiting`, `Ready to Verify`, `Done`, `Invalid`, `Routine` |
| 7 | **Sprint** | string | 所屬的 Sprint 名稱或編號 | `Sprint 1`, `Current Sprint` |
| 8 | **Due date** | date | 預計完成到期日 | `2024-12-31` |
| 9 | **Priority** | string | 優先級等級 | `Highest`, `High`, `Medium`, `Low`, `Lowest` |
| 10 | **Urgency** | string | 緊急程度分類 | `ASAP`, `In 1 week`, `In 2 weeks`, `In 1 Month`, `In 1 Q` |
| 11 | **T-Size** | string | T-Shirt Size 估算法 | `XS`, `S`, `M`, `L`, `XL`, `2XL`, `Unknown` |
| 12 | **Confidence** | string | 估算信心程度 | `Highest`, `High`, `Medium`, `Low`, `Lowest` |
| 13 | **Assignee** | string | 任務負責人或指派對象 | `張小明`, `李大華`, 空值表示未指派 |
| 14 | **Clients** | string | 相關客戶或客戶群組 | `客戶A`, `內部團隊` |
| 15 | **TaskTags** | string | 任務標籤（用於分類和搜尋） | `frontend`, `backend`, `urgent` |
| 16 | **BusinessPoints** | number | 商業價值點數 | `8`, `13`, `21` |
| 17 | **Story Points** | number | 敏捷開發故事點數 | `1`, `3`, `5`, `8` |
| 17 | **Status Category** | string | 狀態大分類 | `To Do`, `In Progress`, `Done` |
| 18 | **Status Category Changed** | date | 狀態分類最後變更時間 | `2024-08-17 14:30:00` |
| 19 | **Time Spent** | number | 總計花費時間（秒為單位） | `3600`, `7200` |
| 20 | **Created** | date | Issue 建立時間 | `2024-07-19 13:20:52` |
| 21 | **Updated** | date | 最後更新時間 | `2024-08-17 16:45:12` |
| 22 | **Resolved** | date | 解決/完成時間 | `2024-08-20 09:15:30` |
| 23 | **Project.name** | string | Jira 專案完整識別名稱 | `training-jira-dashboard` |

### 欄位分類說明

#### 🔑 核心識別欄位 (1-5)
- **Key**: 系統唯一標識符，不可重複
- **Issue Type**: 工作項目分類，影響工作流程
- **Projects**: 專案歸屬，用於專案篩選
- **Summary**: 人類可讀的描述，用於搜尋和識別
- **parent**: 建立階層關係，支援 Epic > Story > Task 結構

#### 📋 工作流程欄位 (6-8)
- **Status**: 當前工作狀態，決定在看板上的位置
  - 完整狀態流程：`Backlog` → `Evaluated` → `To Do` → `In Progress` → `Waiting` → `Ready to Verify` → `Done`
  - 特殊狀態：`Invalid`（無效項目）、`Routine`（例行作業）
- **Sprint**: 敏捷迭代週期，支援 Sprint 篩選功能
- **Due date**: 時程管理，用於逾期提醒

#### ⚡ 優先級與緊急度欄位 (9-10)
- **Priority**: 重要程度排序
- **Urgency**: 時間敏感度，與 Priority 配合使用

#### 📏 估算與評分欄位 (11-16)
- **T-Size**: 相對大小估算，用於容量規劃
- **Confidence**: 估算可信度，風險管理指標
- **Clients**: 客戶導向分類
- **TaskTags**: 多維度標籤系統
- **BusinessPoints**: 商業價值量化
- **Story Points**: 技術複雜度量化

#### 📊 狀態追蹤欄位 (17-19)
- **Status Category**: 簡化的三階段分類
- **Status Category Changed**: 狀態變更時間戳
- **Time Spent**: 實際工作時間記錄

#### 🕒 時間軸欄位 (20-23)
- **Created**: 起始時間點
- **Updated**: 最近活動時間
- **Resolved**: 完成時間點
- **Project.name**: 專案完整識別

## 嚴格資料限制規範

### 資料類型定義

| 類型 | 說明 | 格式要求 | 空值處理 |
|-----|------|---------|----------|
| **string** | 文字資料 | UTF-8 編碼，無長度限制 | 允許空值，顯示為空字串 |
| **number** | 數值資料 | 整數或小數，支援負數 | 允許空值，計算時視為 0 |
| **date** | 日期時間 | ISO 8601 格式 `YYYY-MM-DD HH:mm:ss` | 允許空值，顯示為 null |

### API 資料存取限制

#### Google Sheets 限制
- **讀取範圍**: 嚴格限制為 `A:Y` 欄位（對應 1-26 欄位）
- **快取機制**: 5 分鐘快取，資料可能延遲最多 5 分鐘
- **並發限制**: 避免頻繁請求，遵循 API 配額限制
- **權限要求**: 僅需讀取權限，不需要寫入權限

#### 前端處理限制
- **必須處理空值**: 所有欄位都可能為空，需要適當的空值處理
- **數值計算安全**: number 類型空值在計算時需轉換為 0
- **日期格式一致**: 所有日期顯示必須統一格式化
- **效能考量**: 大量資料時需考慮分頁或虛擬化

### 開發最佳實踐

#### 🎯 **資料存取模式**
```typescript
// ✅ 正確：按照架構定義存取
const issueKey = row[0];          // Key (欄位1)
const issueType = row[1];         // Issue Type (欄位2)
const projects = row[2];          // Projects (欄位3)
const storyPoints = row[15];      // Story Points (欄位16)

// ❌ 錯誤：假設欄位位置或名稱
const key = row.key;              // 不保證欄位名稱
const points = row['story_points']; // 不保證欄位名稱格式
```

#### 📊 **統計計算模式**
```typescript
// ✅ 正確：安全的數值計算
const totalStoryPoints = data.reduce((sum, row) => {
  const points = row[15]; // Story Points 欄位
  return sum + (Number(points) || 0);
}, 0);

// ✅ 正確：狀態分布統計（按固定順序）
const statusOrder = [
  'Backlog', 'Evaluated', 'To Do', 'In Progress', 
  'Waiting', 'Ready to Verify', 'Done', 'Invalid', 'Routine'
];

const statusDistribution = data.reduce((acc, row) => {
  const status = row[5] || 'Unknown'; // Status 欄位
  acc[status] = (acc[status] || 0) + 1;
  return acc;
}, {});

// ✅ 正確：按照業務流程順序排序
const orderedDistribution = statusOrder.map(status => ({
  status,
  count: statusDistribution[status] || 0
}));
```

### 錯誤處理要求

1. **空值處理**: 所有欄位讀取都必須處理空值情況
2. **類型安全**: 數值計算前必須驗證資料類型
3. **邊界檢查**: 陣列存取前必須檢查索引範圍
4. **錯誤恢復**: API 失敗時提供合理的備援機制

此嚴格限制確保所有開發者在相同的資料結構約束下工作，提升程式碼的一致性和可維護性。

---

## GetJiraSprintValues 資料表

此資料表記錄所有 Sprint 的完整資訊，用於 Sprint 篩選功能和敏捷開發週期管理。

### 完整欄位列表（按順序排列）

| 欄位順序 | 欄位名稱 | 類型 | 說明 | 範例值 |
|---------|---------|------|------|--------|
| A | **Board ID** | number | 看板的唯一識別碼 | `4`, `5`, `10` |
| B | **Board Name** | string | 看板的顯示名稱 | `DEMO1 board`, `Project Phoenix Board` |
| C | **Sprint Name** | string | Sprint 的完整名稱 | `DEMO1-Sprint 1`, `Sprint 2024-Q1` |
| D | **Sprint ID** | number | Sprint 的唯一識別碼 | `11`, `12`, `15` |
| E | **state** | string | Sprint 當前狀態 | `active`, `closed`, `future` |
| F | **startDate** | date | Sprint 開始日期時間 | `3/22/2025 17:44:23` |
| G | **endDate** | date | Sprint 預計結束日期時間 | `4/5/2025 17:44:19` |
| H | **completeDate** | date | Sprint 實際完成日期時間 | `4/3/2025 14:30:00`（可能為空） |
| I | **goal** | string | Sprint 目標描述 | `DEMO1-Sprint 1 Goal - 階段性展示` |

### 欄位分類說明

#### 🆔 **識別欄位 (A-D)**
- **Board ID**: 數值型看板標識符，對應 Jira 系統內部 ID
- **Board Name**: 使用者友善的看板名稱，用於顯示
- **Sprint Name**: Sprint 的完整名稱，**用於 rawData 表 Sprint 欄位的對應**
- **Sprint ID**: 數值型 Sprint 標識符，對應 Jira 系統內部 ID

#### 🔄 **狀態管理欄位 (E)**
- **state**: Sprint 生命週期狀態
  - `future`: 未來計劃的 Sprint
  - `active`: 目前進行中的 Sprint  
  - `closed`: 已結束的 Sprint

#### 📅 **時間管理欄位 (F-H)**
- **startDate**: Sprint 正式開始的日期時間
- **endDate**: Sprint 預計結束的日期時間
- **completeDate**: Sprint 實際完成的日期時間（僅 closed 狀態有值）

#### 🎯 **目標欄位 (I)**
- **goal**: Sprint 的業務目標或成果描述

### Sprint 篩選器整合邏輯

#### 篩選選項生成規則
```typescript
// ✅ 正確：從 GetJiraSprintValues 生成篩選選項
const generateSprintOptions = (sprintData) => {
  const options = ['All']; // 預設選項
  
  // 取得 Sprint Name 欄位（Column C，索引 2）
  const sprintNames = sprintData
    .map(row => row[2]) // Sprint Name 欄位
    .filter(name => name && name.trim() !== '') // 過濾空值
    .filter(name => name !== 'N/A') // 過濾無效值
    .sort(); // 字母排序
  
  options.push(...sprintNames);
  options.push('No Sprints'); // 最後選項
  
  return options;
};
```

#### 與 rawData 表整合
```typescript
// ✅ 正確：Sprint 篩選邏輯
const filterBySprintName = (rawData, selectedSprint) => {
  if (selectedSprint === 'All') {
    return rawData; // 顯示全部
  }
  
  if (selectedSprint === 'No Sprints') {
    // 篩選 Sprint 欄位為空的項目（rawData 欄位 7）
    return rawData.filter(row => !row[6] || row[6].trim() === '');
  }
  
  // 篩選指定 Sprint（rawData 欄位 7 對應 GetJiraSprintValues 欄位 C）
  return rawData.filter(row => row[6] === selectedSprint);
};
```

### 資料完整性要求

#### 必填欄位
- **Board ID** (A): 必須有值，數值型
- **Board Name** (B): 必須有值，用於顯示
- **Sprint Name** (C): 必須有值，**是 Sprint 篩選的關鍵欄位**
- **Sprint ID** (D): 必須有值，數值型
- **state** (E): 必須為 `future`, `active`, `closed` 之一

#### 重要欄位
- **startDate** (F): 建議有值，用於時程顯示
- **endDate** (G): 建議有值，用於時程計算
- **goal** (I): 建議有值，用於 Sprint 目標展示

#### 選填欄位
- **completeDate** (H): 僅 `closed` 狀態的 Sprint 有值

### 狀態值定義

| state 值 | 中文說明 | 使用情境 |
|---------|---------|---------|
| `future` | 未來 Sprint | 已規劃但尚未開始的 Sprint |
| `active` | 進行中 Sprint | 目前正在執行的 Sprint（通常只有一個）|
| `closed` | 已結束 Sprint | 已完成的 Sprint，有 completeDate |

### API 存取限制

#### Google Sheets 限制
- **讀取範圍**: `A:I` 欄位（對應 A-I 共 9 個欄位）
- **主要用途**: 生成 Sprint 篩選器選項（使用 Column C）
- **快取機制**: 與 rawData 表共用 5 分鐘快取
- **權限要求**: 僅需讀取權限

#### 前端處理要求
- **空值處理**: completeDate 可能為空值，需要適當處理
- **日期格式**: 統一格式化所有日期欄位
- **狀態驗證**: 確保 state 欄位值在允許範圍內

### 範例資料

```
Board ID | Board Name    | Sprint Name     | Sprint ID | state  | startDate           | endDate             | completeDate | goal
4        | DEMO1 board   | DEMO1-Sprint 1  | 11        | active | 3/22/2025 17:44:23 | 4/5/2025 17:44:19  |              | DEMO1-Sprint 1 Goal - 階段性展示
4        | DEMO1 board   | DEMO1-Sprint 2  | 12        | future | 4/6/2025 09:00:00  | 4/19/2025 18:00:00 |              | DEMO1-Sprint 2 Goal - 功能完善
3        | DEMO1 board   | DEMO1-Sprint 0  | 10        | closed | 3/1/2025 09:00:00  | 3/21/2025 18:00:00 | 3/21/2025 17:30:00 | DEMO1-Sprint 0 Goal - 初始設定
```

---

## rawStatusTime 資料表

此資料表記錄每個 Issue 的狀態變更歷史，用於追蹤和分析狀態轉換的時間軸。

### 欄位說明

| 欄位名稱 | 類型 | 說明 |
|---------|------|------|
| **Key** | string | Issue 的唯一識別碼，與 rawData 表中的 Key 相對應 |
| **Summary** | string | Issue 的標題或簡短描述 |
| **Created** | date | Issue 建立時間 |
| **Status Transition.date** | date | 狀態變更發生的時間 |
| **Status Transition.from** | string | 變更前的狀態 |
| **Status Transition.to** | string | 變更後的狀態 |

### 資料結構說明

每個 Issue 可能有多筆記錄，每筆記錄代表一次狀態變更。透過這些記錄可以重建完整的狀態變更時間軸。

### 使用範例

以 PS-28 為例，其狀態變更歷史如下：

| Key | Summary | Created | Status Transition.date | Status Transition.from | Status Transition.to |
|-----|---------|---------|----------------------|---------------------|-------------------|
| PS-28 | 顧問講師服務-Task-2 | 7/19/2024 13:20:52 | 9/15/2024 18:09:38 | Routine | Done |
| PS-28 | 顧問講師服務-Task-2 | 7/19/2024 13:20:52 | 7/22/2024 17:05:26 | To Do | Routine |
| PS-28 | 顧問講師服務-Task-2 | 7/19/2024 13:20:52 | 7/19/2024 13:20:52 | Backlog | To Do |

時間軸解讀：
- **7/19/2024 13:20:52**：建立 Issue，初始狀態為 Backlog
- **7/19/2024 13:20:52**：狀態從 Backlog 變更為 To Do
- **7/22/2024 17:05:26**：狀態從 To Do 變更為 Routine
- **9/15/2024 18:09:38**：狀態從 Routine 變更為 Done

### 資料分析用途

1. **週期時間計算**：計算 Issue 在各狀態停留的時間
2. **流程效率分析**：識別瓶頸和延遲點
3. **趨勢追蹤**：分析團隊的工作流程變化
4. **SLA 監控**：確保符合服務等級協議

### 注意事項

1. 記錄按時間倒序排列（最新的變更在前）
2. Created 欄位在每筆記錄中都相同，代表 Issue 的原始建立時間
3. 第一筆狀態變更通常發生在建立時，from 狀態可能是系統預設值