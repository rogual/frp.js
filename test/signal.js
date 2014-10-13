var assert = require('assert');
var Event = require('../src/event');
var Signal = require('../src/signal');
var Pipe = require('../src/pipe');
var Cell = require('../src/cell');

suite('signal', function() {

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

  test('bind', function() {
    var sig = Signal.constant(42);
    var values = [];
    sig.bind(values.push.bind(values));
    assert.deepEqual(values, [42]);
  });

  test('combine', function() {
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

  test('map', function() {

    var ctrl = Pipe();

    var sig = Signal.event(42, ctrl.event);
    var out = sig.map(function(x) { return x + 1; });

    assert.equal(out.get(), 43);
    ctrl.fire(66);
    assert.equal(out.get(), 67);

  });

  test('reduce', function() {
    var ctrl = Pipe();
    var sig = Signal.event(1000, ctrl.event);

    var out = sig.reduce(0, function(a, b) { return a + b; });

    assert.equal(out.get(), 1000);

    ctrl.fire(500);
    ctrl.fire(30);
    ctrl.fire(7);

    assert.equal(out.get(), 1537);
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

});
