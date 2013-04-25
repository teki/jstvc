# jstvc

Javascript VIDEOTON TV Computer emulátor.

Demo: http://teki.github.io/jstvc

Tesztelve:
- Google Chrome (ajánlott)
- Safari 6+
- Firefox műküdik, de lassú

# TVC

About the TVC: http://tvc.hu/html/inenglish.html

TVC rajongói oldal: http://www.tvc.hu

# Működik (működget)

* Z80
	* a FUSE és ZXDOC tesztek lefutnak hiba nélkül
	* utasítás hosszabbítás nincs
* CRTC
	* Motorla 6845 emuláció
	* megjelenítés szimuláció (a 6845 kiementét rendereli bitmap-re)
	* kurzor megszakítás
* US billentyűzet

# Tennivalók, ötletek

* CRTC/CPU időzítés nem 100%-osan pontos
* pontosabb hang
* magyar billentyűzet
* fájlkezelés
* snapshot

# Nem általam írt kódok

* hang: https://github.com/jussi-kalliokoski/sink.js/
* web: http://jquery.com/
* modulok: http://requirejs.org/
* z80 tesztek:
	* http://sourceforge.net/p/fuse-emulator/code/HEAD/tree/trunk/fuse/z80/tests/
	* http://mdfs.net/Software/Z80/Exerciser/
* wd1793 implementáció: http://fms.komkon.org/EMUL8/

# Debugger

A böngésző javascript konzolán érhető el. A g.tvc objektumon a d betűvel kezdődő utasítások használhatók debuggolásra:

	* g.tvc.db("0010,3000") - új breakpoint(ok), paraméter nélkül: breakpoint-ok litázása
	* g.tvc.dd("0010") - breakpoint törlése ("all" törli az összeset)
	* g.tvc.dreg() - regiszterek tartalma
	* g.tvc.dstep() - egy utasítás végrehajtása
	* g.tvc.dmem(cím, [sorok száma], [bájt per sor]) - memóriatartalom listázása
	* g.tvc.dasm(cím, [utasítások száma]) - disassembly memória

# Verzió történet

 * debugger g.tvc.[step,b,bd,dumpMem,dasm]
 * z80 LD r,(IY+d) fix
 * wd1793 emuláció

v0.1.1

 * géptipusválasztás
 * 64k+ emulálása
 * 2.2 BASIC romok

v0.1.0

 * kezdetleges hang implementáció
 	* nincs korrekt időzítés (azért felismerhetőek a dallamok)
 	* Web Audio és Mozilla Audio implementációkat támogat, így Safar,Chrome és Firefox-on kívül nem nagyon fog működni

v0.0.5

 * új CRTC implementáció, még nem 100%-os, de közelít
 * stop gomb, emuláció szüneteltetéséhez
 * Firefox jól teljesített a sor alapú megjelenítéssel, de amint váltottam nagyobb pontosságra feladta.

v0.0.4

 * Safari fix (működik, de lassú)
 * status sor, értesítések helyett

v0.0.3

 * verzió szám a weblapon
 * verzió frissítés automatizálás
 * billentyűzet események elkapása

v0.0.2

 * frissítés fix (60fps-el fut nekem Chrome-ban, limitálni kell 50-re)
 * értesítés eseményekről (bug: a háttérben jelennek meg)
 * cas toltes egyszerusitese

v0.0.1

* Z80
* US billentyűzet
* megszakítás
* video memória canvas-ra rajzolása
* Chrome-ban gyorsabban fut mint Firefox-ban (más alatt nem próbáltam)

# Egyéb

Ez egy javascript tanulo / TVC rajongo project.

TVC volt az elso gepem. Magno nelkul vettuk bizomanyiban, ha jol
emlekszem 3500Ft koruli osszegert (ami akkoriban is jo arnak szamitott).
Sokaig nem is volt hozza tarolom, igy minden bekapcsolas utan be kellett
valami programot gepelnem. Rengeteg orat toltottem a geppel (kenyerpiritas
a tapagysegen :), de sajnos nem ismertem senkit hasonlo masinaval,
igy a konyvesboltokban osszevadaszott konyvekbol igyekeztem tudast szerezni.
(amibol nem tul sok jutott el keletre)
A TVC klubbrol/ujsagrol eleg keson hallottam, szuper lett volna ha par
evvel korabban futok bele.
A TVC ROM volt az egyik elso konyvem, de fogalmam sem volt mi mit jelentent.
Par evig eltartott, mire rajottem, hogy van elet a
BASIC-en tul, igy gepi koddal nem is tul sokat foglalatoskodtam. Kicsit
kesobb kaptam egy C64-est, s unokaocsemre szallt a gep, aki meg jo par evig
nyuzta.

