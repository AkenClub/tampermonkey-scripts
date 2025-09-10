// ==UserScript==
// @name         芋道文档强制浅色 & 护眼模式
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  通过移除 dark class 强制启用浅色模式，并应用柔和的护眼背景色和文字颜色，让长时间阅读更舒适。
// @author       You & Full-Stack Expert
// @match        https://doc.iocoder.cn/*
// @grant        GM_addStyle
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // -------------------------------------------------------------------------
    // 第一部分：注入护眼模式的 CSS 样式
    // -------------------------------------------------------------------------

    // 定义护眼模式的颜色
    const EYE_CARE_BACKGROUND = '#F5F2E9'; // 柔和的米白/羊皮纸色背景
    const EYE_CARE_TEXT_COLOR = '#383838'; // 柔和的深灰色文字
    const EYE_CARE_SIDEBAR_BG = '#F2EEE2'; // 侧边栏用稍深一点的颜色以作区分

    const eyeCareCss = `
        /* 使用 !important 强制覆盖网站的原有样式 */

        /* 主要内容区域的背景和文字颜色 */
        body, .theme, .content-wrapper, .vp-doc {
            background-color: ${EYE_CARE_BACKGROUND} !important;
            color: ${EYE_CARE_TEXT_COLOR} !important;
        }

        /* 侧边栏背景颜色 */
        .sidebar {
            background-color: ${EYE_CARE_SIDEBAR_BG} !important;
        }

        /* 代码块、引用块等特殊区域的背景，让它比主背景稍亮以突出 */
        div[class*="language-"], .custom-block, table th {
            background-color: rgba(0, 0, 0, 0.04) !important;
        }

        /* 确保链接颜色在护眼背景下依然清晰可辨 */
        a {
            color: #0d638f !important;
        }
    `;

    // 在文档开始时立即注入我们的样式
    GM_addStyle(eyeCareCss);
    console.log('[芋道文档护眼模式] 已注入护眼样式。');


    // -------------------------------------------------------------------------
    // 第二部分：持续禁用网站自带的深色模式
    // (这部分逻辑与之前相同，确保网站不会覆盖我们的护眼样式)
    // -------------------------------------------------------------------------

    const DARK_MODE_CLASS = 'theme-mode-dark';

    /**
     * 核心函数：检查并移除 dark mode class
     */
    function forceLightMode() {
        if (document.body && document.body.classList.contains(DARK_MODE_CLASS)) {
            document.body.classList.remove(DARK_MODE_CLASS);
            console.log(`[芋道文档护眼模式] 已移除 '${DARK_MODE_CLASS}' class，防止覆盖护眼模式。`);
        }
    }

    const observer = new MutationObserver(forceLightMode);

    const htmlObserver = new MutationObserver(() => {
        if (document.body) {
            forceLightMode();
            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['class']
            });
            htmlObserver.disconnect();
        }
    });

    htmlObserver.observe(document.documentElement, {
        childList: true
    });

})();