###Herod.
[![build status](https://travis-ci.org/rootslab/herod.png?branch=master)](https://travis-ci.org/rootslab/herod) [![NPM version](https://badge.fury.io/js/herod.png)](http://badge.fury.io/js/herod)
> Herod, an heartless killer / handler for ( long-running ) child processes.
> When the main process dies, it kills all registered ( long-running ) child process.

###Install

```bash
$ npm install herod [-g]
```

> __require__ and get an instance of Herod __singleton__:

```javascript
var Herod  = require( 'herod' );
```

###Run Tests

```bash
$ cd herod/
$ npm test
```
###Properties

```javascript

/*
 * Hash of alive child processes:
 * {
 *  'pid123': {
 *      name: 'cmd,
 *      process : .. 
 *   },
 *   ...
 * }
 * 
 */
Herod.childrens : Object

/*
 * Number of alive handled childrens.
 * ( it holds the cardinality of Herod.childrens object )
 */
Herod.alive : Number

/*
 * Enable console logging for Herod notice messages,
 * it defaults to false.
 */
Herod.debug : Boolean

// last received signal, like 'SIGINT', 'SIGTERM', ..
Herod.lsignal : String
```

###Methods

> Arguments within [ ] are optional.

```javascript
/*
 * Create a child process through ChildProcess#spawn, then automatically
 * enlist / register it to Herod.
 * 
 * It returns the child process or undefined if no child was added.
 * ( a ChildProcess is an instance of EventEmitter ).
 * 
 * - cargs defaults to : [].
 * - copt defaults to : {
 *      cwd : '/tmp',
 *      stdio : 'pipe',
 *      detached : false
 *   }
 *
 * Note : { detached : true } to create a long-running child process.
 */
Herod#spawn( String cmd [, Array cargs [, Object copt ] ] ) : EventEmitter

/*
 * Adding a child process to handle.
 * It returns the child pid or undefined, if no child was added 
 */
Herod#enlist( EventEmitter child [, String name [, Array args [, Object copt ] ] ] ) : String

/*
 * Kill a child process through its pid.
 * The signal defaults to 'SIGKILL'.
 */
Herod#kill( Number pid, [ String signal [, Function cback ] ] ) : Boolean

/*
 * Kill all child processes sending them the same signal.
 * The signal defaults to 'SIGKILL'.
 * It returns the number of alive processes.
 */
Herod#genocide( [ String signal [, Function cback  ] ) : undefined

/*
 * Specify a signal to send for killing all enlisted child processes
 * and the main process itself.
 * 'cback' will called on main process 'exit' event.
 */
Herod#suicide( [ String signal [, Function cback ] ] ) : undefined

/*
 * Spawn a daemon process for current script, exiting the main parent process.
 * It reloads / spawn the script in which Herod#daemonize is called, as a 
 * long-running child process.
 *
 * default options are:
 * {
 *    stdin : 'ignore',
 *    stdout : 'ignore',
 *    stderr : 'ignore',
 *    env : process.env
 * }
 * for debugging, use process.stdin and process.stdout streams.
 */
Herod#daemonize( [ Object options ] ) : undefined

```

### MIT License

> Copyright (c) 2012 &lt; Guglielmo Ferri : 44gatti@gmail.com &gt;

> Permission is hereby granted, free of charge, to any person obtaining
> a copy of this software and associated documentation files (the
> 'Software'), to deal in the Software without restriction, including
> without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to
> permit persons to whom the Software is furnished to do so, subject to
> the following conditions:

> __The above copyright notice and this permission notice shall be
> included in all copies or substantial portions of the Software.__

> THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
> IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
> CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
> TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
> SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
