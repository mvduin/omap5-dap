
//per_clkoutm2 = 192e6;
//i2c0_fck = per_clkoutm2 / 4;
//samplerate = 24e6;
//bitrate = 100e3;
//
//prescaler = Math.ceil( i2c0_fck / samplerate ) - 1;
//if( prescaler < 0 || prescaler > 255 )
//	throw "prescaler invalid";
//period = Math.round( samplerate / bitrate ) - 12;
//scl_low = Math.floor( period / 2 ) - 1;
//scl_high = period - scl_low;
//if( scl_low < 0 || scl_low > 255 )
//	throw "scl_low invalid";
//if( scl_high < 0 || scl_high > 255 )
//	throw "scl_high invalid";

ARDY = 1 << 2;
RRDY = 1 << 3;
XRDY = 1 << 4;

START = 1 << 0;
STOP = 1 << 1;
WRITE = 1 << 9;
MASTER = 1 << 10;
EN = 1 << 15;

function i2c0_init() {
	cm.stw( 0x1000, 2 );  // wake up L4PER power domain
	cm.stw( 0x10a0, 2 );  // enable i2c0 module
	while( cm.ldb( 0x10a2 ) & 3 )
		;

	//i2c0.stw( 0x10, 1 << 3 );  // sysconfig
	i2c0.stw( 0xa4, 0 );  // control
	//i2c0.stw( 0xb0, [ prescaler, scl_low, scl_high ] );
	i2c0.stw( 0x34,  0 );  // disable wakeup on irqs
	i2c0.stw( 0x28, -1 );  // clear all irqs
	i2c0.stw( 0x2c, 0x2ff );  // enable irqs
	i2c0.stw( 0x24, ARDY );
	i2c0.stw( 0xa4, EN );
}

function i2c0_wfi( expected ) {
	var irq;
	do irq = i2c0.ldw( 0x24 ) & 0x2ff; while( irq == 0 );
	if( expected && irq != expected )
		throw "Unexpected state";
	return irq;
}

function i2c0_start( slave, len, control ) {
	var irq = i2c0_wfi( ARDY );
	i2c0.stw( 0x28, irq );
	i2c0.stw( 0xac, slave );
	i2c0.stw( 0x98, len );
	i2c0.stw( 0xa4, EN | MASTER | START | control );
}

function i2c0_rx() {
	var irq = i2c0_wfi( RRDY );
	var x = i2c0.ldw( 0x9c );
	i2c0.stw( 0x28, irq );
	return x;
}

function i2c0_tx( x ) {
	var irq = i2c0_wfi( XRDY );
	i2c0.stw( 0x9c, x );
	i2c0.stw( 0x28, irq );
}

function pmic_read( offset, len )
{
	var page = offset >> 8;
	offset &= 0xff;
	if( page < 1 || page > 3 )
		throw "Invalid page for Palmas";
	var addr = 0x48 + (page-1);

	i2c0_start( addr, 1, WRITE );
	i2c0_tx( offset );
	i2c0_start( addr, len || 1, STOP );
	if( !len )
		return i2c0_rx();
	var x = [];
	while( len-- )
		x.push( i2c0_rx() );
	return x;
}
