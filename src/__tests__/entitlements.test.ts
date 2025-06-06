/**
 * Test file to verify entitlements are correctly assigned
 *
 * This test ensures that the correct club creation entitlements
 * are assigned to privileged and privileged+ users.
 */

import {
  BASIC_ENTITLEMENTS,
  PRIVILEGED_ENTITLEMENTS,
  PRIVILEGED_PLUS_ENTITLEMENTS
} from '../lib/entitlements';

describe('Entitlements', () => {
  test('CAN_CREATE_LIMITED_CLUBS is in PRIVILEGED_ENTITLEMENTS', () => {
    expect(PRIVILEGED_ENTITLEMENTS).toContain('CAN_CREATE_LIMITED_CLUBS');
  });

  test('CAN_CREATE_UNLIMITED_CLUBS is in PRIVILEGED_PLUS_ENTITLEMENTS', () => {
    expect(PRIVILEGED_PLUS_ENTITLEMENTS).toContain('CAN_CREATE_UNLIMITED_CLUBS');
  });

  test('CAN_CREATE_LIMITED_CLUBS is not in BASIC_ENTITLEMENTS', () => {
    expect(BASIC_ENTITLEMENTS).not.toContain('CAN_CREATE_LIMITED_CLUBS');
  });

  test('CAN_CREATE_UNLIMITED_CLUBS is not in BASIC_ENTITLEMENTS', () => {
    expect(BASIC_ENTITLEMENTS).not.toContain('CAN_CREATE_UNLIMITED_CLUBS');
  });

  test('PRIVILEGED_PLUS inherits CAN_CREATE_LIMITED_CLUBS from PRIVILEGED', () => {
    expect(PRIVILEGED_PLUS_ENTITLEMENTS).toContain('CAN_CREATE_LIMITED_CLUBS');
  });
});
