// ==UserScript==
// @name         V2EX Hide All Images
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  隐藏图片 on v2ex.com
// @author       You (with AI assistance)
// @match        *://*.v2ex.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=v2ex.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    console.log('Tampermonkey: V2EX Hide All Images script starting...');

    // Create a <style> element to inject CSS rules
    const style = document.createElement('style');
    style.type = 'text/css';

    // CSS rules to hide images
    // 1. Hide elements rendered via <img> tag
    // 2. Remove background images from all elements
    // Using !important to ensure override
    const cssRules = `
        img {
            display: none !important;
            visibility: hidden !important; /* Double ensure */
        }

        * {
            background-image: none !important;
        }
    `;

    // Add the CSS rules to the <style> element
    style.textContent = cssRules;

    // Append the <style> element to the <head> or the root element
    // This should happen very early due to @run-at document-start
    (document.head || document.documentElement).appendChild(style);

    console.log('Tampermonkey: V2EX Hide All Images CSS injected.');

})();