const rateLimit = require('express-rate-limit');

// Middleware to extract account identifier from request (e.g., req.body.accountId)
function getAccountKey(req) {
    // Adjust this according to how you identify accounts in your requests
    return req.body && req.body.accountId ? req.body.accountId : req.ip;
}

const incomingDataRateLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 5, // limit each account to 5 requests per windowMs
    keyGenerator: getAccountKey,
    message: 'Too many requests from this account, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    incomingDataRateLimiter,
};