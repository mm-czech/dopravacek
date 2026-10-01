# Medvědí výprava — pravidla třetího režimu

## Smysl režimu

Hráč staví dopravní síť a učí se souvislosti mezi přepravou, výrobou, energií,
jídlem a službami. Každý přepravený člověk a každý kus nákladu se započítá
jednotlivě. Čas může běžet pomalu, rychle nebo stát. Město nikdy neztrácí již
postavené domy; při nedostatku služeb se pouze pozastaví jeho další růst.

Jméno režimu pro děti je **Medvědí výprava**. Slovo „hardcore“ se v rozhraní
nepoužije. Režim má vlastní svět, runtime, uloženou hru a klíč v localStorage.
Původní „Volné stavění“ a „Úkoly s Brumlou“ zůstávají v původním souboru.

## Bezpečný začátek a cesta k pokroku

Hráč začíná se 480 medvědími mincemi. Dosavadní městské silnice a průmyslové
budovy jsou součástí vygenerované krajiny. Připojení dvou obcí stojí obvykle
několik desítek silničních polí; dvě zastávky a autobus stojí dohromady 180.
První cesta autobusu tedy může vydělávat ještě před stavbou elektřiny.

| Věc | Cena v mincích | Podmínka |
| --- | ---: | --- |
| Silnice / mostní políčko | 3 / 8 | Volná trasa |
| Zastávka | 40 | Rovný úsek silnice |
| Autobus / patrový autobus | 100 / 170 | Trasa 2–8 propojených zastávek |
| Nákladní auto | 110 | Trasa 2–8 propojených zastávek |
| Elektrický stožár | 12 | Volné suché políčko |
| Lampa | 8 | Vhodná silnice nebo kolej |
| Popeláři / traktor | 130 / 65 | Město s popelnicemi / pole |
| Kolej / železniční most | 5 / 11 | Alespoň 20 kusů dřeva dodaných pile |
| Nádraží | 70 | Třípolíčková plocha; po odemčení kolejí |
| Parní / dieselová lokomotiva | 180 / 230 | Alespoň jeden vagón |
| Vagón | 45 | Nejvýše pět na vlak |
| Záchranný zásah | 25 za vozidlo | Probíhající událost |
| Bourání | 2 za odstraněný prvek | Neodstraňuje cizí městské vlastnictví |

Změna trasy, prohlížení mapy a ovládání času nejsou nákupem. Když hráč utratí
vše a nemá funkční spoj, může vzít **záchrannou půjčku**: získá 250 mincí,
závazek se zvýší o 300. Z dalších tržeb se 30 % automaticky splácí. Půjčka
nemá tvrdý početní limit, aby se hra nemohla nenávratně zablokovat. Bilance
dluhu je vždy viditelná. Nová hra vymaže pouze tuto třetí uloženou hru.

## Jednotlivé přepravy a výrobní řetězce

Zboží vzniká pouze u zdrojů, které obsluhuje odpovídající vozidlo; původní
produkční interval je pět herních sekund. Stanice má dosah tři políčka a sklad
nejvýše 300 kusů od druhu. Vykládka se počítá jen v jiné stanici, jež náklad
přijímá. Každý kus zvyšuje souhrnný počítač a vytvoří právě jednu odměnu:
cestující 4 mince, uhlí 2, dřevo 3, obilí 3, mouka 4.

- **Lidé:** Domy plní obsluhované zastávky. Příjezd do jiné obce dodává tržby
  a obnovuje ukazatel dopravní obsluhy cílové obce. Doprava se nepovažuje za
  provozovanou pouhým postavením zastávky.
- **Uhlí → elektrárna:** Doručený kus přidá elektrárně osm sekund paliva.
  Palivo ubývá po jedné sekundě, i když zatím není připojeno vedení. Při
  výpadku dojde zásoba na nulu, města zhasnou a růst se zastaví. Nový náklad
  dodávku obnoví.
- **Les → pila:** Dvacet skutečně doručených kusů dřeva trvale odemkne
  železnici. První dřevo se musí přepravit silničním nákladním autem; nevzniká
  kruhová závislost na dosud zamčených kolejích. I další dřevo dál přináší
  mince.
- **Farma → mlýn → obce:** Jeden kus obilí vyložený u mlýna vytvoří jeden kus
  mouky ve stejné stanici. Samostatné nákladní auto nastavené na mouku musí
  mouku dovézt k domům v jiné stanici. Mouku lze rozvážet silnicí; železnice
  převáží základní tři suroviny. Příjemce skladuje nejvýše 120 porcí a každých
  deset sekund spotřebuje nejméně jednu porci (větší město více). Hlad město
  nezbourá, ale nad hranicí růstu pozastaví stavbu.

## Elektrická síť

Stožáry se umisťují na volnou souš. Každý lze spojit s jiným stožárem do
vzdálenosti šesti polí (vzdálenost po osách, bez nutnosti přímé silnice).
Vedení smí překlenout vodu, stožár na vodě stát nesmí. První stožár musí být
nejvýše tři políčka od elektrárny; síť vedení se k ní vždy hledá znovu.
Domy obce přijímají proud, pokud se k některému z nich vedení přiblíží na
tři políčka a tato komponenta vede k elektrárně s palivem. Pokud je připojeno
více elektráren, stačí jedna zásobená. Odříznutá či vyhaslá síť nepřenáší
proud. Na mapě jsou vidět stožáry, propojení a stav obcí.

Okna a pouliční lampy v obci se v noci vykreslují jako rozsvícené pouze při
napájení. Venkovní lampy se řídí nejbližším připojeným sídlem. Po změně
napájení se překreslí příslušná geometrie světel. Lampy si lze koupit i před
přivedením elektřiny, ale do té doby nesvítí.

## Růst a odpad

Pro **jakýkoli růst** potřebuje sídlo přepravené cestující za posledních
60 sekund a živé elektrické připojení. Po dosažení 600 obyvatel potřebuje
navíc v zásobě jídlo. Po dosažení 1000 obyvatel také pravidelný svoz odpadu:
alespoň jedna popelnice v sídle byla vysypána v posledních 120 sekundách.
Každé takové vysypání přidá 3 mince. Počáteční obce mají méně než 600
obyvatel, takže hráč může začít dopravou a elektřinou, než otevře potravinový
řetězec. Strop sídla je 3000 obyvatel. Splněné podmínky vracejí běžnou
rychlost růstu původního simulátoru; nevyvolají stavbu okamžitě.
Otevřená záchranná událost v obci růst do vyřešení rovněž pozastaví.

## Ovládání, ukládání a izolace

Úvodní obrazovka nabídne třetí kartu vedle obou původních. Nový režim běží
v samostatném iframe se svou kopií zabalené hry, vlastním stavem, pravidly,
HUD a klíčem `dopravacek.medvedi-vyprava.v1`. Dvě původní karty se nevážou na
jeho simulační objekty. Ukládání běží po 30 sekundách, při skrytí stránky a
při návratu do menu. Rozdělaný dopravní spoj, palivo, jídlo, dluh, stožáry i
počítadla se ukládají společně se světem.

## Pracovní fáze a ověřovací body

1. **Záloha:** vzdálená větev s přesným původním commitem a kontrolním SHA.
2. **Izolace:** třetí karta, samostatný běh, samostatný save a bezpečný návrat.
3. **Mince:** ceny, transakce bez záporného zůstatku, odměna za skutečně
   vyložený kus a půjčka pro obnovu hry.
4. **Řetězce:** dřevo odemkne koleje, uhlí zásobuje elektrárnu, obilí se
   přemění na mouku až ve mlýně a následně se musí dovézt obcím.
5. **Energie a služby:** kreslení stožárů, dostupnost napájení, světla,
   podmínky růstu a svoz odpadu.
6. **Zkoušky:** průchod startem, nemožnost bezplatných nákupů, výpadek a
   obnova proudu, odemčení železnice, potravinová dodávka, stav po reloadu,
   zachování obou původních uložených her.

## Návrat k původní verzi

Původní stav je na větvi `backup/pre-hospodarsky-rezim-2026-10-01` na commitu
`8d98456da5b12d9da9aa69d5a272b054f6b6b10b`. Lze jej obnovit přesně
podle tohoto SHA. Pokud se má odstranit jen nový režim, stačí odebrat
spouštěč ze `index.html` a adresář `challenge/`; původní soubor hry a jeho
klíče uložených her se nemění.
