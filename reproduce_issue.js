
// Mock localStorage
const store = {};
global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { for (const key in store) delete store[key]; }
};

global.window = global;

// Use dynamic import to ensure globals are set before module evaluation
(async () => {
    try {
        await import('./js/hapusTransaksiTutupKasir.js');

        const RateLimiterService = global.RateLimiterService || window.RateLimiterService;

        if (!RateLimiterService) {
            console.error('RateLimiterService not found in global scope');
            process.exit(1);
        }

        console.log('Testing RateLimiterService...');

        const service = new RateLimiterService();
        const username = 'testuser';

        // Clear storage
        localStorage.clear();

        // Test 1: Record 5 deletions
        console.log('Recording 5 deletions...');
        for (let i = 0; i < 5; i++) {
            service.recordDeletion(username, `trans-${i}`, `audit-${i}`);
        }

        let result = service.checkRateLimit(username);
        console.log(`Count: ${result.count}`);
        console.log(`Level: ${result.level}`);
        console.log(`Message: ${result.message}`);

        if (result.count !== 5 || result.level !== 'warning') {
            console.error('FAIL: Expected count 5 and level warning');
        } else {
            console.log('PASS: Warning threshold working');
        }

        // Test 2: Record 5 more (total 10)
        console.log('Recording 5 more deletions...');
        for (let i = 5; i < 10; i++) {
            service.recordDeletion(username, `trans-${i}`, `audit-${i}`);
        }

        result = service.checkRateLimit(username);
        console.log(`Count: ${result.count}`);
        console.log(`Level: ${result.level}`);
        console.log(`Message: ${result.message}`);

        if (result.count !== 10 || result.level !== 'block') {
            console.error('FAIL: Expected count 10 and level block');
        } else {
            console.log('PASS: Block threshold working');
        }
    } catch (error) {
        console.error('Error running test:', error);
    }
})();
