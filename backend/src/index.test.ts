import request from 'supertest';
import app from './index';

describe('API Routes', () => {
  beforeEach(async () => {
    // Reset the data before each test
    await request(app).post('/reset');
  });

  describe('POST /reset', () => {
    it('should reset all data', async () => {
      const response = await request(app).post('/reset');
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        message: "data reset successfull",
        INR_BALANCES: {},
        ORDERBOOK: {},
        STOCK_BALANCES: {},
      });
    });
  });

  describe('POST /user/create/:userId', () => {
    it('should create a new user', async () => {
      const response = await request(app).post('/user/create/testUser');
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User testUser created');
      expect(response.body.INR_BALANCES).toHaveProperty('testUser');
    });

    it('should return 400 if user already exists', async () => {
      await request(app).post('/user/create/testUser');
      const response = await request(app).post('/user/create/testUser');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('user already existe');
    });
  });

  describe('POST /symbol/create/:stockSymbol', () => {
    it('should create a new stock symbol', async () => {
      const response = await request(app).post('/symbol/create/TEST');
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Symbol TEST created');
      expect(response.body.ORDERBOOK).toHaveProperty('TEST');
    });

    it('should return 400 if symbol already exists', async () => {
      await request(app).post('/symbol/create/TEST');
      const response = await request(app).post('/symbol/create/TEST');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('symbol already present');
    });
  });

  describe('GET /orderbook', () => {
    it('should return the orderbook', async () => {
      const response = await request(app).get('/orderbook');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('ORDERBOOK');
    });
  });

  describe('GET /balances/inr', () => {
    it('should return INR balances', async () => {
      const response = await request(app).get('/balances/inr');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('INR_BALANCES');
    });
  });

  describe('GET /balances/stock', () => {
    it('should return stock balances', async () => {
      const response = await request(app).get('/balances/stock');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('STOCK_BALANCES');
    });
  });

  describe('GET /balance/inr/:userId', () => {
    it('should return INR balance for a user', async () => {
      await request(app).post('/user/create/testUser');
      const response = await request(app).get('/balance/inr/testUser');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('userId', 'testUser');
      expect(response.body).toHaveProperty('balance', 0);
    });

    it('should return 400 if user not found', async () => {
      const response = await request(app).get('/balance/inr/nonexistentUser');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('user not found');
    });
  });

  describe('POST /onramp/inr', () => {
    it('should add INR balance to a user', async () => {
      await request(app).post('/user/create/testUser');
      const response = await request(app).post('/onramp/inr').send({
        userId: 'testUser',
        amount: 1000
      });
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Onramped testUser with amount 1000');
    });

    it('should return 400 if user not found', async () => {
      const response = await request(app).post('/onramp/inr').send({
        userId: 'nonexistentUser',
        amount: 1000
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('user not found');
    });
  });

  describe('GET /balance/stock/:userId', () => {
    it('should return stock balance for a user', async () => {
      await request(app).post('/user/create/testUser');
      const response = await request(app).get('/balance/stock/testUser');
      expect(response.status).toBe(200);
      // The response body should be an empty object as the user has no stocks yet
      expect(response.body).toEqual({});
    });

    it('should return 400 if user not found', async () => {
      const response = await request(app).get('/balance/stock/nonexistentUser');
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('user not found');
    });
  });

  describe('GET /orderbook/:stockSymbol', () => {
    it('should return orderbook for a specific stock symbol', async () => {
      await request(app).post('/symbol/create/TEST');
      const response = await request(app).get('/orderbook/TEST');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('orderbook');
      expect(response.body.orderbook).toHaveProperty('yes');
      expect(response.body.orderbook).toHaveProperty('no');
    });

    it('should return message if stock symbol not found', async () => {
      const response = await request(app).get('/orderbook/NONEXISTENT');
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('NONEXISTENT not found in order book');
    });
  });

  describe('POST /order/buy', () => {
    beforeEach(async () => {
      await request(app).post('/user/create/testUser');
      await request(app).post('/symbol/create/TEST');
      await request(app).post('/onramp/inr').send({
        userId: 'testUser',
        amount: 10000
      });
    });

    it('should place a buy order', async () => {
      const response = await request(app).post('/order/buy').send({
        userId: 'testUser',
        stockSymbol: 'TEST',
        quantity: 5,
        price: 100,
        type: 'yes'
      });
      expect(response.status).toBe(201);
      expect(response.body.message).toContain('Buy order placed for 5 yes at price 100');
    });

    it('should return 400 if user not found', async () => {
      const response = await request(app).post('/order/buy').send({
        userId: 'nonexistentUser',
        stockSymbol: 'TEST',
        quantity: 5,
        price: 100,
        type: 'yes'
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User not found');
    });

    it('should return 400 if stock symbol does not exist', async () => {
      const response = await request(app).post('/order/buy').send({
        userId: 'testUser',
        stockSymbol: 'NONEXISTENT',
        quantity: 5,
        price: 100,
        type: 'yes'
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Market for NONEXISTENT does not exist');
    });

    it('should return 400 if insufficient balance', async () => {
      const response = await request(app).post('/order/buy').send({
        userId: 'testUser',
        stockSymbol: 'TEST',
        quantity: 1000,
        price: 1000,
        type: 'yes'
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Insufficient balance');
    });
  });

  describe('POST /order/sell', () => {
    beforeEach(async () => {
      await request(app).post('/user/create/testUser');
      await request(app).post('/symbol/create/TEST');
      // Add some stock balance to the user (this is a simplification, you might need to adjust this based on your actual implementation)
      await request(app).post('/order/buy').send({
        userId: 'testUser',
        stockSymbol: 'TEST',
        quantity: 10,
        price: 100,
        type: 'yes'
      });
    });

    it('should place a sell order', async () => {
      const response = await request(app).post('/order/sell').send({
        userId: 'testUser',
        stockSymbol: 'TEST',
        quantity: 5,
        price: 110,
        type: 'yes'
      });
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Sell order placed for 5 yes at price 110');
    });

    it('should return 400 if user does not have stock to sell', async () => {
      const response = await request(app).post('/order/sell').send({
        userId: 'testUser',
        stockSymbol: 'NONEXISTENT',
        quantity: 5,
        price: 110,
        type: 'yes'
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User does not have stock to sell');
    });

    it('should return 400 if insufficient stock to sell', async () => {
      const response = await request(app).post('/order/sell').send({
        userId: 'testUser',
        stockSymbol: 'TEST',
        quantity: 20,
        price: 110,
        type: 'yes'
      });
      expect(response.status).toBe(400);
      expect(response.body.message).toBe('User does not have stock to sell');
    });
  });
});

