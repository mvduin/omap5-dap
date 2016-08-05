// Setup environment (in case not running from CCS)

importPackage( Packages.com.ti.ccstudio.scripting.environment );
importPackage( Packages.com.ti.debug.engine.scripting );


// global vars
//
env = ScriptingEnvironment.instance();

if( this.ds == null ) {
	ds = env.getServer( 'DebugServer.1' )
	ds.setConfig( 'target.ccxml' );
}


// log less to the console
//
env.traceSetConsoleLevel( TraceLevel.CONFIG );


// Workarounds for the ancient version of Rhino used by CCS

if( typeof( Object.defineProperty ) !== 'undefined' ) {
	function add_method( to, name, fun ) {
		var spec = {};
		spec.value = fun;
		spec.enumerable = false;
		spec.configurable = true;
		Object.defineProperty( to.prototype, name, spec );
	}
} else {
	function add_method( to, name, fun ) {
		to.prototype[name] = fun;
	}
}


// Number formatting utils
//
// Beware that integers in JavaScript are seriously broken:
// 
// Bitwise operations work as follows:
//	if not integer, arguments are truncated (round towards 0)
//	arguments are (re)interpreted as:
//		unsigned 5-bit   if shift amount
//		unsigned 32-bit  for logical shift right (>>>)
//		signed 32-bit    in all other cases
// Note that JS has no support for 64-bit integers, and you cannot use the
// 53-bit integer part of doubles for bitwise ops either.

add_method( Number, "u32", function() { return this >>> 0; } );

add_method( Number, "bin", function() { return this.u32().toString(2); } );

add_method( Number, "numBits", function( signed )
{
	if( signed )
		return 1 + (this ^ this >> 31).numBits();
	return this.bin().length;
} );

function hex( val, minlen )
{
	if( val > 0 || val < 0 ) {
		val = val.u32().toString( 16 );
		if( val.length % 2 ) val = "0"+val;
	} else if( val == null ) {
		val = "-";
	} else {
		val += "";
	}
	val = "        ".substr( 0, minlen-val.length ) + val;
	return val;
}

function hw( val ) { return hex( val, 8 ); }
function hh( val ) { return hex( val, 4 ); }
function hb( val ) { return hex( val, 2 ); }

add_method( Number, "hex", function( minlen ) { return hex( this, minlen ); } );

add_method( Number, "hw", function() { return hex( this, 8 ); } );
add_method( Number, "hh", function() { return hex( this, 4 ); } );
add_method( Number, "hb", function() { return hex( this, 2 ); } );

add_method( Array, "hw", function() { return this.map( hw ); } );
add_method( Array, "hh", function() { return this.map( hh ); } );
add_method( Array, "hb", function() { return this.map( hb ); } );


// Miscellaneous utils

add_method( Array, "x", function( count )
{
	var tmp = this;
	var res = tmp.slice( tmp.length ); // [] or ""
	
	count >>>= 0;
	while( count ) {
		if( count & 1 )
			res = res.concat( tmp );
		tmp = tmp.concat( tmp );
		count >>>= 1;
	}
	return res;
} );

add_method( String, "x", Array.prototype.x );


// More convenient memory access
//
function MemoryView( mem, page, offset, length, align ) {
	if( mem == null )
		return null;
	if( mem instanceof DebugSession )
		mem = mem.memory;
	if( !( mem instanceof Memory ))
		throw 'Wrong argument type in constructing MemoryView';
	if( page < 0 || page >= mem.getPageCount() )
		throw 'Page index out of bounds';
	if( offset == null )
		offset = 0;
	if( align == null )
		align = 1;
	if( align < 1 || align & (align-1) )
		throw 'Invalid alignment specification';
	if( offset % align )
		throw 'Alignment violation';
	this.memory = mem;
	this.page = page;
	this.offset = offset;
	this.align = align;
	if( length != null )
		this.length = length;
}

add_method( MemoryView, "subview", function( offset, length, align )
{
	if( align == null )
		align = this.align;
	else if( align % this.align )
		throw 'Alignment violation';
	if( offset == null )
		offset = 0;
	if( length == null && this.length != null )
		length = this.length - offset;
	offset += this.offset;
	return new MemoryView( this.memory, this.page, offset, length, align );
} );

add_method( MemoryView, "upload", function( filepath, addr, xfersize )
{
	if( addr == null )
		addr = 0;
	if( xfersize == null ) {
		xfersize = (addr | 4);
		xfersize &= -xfersize;
	}
	if(( addr | xfersize ) % this.align )
		throw 'Alignment violation';
	xfersize *= 8;
	addr += this.offset;
	this.memory.loadRaw( this.page, addr, filepath, xfersize, false );
} );

add_method( MemoryView, "save", function( filepath, addr, len, xfersize )
{
	if( xfersize == null ) {
		xfersize = (addr | len | 4);
		xfersize &= -xfersize;
	}
	if(( addr | xfersize ) % this.align )
		throw 'Alignment violation';
	if( len == null )
		throw "Length required";
	if( len % xfersize )
		throw 'Invalid length';
	len /= xfersize;
	xfersize *= 8;
	addr += this.offset;
	this.memory.saveRaw( this.page, addr, filepath, len, xfersize, false );
} );

add_method( MemoryView, "zeroize", function( addr, len, xfersize )
{
	if( xfersize == null ) {
		xfersize = (addr | len | 4);
		xfersize &= -xfersize;
	}
	if(( addr | xfersize ) % this.align )
		throw 'Alignment violation';
	if( len == null )
		throw "Length required";
	if( len % xfersize )
		throw 'Invalid length';
	if( xfersize != 4 )
		throw 'TODO';
	len /= xfersize;
	addr += this.offset;
	this.memory.fill( addr, this.page, len, 0 );
} );

add_method( MemoryView, "load", function( addr, len, intsize, signed )
{
	if( intsize == null )
		intsize = this.align;
	if(( addr | intsize ) % this.align )
		throw 'Alignment violation';
	if( len != null ) {
		if( len % intsize )
			throw 'Invalid length';
		len /= intsize;
	}
	intsize *= 8;
	signed = !!signed;
	addr += this.offset;
	if( len == null )
		return this.memory.readData( this.page, addr, intsize, signed );
	return this.memory.readData( this.page, addr, intsize, len, signed )
		.slice(0);
} );

add_method( MemoryView, "store", function( addr, data, intsize )
{
	if( intsize == null )
		intsize = this.align;
	if(( addr | intsize ) % this.align )
		throw 'Alignment violation';
	intsize *= 8;
	addr += this.offset;
	this.memory.writeData( this.page, addr, data, intsize )
} );

add_method( MemoryView, "ldw", function( addr, len )
	{ return this.load( addr, len, 4, false ); } );
add_method( MemoryView, "ldh", function( addr, len )
	{ return this.load( addr, len, 2, false ); } );
add_method( MemoryView, "ldb", function( addr, len )
	{ return this.load( addr, len, 1, false ); } );
add_method( MemoryView, "ldsw", function( addr, len )
	{ return this.load( addr, len, 4, true ); } );
add_method( MemoryView, "ldsh", function( addr, len )
	{ return this.load( addr, len, 2, true ); } );
add_method( MemoryView, "ldsb", function(addr,len)
	{ return this.load( addr, len, 1, true ); } );

add_method( MemoryView, "stw", function( addr, data )
	{ return this.store( addr, data, 4 ); } );
add_method( MemoryView, "sth", function( addr, data )
	{ return this.store( addr, data, 2 ); } );
add_method( MemoryView, "stb", function( addr, data )
	{ return this.store( addr, data, 1 ); } );

add_method( MemoryView, "dump", function( addr, len, intsize )
{
	if( intsize == null )
		intsize = this.align;
	if( len == null )
		len = intsize;
	if(( addr | len | intsize | 16 ) & ( intsize-1 | this.align-1 ))
		throw 'Alignment violation';
	var data = this.load( addr, len, intsize );
	data = [].concat(
			[null].x(( addr & 15 ) / intsize ),
			data,
			[null].x(( -( addr + len ) & 15 ) / intsize )
		).reverse().map( function(x) { return hex(x, 2*intsize); } );
	addr -= addr & 15;
	addr += this.offset;
	var force = true;
	var prev;
	var count = 0;
	do {
		var line = data.splice( -16 / intsize ).join( " " );
		if( prev && ( prev != line || force )) {
			force = count > 1;
			print( hw( force ? '...' : addr ) + ': ', prev );
			addr += count * 16;
			count = 0;
		}
		++count;
		prev = line;
	} while( prev );
	print( hw( addr ) + '-' );
} );

add_method( MemoryView, "dw", function( addr, len ) { this.dump( addr, len, 4 ); } );
add_method( MemoryView, "dh", function( addr, len ) { this.dump( addr, len, 2 ); } );
add_method( MemoryView, "db", function( addr, len ) { this.dump( addr, len, 1 ); } );

add_method( MemoryView, "ldbw", function( addr )
{
	if( addr % 0x10 )
		throw 'Alignment violation';
	var data = this.ldw( addr, 0x10 );
	if( data == [0xbad0bad0].x(4) )
		throw 'Access error';
	var val = 0;
	data.forEach( function(x,i) {
		if( x > 0xFF )
			throw 'Expecting byte at '+addr.hw()+' but got '+x;
		val += x * (1 << ( i * 8 ));
	});
	return val >>> 0;
} );

add_method( MemoryView, "ds3info", function( addr ) // dump Sonics3220 info
{
	addr &= -0x400;
	var data = this.ldw( addr, 0x20 );
	if( !( data[0] >>> 16 ) || data[1] || data[2] || data[3] || data[4] )
		throw 'suspicious';
	var info = {};
	info.component = { code: data[0] >>> 16,
			rev: data[0] & 0xFFFF, label: "unknown" };
	if( data[5] || info.component.label == "link agent" ) {
		info.network = { id: data[5] };
		print( 'network id: ', data[5].hw() );
	}
} );

add_method( MemoryView, "dcsid", function( addr ) // dump CoreSight ID
{
	if( addr & 0xFFF )
		throw 'Address must be page-aligned';
	var desc = (this.offset+addr+0xFF0).hw() + ' Component ID: ';
	var id;
	try {
		id = this.ldbw( addr + 0xFF0 );
	} catch(e) {
		print( desc + ' <not readable>' );
		return;
	}
	desc += id.hex();
	switch( id ) {
	case 0xB105000D:
		print( desc + ' (verification component)' );
		break;
	case 0xB105100D:
		print( desc + ' (ROM table)' );
		break;
	case 0xB105900D:
		print( desc + ' (CoreSight debug component)' );
		break;
	case 0xB105B00D:
		print( desc + ' (Peripheral Test Block)' );
		break;
	case 0xB105D00D:
		print( desc + ' (OptimoDE DESS component)' );
		break;
	case 0xB105E00D:
		print( desc + ' (generic component)' );
		break;
	case 0xB105F00D:
		print( desc + ' (PrimeCell peripheral)' );
		break;
	default:
		print( desc + ' (unknown)' );
		return;
	}
	desc = ( this.offset + addr + 0xFD0 ).hw() + ' Peripheral ID: ';
	try {
		id = ( this.ldbw( addr + 0xFD0 ).hw()
			+ this.ldbw( addr + 0xFE0 ).hw() ).replace( / /g, '0' );
	} catch(e) {
		print( desc + ' <not readable>' );
		return;
	}
	desc += id.substr(7,1)+':'+id.substr(11,2)+"/"+id.substr(13,3);
	desc += ' r'+id.substr(10,1)+"+"+id.substr(8,1);
	if( id.substr(9,1) != '0' )
		desc += ' cm ' + id.substr(9,1);
	var size = 4 << parseInt( id.substr(6,1), 16 );
	if( size >= 1024 )
		desc += ' size '+(size>>>10)+'M';
	else
		desc += ' size '+size+'K';
	print( desc );
} );

add_method( MemoryView, "dcsrom", function( addr ) // dump CoreSight ROM table
{
	if( addr & 0xFFF )
		throw 'Address must be page-aligned';
	if( this.ldbw( addr + 0xFF0 ) != 0xb105100d )
		throw 'Not a CoreSight ROM table';
	var data = this.ldsw( addr, 0x100 );
	for( var i = 0; i < data.length; i++ ) {
		var x = data[i];
		if( x == 0 )
			continue;
		x += addr;
		var flags = x & 0xFFF;
		var desc = (x-flags).hw();
		if( !( flags & 2 ))
			throw '8-bit ROM table not supported';
		if( !( flags & 1 ))
			desc += '  -- not present';
		flags &= ~3;
		if( flags &= ~3 )
			desc += '  -- bogus flags: ' + flags.hex();
		print( desc );
	}
} );

function merge_options( target, source ) {
	var get = {
		"string": target.getString,
		"boolean": target.getBoolean,
		"numeric": target.getNumeric
	};
	var set = {
		"string": target.setString,
		"boolean": target.setBoolean,
		"numeric": target.setNumeric
	};
	for( var opt in source ) {
		var val = source[opt];
		var type = target.getValueType(opt);
		if( type == 'undefined' )
			continue;
		var curval = get[type].call( target, opt );
		if( val != curval )
			set[type].call( target, opt, val );
	}
}

var board = "XDS100v2";

function session( name, halt, options ) {
	var sess = ds.openSession( board, name );
	if( options )
		merge_options( sess.options, options );
	if( ! sess.target.isConnected() )
		sess.target.connect();
	if( halt == true ) {
		if( ! sess.target.isHalted() )
			sess.target.halt();
	} else if( halt == false ) {
		if( sess.target.isHalted() )
			sess.target.runAsynch();
	}
	return sess;
}

var options = {
	AutoRunToLabelOnRestart:	false,
	AutoRunToLabelName:		"",
};

function _connect( dsvar, mvar, name ) {
	var me = this;
	if( typeof( me[ dsvar ] ) == "undefined" )
		me[ dsvar ] = null;
	if( typeof( me[ mvar ] ) == "undefined" )
		me[ mvar ] = null;
	return function( halt ) {
		var ds = session( name, halt, options );
		me[ dsvar ] = ds;
		if( me[ mvar ] == null || me[ mvar ].memory != ds.memory ) {
			me[ mvar ] = new MemoryView( ds, 0 );
			print( "connected "+name+" -> ( "+dsvar+", "+mvar+" )");
		}
	};
}

function dreg()
{
	if( arguments.length == 0 )
		return;
	var obj = this;
	var args = [].slice.call( arguments, 0 );
	if( !( obj instanceof java.lang.Object )) {
		obj = arguments[0];
		if( obj instanceof java.lang.Object )
			args = [].slice.call( arguments, 1 );
		else
			obj = a8;
	}
	if( obj instanceof DebugSession )
		obj = obj.memory;
	if( !( obj instanceof Memory ))
		throw 'Expecting DebugSession or Memory object';
	var i;
	var len = args.length;
	for( i = 0; i < len; i++ ) {
		var reg = args[ i ];
		var val;
		try {
			val = obj.readRegister( reg );
		} catch(e) {
			val = '<err>';
		}
		print( reg, "=", hw( val ) );
	}
}
