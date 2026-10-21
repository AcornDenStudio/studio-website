// 中英切換：仿官網首頁（body[data-lang]、.zh／.en、導覽列「中／EN」）。
// 決定語言的順序：網址 ?lang=zh|en → 這位訪客上次手動選的 → 瀏覽器第一順位語言（中文才顯示中文，其他一律英文）。
// 放在 <body> 一開頭同步執行，畫面出來前就決定好，不會先閃另一種語言。
(function () {
  var KEY = 'pocketshiba-lang';
  function saved() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(l) { try { localStorage.setItem(KEY, l); } catch (e) {} }

  var q = new URLSearchParams(location.search).get('lang');
  var first = (navigator.languages && navigator.languages[0]) || navigator.language || '';
  var lang = (q === 'zh' || q === 'en') ? q
           : (saved() === 'zh' || saved() === 'en') ? saved()
           : (/^zh/i.test(first) ? 'zh' : 'en');

  var html = document.documentElement;
  html.classList.add('js');
  function apply(l) {
    document.body.setAttribute('data-lang', l);
    html.lang = (l === 'zh') ? 'zh-Hant' : 'en';
    var t = html.getAttribute('data-title-' + l);
    if (t) document.title = t;
    var z = document.getElementById('lang-zh'), e = document.getElementById('lang-en');
    if (z) z.classList.toggle('on', l === 'zh');
    if (e) e.classList.toggle('on', l === 'en');
  }
  window.setLang = function (l) { save(l); apply(l); };

  apply(lang);
  document.addEventListener('DOMContentLoaded', function () { apply(document.body.getAttribute('data-lang')); });
})();
