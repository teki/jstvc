# TVC modellek

Videoton TV Computer

	CPU: Z80A 3.125MHz
	Video: Motorola 6845



# Memória

RAM

	-16kB-os lapok: U0, U1, U2^, U3^

ROM

	- SYS: 16kB, basic, editor
		- TVC12_D4.64K (0000), TVC12_D3.64K (0x2000)
		- TVC22_D6.64K (0000), TVC22_D4.64K (0x2000)
	- EXT: 8kB, kiegészítő rom, boot
		- TVC12_D7.64K
		- TVC22_D7.64K
	
VID

	- 16kB a 32k és a 64k esetében
	- 16kB * 4 a 64k+ esetében

CART

	- cartridge

Lapozás

    RAM: U0, U1, U2, U3
    SYS: system (editor + basic)
    EXT: extension (boot)
    VID: video
 
	^: 64k, 64k+
	#: 64k+
	%: 64k+ és 32K
    
	Memória lapozás, 2-es port:
		lap 0: SYS (00), CART (08), U0 (10), U3% (18) /maszk: 18/
		lap 1: U1 (00), VID# (04) /maszk: 04/
		lap 2: VID (00), U2 (20) /maszk: 20/
		lap 3: CART (00), SYS (40), U3 (80), EXT (C0) /maszk: C0/

	Bővítők lapozása, 3-as port:
		CST0 (00), CST1 (40), CST2 (80), CST3 (C0) /maszk: C0/

	Videó lapozó regiszter #, 15-ös port:
		CRT: VID0 (00), VID1 (10), VID2 (20), VID3 (30)
		LAP2: VID0 (00), VID1 (04), VID2 (08), VID3 (0C)
		LAP1: VID0 (00), VID1 (01), VID2 (02), VID3 (03)

# CRTC

Motorola 6845

	Karakter frequencia: 3.125MHz/2 = 1.5625 MHz = 640ns per karakter

Regiszterek:

	Rövidítések: w: írható, r: olvasható, k: karakter, ts: tv sorok, x-1: érték -1-et kell írni bele

	R0 w,k,x-1 karakter ütemek egy tv-soron belül (sor előrefutás+vissza)
		TVC: 99 => 100 karakterütem == 64us == PAL sorido
 
	R1 w,k sorelőrefutás karaktereinek száma (láthato karakterek), nem lehet kisebb  R0-nál
		TVC: 64 => 64 byte per sor

	R2 w,k,x-1 	szinkronjel kezdete a sorelőfutás kezdetétől mérve, nem lehet kisebb  R0-nal
		TVC: 75 => 76
	
	R3 w,vvvvhhhh v/h szinkronjelek szélessége; v: tv sorütemben, 0 => 16 sor; h: karakterekben, 0 => tilos
		TVC: h:2, v:3

	R4 w,-6543210,k,x-1 képelőrefutás + képvisszafutás karaktersorainak összege
		TVC: 77 => 78 ( (77 + 1) * 4) + 2 = 314 tv sor

	R5 w,---43210,ts kiegészitő regiszter R4-hez; tv sorok száma: (R4 + 1) * R9 + R5
		TVC: 2
	
	R6 w,-6543210,k hasznos kép (sorelőrefutás) karaktersorainak száma, kisebbnek kell lennie mint R4
		TVC: 60 => 60 * 4 = 240
            
	R7 w,-6543210,k,x-1 v-sync kezdete - kép vége a sorelőrefutás kezdetétől
		TVC: 66 => 67
		
	R8 w,uucdtrii uu: frissítés mód, c: kurzor késleltetés, d: display enable késleltetés, t: ram elérési mód, r: ram címzési mód, i: interlace mód
		TVC: 0, nem váltott soros, nincs késleltetés, megosztott ram elérés, folyamatos címzés

	R9 w,---43210,ts,x-y tv sorok száma per karakter sor; progresszív x-1,  interlace1: x-1, interlace2: x-2
		TVC: 3 => 4 sor

	R10 w,-BP43210 BP: 00 nem villogó,01 nincs kurzor,10 16 villogás,11 32 villogás; bit 4-0: kurzor tetejének tv-sor pozíciója a karaktersoron belül
		TVC: 3 => nem villogo, 3. tv sor

	R11 w,---43210,ts kurzor utolsó sora
		TVC: 3

	R12 rw,--543210 kép kezdete a memóriában H
		TVC: 0

	R13 rw,76543210 kép kezdete a memóriában L
		TVC: 0

	R14 rw,--543210 kurzor pozíció H
		TVC: 14

	R15 rw,76543210 kurzor pozíció L
		TVC: 255

	R16, R17 r fényceruza

Működés

	Jó kis leírás: http://www.6502.org/users/andre/hwinfo/crtc/crtc.html
	A datasheet-et nem nehéz google-el meglelni. (a Hitachi 46505 verzió egy kicsit jobban sikerült szerintem)

TVC specifikus + jó tudni programozáshoz


	- R12,R13-t címregisztereket a frissítés kezdetekor olvassa ki.
	- R3 nem igazán használt
		- hsync: 25.26us
		- vsync: R7 a kezdete és MA9 1-be billenése a vége
	- számlálók
		- oszlop: 0-tól R0-ig számol
		- sor: 0-tól R4-ig számol
		- tv sor: 0-tól R9-ig számol
		- az utolsó karakter sor után még R5 tv sort számol
	- Címzés: kezdőérték soronként: (sor * R1) , utolsó érték: (sor * R1) + R0 - 1
	- Memória cím képzés: 12 bitet használ a 6845 címértékéből, s betoldja a raszter sor számláló alsó két bitjét a hatodik bit után: MMMMMMRRMMMMMM
	- Ez magyarázza a 0x0EFF kurzor pizíciót. Akkor magas a kurzor kimenet, amikor a cím megegyezik R14,R15-el és a tv sor számláló R10 és R11 közé esik. R10 és R11 = 3, ezt beillesztve 0xEFF-be, 0x3BFF-et kapunk, ami az utolsó memória pozíció : a látható képen.
	- A kurzor magas jele megszakítást generál a CPU felé, ha a kurzor engedélyezve van.
	- Címzésenként egy bájtot olvas ki, amit egy shift regiszteren keresztül alakít át videó módtól függően:
		- 2: 0|1|2|3|4|5|6|7
		- 4: 0L|1L|2L|3L|0H|1H|2H|3H
		- 16: 0I|1I|0G|1G|0R|1R|0B|1B

	
# Megszakítások

Kurzor

	A CRTC kurzor jele váltja ki. Alap állapotban másodpercenként 50-szer, amikor a CRTC az utolsó sor utolsó pixeleit rajzolja ki.

Hang


# VIDEO
    Resources:
        * Amstard infos:
            http://www.grimware.org/doku.php/documentations/devices/crtc
            http://www.cpcwiki.eu/index.php/CRTC
    TVC scpecific
        * chacarcter tick = 2 cpu ticks
        * kezdoertekek:
            * [ 99, 64, 75, 50, 77,  2, 60, 66,  0,  3,  3,  3,  0,  0, 14, 255,  0,  0 ]
            * [ 63, 40, 4B, 32, 4D, 02, 60, 3C, 00, 03, 03, 03, 00, 00, 0E, FF , 00, 00 ]
            
            
# PORTS
    -: not used
    +: other functions
    00H     7-5-3-1-    W       Border color (IGRB)
    01H     76543210    W       Printer data
    02H     76543---    W       Memory mapping
    03H     ++--3210    W       Keyboard (row)
    03H     76--++++    W       Extended RAM/ROM mapping
    04H     76543210    W       Sound freq low
    05H     ++++3210    W       Sound freq high
    05H     ++54++++    W       Sound oscillator, Sount IT, enable/disable
    05H     76++++++    W       Tape motor
    06H     +-++++10    W       Video mode (color count)
    06H     +-5432++    W       Sound amp
    06H     7-++++++    W       Printer ack
    07H     --------    W       cursor/sound IT clear
    08H-0BH unused
    0CH                 W       Video mapping (64k+)
    0DH-0FH same as 0CH
    10H-1FH extension card 0 addresses
    20H-2FH extension card 1 addresses
    30H-3FH extension card 2 addresses
    40H-4FH extension card 3 addresses
    50H     --------    R/W Tape data out
    51H-57H same as 50H
    58H     76543210    R   Keyboard state (column read)
    58H     7-------    W   Extension card 0 IT clear
    59H     +++43210    R   Pending IT requests (CU/HANG, CSTL3, CSTL2, CSTL1, CSTL0)
    59H     765+++++    R   7: printer ack, 6: black/white, 5: tape data in
    59H     7-------    W   Extension card 1 IT clear
    5AH     76543210    R   Extension card identifier 33221100: 00 RS232, 01 nem használt, 10: floppy, 11: üres vagy nem specifikált
    5AH     7-------    W   Extension card 2 IT clear
    5BH     --------    R   Sound oscillator reset
    5BH     7-------    W   Extension card 3 IT clear
    5CH-5FH same as 58H-5BH
    60H-63H -6-4-2-0    W       Palette registers
    64H-6FH same as 60H-63H
    70H-71H 76543210    R/W     6845 CRTC register
    72H-7FH same as 70H-71H
    80H-9FH reserved for carts
    A0H-FFH unused
    
    

# CPU
    Resources:
        * instr table: http://www.z80.info/z80sean.txt
        * testing info: http://www.worldofspectrum.org/forums/showthread.php?t=41704
        * interrupt handling: http://www.nvg.ntnu.no/sinclair/faq/tech_z80.html
        * tests: http://mdfs.net/Software/Z80/Exerciser/

	Parity:
		This flag is also used with logical operations and
	   	rotateinstructions to indicate the resulting parityis
	   	Even. The number of 1bits in a byte are counted.
	   	If the total is Odd, ODD parity is flagged (P = 0).
	   	If the total is Even, EVEN parity is flagged (P = 1).

	Sign bit: copy of bit7 (== negative)

	NZ non zero Z
	Z zero Z
	NC non carry C
	C carry Z
	PO parity odd P/V
	PE parity even P/V
	P sign positive S
	M sign negative S
    
    TVC specific:
        * clock: 3.125 MHz (50/16), 1 tick = 320ns

# RESOURCES
	* how to write emulators: http://atarihq.com/danb/emulation.shtml
	
	
	
	http://nocash.emubase.de/zxdocs.htm
	http://www.cpcwiki.eu/imgs/c/c0/Hd6845.hitachi.pdf
	http://www.retroleum.co.uk/electronics-articles/pal-tv-timing-and-voltages/
	http://primrosebank.net/computers/mtx/documents/MC6845P.pdf
	https://github.com/bfirsh/dynamicaudio.js
	
