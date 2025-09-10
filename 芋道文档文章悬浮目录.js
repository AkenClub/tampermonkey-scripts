// ==UserScript==
// @name         芋道文档文章悬浮目录
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  为 iocoder.cn 文章页面生成一个固定在右上角的悬浮目录，支持收起/展开并能记忆状态。
// @author       Gemini
// @match        https://www.iocoder.cn/*/*
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // 1. 定义悬浮目录的样式
    GM_addStyle(`
        #gemini-floating-toc {
            position: fixed;
            top: 100px;
            right: 20px;
            width: 280px;
            max-height: calc(100vh - 120px);
            background-color: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            z-index: 9999;
            opacity: 0.95;
            transition: all 0.3s ease;
            font-size: 14px;
            display: flex;
            flex-direction: column;
        }
        #gemini-floating-toc:hover {
            opacity: 1;
        }
        #gemini-floating-toc h3 {
            display: flex; /* 使用 Flexbox 布局 */
            justify-content: space-between; /* 两端对齐 */
            align-items: center; /* 垂直居中 */
            margin: 0;
            padding: 12px 16px;
            font-size: 16px;
            font-weight: bold;
            color: #333;
            background-color: #f0f0f0;
            border-bottom: 1px solid #e0e0e0;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            flex-shrink: 0;
        }
        /* 新增：收起/展开按钮样式 */
        #gemini-toc-toggle {
            font-size: 13px;
            font-weight: normal;
            color: #555;
            background-color: #e0e0e0;
            padding: 3px 8px;
            border-radius: 4px;
            cursor: pointer;
            user-select: none; /* 防止双击时选中文本 */
            transition: background-color 0.2s;
        }
        #gemini-toc-toggle:hover {
            background-color: #d0d0d0;
        }
        #gemini-floating-toc .toc-list-container {
            flex: 1;
            min-height: 0;
            padding: 10px 0;
            overflow-y: auto;
            /* 新增：平滑的显示/隐藏过渡 */
            transition: all 0.3s ease;
        }
        #gemini-floating-toc ol { list-style: none; padding: 0; margin: 0; }
        #gemini-floating-toc li { padding: 0; margin: 0; }
        #gemini-floating-toc a { display: block; padding: 6px 16px; color: #333; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: background-color 0.2s, color 0.2s; }
        #gemini-floating-toc a:hover { background-color: #e6e6e6; color: #000; }
        #gemini-floating-toc .toc-level-2 { padding-left: 30px; }
        #gemini-floating-toc .toc-level-3 { padding-left: 45px; }
        #gemini-floating-toc .toc-level-4 { padding-left: 60px; }

        /* 新增：收起状态的样式 */
        #gemini-floating-toc.toc-collapsed {
            width: auto; /* 宽度自适应 */
            height: auto; /* 高度自适应 */
            max-height: 45px; /* 约等于标题栏高度 */
        }
        #gemini-floating-toc.toc-collapsed .toc-list-container {
            /* 隐藏列表并移除内边距 */
            display: none;
            padding: 0;
        }
    `);

    // 2. 主函数，用于查找标题并创建目录
    function createTOC() {
        const articleContent = document.querySelector('.article-content');
        if (!articleContent) return;

        const headings = articleContent.querySelectorAll('h1, h2, h3, h4');
        if (headings.length < 2) return;

        // 创建目录容器
        const tocContainer = document.createElement('div');
        tocContainer.id = 'gemini-floating-toc';

        // 创建标题栏
        const tocHeader = document.createElement('h3');
        const tocTitle = document.createElement('span');
        tocTitle.textContent = '文章目录';

        // --- 新增：创建收起/展开按钮 ---
        const toggleButton = document.createElement('span');
        toggleButton.id = 'gemini-toc-toggle';

        tocHeader.appendChild(tocTitle);
        tocHeader.appendChild(toggleButton);
        tocContainer.appendChild(tocHeader);

        const listContainer = document.createElement('div');
        listContainer.className = 'toc-list-container';

        const tocList = document.createElement('ol');

        headings.forEach((heading, index) => {
            const anchorId = `toc-heading-${index}`;
            heading.id = anchorId;
            const level = parseInt(heading.tagName.substring(1), 10);

            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `#${anchorId}`;
            link.textContent = heading.textContent.trim();
            link.className = `toc-level-${level}`;

            link.addEventListener('click', function(e) {
                e.preventDefault();
                document.getElementById(anchorId).scrollIntoView({ behavior: 'smooth', block: 'start' });
                history.pushState(null, null, `#${anchorId}`);
            });

            listItem.appendChild(link);
            tocList.appendChild(listItem);
        });

        listContainer.appendChild(tocList);
        tocContainer.appendChild(listContainer);
        document.body.appendChild(tocContainer);

        // --- 新增：按钮的事件处理和状态管理 ---
        const updateButtonState = (isCollapsed) => {
            if (isCollapsed) {
                tocContainer.classList.add('toc-collapsed');
                toggleButton.textContent = '展开';
            } else {
                tocContainer.classList.remove('toc-collapsed');
                toggleButton.textContent = '收起';
            }
        };

        // 按钮点击事件
        toggleButton.addEventListener('click', () => {
            const isCurrentlyCollapsed = tocContainer.classList.contains('toc-collapsed');
            updateButtonState(!isCurrentlyCollapsed);
            sessionStorage.setItem('tocCollapsed', !isCurrentlyCollapsed);
        });

        // 初始化状态：从 sessionStorage 读取
        const initialCollapsedState = sessionStorage.getItem('tocCollapsed') === 'true';
        updateButtonState(initialCollapsedState);
    }

    // 3. 页面加载完成后执行
    createTOC();

})();