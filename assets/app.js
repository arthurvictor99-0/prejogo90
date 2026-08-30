/* ==========================================================================
   PreJogo90 — JS compartilhado
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- tema ---------- */
  window.setTheme = function (t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('p90-theme', t); } catch (e) {}
    var l = document.getElementById('tlight'), d = document.getElementById('tdark');
    if (l) l.classList.toggle('on', t === 'light');
    if (d) d.classList.toggle('on', t === 'dark');
  };
  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem('p90-theme'); } catch (e) {}
    var t = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.addEventListener('DOMContentLoaded', function () { window.setTheme(t); });
    document.documentElement.setAttribute('data-theme', t);
  })();

  /* ---------- analytics (dataLayer — pronto p/ GA4/GTM) ---------- */
  window.dataLayer = window.dataLayer || [];
  window.track = function (event, params) {
    window.dataLayer.push(Object.assign({ event: event, ts: Date.now() }, params || {}));
  };
  document.addEventListener('DOMContentLoaded', function () {
    try {
      if (document.referrer.indexOf('t.me') > -1 || location.search.indexOf('utm_source=telegram') > -1) {
        window.track('telegram_visit');
      }
    } catch (e) {}
    // clique em link de parceiro
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[data-affiliate]');
      if (a) window.track('affiliate_click', { jogo: a.getAttribute('data-jogo') || '' });
    });
  });

  /* ---------- helpers ---------- */
  window.p90 = {
    prob: function (odd) { return odd > 0 ? Math.round(100 / odd) : 0; },
    dec: function (n) {
      return (isFinite(n) ? n : 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    parse: function (s) {
      var n = parseFloat(String(s).replace(',', '.'));
      return isNaN(n) ? 0 : n;
    },
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
  };

  /* ---------- filtro da lista de jogos (SOMENTE a home) ----------
     A página /jogos.html tem o seu próprio controlador, mais completo,
     no bloco do fim deste arquivo. */
  document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('.jogos-layout')) return;
    var chips = document.querySelectorAll('[data-filtro]');
    if (!chips.length) return;
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var val = chip.getAttribute('data-filtro');
        chips.forEach(function (c) { c.classList.toggle('on', c === chip); });
        document.querySelectorAll('[data-regiao]').forEach(function (row) {
          var show = val === 'todos' || row.getAttribute('data-regiao') === val;
          row.style.display = show ? '' : 'none';
        });
        var visiveis = document.querySelectorAll('[data-regiao]:not([style*="none"])').length;
        var vazio = document.getElementById('lista-vazia');
        if (vazio) vazio.style.display = visiveis ? 'none' : 'block';
      });
    });
  });

  /* ---------- abas de mercado (home) ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var tabs = document.querySelectorAll('[data-mercado]');
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var m = tab.getAttribute('data-mercado');
        tabs.forEach(function (t) { t.classList.toggle('on', t === tab); });
        document.querySelectorAll('[data-mercado-painel]').forEach(function (p) {
          p.style.display = p.getAttribute('data-mercado-painel') === m ? '' : 'none';
        });
      });
    });
  });

  /* ---------- abas da central do jogo ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var tabs = document.querySelectorAll('[data-aba]');
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var a = tab.getAttribute('data-aba');
        tabs.forEach(function (t) { t.classList.toggle('on', t === tab); });
        document.querySelectorAll('[data-aba-painel]').forEach(function (p) {
          p.style.display = p.getAttribute('data-aba-painel') === a ? '' : 'none';
        });
        window.track('tab_view', { aba: a });
      });
    });
  });
})();

/* ==========================================================================
   Página de Jogos — filtros, favoritos e "meus jogos"
   ========================================================================== */
(function () {
  'use strict';
  document.addEventListener('DOMContentLoaded', function () {
    var tabela = document.querySelector('.jogos-layout');
    if (!tabela) return;

    var estado = { regiao: 'todos', vista: 'todos', comps: null };

    /* ---- favoritos (localStorage) ---- */
    function lerFavs() {
      try { return JSON.parse(localStorage.getItem('p90-favs') || '[]'); }
      catch (e) { return []; }
    }
    function salvarFavs(l) {
      try { localStorage.setItem('p90-favs', JSON.stringify(l)); } catch (e) {}
    }
    function pintarFavs() {
      var favs = lerFavs();
      document.querySelectorAll('.fav').forEach(function (b) {
        b.classList.toggle('on', favs.indexOf(b.dataset.slug) > -1);
      });
    }
    document.querySelectorAll('.fav').forEach(function (b) {
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var favs = lerFavs(), i = favs.indexOf(b.dataset.slug);
        if (i > -1) favs.splice(i, 1); else favs.push(b.dataset.slug);
        salvarFavs(favs);
        pintarFavs();
        if (estado.vista === 'favoritos') aplicar();
      });
    });

    /* ---- aplica todos os filtros ---- */
    function aplicar() {
      var favs = lerFavs();
      var compsAtivas = {};
      document.querySelectorAll('[data-comp][type=checkbox]').forEach(function (c) {
        compsAtivas[c.dataset.comp] = c.checked;
      });

      var visiveis = 0;
      document.querySelectorAll('tr.jt-jogo').forEach(function (tr) {
        var okRegiao = estado.regiao === 'todos' || tr.dataset.regiao === estado.regiao;
        var okComp = compsAtivas[tr.dataset.comp] !== false;
        var okVista = estado.vista === 'todos' || favs.indexOf(tr.dataset.slug) > -1;
        var mostrar = okRegiao && okComp && okVista;
        tr.style.display = mostrar ? '' : 'none';
        if (mostrar) visiveis++;
      });

      // cabeçalhos de competição sem jogos visíveis somem
      document.querySelectorAll('tr.jt-comp').forEach(function (tr) {
        var comp = tr.dataset.comp, algum = false, n = tr.nextElementSibling;
        while (n && n.classList.contains('jt-jogo')) {
          if (n.dataset.comp === comp && n.style.display !== 'none') { algum = true; break; }
          n = n.nextElementSibling;
        }
        tr.style.display = algum ? '' : 'none';
      });

      // blocos de dia sem jogos visíveis somem
      document.querySelectorAll('.jt-bloco').forEach(function (bl) {
        var algum = Array.prototype.some.call(
          bl.querySelectorAll('tr.jt-jogo'), function (t) { return t.style.display !== 'none'; });
        bl.style.display = algum ? '' : 'none';
      });

      var vazio = document.getElementById('lista-vazia');
      if (vazio) vazio.style.display = visiveis ? 'none' : 'block';
    }

    /* ---- controles ---- */
    document.querySelectorAll('[data-filtro]').forEach(function (b) {
      b.addEventListener('click', function () {
        estado.regiao = b.dataset.filtro;
        document.querySelectorAll('[data-filtro]').forEach(function (x) { x.classList.toggle('on', x === b); });
        aplicar();
      });
    });
    document.querySelectorAll('[data-vista]').forEach(function (b) {
      b.addEventListener('click', function () {
        estado.vista = b.dataset.vista;
        document.querySelectorAll('[data-vista]').forEach(function (x) { x.classList.toggle('on', x === b); });
        aplicar();
      });
    });
    document.querySelectorAll('[data-comp][type=checkbox]').forEach(function (c) {
      c.addEventListener('change', aplicar);
    });
    var limpar = document.getElementById('limpar');
    if (limpar) limpar.addEventListener('click', function () {
      estado.regiao = 'todos'; estado.vista = 'todos';
      document.querySelectorAll('[data-comp][type=checkbox]').forEach(function (c) { c.checked = true; });
      document.querySelectorAll('[data-filtro]').forEach(function (x) { x.classList.toggle('on', x.dataset.filtro === 'todos'); });
      document.querySelectorAll('[data-vista]').forEach(function (x) { x.classList.toggle('on', x.dataset.vista === 'todos'); });
      aplicar();
    });

    pintarFavs();
    aplicar();
  });
})();
