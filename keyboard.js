/* ============================================================
   keyboard.js — Liquid Glass Virtual Keyboard (self-contained)
   Auto-injects CSS, HTML, dependencies, and hooks into all
   text inputs. Settings persisted in localStorage.
   ============================================================ */
(function () {
    "use strict";

    /* ---------- CONFIG / STATE ---------- */
    var MIN_H = 28, MAX_H = 120;
    var DEF = { height: 48, iconPack: "fa", keyColor: "#050505", kbColor: "#a0a0aa", autoHeight: true };
    var STO = { height: "vk.height", iconPack: "vk.iconPack", keyColor: "vk.keyColor", kbColor: "vk.kbColor", autoHeight: "vk.autoHeight" };
    var settings = {
        height: DEF.height, iconPack: DEF.iconPack, keyColor: DEF.keyColor,
        kbColor: DEF.kbColor, autoHeight: DEF.autoHeight
    };

    var ICONS = {
        fa: {
            "{bksp}": '<i class="fa-solid fa-delete-left"></i>',
            "{enter}": '<i class="fa-solid fa-arrow-turn-down"></i>',
            "{shift}": '<i class="fa-solid fa-lock"></i>',
            "{tab}": '<i class="fa-solid fa-indent"></i>',
            "{space}": '<i class="fa-solid fa-minus"></i>',
            "{123}": "123",
            "{abc}": "ABC"
        },
        ri: {
            "{bksp}": '<i class="ri-delete-back-2-line"></i>',
            "{enter}": '<i class="ri-corner-down-left-line"></i>',
            "{shift}": '<i class="ri-lock-line"></i>',
            "{tab}": '<i class="ri-indent-increase"></i>',
            "{space}": '<i class="ri-subtract-line"></i>',
            "{123}": "123",
            "{abc}": "ABC"
        }
    };

    /* ---------- STORAGE ---------- */
    function loadSettings() {
        try {
            var h = parseInt(localStorage.getItem(STO.height), 10);
            if (!isNaN(h) && h >= MIN_H && h <= MAX_H) settings.height = h;
            var p = localStorage.getItem(STO.iconPack);
            if (p === "fa" || p === "ri") settings.iconPack = p;
            var kc = localStorage.getItem(STO.keyColor);
            if (kc && /^#[0-9a-f]{6}$/i.test(kc)) settings.keyColor = kc;
            var kbc = localStorage.getItem(STO.kbColor);
            if (kbc && /^#[0-9a-f]{6}$/i.test(kbc)) settings.kbColor = kbc;
            var ah = localStorage.getItem(STO.autoHeight);
            if (ah === "0") settings.autoHeight = false; else if (ah === "1") settings.autoHeight = true;
        } catch (e) { }
    }
    function saveSettings() {
        try {
            localStorage.setItem(STO.height, String(settings.height));
            localStorage.setItem(STO.iconPack, settings.iconPack);
            localStorage.setItem(STO.keyColor, settings.keyColor);
            localStorage.setItem(STO.kbColor, settings.kbColor);
            localStorage.setItem(STO.autoHeight, settings.autoHeight ? "1" : "0");
        } catch (e) { }
    }

    /* ---------- COLOR HELPERS ---------- */
    function hexToRgb(h) {
        h = h.replace("#", "");
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        var n = parseInt(h, 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    function rgbToHex(r, g, b) {
        function c(x) { var v = Math.round(Math.max(0, Math.min(255, x))).toString(16); return v.length === 1 ? "0" + v : v; }
        return "#" + c(r) + c(g) + c(b);
    }
    function rgba(hex, a) { var c = hexToRgb(hex); return "rgba(" + c.r + "," + c.g + "," + c.b + "," + a + ")"; }
    function scaleRgb(hex, f) { var c = hexToRgb(hex); return rgbToHex(c.r * f, c.g * f, c.b * f); }
    function lum(hex) { var c = hexToRgb(hex); return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255; }
    function bright(hex, amt) {
        var c = hexToRgb(hex), r, g, b;
        if (amt > 0) { r = c.r + (255 - c.r) * amt; g = c.g + (255 - c.g) * amt; b = c.b + (255 - c.b) * amt; }
        else { r = c.r * (1 + amt); g = c.g * (1 + amt); b = c.b * (1 + amt); }
        return rgbToHex(r, g, b);
    }

    loadSettings();

    /* ============================================================
       1. INJECT CSS IMMEDIATELY (no dependencies)
       ============================================================ */
    (function injectCSS() {
        if (document.getElementById("vk-styles")) return;
        var s = document.createElement("style");
        s.id = "vk-styles";
        s.textContent =
            ':root{--vk-accent:#0a84ff;--vk-text:#fff;--vk-muted:#8e8e93;' +
            '--vk-key:#050505;--vk-key-hover:#1a1a1a;--vk-key-alt:#131316;' +
            '--vk-key-alt-hover:#232326;--vk-key-text:#fff;' +
            '--vk-key-shadow:0 3px 10px rgba(0,0,0,.85),0 1px 2px rgba(0,0,0,.9),inset 0 1px 0 rgba(255,255,255,.13),inset 0 -1px 0 rgba(0,0,0,.75);' +
            '--vk-glass-1:rgba(160,160,170,.55);--vk-glass-2:rgba(115,115,125,.66);--vk-glass-3:rgba(85,85,95,.75);' +
            '--vk-font:ui-rounded,"SF Pro Rounded","SF Compact Rounded",-apple-system,BlinkMacSystemFont,"Nunito","Segoe UI Variable Display","Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;' +
            '--vk-key-h:48px;--vk-key-fs:calc(var(--vk-key-h) * .32);--vk-icon-size:calc(var(--vk-key-h) * .36);' +
            '--vk-key-radius:calc(var(--vk-key-h) * .25);--vk-row-gap:calc(var(--vk-key-h) * .15);' +
            '--vk-pad-x:12px;--vk-pad-y:16px;}' +
            '.kb-wrap,.kb-wrap *,.kb-settings-overlay,.kb-settings-overlay *,.kb-resize-handle,.kb-resize-handle *,.kb-resize-toast,.kb-resize-toast *,.kb-resize-backdrop{box-sizing:border-box}' +
            '.kb-wrap{position:fixed;left:0;right:0;bottom:0;width:100%;z-index:2147483000;padding-bottom:env(safe-area-inset-bottom);border-top-left-radius:36px;border-top-right-radius:36px;' +
            'background:linear-gradient(180deg,var(--vk-glass-1) 0%,var(--vk-glass-2) 55%,var(--vk-glass-3) 100%);' +
            'backdrop-filter:blur(44px) saturate(200%);-webkit-backdrop-filter:blur(44px) saturate(200%);' +
            'border:1px solid rgba(255,255,255,.14);border-bottom:none;' +
            'box-shadow:0 -24px 70px rgba(0,0,0,.75),0 -2px 12px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.30);' +
            'transform:translateY(110%);opacity:0;will-change:transform,opacity;-webkit-touch-callout:none;-webkit-user-select:none;user-select:none;overflow:hidden;' +
            'font-family:var(--vk-font);font-weight:700;letter-spacing:-.01em;color:var(--vk-text);}' +
            '.kb-wrap.closed{pointer-events:none}' +
            '.kb-header{display:flex;align-items:center;justify-content:flex-end;gap:8px;padding:10px 16px 4px;position:relative;z-index:5;flex-shrink:0}' +
            '.kb-icon-btn{width:38px;height:38px;display:flex;align-items:center;justify-content:center;border:1px solid rgba(255,255,255,.16);border-radius:50%;background:rgba(10,10,12,.55);color:var(--vk-text);font-size:17px;cursor:pointer;' +
            'backdrop-filter:blur(18px) saturate(180%);-webkit-backdrop-filter:blur(18px) saturate(180%);box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 4px 14px rgba(0,0,0,.6);' +
            'transition:background .15s,color .15s,border-color .15s,transform .12s;touch-action:manipulation;padding:0;line-height:0}' +
            '.kb-icon-btn:hover{background:rgba(255,255,255,.08)}.kb-icon-btn:active{transform:scale(.9)}' +
            '.kb-settings-btn.active{background:rgba(10,132,255,.22);border-color:rgba(10,132,255,.6);color:#4fa8ff;box-shadow:0 0 0 1px rgba(10,132,255,.35),0 0 18px rgba(10,132,255,.4),inset 0 1px 0 rgba(255,255,255,.25)}' +
            '.kb-settings-btn.active svg{animation:vkGearSpin 6s linear infinite}' +
            '@keyframes vkGearSpin{from{transform:rotate(0)}to{transform:rotate(360deg)}}' +
            '.kb-close:hover{background:rgba(255,69,58,.18);border-color:rgba(255,69,58,.55);color:#ff8a80}' +
            '.kb-wrap .simple-keyboard{position:relative;z-index:5;width:100%}' +
            '.kb-settings-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(52,52,62,.97) 0%,rgba(28,28,36,.985) 100%);' +
            'backdrop-filter:blur(30px) saturate(180%);-webkit-backdrop-filter:blur(30px) saturate(180%);border-top-left-radius:inherit;border-top-right-radius:inherit;z-index:25;display:flex;flex-direction:column;overflow:hidden;' +
            'transform:translateY(102%);opacity:0;pointer-events:none;will-change:transform,opacity;transition:transform .34s cubic-bezier(.34,1.15,.64,1),opacity .2s ease;color:var(--vk-text);font-family:var(--vk-font)}' +
            '.kb-settings-overlay.open{transform:translateY(0);opacity:1;pointer-events:auto}' +
            '.kb-settings-overlay__nav{display:flex;align-items:center;justify-content:space-between;padding:12px 16px 6px;width:100%;flex-shrink:0}' +
            '.kb-settings-overlay__back{appearance:none;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border-radius:50%;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.35);color:#fff;cursor:pointer;transition:background .15s,transform .12s;padding:0}' +
            '.kb-settings-overlay__back:hover{background:rgba(255,255,255,.10)}.kb-settings-overlay__back:active{transform:scale(.9)}' +
            '.kb-settings-overlay__title{font-size:15px;font-weight:900;color:#fff}' +
            '.kb-settings-overlay__spacer{width:36px;height:36px}' +
            '.kb-settings-overlay__body{flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-y;overscroll-behavior:contain;padding:10px 16px 24px;width:100%}' +
            '.kb-settings-overlay__body::-webkit-scrollbar{width:6px}.kb-settings-overlay__body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:3px}' +
            '.kb-settings-group{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;margin-bottom:14px}' +
            '.kb-settings-group__label{font-size:11px;font-weight:900;letter-spacing:.6px;text-transform:uppercase;color:rgba(255,255,255,.5);padding:0 6px 6px}' +
            '.kb-settings-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.07);min-height:50px}' +
            '.kb-settings-row:last-child{border-bottom:none}' +
            '.kb-settings-row__label{font-size:13.5px;font-weight:800;color:rgba(255,255,255,.92)}' +
            '.kb-settings-row__hint{font-size:12px;font-weight:700;color:rgba(255,255,255,.42)}' +
            'button.kb-settings-row{appearance:none;width:100%;border:none;background:transparent;color:#fff;font-family:var(--vk-font);text-align:left;cursor:pointer;transition:background .14s;padding:12px 14px}' +
            'button.kb-settings-row:hover{background:rgba(255,255,255,.05)}' +
            'button.kb-settings-row:active{background:rgba(10,132,255,.14)}' +
            '.kb-settings-row__value{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:800;color:rgba(255,255,255,.55);font-variant-numeric:tabular-nums}' +
            '.kb-settings-row__chev{color:rgba(255,255,255,.32);flex-shrink:0;transition:transform .18s}' +
            'button.kb-settings-row:hover .kb-settings-row__chev{transform:translateX(2px);color:rgba(255,255,255,.6)}' +
            '.kb-auto-badge{display:inline-flex;align-items:center;padding:2px 7px;border-radius:999px;background:linear-gradient(180deg,#2c88ff 0%,#0a72e6 100%);color:#fff;font-size:9.5px;font-weight:900;letter-spacing:.5px;box-shadow:0 2px 6px rgba(10,132,255,.4)}' +
            '.kb-auto-badge[hidden]{display:none}' +
            '.kb-settings-row--stack{flex-direction:column;align-items:stretch;gap:0;padding:12px 14px}' +
            '.kb-settings-row__top{display:flex;align-items:center;justify-content:space-between;gap:12px}' +
            '.kb-color-picker{position:relative;width:34px;height:34px;border-radius:50%;overflow:hidden;border:2px solid rgba(255,255,255,.22);cursor:pointer;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,255,255,.15);transition:transform .12s,border-color .12s}' +
            '.kb-color-picker:hover{transform:scale(1.06);border-color:rgba(255,255,255,.4)}' +
            '.kb-color-picker:active{transform:scale(.94)}' +
            '.kb-color-picker input{position:absolute;inset:0;width:100%;height:100%;opacity:0;padding:0;margin:0;border:none;cursor:pointer;-webkit-appearance:none;appearance:none}' +
            '.kb-color-picker__swatch{position:absolute;inset:0;pointer-events:none;background:var(--swatch,#050505);transition:background .2s ease}' +
            '.kb-color-presets{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;padding-left:1px}' +
            '.kb-color-preset{width:24px;height:24px;border-radius:50%;border:2px solid rgba(255,255,255,.12);cursor:pointer;padding:0;background:var(--swatch);transition:transform .12s,border-color .12s,box-shadow .12s;position:relative;touch-action:manipulation}' +
            '.kb-color-preset:hover{transform:scale(1.12);border-color:rgba(255,255,255,.35)}' +
            '.kb-color-preset:active{transform:scale(.92)}' +
            '.kb-color-preset.active{border-color:#0a84ff;box-shadow:0 0 0 2px rgba(10,132,255,.35),0 0 12px rgba(10,132,255,.55)}' +
            '.kb-color-preset.active::after{content:"";position:absolute;inset:0;margin:auto;width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.95);box-shadow:0 0 4px rgba(0,0,0,.6)}' +
            '.kb-settings-row--danger .kb-settings-row__label{color:#ff6b6b}' +
            'button.kb-settings-row--danger:active{background:rgba(255,69,58,.18)}' +
            '.kb-seg{display:flex;background:rgba(0,0,0,.35);border:1px solid rgba(255,255,255,.10);border-radius:11px;padding:3px;gap:2px;flex-shrink:0}' +
            '.kb-seg__btn{appearance:none;border:none;background:transparent;color:rgba(255,255,255,.65);font-family:var(--vk-font);font-weight:900;font-size:12px;letter-spacing:.2px;padding:6px 12px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:5px;transition:background .15s,color .15s;touch-action:manipulation}' +
            '.kb-seg__btn i{font-size:13px}' +
            '.kb-seg__btn.active{background:linear-gradient(180deg,#2c88ff 0%,#0a72e6 100%);color:#fff;box-shadow:0 3px 8px rgba(10,132,255,.45),inset 0 1px 0 rgba(255,255,255,.35)}' +
            '.kb-seg__btn:not(.active):hover{color:#fff;background:rgba(255,255,255,.06)}' +
            '.kb-resize-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.42);z-index:2147483001;opacity:0;pointer-events:none;transition:opacity .22s ease}' +
            '.kb-resize-backdrop.active{opacity:1;pointer-events:auto}' +
            '.kb-resize-handle{position:absolute;top:-14px;left:50%;transform:translateX(-50%) scale(.85);width:55%;max-width:400px;height:28px;display:flex;align-items:center;justify-content:center;cursor:ns-resize;touch-action:none;z-index:40;opacity:0;pointer-events:none;transition:opacity .22s ease,transform .28s cubic-bezier(.34,1.5,.64,1)}' +
            '.kb-resize-handle.active{opacity:1;transform:translateX(-50%) scale(1);pointer-events:auto}' +
            '.kb-resize-handle__grip{width:100%;height:4px;border-radius:3px;background:linear-gradient(90deg,rgba(10,132,255,0) 0%,#0a84ff 15%,#6cb8ff 50%,#0a84ff 85%,rgba(10,132,255,0) 100%);box-shadow:0 0 8px rgba(10,132,255,.9),0 0 22px rgba(10,132,255,.55),0 0 46px rgba(10,132,255,.28);animation:vkResizePulse 1.9s ease-in-out infinite;pointer-events:none}' +
            '.kb-resize-handle.dragging .kb-resize-handle__grip{height:6px;animation:none;box-shadow:0 0 14px rgba(10,132,255,1),0 0 34px rgba(10,132,255,.85),0 0 70px rgba(10,132,255,.5)}' +
            '@keyframes vkResizePulse{0%,100%{opacity:1;transform:scaleY(1)}50%{opacity:.72;transform:scaleY(1.35)}}' +
            '.kb-resize-toast{position:fixed;top:max(18px,env(safe-area-inset-top));left:50%;transform:translateX(-50%) translateY(-16px);padding:9px 16px;border-radius:999px;background:rgba(20,20,26,.94);border:1px solid rgba(255,255,255,.14);color:#fff;font-size:12px;font-weight:800;letter-spacing:.1px;box-shadow:0 10px 28px rgba(0,0,0,.65);' +
            'backdrop-filter:blur(16px) saturate(180%);-webkit-backdrop-filter:blur(16px) saturate(180%);z-index:2147483002;opacity:0;pointer-events:none;transition:opacity .22s ease,transform .28s cubic-bezier(.34,1.4,.64,1);display:flex;align-items:center;gap:8px;white-space:nowrap;font-family:var(--vk-font)}' +
            '.kb-resize-toast.active{opacity:1;transform:translateX(-50%) translateY(0)}' +
            '.kb-resize-toast__dot{width:6px;height:6px;border-radius:50%;background:#0a84ff;box-shadow:0 0 8px rgba(10,132,255,.9);animation:vkDotPulse 1.4s ease-in-out infinite}' +
            '.kb-resize-toast__value{font-variant-numeric:tabular-nums;color:#6cb8ff;font-weight:900}' +
            '.kb-dark.hg-theme-default{background:transparent !important;padding:var(--vk-pad-y) var(--vk-pad-x) calc(var(--vk-pad-y) * .8);font-family:var(--vk-font);font-weight:800;width:100%}' +
            '.kb-dark.hg-theme-default .hg-row:not(:last-child){margin-bottom:var(--vk-row-gap)}' +
            '.kb-dark.hg-theme-default .hg-row{display:flex;gap:6px}' +
            '.kb-dark.hg-theme-default .hg-button{position:relative;height:var(--vk-key-h);background:var(--vk-key);color:var(--vk-key-text);border:1px solid rgba(255,255,255,.10);border-radius:var(--vk-key-radius);font-family:var(--vk-font);font-size:var(--vk-key-fs);font-weight:900;letter-spacing:0;display:flex;align-items:center;justify-content:center;padding:0;overflow:hidden;touch-action:manipulation;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;box-shadow:var(--vk-key-shadow);transition:background .12s ease,border-color .12s ease,color .12s ease;flex-grow:1;flex-basis:0;min-width:0}' +
            '.kb-dark.hg-theme-default .hg-button:hover{background:var(--vk-key-hover);border-color:rgba(255,255,255,.18)}' +
            '.kb-dark.hg-theme-default .hg-button:active,.kb-dark.hg-theme-default .hg-button.hg-activeButton{background:var(--vk-accent);border-color:rgba(255,255,255,.35);color:#fff;box-shadow:0 0 0 1px rgba(10,132,255,.5),0 0 24px rgba(10,132,255,.55),inset 0 1px 0 rgba(255,255,255,.35)}' +
            '.kb-dark.hg-theme-default .hg-button.hg-functionBtn{background:var(--vk-key-alt)}' +
            '.kb-dark.hg-theme-default .hg-button.hg-functionBtn:hover{background:var(--vk-key-alt-hover)}' +
            '.kb-dark.hg-theme-default .hg-button.hg-functionBtn:active,.kb-dark.hg-theme-default .hg-button.hg-functionBtn.hg-activeButton{background:var(--vk-accent)}' +
            '.kb-dark.hg-theme-default .hg-button.hg-button-123,.kb-dark.hg-theme-default .hg-button.hg-button-abc{font-size:calc(var(--vk-key-fs) * .85);font-weight:900;letter-spacing:0}' +
            '.kb-dark.hg-theme-default .hg-button[data-skbtn="{space}"]{flex-grow:6}' +
            '.kb-dark .hg-button > i,.kb-dark .hg-button > span > i{display:inline-flex;align-items:center;justify-content:center;font-size:var(--vk-icon-size);line-height:1;width:1.15em;height:1.15em;max-width:82%;max-height:82%;pointer-events:none;flex-shrink:0}' +
            '.kb-dark .hg-button .fa-minus,.kb-dark .hg-button .ri-subtract-line{transform:scaleX(3.2)}' +
            '.kb-dark.hg-theme-default .hg-button.key-toggle-active{filter:brightness(1.2);border-color:rgba(10,132,255,.55) !important;box-shadow:0 0 0 1px rgba(10,132,255,.4),0 0 18px rgba(10,132,255,.45),var(--vk-key-shadow) !important}' +
            '.kb-dark.hg-theme-default .hg-button.key-toggle-active::after{content:"";position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:#0a84ff;box-shadow:0 0 6px rgba(10,132,255,.95),0 0 14px rgba(10,132,255,.65),inset 0 0 2px rgba(255,255,255,.85);animation:vkDotPulse 1.6s ease-in-out infinite;pointer-events:none}' +
            '@keyframes vkDotPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.3);opacity:.75}}' +
            '.kb-wrap.resizing .simple-keyboard{pointer-events:none;filter:brightness(.85);transition:filter .2s ease}' +
            '.kb-wrap.resizing .kb-header{opacity:.35;pointer-events:none;transition:opacity .2s ease}' +
            '@media (max-width:480px){:root{--vk-key-h:42px;--vk-pad-x:8px;--vk-pad-y:12px}.kb-wrap{border-top-left-radius:30px;border-top-right-radius:30px}}' +
            '@media (max-width:360px){:root{--vk-key-h:38px;--vk-pad-x:6px;--vk-pad-y:10px}.kb-wrap{border-top-left-radius:26px;border-top-right-radius:26px}.kb-icon-btn{width:32px;height:32px;font-size:14px}}' +
            '@media (orientation:landscape) and (max-height:500px){:root{--vk-key-h:34px;--vk-pad-x:16px;--vk-pad-y:8px}.kb-wrap{border-top-left-radius:22px;border-top-right-radius:22px}}';
        (document.head || document.documentElement).appendChild(s);
    })();

    /* ============================================================
       2. INJECT HTML STRUCTURE IMMEDIATELY
       ============================================================ */
    function injectHTML() {
        if (document.getElementById("kbWrap")) return;
        var wrap = document.createElement("div");
        wrap.innerHTML =
            '<div class="kb-wrap closed" id="kbWrap">' +
              '<div class="kb-header">' +
                '<button class="kb-icon-btn kb-settings-btn" id="kbSettingsBtn" type="button" aria-label="Keyboard settings" title="Settings">' +
                  '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                    '<circle cx="12" cy="12" r="3"/>' +
                    '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>' +
                  '</svg>' +
                '</button>' +
                '<button class="kb-icon-btn kb-close" id="kbClose" type="button" aria-label="Close keyboard" title="Close keyboard">' +
                  '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true">' +
                    '<line x1="6" y1="6" x2="18" y2="18"></line>' +
                    '<line x1="18" y1="6" x2="6" y2="18"></line>' +
                  '</svg>' +
                '</button>' +
              '</div>' +
              '<div class="kb-settings-overlay" id="kbSettingsOverlay" role="dialog" aria-label="Keyboard settings">' +
                '<div class="kb-settings-overlay__nav">' +
                  '<button class="kb-settings-overlay__back" id="kbSettingsBack" type="button" aria-label="Back to keyboard">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
                  '</button>' +
                  '<span class="kb-settings-overlay__title">Keyboard Settings</span>' +
                  '<span class="kb-settings-overlay__spacer"></span>' +
                '</div>' +
                '<div class="kb-settings-overlay__body">' +
                  '<div class="kb-settings-group__label">Appearance</div>' +
                  '<div class="kb-settings-group">' +
                    '<div class="kb-settings-row"><span class="kb-settings-row__label">Icon Pack</span>' +
                      '<div class="kb-seg" id="iconPackSeg">' +
                        '<button type="button" data-pack="fa" class="kb-seg__btn" aria-label="Font Awesome"><i class="fa-brands fa-font-awesome"></i> FA</button>' +
                        '<button type="button" data-pack="ri" class="kb-seg__btn" aria-label="Remix Icon"><i class="ri-remixicon-line"></i> RI</button>' +
                      '</div>' +
                    '</div>' +
                    '<div class="kb-settings-row kb-settings-row--stack">' +
                      '<div class="kb-settings-row__top"><span class="kb-settings-row__label">Key Color</span>' +
                        '<label class="kb-color-picker" aria-label="Choose key color"><input type="color" id="keyColorPicker" value="#050505" aria-label="Key color"><span class="kb-color-picker__swatch" id="keyColorSwatch"></span></label>' +
                      '</div>' +
                      '<div class="kb-color-presets" id="keyColorPresets" role="listbox" aria-label="Key color presets"></div>' +
                    '</div>' +
                    '<div class="kb-settings-row kb-settings-row--stack">' +
                      '<div class="kb-settings-row__top"><span class="kb-settings-row__label">Keyboard Color</span>' +
                        '<label class="kb-color-picker" aria-label="Choose keyboard color"><input type="color" id="kbColorPicker" value="#a0a0aa" aria-label="Keyboard color"><span class="kb-color-picker__swatch" id="kbColorSwatch"></span></label>' +
                      '</div>' +
                      '<div class="kb-color-presets" id="kbColorPresets" role="listbox" aria-label="Keyboard color presets"></div>' +
                    '</div>' +
                  '</div>' +
                  '<div class="kb-settings-group__label">Size</div>' +
                  '<div class="kb-settings-group">' +
                    '<button type="button" class="kb-settings-row" id="kbAdjustHeightBtn">' +
                      '<span class="kb-settings-row__label">Adjust Height</span>' +
                      '<span class="kb-settings-row__value"><span id="kbHeightValue">48px</span><span class="kb-auto-badge" id="kbAutoBadge" hidden>AUTO</span>' +
                        '<svg class="kb-settings-row__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"></polyline></svg>' +
                      '</span>' +
                    '</button>' +
                    '<button type="button" class="kb-settings-row" id="kbAutoHeightBtn">' +
                      '<span class="kb-settings-row__label">Auto Height</span>' +
                      '<span class="kb-settings-row__value"><span class="kb-settings-row__hint">Fit to display</span>' +
                        '<svg class="kb-settings-row__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"></polyline></svg>' +
                      '</span>' +
                    '</button>' +
                  '</div>' +
                  '<div class="kb-settings-group__label">Reset</div>' +
                  '<div class="kb-settings-group">' +
                    '<button type="button" class="kb-settings-row kb-settings-row--danger" id="kbResetBtn">' +
                      '<span class="kb-settings-row__label">Reset to Defaults</span>' +
                      '<svg class="kb-settings-row__chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 6 15 12 9 18"></polyline></svg>' +
                    '</button>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              '<div class="kb-resize-backdrop" id="kbResizeBackdrop"></div>' +
              '<div class="kb-resize-handle" id="kbResizeHandle" role="slider" aria-label="Resize keyboard" aria-valuemin="28" aria-valuemax="120"><div class="kb-resize-handle__grip"></div></div>' +
              '<div class="simple-keyboard"></div>' +
            '</div>' +
            '<div class="kb-resize-toast" id="kbResizeToast">' +
              '<span class="kb-resize-toast__dot"></span>' +
              '<span>Drag to resize ·</span>' +
              '<span class="kb-resize-toast__value" id="kbResizeToastValue">48px</span>' +
              '<span>· Tap anywhere to finish</span>' +
            '</div>';
        var frag = document.createDocumentFragment();
        while (wrap.firstChild) frag.appendChild(wrap.firstChild);
        document.body.appendChild(frag);
    }

    /* ============================================================
       3. LOAD DEPENDENCIES (parallel, non-blocking)
       ============================================================ */
    var depsLoaded = false;
    var pendingFocusEl = null;

    function loadCss(href) {
        if (document.querySelector('link[href="' + href + '"]')) return;
        var l = document.createElement("link");
        l.rel = "stylesheet";
        l.href = href;
        (document.head || document.documentElement).appendChild(l);
    }
    function loadJs(src) {
        return new Promise(function (resolve) {
            if (document.querySelector('script[src="' + src + '"]')) return resolve();
            var s = document.createElement("script");
            s.src = src;
            s.async = true;
            s.onload = function () { resolve(); };
            s.onerror = function () { resolve(); };
            (document.head || document.documentElement).appendChild(s);
        });
    }

    loadCss("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css");
    loadCss("https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css");
    loadCss("https://cdn.jsdelivr.net/npm/simple-keyboard@latest/build/css/index.css");
    loadCss("https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&display=swap");

    /* ============================================================
       4. MAIN INIT (runs when DOM + deps are ready)
       ============================================================ */
    function whenBodyReady(fn) {
        if (document.body) return fn();
        var ob = new MutationObserver(function () {
            if (document.body) { ob.disconnect(); fn(); }
        });
        ob.observe(document.documentElement, { childList: true });
    }

    whenBodyReady(function () {
        injectHTML();

        Promise.all([
            loadJs("https://cdn.jsdelivr.net/npm/simple-keyboard@latest/build/index.js"),
            loadJs("https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js")
        ]).then(start).catch(function (e) { console.warn("[vk] deps failed", e); });

        // Set inputmode=none on all text inputs (immediately, no waiting for libs)
        setupInputModeNone();
    });

    /* ============================================================
       5. INPUTMODE=NONE ON ALL TEXT INPUTS
       ============================================================ */
    var EDITABLE_SELECTOR = [
        'input:not([type])',
        'input[type="text"]',
        'input[type="url"]',
        'input[type="search"]',
        'input[type="email"]',
        'input[type="tel"]',
        'input[type="password"]',
        'textarea',
        '[contenteditable="true"]'
    ].join(',');

    function isEditableEl(el) {
        if (!el || !el.matches) return false;
        if (el.isContentEditable) return true;
        var tag = el.tagName;
        if (tag === "TEXTAREA") return true;
        if (tag === "INPUT") {
            var t = (el.getAttribute("type") || "text").toLowerCase();
            return t === "text" || t === "url" || t === "search" ||
                t === "email" || t === "tel" || t === "password";
        }
        return false;
    }
    function getVal(el) {
        if (!el) return "";
        if (el.isContentEditable) return el.textContent || "";
        return el.value || "";
    }
    function setVal(el, v) {
        if (!el) return;
        if (el.isContentEditable) { el.textContent = v; return; }
        el.value = v;
    }

    function setupInputModeNone() {
        var kbWrap = document.getElementById("kbWrap");

        function apply() {
            document.querySelectorAll(EDITABLE_SELECTOR).forEach(function (el) {
                if (kbWrap && kbWrap.contains(el)) return;
                el.setAttribute("inputmode", "none");
                el.setAttribute("autocorrect", "off");
                el.setAttribute("autocapitalize", "off");
                el.setAttribute("spellcheck", "false");
                el.setAttribute("virtualkeyboardpolicy", "manual");
            });
        }
        apply();

        if (window.MutationObserver) {
            new MutationObserver(apply).observe(document.body, { childList: true, subtree: true });
        }

        // iOS belt & suspenders
        var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
        if (isIOS) {
            document.addEventListener("focusin", function (e) {
                var el = e.target;
                if (!isEditableEl(el)) return;
                var wasRO = el.readOnly;
                try { el.readOnly = true; } catch (err) { }
                setTimeout(function () { try { el.readOnly = wasRO; } catch (err) { } }, 0);
            }, true);
        }

        // Queue focus events that happen before libs load
        document.addEventListener("focusin", function (e) {
            var el = e.target;
            if (!isEditableEl(el)) return;
            if (kbWrap && kbWrap.contains(el)) return;
            if (!depsLoaded) { pendingFocusEl = el; }
        }, true);
    }

    /* ============================================================
       6. START (all deps + DOM ready)
       ============================================================ */
    function start() {
        var SK = window.SimpleKeyboard;
        var KeyboardCtor = (typeof SK === "function") ? SK : (SK && SK.default);
        if (!KeyboardCtor) { console.error("[vk] SimpleKeyboard not loaded"); return; }

        var root = document.documentElement;
        var kbWrap = document.getElementById("kbWrap");
        var kbClose = document.getElementById("kbClose");
        var kbSettingsBtn = document.getElementById("kbSettingsBtn");
        var kbSettingsOverlay = document.getElementById("kbSettingsOverlay");
        var kbSettingsBack = document.getElementById("kbSettingsBack");
        var kbAdjustHeightBtn = document.getElementById("kbAdjustHeightBtn");
        var kbAutoHeightBtn = document.getElementById("kbAutoHeightBtn");
        var kbResetBtn = document.getElementById("kbResetBtn");
        var kbHeightValue = document.getElementById("kbHeightValue");
        var kbAutoBadge = document.getElementById("kbAutoBadge");
        var kbResizeHandle = document.getElementById("kbResizeHandle");
        var kbResizeBackdrop = document.getElementById("kbResizeBackdrop");
        var kbResizeToast = document.getElementById("kbResizeToast");
        var kbResizeToastValue = document.getElementById("kbResizeToastValue");
        var keyColorPicker = document.getElementById("keyColorPicker");
        var keyColorSwatch = document.getElementById("keyColorSwatch");
        var keyColorPresets = document.getElementById("keyColorPresets");
        var kbColorPicker = document.getElementById("kbColorPicker");
        var kbColorSwatch = document.getElementById("kbColorSwatch");
        var kbColorPresets = document.getElementById("kbColorPresets");
        var kbRoot = kbWrap.querySelector(".simple-keyboard");

        if (!kbWrap || !kbRoot) { console.warn("[vk] shell missing"); return; }

        /* -------- Simple Keyboard -------- */
        var layout = {
            default: [
                "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
                "{tab} q w e r t y u i o p [ ] \\",
                "{123} a s d f g h j k l ; ' {enter}",
                "{shift} z x c v b n m , . / {shift}",
                "{space}"
            ],
            caps: [
                "` 1 2 3 4 5 6 7 8 9 0 - = {bksp}",
                "{tab} Q W E R T Y U I O P [ ] \\",
                "{123} A S D F G H J K L ; ' {enter}",
                "{shift} Z X C V B N M , . / {shift}",
                "{space}"
            ],
            symbols: [
                "~ ! @ # $ % ^ & * ( ) _ + {bksp}",
                "{tab} { } | < > € £ ¥ • ° § ¶",
                "{abc} ¡ ¿ × ÷ ≠ ≈ ∞ µ © ® {enter}",
                "{abc} ← → ↑ ↓ √ π Ω α β γ {abc}",
                "{space}"
            ]
        };

        var currentInput = null;
        var currentLayoutName = "default";
        var letterLayout = "default";
        var keyboard = null;
        var isRebuilding = false;

        function handleChange(input) {
            if (!currentInput) return;
            var el = currentInput;
            if (el.tagName === "TEXTAREA" || el.isContentEditable) {
                setVal(el, input); return;
            }
            var clean = input.replace(/[\n\r\t]/g, "");
            el.value = clean;
            if (clean !== input) focusNextInput();
        }
        function handleKeyPress(button) {
            if (button === "{shift}") {
                letterLayout = letterLayout === "default" ? "caps" : "default";
                currentLayoutName = letterLayout;
                keyboard.setOptions({ layoutName: currentLayoutName });
                refreshToggleIndicator();
            } else if (button === "{123}") {
                currentLayoutName = "symbols";
                keyboard.setOptions({ layoutName: "symbols" });
                refreshToggleIndicator();
            } else if (button === "{abc}") {
                currentLayoutName = letterLayout;
                keyboard.setOptions({ layoutName: currentLayoutName });
                refreshToggleIndicator();
            }
        }
        function applyToggleIndicator() {
            kbRoot.querySelectorAll(".hg-button").forEach(function (b) { b.classList.remove("key-toggle-active"); });
            if (currentLayoutName !== "caps") return;
            kbRoot.querySelectorAll('.hg-button[data-skbtn="{shift}"]').forEach(function (b) { b.classList.add("key-toggle-active"); });
        }
        function refreshToggleIndicator() {
            if (refreshToggleIndicator._r) return;
            refreshToggleIndicator._r = requestAnimationFrame(function () {
                refreshToggleIndicator._r = null; applyToggleIndicator();
            });
        }

        function buildKeyboard() {
            if (keyboard) { try { keyboard.destroy(); } catch (e) { } keyboard = null; }
            kbRoot.innerHTML = "";
            keyboard = new KeyboardCtor({
                layout: layout,
                display: ICONS[settings.iconPack],
                mergeDisplay: true,
                theme: "hg-theme-default hg-layout-default kb-dark",
                preventMouseDownDefault: true,
                useMouseEvents: true,
                onChange: handleChange,
                onKeyPress: handleKeyPress
            });
            if (currentLayoutName !== "default") keyboard.setOptions({ layoutName: currentLayoutName });
            if (currentInput) keyboard.setInput(getVal(currentInput));
            setTimeout(refreshToggleIndicator, 0);
        }
        buildKeyboard();

        /* -------- GSAP -------- */
        var hasGSAP = (typeof gsap !== "undefined");
        if (hasGSAP) gsap.set(kbWrap, { yPercent: 110, opacity: 0 });

        function animateIn() {
            if (hasGSAP) {
                var keys = kbWrap.querySelectorAll(".hg-button");
                gsap.killTweensOf(kbWrap); gsap.killTweensOf(keys);
                gsap.fromTo(kbWrap, { yPercent: 110, opacity: 0 },
                    { yPercent: 0, opacity: 1, duration: .55, ease: "expo.out" });
                gsap.fromTo(keys,
                    { y: 30, opacity: 0, scale: .7 },
                    {
                        y: 0, opacity: 1, scale: 1, duration: .4,
                        ease: "back.out(1.7)",
                        stagger: { each: .004, from: "center", grid: "auto" }, delay: .05
                    });
            } else {
                kbWrap.style.transform = "translateY(0)";
                kbWrap.style.opacity = "1";
            }
        }
        function animateOut() {
            closeSettings(); exitResizeMode();
            if (hasGSAP) {
                var keys = kbWrap.querySelectorAll(".hg-button");
                gsap.killTweensOf(kbWrap); gsap.killTweensOf(keys);
                gsap.to(keys, {
                    y: 20, opacity: 0, scale: .7, duration: .22, ease: "power2.in",
                    stagger: { each: .002, from: "edges" }
                });
                gsap.to(kbWrap, {
                    yPercent: 110, opacity: 0, duration: .32, ease: "power3.in",
                    delay: .1, onComplete: function () { kbWrap.classList.add("closed"); }
                });
            } else {
                kbWrap.style.transform = "translateY(110%)";
                kbWrap.style.opacity = "0";
                kbWrap.classList.add("closed");
            }
        }
        function showKeyboard() { kbWrap.classList.remove("closed"); animateIn(); }

        /* -------- REPEAT ENGINE -------- */
        var REPEAT_DELAY = 400, REPEAT_RATE = 50;
        var repeatState = {};
        function isRepeatable(k) {
            if (!k) return false;
            if (k === "{shift}" || k === "{123}" || k === "{abc}") return false;
            if (k === "{tab}" || k === "{enter}") return false;
            return true;
        }
        function ensureFocus() {
            if (!currentInput) return;
            if (document.activeElement === currentInput) return;
            try { currentInput.focus({ preventScroll: true }); } catch (e) { }
        }
        function performRepeat(key) {
            if (!currentInput) return;
            var el = currentInput;
            var v = getVal(el);
            if (key === "{bksp}") {
                if (!v.length) return;
                setVal(el, v.slice(0, -1));
            } else if (key === "{space}") { setVal(el, v + " "); }
            else if (key.length === 1) { setVal(el, v + key); }
            else { return; }
            keyboard.setInput(getVal(el));
            ensureFocus();
        }
        function startRepeat(key) {
            if (repeatState[key]) return;
            repeatState[key] = {
                timeout: setTimeout(function () {
                    performRepeat(key);
                    repeatState[key].interval = setInterval(function () { performRepeat(key); }, REPEAT_RATE);
                }, REPEAT_DELAY)
            };
        }
        function stopRepeat(key) {
            var s = repeatState[key]; if (!s) return;
            clearTimeout(s.timeout); if (s.interval) clearInterval(s.interval);
            delete repeatState[key];
        }
        function stopAllRepeats() { Object.keys(repeatState).forEach(stopRepeat); }

        /* -------- Key pointer -------- */
        kbRoot.addEventListener("pointerdown", function (e) {
            if (kbWrap.classList.contains("resizing")) return;
            var btn = e.target.closest(".hg-button");
            if (!btn) return;
            var key = btn.getAttribute("data-skbtn");
            if (!key) return;
            ensureFocus();
            if (hasGSAP) {
                gsap.killTweensOf(btn);
                gsap.timeline().set(btn, { scale: .85 })
                    .to(btn, { scale: 1, duration: .4, ease: "elastic.out(1, 0.45)" });
            }
            if (isRepeatable(key)) startRepeat(key);
        }, { passive: true });

        ["pointerup", "pointercancel", "pointerleave", "pointerout"].forEach(function (evt) {
            kbRoot.addEventListener(evt, function (e) {
                var btn = e.target.closest(".hg-button");
                if (!btn) return;
                var k = btn.getAttribute("data-skbtn");
                if (k) stopRepeat(k);
            });
        });
        document.addEventListener("pointerup", stopAllRepeats);
        document.addEventListener("pointercancel", stopAllRepeats);
        window.addEventListener("blur", stopAllRepeats);
        document.addEventListener("visibilitychange", function () { if (document.hidden) stopAllRepeats(); });
        kbRoot.addEventListener("contextmenu", function (e) { e.preventDefault(); });
        kbRoot.addEventListener("selectstart", function (e) { e.preventDefault(); });
        kbRoot.addEventListener("dragstart", function (e) { e.preventDefault(); });

        /* -------- Settings -------- */
        function openSettings() {
            kbSettingsOverlay.classList.add("open");
            kbSettingsBtn.classList.add("active");
            updateSettingsUI();
            exitResizeMode();
            var b = kbSettingsOverlay.querySelector(".kb-settings-overlay__body");
            if (b) b.scrollTop = 0;
        }
        function closeSettings() {
            kbSettingsOverlay.classList.remove("open");
            kbSettingsBtn.classList.remove("active");
        }
        function toggleSettings() {
            if (kbSettingsOverlay.classList.contains("open")) closeSettings();
            else openSettings();
        }

        var KEY_PRESETS = ["#050505", "#1a1a1f", "#2c2c38", "#0a1830", "#1a0e2e", "#0a2a1a", "#2e0a0a", "#f5f5f7"];
        var KB_PRESETS = ["#a0a0aa", "#6a8dd8", "#a07ad8", "#d87a9c", "#6ad89a", "#d89a6a", "#d8d8d8", "#3a3a44"];

        function renderPresets(container, list, current, onPick) {
            container.innerHTML = "";
            list.forEach(function (color) {
                var b = document.createElement("button");
                b.type = "button";
                b.className = "kb-color-preset" + (color.toLowerCase() === current.toLowerCase() ? " active" : "");
                b.style.setProperty("--swatch", color);
                b.setAttribute("data-color", color);
                b.setAttribute("aria-label", "Use color " + color);
                b.addEventListener("click", function (e) { e.preventDefault(); onPick(color); });
                container.appendChild(b);
            });
        }
        function refreshPresetActive(container, current) {
            container.querySelectorAll(".kb-color-preset").forEach(function (b) {
                b.classList.toggle("active", b.getAttribute("data-color").toLowerCase() === current.toLowerCase());
            });
        }

        function applyColors() {
            var key = settings.keyColor, shell = settings.kbColor;
            var L = lum(key);
            var sign = L > 0.5 ? -1 : 1;

            root.style.setProperty("--vk-key", key);
            root.style.setProperty("--vk-key-hover", bright(key, 0.08 * sign));
            root.style.setProperty("--vk-key-alt", bright(key, 0.06 * sign));
            root.style.setProperty("--vk-key-alt-hover", bright(key, 0.14 * sign));
            root.style.setProperty("--vk-key-text", L > 0.55 ? "#1a1a1e" : "#ffffff");

            if (L > 0.5) {
                root.style.setProperty("--vk-key-shadow",
                    "0 2px 6px rgba(0,0,0,0.35), 0 1px 1px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.7), inset 0 -1px 0 rgba(0,0,0,0.12)");
            } else {
                root.style.setProperty("--vk-key-shadow",
                    "0 3px 10px rgba(0,0,0,0.85), 0 1px 2px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(0,0,0,0.75)");
            }
            root.style.setProperty("--vk-glass-1", rgba(shell, 0.55));
            root.style.setProperty("--vk-glass-2", rgba(scaleRgb(shell, 0.72), 0.66));
            root.style.setProperty("--vk-glass-3", rgba(scaleRgb(shell, 0.55), 0.75));

            keyColorSwatch.style.setProperty("--swatch", key);
            kbColorSwatch.style.setProperty("--swatch", shell);
            keyColorPicker.value = key;
            kbColorPicker.value = shell;
            refreshPresetActive(keyColorPresets, key);
            refreshPresetActive(kbColorPresets, shell);
        }

        function computeAutoHeight() {
            var vw = window.innerWidth, vh = window.innerHeight;
            var isLandscape = vw > vh;
            var isSmall = Math.min(vw, vh) < 500;
            var ratio = isLandscape ? (isSmall ? 0.62 : 0.48) : (isSmall ? 0.43 : 0.32);
            var padY = parseFloat(getComputedStyle(root).getPropertyValue("--vk-pad-y")) || 16;
            var chrome = 54;
            var target = vh * ratio;
            var keyH = (target - chrome - 2 * padY) / 5.6;
            return Math.max(MIN_H, Math.min(MAX_H, Math.round(keyH)));
        }
        var lastApplied = null;
        function applyHeightPx(h) {
            h = Math.max(MIN_H, Math.min(MAX_H, Math.round(h)));
            if (h === lastApplied) return;
            lastApplied = h;
            settings.height = h;
            root.style.setProperty("--vk-key-h", h + "px");
            kbHeightValue.textContent = h + "px";
            kbResizeToastValue.textContent = h + "px";
            kbResizeHandle.setAttribute("aria-valuenow", h);
            syncBodyPaddingNow();
        }
        function applyAutoHeight(silent) {
            settings.autoHeight = true;
            var h = computeAutoHeight();
            applyHeightPx(h);
            updateAutoBadge();
            if (!silent) saveSettings();
        }
        function updateAutoBadge() {
            if (settings.autoHeight) kbAutoBadge.removeAttribute("hidden");
            else kbAutoBadge.setAttribute("hidden", "");
        }

        function updateSettingsUI() {
            document.querySelectorAll("#iconPackSeg .kb-seg__btn").forEach(function (b) {
                b.classList.toggle("active", b.getAttribute("data-pack") === settings.iconPack);
            });
            kbHeightValue.textContent = settings.height + "px";
            kbResizeToastValue.textContent = settings.height + "px";
            kbResizeHandle.setAttribute("aria-valuenow", settings.height);
            updateAutoBadge();
            renderPresets(keyColorPresets, KEY_PRESETS, settings.keyColor, function (c) {
                settings.keyColor = c; applyColors(); saveSettings();
            });
            renderPresets(kbColorPresets, KB_PRESETS, settings.kbColor, function (c) {
                settings.kbColor = c; applyColors(); saveSettings();
            });
        }

        kbSettingsBtn.addEventListener("click", function (e) {
            e.preventDefault(); e.stopPropagation(); toggleSettings();
            if (hasGSAP) gsap.fromTo(kbSettingsBtn, { scale: .85 }, { scale: 1, duration: .5, ease: "elastic.out(1, 0.5)" });
        });
        kbSettingsBack.addEventListener("click", function (e) { e.preventDefault(); closeSettings(); });

        keyColorPicker.addEventListener("input", function (e) { settings.keyColor = e.target.value; applyColors(); });
        keyColorPicker.addEventListener("change", saveSettings);
        kbColorPicker.addEventListener("input", function (e) { settings.kbColor = e.target.value; applyColors(); });
        kbColorPicker.addEventListener("change", saveSettings);

        kbAutoHeightBtn.addEventListener("click", function (e) {
            e.preventDefault();
            applyAutoHeight(false);
            if (hasGSAP) {
                gsap.fromTo(kbResizeToast, { opacity: 0, y: -10 },
                    {
                        opacity: 1, y: 0, duration: .3, ease: "power2.out",
                        onComplete: function () { gsap.to(kbResizeToast, { opacity: 0, y: -10, duration: .4, delay: 1.2 }); }
                    });
            }
        });

        kbResetBtn.addEventListener("click", function (e) {
            e.preventDefault();
            settings.iconPack = DEF.iconPack;
            settings.keyColor = DEF.keyColor;
            settings.kbColor = DEF.kbColor;
            settings.autoHeight = true;
            applyColors(); applyAutoHeight(true); applyIconPack(); updateSettingsUI(); saveSettings();
            if (hasGSAP) gsap.fromTo(kbResetBtn, { scale: .96 }, { scale: 1, duration: .5, ease: "elastic.out(1, 0.5)" });
        });

        /* -------- Resize -------- */
        var resizeDragging = false, resizeStartY = 0, resizeStartHeight = 0,
            resizeStartRows = 5, resizeRafId = null, pendingHeight = null;

        function enterResizeMode() {
            closeSettings();
            kbWrap.classList.add("resizing");
            kbResizeHandle.classList.add("active");
            kbResizeBackdrop.classList.add("active");
            kbResizeToast.classList.add("active");
            kbResizeToastValue.textContent = settings.height + "px";
        }
        function exitResizeMode() {
            if (!kbWrap.classList.contains("resizing")) return;
            resizeDragging = false;
            kbWrap.classList.remove("resizing");
            kbResizeHandle.classList.remove("active", "dragging");
            kbResizeBackdrop.classList.remove("active");
            kbResizeToast.classList.remove("active");
            saveSettings();
        }
        function setHeightLive(h) {
            h = Math.max(MIN_H, Math.min(MAX_H, Math.round(h)));
            if (h === pendingHeight) return;
            pendingHeight = h;
            if (resizeRafId) return;
            resizeRafId = requestAnimationFrame(function () {
                resizeRafId = null;
                settings.height = pendingHeight; settings.autoHeight = false;
                lastApplied = pendingHeight;
                root.style.setProperty("--vk-key-h", settings.height + "px");
                kbHeightValue.textContent = settings.height + "px";
                kbResizeToastValue.textContent = settings.height + "px";
                kbResizeHandle.setAttribute("aria-valuenow", settings.height);
                updateAutoBadge();
                syncBodyPaddingNow();
            });
        }
        kbResizeHandle.addEventListener("pointerdown", function (e) {
            e.preventDefault(); e.stopPropagation();
            resizeDragging = true;
            resizeStartY = e.clientY;
            resizeStartHeight = settings.height;
            resizeStartRows = Math.max(1, kbRoot.querySelectorAll(".hg-row").length);
            kbResizeHandle.classList.add("dragging");
            try { kbResizeHandle.setPointerCapture(e.pointerId); } catch (err) { }
        });
        kbResizeHandle.addEventListener("pointermove", function (e) {
            if (!resizeDragging) return;
            e.preventDefault();
            var fd = resizeStartY - e.clientY;
            setHeightLive(resizeStartHeight + fd / resizeStartRows);
        });
        function endDrag(e) {
            if (!resizeDragging) return;
            resizeDragging = false;
            kbResizeHandle.classList.remove("dragging");
            try { kbResizeHandle.releasePointerCapture(e.pointerId); } catch (err) { }
            saveSettings();
        }
        kbResizeHandle.addEventListener("pointerup", endDrag);
        kbResizeHandle.addEventListener("pointercancel", endDrag);
        kbResizeBackdrop.addEventListener("pointerdown", function (e) { e.preventDefault(); exitResizeMode(); });
        kbAdjustHeightBtn.addEventListener("click", function (e) { e.preventDefault(); enterResizeMode(); });

        /* -------- Icon Pack -------- */
        function applyIconPack() {
            if (isRebuilding) return;
            isRebuilding = true;
            try {
                var saved = currentInput ? getVal(currentInput) : "";
                buildKeyboard();
                if (currentInput) keyboard.setInput(saved);
                syncBodyPaddingNow();
            } finally { isRebuilding = false; }
        }
        document.querySelectorAll("#iconPackSeg .kb-seg__btn").forEach(function (b) {
            b.addEventListener("click", function (e) {
                e.preventDefault();
                var pack = b.getAttribute("data-pack");
                if (!pack || pack === settings.iconPack) return;
                settings.iconPack = pack;
                applyIconPack(); updateSettingsUI(); saveSettings();
            });
        });

        /* -------- Close Button -------- */
        if (hasGSAP) {
            kbClose.addEventListener("pointerenter", function () { gsap.to(kbClose, { rotate: 90, scale: 1.08, duration: .35, ease: "back.out(2)" }); });
            kbClose.addEventListener("pointerleave", function () { gsap.to(kbClose, { rotate: 0, scale: 1, duration: .35, ease: "power2.out" }); });
        }
        kbClose.addEventListener("click", function (e) {
            e.preventDefault();
            if (hasGSAP) {
                gsap.timeline()
                    .to(kbClose, { scale: .75, rotate: -90, duration: .15, ease: "power2.in" })
                    .to(kbClose, { scale: 1, rotate: 0, duration: .3, ease: "back.out(2)" });
            }
            stopAllRepeats();
            animateOut();
            if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
        });

        /* -------- Focus → Show Keyboard -------- */
        document.addEventListener("focusin", function (e) {
            var el = e.target;
            if (!isEditableEl(el)) return;
            if (kbWrap.contains(el)) return;
            currentInput = el;
            keyboard.setInput(getVal(el));
            if (kbWrap.classList.contains("closed")) showKeyboard();
            else if (hasGSAP) gsap.fromTo(kbWrap, { y: 6 }, { y: 0, duration: .4, ease: "elastic.out(1, 0.5)" });
        }, true);

        document.addEventListener("focusout", function (e) {
            var el = e.target;
            if (!isEditableEl(el)) return;
            if (el !== currentInput) return;
            if (kbWrap.classList.contains("closed")) return;
            if (kbWrap.classList.contains("resizing")) return;
            setTimeout(function () {
                var a = document.activeElement;
                if (kbSettingsOverlay.classList.contains("open")) return;
                if (a === document.body || a === document.documentElement || a === null) {
                    try { el.focus({ preventScroll: true }); } catch (err) { }
                }
            }, 0);
        }, true);

        document.addEventListener("input", function (e) {
            var el = e.target;
            if (el === currentInput && isEditableEl(el)) {
                keyboard.setInput(getVal(el));
            }
        });

        /* -------- Body padding -------- */
        var lastPad = -1, syncRaf = null;
        function syncBodyPaddingNow() {
            var h = kbWrap.offsetHeight || 340;
            var p = h + 20;
            if (p === lastPad) return;
            lastPad = p;
            document.body.style.paddingBottom = p + "px";
        }
        function syncBodyPadding() {
            if (syncRaf) return;
            syncRaf = requestAnimationFrame(function () { syncRaf = null; syncBodyPaddingNow(); });
        }
        syncBodyPaddingNow();
        window.addEventListener("resize", function () {
            if (settings.autoHeight) applyAutoHeight(true);
            syncBodyPadding();
        }, { passive: true });
        window.addEventListener("orientationchange", function () {
            setTimeout(function () { if (settings.autoHeight) applyAutoHeight(true); syncBodyPadding(); }, 240);
        });
        if (window.ResizeObserver) new ResizeObserver(syncBodyPadding).observe(kbWrap);

        /* -------- Next Field -------- */
        function focusNextInput() {
            if (!currentInput) return;
            var fields = Array.prototype.slice.call(document.querySelectorAll(EDITABLE_SELECTOR))
                .filter(function (el) { return !kbWrap.contains(el); });
            var next = fields[fields.indexOf(currentInput) + 1];
            if (next) setTimeout(function () { next.focus(); }, 0);
        }

        /* -------- Physical keyboard mirror -------- */
        document.addEventListener("keydown", function () {
            if (!currentInput) return;
            setTimeout(function () { keyboard.setInput(getVal(currentInput)); }, 0);
        });

        /* -------- Scroll guard -------- */
        document.addEventListener("touchmove", function (e) {
            if (e.target.closest("textarea")) return;
            if (e.target.closest(".kb-settings-overlay")) return;
            if (kbWrap.contains(e.target) && e.cancelable) e.preventDefault();
        }, { passive: false });

        if (window.visualViewport) {
            window.visualViewport.addEventListener("resize", syncBodyPadding, { passive: true });
        }

        /* -------- Initial -------- */
        applyColors();
        if (settings.autoHeight) applyAutoHeight(true);
        else applyHeightPx(settings.height);
        updateSettingsUI();
        setTimeout(syncBodyPaddingNow, 60);

        /* -------- Flush pending focus -------- */
        depsLoaded = true;
        if (pendingFocusEl) {
            var el = pendingFocusEl; pendingFocusEl = null;
            if (isEditableEl(el)) {
                currentInput = el;
                keyboard.setInput(getVal(el));
                showKeyboard();
            }
        }

        console.log("[vk] ready ✔");
    }
})();
