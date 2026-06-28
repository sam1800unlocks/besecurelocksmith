import { test, expect } from 'vitest';
import config from '../astro.config.mjs';

test('URLs are emitted with trailing slashes as directories', () => {
  expect(config.trailingSlash).toBe('always');
  expect(config.build?.format).toBe('directory');
});
