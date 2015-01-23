# frp.js 0.3

This is a library providing functional reactive programming (FRP) primitives and
operations.


# Installation

    npm install frp


# Conventions

Where appropriate, functions are provided both as module-level functions and as
methods on the FRP objects themselves.

Wherever it makes sense, functions accepting callbacks will also accept
lodash-style callback specifiers instead of functions.


# Concepts

## Event

    require('frp/event')
    require('frp').event

An event is something that can be watched for a value:

    event.watch(cb)
    event.bind(cb)

    event.unwatch(cb)
    event.unbind(cb)

The two forms are equivalent.

The given callback may be called any number of times in the future, with one
argument (the “value”) each time. This is referred to as the event “firing” that
value.

The `watch` and `bind` functions return a function which can be used instead of
the `unwatch` or `unbind` functions.


### Constructing Events

#### `frp.event.pipe()`

This returns a Pipe, which is an event that has an extra function `fire(value)`
which causes it to fire a value. It also has a property `event` which refers to
a copy of itself without the fire function.

A useful pattern is to create a pipe, keep a reference to it, and return
pipe.event to your caller so that other code can listen to the event, but not
cause it to fire.


### Combining Events

#### `frp.event.combine(eventsArray)`

Returns a new event which, whenever any of the given events fires a value, fires
that value.


### Constant Events

#### `frp.event.identity`

This is an event which never fires and as such is the identity with respect to
`Event.combine`.


### Functions on Event

<h4><pre>
map(event, fn)
event.map(fn)
</pre></h4>

Returns a new event which, when the original event fires a value, fires
`fn(value)`.


<h4><pre>
fold(event, initial, fn)
event.fold(initial, fn)
</pre></h4>

Returns a new event which keeps an internal value, initialized to the given
initial value. When the given event fires a value `x`, the returned event will
update its internal value to `fn(oldInternal, x)` and fire that value.


<h4><pre>
reduce(event, fn)
event.reduce(fn)
</pre></h4>

Waits for the event to fire a value `x`, then behaves as `event.fold(x, fn)`.


<h4><pre>
ref(event)
event.ref()
</pre></h4>

Returns a new event which behaves identically to the given event, but which also
has a `release` function. When called, this breaks the link between the original
event and the returned event.


<h4><pre>
sum(event)
event.sum()
</pre></h4>

Equivalent to `event.fold(0, add)`


<h4><pre>
product(event)
event.product()
</pre></h4>

Equivalent to `event.fold(1, multiply)`


## Signal

    require('frp/signal')
    require('frp').signal

A signal represents a changing value. It is like an event except that it has
a current value:

    signal.value
    signal.get()

Signals can also be empty, in which case `signal.empty` will be true and
`signal.value` and `signal.get()` will be undefined.

Signals can be watched, just like events:

    signal.watch(cb)
    signal.unwatch(cb)

There is also a similar function, `bind`:

    signal.bind(cb)
    signal.unbind(cb)

In this case, `cb(value)` will be called whenever the signal’s value changes
just like with `watch().` Additionally, though, `cb(value)` will be called once
as soon as `bind()` is called, with the signal’s current value.


### Constructing Signals

#### `frp.signal.constant(value)`

Returns a signal whose value is always the same.


#### `frp.signal.event(event)`

Returns an empty signal whose value is updated with any value fired by the given
event.


#### `frp.signal.event(initial, event)`

Returns a signal with the given initial value, but whose value is updated with
any value fired by the given event.


#### `frp.signal.cell()`

Returns a `Cell` object, which is to a signal what a pipe is to an event; that
is, an object like a signal but which can be written to.

Write to a cell using either its `set()` method or its `value` property.

Use `cell.signal` to get an ordinary read-only signal from the cell.


### Combining Signals

#### `frp.signal.combine(signals)`

Accepts either an array of signals or an object mapping names to signals.

If given an object, returns a signal whose value is an object mapping names to the values of the
named signals in the argument object. If any of the named signals are empty, their names will
not be present in the returned signal’s value.

If given an array, returns a signal whose value is an array whose elements are
the values of the corresponding signals in the given array. If any of the given
signals are empty, the corresponding items in the value array will be left unset.


#### `frp.signal.join(signals)`

Accepts either an array of signals or an object mapping names to signals.

Behaves as `Signal.combine`, except `join` waits for all given signals to have
values before starting to emit values.


### Functions on Signal

Signals support all the functions that events do. See the unit tests for details
on how these differ from their counterparts on event.

Signals also offer the following functions:


<h4><pre>
initial(signal, value)
signal.initial(value)
</pre></h4>

If the given signal has a value, returns the given signal. Otherwise, returns
a signal which has the given value, and which starts to track the given signal’s
value as soon as it has one.


<h4><pre>
flatten(signal)
signal.flatten()
</pre></h4>

The argument should be a signal whose value is always another signal.

Returns a new signal whose value is always the value of the signal that is the
value of the given signal.

If the given signal ever takes on a value which is not a signal, undefined
behaviour ensues.


<h4><pre>
flatMap(signal, fn)
signal.flatMap(fn)
</pre></h4>

Equivalent to `signal.map(fn).flatten()`


# Lifetime Management

When using transformative functions like `map` or `filter` to create new events
and signals out of old ones, the old (“parent”) event or signal will retain
a reference to the new (“child”) signal for as long as it lives, unless it is
specifically unbound.

This means that **child objects will live at least as long as their parents!**

So, if you have a long-lived object and you keep calling `map` on it, its
internal list of watchers will keep growing ever longer, even after you’ve
stopped using the new objects that `map` has created.

This may not be what you want, which is where the `ref` function comes in:

<h4><pre>
signal.ref()
event.ref()
ref(signal)
ref(event)
</pre></h4>

Calling `ref` on a signal or event creates an object that behaves identically
to the object you called `ref` on, except that the new object will have a
`release` method. Calling this will cause it to become disconnected from its
parent, no longer mirroring its updates.

This allows you to manage the lifetime of connected chains of events and
signals. For example:

    var a = getSuperLongLivedEvent();

    var a0 = a.ref();
    a0.map(blah).filter(bling).watch(function(x) {
        ...
    });

    // done with a0
    a0.release();

    var a1 = a.ref();
    a1.map(bloo).filter(blarp).watch(function(y) {
        ...
    });

    // done with a1
    a1.release();

In this example, the intermediary events created by the calls to `map` and
`filter` would normally stick around forever, bloating `a`’s list of watchers.
But, since `a0` and `a1` are created using `a.ref`, calling `release` causes
them to disconnect from `a` and become unreachable. `a`’s list of watchers will
be empty again after both `a0` and `a1` are released, and `a0` and `a1` can
be garbage-collected.


# Error Handling

This library does not take a stance on error handling. Events and Signals
concern themselves only with values, and the question of which values are
considered ‘errors’ is left up to you and your application.

Exceptions are not afforded any particular special handling; exceptions
thrown by your code are not caught by `frp.js` and so will propagate up
the stack as normal.

In general, this means that if an exception is thrown in the transformation
function given to `map` or `filter` or similar, this will propagate up
to where you called `set` or `fire`, and the transformed event or signal
(the return value of `map` or similar) will not fire a value.
