/*
 * Herod, an heartless killer / handler for ( long-running ) child processes.
 * Copyright(c) 2013 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Herod = ( function () {
    // a class for handling/killing child processes
    var child_process = require( 'child_process' ),
        events = require( 'events' ),
        spawn = child_process.spawn,
        instance = null,
        daemon = false,
        // child process to execute after Herod daemonization
        execute = function ( path, argv, env, opt ) {
            return function () {
                // console.log( path, args );
                throw new Error()
                child_process.spawn( path, argv || [], opt || {

                } );
            };
        },
        pback = null,
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
        emsg = '\nException Caught : "%s", main process "%s" pid: "%s" will be killed.',
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
                me.lsignal = signal;
                me.log( emsg, me.lsignal, process.title, process.pid );
                process.exit();
            };
            me.childrens = {};
            // number of alive children processes
            me.alive = 0;
            // last received signal
            me.lsignal = null;
            // debug flag
            me.debug = !false;
            /*
             * kill all enlisted childrens, forwarding interrupt,
             * termination, quit and hup signals.
             */
            process.on( 'SIGINT', exit.bind( me, 'SIGINT' ) );
            process.on( 'SIGQUIT', exit.bind( me, 'SIGQUIT' ) );
            process.on( 'SIGHUP', exit.bind( me, 'SIGHUP' ) );
            process.on( 'SIGTERM', exit.bind( me, 'SIGTERM' ) );

            process.on( 'exit', function ( code ) {
                me.log( '\n- info: exiting main process "%s", pid: "%s", code: "%s".', process.title, process.pid, code );
                me.genocide();
            } );

            process.on( 'uncaughtException', function ( err ) {
                me.log( err.stack );
                me.log( emsg, err.name, process.title, process.pid );
                process.exit();
            } );

            if ( daemon ) {
                console.log( 'execute child process' );
                pback();
            }

        },
        pproto = Herod.prototype;

    pproto.log = function () {
        var me = this;
        if ( me.debug ) {
            console.log.apply( me, arguments );
        }
    };

    pproto.daemonize = function ( args, opt, pback ) {
        var me = this,
            child = null,
            ppath = process.execPath;

        if ( daemon ) {
            return process;
        }

        me.log( 'Herod main process pid: "%s", path: "%s"', process.pid, ppath );
        instance = null;
        daemon = true;
        pback = execute( process.execPath, process.argv, process.env );

        child = child_process.spawn( 'node', [ __filename ].concat( args || [] ), opt || {
            detached : true,
            // in, out, err
            stdio : [ 'ignore', 'ignore', 'ignore' ]
        } );

        child.unref();

        me.log( 'Herod child process pid: "%s", path: "%s"', child.pid, __filename );

        process.exit();

        return child;
    };

    pproto.suicide = function ( signal ) {
        var me = this;
        process.exit();
    };

    pproto.genocide = function ( signal ) {
        var me = this,
            pid = null,
            child = null,
            ok = false,
            childrens = me.childrens,
            ksignal = signal || 'SIGKILL';
 
        for ( pid in childrens ) {
            child = childrens[ pid ];
            if ( child ) {
                ok = child.process.kill( ksignal );
                me.log( '- info: "%s" process "%s", pid: "%s", returns: "%s".', ksignal, child.name, pid, ok );
                if ( ok ) {
                    delete childrens[ pid ];
                    --me.alive;
                }
            }
        }
        return me.alive;
    };

    pproto.spawn = function ( cmd, args, options ) {
        var me = this;
        if ( ! cmd ) {
            me.log( '- warning: "Herod#spawn" - no command found as first argument!' );
            return undefined;
        }
        // default options ( spawn a child process ).
        var opt = mix( {
                cwd : '/tmp',
                stdio : 'pipe',
                // detached : true, spawns a long-running child process ( daemon )
                detached : false
            }, options || {} ),
            // spawn child process
            child = spawn( cmd || null, args || [], opt ),
            pid = child.pid,
            cstdout = child.stdout,
            cstderr = child.stderr;

        me.log( '- info: spawned child process: "%s", pid: "%s"', cmd, pid );

        if ( cstdout ) {
            // set stream2 listeners
            cstdout.on( 'readable', function () {
                if ( me.debug ) {
                    var data = child.stdout.read();
                    if ( data ) {
                        me.log( '- stdout "%s": %s', cmd, data );
                    }
                }
            } );
        }
        if ( cstderr ) {
            cstderr.on( 'readable', function () {
                if( me.debug ) {
                    var data = child.stderr.read();
                    if ( data ) {
                        me.log( '- stderr "%s": %s', cmd, data );
                    }
                }
            } );
        }
        me.enlist( child, cmd, args, options );
        return child;
    };

    pproto.enlist = function ( child, cmd, args, options ) {
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
            name : cmd,
            args : args || [],
            opt : options || {}
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
        if ( ! pid ) {
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