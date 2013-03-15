/*
 * Herod, a child process killer / handler.
 * Copyright(c) 2013 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Herod = ( function () {
    // a class for handling/killing child processes
    var instance = null,
        events = require( 'events' ),
        spawn = require( 'child_process' ).spawn,
        // method to mix configuration properties
        mix = function ( dest, src ) {
            if ( ! src ) {
                // src is not an object
                return dest;
            }
            var keys = Object.keys( src ),
                i = keys.length,
                k;
            while ( i-- ) {
                k = keys[ i ];
                dest[ k ] = src[ k ];
            }
            return dest;
        },
        // Herod
        Herod = function () {
            var me = this || instance,
                exit = null;
            if ( ! ( me instanceof Herod ) ) {
                return new Herod();
            }
            if ( instance ) {
                return instance;
            }
            instance = me;
            exit = function ( signal ) {
                return function () {
                    me.log( '\nException Caught : "%s", main process "%s" pid: "%s" will be killed.', signal, process.title, process.pid );
                    process.exit();
                };
            };
            me.childrens = {};
            // number of alive children processes
            me.alive = 0;
            // debug flag
            me.debug = !false;

            process.on( 'SIGINT', exit( 'SIGINT' ) );
            process.on( 'exit', function ( code ) {
                me.log( '\n- info: exiting main process "%s", pid: "%s", code: "%s".', process.title, process.pid, code );
                var pid = null,
                    child = null,
                    code = null,
                    childrens = me.childrens;
                for ( pid in childrens ) {
                    child = childrens[ pid ];
                    if ( child ) {
                        code = child.process.kill( 'SIGKILL' );
                        me.log( '- info: "SIGKILL" process "%s", pid: "%s", returns: "%s".', child.name, pid, code );
                        delete childrens[ pid ];
                        --me.alive;
                    }
                }
            } );

            process.on( 'uncaughtException', function ( err ) {
                me.log( err.stack );
                me.log( '\nException Caught : "%s", main process "%s" pid: "%s" will be killed.', err.name, process.title, process.pid );
                process.exit();
            } );

        },
        pproto = Herod.prototype;

    pproto.log = function () {
        var me = this;
        if ( me.debug ) {
            console.log.apply( me, arguments );
        }
    };

    pproto.spawn = function ( cmd, args, options ) {
        var me = this;
        if ( ! cmd ) {
            me.log( '- warning: "Herod#spawn" - no command found as first argument!' );
            return undefined;
        }
        var opt = mix( {
                // see http://nodejs.org/api/child_process.html#child_process_event_message
                cwd : '/tmp',
                stdio : 'pipe'
                // stdio : 'inherit'
            }, options || {} ),
            // spawn child process
            child = spawn( cmd || null, args || [], opt ),
            pid = child.pid;

        me.log( '- info: spawned child process: "%s", pid: "%s"', cmd, pid );

        // set stream2 listeners
        child.stdout.on( 'readable', function () {
            if ( me.debug ) {
                var data = child.stdout.read();
                if ( data ) {
                    me.log( '- stdout "%s": %s', cmd, data );
                }
            }
        } );
        child.stderr.on( 'readable', function () {
            if( me.debug ) {
                var data = child.stderr.read();
                if ( data ) {
                    me.log( '- stderr "%s": %s', cmd, data );
                }
            }
        } );
        return me.enlist( child, cmd );
    };

    pproto.enlist = function ( child, cmd ) {
        var me = this,
            childrens = me.childrens,
            pid = null;
        if ( ! child ) {
            me.log( '- warning: "Herod#enlist" - no child argument found!' );
            return undefined;
        }
        if ( ! ( child instanceof events.EventEmitter ) ) {
            me.log( '- warning: "Herod#enlist" - child process should inherits from EventEmitter!' );
            return undefined;
        }
        pid = child.pid;
        me.childrens[ pid ] = {
            process : child,
            name : cmd
        };
        ++me.alive;
        me.log( '- info: enlisted child process: "%s", pid: "%s"', cmd, pid );
        child.on( 'exit', function ( code, signal ) {
            if ( code ) {
                me.log( '\n - error: exiting process: "%s", pid: "%s", code: "%s".', cmd, pid, code );
            }
            delete me.childrens[ pid ];
            --me.alive;
        } );
        return pid;
    };

    pproto.kill = function ( pid, signal ) {
        var me = this,
            child = null,
            sname = signal || 'SIGKILL',
            code = false;
        if ( ! pid ) {SIGINT
            me.log( ' - warning: "Herod#kill" - no child process id found as argument!' );
            return undefined;
        }
        child = me.childrens[ pid ];
        if ( child ) {
            code = child.process.kill( sname );
            delete me.childrens[ pid ];
            --me.alive;
            me.log( '- info: "%s" process "%s", pid: "%s", returns: "%s".', sname, child.name, pid, code );
        } else {
            me.log( '- warning: "Herod#kill" no child process found with this pid:"%s"', pid );
        }
        return code;
    };

    return Herod();

} )();