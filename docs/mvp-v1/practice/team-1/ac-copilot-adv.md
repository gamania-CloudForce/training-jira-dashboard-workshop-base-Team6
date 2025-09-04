# team-1/ac-copilot-adv.md

## User Story
作為團隊成員，我希望能在 Dashboard 上看到每個 Sprint 的目標與實際完成情況，以便提升目標意識。

---

### AC01: 正常流程 - 顯示 Sprint 目標與完成情況
場景：使用者成功查看 Sprint 目標與完成情況
Given 使用者已登入並進入 Jira Dashboard
And 系統已成功取得所有 Sprint 資料
When 使用者選擇某一個 Sprint
Then Dashboard 應顯示該 Sprint 的目標描述
And 應顯示該 Sprint 的實際完成情況（如 Story Points 完成率）

---

### AC02: 邊界條件 - Sprint 無目標或無完成進度
場景：Sprint 未設定目標或尚未有完成進度
Given 使用者已登入並進入 Jira Dashboard
And 系統取得的 Sprint 資料中，部分 Sprint 未設定目標或尚未有完成進度
When 使用者選擇該 Sprint
Then Dashboard 應明確顯示「尚未設定目標」或「尚無完成進度」提示
And 不顯示空白或錯誤訊息

---

### AC03: 異常情況 - Sprint 資料取得失敗
場景：Sprint 資料載入失敗
Given 使用者已登入並進入 Jira Dashboard
And 系統因網路或 API 問題無法取得 Sprint 資料
When 使用者嘗試查看 Sprint 目標與完成情況
Then Dashboard 應顯示「資料載入失敗，請稍後再試」的友善提示
And 提供重新整理或重試的選項
