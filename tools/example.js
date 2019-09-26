'use strict';

const assert = require('assert');
const PayapiClient = require('../index');

assert.ok(process.env.API_KEY, 'Please specify a API_KEY');
assert.ok(process.env.PASSWORD, 'Please specify a PASSWORD');
assert.ok(process.env.SECRET, 'Please specify a SECRET');

async function run() {
  const payapiClient = new PayapiClient({
    apiKey: process.env.API_KEY,
    password: process.env.PASSWORD,
    secret: process.env.SECRET
  });
  const response = await payapiClient.authenticate();
  console.log('Authenticated successfully');

  const fraudCheckParams = {
    ip: '8.8.8.8',
    email: 'example@example.com',
    bin: '',
    shippingCountryCode: 'FI'
  };
  const fraudCheck = await payapiClient.fraudCheck(fraudCheckParams);
  console.info(fraudCheck);

  const ssn = 'Your social security number';
  const creditCheck = await payapiClient.creditCheck(ssn, 1200, 'FI');
  console.info(creditCheck);

  const tupasUrl = await payapiClient.getTupasUrl('http://staging-facepay.payapi.io', 'sessionId-x1582s');
  console.info(tupasUrl);

  process.exit(0);
}

run()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })