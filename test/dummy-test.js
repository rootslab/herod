#!/usr/bin/env node

var log = console.log,
    assert = require( 'assert' ),
    Herod = require( '../' ),
    pid = null;

Herod.debug = true;

// log( '- Herod spawn a "ping" process.' );
// pid = Herod.spawn( 'ping', [ '-c 1000', 'www.google.com' ] );
// log( '- process "ping" pid is: "%s".', pid );
// log( '- number of alive childrens: %s.', Herod.alive );
// log( '- now killing main process.' );
// process.kill( 'SIGINT' );
// process.kill( process.pid );
// process.exit()