// 介紹頁的小動態：章節標籤先出現、大標逐字浮出、段落與物件依序淡入、物件的小動作，以及洗澡的小遊戲。
// 沒有 JS 時什麼都不藏（.js 由 lang.js 在畫面出來前加上）；偏好減少動態時直接全部顯示、不跑動畫。
(function () {
  var reduced = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 大標逐字浮出 ----------
  // 節奏：一個字 38ms，逗號後停 210ms、句號問號後停 130ms、換行再停 110ms，像在念出來。
  // 標題可用 data-speed 調快慢（越小越快）。置中的標題（.calm）與封面不加歪斜。回傳整句寫完的時間。
  function split(el) {
    var i = 0, t = 0;
    var calm = !!el.closest('.calm, .hero');
    var h = el.closest('[data-speed]');
    var sp = h ? parseFloat(h.getAttribute('data-speed')) : 1;
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
            s.style.setProperty('--d', Math.round(t) + 'ms');
            i++;
            t += (isEn ? 55 : 38) * sp;
            if (/[，、,]$/.test(p)) t += 210 * sp;
            else if (/[。？！?.!:：]$/.test(p)) t += 130 * sp;
            s.textContent = p;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') {
          walk(n);
          if (n.classList && n.classList.contains('line')) t += 110 * sp;
        }
      });
    })(el);
    return t;
  }

  // 章節標籤先出現，標題等 --lead（章節 325ms、封面 200ms）才開始；段落和圖等標題寫完（--after）
  document.querySelectorAll('.ch h2 > span, .hero h1 > span, .get h2 > span').forEach(function (span) {
    var end = split(span);
    if (getComputedStyle(span).display === 'none') return;  // 另一個語言，時間不用記
    var lead = span.closest('.hero') ? 200 : span.closest('.get') ? 350 : 325;
    var after = Math.round(lead + end + 250) + 'ms';
    var box = span.closest('.ch-text, .ending, .hero, .get');
    if (box) box.style.setProperty('--after', after);
    var sec = span.closest('.ch');
    if (sec) sec.style.setProperty('--after', after);
  });

  // 場景裡的物件依序出現
  document.querySelectorAll('.scene').forEach(function (sc) {
    sc.querySelectorAll('.obj, .cap').forEach(function (o, k) { o.style.setProperty('--k', k); });
  });

  // ---------- 進入畫面時觸發 ----------
  // 01 相遇、04 小旅行、05 養成習慣：整個章節一起觸發，文字先跑、圖接在後面
  var whole = '.ch-1, .trips-ch, .habit-ch';
  var parts = '.ch-text, h2, .scene, .trip';
  function settle(scene) {
    // 物件都出現之後，碰觸立刻反應、離開立刻回位（不再等出場的延遲）
    var after = parseFloat(getComputedStyle(scene).getPropertyValue('--after')) || 0;
    var n = scene.querySelectorAll('.obj').length;
    setTimeout(function () { scene.classList.add('settled'); }, after + 1500 + n * 150);
  }
  // 順序：封面跑完之前，下面的章節先等著；洗澡那段要等上面「吃飯」的段落出現之後
  var t0 = performance.now();
  var hero = document.querySelector('.hero');
  var heroDone = t0 + (hero ? (parseFloat(getComputedStyle(hero).getPropertyValue('--after')) || 500) + 900 : 0);
  var daily = document.querySelector('.daily-ch > .ch-grid .ch-text');
  var dailyReadyAt = null, waitingForDaily = [];
  function reveal(el) {
    var now = performance.now();
    if (!el.closest('.hero') && now < heroDone) { setTimeout(function () { reveal(el); }, heroDone - now); return; }
    if (el.closest('.bath-part')) {
      if (dailyReadyAt === null) { waitingForDaily.push(el); if (daily) reveal(daily); return; }
      if (now < dailyReadyAt) { setTimeout(function () { reveal(el); }, dailyReadyAt - now); return; }
    }
    if (el.classList.contains('in')) return;
    el.classList.add('in');
    if (el.matches('.scene')) settle(el);
    if (el === daily) {
      // 吃飯的段落出現（標題寫完 + 段落淡入）之後，洗澡才接著出現
      dailyReadyAt = performance.now() + (parseFloat(getComputedStyle(el).getPropertyValue('--after')) || 0) + 3900;
      waitingForDaily.splice(0).forEach(reveal);
    }
  }
  if (reduced || !('IntersectionObserver' in window)) {
    document.querySelectorAll('.hero, .ch, .ch-text, .ch h2, .scene, .trip, .part-title, .get').forEach(function (t) { t.classList.add('in'); });
    document.querySelectorAll('.scene').forEach(function (s) { s.classList.add('settled'); });
  } else {
    var targets = Array.prototype.filter.call(
      document.querySelectorAll('.hero, .ch-text, .ch h2, .scene, .trip, .ending, .part-title, .get, ' + whole),
      function (el) { return el.matches(whole) || !el.closest(whole); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        reveal(e.target);
        if (e.target.matches(whole)) e.target.querySelectorAll(parts).forEach(reveal);
        io.unobserve(e.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  if (reduced) return;

  // ---------- 01 不規則的雨 ----------
  document.querySelectorAll('.rain').forEach(function (rain) {
    var frag = document.createDocumentFragment();
    for (var k = 0; k < 70; k++) {
      var d = document.createElement('i');
      d.style.left = (Math.random() * 100).toFixed(1) + '%';
      d.style.setProperty('--l', (8 + Math.random() * 16).toFixed(1) + 'px');
      d.style.setProperty('--t', (0.5 + Math.random() * 0.6).toFixed(2) + 's');
      d.style.setProperty('--dl', (-Math.random() * 1.2).toFixed(2) + 's');
      d.style.setProperty('--o', (0.25 + Math.random() * 0.55).toFixed(2));
      frag.appendChild(d);
    }
    rain.appendChild(frag);
    function size() { rain.style.setProperty('--dist', rain.offsetHeight + 'px'); }
    size();
    addEventListener('resize', size);
  });

  // ---------- 02 一起散步：腳印從左下角畫面外緩緩彎進來，一路接到柴犬的後腳（像牠剛剛走過的路） ----------
  document.querySelectorAll('.paws').forEach(function (box) {
    // 路線上的轉折點（場景寬高的百分比），最後一點就是柴犬的後腳
    var pts = [[-6, 97], [10, 93], [26, 88], [40, 85], [52, 80], [64, 71]];
    var ar = 0.72;  // 場景高寬比
    var segs = [], total = 0;
    for (var k = 1; k < pts.length; k++) {
      var dx = pts[k][0] - pts[k - 1][0], dy = (pts[k][1] - pts[k - 1][1]) * ar;
      var len = Math.sqrt(dx * dx + dy * dy);
      segs.push({ a: pts[k - 1], b: pts[k], len: len });
      total += len;
    }
    var step = 6.2, n = Math.floor(total / step);
    for (var s = 0; s <= n; s++) {
      var d = s * step, seg = segs[0];
      for (var q = 0; q < segs.length; q++) { seg = segs[q]; if (d <= seg.len || q === segs.length - 1) break; d -= seg.len; }
      var f = Math.min(1, d / seg.len);
      var x = seg.a[0] + (seg.b[0] - seg.a[0]) * f;
      var y = seg.a[1] + (seg.b[1] - seg.a[1]) * f;
      var ang = Math.atan2((seg.b[1] - seg.a[1]) * ar, seg.b[0] - seg.a[0]) * 180 / Math.PI;
      var side = s % 2 ? 1 : -1;  // 左右腳交錯，往路線兩側各偏一點
      var nx = -Math.sin(ang * Math.PI / 180) * 1.6 * side, ny = Math.cos(ang * Math.PI / 180) * 1.6 * side;
      var i = document.createElement('i');
      i.style.left = (x + nx).toFixed(2) + '%';
      i.style.top = (y + ny / ar).toFixed(2) + '%';
      i.style.rotate = (ang + 90).toFixed(0) + 'deg';
      i.style.animationDelay = (s * 0.2) + 's';
      box.appendChild(i);
    }
  });

  // ---------- 03 等開飯：狗和碗連動，輪到狗時碗不動、輪到碗時狗不動，一秒換三次 ----------
  (function () {
    var scene = document.querySelector('.scene-2');
    if (!scene || !('IntersectionObserver' in window)) return;
    var pair = [scene.querySelector('.o-dog'), scene.querySelector('.o-bowl')];
    var turn = 0, timer = null;
    function tick() {
      pair[1 - turn].classList.remove('poke');
      pair[turn].classList.add('poke');
      turn = 1 - turn;
    }
    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !timer) {
          // 等狗和碗都出現了才開始
          var after = parseFloat(getComputedStyle(scene).getPropertyValue('--after')) || 0;
          timer = setTimeout(function () {
            scene.classList.add('live');
            timer = setInterval(tick, 333);
          }, scene.classList.contains('live') ? 0 : after + 200);
        }
        if (!e.isIntersecting && timer) {
          clearTimeout(timer); clearInterval(timer); timer = null;
          pair.forEach(function (p) { p.classList.remove('poke'); });
        }
      });
    }).observe(scene);
  })();

  // ---------- 03 洗澡的小遊戲 ----------
  // 三樣工具各給各的回饋，不限順序：刷子刷到狗身上會冒泡泡；毛巾擦狗會噴出水滴；
  // 吹風機對著狗吹一下，就會亮晶晶、說「香香的！」。放開工具會飄回原位。
  (function () {
    var scene = document.querySelector('.scene-bath');
    if (!scene) return;
    var dog = scene.querySelector('.o-bath');
    var fx = scene.querySelector('.fx');
    var dryTime = 0, sparkleTimer = null;

    function spawn(cls, x, y, extra) {
      var p = document.createElement(cls === 'p-bub' ? 'img' : 'span');
      p.className = 'fxp ' + cls;
      if (cls === 'p-bub') { p.src = 'img/bubble.webp'; p.alt = ''; }
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      if (extra) for (var k in extra) p.style.setProperty(k, extra[k]);
      fx.appendChild(p);
      p.addEventListener('animationend', function () { p.remove(); });
    }
    function splash(x, y, count, spread) {
      for (var q = 0; q < count; q++) {
        var dx = (Math.random() - 0.5) * spread;
        spawn('p-drop', x, y, {
          '--dx': dx.toFixed(0) + 'px',
          '--up': (-18 - Math.random() * 40).toFixed(0) + 'px',
          '--down': (30 + Math.random() * 50).toFixed(0) + 'px',
          '--r': (dx * 0.6).toFixed(0) + 'deg',
          '--t': (0.6 + Math.random() * 0.4).toFixed(2) + 's'
        });
      }
    }
    function overDog(r) {
      var d = dog.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      return cx > d.left + d.width * 0.1 && cx < d.right - d.width * 0.1 && cy > d.top && cy < d.bottom - d.height * 0.15;
    }
    function nearForDryer(r) {
      // 吹風機在狗的右邊、高度差不多、距離不遠，風就吹得到
      var d = dog.getBoundingClientRect();
      return r.left > d.left + d.width * 0.4 && r.left < d.right + d.width * 0.7 && r.top < d.bottom && r.bottom > d.top;
    }
    var say = dog.querySelector('.say'), sayTimer = null;
    var lines = {
      brush: ['刷刷好舒服～', 'So comfy~'],
      towel: ['擦乾乾！', 'All dry!'],
      dryer: ['香香的！', 'All fresh!']
    };
    function talk(kind) {
      say.setAttribute('data-kind', kind);
      say.querySelector('.zh').textContent = lines[kind][0];
      say.querySelector('.en').textContent = lines[kind][1];
      dog.classList.add('say-on');
      clearTimeout(sayTimer);
      sayTimer = setTimeout(function () { dog.classList.remove('say-on'); }, 1800);
    }
    function sparkle() {
      dog.classList.add('clean');
      talk('dryer');
      clearTimeout(sparkleTimer);
      sparkleTimer = setTimeout(function () { dog.classList.remove('clean'); }, 3000);
    }
    var used = { brush: 0, towel: 0 };

    scene.querySelectorAll('.tool').forEach(function (tool) {
      var kind = tool.getAttribute('data-tool');
      var sx = 0, sy = 0, lastX = 0, lastY = 0, travel = 0, wind = null;

      tool.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        tool.setPointerCapture(e.pointerId);
        sx = e.clientX; sy = e.clientY; lastX = sx; lastY = sy; travel = 0;
        tool.classList.add('held');
        if (kind === 'dryer') {
          dryTime = 0;
          wind = setInterval(function () {
            var r = tool.getBoundingClientRect(), s = scene.getBoundingClientRect();
            // 吹風機的出風口在圖的左上方，風往左吹
            spawn('p-wind', r.left - s.left + r.width * 0.06, r.top - s.top + r.height * (0.18 + Math.random() * 0.14),
              { '--wy': ((Math.random() - 0.5) * 30).toFixed(0) + 'px' });
            if (nearForDryer(r)) {
              dryTime += 110;
              if (dryTime > 700 && !dog.classList.contains('clean')) { sparkle(); dryTime = -1500; }
            }
          }, 110);
        }
      });

      tool.addEventListener('pointermove', function (e) {
        if (!tool.classList.contains('held')) return;
        tool.style.translate = (e.clientX - sx) + 'px ' + (e.clientY - sy) + 'px';
        travel += Math.abs(e.clientX - lastX) + Math.abs(e.clientY - lastY);
        lastX = e.clientX; lastY = e.clientY;
        if (travel < 16 || kind === 'dryer') return;
        travel = 0;
        var r = tool.getBoundingClientRect(), s = scene.getBoundingClientRect();
        if (!overDog(r)) return;
        var x = r.left - s.left + r.width * (0.3 + Math.random() * 0.4);
        var y = r.top - s.top + r.height * (0.3 + Math.random() * 0.4);
        // 刷子、毛巾在狗身上用了幾下，狗就會說話
        if ((kind === 'brush' || kind === 'towel') && ++used[kind] % 5 === 0) talk(kind);
        if (kind === 'brush') {
          for (var b = 0; b < 2; b++) {
            spawn('p-bub', x + (Math.random() - 0.5) * 24, y, { '--sz': (12 + Math.random() * 18).toFixed(0) + 'px', '--dx': ((Math.random() - 0.5) * 36).toFixed(0) + 'px' });
          }
        }
        if (kind === 'towel' && Math.random() < 0.6) splash(x, y, 1 + Math.floor(Math.random() * 2), 120);
      });

      function release() {
        if (!tool.classList.contains('held')) return;
        tool.classList.remove('held');
        tool.style.translate = '';
        if (wind) { clearInterval(wind); wind = null; }
      }
      tool.addEventListener('pointerup', release);
      tool.addEventListener('pointercancel', release);
    });
  })();
})();
