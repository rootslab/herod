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
    wtime = 2000,
    fproc = null;

Herod.debug = true;

// singleton instance
assert.equal( require( '../' ), Herod );
assert.equal( typeof Herod, 'object' );

// daemonize
log( '\n\n** daemonize main process **' );
fproc = Herod.daemonize( { stdout : process.stdout, stderr : process.stderr } );
assert.equal( fproc, process );

/*
 * Create a long-running child process ( daemon ), Herod prevents that
 * the parent waits for child exit, auto-calling child.unref().
 */
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

log( '\n** process pid: "%s" listening on port %s. **', process.pid, port );
log( '** wait %s secs before calling suicide() **', ( wtime / 1000 ).toFixed( 1 ) );

setTimeout( function () {
    log( '** now call suicide (it implies childrens genocide) **\n' );
    // process.kill( process.pid );
    // process.kill( process.pid, 'SIGQUIT' );
    // process.kill( process.pid, 'SIGTERM' );
    // process.kill( process.pid, 'SIGHUP' );
    // process.exit();
    // process.kill( pid, 'SIGKILL' );
    // Herod.kill( pid );
    // Herod.kill( pid2 );
    // Herod.genocide( null, function () { log( '\n** That\'s all! **\n' ) } );
    // Herod.kill( pid2, null, function () { log( '\n** I\'m a cback! **\n' ) } );
    Herod.suicide( 'SIGTERM' );
}, wtime );
