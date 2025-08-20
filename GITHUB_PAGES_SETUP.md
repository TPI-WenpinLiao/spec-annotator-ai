# GitHub Pages 部署設定

## 完成的設定

1. ✅ 建立了 GitHub Actions 工作流程 (`.github/workflows/deploy.yml`)
2. ✅ 更新了 Vite 配置以支援 GitHub Pages 路徑
3. ✅ 新增了專用的建置腳本

## 需要手動完成的步驟

### 1. 在 GitHub 儲存庫中啟用 GitHub Pages

1. 前往您的 GitHub 儲存庫
2. 點擊 **Settings** 標籤
3. 在左側選單中找到 **Pages**
4. 在 "Source" 區域選擇 **GitHub Actions**
5. 儲存設定

### 2. 確保分支名稱正確

GitHub Actions 工作流程設定為在 `main` 分支推送時觸發。如果您的預設分支是 `master`，請修改 `.github/workflows/deploy.yml` 檔案中的 `branches` 設定。

### 3. 推送變更

將這些變更推送到您的 GitHub 儲存庫：

```bash
git add .
git commit -m "Add GitHub Actions workflow for GitHub Pages deployment"
git push origin main
```

## 部署後訪問

部署完成後，您的網站將可以在以下網址訪問：
```
https://[your-username].github.io/spec-annotator-ai/
```

## 本地測試

您可以使用以下指令在本地測試 GitHub Pages 版本：

```bash
npm run build:gh-pages
npm run preview
```

## 工作流程說明

- **觸發條件**: 推送到 `main` 分支或手動觸發
- **建置環境**: Ubuntu Latest with Node.js 20
- **部署路徑**: `/spec-annotator-ai/`
- **建置產物**: `dist` 資料夾的內容

## 故障排除

如果部署失敗，請檢查：

1. GitHub Pages 是否已在儲存庫設定中啟用
2. 儲存庫是否有正確的權限設定
3. GitHub Actions 頁面是否有錯誤訊息
