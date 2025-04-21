/**
 * ui-controller.js
 * 負責將獲取的新聞數據顯示到UI界面上
 */

// 導入 news-fetcher.js 中的函數
import { setUIController, fetchAndDisplayNews, fetchAndDisplayPageNews } from './news-fetcher.js';

class UIController {
    constructor() {
        // 獲取當前頁面類型
        this.pageType = this.getPageType();
        console.log(`當前頁面類型: ${this.pageType}`);
        
        // 獲取DOM元素（根據頁面類型）
        this.initDOMElements();
        
        // 初始化
        this.init();
    }
    
    /**
     * 根據當前頁面URL確定頁面類型
     * @returns {string} 頁面類型 ('index', 'tech', 'local', 'international', 'more')
     */
    getPageType() {
        const pathname = window.location.pathname;
        if (pathname.includes('tech.html')) return 'tech';
        if (pathname.includes('local.html')) return 'local';
        if (pathname.includes('international.html')) return 'international';
        if (pathname.includes('more.html')) return 'more';
        return 'index'; // 默認為首頁
    }
    
    /**
     * 根據頁面類型初始化DOM元素
     */
    initDOMElements() {
        // 初始化所有可能的DOM元素為null
        this.techNewsList = null;
        this.featuredNews = null;
        this.localNewsList = null;
        this.moreNewsGrid = null;
        this.globalNewsList = null;
        this.internationalPoliticsList = null;
        this.globalEconomyGrid = null;
        this.techReviewsList = null;
        this.techTrendsGrid = null;
        this.politicsNewsList = null;
        this.financeNewsGrid = null;
        this.cultureNewsList = null;
        this.healthNewsList = null;
        this.sportsNewsGrid = null;
        
        // 根據頁面類型獲取相應的DOM元素
        switch (this.pageType) {
            case 'index':
                this.techNewsList = document.getElementById('tech-news-list');
                this.featuredNews = document.getElementById('featured-news');
                this.localNewsList = document.getElementById('local-news-list');
                this.moreNewsGrid = document.getElementById('more-news-grid');
                break;
            case 'tech':
                this.techNewsList = document.getElementById('tech-news-list');
                this.featuredNews = document.getElementById('featured-news');
                this.techReviewsList = document.getElementById('tech-reviews-list');
                this.techTrendsGrid = document.getElementById('tech-trends-grid');
                break;
            case 'local':
                this.localNewsList = document.getElementById('local-news-list');
                this.featuredNews = document.getElementById('featured-local-news');
                this.politicsNewsList = document.getElementById('politics-news-list');
                this.financeNewsGrid = document.getElementById('finance-news-grid');
                break;
            case 'international':
                this.globalNewsList = document.getElementById('global-news-list');
                this.featuredNews = document.getElementById('featured-international-news');
                this.internationalPoliticsList = document.getElementById('international-politics-list');
                this.globalEconomyGrid = document.getElementById('global-economy-grid');
                break;
            case 'more':
                this.cultureNewsList = document.getElementById('culture-news-list');
                this.featuredNews = document.getElementById('featured-culture-news');
                this.healthNewsList = document.getElementById('health-news-list');
                this.sportsNewsGrid = document.getElementById('sports-news-grid');
                break;
        }
    }
    
    /**
     * 初始化UI控制器
     */
    async init() {
        try {
            // 設置UI控制器
            setUIController(this);
            
            // 根據頁面類型確定需要的新聞數量
            let newsLimit = 5; // 默認獲取5條
            let imageLimit = 5; // 默認處理5張圖片

            if (this.pageType === 'tech') {
                newsLimit = 12; // 科技頁面需要更多新聞
                imageLimit = 15; // 科技頁面處理更多圖片
            } else if (this.pageType === 'local') {
                 newsLimit = 7; // 國內頁面需要更多新聞
                 imageLimit = 15; // 國內頁面處理更多圖片
            } else if (this.pageType === 'international') {
                 newsLimit = 7; // 國際頁面需要更多新聞
                 imageLimit = 15; // 國際頁面處理更多圖片
            }
            // index 和 more 頁面使用默認的 newsLimit=5, imageLimit=5
            
            // 獲取和顯示新聞（根據頁面類型和需要的數量）
            await fetchAndDisplayPageNews(this.pageType, newsLimit, imageLimit); // <--- 使用動態 imageLimit
            
            console.log(`${this.pageType} 頁面新聞數據加載完成，請求數量: ${newsLimit}, 圖片處理限制: ${imageLimit}`);
        } catch (error) {
            console.error('初始化UI控制器時發生錯誤:', error);
            this.showError('載入新聞時發生錯誤，請稍後再試');
        }
    }
    
    /**
     * 將日期轉換為中文格式：年月日 週幾
     * @param {Date|string} dateStr 日期或日期字符串
     * @returns {string} 格式化後的中文日期
     */
    formatDateToChinese(dateStr) {
        if (!dateStr) return '';
        
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return ''; // 日期無效
            
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            
            // 獲取星期幾的中文
            const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
            const weekday = weekdays[date.getDay()];
            
            // 格式化時間部分（小時:分鐘）
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            
            // 組合成最終格式：2025年04月20日 週日 11:04
            return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日 週${weekday} ${hours}:${minutes}`;
        } catch (e) {
            console.error('日期格式化錯誤:', e);
            return '';
        }
    }
    
    /**
     * 顯示科技新聞
     * @param {Array} techNews 科技新聞數據
     */
    displayTechNews(techNews) {
        if (!this.techNewsList) return;
        
        // 清空現有內容
        this.techNewsList.innerHTML = '';
        
        // 遍歷科技新聞數據
        techNews.slice(0, 3).forEach(news => {
            const listItem = document.createElement('li');
            
            // 添加 data-link 屬性
            listItem.dataset.link = news.link;
            
            listItem.innerHTML = `
                <img src="${news.imageUrl}" alt="${news.title}" class="news-image tech-news-image">
                <div class="trailer-info">
                    <h3>${news.title}</h3>
                    <span class="news-source">${news.siteName || ''} · ${this.formatDateToChinese(news.pubDate)}</span>
                </div>
            `;
            
            // 添加點擊事件
            listItem.addEventListener('click', () => window.open(news.link, '_blank'));
            
            // 將新聞項目添加到列表
            this.techNewsList.appendChild(listItem);
        });
    }
    
    /**
     * 顯示全球熱點新聞（國際頁面）
     * @param {Array} globalNews 國際新聞數據
     */
    displayGlobalNews(globalNews) {
        if (!this.globalNewsList) return;
        
        // 清空現有內容
        this.globalNewsList.innerHTML = '';
        
        // 遍歷國際新聞數據
        globalNews.slice(0, 3).forEach(news => {
            const listItem = document.createElement('li');
            
            // 添加 data-link 屬性
            listItem.dataset.link = news.link;
            
            listItem.innerHTML = `
                <img src="${news.imageUrl}" alt="${news.title}" class="news-image global-news-image">
                <div class="trailer-info">
                    <h3>${news.title}</h3>
                    <span class="news-source">${news.siteName || ''} · ${this.formatDateToChinese(news.pubDate)}</span>
                </div>
            `;
            
            // 添加點擊事件
            listItem.addEventListener('click', () => window.open(news.link, '_blank'));
            
            // 將新聞項目添加到列表
            this.globalNewsList.appendChild(listItem);
        });
    }
    
    /**
     * 顯示科技產品評測（科技頁面）
     * @param {Array} techReviews 科技評測新聞數據
     */
    displayTechReviews(techReviews) {
        if (!this.techReviewsList) return;
        
        // 清空現有內容
        this.techReviewsList.innerHTML = '';
        
        // 遍歷科技評測新聞數據 - 改為只顯示前3條
        techReviews.slice(0, 3).forEach(news => {
            const listItem = document.createElement('li');
            
            // 添加 data-link 屬性
            listItem.dataset.link = news.link;
            
            listItem.innerHTML = `
                <img src="${news.imageUrl}" alt="${news.title}" class="news-image tech-review-image">
                <div class="continue-info">
                    <h3>${news.title}</h3>
                    <span class="news-source">${news.siteName || ''} · ${this.formatDateToChinese(news.pubDate)}</span>
                </div>
            `;
            
            // 添加點擊事件
            listItem.addEventListener('click', () => window.open(news.link, '_blank'));
            
            // 將新聞項目添加到列表
            this.techReviewsList.appendChild(listItem);
        });
    }
    
    /**
     * 顯示文化與藝術新聞（更多頁面）
     * @param {Array} cultureNews 文化新聞數據
     */
    displayCultureNews(cultureNews) {
        if (!this.cultureNewsList) return;
        
        // 清空現有內容
        this.cultureNewsList.innerHTML = '';
        
        // 遍歷文化新聞數據
        cultureNews.slice(0, 3).forEach(news => {
            const listItem = document.createElement('li');
            
            // 添加 data-link 屬性
            listItem.dataset.link = news.link;
            
            listItem.innerHTML = `
                <img src="${news.imageUrl}" alt="${news.title}" class="news-image culture-news-image">
                <div class="trailer-info">
                    <h3>${news.title}</h3>
                    <span class="news-source">${news.siteName || ''} · ${this.formatDateToChinese(news.pubDate)}</span>
                </div>
            `;
            
            // 添加點擊事件
            listItem.addEventListener('click', () => window.open(news.link, '_blank'));
            
            // 將新聞項目添加到列表
            this.cultureNewsList.appendChild(listItem);
        });
    }
    
    /**
     * 顯示健康與生活新聞（更多頁面）
     * @param {Array} healthNews 健康新聞數據
     */
    displayHealthNews(healthNews) {
        if (!this.healthNewsList) return;
        
        // 清空現有內容
        this.healthNewsList.innerHTML = '';
        
        // 遍歷健康新聞數據 - 改為只顯示前3條
        healthNews.slice(0, 3).forEach(news => {
            const listItem = document.createElement('li');
            
            // 添加 data-link 屬性
            listItem.dataset.link = news.link;
            
            listItem.innerHTML = `
                <img src="${news.imageUrl}" alt="${news.title}" class="news-image health-news-image">
                <div class="continue-info">
                    <h3>${news.title}</h3>
                    <span class="news-source">${news.siteName || ''} · ${this.formatDateToChinese(news.pubDate)}</span>
                </div>
            `;
            
            // 添加點擊事件
            listItem.addEventListener('click', () => window.open(news.link, '_blank'));
            
            // 將新聞項目添加到列表
            this.healthNewsList.appendChild(listItem);
        });
    }
    
    /**
     * 顯示國際政治新聞（國際頁面）
     * @param {Array} politicsNews 政治新聞數據
     */
    displayInternationalPolitics(politicsNews) {
        if (!this.internationalPoliticsList) return;
        
        // 清空現有內容
        this.internationalPoliticsList.innerHTML = '';
        
        // 遍歷國際政治新聞數據 - 改為只顯示前3條
        politicsNews.slice(0, 3).forEach(news => {
            const listItem = document.createElement('li');
            
            // 添加 data-link 屬性
            listItem.dataset.link = news.link;
            
            listItem.innerHTML = `
                <img src="${news.imageUrl}" alt="${news.title}" class="news-image politics-news-image">
                <div class="continue-info">
                    <h3>${news.title}</h3>
                    <span class="news-source">${news.siteName || ''} · ${this.formatDateToChinese(news.pubDate)}</span>
                </div>
            `;
            
            // 添加點擊事件
            listItem.addEventListener('click', () => window.open(news.link, '_blank'));
            
            // 將新聞項目添加到列表
            this.internationalPoliticsList.appendChild(listItem);
        });
    }
    
    /**
     * 顯示政治與社會新聞（國內頁面）
     * @param {Array} politicsNews 政治新聞數據
     */
    displayPoliticsNews(politicsNews) {
        if (!this.politicsNewsList) return;
        
        // 清空現有內容
        this.politicsNewsList.innerHTML = '';
        
        // 遍歷政治新聞數據 - 改為只顯示前3條
        politicsNews.slice(0, 3).forEach(news => {
            const listItem = document.createElement('li');
            listItem.dataset.link = news.link;
            listItem.innerHTML = `
                <img src="${news.imageUrl}" alt="${news.title}" class="news-image politics-news-image">
                <div class="continue-info">
                    <h3>${news.title}</h3>
                    <span class="news-source">${news.siteName || ''} · ${this.formatDateToChinese(news.pubDate)}</span>
                </div>
            `;
            listItem.addEventListener('click', () => window.open(news.link, '_blank'));
            this.politicsNewsList.appendChild(listItem);
        });
    }
    
    /**
     * 顯示焦點新聞
     * @param {Object} featuredNewsData 焦點新聞數據 (重命名參數避免混淆)
     */
    displayFeaturedNews(featuredNewsData) {
        if (!this.featuredNews || !featuredNewsData) return;
        
        // 清空現有內容
        this.featuredNews.innerHTML = '';
        
        // 創建焦點新聞元素
        const featuredElement = document.createElement('div');
        featuredElement.className = 'trending-content';
        // 添加 data-link 屬性到外層容器上
        featuredElement.dataset.link = featuredNewsData.link;
        
        // 處理描述文字 - 確保不會太長
        const maxDescLength = 300;
        let description = featuredNewsData.description || '';
        if (description.length > maxDescLength) {
            description = description.substring(0, maxDescLength) + '...';
        }
        
        featuredElement.innerHTML = `
            <img src="${featuredNewsData.imageUrl}" alt="${featuredNewsData.title}" class="trending-backdrop featured-news-image news-image">
            <div class="trending-info">
                <div class="genres">
                    <span>${featuredNewsData.siteName || '未知來源'}</span>
                    <span>${this.formatDateToChinese(featuredNewsData.pubDate)}</span>
                </div>
                <h1>${featuredNewsData.title}</h1>
                <p>${description}</p>
                <div class="actions">
                    <button class="btn btn-primary read-btn">閱讀</button>
                    <button class="btn btn-secondary"><i class="fas fa-share"></i> 分享</button>
                    <button class="btn btn-secondary icon-only"><i class="fas fa-ellipsis-h"></i></button>
                </div>
            </div>
        `;
        
        // 將焦點新聞添加到容器
        this.featuredNews.appendChild(featuredElement);

        // 在元素添加到 DOM 後，獲取圖片元素並賦值
        this.featuredNewsImage = featuredElement.querySelector('img.featured-news-image'); 
        // 獲取用於綁定點擊事件的元素 (例如閱讀按鈕)
        const readButton = featuredElement.querySelector('.read-btn');

        // 綁定點擊事件 - 只為閱讀按鈕綁定
        if(readButton && featuredNewsData && featuredNewsData.link) {
            // 使用 featuredNewsData.link
            readButton.onclick = () => window.open(featuredNewsData.link, '_blank');
        }
        
        /* // 移除整個卡片的點擊事件
        featuredElement.addEventListener('click', (e) => {
            // 避免點擊按鈕時觸發卡片的點擊事件
            if (!e.target.closest('.actions')) {
                window.open(featuredNewsData.link, '_blank');
            }
        });
        */
    }
    
    /**
     * 顯示國內新聞
     * @param {Array} localNews 國內新聞數據
     */
    displayLocalNews(localNews) {
        if (!this.localNewsList) return;
        
        // 清空現有內容
        this.localNewsList.innerHTML = '';
        
        // 遍歷國內新聞數據 - 改為只顯示前3條
        localNews.slice(0, 3).forEach(news => {
            const listItem = document.createElement('li');
            
            // 添加 data-link 屬性
            listItem.dataset.link = news.link;
            
            listItem.innerHTML = `
                <img src="${news.imageUrl}" alt="${news.title}" class="news-image local-news-image">
                <div class="continue-info">
                    <h3>${news.title}</h3>
                    <span class="news-source">${news.siteName || ''} · ${this.formatDateToChinese(news.pubDate)}</span>
                </div>
            `;
            
            // 添加點擊事件
            listItem.addEventListener('click', () => window.open(news.link, '_blank'));
            
            // 將新聞項目添加到列表
            this.localNewsList.appendChild(listItem);
        });
    }
    
    /**
     * 顯示更多焦點新聞（網格布局）
     * @param {Array} moreNews 更多焦點新聞數據
     * @param {string} targetElement 目標元素ID，不同頁面有不同的網格
     */
    displayGridNews(moreNews, targetElement) {
        const gridElement = targetElement || this.moreNewsGrid;
        if (!gridElement) return;
        
        // 清空現有內容
        gridElement.innerHTML = '';
        
        // 遍歷新聞數據
        moreNews.slice(0, 4).forEach(news => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            
            // 添加 data-link 屬性
            card.dataset.link = news.link;
            
            card.innerHTML = `
                <img src="${news.imageUrl}" alt="${news.title}" class="news-image grid-news-image">
                <div class="card-info">
                    <h3>${news.title}</h3>
                    <span class="news-source">${news.siteName || ''} · ${this.formatDateToChinese(news.pubDate)}</span>
                </div>
            `;
            
            // 添加點擊事件
            card.addEventListener('click', () => window.open(news.link, '_blank'));
            
            // 將新聞卡片添加到網格
            gridElement.appendChild(card);
        });
    }
    
    /**
     * 移除所有骨架屏加載效果
     */
    removeSkeletonLoaders() {
        const skeletons = document.querySelectorAll('.loading-placeholder');
        skeletons.forEach(skeleton => {
            skeleton.classList.remove('loading-placeholder');
        });
    }

    /**
     * 更新特定新聞項目的圖片
     * @param {string} link 新聞的唯一連結
     * @param {string} imageUrl 新的圖片URL
     */
    updateNewsItemImage(link, imageUrl) {
        if (!link || !imageUrl) return;

        const escapedLink = link.replace(/([!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~])/g, '\\$1');
        const element = document.querySelector(`[data-link="${escapedLink}"]`); 

        if (element) {
            const imgElement = element.querySelector('img.news-image'); 
            if (imgElement && imgElement.src !== imageUrl) {
                console.log(`更新圖片: ${link} -> ${imageUrl}`);
                imgElement.src = imageUrl;
            } else if (!imgElement) {
                // 元素找到了，但圖片沒找到，這可能是個問題，保留警告
                console.warn(`在 data-link=${link} 的元素內未找到 img.news-image`);
            }
        }
        // 找不到元素是預期行為 (對於未顯示的新聞)，不需要警告
    }

    /**
     * 顯示新聞列表到UI上，根據頁面類型處理
     * @param {Object} newsItems 包含所有分類新聞的對象
     * @param {string} pageType 頁面類型
     */
    displayNewsList(newsItems, pageType) {
        // newsItems 現在是一個按分類組織的對象，不再是扁平數組
        // 不需要也不能對 object 使用 forEach
        /*
        newsItems.forEach(item => { 
            if (!item.source && item.siteName) {
                item.source = item.siteName;
            }
            if (!item.source) {
                item.source = '未知來源';
            }
        });
        */
        
        // 根據頁面類型分別處理
        switch (pageType) {
            case 'index':
                this.displayIndexPageNews(newsItems);
                break;
            case 'tech':
                this.displayTechPageNews(newsItems);
                break;
            case 'local':
                this.displayLocalPageNews(newsItems);
                break;
            case 'international':
                this.displayInternationalPageNews(newsItems);
                break;
            case 'more':
                this.displayMorePageNews(newsItems);
                break;
            default:
                // 默認為首頁
                this.displayIndexPageNews(newsItems);
                break;
        }
        
        // 移除骨架屏
        this.removeSkeletonLoaders();
    }
    
    /**
     * 顯示首頁新聞
     * @param {Object} newsItems 包含所有分類新聞的對象
     */
    displayIndexPageNews(newsItems) {
        console.log("正在顯示首頁新聞...");
        
        // 將新聞按分類整理
        const categorizedNews = {};
        Object.keys(newsItems).forEach(category => {
            categorizedNews[category] = newsItems[category] || [];
        });
        
        console.log("已分類的新聞:", categorizedNews);
        
        // 1. 顯示焦點新聞 (使用 '頭條' 分類的第一條新聞)
        if (this.featuredNews && categorizedNews['頭條'] && categorizedNews['頭條'].length > 0) {
            this.displayFeaturedNews(categorizedNews['頭條'][0]);
        } else {
            console.warn("無法顯示焦點新聞，缺少容器或 '頭條' 新聞數據");
        }
        
        // 2. 顯示科技新聞 (使用 '科技' 分類的前3條新聞)
        if (this.techNewsList && categorizedNews['科技']) {
            this.displayTechNews(categorizedNews['科技'].slice(0, 3));
        } else {
            console.warn("無法顯示科技新聞，缺少容器或 '科技' 新聞數據");
        }
        
        // 3. 顯示國內消息 (使用 '政治' 分類的前4條新聞)
        if (this.localNewsList && categorizedNews['政治']) {
            this.displayLocalNews(categorizedNews['政治'].slice(0, 4));
        } else {
            console.warn("無法顯示國內消息，缺少容器或 '政治' 新聞數據");
        }
        
        // 4. 顯示更多焦點新聞 (使用 '頭條' 分類的第2條及以後的新聞，最多4條)
        if (this.moreNewsGrid && categorizedNews['頭條']) {
             // 使用 '頭條' 分類的第2條及以後的新聞
            const moreFeaturedNews = categorizedNews['頭條'].slice(1, 5); // 從索引1開始取最多4條
            this.displayGridNews(moreFeaturedNews, this.moreNewsGrid);
        } else {
            console.warn("無法顯示更多焦點新聞，缺少容器或 '頭條' 新聞數據");
        }
        
        console.log("首頁新聞顯示完畢");
    }
    
    /**
     * 顯示科技頁面新聞
     * @param {Object} newsItems 包含所有分類新聞的對象
     */
    displayTechPageNews(newsItems) {
        // 從傳入的物件中提取科技新聞陣列
        const techNewsArray = newsItems['科技'] || [];
        console.log("提取到的科技新聞陣列:", techNewsArray);

        if (techNewsArray.length === 0) {
            console.warn("沒有科技新聞可供顯示");
            // 確保即使沒有新聞，也移除骨架屏
             if(this.techNewsList) this.techNewsList.innerHTML = '';
             if(this.featuredNews) this.featuredNews.innerHTML = '';
             if(this.techReviewsList) this.techReviewsList.innerHTML = '';
             if(this.techTrendsGrid) this.techTrendsGrid.innerHTML = '';
            return;
        }

        // 焦點科技新聞 (使用提取出的陣列的第一條)
        const featuredItem = techNewsArray[0];
        if (featuredItem) {
             this.displayFeaturedNews(featuredItem);
        }

        // 最新科技資訊區 (顯示第 2, 3, 4 條)
        const listItems = techNewsArray.slice(1, 4);
        this.displayTechNews(listItems);


        // 科技產品評測和創新科技趨勢
        // 使用第 5 條及之後的新聞
        const remainingNews = techNewsArray.slice(4);
        const halfPoint = Math.ceil(remainingNews.length / 2);
        const reviewItems = remainingNews.slice(0, halfPoint);
        const trendItems = remainingNews.slice(halfPoint);

        this.displayTechReviews(reviewItems); // displayTechReviews 內部 slice(0, 3)
        this.displayGridNews(trendItems, this.techTrendsGrid); // displayGridNews 內部 slice(0, 4)
    }
    
    /**
     * 顯示國內頁面新聞
     * @param {Object} newsItems 包含所有分類新聞的對象
     */
    displayLocalPageNews(newsItems) {
        // 分離政治和財經新聞 (從物件中提取)
        const politicsNews = newsItems['政治'] || [];
        const financeNews = newsItems['財經'] || [];
        // 將兩個陣列合併用於選擇焦點新聞
        const allLocalNews = [...politicsNews, ...financeNews];

        console.log("提取到的政治新聞:", politicsNews);
        console.log("提取到的財經新聞:", financeNews);

        if (allLocalNews.length === 0) {
             console.warn("沒有國內新聞可供顯示");
             // 確保即使沒有新聞，也移除骨架屏
             if(this.localNewsList) this.localNewsList.innerHTML = '';
             if(this.featuredNews) this.featuredNews.innerHTML = '';
             if(this.politicsNewsList) this.politicsNewsList.innerHTML = '';
             if(this.financeNewsGrid) this.financeNewsGrid.innerHTML = '';
             return;
        }

        // 焦點國內新聞 (從合併後的陣列中選第一條)
        const featuredItem = allLocalNews[0];
         if (featuredItem) {
             this.displayFeaturedNews(featuredItem);
         }

        // 判斷焦點新聞是否來自政治分類
        const isPoliticsFeatured = politicsNews.length > 0 && politicsNews[0] === featuredItem;

        // 今日國內要聞 (如果焦點是政治第一條，則顯示政治第2,3,4條；否則顯示政治前3條)
        const politicsNewsForList = isPoliticsFeatured ? politicsNews.slice(1, 4) : politicsNews.slice(0, 3);
        this.displayLocalNews(politicsNewsForList); // displayLocalNews 內部 slice(0, 3)

        // 政治與社會 (從政治新聞中排除已在上方列表顯示的項目)
        const politicsStartIndexForBottom = isPoliticsFeatured ? 4 : 3; // 起始索引
        const politicsNewsForBottom = politicsNews.slice(politicsStartIndexForBottom, politicsStartIndexForBottom + 3);
        this.displayPoliticsNews(politicsNewsForBottom); // displayPoliticsNews 內部 slice(0, 3)

        // 財經新聞 (如果焦點是財經第一條，則顯示財經第2,3,4,5條；否則顯示財經前4條)
        const isFinanceFeatured = financeNews.length > 0 && financeNews[0] === featuredItem;
        const financeNewsForGrid = isFinanceFeatured ? financeNews.slice(1, 5) : financeNews.slice(0, 4);
        this.displayGridNews(financeNewsForGrid, this.financeNewsGrid); // displayGridNews 內部 slice(0, 4)
    }
    
    /**
     * 顯示國際頁面新聞
     * @param {Object} newsItems 包含各分類新聞的對象 { '國際': [], 'AI': [], 'Economy': [] }
     */
    displayInternationalPageNews(newsItems) {
        // 提取各分類新聞陣列
        const internationalNews = newsItems['國際'] || [];
        // const aiNews = newsItems['AI'] || []; // 不再需要 AI 新聞
        const economyNews = newsItems['Economy'] || [];

        console.log("收到的國際頁面新聞物件:", newsItems); // 添加日誌，檢查收到的結構
        console.log("提取到的國際(World)新聞:", internationalNews.length);
        // console.log("提取到的AI新聞:", aiNews.length); // 不再需要 AI 新聞
        console.log("提取到的經濟(Economy)新聞:", economyNews.length);

        // --- 重新分配新聞到各區塊 (新邏輯) ---

        // 1. 焦點新聞 (featured-international-news)
        //    使用 國際 (World) 新聞的第一條
        if (internationalNews.length > 0) {
            this.displayFeaturedNews(internationalNews[0]);
        } else {
             console.warn("沒有 國際(World) 新聞可供顯示焦點新聞");
             if(this.featuredNews) this.featuredNews.innerHTML = ''; // 清空骨架屏
        }

        // 2. 全球熱點 (global-news-list)
        //    使用 國際 (World) 新聞的第 2, 3, 4 條
        if (internationalNews.length > 1) {
            const listItems = internationalNews.slice(1, 4); // 取最多3條用於列表
            this.displayGlobalNews(listItems); // displayGlobalNews 內部會處理顯示邏輯 (通常是前3條)
        } else {
             console.warn("沒有足夠的 國際(World) 新聞可供顯示全球熱點列表");
             if(this.globalNewsList) this.globalNewsList.innerHTML = ''; // 清空骨架屏
        }

        // 3. 國際政治 (international-politics-list)
        //    **修改：** 使用 Economy 新聞的第 1, 2, 3 條
        if (economyNews.length > 0) {
            const politicsItems = economyNews.slice(0, 3); // 取前3條
            this.displayInternationalPolitics(politicsItems); // displayInternationalPolitics 內部處理顯示數量 (通常是前3條)
        } else {
             console.warn("沒有 Economy 新聞可供顯示國際政治列表");
             if(this.internationalPoliticsList) this.internationalPoliticsList.innerHTML = ''; // 清空骨架屏
        }

        // 4. 全球經濟 (global-economy-grid)
        //    **修改：** 使用 Economy 新聞的第 4, 5, 6, 7 條
        if (economyNews.length > 3) { // 確保至少有4條新聞才顯示此區塊
            const economyGridItems = economyNews.slice(3, 7); // 取第4到第7條 (最多4條)
            this.displayGridNews(economyGridItems, this.globalEconomyGrid); // displayGridNews 內部處理顯示數量 (通常是前4條)
        } else {
             console.warn("沒有足夠的 Economy 新聞 (至少4條) 可供顯示全球經濟網格");
             if(this.globalEconomyGrid) this.globalEconomyGrid.innerHTML = ''; // 清空骨架屏
        }
    }
    
    /**
     * 顯示更多分類頁面新聞
     * @param {Object} newsItems 包含所有分類新聞的對象
     */
    displayMorePageNews(newsItems) {
        // 分類新聞 (從物件中提取)
        const entertainmentNews = newsItems['娛樂'] || [];
        const sportsNews = newsItems['體育'] || [];
        const healthNews = newsItems['健康'] || [];
        const lifestyleNews = newsItems['生活'] || [];
        // 合併所有新聞用於選擇焦點新聞
        const allMoreNews = [...entertainmentNews, ...sportsNews, ...healthNews, ...lifestyleNews];

        console.log("提取到的娛樂新聞:", entertainmentNews);
        console.log("提取到的體育新聞:", sportsNews);
        console.log("提取到的健康新聞:", healthNews);
        console.log("提取到的生活新聞:", lifestyleNews);

        if (allMoreNews.length === 0) {
            console.warn("沒有更多分類新聞可供顯示");
             // 確保即使沒有新聞，也移除骨架屏
             if(this.cultureNewsList) this.cultureNewsList.innerHTML = '';
             if(this.featuredNews) this.featuredNews.innerHTML = '';
             if(this.healthNewsList) this.healthNewsList.innerHTML = '';
             if(this.sportsNewsGrid) this.sportsNewsGrid.innerHTML = '';
            return;
        }

        // 焦點新聞 (從所有 '更多' 分類新聞中選第一條)
        const featuredItem = allMoreNews[0];
        if (featuredItem) {
            this.displayFeaturedNews(featuredItem);
        }

        // 合併娛樂和生活為文化藝術
        const cultureNews = [...entertainmentNews, ...lifestyleNews];
        // 判斷焦點是否來自文化藝術的第一條
        const isCultureFeatured = cultureNews.length > 0 && cultureNews[0] === featuredItem;
        // 文化與藝術列表 (如果焦點是文化第一條，顯示文化第2,3,4條；否則顯示文化前3條)
        const cultureNewsForList = isCultureFeatured ? cultureNews.slice(1, 4) : cultureNews.slice(0, 3);
        this.displayCultureNews(cultureNewsForList); // displayCultureNews 內部 slice(0, 3)

        // 判斷焦點是否來自健康分類第一条
        const isHealthFeatured = healthNews.length > 0 && healthNews[0] === featuredItem;
        // 健康與生活列表 (如果焦點是健康第一條，顯示健康第2,3,4條；否則顯示健康前3條)
        const healthNewsForList = isHealthFeatured ? healthNews.slice(1, 4) : healthNews.slice(0, 3);
        this.displayHealthNews(healthNewsForList); // displayHealthNews 內部 slice(0, 3)

        // 判斷焦點是否來自體育分類第一条
        const isSportsFeatured = sportsNews.length > 0 && sportsNews[0] === featuredItem;
        // 體育新聞網格 (如果焦點是體育第一條，顯示體育第2,3,4,5條；否則顯示體育前4條)
        const sportsNewsForGrid = isSportsFeatured ? sportsNews.slice(1, 5) : sportsNews.slice(0, 4);
        this.displayGridNews(sportsNewsForGrid, this.sportsNewsGrid); // displayGridNews 內部 slice(0, 4)
    }
    
    /**
     * 顯示載入中提示
     */
    showLoading() {
        // 可以添加載入動畫或提示
        console.log('正在載入新聞...');
    }
    
    /**
     * 隱藏載入中提示
     */
    hideLoading() {
        // 隱藏載入動畫或提示
        console.log('新聞載入完成');
    }
    
    /**
     * 顯示錯誤訊息
     * @param {string} message 錯誤訊息
     */
    showError(message) {
        console.error(message);
        // 可以在UI上顯示錯誤提示
        // alert(message); // 註釋掉較好，避免擾民
    }
    
    /**
     * 更新進度條
     * @param {number} percent 進度百分比
     */
    updateProgressBar(percent) {
        // 目前未實現進度條UI，僅顯示日誌
        console.log(`載入進度: ${percent.toFixed(1)}%`);
    }
}

// 在DOM加載完成後初始化UI控制器
document.addEventListener('DOMContentLoaded', () => {
    new UIController();
}); 