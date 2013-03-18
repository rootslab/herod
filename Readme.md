###Herod.
[![build status](https://travis-ci.org/rootslab/herod.png?branch=master)](https://travis-ci.org/rootslab/herod)
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
Herod#kill( Number pid, [ String signal ] ) : Boolean

/*
 * Kill all child processes sending them the same signal.
 * The signal defaults to 'SIGKILL'.
 * It returns the number of alive processes.
 */
Herod#genocide( [ String signal [, Function cback  ] ) : undefined

/*
 * Exit from main process, or specify a signal to send.
 */
Herod#suicide( [ String signal ] ) : null

/*
 * Spawn a daemon process for current script, killing the main parent process.
 *
 * default options are:
 * {
 *    stdin : 'ignore',
 *    stdout : 'ignore',
 *    stderr : 'ignore',
 *    env : process.env
 * }
 */
Herod#daemonize( [ Object options ] ) : null

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
