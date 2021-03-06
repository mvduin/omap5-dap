load "utils.js"

ds.setConfig 'omap5.ccxml'

connect_dap  = _connect 'dap',  'mem', 'DAP'

dap = null
mem = null
apbc = null
apb = null

ice = session 'ICEPick'
connect_dap()

if dap?
  mem   = new MemoryView dap, 0
  apba  = new MemoryView dap, 1,          0, 0x40000, 4  # l4emu, app view
  apb   = new MemoryView dap, 1, 0x80000000, 0x40000, 4  # l4emu, debug view

  # l3 (unfinished)
  ocmc	 = mem.subview  0x40300000,   0x20000
  l3sn0  = mem.subview  0x44000000,  0x800000
  l3sn1  = mem.subview  0x44800000,  0x800000
  l3sn2  = mem.subview  0x45000000,  0x800000
  l4p    = mem.subview  0x48000000,  0x200000
  abe    = mem.subview  0x49000000, 0x1000000
  l4cfg  = mem.subview  0x4a000000,  0xe00000
  l4wk   = mem.subview  0x4ae00000,  0x200000
  emif0  = mem.subview  0x4c000000, 0x1000000
  emif1  = mem.subview  0x4d000000, 0x1000000
  dmm    = mem.subview  0x4e000000, 0x1000000
  gpmc   = mem.subview  0x50000000, 0x1000000

  # l4p
  l4p.ap   = l4p.subview       0x0,     0x800
  l4p.la   = l4p.subview     0x800,     0x800
  l4p.ip0  = l4p.subview    0x1000,     0x400
  l4p.ip1  = l4p.subview    0x1400,     0x400
  l4p.ip2  = l4p.subview    0x1800,     0x400
  l4p.ip3  = l4p.subview    0x1c00,     0x400
  uart2    = l4p.subview   0x20000,    0x1000
  uart2.ta = l4p.subview   0x21000,    0x1000
  tim1     = l4p.subview   0x32000,    0x1000
  tim1.ta  = l4p.subview   0x33000,    0x1000
  tim2     = l4p.subview   0x34000,    0x1000
  tim2.ta  = l4p.subview   0x35000,    0x1000
  tim3     = l4p.subview   0x36000,    0x1000
  tim3.ta  = l4p.subview   0x37000,    0x1000
  tim8     = l4p.subview   0x3e000,    0x1000
  tim8.ta  = l4p.subview   0x3f000,    0x1000
  io6      = l4p.subview   0x51000,    0x1000
  io6.ta   = l4p.subview   0x52000,    0x1000
  io7      = l4p.subview   0x53000,    0x1000
  io7.ta   = l4p.subview   0x54000,    0x1000
  io1      = l4p.subview   0x55000,    0x1000
  io1.ta   = l4p.subview   0x56000,    0x1000
  io2      = l4p.subview   0x57000,    0x1000
  io2.ta   = l4p.subview   0x58000,    0x1000
  io3      = l4p.subview   0x59000,    0x1000
  io3.ta   = l4p.subview   0x5a000,    0x1000
  io4      = l4p.subview   0x5b000,    0x1000
  io4.ta   = l4p.subview   0x5c000,    0x1000
  io5      = l4p.subview   0x5d000,    0x1000
  io5.ta   = l4p.subview   0x5e000,    0x1000
  i2c2     = l4p.subview   0x60000,    0x1000
  i2c2.ta  = l4p.subview   0x61000,    0x1000
  uart4    = l4p.subview   0x66000,    0x1000
  uart4.ta = l4p.subview   0x67000,    0x1000
  uart5    = l4p.subview   0x68000,    0x1000
  uart5.ta = l4p.subview   0x69000,    0x1000
  uart0    = l4p.subview   0x6a000,    0x1000
  uart0.ta = l4p.subview   0x6b000,    0x1000
  uart1    = l4p.subview   0x6c000,    0x1000
  uart1.ta = l4p.subview   0x6d000,    0x1000
  uart3    = l4p.subview   0x6e000,    0x1000
  uart3.ta = l4p.subview   0x6f000,    0x1000
  i2c0     = l4p.subview   0x70000,    0x1000
  i2c0.ta  = l4p.subview   0x71000,    0x1000
  i2c1     = l4p.subview   0x72000,    0x1000
  i2c1.ta  = l4p.subview   0x73000,    0x1000
  elm      = l4p.subview   0x78000,    0x1000
  elm.ta   = l4p.subview   0x79000,    0x1000
  i2c3     = l4p.subview   0x7a000,    0x1000
  i2c3.ta  = l4p.subview   0x7b000,    0x1000
  i2c4     = l4p.subview   0x7c000,    0x1000
  i2c4.ta  = l4p.subview   0x7d000,    0x1000
  tim9     = l4p.subview   0x86000,    0x1000
  tim9.ta  = l4p.subview   0x87000,    0x1000
  tim10    = l4p.subview   0x88000,    0x1000
  tim10.ta = l4p.subview   0x89000,    0x1000
  rng      = l4p.subview   0x90000,    0x2000
  rng.ta   = l4p.subview   0x92000,    0x1000
  spi0     = l4p.subview   0x98000,    0x1000
  spi0.ta  = l4p.subview   0x99000,    0x1000
  spi1     = l4p.subview   0x9a000,    0x1000
  spi1.ta  = l4p.subview   0x9b000,    0x1000
  mmc0     = l4p.subview   0x9c000,    0x1000
  mmc0.ta  = l4p.subview   0x9d000,    0x1000
  cdma     = l4p.subview   0xa2000,    0x1000
  cdma.ta  = l4p.subview   0xa3000,    0x1000
  des      = l4p.subview   0xa4000,    0x1000
  des.pub  = l4p.subview   0xa5000,    0x1000
  des.ta   = l4p.subview   0xa6000,    0x1000
  pka      = l4p.subview   0xa8000,    0x4000
  pka.ta   = l4p.subview   0xac000,    0x1000
  mmc2     = l4p.subview   0xad000,    0x1000
  mmc2.ta  = l4p.subview   0xae000,    0x1000
  hdq1w    = l4p.subview   0xb2000,    0x1000
  hdq1w.ta = l4p.subview   0xb3000,    0x1000
  mmc1     = l4p.subview   0xb4000,    0x1000
  mmc1.ta  = l4p.subview   0xb5000,    0x1000
  spi2     = l4p.subview   0xb8000,    0x1000
  spi2.ta  = l4p.subview   0xb9000,    0x1000
  spi3     = l4p.subview   0xba000,    0x1000
  spi3.ta  = l4p.subview   0xbb000,    0x1000
  mmc3     = l4p.subview   0xd1000,    0x1000
  mmc3.ta  = l4p.subview   0xd2000,    0x1000
  mmc4     = l4p.subview   0xd5000,    0x1000
  mmc4.ta  = l4p.subview   0xd6000,    0x1000

  # l4cfg (unfinished)
  l4cfg.ap  = l4cfg.subview  0x000,     0x800
  l4cfg.la  = l4cfg.subview  0x800,     0x800
  l4cfg.ip0 = l4cfg.subview 0x1000,    0x1000
  ctrl      = l4cfg.subview 0x2000,    0x1000
  ctrl.ta   = l4cfg.subview 0x3000,    0x1000
  cmaon     = l4cfg.subview 0x4000,    0x1000
  cmaon.ta  = l4cfg.subview 0x5000,    0x1000
  cm        = l4cfg.subview 0x8000,    0x2000
  cm.ta     = l4cfg.subview 0xa000,    0x1000

  # l4wk (unfinished)
  l4wk.ap   = l4wk.subview   0x000,     0x800
  l4wk.la   = l4wk.subview   0x800,     0x800
  l4wk.ip0  = l4wk.subview  0x1000,    0x1000
  ctr32k    = l4wk.subview  0x4000,    0x1000
  ctr32k.ta = l4wk.subview  0x5000,    0x1000
  prm       = l4wk.subview  0x6000,    0x2000
  prm.ta    = l4wk.subview  0x8000,    0x1000
  scrm      = l4wk.subview  0xa000,    0x1000
  scrm.ta   = l4wk.subview  0xb000,    0x1000
  ctrlw     = l4wk.subview  0xc000,    0x1000
  ctrlw.ta  = l4wk.subview  0xd000,    0x1000
  io0       = l4wk.subview 0x10000,    0x1000
  io0.ta    = l4wk.subview 0x11000,    0x1000
  wdog1     = l4wk.subview 0x14000,    0x1000
  wdog1.ta  = l4wk.subview 0x15000,    0x1000
  tim1      = l4wk.subview 0x18000,    0x1000
  tim1.ta   = l4wk.subview 0x19000,    0x1000
  kbd       = l4wk.subview 0x1c000,    0x1000
  kbd.ta    = l4wk.subview 0x1d000,    0x1000
