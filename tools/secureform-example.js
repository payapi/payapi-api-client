'use strict';

const assert = require('assert');
const PayapiClient = require('../index');
const secureformData = require('../data/secureform.json');

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

  console.log('Creating secureform token ...');
  const secureformDataToken = payapiClient.createSecureformDataToken(secureformData);
  console.log('Created token: ' + secureformDataToken);

  process.exit(0);
}

run()
  .catch(err => {
    console.error(err);

    process.exit(1);
  })