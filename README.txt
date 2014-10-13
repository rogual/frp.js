About

    frp.js 0.1

    This is a library providing functional reactive programming
    (FRP) primitives.

    Where appropriate, functions are provided both as module-level
    functions and as methods on the FRP objects themselves.


Installation

    npm install frp


Concepts

                    read   r+w
        stateless | Event  Pipe
        stateful  | Signal Cell

    Event

        require('frp/event');
        require('frp').event;

        An event is something that can be watched for a value:

            event.watch(cb);

        The given callback may be called any number of times in the
        future, with one argument (the "value") each time. This is
        referred to as the event "firing" that value.

        Events can be constructed thus:

            Event.pipe()

                This returns a Pipe, which is like an event except it
                has a function fire(value) which causes it to fire a
                value. It also has a property 'event' which refers
                to a copy of itself without the fire function.

                A useful pattern is to create a pipe, keep a reference
                to it, and return pipe.event to your caller so that
                other code can listen to the event, but not cause it
                to fire.

            Event.dom(element, eventName)

                Return an event that listens for the specified DOM
                event and fires the DOM Event object.

        Events can be combined:

            Event.combine(eventsArray)

                Returns a new event which, whenever any of the given
                events fires a value, fires that value.

        The following constant events exist:

            Event.identity
                This is an event which never fires and as such is the
                identity with respect to Event.combine.

        Functions on Event:

            map(event, fn)
            event.map(fn)

                Returns a new event which, when the original event
                fires a value, fires fn(value).

            reduce(event, initial, fn)
            event.reduce(initial, fn)

                Returns a new event which keeps an internal value,
                initialized to the given initial value. When the given
                event fires a value x, the returned event will update
                its internal value to fn(oldInternal, x) and fire that
                value.

            flatMap(event, fn)
            event.flatMap(fn)

                Returns a new event which, when the original event fires
                a value, calls fn(value), interprets the result as an
                event, and when that event fires a value, fires the
                value.


    Signal ⊃ Event

        require('frp/signal');
        require('frp').signal;

        A signal is a changing value. It is like an event except that it has
        a current value:

            signal.get()

        Signals can be watched, just like events:

            signal.watch(cb)

        There is also a similar function, bind:

            signal.bind(cb)

        In this case, cb(value) will be called whenever the signal's value
        changes just like with watch(). Additionally, though, cb(value) will
        be called once as soon as bind() is called, with the signal's
        current value.

        Signals can be constructed thus:

            Signal.constant(value)

                Returns a signal whose value is always the same.

            Signal.event(initial, event);

                Returns a signal with the given initial value, but whose
                value is updated with any value fired by the given event.

            Signal.cell()

                Returns a Cell object, which is to Signal what Pipe is
                to Event; that is, an object like a Signal but with a
                set() method that causes the signal to change its value.
                Use cell.signal to get an ordinary read-only Signal from
                the Cell.

        Signals can be converted to events:

            signal.event

        All of the event methods have analogues on Signal.
