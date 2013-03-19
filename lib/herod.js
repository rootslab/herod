/*
 * Herod, an heartless killer / handler for ( long-running ) child processes.
 * Copyright(c) 2013 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Herod = ( function () {
    // a class for handling/killing child processes
    var instance = null,
        child_process = require( 'child_process' ),
        events = require( 'events' ),
        util = require( 'util' ),
        spawn = child_process.spawn,
        // method to mix configuration properties
        mix = function ( dest, src ) {
            if ( ! src ) {
                // src is not an object
                return dest;
            }
            var keys = Object.keys( src ),
                i = keys.length,
                k = null;
            while ( i-- ) {
                k = keys[ i ];
                dest[ k ] = src[ k ];
            }
            return dest;
        },
        emptyFn = function () {},
        emsg = '- info: "%s" signal caught, main process "%s" pid: "%s" will be killed.',
        // Herod
        Herod = function () {
            var me = this || instance,
                exit = null,
                bye = null,
                ksignal = null;
            if ( ! ( me instanceof Herod ) ) {
                return new Herod();
            }
            if ( instance ) {
                return instance;
            }
            instance = me;
            bye = function () {
                me.log( '- info: "%s" main process "%s", pid: "%s"', 'EXIT', process.title, process.pid );
                process.exit();
            };
            exit = function ( signal ) {
                me.log( emsg, signal, process.title, process.pid );
                // save last signal received
                me.lsignal = ksignal = signal;
                if ( me.alive ) {
                    // kill all childrens
                    me.genocide( signal, bye );
                } else {
                    bye();
                }
            };
            // child process hash
            me.childrens = {};
            // number of alive child processes
            me.alive = 0;
            // debug flag
            me.debug = !!false;
            // last received signal
            me.lsignal = null;
            /*
             * kill all enlisted childrens, forwarding interrupt,
             * termination, quit, hup signals.
             */
            process.on( 'SIGINT', exit.bind( me, 'SIGINT' ) );
            process.on( 'SIGQUIT', exit.bind( me, 'SIGQUIT' ) );
            process.on( 'SIGHUP', exit.bind( me, 'SIGHUP' ) );
            process.on( 'SIGTERM', exit.bind( me, 'SIGTERM' ) );
            // note: listening for 'SIGKILL' causes 'EINVAL'

            process.on( 'exit', function ( code ) {
                me.log( '- info: exiting from main process "%s", pid: "%s", signal: "%s", code: "%s".', process.title, process.pid, ksignal || "EXIT", code );
                if ( me.alive ) {
                    /*
                     * when process.exit was called directly,
                     * try to kill all alive and enlisted child processes.
                     */
                    me.genocide( me.lsignal );
                }
            } );

            process.on( 'uncaughtException', function ( err ) {
                me.log( emsg, err.name, process.title, process.pid );
                me.log( util.inspect( err, !true, 0, true ) );
                if ( me.alive ) {
                    me.genocide( ksignal, bye );
                }
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
            opt : options || {},
            kback : emptyFn
        };
        ++me.alive;
        me.log( '- info: enlisted child process: "%s", pid: "%s"', cmd, pid );
        
        child.on( 'exit', function ( code, signal ) {
            if ( code ) {
                me.log( '\n - error: exiting child process: "%s", pid: "%s", signal: "%s" code: "%s".', cmd, pid, signal || me.lsignal, code );
                return;
            }
            me.log( '- info: exiting child process: "%s", pid: "%s", signal: "%s".', cmd, pid, signal || me.lsignal );

            var cback = me.childrens[ pid ].kback;

            delete me.childrens[ pid ];
            --me.alive;
            cback();

            if ( me.alive === 0 ) {
                me.log( '- info: killing job was completed, no child process is alive!' );
                me.gkback();
                me.gkback = emptyFn;
            }
        } );
        return pid;
    };

    pproto.kill = function ( pid, signal, callback ) {
        var me = this,
            child = null,
            sname = signal || 'SIGKILL',
            code = false,
            cback = ( typeof callback === 'function' ) ? callback : emptyFn;
        if ( ! pid ) {
            me.log( ' - warning: "Herod#kill" - no child process id found as argument!' );
            return undefined;
        }
        child = me.childrens[ pid ];
        child.kback = cback;
        if ( child ) {
            code = child.process.kill( sname );
            me.log( '- info: "%s" child process "%s", pid: "%s", returns: "%s".', sname, child.name, pid, code );
        } else {
            me.log( '- warning: "Herod#kill" no child process found with this pid:"%s"', pid );
        }
        return code;
    };

    pproto.suicide = function ( signal, callback ) {
        var me = this,
            bye = function () {
                me.log( '- info: "%s" main process "%s", pid: "%s"', 'EXIT', process.title, process.pid );
                process.exit();
            };

        if ( signal ) {
            me.lsignal = signal;
        }
        if ( me.alive ) {
            me.genocide( me.lsignal, bye );
        } else {
           bye();
        }
    };

    pproto.genocide = function ( signal, callback ) {
        var me = this,
            pid = null,
            child = null,
            ok = false,
            childrens = me.childrens,
            ksignal = signal || 'SIGKILL',
            cback = ( typeof callback === 'function' ) ? callback : emptyFn;

        // set global cback
        me.gkback = cback;

        for ( pid in childrens ) {
            child = childrens[ pid ];
            if ( child ) {
                ok = child.process.kill( ksignal );
                me.log( '- info: "%s" child process "%s", pid: "%s", returns: "%s".', ksignal, child.name, pid, ok );
            }
        }
    };

    pproto.daemonize = function ( options ) {
        var me = this;
        me.log( '\n- info: current main process pid: "%s"', process.pid );
        if ( process.env.__daemon ) {
            return process;
        }
        var argv = process.argv || [],
            opt = mix( {
                stdin : 'ignore',
                stdout : 'ignore',
                stderr : 'ignore',
                env : process.env
            }, options || {} ),
            // child process options
            copt = {
                stdio : [ opt.stdin, opt.stdout, opt.stderr ],
                env : mix( opt.env, { __daemon : true } ),
                detached : true
            },
            ppath = process.execPath,
            child = spawn( ppath, argv.slice( 1 ), copt );

        child.unref();
        me.log( '- info: spawned child process pid:"%s"', child.pid );
        me.log( '- info: "%s" main process "%s", pid: "%s"', me.lsignal || 'EXIT', process.title, process.pid );
        process.exit();
        return child;
    };

    return Herod();

} )();