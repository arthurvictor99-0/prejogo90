#!/usr/bin/env python3
"""Publica os placares dos jogos do dia em dados/placares.json.

Roda separado do gerador do site: é leve (uma única requisição ao
football-data.org, que devolve todos os jogos do dia de todas as
competições) e por isso pode rodar com frequência sem estourar cota.

O token nunca chega ao navegador — quem consulta a API é o GitHub Actions;
a página só lê o JSON já publicado.
"""
from __future__ import annotations

import json
import os
import re
import sys
import unicodedata
from datetime import datetime, timedelta, timezone

import requests

TOKEN = os.environ.get("FOOTBALL_DATA_TOKEN", "")
BASE = os.path.dirname(os.path.abspath(__file__))
SAIDA = os.path.join(BASE, "dados", "placares.json")
FUSO_BR = timezone(timedelta(hours=-3))

# precisa gerar exatamente as mesmas chaves de gerar_site.py (_fd_norm),
# senão o placar não casa com o jogo exibido na página
FD_RUIDO = {"fc", "cf", "sc", "ac", "afc", "cd", "ud", "ss", "us", "se", "sv", "bc",
            "calcio", "club", "clube", "de", "do", "da", "dos", "das", "the", "and",
            "1", "07", "04", "05", "1899", "1846", "1901"}


def norm(texto: str) -> str:
    s = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower()
    s = re.sub(r"[^a-z0-9 ]", " ", s)
    return " ".join(t for t in s.split() if t and t not in FD_RUIDO)


def main() -> int:
    if not TOKEN:
        print("FOOTBALL_DATA_TOKEN ausente — nada a fazer.")
        return 0

    hoje = datetime.now(FUSO_BR).date().isoformat()
    try:
        resp = requests.get(
            f"https://api.football-data.org/v4/matches?dateFrom={hoje}&dateTo={hoje}",
            headers={"X-Auth-Token": TOKEN}, timeout=30)
    except requests.RequestException as e:
        print(f"Falha na requisição: {e}")
        return 1

    if resp.status_code != 200:
        print(f"API respondeu {resp.status_code} — mantendo o arquivo anterior.")
        return 1

    jogos = {}
    for m in resp.json().get("matches", []):
        estado = m.get("status", "")
        if estado in ("SCHEDULED", "TIMED"):
            continue  # ainda não começou: a página já mostra o horário
        p = m.get("score", {}).get("fullTime", {})
        chave = f"{norm(m['homeTeam']['name'])}|{norm(m['awayTeam']['name'])}"
        jogos[chave] = {
            "s": estado,
            "gc": p.get("home"),
            "gf": p.get("away"),
            "min": m.get("minute"),
        }

    # nada acontecendo e nada acontecia: não reescreve, para não gerar commit à toa
    if not jogos:
        try:
            with open(SAIDA, encoding="utf-8") as f:
                if not json.load(f).get("jogos"):
                    print("Nenhum jogo em andamento — arquivo já estava vazio.")
                    return 0
        except (OSError, ValueError):
            pass

    agora = datetime.now(FUSO_BR)
    os.makedirs(os.path.dirname(SAIDA), exist_ok=True)
    with open(SAIDA, "w", encoding="utf-8") as f:
        json.dump({"atualizado": agora.strftime("%H:%M"),
                   "iso": agora.isoformat(),
                   "jogos": jogos}, f, ensure_ascii=False, separators=(",", ":"))

    print(f"{len(jogos)} jogo(s) em andamento/encerrados às {agora.strftime('%H:%M')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
