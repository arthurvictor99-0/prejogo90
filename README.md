# PreJogo90 — site

Site estático publicado em **https://prejogo90.com.br** (GitHub Pages).

Plataforma de informação pré-jogo: jogos do dia, odds de referência do mercado
e probabilidades implícitas. **Sem palpite, sem promessa de ganho.**

## Estrutura

```
index.html              home
jogos.html              agenda completa
jogos/<slug>.html       central do jogo (uma por partida)
calculadora.html        calculadora de odds
jogo-responsavel.html   jogo responsável
assets/                 CSS e JS
sitemap.xml, robots.txt SEO
CNAME                   domínio customizado
```

## Como o conteúdo é atualizado

As páginas de jogos são **geradas automaticamente** por um gerador que vive em
repositório separado e privado. Este repositório guarda apenas o resultado
publicado — não edite `index.html`, `jogos.html` ou `jogos/*.html` à mão,
pois são sobrescritos a cada geração.

Páginas mantidas manualmente: `calculadora.html`, `jogo-responsavel.html`, `assets/`.

## Compliance

- Odds sempre rotuladas como **referência do mercado**, nunca como cotação de operadora
- Links de parceiro marcados como publicidade, com `rel="sponsored nofollow"`
- Conteúdo exclusivo para **maiores de 18 anos**; sem promessa de ganho
