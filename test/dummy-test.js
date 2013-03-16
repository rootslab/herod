#!/usr/bin/env node

var log = console.log,
    assert = require( 'assert' ),
    Herod = require( '../' ),
    pid = null;

Herod.debug = true;

// create a long-running child process ( daemon )
pid = Herod.spawn( 'ping', [ 'www.google.com' ], {
    detached : true,
    // in, out, err
    stdio : [ 'ignore', 'ignore', 'ignore' ]
} );

// process.kill( process.pid );
// process.kill( process.pid, 'SIGQUIT' );
// process.kill( process.pid, 'SIGTERM' );
// process.kill( process.pid, 'SIGHUP' );
process.exit();
