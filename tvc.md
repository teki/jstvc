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

# CPU
    Clock: 3.125 MHz (50/16)
    WAIT is not used!
    
    