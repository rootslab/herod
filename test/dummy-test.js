#!/usr/bin/env node

var log = console.log,
    assert = require( 'assert' ),
    Herod = require( '../' ),
    pid = null,
    child = null;

Herod.debug = true;

// singleton instance
assert.equal( require( '../' ), Herod );
assert.equal( typeof Herod, 'object' );

// create a long-running child process ( daemon )
child = Herod.spawn( 'ping', [ 'www.google.com' ], {
    detached : true,
    // in, out, err
    stdio : [ 'ignore', 'ignore', 'ignore' ]
} );
// prevent that the parent waits for child exit
child.unref();
pid = child.pid;

assert.equal( Herod.childrens[ pid ].process, child );
process.kill( process.pid );
// process.kill( process.pid, 'SIGQUIT' );
// process.kill( process.pid, 'SIGTERM' );
// process.kill( process.pid, 'SIGHUP' );
process.exit();
