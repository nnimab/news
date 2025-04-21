# 新聞聚合平台

這是一個基於Google News RSS訂閱來源的新聞聚合平台，能夠自動抓取並分類顯示新聞內容。

## 功能特點

- 從Google News RSS獲取最新新聞
- 自動分類為科技新聞、國內新聞和焦點新聞
- 精美的用戶界面，包含骨架屏加載效果
- 點擊新聞可直接跳轉到原始新聞來源

## 技術實現

- 純前端實現：HTML + CSS + JavaScript
- 使用RSS解析技術獲取新聞內容
- 自動提取新聞來源logo作為圖片
- 響應式設計，適配各種設備

## 跨域問題解決方案

由於瀏覽器安全策略限制，直接通過前端JavaScript獲取外部RSS訂閱源會遇到跨域問題，以下是幾種解決方案：

### 方案1：使用在線CORS代理

在`news-fetcher.js`中，我們使用了cors-anywhere作為代理服務：

```js
this.corsProxy = 'https://cors-anywhere.herokuapp.com/';
```

由於cors-anywhere有使用限制，可能需要先訪問 https://cors-anywhere.herokuapp.com/corsdemo 並點擊按鈕請求臨時訪問權限。

### 方案2：使用本地代理服務器

1. 安裝Node.js和Express

```bash
npm init -y
npm install express cors axios
```

2. 創建本地代理服務器 `proxy-server.js`：

```js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());

app.get('/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('缺少url參數');
    }
    
    const response = await axios.get(url);
    res.send(response.data);
  } catch (error) {
    res.status(500).send('獲取數據失敗');
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`代理服務器運行在 http://localhost:${PORT}`);
});
```

3. 運行本地代理服務器：

```bash
node proxy-server.js
```

4. 修改`news-fetcher.js`中的代理URL：

```js
this.corsProxy = 'http://localhost:3000/proxy?url=';
```

### 方案3: 使用後端API

如果有自己的服務器，可以創建一個專門的API端點來獲取和處理RSS數據，然後由前端調用這個API。

## 使用方法

1. 克隆或下載本專案
2. 處理跨域問題（參考上方解決方案）
3. 在瀏覽器中打開index.html

## 未來計劃

- 添加搜尋功能
- 實現頁面翻頁
- 添加主題切換
- 新聞收藏功能
- 優化移動端體驗

## 聯絡與貢獻

如有任何建議或問題，歡迎提交issue或pull request。 