/**
 * Test file to verify entitlements are correctly assigned
 * 
 * This is a simple test to ensure that the CAN_CREATE_CLUB entitlement
 * is correctly assigned to both privileged and privileged+ users.
 */

import { 
  BASIC_ENTITLEMENTS,
  PRIVILEGED_ENTITLEMENTS,
  PRIVILEGED_PLUS_ENTITLEMENTS
} from '../lib/entitlements';

describe('Entitlements', () => {
  test('CAN_CREATE_CLUB is in PRIVILEGED_ENTITLEMENTS', () => {
    expect(PRIVILEGED_ENTITLEMENTS).toContain('CAN_CREATE_CLUB');
  });

  test('CAN_CREATE_CLUB is not in PRIVILEGED_PLUS_ENTITLEMENTS', () => {
    expect(PRIVILEGED_PLUS_ENTITLEMENTS).not.toContain('CAN_CREATE_CLUB');
  });

  test('CAN_CREATE_CLUB is not in BASIC_ENTITLEMENTS', () => {
    expect(BASIC_ENTITLEMENTS).not.toContain('CAN_CREATE_CLUB');
  });
});
