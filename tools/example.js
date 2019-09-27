'use strict';

const assert = require('assert');
const PayapiClient = require('../index');

assert.ok(process.env.API_KEY, 'Please specify a API_KEY');
assert.ok(process.env.PASSWORD, 'Please specify a PASSWORD');
assert.ok(process.env.SECRET, 'Please specify a SECRET');
assert.ok(process.env.PUBLIC_ID, 'Please specify a PUBLIC_ID');

async function run() {
  const payapiClient = new PayapiClient({
    apiKey: process.env.API_KEY,
    password: process.env.PASSWORD,
    secret: process.env.SECRET,
    publicId: process.env.PUBLIC_ID,
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

  const ssn = 'Your social security number';
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