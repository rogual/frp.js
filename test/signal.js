var assert = require('assert');
var Event = require('../src/event');
var Signal = require('../src/signal');
var Pipe = require('../src/pipe');
var Cell = require('../src/cell');

suite('signal', function() {

  test('empty', function() {
    assert(Cell().empty);
    assert(!Cell({}).empty);
    assert(!Cell(null).empty);
    assert(!Cell(undefined).empty);
    assert(!Cell(0).empty);
    assert(!Cell('').empty);
  });

  test('initial', function() {
    var cell = Cell();
    var sig = cell.signal.initial(136);

    var values = [];
    sig.bind(values.push.bind(values));
    cell.set(1);
    cell.set(2);

    assert.deepEqual(values, [136, 1, 2]);
  });

  test('constant', function() {
    var sig = Signal.constant(42);
    assert.equal(sig.get(), 42);
  });

  test('event', function() {
    var ctrl = Pipe();
    var sig = Signal.event(42, ctrl.event);
    var values = [];
    sig.watch(values.push.bind(values));
    assert.deepEqual(values, []);
    ctrl.fire(42);
    assert.deepEqual(values, [42]);
  });

  test('watch', function() {
    var cell = Signal.cell(27);
    var sig = cell.signal;
    var values = [];
    sig.watch(values.push.bind(values));
    assert.deepEqual(values, []);
    cell.set(42);
    assert.deepEqual(values, [42]);
  });

  test('unwatch', function() {
    var cell = Signal.cell(42);
    var sig = cell.signal;
    var values = [];

    var cb = values.push.bind(values);
    sig.watch(cb);
    cell.set(43);
    sig.unwatch(cb);
    cell.set(44);
    assert.deepEqual(values, [43]);
  });

  test('concise unwatch', function() {
    var cell = Signal.cell(42);
    var sig = cell.signal;
    var values = [];

    var cb = values.push.bind(values);
    var unwatch = sig.watch(cb);
    cell.set(43);
    unwatch();
    cell.set(44);
    assert.deepEqual(values, [43]);
  });

  test('bind', function() {
    var sig = Signal.constant(42);
    var values = [];
    sig.bind(values.push.bind(values));
    assert.deepEqual(values, [42]);
  });

  test('unbind', function() {
    var cell = Signal.cell(42);
    var sig = cell.signal;
    var values = [];

    var cb = values.push.bind(values);
    sig.bind(cb);
    cell.set(43);
    sig.unbind(cb);
    cell.set(44);
    assert.deepEqual(values, [42, 43]);
  });

  test('concise unbind', function() {
    var cell = Signal.cell(42);
    var sig = cell.signal;
    var values = [];

    var cb = values.push.bind(values);
    var unbind = sig.bind(cb);
    cell.set(43);
    unbind();
    cell.set(44);
    assert.deepEqual(values, [42, 43]);
  });
  

  test('combine-object', function() {
    var a = Cell(1);
    var b = Cell();
    var ab = Signal.combine({a: a, b: b});

    assert.deepEqual(ab.value, {a: 1});
    a.value = 62;
    assert.deepEqual(ab.value, {a: 62});
    b.value = 'blah';
    assert.deepEqual(ab.value, {a: 62, b: 'blah'});
    a.value = null;
    assert.deepEqual(ab.value, {a: null, b: 'blah'});
  });

  test('combine-array', function() {
    var a = Cell(1);
    var b = Cell();
    var ab = Signal.combine([a, b]);

    assert.deepEqual(ab.value, [1]);
    a.value = 62;
    assert.deepEqual(ab.value, [62]);
    b.value = 'blah';
    assert.deepEqual(ab.value, [62, 'blah']);
    a.value = null;
    assert.deepEqual(ab.value, [null, 'blah']);
  });

  test('join-object', function() {
    var a = Cell(1);
    var b = Cell();
    var ab = Signal.join({a: a, b: b});

    assert(ab.empty);
    a.value = 62;
    assert(ab.empty);
    b.value = 'blah';
    assert.deepEqual(ab.value, {a: 62, b: 'blah'});
    a.value = null;
    assert.deepEqual(ab.value, {a: null, b: 'blah'});
  });

  test('join-array', function() {
    var a = Cell(1);
    var b = Cell();
    var ab = Signal.join([a, b]);

    assert(ab.empty);
    a.value = 62;
    assert(ab.empty);
    b.value = 'blah';
    assert.deepEqual(ab.value, [62, 'blah']);
    a.value = null;
    assert.deepEqual(ab.value, [null, 'blah']);
  });

  test('map', function() {

    var ctrl = Pipe();

    var sig = Signal.event(42, ctrl.event);
    var out = sig.map(function(x) { return x + 1; });

    assert.equal(out.get(), 43);
    ctrl.fire(66);
    assert.equal(out.get(), 67);

  });

  test('fold', function() {
    var ctrl = Pipe();
    var sig = Signal.event(1000, ctrl.event);

    var out = sig.fold(0, function(a, b) { return a + b; });

    assert.equal(out.get(), 1000);

    ctrl.fire(500);
    ctrl.fire(30);
    ctrl.fire(7);

    assert.equal(out.get(), 1537);
  });

  test('reduce', function() {
    var ctrl = Cell();
    var sig = ctrl.signal;

    var out = sig.reduce(function(a, b) { return a + b; });

    assert(out.empty);

    ctrl.set(500);
    assert(out.empty);

    ctrl.set(30);
    assert.equal(out.get(), 530);

    ctrl.set(7);
    assert.equal(out.get(), 537);
  });

  test('filter', function() {
    var cell = Signal.cell(47);
    var sig = cell.signal;

    var evens = sig.filter(function(x) { return x % 2 === 0; });

    assert.equal(evens.empty, true);
    cell.set(1);
    assert.equal(evens.empty, true);
    cell.set(2);
    assert.equal(evens.empty, false);
    assert.equal(evens.get(), 2);
    cell.set(3);
    assert.equal(evens.empty, false);
    assert.equal(evens.get(), 2);
    cell.set(4);
    assert.equal(evens.empty, false);
    assert.equal(evens.get(), 4);
  });

  test('unique', function() {
    var cell = Signal.cell();
    var u = cell.unique();

    var r = [];
    u.bind(r.push.bind(r));

    var s = [];
    cell.bind(s.push.bind(s));

    assert.deepEqual(r, []);
    cell.set(1);
    assert.deepEqual(r, [1]);
    cell.set(1);
    assert.deepEqual(r, [1]);
    cell.set(2);
    assert.deepEqual(r, [1, 2]);
    assert.deepEqual(s, [1, 1, 2]);
  });

  test('flatten', function() {
    var a = Signal.cell();
    var b = Signal.cell();
    var r = Signal.cell();

    var fr = r.flatten();

    var xs = [];
    fr.bind(xs.push.bind(xs));

    a.set(1);
    a.set(2);
    b.set(3);
    b.set(4);
    r.set(a);
    r.set(b);
    a.set(5);
    b.set(6);

    assert.deepEqual(xs, [2, 4, 6]);
  });

  test('flatMap', function() {
    var a = Signal.cell();
    var b = Signal.cell();

    var q = Signal.cell();

    var fn = function(x) {
      return {a: a, b: b}[x];
    };

    var xs = [];
    var r = q.flatMap(fn).bind(
      xs.push.bind(xs)
    );

    q.set('a');
    a.set(1);
    b.set(10);
    a.set(2);
    b.set(20);
    q.set('b');
    a.set(1);
    b.set(10);
    a.set(2);
    b.set(20);
    q.set('a');

    assert.deepEqual(xs, [
      1, 2, 20, 10, 20, 2
    ]);

  });

});
