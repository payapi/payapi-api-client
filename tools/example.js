'use strict';

const assert = require('assert');
const PayapiClient = require('../index');
const invoice = require('../data/invoice.json');

assert.ok(process.env.API_KEY, 'Please specify a API_KEY');
assert.ok(process.env.PASSWORD, 'Please specify a PASSWORD');
assert.ok(process.env.SECRET, 'Please specify a SECRET');

async function run() {
  const payapiClient = new PayapiClient({
    apiKey: process.env.API_KEY,
    password: process.env.PASSWORD,
    secret: process.env.SECRET,
    devUrl: 'http://localhost:3000'
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

  const ssn = '210281-9988';
  const creditCheck = await payapiClient.creditCheck(ssn, 1200, 'FI');
  console.info(creditCheck);

  const tupasUrl = await payapiClient.getTupasUrl('http://staging-facepay.payapi.io', 'session-x2ab3896j3ns');
  console.info(tupasUrl);

  process.exit(0);
}

run()
  .catch(err => {
    console.error(err);

    process.exit(1);
  })