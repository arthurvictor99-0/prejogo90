/* Placares do dia.
   Lê dados/placares.json (publicado pelo GitHub Actions) e marca os jogos que
   já começaram. Nada de token no navegador: o arquivo já vem pronto.

   Jogo em andamento mostra o placar sempre acompanhado do horário da coleta —
   a atualização não é ao vivo, então a hora precisa estar visível. */
(function () {
  'use strict';

  var raiz = location.pathname.indexOf('/jogos/') !== -1 ? '../' : '';

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html.trim();
    return d.firstChild;
  }

  function aoVivo(s) { return s === 'IN_PLAY' || s === 'PAUSED'; }

  function rotulo(p, hora) {
    if (p.s === 'FINISHED') return 'Encerrado';
    if (p.s === 'PAUSED') return 'Intervalo · ' + hora;
    if (p.s === 'IN_PLAY') return 'Parcial · ' + hora;
    return 'Adiado';
  }

  function placar(p) {
    if (p.gc === null || p.gc === undefined) return null;
    return p.gc + ' — ' + p.gf;
  }

  function aplicar(dados) {
    var jogos = dados.jogos || {};
    var hora = dados.atualizado || '';
    var marcados = 0;

    document.querySelectorAll('[data-p90]').forEach(function (n) {
      var p = jogos[n.getAttribute('data-p90')];
      if (!p) return;

      var pl = placar(p);
      var txt = rotulo(p, hora);
      var cls = p.s === 'FINISHED' ? 'fim' : (aoVivo(p.s) ? 'vivo' : 'adiado');
      n.classList.add('tem-placar');
      marcados++;

      // cabeçalho da central do jogo
      var relogio = n.querySelector('.mclock');
      if (relogio) {
        relogio.innerHTML =
          (pl ? '<div class="mplacar">' + pl + '</div>' : '<div class="hora">—</div>') +
          '<div class="hd"><span class="pl-tag ' + cls + '">' + txt + '</span></div>';
        return;
      }

      // linha da tabela da página Jogos / item da lista lateral
      var alvo = n.querySelector('.jt-hora') || n.querySelector('.sb-hora');
      if (alvo) {
        alvo.innerHTML = (pl ? '<b class="pl-n">' + pl + '</b>' : '') +
          '<span class="pl-tag ' + cls + '">' + txt + '</span>';
        return;
      }

      // card da home
      var t = n.querySelector('.time');
      if (t) {
        t.innerHTML = (pl ? '<span class="pl-n">' + pl + '</span>' : '<span class="h">—</span>') +
          '<span class="pl-tag ' + cls + '">' + txt + '</span>';
      }
    });

    if (marcados) {
      document.querySelectorAll('[data-placar-hora]').forEach(function (n) {
        n.textContent = 'Placares atualizados às ' + hora;
      });
    }
  }

  fetch(raiz + 'dados/placares.json', { cache: 'no-store' })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) { if (d) aplicar(d); })
    .catch(function () { /* sem placares: a página segue mostrando o horário */ });
})();
