# MEMORY
    memory mapping: 4*16k pages: 0,1,2,3
    ram pages: U0, U1, U2, U3
    SYS: system (editor + basic)
    EXT: extension (boot)
    VID: video
    CART: cartridge
    possible values:
    0: U0, SYS
    1: U1
    2: U2, VID
    3: U3, EXT, SYS
    
    mapping: writing to port 2
    b7-b6: 3: 00 CART, 01 SYS, 10 U3, 11 EXT
    b5   : 2: 0 VID, 1 U2
    b4-b3: 0: 00 SYS, 01 CART, 10 U0
    b2   : 1: 1 U1
    b1-b0: --

# VIDEO
    240 lines
    width: 64 bytes (512, 256, 128 pixels)
    240*64 = 15360 bytes
    IRGB colors
    3 modes: 2 colors (mapped to IRGB),4 (mapped to IRGB), 16 (IRGB)
    3 clocks: 12.5MHz, 6.25MHz, 3.125MHz
    plaetta register: 4 * 4bits (for 2 and 4 clolor modes)
    border register: 4 bit
    A byte is read in every 640ns.
    
    prev border end, line, border beg, line back
    
    line back: 25.26us
    line: 640ns * 64 = 40.96us
    
    
    pic end: line 268
    
    
    PAL standard: http://martin.hinner.info/vga/pal.html
        50 VSYNC / sec
        625 HSYNC / sec
        line period:  64us
        line 6 is the first visible and 310 is the last visible
        
    Video imp:
        tvc: 240 lines
        screen:
            64us line period
            312.5*2 lines (2 fields)  20ms/64us = 312.5
            305 visible lines in the first field
            first visible line ~28, with ~266 visible lines
        impl:
            312.5 lines => 312.5 * 64us = 20ms = 25fps
            bg color by default
            64us per line / 320ns per cpu tick = 200 cpu ticks per line
            drawn line: 640ns*64 = 40.96us = 128 cpu ticks
            12us is not visible from the line, 52us remains, center it: start at 18us
            
            line timing in cpu ticks:
                38 nothing
                18 border
                128 image
                16 border
            pic timing (lines):
                1-5 nothing
                6-35 border
                36 - 275 image
                276-310 border
                311-312.5 nothing
            
            
        
        
        
    
# PORTS
    -: not used
    +: other functions
    00H     7-5-3-1-    W       Border color
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
    10H-4FH extension card addresses
    50H     --------    R/W     Tape data out
    51H-57H same as 50H
    58H     76543210    R       Keyboard state (column read)
    58H     7-------    W       Extension card 0 IT clear
    59H     +++43210    R       Pending IT requests
    59H     765+++++    R       7: printer ack, 6: black/white, 5: tape data in
    59H     7-------    W       Extension card 1 IT clear
    5AH     76543210    R       Extension card identifier
    5AH     7-------    W       Extension card 2 IT clear
    5BH     --------    R       Sound oscillator reset
    5BH     7-------    W       Extension card 3 IT clear
    5CH-5FH same as 58H-5BH
    60H-63H -6-4-2-0    W       Plaette registers
    64H-6FH same as 60H-63H
    70H-71H 76543210    R/W     6845 CRTC register
    72H-7FH same as 70H-71H
    80H-9FH reserved for carts
    A0H-FFH unused
    
    

# CPU
    Instr table: http://www.z80.info/z80sean.txt
    Clock: 3.125 MHz (50/16), 1 tick = 320ns
    HALT: wait for interrupt
    Interrupt:
        IFF1, IFF2
        Maskable:
            PC -> (SP)
            PC = irq routine
            RETI ( reload PC )
        NMI:
            PC -> (SP)
            PC = (66H)
            RETN ( reload PC )
        IM 0: opcode from bus
        IM 1: (38H)
        IM 2: address from bus, then JP (I << 8 + address) [not used by TVC]
    Reset:
        IFF1, IFF2 = 0
        IM 0
        R = 0
        I = 0
    Reqisters:
        F: S Z Y H X P/V N C
            S: Set if the 2-complement value is negative. It's simply a copy of the most signi¯cant bit.
            Z: Set if the result is zero.
            Y: A copy of bit 5 of the result.
            H: The half-carry of an addition/subtraction (from bit 3 to 4). Needed for BCD correction with DAA.
            X: A copy of bit 3 of the result.
            P: This can either be the parity of the result (PF), or the 2-compliment signed overflow (VF): set if 2-compliment value doesn't fit in the register.
            N: Shows whether the last operation was an addition (0) or an subtraction (1). This information is needed for DAA.
            C: The carry flag, set if there was a carry after the most significant bit.
        I: interrupt table address upper half
        R: 7 bit counter, increment on each op
        SP: stack pointer, decreases on write, increases on read
        
    
    