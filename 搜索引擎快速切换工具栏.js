// ==UserScript==
// @name         搜索引擎快速切换工具栏
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  一个可拖动、自动贴边、可收缩且能自动适配系统暗黑模式的精美搜索切换工具栏。已优化暗黑模式下的图标显示。
// @author       Gemini & YourName
// @match        *://*.bing.com/search*
// @match        *://*.google.com/search*
// @match        *://www.baidu.com/s*
// @match        *://hub.docker.com/search*
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // --- 配置 (无需改动) ---
    const searchEngines = [
        { name: 'Google', icon: 'https://www.google.com/favicon.ico', url: 'https://www.google.com/search?q=', match: /google\.com\/search/, queryParam: 'q' },
        { name: 'Bing', icon: 'https://www.bing.com/favicon.ico', url: 'https://www.bing.com/search?q=', match: /bing\.com\/search/, queryParam: 'q' },
        { name: 'Baidu', icon: 'https://www.baidu.com/favicon.ico', url: 'https://www.baidu.com/s?wd=', match: /baidu\.com\/s/, queryParam: 'wd' },
        { name: 'Docker Hub', icon: 'https://hub.docker.com/favicon.ico', url: 'https://hub.docker.com/search?q=', match: /hub\.docker\.com\/search/, queryParam: 'q' }
    ];

    // --- 核心逻辑 (无需改动) ---
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
        const lastPosition = GM_getValue('toolbarPosition');
        let isCollapsed = GM_getValue('isToolbarCollapsed', false);
        const toolbar = document.createElement('div');
        toolbar.id = 'search-switcher-toolbar';
        if (isCollapsed) toolbar.classList.add('collapsed');
        if (lastPosition) {
            toolbar.style.top = lastPosition.top;
            toolbar.style.left = lastPosition.left;
        }
        const titleBar = document.createElement('div');
        titleBar.className = 'toolbar-title';
        const titleText = document.createElement('span');
        titleText.textContent = '切换搜索';
        const collapseBtn = document.createElement('button');
        collapseBtn.id = 'collapse-btn';
        collapseBtn.textContent = isCollapsed ? '»' : '«';
        titleBar.appendChild(titleText);
        titleBar.appendChild(collapseBtn);
        toolbar.appendChild(titleBar);
        collapseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            isCollapsed = !isCollapsed;
            toolbar.classList.toggle('collapsed');
            collapseBtn.textContent = isCollapsed ? '»' : '«';
            GM_setValue('isToolbarCollapsed', isCollapsed);
        });
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
        makeDraggable(toolbar, titleBar);
    }

    function addStyles() {
        GM_addStyle(`
            #search-switcher-toolbar {
                --toolbar-bg: #ffffff;
                --toolbar-border: #e0e0e0;
                --toolbar-shadow: rgba(0, 0, 0, 0.08);
                --toolbar-text: #202124;
                --title-bg: #f8f9fa;
                --item-hover-bg: #f1f3f4;
                --button-text: #5f6368;
                --button-hover-text: #202124;
            }

            @media (prefers-color-scheme: dark) {
                #search-switcher-toolbar {
                    --toolbar-bg: #202124;
                    --toolbar-border: #3c4043;
                    --toolbar-shadow: rgba(0, 0, 0, 0.3);
                    --toolbar-text: #e8eaed;
                    --title-bg: #303134;
                    --item-hover-bg: #3c4043;
                    --button-text: #bdc1c6;
                    --button-hover-text: #ffffff;
                }

                /* ==================== 关键修复 ==================== */
                /* 将深色的DockerHub图标在暗黑模式下反转为白色，以保证可见性 */
                #search-switcher-toolbar li a[href*="hub.docker.com"] .engine-icon {
                    filter: brightness(0) invert(1);
                }
                /* ================================================ */
            }

            #search-switcher-toolbar {
                position: fixed; top: 150px; left: 10px; width: 120px;
                background-color: var(--toolbar-bg);
                border: 1px solid var(--toolbar-border);
                border-radius: 8px; z-index: 99999;
                box-shadow: 0 4px 16px var(--toolbar-shadow);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                font-size: 14px;
                transition: width 0.3s ease, left 0.3s ease, top 0.3s ease;
                user-select: none; overflow: hidden; color: var(--toolbar-text);
            }
            #search-switcher-toolbar.dragging {
                transition: none; box-shadow: 0 8px 24px var(--toolbar-shadow); opacity: 0.95;
            }
            .toolbar-title {
                display: flex; justify-content: space-between; align-items: center;
                height: 38px; padding: 0 5px 0 12px; font-weight: 600;
                background-color: var(--title-bg);
                border-bottom: 1px solid var(--toolbar-border);
                cursor: move;
            }
            #collapse-btn {
                background: none; border: none; font-size: 18px;
                cursor: pointer; padding: 0 5px; color: var(--button-text);
                transition: color 0.2s;
            }
            #collapse-btn:hover { color: var(--button-hover-text); }
            #search-switcher-toolbar ul { list-style: none; padding: 5px 0; margin: 0; }
            #search-switcher-toolbar li a {
                display: flex; align-items: center; padding: 8px 12px;
                text-decoration: none; color: var(--toolbar-text);
                transition: background-color 0.2s; border-radius: 4px; margin: 0 5px;
            }
            #search-switcher-toolbar li a:hover { background-color: var(--item-hover-bg); }
            .engine-icon { width: 16px; height: 16px; margin-right: 10px; }
            #search-switcher-toolbar.collapsed { width: 42px; }
            #search-switcher-toolbar.collapsed .toolbar-title { padding: 0; justify-content: center; }
            #search-switcher-toolbar.collapsed .toolbar-title > span { display: none; }
            #search-switcher-toolbar.collapsed li a span { display: none; }
            #search-switcher-toolbar.collapsed li a { justify-content: center; padding: 8px; }
            #search-switcher-toolbar.collapsed .engine-icon { margin-right: 0; }
        `);
    }

    // --- 拖动逻辑 (无需改动) ---
    function makeDraggable(toolbar, handle) {
        let offsetX, offsetY, isDragging = false;
        handle.addEventListener('mousedown', (e) => {
            if (e.target.id === 'collapse-btn') return;
            e.preventDefault();
            isDragging = true;
            toolbar.classList.add('dragging');
            offsetX = e.clientX - toolbar.offsetLeft;
            offsetY = e.clientY - toolbar.offsetTop;
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        function onMouseMove(e) {
            if (!isDragging) return;
            let newLeft = e.clientX - offsetX, newTop = e.clientY - offsetY;
            const screenWidth = window.innerWidth, screenHeight = window.innerHeight, toolbarWidth = toolbar.offsetWidth, toolbarHeight = toolbar.offsetHeight;
            if (newLeft < 0) newLeft = 0; if (newTop < 0) newTop = 0;
            if (newLeft > screenWidth - toolbarWidth) newLeft = screenWidth - toolbarWidth;
            if (newTop > screenHeight - toolbarHeight) newTop = screenHeight - toolbarHeight;
            toolbar.style.left = `${newLeft}px`; toolbar.style.top = `${newTop}px`;
        }
        function onMouseUp(e) {
            if (!isDragging) return;
            isDragging = false;
            toolbar.classList.remove('dragging');
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            const screenWidth = window.innerWidth, toolbarCenter = toolbar.offsetLeft + toolbar.offsetWidth / 2, snapMargin = 10;
            let finalLeft = (toolbarCenter < screenWidth / 2) ? snapMargin : (screenWidth - toolbar.offsetWidth - snapMargin);
            toolbar.style.left = `${finalLeft}px`;
            GM_setValue('toolbarPosition', { top: toolbar.style.top, left: toolbar.style.left });
        }
    }

    // --- 启动逻辑 (无需改动) ---
    function run() {
        const searchInfo = getCurrentSearch();
        if (searchInfo && searchInfo.query) {
            if (!document.body) { setTimeout(run, 100); return; }
            addStyles();
            createToolbar(searchInfo);
            if (observer) observer.disconnect();
        }
    }
    run();
    let observer;
    if (!document.getElementById('search-switcher-toolbar')) {
        observer = new MutationObserver(run);
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
})();