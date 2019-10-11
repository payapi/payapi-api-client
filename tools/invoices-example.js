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

  console.log('Requesting finance invoice creation ...');
  const financeInvoiceResponse = await payapiClient.createFinanceInvoice(invoice, invoice.invoicingClient);
  const financeInvoiceId = financeInvoiceResponse.invoice.invoiceId;
  console.log('Finance invoice created with id: ' + financeInvoiceId);

  console.log('Requesting standard invoice creation ...');
  const standardInvoiceResponse = await payapiClient.createStandardInvoice(invoice, invoice.invoicingClient);
  const standardInvoiceId = standardInvoiceResponse.invoice.invoiceId;
  console.log('Standard invoice created with id: ' + standardInvoiceId);

  console.log('Updating an invoice ...');
  invoice.invoiceTermsOfPayment = 'Updated terms of payment';
  const updated = await payapiClient.updateInvoice(standardInvoiceId, invoice, standardInvoiceResponse.invoicingClient);
  console.log('Updated invoice with id: '+ updated.invoice.invoiceId);

  console.log('Requesting invoice data ...');
  const invoiceData = await payapiClient.getInvoice(standardInvoiceId);
  console.info('Found invoice: ' + JSON.stringify(invoiceData, null, 2));

  console.log('Creating invoice for existing invoicingClient: ' + financeInvoiceResponse.invoicingClient);
  const newResponse = await payapiClient.createFinanceInvoice(invoice, financeInvoiceResponse.invoicingClient);
  console.log('Created invoice');

  process.exit(0);
}

run()
  .catch(err => {
    console.error(err);

    process.exit(1);
  })