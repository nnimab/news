/**
 * proxy-server.js
 * 
 * 簡單的代理服務器，用於解決跨域問題及解析OG標籤
 * 使用方法：
 * 1. 安裝 Node.js
 * 2. 在命令行執行：npm install express cors axios cheerio
 * 3. 運行：node proxy-server.js
 * 4. 修改 news-fetcher.js 中的方法使用新的API
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');

// 創建Express應用
const app = express();

// 啟用CORS
app.use(cors());

// 提供靜態文件
app.use(express.static('.'));

// 獲取RSS數據
app.get('/fetchRSS', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('缺少url參數');
    }
    
    console.log(`[/fetchRSS] 正在獲取RSS: ${url}`);
    
    // 發送請求到目標URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // 返回XML數據
    res.header('Content-Type', 'text/xml');
    res.send(response.data);
    console.log(`[/fetchRSS] 成功獲取RSS: ${url}`);
  } catch (error) {
    console.error('[/fetchRSS] 獲取RSS失敗:', error.message);
    res.status(500).send(`獲取RSS數據失敗: ${error.message}`);
  }
});

// 代理請求
app.get('/proxy', async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).send('缺少url參數');
    }
    
    // 發送請求到目標URL
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // 返回數據
    res.header('Content-Type', 'text/xml');
    res.send(response.data);
  } catch (error) {
    console.error('代理請求失敗:', error.message);
    res.status(500).send(`獲取數據失敗: ${error.message}`);
  }
});

/**
 * 追蹤URL重定向
 * @param {string} url 需要追蹤的URL
 * @returns {Promise<string|null>} 最終URL，如果無法解析則返回 null
 */
async function followRedirects(url) {
  console.log(`正在追蹤重定向: ${url}`);

  // 檢查是否是Google News重定向URL
  if (url.includes('news.google.com')) {
    
    // 策略一：嘗試直接讓 Axios 處理重定向 (已知成功率低)
    try {
      console.log(`[followRedirects] 嘗試策略一：直接GET請求 ${url} (maxRedirects: 5)`);
      const getResponse = await axios.get(url, {
        maxRedirects: 5, 
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        },
        timeout: 10000 
      });

      // 檢查最終響應的 URL
      if (getResponse.request && getResponse.request.res && 
          getResponse.request.res.responseUrl && 
          getResponse.request.res.responseUrl !== url &&
          !getResponse.request.res.responseUrl.includes('news.google.com')) {
        const finalUrl = getResponse.request.res.responseUrl;
        if (isValidUrl(finalUrl)) {
          console.log(`[followRedirects] 策略一成功：通過GET重定向獲取到最終URL: ${finalUrl}`);
          return finalUrl;
        }
      }
      console.log('[followRedirects] 策略一：直接GET未獲得非Google News的最終URL');
    } catch (getError) {
      console.warn('[followRedirects] 策略一：直接GET請求失敗:', getError.message);
    }

    // *** 移除策略二: Base64 解碼提取 (已知失效且產生錯誤日誌) ***
    // console.log('[followRedirects] 嘗試策略二：Base64 解碼提取');
    // ... (移除所有 Base64 相關代碼)

    // *** 移除策略三: 抓取 Google News HTML 頁面 (已知不可靠) ***
    // console.log('[followRedirects] 嘗試策略三：抓取HTML頁面');
    // ... (移除所有 HTML 抓取相關代碼)
    
    // 如果以上所有方法都失敗 (目前主要是策略一失敗)
    console.error(`[followRedirects] 所有解析策略均失敗，無法從 ${url} 解析出原始新聞連結。`);
    return null; // 返回 null 表示失敗

  } else {
    // 對於非 Google News URL，使用標準的 HEAD/GET 重定向檢查 (邏輯不變)
    console.log(`[followRedirects] 非 Google News URL，使用標準 HEAD/GET 檢查重定向: ${url}`);
    try {
      const response = await axios.head(url, {
        maxRedirects: 5, 
        validateStatus: status => status >= 200 && status < 400,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        },
        timeout: 8000
      });
      
      const finalUrl = response.request?.res?.responseUrl || response.headers?.location || url;

       if (finalUrl && finalUrl !== url && isValidUrl(finalUrl)) {
           console.log(`[followRedirects] 非Google URL: 通過 HEAD/GET 獲取到最終URL: ${finalUrl}`);
           return finalUrl;
       }
       
    } catch (headOrGetError) {
      console.error(`[followRedirects] 非Google URL: HEAD/GET 請求失敗 for ${url}:`, headOrGetError.message);
    }
     // 如果沒有重定向或請求失敗，返回原始 URL
     console.log(`[followRedirects] 非Google URL: 未檢測到重定向，返回原始 URL: ${url}`);
     return url;
  }
}

/**
 * 驗證URL是否有效
 * @param {string} url URL字符串
 * @returns {boolean} 是否是有效URL
 */
function isValidUrl(url) {
  try {
    const parsedUrl = new URL(url);
    return ['http:', 'https:'].includes(parsedUrl.protocol);
  } catch (e) {
    return false;
  }
}

// 獲取新聞元數據（包括Open Graph圖片）
app.get('/getNewsMetadata', async (req, res) => {
  const originalUrl = req.query.url; 
  // **** 定義正確的通用備用圖片 ****
  const genericFallbackImage = 'https://via.placeholder.com/300x150/CCCCCC/969696?text=News';
  const genericFallbackFavicon = 'https://www.google.com/favicon.ico';

  if (!originalUrl) {
    // ... (缺少 url 參數錯誤處理) ...
     return res.status(400).json({
        error: '缺少url參數',
        message: '請提供有效的新聞URL',
        imageUrl: genericFallbackImage, // 返回通用備用圖
        example: '/getNewsMetadata?url=https://example.com/news/123'
      });
  }

  // 驗證原始 URL 格式
  try {
    new URL(originalUrl);
    if (originalUrl === 'URL' || !originalUrl.startsWith('http')) {
      throw new Error('無效的URL格式');
    }
  } catch (urlError) {
     // ... (URL 格式無效錯誤處理) ...
     return res.status(400).json({
        error: 'URL格式無效',
        message: urlError.message,
        url: originalUrl,
        imageUrl: genericFallbackImage, // 返回通用備用圖
        example: '/getNewsMetadata?url=https://example.com/news/123'
      });
  }

  console.log(`[/getNewsMetadata] 開始處理元數據請求: ${originalUrl}`);
  let finalUrl = null;

  try {
    // 步驟 1: 追蹤重定向，獲取最終 URL
    finalUrl = await followRedirects(originalUrl);

    // 步驟 2: 檢查重定向結果
    if (!finalUrl || !isValidUrl(finalUrl) || finalUrl.includes('news.google.com')) {
      console.warn(`[/getNewsMetadata] 無法解析 ${originalUrl} 到最終連結。使用來源猜測返回預設元數據。`);
      
      // ***** 嘗試從原始 Google URL 猜測來源 *****
      let sourceGuess = extractSourceFromGoogleUrl(originalUrl); 
      let formattedSource = sourceGuess ? formatSiteName(sourceGuess) : '未知來源'; 
      
      if (!sourceGuess) {
         console.warn('[/getNewsMetadata] 無法從 Google URL 猜測來源，使用通用預設值');
      }

      // ***** 強制使用正確的備用圖片和 Favicon *****
      const fallbackImage = getSourceImage(formattedSource); // getSourceImage 內部會處理 '未知來源'
      const fallbackFavicon = getSourceFavicon(formattedSource);
      
      const responseJson = {
        url: originalUrl, 
        originalUrl: originalUrl,
        title: `無法獲取標題 - ${formattedSource}`, 
        description: '無法獲取原始新聞內容。',
        siteName: formattedSource, 
        imageUrl: fallbackImage, // **** 確認使用這裡計算的 fallbackImage ****
        favicon: fallbackFavicon,
        alternativeImages: [],
        error: 'Redirect resolution failed' 
      };
      
      // ***** 增加日誌，確認返回的 JSON *****
      console.log(`[/getNewsMetadata] 返回重定向失敗的 JSON 響應: ${JSON.stringify(responseJson)}`);
      return res.json(responseJson);
    }

    // 步驟 3: 成功獲取 finalUrl，嘗試從 finalUrl 獲取元數據 (邏輯基本不變)
    console.log(`[/getNewsMetadata] 重定向成功: ${originalUrl} -> ${finalUrl}`);
    console.log(`[/getNewsMetadata] 嘗試從 ${finalUrl} 獲取元數據`);

    let metadata = {
      url: finalUrl, 
      originalUrl: originalUrl, 
      title: '',
      description: '',
      siteName: '',
      imageUrl: null,
      favicon: null,
      alternativeImages: []
    };

    try {
      const response = await axios.get(finalUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
        },
        timeout: 10000
      });

      const html = response.data;
      const $ = cheerio.load(html);

      // --- 元數據提取邏輯 (保持不變) ---
      metadata.title = $('meta[property="og:title"]').attr('content') || 
                       $('meta[name="twitter:title"]').attr('content') || 
                       $('title').text() || '';
                       
      metadata.description = $('meta[property="og:description"]').attr('content') || 
                           $('meta[name="twitter:description"]').attr('content') || 
                           $('meta[name="description"]').attr('content') || '';
                           
      metadata.siteName = $('meta[property="og:site_name"]').attr('content') || 
                          $('meta[name="application-name"]').attr('content') || 
                          ''; 
      
      if (!metadata.siteName) {
          metadata.siteName = formatSiteName(extractDomainFromUrl(finalUrl));
      } else {
          metadata.siteName = formatSiteName(metadata.siteName);
      }
      
      const ogImage = $('meta[property="og:image"]').attr('content');
      const twitterImage = $('meta[name="twitter:image"]').attr('content');
      const mainImageGuess = $('article img').first().attr('src') || $('main img').first().attr('src');

      let imageUrl = ogImage || twitterImage || mainImageGuess;
      
      const favicon = $('link[rel="icon"]').attr('href') || 
                     $('link[rel="shortcut icon"]').attr('href') || 
                     '/favicon.ico';
      
      const baseUrlObj = new URL(finalUrl);
      const baseUrl = `${baseUrlObj.protocol}//${baseUrlObj.host}`;
      
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = imageUrl.startsWith('/') ? `${baseUrl}${imageUrl}` : `${baseUrl}/${imageUrl}`;
      }
      
      if (favicon && !favicon.startsWith('http')) {
        metadata.favicon = favicon.startsWith('/') ? `${baseUrl}${favicon}` : `${baseUrl}/${favicon}`;
      } else if (favicon) { 
         metadata.favicon = favicon;
      } else { 
         metadata.favicon = `${baseUrl}/favicon.ico`;
      }
      
      metadata.imageUrl = imageUrl;
      
       const allImages = [];
       $('img').each(function() {
         const src = $(this).attr('src');
         if (src && src.length > 10 && src.startsWith('http')) {
           if (!allImages.includes(src)) {
             allImages.push(src);
           }
         } else if (src && src.length > 10) { 
            let absSrc = src.startsWith('/') ? `${baseUrl}${src}` : `${baseUrl}/${src}`;
            if (!allImages.includes(absSrc)) {
               allImages.push(absSrc);
            }
         }
       });
       metadata.alternativeImages = allImages.slice(0, 5);

      // ***** 如果最終還是沒有找到圖片，使用基於來源的備用圖片 (或通用備用圖) *****
      if (!metadata.imageUrl) {
        const sourceForFallback = metadata.siteName || extractDomainFromUrl(finalUrl);
        // **** 確保這裡也使用 getSourceImage，它會處理 '未知來源' ****
        metadata.imageUrl = getSourceImage(sourceForFallback);
        console.warn(`[/getNewsMetadata] 從 ${finalUrl} 未找到可用圖片，使用備用圖片: ${metadata.imageUrl}`);
      }
      // --- 元數據提取邏輯結束 ---

    } catch (fetchError) {
      console.error(`[/getNewsMetadata] 從最終URL ${finalUrl} 獲取或解析元數據失敗:`, fetchError.message);
      
      const source = formatSiteName(extractDomainFromUrl(finalUrl));
      metadata.title = `無法獲取標題 - ${source || '未知來源'}`;
      metadata.description = `無法從 ${finalUrl} 獲取內容`;
      metadata.siteName = source || '未知來源';
      // **** 確保錯誤時也使用正確的備用圖片邏輯 ****
      metadata.imageUrl = getSourceImage(source); 
      metadata.favicon = getSourceFavicon(source);
      metadata.error = 'Metadata fetch failed';
      
      // ***** 增加日誌，確認返回的 JSON *****
      console.log(`[/getNewsMetadata] 返回元數據獲取失敗的 JSON 響應: ${JSON.stringify(metadata)}`);
    }
    
    // 無論成功或失敗，都返回 metadata 對象
    // ***** 增加日誌，確認返回的 JSON *****
    console.log(`[/getNewsMetadata] 返回最終的 JSON 響應: ${JSON.stringify(metadata)}`);
    res.json(metadata);

  } catch (error) {
    console.error('[/getNewsMetadata] 處理 /getNewsMetadata 請求時發生未知錯誤:', error.message);
    res.status(500).json({
      error: '伺服器內部錯誤', 
      message: error.message,
      url: originalUrl,
      imageUrl: genericFallbackImage // **** 確認通用錯誤時返回正確備用圖 ****
    });
  }
});

/**
 * 從Google News URL中提取可能的新聞來源
 * @param {string} url Google News URL
 * @returns {string|null} 可能的新聞來源或null
 */
function extractSourceFromGoogleUrl(url) {
  console.log(`[extractSourceFromGoogleUrl] 開始處理 (僅URL片段檢查): ${url}`);
  try {
    // *** 移除策略 1: Base64 解碼提取 (已知失效) ***
    // const match = url.match(...);
    // if (match && match[1]) { ... }
    
    // 策略 2 -> 策略 1: 檢查 URL 本身是否包含已知域名的片段
    console.log('[extractSourceFromGoogleUrl] 嘗試 URL 片段檢查...');
    if (url.includes('udn.com')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): 聯合新聞網'); return '聯合新聞網'; }
    if (url.includes('ltn.com.tw')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): 自由時報電子報'); return '自由時報電子報'; }
    if (url.includes('cna.com.tw')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): 中央社'); return '中央社'; }
    if (url.includes('ettoday.net')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): ETtoday'); return 'ETtoday'; }
    if (url.includes('yahoo.com')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): Yahoo奇摩新聞'); return 'Yahoo奇摩新聞'; }
    if (url.includes('nownews.com')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): NOWnews'); return 'NOWnews'; }
    if (url.includes('storm.mg')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): 風傳媒'); return '風傳媒'; }
    if (url.includes('tvbs.com.tw')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): TVBS新聞網'); return 'TVBS新聞網'; }
    if (url.includes('ebc.net.tw')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): 東森新聞'); return '東森新聞'; }
    if (url.includes('setn.com')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): 三立新聞網'); return '三立新聞網'; }
    if (url.includes('money.udn.com')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): 經濟日報'); return '經濟日報'; }
    if (url.includes('ctee.com.tw')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): 工商時報'); return '工商時報'; }
    if (url.includes('newtalk.tw')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): Newtalk新聞'); return 'Newtalk新聞'; }
    if (url.includes('pts.org.tw')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): 公視新聞網'); return '公視新聞網'; }
    if (url.includes('appledaily.com')) { console.log('[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): 蘋果日報'); return '蘋果日報'; }
    if (url.includes('chinatimes.com')) { 
        let formatted = formatSiteName('chinatimes.com');
        console.log(`[extractSourceFromGoogleUrl] 來源猜測成功 (URL片段): ${formatted}`); 
        return formatted; 
    }

  } catch (e) {
    console.error('[extractSourceFromGoogleUrl] 提取來源過程中發生錯誤:', e.message);
  }
  
  console.log(`[extractSourceFromGoogleUrl] URL 片段檢查失敗，無法從 Google URL ${url} 猜測來源`);
  return null; // 所有方法都失敗
}

/**
 * 從URL中提取域名
 * @param {string} url URL
 * @returns {string} 域名
 */
function extractDomainFromUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (e) {
    return '';
  }
}

/**
 * 格式化網站名稱
 * @param {string} siteName 站點名稱或域名
 * @returns {string} 格式化後的名稱
 */
function formatSiteName(siteName) {
  if (!siteName) return '';
  
  // 將域名轉換為更易讀的名稱
  const siteMapping = {
    'udn': '聯合新聞網',
    'ltn': '自由時報電子報',
    'cna': '中央社',
    'ettoday': 'ETtoday',
    'yahoo': 'Yahoo奇摩新聞',
    'nownews': 'NOWnews',
    'storm': '風傳媒',
    'tvbs': 'TVBS新聞網',
    'ebc': '東森新聞',
    'setn': '三立新聞網',
    'appledaily': '蘋果日報'
  };
  
  // 檢查是否有映射
  for (const [key, value] of Object.entries(siteMapping)) {
    if (siteName.includes(key)) {
      return value;
    }
  }
  
  // 首字母大寫
  return siteName.charAt(0).toUpperCase() + siteName.slice(1);
}

/**
 * 根據新聞來源獲取預設圖片
 * @param {string} source 新聞來源 (應該是格式化後的名稱 或 '未知來源')
 * @returns {string} 圖片URL
 */
function getSourceImage(source) {
  // **** 再次確認通用備用圖片 ****
  const genericFallback = 'https://via.placeholder.com/300x150/CCCCCC/969696?text=News'; 
  // **** 如果 source 是空或 '未知來源'，直接返回通用備用圖 ****
  if (!source || source === '未知來源') { 
    console.log(`[getSourceImage] 來源為空或未知，返回通用備用圖: ${genericFallback}`);
    return genericFallback;
  }
  
  const sourceImages = {
    '中央社': 'https://i.imgur.com/B0DVO26.png',
    '聯合新聞網': 'https://i.imgur.com/nPcZ5DO.png',
    '自由時報電子報': 'https://i.imgur.com/qrTCSHq.png',
    'ETtoday': 'https://i.imgur.com/XRMyrIW.png',
    'Yahoo奇摩新聞': 'https://i.imgur.com/tplNlvx.png',
    'Yahoo奇摩運動': 'https://i.imgur.com/tplNlvx.png',
    'NOWnews': 'https://i.imgur.com/uYgW0Fv.png',
    '風傳媒': 'https://i.imgur.com/bWMaqpz.png',
    'TVBS新聞網': 'https://i.imgur.com/nzBlfHQ.png',
    '東森新聞': 'https://i.imgur.com/xfuXDwn.png',
    '三立新聞網': 'https://i.imgur.com/N5auR5a.png',
    '經濟日報': 'https://i.imgur.com/rTIQPNj.png',
    '工商時報': 'https://i.imgur.com/pvtKilg.png',
    '新頭殼': 'https://i.imgur.com/pKGHKdg.png',
    '運動視界': 'https://i.imgur.com/JqcIKLG.png',
    '蘋果日報': 'https://i.imgur.com/Pdda1Mc.png',
    '公視新聞網': 'https://news.pts.org.tw/assets/img/logo/logo-dark.svg',
    '民報': 'https://www.peoplenews.tw/images/logo.png',
    '台灣好新聞': 'https://www.taiwanhot.net/wp-content/themes/Newspaper-child/images/logo.png',
    'Newtalk新聞': 'https://newtalk.tw/logo.png',
    '中時新聞網': 'https://images.chinatimes.com/logo/logo_chinatimes_new.svg'
  };
  
  // 返回對應來源的圖片，如果找不到則返回新的通用備用圖片
  const resultImage = sourceImages[source] || genericFallback;
  console.log(`[getSourceImage] 來源 '${source}' 對應圖片: ${resultImage}`);
  return resultImage; 
}

/**
 * 獲取指定來源的favicon
 * @param {string} source 新聞來源
 * @returns {string} favicon URL
 */
function getSourceFavicon(source) {
  if (!source) return 'https://www.google.com/favicon.ico';
  
  // 處理域名格式
  if (source.includes('.')) {
    source = formatSiteName(source);
  }
  
  // 常見網站的favicon
  const sourceFavicons = {
    '中央社': 'https://www.cna.com.tw/favicon.ico',
    '聯合新聞網': 'https://udn.com/favicon.ico',
    '自由時報電子報': 'https://www.ltn.com.tw/favicon.ico',
    'ETtoday': 'https://www.ettoday.net/favicon.ico',
    'Yahoo奇摩新聞': 'https://s.yimg.com/cv/apiv2/social/images/yahoo_default_logo.png',
    'NOWnews': 'https://www.nownews.com/favicon.ico',
    '風傳媒': 'https://www.storm.mg/favicon.ico',
    'TVBS新聞網': 'https://news.tvbs.com.tw/favicon.ico',
    '東森新聞': 'https://news.ebc.net.tw/favicon.ico',
    'setn.com': 'https://www.setn.com/favicon.ico',
    '三立新聞網': 'https://www.setn.com/favicon.ico',
    '經濟日報': 'https://money.udn.com/favicon.ico',
    '工商時報': 'https://ctee.com.tw/favicon.ico',
    '新頭殼': 'https://newtalk.tw/favicon.ico',
    '蘋果日報': 'https://www.appledaily.com.tw/favicon.ico'
  };
  
  return sourceFavicons[source] || 'https://www.google.com/favicon.ico';
}

// 啟動服務器
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`代理服務器啟動在 http://localhost:${PORT}`);
  console.log(`可用接口:`);
  console.log(`- /fetchRSS?url=URL    (獲取RSS數據)`);
  console.log(`- /getNewsMetadata?url=URL    (獲取新聞元數據)`);
  console.log(`- /proxy?url=URL    (代理請求)`);
}); 