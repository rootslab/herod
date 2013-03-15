/*
 * Herod, a child process killer / handler.
 * Copyright(c) 2011 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Herod = ( function () {
    // a class for handling/killing child processes
    var instance = null,
        debug = !!false,
        log = ( debug ) ? console.log : function (){},
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
            var me = this || instance;
            if ( ! ( me instanceof Herod ) ) {
                return new Herod();
            }
            if ( instance ) {
                return instance;
            }
            log( '\n- info: running main process "%s", pid: "%s"', process.title, process.pid );
            instance = me;

            me.childrens = [];
            // number of alive children processes
            me.alive = 0;
            // debug flag
            me.debug = debug;

            process.on( 'SIGINT', function () {
                log( '\nException Caught : "SIGINT", main process "%s" pid: "%s" will be killed.', process.title, process.pid );
                process.exit();
            } );

            process.on( 'exit', function ( code ) {
                log( '\n- info: exiting main process "%s", pid: "%s", code: "%s".', process.title, process.pid, code );
                var pid = null,
                    child = null,
                    code = null,
                    childrens = me.childrens;
                for ( pid in childrens ) {
                    child = childrens[ pid ];
                    if ( child ) {
                        code = child.process.kill( 'SIGKILL' );
                        log( '- info: "SIGKILL" process "%s", pid: "%s", returns: "%s".', child.title, pid, code );
                        delete childrens[ pid ];
                        --me.alive;
                    }
                }
            } );

            process.on( 'uncaughtException', function ( err ) {
                log( err.stack );
                log( '\nException Caught : "%s", main process "%s" pid: "%s" will be killed.', err.name, process.title, process.pid );
                process.exit();
            } );

        },
        pproto = Herod.prototype;

    pproto.spawn = function ( cmd, args, options ) {
        var me = this;
        if ( ! cmd ) {
            log( '- warning: "Herod#spawn" - no command found as first argument!' );
        }
        var opt = mix( {
                // see http://nodejs.org/api/child_process.html#child_process_event_message
                cwd : '/tmp',
                stdio : 'pipe' // 'inherit'
            }, options || {} ),
            // spawn child process
            child = spawn( cmd || null, args || [], opt ),
            pid = child.pid;
        log( '- info: spawned child process: "%s", pid: "%s"', cmd, pid );
        // set stream2 listeners
        child.stdout.on( 'readable', function () {
            if( me.debug ) {
                var data = child.stdout.read();
                // log( 'stdout: ' + data );
            }
        } );
        child.stderr.on( 'readable', function () {
            if( me.debug ) {
                var data = child.stderr.read();
                // log( 'stderr: ' + data );
            }
        } );
        return me.list( child, cmd );
    };

    pproto.list = function ( child, cmd ) {
        var me = this,
            childrens = me.childrens,
            pid = null;
        if ( ! child ) {
            log( '- warning: "Herod#list" - no child argument found!' );
            return undefined;
        }
        pid = child.pid;
        me.childrens[ pid ] = {
            process : child,
            title : cmd
        };
        ++me.alive;
        log( '- info: listed child process: "%s", pid: "%s"', cmd, pid );
        child.on( 'exit', function ( code, signal ) {
            if ( code ) {exiting
                log( '\n - error: exiting process: "%s", pid: "%s", code: "%s".', cmd, pid, code );
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
        if ( ! pid ) {
            log( ' - warning: "Herod#kill" - no child process id found as argument!' );
            return undefined;
        }
        child = me.childrens[ pid ];
        if ( child ) {
            code = child.process.kill( sname );
            delete me.childrens[ pid ];
            --me.alive;
            log( '- info: "%s" process "%s", pid: "%s", returns: "%s".', sname, child.title, pid, code );
        } else {
            log( '- warning: "Herod#kill" no child process found with this pid:"%s"', pid );
        }
        return code;
    };

    return Herod;

} )();