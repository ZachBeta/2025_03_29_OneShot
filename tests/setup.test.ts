/**
 * Basic test to verify Jest configuration
 */

import main from '../src/index';

describe('Project Setup', () => {
  test('main function exists', () => {
    expect(main).toBeDefined();
    expect(typeof main).toBe('function');
  });

  test('basic environment test', () => {
    expect(2 + 2).toBe(4);
    expect(true).toBeTruthy();
    expect(false).toBeFalsy();
  });
}); 