/* ==========================================================================
   PreJogo90 — Calculadora de comparação (sua estimativa × odd do mercado)
   Usa window.P90_JOGOS, injetado pela página.
   ========================================================================== */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var sel = document.getElementById('csel');
    if (!sel || !window.P90_JOGOS) return;

    var P = window.p90;
    var JOGOS = window.P90_JOGOS;
    var mercado = '1x2';

    var MERCADOS = {
      '1x2': { rotulos: function (j) { return [j.casa, 'Empate', j.fora]; },
               odds: function (j) { return j.o; } },
      'gols': { rotulos: function () { return ['Mais de 2.5 gols', 'Menos de 2.5 gols']; },
                odds: function (j) { return j.g; } },
      'livre': { rotulos: function () { return ['Opção A', 'Opção B']; },
                 odds: function () { return [2.00, 2.00]; } }
    };

    function jogoAtual() { return JOGOS[+sel.value] || JOGOS[0]; }

    function campo(id, rotulo, valor, sufixo) {
      return '<div class="pfield"><label title="' + P.esc(rotulo) + '">' + P.esc(rotulo) + '</label>' +
        '<div class="iw"><input id="' + id + '" type="text" inputmode="decimal" value="' + valor + '">' +
        (sufixo ? '<span class="u">' + sufixo + '</span>' : '') + '</div></div>';
    }

    /* ---- monta os campos conforme o mercado ---- */
    function montar() {
      var j = jogoAtual();
      var cfg = MERCADOS[mercado];
      var rotulos = cfg.rotulos(j);
      var odds = cfg.odds(j).map(function (o) { return o > 0 ? o : 2.00; });

      // probabilidades sugeridas = implícitas normalizadas das odds
      var inv = odds.map(function (o) { return 1 / o; });
      var soma = inv.reduce(function (a, b) { return a + b; }, 0);
      var probs = inv.map(function (v) { return Math.round(v / soma * 100); });
      var ajuste = 100 - probs.reduce(function (a, b) { return a + b; }, 0);
      if (ajuste) probs[0] += ajuste;

      document.getElementById('linhaProb').innerHTML =
        rotulos.map(function (r, i) { return campo('cp' + i, r, probs[i], '%'); }).join('');
      document.getElementById('linhaOdd').innerHTML =
        rotulos.map(function (r, i) { return campo('co' + i, r, P.dec(odds[i]), ''); }).join('');

      document.getElementById('linhaProb').style.gridTemplateColumns =
        document.getElementById('linhaOdd').style.gridTemplateColumns =
        'repeat(' + rotulos.length + ', minmax(0, 1fr))';

      rotulos.forEach(function (_, i) {
        document.getElementById('cp' + i).addEventListener('input', calcular);
        document.getElementById('co' + i).addEventListener('input', calcular);
      });

      var info = document.getElementById('cinfo');
      if (info) info.textContent = j.comp + ' · ' + j.dia + ' às ' + j.hora;

      calcular();
    }

    /* ---- calcula e desenha o resultado ---- */
    function calcular() {
      var cfg = MERCADOS[mercado];
      var rotulos = cfg.rotulos(jogoAtual());
      var p = [], o = [];
      for (var i = 0; i < rotulos.length; i++) {
        p.push(P.parse(document.getElementById('cp' + i).value));
        o.push(P.parse(document.getElementById('co' + i).value));
      }

      var soma = p.reduce(function (a, b) { return a + b; }, 0);
      var elSoma = document.getElementById('csum');
      elSoma.textContent = soma.toFixed(0) + '%';
      elSoma.style.color = Math.abs(soma - 100) <= 2 ? 'var(--brand-deep)' : 'var(--danger)';

      // diferenças abaixo de 1 ponto percentual são ruído de arredondamento,
      // não divergência real de leitura
      var TOLERANCIA = 1;
      var algumPos = false;
      var linhas = rotulos.map(function (r, i) {
        var impl = o[i] > 1 ? 100 / o[i] : 0;
        var dif = o[i] > 1 ? ((p[i] / 100) * o[i] - 1) * 100 : 0;
        if (dif > TOLERANCIA) algumPos = true;
        return '<tr><td>' + P.esc(r) + '</td>' +
          '<td class="mono">' + p[i].toFixed(0) + '%</td>' +
          '<td class="mono">' + P.dec(o[i]) + '</td>' +
          '<td class="mono">' + impl.toFixed(1).replace('.', ',') + '%</td>' +
          '<td class="mono ' + (dif > TOLERANCIA ? 'pos' : dif < -TOLERANCIA ? 'neg' : '') + '">' +
          (dif >= 0 ? '+' : '') + dif.toFixed(1).replace('.', ',') + '%</td>' +
          '<td><span class="vtag ' + (dif > TOLERANCIA ? 'pos' : dif < -TOLERANCIA ? 'neg' : 'neutro') + '">' +
          (dif > TOLERANCIA ? 'acima do mercado'
            : dif < -TOLERANCIA ? 'abaixo do mercado' : 'em linha') + '</span></td></tr>';
      }).join('');

      document.getElementById('evresult').innerHTML =
        '<div class="evbanner ' + (algumPos ? 'pos' : 'neg') + '">' +
          '<span class="eb1">' + (algumPos
            ? 'Sua estimativa diverge do mercado'
            : 'Sua estimativa está alinhada ao mercado') + '</span>' +
          '<span class="eb2">' + (algumPos
            ? 'Em pelo menos um resultado você atribui mais chance do que a odd embute.'
            : 'Em nenhum resultado sua estimativa ficou acima da probabilidade implícita.') + '</span>' +
        '</div>' +
        '<div class="tw" style="margin-bottom:0"><table class="evtable">' +
          '<thead><tr><th>Resultado</th><th>Sua prob.</th><th>Odd</th>' +
          '<th>Prob. implícita</th><th>Diferença</th><th></th></tr></thead>' +
          '<tbody>' + linhas + '</tbody></table></div>';
    }

    /* ---- controles ---- */
    sel.addEventListener('change', montar);
    document.querySelectorAll('[data-mkt]').forEach(function (b) {
      b.addEventListener('click', function () {
        mercado = b.dataset.mkt;
        document.querySelectorAll('[data-mkt]').forEach(function (x) { x.classList.toggle('on', x === b); });
        montar();
        if (window.track) window.track('calculator_market', { mercado: mercado });
      });
    });

    montar();
    if (window.track) window.track('calculator_open');
  });
})();
