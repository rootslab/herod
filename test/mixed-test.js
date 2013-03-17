#!/usr/bin/env node

var log = console.log,
    assert = require( 'assert' ),
    http = require( 'http' ),
    Herod = require( '../' ),
    port = 9000,
    pid = null,
    pid2 = null,
    child = null,
    child2 = null,
    childrens = Herod.childrens,
    wtime = 4000;

Herod.debug = true;

// singleton instance
assert.equal( require( '../' ), Herod );
assert.equal( typeof Herod, 'object' );

Herod.daemonize( { stdout : process.stdout, stderr : process.stderr } );

// create a long-running child process ( daemon )
child = Herod.spawn( 'ping', [ 'google.com' ], {
    detached : true,
    // in, out, err
    stdio : [ 'ignore', 'ignore', 'ignore' ]
} );

child2 = Herod.spawn( 'ping', [ 'redis.io' ], {
    detached : true,
    // in, out, err
    stdio : [ 'ignore', 'ignore', 'ignore' ]
} );
// prevent that the parent waits for child exit
child.unref();
child2.unref();

pid = child.pid;
pid2 = child2.pid;
assert.equal( childrens[ pid ].process, child );
assert.equal( childrens[ pid2 ].process, child2 );

// start a dummy http server
http.createServer( function ( req, res ) {
    req.on( 'readable', function () {
        var data = req.read();
        log( 'request data: %s', data );
        res.end( 'bye!\r\n' );
    } );
} ).listen( port );

log( '- process pid: "%s" listening on port %s', process.pid, port );

log( '- wait %s secs for child processes genocide..', ( wtime / 1000 ).toFixed( 1 ) );

setTimeout( function () {
    // process.kill( process.pid );
    // process.kill( process.pid, 'SIGQUIT' );
    // process.kill( process.pid, 'SIGTERM' );
    // process.kill( process.pid, 'SIGHUP' );
    // process.exit();
    // Herod.genocide();
    Herod.suicide();
}, wtime );
