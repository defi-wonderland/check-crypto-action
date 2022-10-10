// import * as process from 'process';
// import * as core from '@actions/core';
// import * as cp from 'child_process';
// import * as path from 'path';
import { expect, test, describe } from '@jest/globals';

import { processDiff } from '../src/processing';

// test('throws invalid number', async () => {
//   const input = parseInt('foo', 10)
//   await expect(wait(input)).rejects.toThrow('milliseconds not a number')
// })

// test('wait 500 ms', async () => {
//   const start = new Date()
//   await wait(500)
//   const end = new Date()
//   var delta = Math.abs(end.getTime() - start.getTime())
//   expect(delta).toBeGreaterThan(450)
// })

// shows how the runner will run a javascript action with env / stdout protocol
// test('test runs', () => {
//   process.env['INPUT_MILLISECONDS'] = '500';
//   const np = process.execPath;
//   const ip = path.join(__dirname, '..', 'lib', 'main.js');
//   const options: cp.ExecFileSyncOptions = {
//     env: process.env,
//   };
//   const res = cp.execFileSync(np, [ip], options).toString();
//   console.log(res);
// });

describe('Main tests', () => {
  const leakPart = '3d22222b3b0e689193235279328527dbf71f6e79781beaded0b24fdc3e22cf6fc56e';

  test('processDiff test logic should pass', () => {
    const mockGoodDiff = `
diff --git a/LICENSE b/LICENSE
index a111aa1..222b2b2 222111
--- a/LICENSE
+++ b/LICENSE
@@ -1,22 +1,22 @@
+(The MIT License)
-The MIT License (MIT)
Copyright 2022 DeFi Wonderland
    `;
    const result = processDiff(mockGoodDiff);

    expect(result.passed).toBeTruthy();
  });

  test('processDiff test logic should pass with old leak', () => {
    const mockGoodDiff = `
diff --git a/LICENSE b/LICENSE
index a111aa1..222b2b2 222111
--- a/LICENSE
+++ b/LICENSE
@@ -1,22 +1,22 @@
+(The MIT License)
-The MIT License (MIT)
Copyright 2022 DeFi Wonderland
leak=abcd${leakPart}
    `;
    const result = processDiff(mockGoodDiff);

    expect(result.passed).toBeTruthy();
  });

  test('processDiff test logic should fail', () => {
    const mockBadDiff = `
diff --git a/LICENSE b/LICENSE
index a111aa1..222b2b2 222111
--- a/LICENSE
+++ b/LICENSE
@@ -1,22 +1,22 @@
+leak=abcd${leakPart}
-The MIT License (MIT)
Copyright 2022 DeFi Wonderland
      `;
    const result = processDiff(mockBadDiff);

    expect(result.passed).toBeFalsy();
  });
});
