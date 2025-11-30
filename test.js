'use strict';

const assert = require('assert');
const Pm2RepReq = require('./index');

// Test counter
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${name}`);
    console.error(`  Error: ${err.message}`);
    failed++;
  }
}

console.log('Running tests for pm2-rep-req...\n');

// Test 1: Class exists and is a constructor
test('Pm2RepReq is a constructor', () => {
  assert.strictEqual(typeof Pm2RepReq, 'function');
});

// Test 2: Create master instance with required options
test('Creates master instance with correct properties', () => {
  const options = {
    verbose: false,
    worker: false,
    port: 60001,
    cb: () => {},
    name: 'test-app',
    script: __filename,
    instances: 2,
    args: '--worker',
    deleteOnComplete: true,
    onIdle: () => true,
  };

  const master = new Pm2RepReq(options);

  assert.strictEqual(master.verbose, false);
  assert.strictEqual(master.worker, false);
  assert.strictEqual(master.port, 60001);
  assert.strictEqual(master.name, 'test-app');
  assert.strictEqual(master.script, __filename);
  assert.strictEqual(master.instances, 2);
  assert.strictEqual(master.deleteOnComplete, true);
  assert.strictEqual(typeof master.cb, 'function');
  assert.strictEqual(typeof master.onIdle, 'function');
  assert.ok(master.sock, 'Socket should be created');

  // Clean up socket
  master.sock.close();
});

// Test 3: Master options object is constructed correctly
test('Master options object is constructed correctly', () => {
  const options = {
    verbose: true,
    worker: false,
    port: 60002,
    cb: () => {},
    name: 'test-cluster',
    script: './worker.js',
    instances: 4,
    args: '--worker --debug',
    options: {
      max_memory_restart: '100M',
    },
  };

  const master = new Pm2RepReq(options);

  assert.strictEqual(master.options.name, 'test-cluster');
  assert.strictEqual(master.options.script, './worker.js');
  assert.strictEqual(master.options.exec_mode, 'cluster');
  assert.strictEqual(master.options.instances, 4);
  assert.strictEqual(master.options.args, '--worker --debug');
  assert.strictEqual(master.options.max_memory_restart, '100M');

  // Clean up socket
  master.sock.close();
});

// Test 4: Test with beforeStart callback option
test('Accepts beforeStart callback option', () => {
  let beforeStartCalled = false;
  const options = {
    verbose: false,
    worker: false,
    port: 60003,
    cb: () => {},
    name: 'test-before-start',
    script: __filename,
    instances: 1,
    beforeStart: async () => {
      beforeStartCalled = true;
    },
  };

  const master = new Pm2RepReq(options);

  assert.strictEqual(typeof master.beforeStart, 'function');

  // Clean up socket
  master.sock.close();
});

// Test 5: Test verbose flag
test('Verbose flag is stored correctly', () => {
  const verboseOptions = {
    verbose: true,
    worker: false,
    port: 60004,
    cb: () => {},
    name: 'test-verbose',
    script: __filename,
    instances: 1,
  };

  const master = new Pm2RepReq(verboseOptions);
  assert.strictEqual(master.verbose, true);
  master.sock.close();

  const quietOptions = {
    verbose: false,
    worker: false,
    port: 60005,
    cb: () => {},
    name: 'test-quiet',
    script: __filename,
    instances: 1,
  };

  const quietMaster = new Pm2RepReq(quietOptions);
  assert.strictEqual(quietMaster.verbose, false);
  quietMaster.sock.close();
});

// Test 6: Custom options are merged correctly
test('Custom options are merged with defaults', () => {
  const options = {
    verbose: false,
    worker: false,
    port: 60006,
    cb: () => {},
    name: 'test-merge',
    script: __filename,
    instances: 2,
    args: '--test',
    options: {
      mergeLogs: true,
      output: './test.log',
      error: './error.log',
    },
  };

  const master = new Pm2RepReq(options);

  // Default options
  assert.strictEqual(master.options.exec_mode, 'cluster');

  // Custom options
  assert.strictEqual(master.options.mergeLogs, true);
  assert.strictEqual(master.options.output, './test.log');
  assert.strictEqual(master.options.error, './error.log');

  master.sock.close();
});

// Test 7: Methods exist on the instance
test('Instance has required methods', () => {
  const options = {
    verbose: false,
    worker: false,
    port: 60007,
    cb: () => {},
    name: 'test-methods',
    script: __filename,
    instances: 1,
  };

  const master = new Pm2RepReq(options);

  assert.strictEqual(typeof master.finish, 'function');
  assert.strictEqual(typeof master.process, 'function');
  assert.strictEqual(typeof master.reload, 'function');
  assert.strictEqual(typeof master.run, 'function');

  master.sock.close();
});

// Test 8: Port is stored correctly
test('Port is stored correctly', () => {
  const options = {
    verbose: false,
    worker: false,
    port: 55555,
    cb: () => {},
    name: 'test-port',
    script: __filename,
    instances: 1,
  };

  const master = new Pm2RepReq(options);
  assert.strictEqual(master.port, 55555);
  master.sock.close();
});

// Print test results
console.log('\n-----------------------------------');
console.log(`Tests: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
console.log('-----------------------------------');

process.exit(failed > 0 ? 1 : 0);
