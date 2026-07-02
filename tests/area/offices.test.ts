import { test, expect } from 'vitest';
import { offices } from '../../src/config/offices';

test('offices has gainesville and ocala with phone + GBP', () => {
  expect(offices.gainesville.phone).toBe('352-706-5295');
  expect(offices.gainesville.sameAs[0]).toContain('kgmid=/g/1ptx2pkfg');
  expect(offices.ocala.cityStateZip).toBe('Ocala, FL 34471');
  expect(offices.ocala.sameAs[0]).toContain('kgmid=/g/1yfprvxjj');
});
