// 介紹頁的小動態：大標逐字浮出、段落與物件依序淡入。
// 沒有 JS 時什麼都不藏（.js 由 lang.js 在畫面出來前加上）；偏好減少動態時直接全部顯示。
(function () {
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 把大標拆成一個字一個 span（英文以單字為單位）。
  // 節奏：一個字 75ms，逗號後停 420ms、句號問號後停 260ms、換行再停 220ms，像在念出來。
  // 置中的標題（.calm）不加歪斜。回傳整句寫完的時間，讓段落等標題寫完才出現。
  function split(el) {
    var i = 0, t = 0;
    var calm = !!el.closest('.calm, .hero');
    var h = el.closest('[data-speed]'); var sp = h ? parseFloat(h.getAttribute('data-speed')) : 1;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var isEn = /[A-Za-z]/.test(n.textContent);
          var parts = isEn ? n.textContent.split(/(\s+)/) : Array.from(n.textContent);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var s = document.createElement('span');
            s.className = 'char';
            if (!calm) {
              // 一點點不整齊：上下 ±1.5px、旋轉 ±1.8 度（用字的順序算，固定不亂跳）
              var r1 = Math.abs(Math.sin((i + 1) * 12.9898) * 43758.5453) % 1;
              var r2 = Math.abs(Math.sin((i + 1) * 78.233) * 12345.678) % 1;
              s.style.setProperty('--jy', ((r1 - 0.5) * 3).toFixed(2) + 'px');
              s.style.setProperty('--jr', ((r2 - 0.5) * 3.6).toFixed(2) + 'deg');
            }
            s.style.setProperty('--d', t + 'ms');
            i++;
            t += (isEn ? 110 : 75) * sp;
            if (/[，、,]$/.test(p)) t += 420 * sp;
            else if (/[。？！?.!:：]$/.test(p)) t += 260 * sp;
            s.textContent = p;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
          if (n.classList && n.classList.contains('line')) t += 220 * sp;
        }
      });
    })(el);
    return t;
  }

  document.querySelectorAll('.ch h2 > span, .hero h1 > span').forEach(function (sp) {
    var end = split(sp);
    // 同一個語言的段落，等標題寫完再出現
    if (getComputedStyle(sp).display === 'none') return;
    var box = sp.closest('.ch-text, .ch-5, .hero');
    if (box) box.style.setProperty('--after', Math.round(end + 250) + 'ms');
    // 整個章節也記一份，讓圖等文字跑完再出現
    var sec = sp.closest('.ch');
    if (sec) sec.style.setProperty('--after', Math.round(end + 250) + 'ms');
  });

  // 場景裡的物件依序出現
  document.querySelectorAll('.scene').forEach(function (sc) {
    sc.querySelectorAll('.obj, .cap').forEach(function (o, k) { o.style.setProperty('--k', k); });
  });

  // 等開飯：像有人用手輪流碰狗和碗（每 0.25 秒碰一下，狗、碗交替），只在看得到時進行
  (function () {
    var scene = document.querySelector('.scene-2');
    if (!scene || reduced || !('IntersectionObserver' in window)) return;
    var pair = [scene.querySelector('.o-dog'), scene.querySelector('.o-bowl')];  // 狗的動作在 CSS 裡調得比較輕
    var n = 0, timer = null;
    function tick() {
      var el = pair[n++ % 2];
      el.classList.add('poke');
      setTimeout(function () { el.classList.remove('poke'); }, 180);
    }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !timer) timer = setInterval(tick, 320);
        if (!e.isIntersecting && timer) { clearInterval(timer); timer = null; }
      });
    }).observe(scene);
  })();

  var whole = '.ch-3, .ch-4';
  var targets = Array.prototype.filter.call(
    document.querySelectorAll('.hero, .ch-text, .ch h2, .scene, .trip, .ch-5, ' + whole),
    function (el) { return el.matches(whole) || !el.closest(whole); });
  if (reduced || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.hero, .ch-text, .ch h2, .scene, .trip, .ch-5, .ch').forEach(function (t) { t.classList.add('in'); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        if (e.target.matches(whole)) e.target.querySelectorAll('.ch-text, h2, .scene, .trip').forEach(function (c) { c.classList.add('in'); });
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  targets.forEach(function (t) { io.observe(t); });
})();
