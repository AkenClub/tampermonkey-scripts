// ==UserScript==
// @name         Linux.do Copy Topic Content (Markdown)
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  在 Linux.do 帖子侧边栏添加复制按钮，一键将楼主内容转换为 Markdown 格式（支持 Emoji 尺寸优化、标题清洗、链接补全）。
// @author       You
// @match        https://linux.do/t/*
// @icon         https://linux.do/uploads/default/optimized/4X/c/c/d/ccd8c210609d498cbeb3d5201d4c259348447562_2_32x32.png
// @require      https://unpkg.com/turndown/dist/turndown.js
// @require      https://unpkg.com/turndown-plugin-gfm/dist/turndown-plugin-gfm.js
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // 初始化 Turndown 服务
    const turndownService = new TurndownService({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        emDelimiter: '*',
        hr: '---'
    });
    turndownService.use(turndownPluginGfm.gfm);

    // === 新增：Emoji 专属优化规则 ===
    // 作用：拦截 Discourse 的 emoji 图片，强制输出为带宽高的 HTML 标签，而不是 markdown 图片语法
    turndownService.addRule('discourse-emoji', {
        filter: function (node, options) {
            // 筛选条件：标签是 IMG 且 (class包含 emoji 或 src路径包含 emoji)
            return (
                node.nodeName === 'IMG' &&
                (node.classList.contains('emoji') || (node.getAttribute('src') && node.getAttribute('src').includes('/emoji/')))
            );
        },
        replacement: function (content, node) {
            // 获取图片的绝对路径（node.src 获取的是完整 URL，getAttribute 获取的是相对路径）
            // 建议使用绝对路径，这样复制到其他地方也能显示
            const src = node.src;
            const alt = node.getAttribute('alt') || '';
            const title = node.getAttribute('title') || '';

            // 返回 HTML 格式，强制锁定 20x20，并添加垂直居中样式让排版更美观
            return `<img src="${src}" alt="${alt}" title="${title}" width="20" height="20" style="vertical-align: middle;">`;
        }
    });
    // === Emoji 规则结束 ===

    // 图标 SVG
    const COPY_ICON_SVG = `
        <svg class="fa d-icon d-icon-copy svg-icon svg-string" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
            <use href="#copy"></use>
        </svg>
    `;

    // 核心功能：处理并复制内容
    function copyPostContent() {
        // 1. 获取标题
        const titleElement = document.querySelector('.fancy-title');
        const title = titleElement ? titleElement.innerText.trim() : "Untitled";

        // 2. 获取一楼内容
        let postContent = document.querySelector('#post_1 .cooked');
        if (!postContent) {
            postContent = document.querySelector('.post__regular .cooked');
        }

        if (!postContent) {
            alert('未找到帖子内容区域！');
            return;
        }

        // 3. 克隆节点进行深度清洗
        const clone = postContent.cloneNode(true);

        // === 核心清洗逻辑 ===

        // 优化 1: 清理标题中的锚点
        clone.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(header => {
            header.querySelectorAll('a.anchor, a[name]').forEach(a => a.remove());
        });

        // 优化 2: 处理 Onebox (网址预览卡片) -> 转为纯链接
        clone.querySelectorAll('aside.onebox').forEach(onebox => {
            const linkElem = onebox.querySelector('header a[href]') ||
                             onebox.querySelector('h3 a[href]') ||
                             onebox.querySelector('.source a[href]');

            if (linkElem) {
                const newLink = document.createElement('a');
                newLink.href = linkElem.href;
                newLink.textContent = linkElem.textContent.trim() || linkElem.href;
                // 用简单的链接替换整个卡片，包裹 P 标签保持换行
                const p = document.createElement('p');
                p.appendChild(newLink);
                onebox.replaceWith(p);
            }
        });

        // 优化 3: 补全相对路径链接
        clone.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            if (href && href.startsWith('/')) {
                a.href = 'https://linux.do' + href;
            }
            // 移除引用标题中的头像干扰
            if (a.classList.contains('avatar') || a.querySelector('img.avatar')) {
                if(a.closest('.title')) {
                     a.remove();
                }
            }
        });

        // 杂项清理
        clone.querySelectorAll('.codeblock-button-wrapper').forEach(el => el.remove());
        clone.querySelectorAll('.lightbox-wrapper .meta').forEach(el => el.remove());
        clone.querySelectorAll('.quote-controls, .quote-button').forEach(el => el.remove());

        // 引用标题文字清理
        clone.querySelectorAll('.quote .title').forEach(titleDiv => {
             titleDiv.innerHTML = titleDiv.innerHTML.replace(/[\n\r]+/g, ' ').trim();
        });

        // === 清洗结束 ===

        // 4. 转换为 Markdown
        let markdown = turndownService.turndown(clone.innerHTML);

        // 5. 组合
        const finalContent = `# ${title}\n\n${markdown}`;

        // 6. 复制
        GM_setClipboard(finalContent, 'text');
        showToast("✅ 已复制全文 Markdown！");
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.textContent = message;
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#28a745',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            zIndex: '9999',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            fontSize: '14px',
            fontWeight: 'bold'
        });
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    function insertButton() {
        const controls = document.querySelector('.timeline-controls');
        if (!controls || controls.querySelector('.linux-do-copy-btn')) return;

        const btn = document.createElement('button');
        btn.className = 'btn no-text btn-icon icon btn-default linux-do-copy-btn';
        btn.title = '复制全文 Markdown';
        btn.type = 'button';
        btn.innerHTML = `${COPY_ICON_SVG}<span aria-hidden="true">&ZeroWidthSpace;</span>`;
        btn.style.marginBottom = '8px';

        btn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            copyPostContent();
        });

        controls.prepend(btn);
    }

    const observer = new MutationObserver(() => {
        if (document.querySelector('.timeline-controls')) {
            insertButton();
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    insertButton();

})();
