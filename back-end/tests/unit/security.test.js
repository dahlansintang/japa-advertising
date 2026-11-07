'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {
    isStrongPassword,
    customLoginLimiter,
    recordFailedLogin,
    resetLoginAttempts
} = require('../../utils/authSecurity');

function responseMock() {
    return {
        statusCode: 200,
        headers: {},
        set(name, value) { this.headers[name] = value; return this; },
        status(code) { this.statusCode = code; return this; },
        json(payload) { this.payload = payload; return this; }
    };
}

test('kebijakan password kuat konsisten', () => {
    assert.equal(isStrongPassword('JapaPrabu123!'), true);
    assert.equal(isStrongPassword('password'), false);
    assert.equal(isStrongPassword('Japa12!'), false);
    assert.equal(isStrongPassword('A'.repeat(73) + 'a1!'), false);
});

test('limiter memblokir setelah lima kegagalan untuk IP dan email', () => {
    const req = { ip: '192.0.2.10', body: { email: 'limit-test@example.com' } };
    for (let i = 0; i < 5; i++) {
        let nextCalled = false;
        customLoginLimiter(req, responseMock(), () => { nextCalled = true; });
        assert.equal(nextCalled, true);
        recordFailedLogin(req);
    }
    const res = responseMock();
    let nextCalled = false;
    customLoginLimiter(req, res, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 429);
    assert.ok(Number(res.headers['Retry-After']) > 0);
    resetLoginAttempts(req);
    let allowed = false;
    customLoginLimiter(req, responseMock(), () => { allowed = true; });
    assert.equal(allowed, true);
});
