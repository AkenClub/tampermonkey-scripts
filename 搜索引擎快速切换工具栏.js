// ==UserScript==
// @name         搜索引擎快速切换工具栏
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  在Google、Bing、Baidu、Docker Hub等搜索引擎页面左侧显示一个工具栏。加载迅速且兼容动态内容页面。
// @author       Gemini
// @match        *://*.bing.com/search*
// @match        *://*.google.com/search*
// @match        *://www.baidu.com/s*
// @match        *://hub.docker.com/search*
// @grant        GM_addStyle
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // --- 配置 ---
    const searchEngines = [
        { name: 'Google', icon: 'https://www.google.com/favicon.ico', url: 'https://www.google.com/search?q=', match: /google\.com\/search/, queryParam: 'q' },
        { name: 'Bing', icon: 'https://www.bing.com/favicon.ico', url: 'https://www.bing.com/search?q=', match: /bing\.com\/search/, queryParam: 'q' },
        { name: 'Baidu', icon: 'https://www.baidu.com/favicon.ico', url: 'https://www.baidu.com/s?wd=', match: /baidu\.com\/s/, queryParam: 'wd' },
        { name: 'Docker Hub', icon: 'https://hub.docker.com/favicon.ico', url: 'https://hub.docker.com/search?q=', match: /hub\.docker\.com\/search/, queryParam: 'q' }
    ];

    // --- 核心逻辑 (与之前版本相同) ---
    function getQueryParam(param) { return new URLSearchParams(window.location.search).get(param); }
    function getCurrentSearch() {
        const url = window.location.href;
        for (const engine of searchEngines) {
            if (engine.match.test(url)) {
                const query = getQueryParam(engine.queryParam);
                if (query) return { currentEngine: engine.name, query };
            }
        }
        return null;
    }
    function createToolbar(searchInfo) {
        if (!searchInfo || document.getElementById('search-switcher-toolbar')) return;
        const toolbar = document.createElement('div');
        toolbar.id = 'search-switcher-toolbar';
        const title = document.createElement('div');
        title.className = 'toolbar-title';
        title.textContent = '切换搜索';
        toolbar.appendChild(title);
        const ul = document.createElement('ul');
        searchEngines.forEach(engine => {
            if (engine.name === searchInfo.currentEngine) return;
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = engine.url + encodeURIComponent(searchInfo.query);
            a.target = '_self';
            const img = document.createElement('img');
            img.src = engine.icon;
            img.className = 'engine-icon';
            const span = document.createElement('span');
            span.textContent = engine.name;
            a.appendChild(img); a.appendChild(span); li.appendChild(a); ul.appendChild(li);
        });
        toolbar.appendChild(ul);
        document.body.appendChild(toolbar);
    }
    function addStyles() { GM_addStyle(`...样式代码省略，与之前版本相同...`);}
    /* 在此粘贴之前版本中的完整CSS样式代码 */
    GM_addStyle(`
        #search-switcher-toolbar { position: fixed; top: 150px; left: 10px; width: 100px; background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; z-index: 99999; box-shadow: 0 4px 8px rgba(0,0,0,0.1); font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 14px; transition: transform 0.3s ease; }
        #search-switcher-toolbar:hover { transform: translateX(5px); }
        .toolbar-title { padding: 10px; font-weight: bold; text-align: center; background-color: #000000; border-bottom: 1px solid #ddd; border-top-left-radius: 8px; border-top-right-radius: 8px; }
        #search-switcher-toolbar ul { list-style: none; padding: 5px 0; margin: 0; }
        #search-switcher-toolbar li a { display: flex; align-items: center; padding: 8px 12px; text-decoration: none; color: #333; transition: background-color 0.2s; }
        #search-switcher-toolbar li a:hover { background-color: #e9e9e9; }
        .engine-icon { width: 16px; height: 16px; margin-right: 10px; }
    `);

    // --- 主执行函数 ---
    function run() {
        const searchInfo = getCurrentSearch();
        if (searchInfo && searchInfo.query) {
            if (!document.body) { // 如果body还不存在，稍等一下
                setTimeout(run, 100);
                return;
            }
            addStyles();
            createToolbar(searchInfo);
            // 成功创建后，可以停止观察
            if (observer) observer.disconnect();
        }
    }

    // --- 启动逻辑 ---

    // 1. 立即尝试运行
    run();

    // 2. 如果没有成功，则设置一个观察器以应对动态加载
    let observer;
    if (!document.getElementById('search-switcher-toolbar')) {
        observer = new MutationObserver((mutations) => {
            // 每当DOM变化时，我们都重新尝试运行一次
            run();
        });

        // 配置观察器：监视子元素列表的变化
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }
})();