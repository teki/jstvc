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
    
    

# CPU
    Clock: 3.125 MHz (50/16)
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
        
    
    