# 新聞聚合平台

一個基於Yahoo新聞RSS源的現代化新聞聚合平台，提供多分類新聞展示和優雅的用戶界面。

https://nnimab.me/

![image](https://github.com/user-attachments/assets/909afa4e-4faf-45c9-b885-348c18b4aeac)


## 🌟 功能特點

### 核心功能
- **多分類新聞聚合**：支援頭條、科技、政治、國際、娛樂、體育、健康、生活等多個新聞分類
- **多頁面展示**：5個專門頁面（焦點、科技、國內、國際、更多），每個頁面針對特定新聞類型優化
- **實時新聞獲取**：從Yahoo新聞RSS源實時獲取最新新聞內容
- **智能圖片獲取**：自動獲取新聞縮略圖，支援Open Graph協議和多種圖片源
- **跨域問題解決**：內建Node.js代理服務器，完美解決瀏覽器跨域限制

### 用戶體驗
- **響應式設計**：適配桌面和移動設備，提供一致的瀏覽體驗
- **骨架屏加載**：優雅的加載動畫，提升用戶等待體驗
- **現代化UI**：基於影片串流平台設計風格，美觀且易用
- **快速導航**：頁面間無縫切換，支援新聞分類瀏覽

## 🏗️ 技術架構

### 前端技術
- **HTML5 + CSS3**：語義化標籤和現代CSS特性
- **原生JavaScript (ES6+)**：模組化設計，無框架依賴
- **響應式布局**：Flexbox和Grid布局
- **Font Awesome**：圖標庫支援

### 後端技術
- **Node.js + Express**：輕量級代理服務器
- **Axios**：HTTP請求處理
- **Cheerio**：HTML解析和Open Graph數據提取
- **CORS**：跨域資源共享支援

### 數據源
- **Yahoo新聞RSS**：多個分類的RSS feed
  - 台灣新聞：`tw.news.yahoo.com/rss/*`
  - 國際新聞：`news.yahoo.com/rss/*`
  - 支援政治、財經、科技、娛樂、體育等分類

## 🚀 快速開始

### 環境要求
- Node.js 14.0 或更高版本
- npm 或 yarn 包管理器
- 現代瀏覽器（支援ES6+）

### 安裝步驟

1. **克隆專案**
```bash
git clone https://github.com/nnimab/news.git
cd news
```

2. **安裝依賴**
```bash
npm install
```

3. **啟動代理服務器**
```bash
npm start
# 或
node proxy-server.js
```

4. **開啟瀏覽器**
```
http://localhost:3000
```

### 開發模式
```bash
npm run dev
```

## 📁 專案結構

```
news-aggregator/
├── index.html              # 焦點新聞頁面
├── tech.html               # 科技新聞頁面
├── local.html              # 國內新聞頁面
├── international.html      # 國際新聞頁面
├── more.html               # 更多新聞頁面
├── style.css               # 主要樣式文件
├── news-fetcher.js         # 新聞獲取模組
├── ui-controller.js        # UI控制模組
├── proxy-server.js         # 代理服務器
├── package.json            # 專案配置
├── changelog.md            # 更新日誌
├── 開發計畫.md             # 開發計畫
└── README.md               # 專案說明
```

## 🔧 配置說明

### RSS源配置
在 `news-fetcher.js` 中可以自定義RSS源：

```javascript
const CATEGORY_FEEDS = {
  '頭條': 'https://tw.news.yahoo.com/rss/',
  '科技': 'https://tw.news.yahoo.com/rss/technology',
  '政治': 'https://tw.news.yahoo.com/rss/politics',
  // ... 更多分類
};
```

### 頁面分類配置
每個頁面顯示的新聞分類可在 `PAGE_CATEGORIES` 中配置：

```javascript
const PAGE_CATEGORIES = {
  'index': ['頭條', '科技', '政治', '國際'],
  'tech': ['科技'],
  'local': ['政治', '財經'],
  // ... 更多頁面
};
```

## 🛠️ 開發指南

### 新增新聞分類
1. 在 `CATEGORY_FEEDS` 中添加新的RSS源
2. 在 `PAGE_CATEGORIES` 中配置頁面顯示
3. 更新UI控制器中的顯示邏輯

### 自定義樣式
主要樣式文件為 `style.css`，採用模組化CSS設計：
- `.app-container`：主容器
- `.sidebar`：側邊欄
- `.main-content`：主內容區
- `.featured-section`：焦點新聞區
- `.recommendation-section`：推薦新聞區

### API接口
代理服務器提供以下接口：
- `GET /fetchRSS?url=<rss_url>`：獲取RSS數據
- `GET /getNewsMetadata?url=<news_url>`：獲取新聞元數據和圖片

## 🔍 故障排除

### 常見問題

**Q: 新聞無法載入？**
A: 確保代理服務器正在運行（`node proxy-server.js`）

**Q: 圖片顯示不完整？**
A: 檢查網路連接，某些圖片可能需要時間載入

**Q: 跨域錯誤？**
A: 確保通過 `http://localhost:3000` 訪問，而非直接開啟HTML文件

### 日誌調試
開啟瀏覽器開發者工具查看詳細日誌：
- 新聞獲取狀態
- 圖片載入進度
- 錯誤信息

## 📈 開發歷程

- **v0.1.0**：基礎新聞聚合功能
- **v0.2.0**：多分類RSS源支援
- **v0.3.0**：圖片獲取和UI優化
- **v0.4.0**：多頁面架構
- **v0.5.0**：代理服務器和跨域解決方案

詳細更新記錄請查看 [changelog.md](./changelog.md)

## 🎯 未來計劃

### 即將推出
- [ ] 新聞搜索功能
- [ ] 頁面翻頁機制
- [ ] 主題切換（暗色/亮色模式）
- [ ] 新聞收藏功能

### 技術優化
- [ ] 新聞數據本地緩存
- [ ] 定時自動刷新
- [ ] Web Worker後台處理
- [ ] PWA支援

### 用戶體驗
- [ ] 載入動畫優化
- [ ] 分享功能
- [ ] 閱讀統計
- [ ] 個性化推薦

## 🤝 貢獻指南

歡迎提交Issue和Pull Request！

1. Fork本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟Pull Request

## 📄 授權條款

本專案採用 MIT 授權條款 - 詳見 [LICENSE](LICENSE) 文件

## 📞 聯絡方式

- 專案連結：[https://github.com/nnimab/news](https://github.com/nnimab/news)
- 問題回報：[Issues](https://github.com/nnimab/news/issues)

---

⭐ 如果這個專案對您有幫助，請給我們一個星星！ 
