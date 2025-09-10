// ==UserScript==
// @name         芋道文档VIP解锁
// @namespace    none
// @version      2.1
// @license      MIT
// @description  Bypasses the paywall by faking the VIP cookie and blocking the server-side validation request. This should be the final solution.
// @author       The love you care & Refactored by a Full-Stack Expert
// @match        https://www.iocoder.cn/*
// @match        https://doc.iocoder.cn/*
// @match        https://cloud.iocoder.cn/*
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // --------------------------------------------------
    // 阶段一：在页面加载之初，抢先设置伪造的 VIP Cookie
    // --------------------------------------------------
    const VIP_COOKIE_NAME = "88974ed8-6aff-48ab-a7d1-4af5ffea88bb";
    const AUTH_API_PATH = "/zsxq/auth"; // 后端验证 API 的路径

    // 立即设置 Cookie，让网站的第一道检查失效
    document.cookie = `${VIP_COOKIE_NAME}=true; path=/; max-age=31536000`; // 有效期一年
    console.log(`芋道文档VIP解锁: [Stage 1] Fake VIP Cookie "${VIP_COOKIE_NAME}" has been set.`);

    // 作为保险，继续禁用弹窗
    Object.defineProperty(unsafeWindow, 'jqueryAlert', {
        value: () => ({ show: () => {}, close: () => {} }),
        writable: false,
        configurable: true
    });
    console.log(`芋道文档VIP解锁: [Stage 1] Annoying alert system has been disabled.`);


    // --------------------------------------------------
    // 阶段二：拦截并阻止后端的验证请求，防止无限刷新
    // --------------------------------------------------

    // 网站使用 jQuery 发起请求，我们需要在 jQuery 加载后对其进行“手术”
    const patchJQuery = () => {
        // 确认 jQuery 和 $.get 方法已存在于页面上
        if (typeof unsafeWindow.$ === 'undefined' || typeof unsafeWindow.$.get === 'undefined') {
            return false; // jQuery 还没准备好，稍后再试
        }

        const originalJQueryGet = unsafeWindow.$.get;
        // 替换 $.get 方法
        unsafeWindow.$.get = function(url, ...args) {
            // 检查 URL 是否是我们想要拦截的那个验证 API
            if (typeof url === 'string' && url.includes(AUTH_API_PATH)) {
                // 如果是，则拦截它！
                console.log(`芋道文档VIP解锁: [Stage 2] BLOCKED server-side validation request to: ${url}`);
                // 我们什么都不做，不发送请求，也不执行回调。
                // 这样，包含 location.reload() 的那段代码就永远不会被执行。
                return; // 直接返回，中断函数执行
            }
            // 如果是其他正常的 API 请求，则调用原始的 $.get 方法，不要影响网站其他功能
            return originalJQueryGet.apply(this, [url, ...args]);
        };

        console.log('芋道文档VIP解锁: [Stage 2] jQuery has been patched. API validation is now under control.');
        return true;
    };

    // 使用定时器轮询，直到 jQuery 加载完毕并成功 patch
    const patchInterval = setInterval(() => {
        if (patchJQuery()) {
            clearInterval(patchInterval); // 成功后清除定时器
        }
    }, 50); // 每 50 毫秒检查一次

})();