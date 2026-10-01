# 🚂 Dopraváček

<p align="center">
  <img src="https://img.shields.io/badge/status-active-brightgreen.svg" alt="Status">
  <img src="https://img.shields.io/badge/language-JavaScript%20%2F%20TypeScript-blue.svg" alt="Tech">
  <img src="https://img.shields.io/badge/lang-Czech-orange.svg" alt="Language">
</p>

**Dopraváček** je relaxační a roztomilá budovatelská hra zaměřená na dopravu, logistiku a rozvoj zvířecích městeček. Stav silnice, rozvážej cestující, propojuj průmyslové areály vlakovými soupravami a pomáhej obyvatelům v nouzi!

---

## 🌟 O hře

Hra je kompletně vytvořená pro webové prohlížeče a nabízí tři herní režimy:
1. **Úkoly s Brumlou** – Plň příběhové mise, získej hvězdičky a sleduj, jak tvá síť propojuje okolní světy.
2. **Volné stavění** – Buduj bez omezení a úkolů přesně podle svých představ.
3. **Medvědí výprava** – Převážej každý kus zvlášť, vydělávej mince, zásobuj města elektřinou a jídlem a postupně odemykej železnici.

---

## 🎮 Hlavní funkce

* 🛣️ **Infrastruktura:** Intuitivní stavění silnic, jednokolejek, mostů a zastávek.
* 🚍 **Dopravní prostředky:** Autobusy, náklaďáky, traktory, popeláři i záchranné složky.
* 🚂 **Vlakové soupravy:** Sestav si vlastní lokomotivu a připoj k ní různé typy vagónů (uhlí, dřevo, obilí, pasažéři).
* 🌾 **Ekonomika a růst:** Suroviny proudí z dolů, lesů a fam k odběratelům; městečka přirozeně rostou s rozvojem dopravy.
* 🐻 **Průvodce Brumla:** Pomáhá hráčům s úkoly a radí, kam poslat další spoje.

---

## 🚀 Spuštění hry

Nechceš nic stahovat? Hru si můžeš zahrát **okamžitě v prohlížeči**:

[[https://mm-czech.github.io/dopravacek/](https://mm-czech.github.io/dopravacek/)]

## 🧩 Vývoj Medvědí výpravy

Pravidla, ceny, závislosti a pracovní fáze jsou v [návrhu režimu](docs/medvedi-vyprava.md).
Původní hra zůstává v `index.html`; samostatný běh nového režimu leží v `challenge/`.
Po úpravě `challenge/logic.js` z kořene repozitáře spusť `python challenge/build.py`
a následně `node challenge/smoke.test.cjs`. Generátor si před vytvořením kopie
ověří kontrolní součet původní hry i stylů.
