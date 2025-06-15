const request = require('supertest');
const app = require('../../index');
const { User, Account, Destination, Role, AccountMember } = require('../../src/models');

describe('Destination API', () => {
    let authToken;
    let accountId;
    let userId;

    beforeAll(async () => {
        // Create test user and account
        const userData = {
            email: 'desttest@example.com',
            password: 'password123'
        };

        await request(app).post('/api/user/register').send(userData);
        const loginResponse = await request(app)
            .post('/api/user/login')
            .send(userData);

        authToken = loginResponse.body.token;
        userId = loginResponse.body.userId; // Updated to match the actual response structure

        // Get the Admin role
        const adminRole = await Role.findOne({ where: { role_name: 'Admin' } });
        expect(adminRole).toBeTruthy();

        const accountResponse = await request(app)
            .post('/api/accounts')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
                account_name: 'Test Account'
            });

        expect(accountResponse.status).toBe(200);
        expect(accountResponse.body.success).toBe(true);
        expect(accountResponse.body.data.account).toBeTruthy();
        accountId = accountResponse.body.data.account.id;

        // Assign Admin role to the user for this account
        await AccountMember.create({
            account_id: accountId,
            user_id: userId,
            role_id: adminRole.id
        });
    });

    beforeEach(async () => {
        await Destination.destroy({ where: {} });
    });

    describe('POST /accounts/:accountId/destinations', () => {
        it('should create a new destination', async () => {
            const destData = {
                url: 'https://webhook.site/123',
                http_method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            };

            const response = await request(app)
                .post(`/api/accounts/${accountId}/destinations`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(destData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.url).toBe(destData.url);
            expect(response.body.data.method).toBe(destData.http_method);
            expect(response.body.data.headers).toEqual(destData.headers);
        });

        it('should return 400 for invalid destination data', async () => {
            const invalidData = {
                url: 'invalid-url',
                http_method: 'INVALID',
                headers: 'not-an-object'
            };

            const response = await request(app)
                .post(`/api/accounts/${accountId}/destinations`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Validation error');
            expect(response.body.details).toBeDefined();
        });
    });

    describe('GET /accounts/:accountId/destinations', () => {
        beforeEach(async () => {
            // Create test destinations
            const destinations = [
                {
                    url: 'https://webhook.site/123',
                    http_method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                },
                {
                    url: 'https://webhook.site/456',
                    http_method: 'GET',
                    headers: { 'Authorization': 'Bearer token' }
                }
            ];

            for (const dest of destinations) {
                await request(app)
                    .post(`/api/accounts/${accountId}/destinations`)
                    .set('Authorization', `Bearer ${authToken}`)
                    .send(dest);
            }
        });

        it('should list all destinations for an account', async () => {
            const response = await request(app)
                .get(`/api/accounts/${accountId}/destinations`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBe(2);
            expect(response.body.data[0]).toHaveProperty('url');
            expect(response.body.data[0]).toHaveProperty('method');
            expect(response.body.data[0]).toHaveProperty('headers');
        });

        it('should return 401 without authentication', async () => {
            const response = await request(app)
                .get(`/api/accounts/${accountId}/destinations`);

            expect(response.status).toBe(401);
        });
    });
});