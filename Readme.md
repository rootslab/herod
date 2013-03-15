###Herod.
[![build status](https://travis-ci.org/rootslab/herod.png?branch=master)](https://travis-ci.org/rootslab/herod)
> Herod, a child process killer / handler. Simply, when the main node-process dies,
it kills all its currently added child processes.

###Install

```bash
$ npm install herod [-g]
```

> __require__ and get an instance of Herod singleton:

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
// number of alive handled childrens
Herod.alive : Number
// hash of child processes
Herod.childrens : Object
// enable console logging, defaults to false
Herod.debug : Boolean
```

###Methods

```javascript
// Create and enlist a child process through child_process#spawn .
Herod#spawn( String cmd, Array args, Object opt ) : Number

// Adding a child process to handle.
Herod#enlist( ChildProcess child, String name ) : Number

// Kill a child process through its pid.
Herod#kill( Number pid, String signal ) : Boolean

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
