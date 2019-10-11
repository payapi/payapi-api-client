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

  console.log('Requesting invoice creation ...');
  const invoiceResponse = await payapiClient.createFinanceInvoice(invoice, invoice.invoicingClient);

  console.log('Requesting invoice data ...');
  const invoiceData = await payapiClient.getInvoice(invoiceResponse.invoice.invoiceId);
  console.info('Found invoice: ' + JSON.stringify(invoiceData, null, 2));

  console.log('Creating invoice for existing invoicingClient: ' + invoiceResponse.invoicingClient);
  const newResponse = await payapiClient.createFinanceInvoice(invoice, invoiceResponse.invoicingClient);
  console.log('Created invoice: ' + JSON.stringify(newResponse.invoice, null, 2));
  process.exit(0);
}

run()
  .catch(err => {
    console.error(err);

    process.exit(1);
  })