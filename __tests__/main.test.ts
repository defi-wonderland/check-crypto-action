import { expect, test, describe } from '@jest/globals';

import { processDiff } from '../src/processing';
const test = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';
describe('Main tests', () => {
  const leakPart = 'dbf71f6e79781beaded0b24fdc3e22cf6fc56e';

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

  test('processDiff test logic should pass with no changes to old pk', () => {
    const mockGoodDiff = `
diff --git a/LICENSE b/LICENSE
index a111aa1..222b2b2 222111
--- a/LICENSE
+++ b/LICENSE
@@ -1,22 +1,22 @@
+(The MIT License)
-The MIT License (MIT)
Copyright 2022 DeFi Wonderland
leak=abcd3d22222b3b0e689193235279328527${leakPart}
    `;
    const result = processDiff(mockGoodDiff);

    expect(result.passed).toBeTruthy();
  });

  test('processDiff test logic should fail when modifying(+) a pk', () => {
    const mockBadDiff = `
diff --git a/LICENSE b/LICENSE
index a111aa1..222b2b2 222111
--- a/LICENSE
+++ b/LICENSE
@@ -1,22 +1,22 @@
+leak=abcd3d22222b3b0e689193235279328527${leakPart}
-The MIT License (MIT)
Copyright 2022 DeFi Wonderland
      `;
    const result = processDiff(mockBadDiff);

    expect(result.passed).toBeFalsy();
  });

  test('processDiff test logic should fail when modifying(-) a pk', () => {
    const mockBadDiff = `
diff --git a/LICENSE b/LICENSE
index a111aa1..222b2b2 222111
--- a/LICENSE
+++ b/LICENSE
@@ -1,22 +1,22 @@
-leak=abcd3d22222b3b0e689193235279328527${leakPart}
+The MIT License (MIT)
Copyright 2022 DeFi Wonderland
      `;
    const result = processDiff(mockBadDiff);

    expect(result.passed).toBeFalsy();
  });
});
