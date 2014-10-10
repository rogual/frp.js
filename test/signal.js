var assert = require('assert');
var Event = require('../src/event');
var Signal = require('../src/signal');
var Pipe = require('../src/pipe');

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
    var cell = Signal.cell();
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

    var out = sig.reduce(function(a, b) { return a + b; });

    assert.equal(out.get(), 1000);

    ctrl.fire(500);
    ctrl.fire(30);
    ctrl.fire(7);

    assert.equal(out.get(), 1537);
  });
});
