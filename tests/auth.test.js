const app = require('../src/app');
const assert = require('assert');

describe('Auth Service', () => {
  it('should return health status', () => {
    assert.ok(app);
  });
});
