/**
 * news-fetcher.js
 * 負責從RSS feed獲取新聞數據並解析，並使用Open Graph獲取圖片
 */

// 引入依賴
const parser = new DOMParser();

// 用於保存 UI 控制器
let uiController = null;

// 定義新聞分類，使用統一的Yahoo 新聞 RSS 鏈接
const CATEGORY_FEEDS = {
  '頭條': 'https://tw.news.yahoo.com/rss/',
  '政治': 'https://tw.news.yahoo.com/rss/politics',
  '財經': 'https://tw.news.yahoo.com/rss/finance',
  '國際': 'https://news.yahoo.com/rss/world',
  '娛樂': 'https://tw.news.yahoo.com/rss/entertainment',
  '體育': 'https://tw.news.yahoo.com/rss/sports',
  '科技': 'https://tw.news.yahoo.com/rss/technology',
  '健康': 'https://tw.news.yahoo.com/rss/health',
  '生活': 'https://tw.news.yahoo.com/rss/lifestyle',
  'AI': 'https://news.yahoo.com/rss/ai',        // 新增 AI 分類
  'Economy': 'https://news.yahoo.com/rss/economy' // 新增 Economy 分類
};

// 頁面類型到所需分類的映射
const PAGE_CATEGORIES = {
  'index': ['頭條', '科技', '政治', '國際'], // 首頁顯示這些分類
  'tech': ['科技'],                     // 科技頁面
  'local': ['政治', '財經'],             // 國內頁面
  'international': ['國際', 'AI', 'Economy'], // 國際頁面請求這三個分類
  'more': ['娛樂', '體育', '健康', '生活']  // 更多頁面
};

/**
 * 設置 UI 控制器
 * @param {Object} controller UI 控制器對象
 */
function setUIController(controller) {
  uiController = controller;
  console.log("已設置 UI 控制器");
}

/**
 * 根據頁面類型獲取需要的新聞分類
 * @param {string} pageType 頁面類型 ('index', 'tech', 'local', 'international', 'more')
 * @returns {Array} 需要獲取的分類列表
 */
function getCategoriesForPage(pageType) {
  return PAGE_CATEGORIES[pageType] || ['頭條', '科技', '政治', '國際']; // 默認返回首頁分類
}

/**
 * 獲取指定分類的新聞
 * @param {Array} categories 需要獲取的分類列表
 * @param {number} limit 每個分類獲取的新聞數量限制，默認5條
 * @returns {Promise<Array>} 所有新聞項的數組
 */
async function fetchCategoriesNews(categories, limit = 12) {
  console.log(`開始獲取以下分類的新聞: ${categories.join(', ')}，每個分類限制 ${limit} 條`);
  
  try {
    // 只獲取指定分類的RSS feed
    const categoryPromises = categories.map(async (category) => {
      try {
        const feedUrl = CATEGORY_FEEDS[category];
        if (!feedUrl) {
          console.warn(`分類 ${category} 沒有對應的RSS地址`);
          return [];
        }
        
        console.log(`開始獲取 ${category} 分類的新聞`);
        const xmlText = await fetchRSS(feedUrl);
        
        // 解析RSS
        let newsItems = parseRSS(xmlText);
        
        // !!! 新增日誌：打印解析後的新聞數量 !!!
        console.log(`[${category}] 解析後的 newsItems 數量: ${newsItems.length}`);
        // --- 日誌結束 ---
        
        // 設置新聞項的分類
        newsItems.forEach(item => {
          item.category = category;
        });
        
        // 限制每個分類的新聞數量
        if (newsItems.length > limit) {
          console.log(`${category} 分類有 ${newsItems.length} 條新聞，限制為 ${limit} 條`);
          newsItems = newsItems.slice(0, limit);
        }
        
        console.log(`成功獲取 ${category} 分類的 ${newsItems.length} 條新聞`);
        return newsItems;
      } catch (error) {
        console.error(`獲取 ${category} 分類新聞失敗:`, error);
        return [];
      }
    });
    
    // 等待所有分類的新聞獲取完成
    const categoryResults = await Promise.all(categoryPromises);
    
    // 合併所有分類的新聞
    const allNews = categoryResults.flat();
    
    console.log(`總共獲取 ${allNews.length} 條新聞`);
    return allNews;
  } catch (error) {
    console.error("獲取新聞失敗:", error);
    return [];
  }
}

/**
 * 獲取所有新聞（兼容舊版API）
 * @param {number} limit 每個分類獲取的新聞數量限制，默認5條
 * @returns {Promise<Array>} 所有新聞項的數組
 */
async function fetchAllCategoryNews(limit = 12) {
  // 獲取所有分類
  const allCategories = Object.keys(CATEGORY_FEEDS);
  return fetchCategoriesNews(allCategories, limit);
}

/**
 * 獲取 RSS feed
 * @param {string} url RSS feed URL
 * @returns {Promise<string>} XML 文本
 */
async function fetchRSS(url) {
  console.log(`正在獲取 RSS feed: ${url}`);
  try {
    const response = await fetch(`/fetchRSS?url=${encodeURIComponent(url)}`);
    
    // 檢查響應狀態碼
    if (!response.ok) {
      // 嘗試讀取錯誤響應體（如果是文本格式）
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (e) {
        // 忽略讀取響應體的錯誤
      }
      // 拋出更詳細的錯誤
      throw new Error(`代理伺服器請求失敗! URL: ${url}, Status: ${response.status}, Body: ${errorBody}`);
    }
    
    const text = await response.text();
    // 添加檢查，確保返回的不是空文本
    if (!text || text.trim() === '') {
       console.warn(`從代理伺服器收到的 RSS feed 內容為空: ${url}`);
       return ''; // 返回空字符串，讓 parseRSS 處理
    }
    return text;
  } catch (error) {
    // 捕獲 fetch 本身的錯誤或上面拋出的錯誤
    console.error(`獲取或處理 RSS feed 時發生錯誤 (${url}):`, error);
    throw error; // 重新拋出錯誤，讓上層知道獲取失敗
  }
}

/**
 * 解析 RSS XML 文本
 * @param {string} xmlText RSS XML 文本
 * @returns {Array} 解析出的新聞項目數組
 */
function parseRSS(xmlText) {
  console.log(`開始解析 RSS`);
  if (!xmlText || xmlText.trim() === '') {
      console.warn("接收到的 RSS XML 內容為空，無法解析。");
      return [];
  }
  
  // 創建 DOM 解析器
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  
  // 檢查是否有解析錯誤
  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) {
      console.error("解析 RSS XML 時發生錯誤:", parseError.textContent);
      // 嘗試獲取 feed 的標題以識別是哪個 feed 出錯
      const feedTitle = xmlDoc.querySelector("channel > title, feed > title")?.textContent || "未知 Feed";
      console.error(`錯誤發生在 Feed: ${feedTitle}`);
      return [];
  }
  
  // 獲取所有項目 - 嘗試多種可能的 item 標籤
  const items = xmlDoc.querySelectorAll("item, entry");
  const feedTitleForLog = xmlDoc.querySelector("channel > title, feed > title")?.textContent || "未知 Feed"; // 用於日誌
  console.log(`[${feedTitleForLog}] 找到 ${items.length} 條新聞項目 (使用 item 或 entry 標籤)`);
  
  const newsItems = [];
  
  items.forEach((item, index) => {
    // --- 添加詳細日誌 --- 
    console.log(`[${feedTitleForLog}] 正在處理項目 ${index + 1}/${items.length}`);
    // 打印原始 item/entry 的 XML 片段 (限制長度避免過長)
    // console.log(`[${feedTitleForLog}] Item ${index + 1} XML: ${item.outerHTML.substring(0, 500)}...`); 
    // --- 日誌結束 --- 
    
    try {
      // 提取標題和鏈接 - 嘗試 title 和 link 標籤
      const titleElement = item.querySelector("title");
      const title = titleElement?.textContent || "";
      const linkElement = item.querySelector("link");
      let link = linkElement?.getAttribute('href') || linkElement?.textContent || ""; // 優先 href
      const pubDateElement = item.querySelector("pubDate, published, updated");
      const pubDate = pubDateElement?.textContent || "";
      const descriptionElement = item.querySelector("description, summary, content");
      const description = descriptionElement?.textContent || "";
      
      // --- 添加提取值日誌 --- 
      console.log(`[${feedTitleForLog}] Item ${index + 1}: Title='${title}', Link='${link}', PubDate='${pubDate}'`);
      // --- 日誌結束 --- 
      
      // 嘗試從描述中提取圖片 URL
      let imageUrl = null;
      
      // --- 圖片提取邏輯加強 ---
      // 1. 優先使用 media:content 或 media:thumbnail (常見於 Yahoo, Google News)
      const mediaContent = item.querySelector("media\\:content, media\\:thumbnail");
      if (mediaContent && mediaContent.getAttribute("url")) {
        imageUrl = mediaContent.getAttribute("url");
      }

      // 2. 其次嘗試 enclosure 標籤 (標準 RSS)
      if (!imageUrl) {
          const enclosure = item.querySelector("enclosure");
          if (enclosure && enclosure.getAttribute("url") && enclosure.getAttribute("type")?.startsWith("image/")) {
              imageUrl = enclosure.getAttribute("url");
          }
      }
      
      // 3. 嘗試從 description/content/summary 的 HTML 中提取第一個 img 標籤
      if (!imageUrl) {
          const contentSource = item.querySelector("description, summary, content, content\\:encoded")?.textContent || "";
          const imgMatch = contentSource.match(/<img[^>]+src=['\"]([^'\">]+)['\"]/i);
          if (imgMatch && imgMatch[1]) {
              imageUrl = imgMatch[1];
          }
      }
      // --- 圖片提取邏輯結束 ---
      
      // 嘗試提取來源信息
      let siteName = "";
      const sourceElement = item.querySelector("source, author > name, dc\\:creator"); // 添加 dc:creator
      if (sourceElement) {
        siteName = sourceElement.textContent || "";
      } else {
        // 嘗試從標題中提取來源
        siteName = extractSourceFromTitle(title);
      }
      
      // 確保有標題和連結才加入
      if (!title || !link) {
         console.warn(`[${feedTitleForLog}] 跳過索引 ${index} 的項目，缺少標題或連結。`);
         return; // continue to next item
      }
      
      // 創建新聞項目，暫不分配分類
      const newsItem = {
        title: title.trim(),
        link: link,
        description: description.replace(/<[^>]*>/g, '').trim(),  // 移除 HTML 標籤
        pubDate: new Date(pubDate),
        imageUrl: imageUrl, // 可能仍然是 null
        category: null, // 稍後會自動分類
        siteName: siteName.trim()
      };
      
      newsItems.push(newsItem);
    } catch (error) {
      console.error(`[${feedTitleForLog}] 解析新聞項目失敗 (索引: ${index}):`, error);
    }
  });
  
  console.log(`[${feedTitleForLog}] 成功解析 ${newsItems.length} 條有效新聞`);
  return newsItems;
}

/**
 * 自定義分類處理（如果需要額外調整分類）
 * @param {Array} newsItems 已經有基本分類的新聞數組
 * @returns {Object} 調整後的分類新聞對象
 */
function categorizeNews(newsItems) {
  const categorized = {};
  
  // 初始化每個分類的數組
  Object.keys(CATEGORY_FEEDS).forEach(category => {
    categorized[category] = [];
  });
  
  // 將新聞按照已有分類歸類
  newsItems.forEach(item => {
    if (item.category && categorized[item.category]) {
      categorized[item.category].push(item);
    } else {
      // 如果沒有有效分類，歸入頭條
      categorized['頭條'].push({...item, category: '頭條'});
    }
  });
  
  // 記錄每個分類的新聞數量
  Object.entries(categorized).forEach(([category, items]) => {
    console.log(`${category} 分類有 ${items.length} 條新聞`);
  });
  
  return categorized;
}

/**
 * 去除重複的新聞項目
 * @param {Array} newsItems 新聞項目數組
 * @returns {Array} 去重後的新聞項目數組
 */
function removeDuplicates(newsItems) {
  const uniqueLinks = new Set();
  const uniqueItems = [];
  
  for (const item of newsItems) {
    if (!uniqueLinks.has(item.link)) {
      uniqueLinks.add(item.link);
      uniqueItems.push(item);
    }
  }
  
  console.log(`去重前: ${newsItems.length} 條新聞, 去重後: ${uniqueItems.length} 條新聞`);
  return uniqueItems;
}

/**
 * 從標題中提取新聞來源
 * @param {string} title 新聞標題
 * @returns {string} 提取的來源名稱
 */
function extractSourceFromTitle(title) {
  // 一些常見的新聞標題格式模式：「來源」標題內容
  const patterns = [
    /^【([^】]+)】/,              // 【來源】模式
    /^「([^」]+)」/,              // 「來源」模式
    /^［([^］]+)］/,              // ［來源］模式
    /^\[([^\]]+)\]/,              // [來源]模式
    /^(.+?)[:：]\s*/,             // 來源: 或 來源：模式
    /^(\S+?報導)[,，]?/,          // XX報導模式
    /^(\S+?編輯報導)[,，]?/       // XX編輯報導模式
  ];
  
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  return "";
}

/**
 * 批次處理新聞
 * @param {Array} newsItems 新聞項目數組
 * @param {number} imageCount 需要載入圖片的數量，默認每個分類前5條
 * @returns {Promise} 處理完成的 Promise
 */
async function processNewsInBatches(newsItems, imageCount = 10) {
  console.log("開始批次處理新聞...");
  
  // 增加批次大小，提高並行處理效率
  const batchSize = 40;  // 降低批次大小，避免過多同時請求
  
  // 根據分類分組，只處理每個分類前幾條新聞的圖片
  const categorizedNews = {};
  newsItems.forEach(item => {
    if (!categorizedNews[item.category]) {
      categorizedNews[item.category] = [];
    }
    categorizedNews[item.category].push(item);
  });
  
  // 只選擇每個分類的前N條新聞處理圖片
  const newsToProcess = [];
  Object.entries(categorizedNews).forEach(([category, items]) => {
    const topItems = items.slice(0, imageCount);
    console.log(`處理 ${category} 分類的前 ${topItems.length} 條新聞圖片`);
    newsToProcess.push(...topItems);
  });
  
  const total = newsToProcess.length;
  let processed = 0;
  
  // 將新聞分成批次處理
  const batches = [];
  for (let i = 0; i < newsToProcess.length; i += batchSize) {
    batches.push(newsToProcess.slice(i, i + batchSize));
  }
  
  // 按批次順序處理，避免伺服器過載
  for (const batch of batches) {
    // 為當前批次的所有新聞創建請求
    const batchPromises = batch.map(async (item) => {
      try {
        if (!item.imageUrl) {
          // 嘗試獲取新聞元數據（包括圖片）
          await getNewsMetadata(item);
        }
        
        // 更新進度條
        processed++;
        if (uiController) {
          uiController.updateProgressBar(processed / total * 100);
        }
      } catch (error) {
        console.error(`處理新聞失敗 (${item.link}):`, error);
      }
    });
    
    // 等待當前批次完成再進行下一批
    await Promise.all(batchPromises);
    console.log(`完成批次處理 ${batch.length} 條新聞，總進度: ${processed}/${total}`);
  }
  
  console.log("新聞批次處理完成");
}

/**
 * 獲取新聞元數據（圖片和來源等）
 * @param {Object} newsItem 新聞項目對象
 * @returns {Promise} 處理完成的 Promise
 */
async function getNewsMetadata(newsItem) {
  try {
    // 如果已經有圖片 URL，則不需要處理
    if (newsItem.imageUrl) return;
    
    const encodedUrl = encodeURIComponent(newsItem.link);
    const controller = new AbortController();
    const signal = controller.signal;
    
    // 設置5秒超時
    const timeoutId = setTimeout(() => controller.abort(), 7000);  // 從5秒增加到7秒
    
    try {
      console.log(`獲取新聞元數據: ${newsItem.link}`);
      const response = await fetch(`/getNewsMetadata?url=${encodedUrl}`, { signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`獲取元數據失敗: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // 更新新聞項目
      if (data.imageUrl) {
        newsItem.imageUrl = data.imageUrl;
        
        // 如果有 UI 控制器，更新對應的新聞圖片
        if (uiController) {
          console.log(`更新新聞圖片: ${newsItem.link} => ${newsItem.imageUrl}`);
          uiController.updateNewsItemImage(newsItem.link, newsItem.imageUrl);
        }
      } else {
        // 即使沒有找到圖片，也設置一個預設圖片
        console.log(`未獲取到圖片，使用分類預設圖片: ${newsItem.category}`);
        // 根據分類設置不同的預設圖片
        const categoryImages = {
          '頭條': 'https://via.placeholder.com/300x150/FF5733/FFFFFF?text=頭條新聞',
          '政治': 'https://via.placeholder.com/300x150/336699/FFFFFF?text=政治新聞',
          '財經': 'https://via.placeholder.com/300x150/33CC99/FFFFFF?text=財經新聞',
          '國際': 'https://via.placeholder.com/300x150/9933CC/FFFFFF?text=國際新聞',
          '娛樂': 'https://via.placeholder.com/300x150/FF9933/FFFFFF?text=娛樂新聞',
          '體育': 'https://via.placeholder.com/300x150/33CC33/FFFFFF?text=體育新聞',
          '科技': 'https://via.placeholder.com/300x150/3366FF/FFFFFF?text=科技新聞',
          '健康': 'https://via.placeholder.com/300x150/FF3399/FFFFFF?text=健康新聞',
          '生活': 'https://via.placeholder.com/300x150/99CC33/FFFFFF?text=生活新聞'
        };
        
        newsItem.imageUrl = categoryImages[newsItem.category] || 
          `https://via.placeholder.com/300x150/CCCCCC/969696?text=${encodeURIComponent(newsItem.siteName || '新聞')}`;
        
        // 如果有 UI 控制器，更新對應的新聞圖片
        if (uiController) {
          uiController.updateNewsItemImage(newsItem.link, newsItem.imageUrl);
        }
      }
      
      // 更新其他元數據
      if (data.siteName && !newsItem.siteName) {
        newsItem.siteName = data.siteName;
      }
    } catch (fetchError) {
      // 處理超時或其他請求錯誤，使用預設圖片
      if (fetchError.name === 'AbortError') {
        console.warn(`獲取新聞 ${newsItem.link} 的元數據超時`);
        // 根據分類設置不同的預設圖片
        const categoryImages = {
          '頭條': 'https://via.placeholder.com/300x150/FF5733/FFFFFF?text=頭條新聞',
          '政治': 'https://via.placeholder.com/300x150/336699/FFFFFF?text=政治新聞',
          '財經': 'https://via.placeholder.com/300x150/33CC99/FFFFFF?text=財經新聞',
          '國際': 'https://via.placeholder.com/300x150/9933CC/FFFFFF?text=國際新聞',
          '娛樂': 'https://via.placeholder.com/300x150/FF9933/FFFFFF?text=娛樂新聞',
          '體育': 'https://via.placeholder.com/300x150/33CC33/FFFFFF?text=體育新聞',
          '科技': 'https://via.placeholder.com/300x150/3366FF/FFFFFF?text=科技新聞',
          '健康': 'https://via.placeholder.com/300x150/FF3399/FFFFFF?text=健康新聞',
          '生活': 'https://via.placeholder.com/300x150/99CC33/FFFFFF?text=生活新聞'
        };
        
        newsItem.imageUrl = categoryImages[newsItem.category] || 
          `https://via.placeholder.com/300x150/CCCCCC/969696?text=${encodeURIComponent(newsItem.siteName || '新聞')}`;
        
        // 如果有 UI 控制器，更新對應的新聞圖片
        if (uiController) {
          uiController.updateNewsItemImage(newsItem.link, newsItem.imageUrl);
        }
      } else {
        throw fetchError;
      }
    }
  } catch (error) {
    console.error(`獲取新聞 ${newsItem.link} 的元數據失敗:`, error);
    // 設置一個預設圖片以防所有嘗試都失敗
    if (!newsItem.imageUrl) {
      newsItem.imageUrl = `https://via.placeholder.com/300x150/999999/FFFFFF?text=無法載入圖片`;
      if (uiController) {
        uiController.updateNewsItemImage(newsItem.link, newsItem.imageUrl);
      }
    }
  }
}

/**
 * 主函數：根據頁面類型獲取、處理和顯示新聞
 * @param {string} pageType 頁面類型 ('index', 'tech', 'local', 'international', 'more')
 * @param {number} newsLimit 每個分類獲取的新聞數量限制，默認5條
 * @param {number} imageLimit 每個分類處理圖片的數量限制，默認5條
 */
async function fetchAndDisplayPageNews(pageType = 'index', newsLimit = 13, imageLimit = 20) {
  console.log(`開始獲取 ${pageType} 頁面的新聞流程`);
  if (uiController) uiController.showLoading();

  try {
    const categories = getCategoriesForPage(pageType);
    // fetchCategoriesNews 返回的是嵌套數組 [[...國際新聞], [...AI新聞], [...經濟新聞]]
    const categoryResults = await fetchCategoriesNews(categories, newsLimit);

    // --- 修改點：先扁平化，然後用原始 categorizeNews 分類 --- 
    const allNewsFlat = categoryResults.flat();
    // 使用原始的 categorizeNews 函數對扁平化後的數組進行分類 (傳給 UI)
    const categorizedNews = categorizeNews(allNewsFlat); 
    // -----------------------------------------------------

    // --- 提前處理焦點新聞圖片 (基於 categorizedNews 操作) ---
    let potentialFeaturedItem = null;
    switch (pageType) {
      case 'index':
        potentialFeaturedItem = categorizedNews['頭條']?.[0];
        break;
      case 'tech':
        potentialFeaturedItem = categorizedNews['科技']?.[0];
        break;
      case 'local':
        potentialFeaturedItem = categorizedNews['政治']?.[0] || categorizedNews['財經']?.[0];
        break;
      case 'international':
        potentialFeaturedItem = categorizedNews['國際']?.[0]; // 焦點用 '國際'
        break;
      case 'more':
        const moreCategories = PAGE_CATEGORIES['more'];
        for (const cat of moreCategories) {
            if (categorizedNews[cat]?.[0]) {
                potentialFeaturedItem = categorizedNews[cat][0];
                break;
            }
        }
        break;
    }

    if (potentialFeaturedItem && !potentialFeaturedItem.imageUrl) {
      console.log(`提前為焦點新聞獲取元數據: ${potentialFeaturedItem.link}`);
      await getNewsMetadata(potentialFeaturedItem);
      console.log(`焦點新聞 ${potentialFeaturedItem.link} 的 imageUrl 更新為: ${potentialFeaturedItem.imageUrl}`);
    }
    // --- 結束提前處理焦點新聞圖片 ---

    if (uiController) {
      // 傳遞分類後的物件給 UI 控制器
      uiController.displayNewsList(categorizedNews, pageType); // <--- 使用 categorizeNews 的結果
      uiController.hideLoading();

      // --- 圖片處理：需要去重 (現在基於 allNewsFlat 去重) ---
      const allNewsForImages = removeDuplicates(allNewsFlat); // 對扁平數組去重
      // -----------------------------------------------------
      await processNewsInBatches(allNewsForImages, imageLimit); 
    } else {
      console.error("UI 控制器未設置");
    }
    console.log(`${pageType} 頁面新聞數據加載完成`);

  } catch (error) {
    console.error(`獲取和顯示 ${pageType} 頁面新聞時發生錯誤:`, error);
    if (uiController) uiController.showError(`無法載入 ${pageType} 頁面新聞`);
  }
}

/**
 * 主函數：獲取、處理和顯示新聞（兼容舊版API）
 * @param {number} newsLimit 每個分類獲取的新聞數量限制，默認5條
 */
async function fetchAndDisplayNews(newsLimit = 13) {
  // 調用新的頁面特定函數，默認為首頁
  await fetchAndDisplayPageNews('index', newsLimit, 20);
}

// 導出需要的函數
export {
  setUIController,
  fetchAndDisplayNews,
  fetchAndDisplayPageNews,
  fetchAllCategoryNews,
  processNewsInBatches,
  getNewsMetadata
}; 