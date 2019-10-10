'use strict';

const should = require('should');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const axios = require('axios');
const validator = require('validator');
chai.use(sinonChai);
chai.use(chaiAsPromised);
var PayapiApiClient = require('../index');
const invoiceData = require('../data/invoice.json');

let params;

beforeEach(() => {
  params = {
    secret: 'test-secret',
    apiKey: 'test-apikey',
    password: 'password-test',
    isProd: false
  };
});

afterEach(() => sinon.restore());

describe('PayapiApiClient', function() {

  describe('Constructor', () => {
    it('Should return an error when apiKey is missing', () => {
      delete params.apiKey;
      expect(() => new PayapiApiClient(params)).to.throw(Error, /apiKey/);
    });
    it('Should return an error when secret is missing', () => {
      delete params.secret;
      expect(() => new PayapiApiClient(params)).to.throw(Error, /secret/);
    });
    it('Should return an error when password is missing', () => {
      delete params.password;
      expect(() => new PayapiApiClient(params)).to.throw(Error, /password/);
    });
    it('Should return an error when isProd is not a valid boolean', () => {
      params.isProd = 'true';
      expect(() => new PayapiApiClient(params)).to.throw('Configuration: isProd must be a boolean');
    });
    it('Should use Staging apiUrl when isProd is disabled', () => {
      params.isProd = false;
      expect(new PayapiApiClient(params).apiUrl).to.equal('https://staging-input.payapi.io');
    });
    it('Should use Production apiUrl when isProd is boolean:false', () => {
      params.isProd = true;
      expect(new PayapiApiClient(params).apiUrl).to.equal('https://input.payapi.io');
    });
  })

  describe.skip('Generate access token', () => {

  });

  describe('Authenticate', () => {
    it('Should authenticate and return access token', async () => {
      sinon.stub(axios, 'post').returns({ status: 200, data: { token: 'encodedToken' }});
      const result = await new PayapiApiClient(params).authenticate();

      expect(result).to.have.property('token', 'encodedToken');
    });
    it('Should return a Unauthorized error if authentication failed', () => {
      sinon.stub(axios, 'post').returns({ status: 401, data: { error: 'Unauthorized' } });

      expect(new PayapiApiClient(params).authenticate()).to.be.rejectedWith(Error, /Unauthorized/ );
    });

    it('Should return a generic error if authentication failed for unknown reason', () => {
      sinon.stub(axios, 'post').returns({ status: 504 });

      expect(new PayapiApiClient(params).authenticate()).to.be.rejectedWith(Error);
    });
  });

  describe('Credit check', () => {
    let payapiApiClient;

    before(async function()  {
      sinon.stub(axios, 'post').returns({ status: 200, data: { token: 'encodedToken' } });
      payapiApiClient = new PayapiApiClient(params);
      await payapiApiClient.authenticate();
      sinon.restore();
    });

    it('Should success in credit check', async () => {
      sinon.stub(axios, 'post')
        .returns({ status: 200, data: { message: 'Credit check passed successfully' } });
      const result = await payapiApiClient.creditCheck('10102403231', 1100, 'FI');

      expect(result).to.have.property('message', 'Credit check passed successfully');
    });
    it('Should fail if not authenticated', async () => {
      await expect(new PayapiApiClient(params).creditCheck('10102403231', 1100, 'FI'))
        .to.be.rejectedWith(Error, /You must do the authentication first/);

    });

    it('Should fail if ssn is not a valid social security number', async () => {
      await expect(payapiApiClient.creditCheck('234', 1100, 'FI'))
        .to.be.rejectedWith(Error, /Validation: ssn must be a valid social security number/);

    });
    it('Should fail if country code is not a valid ISO alpha-2', async () => {
      await expect(payapiApiClient.creditCheck('83123414291', 1100, 'FIN'))
        .to.be.rejectedWith(Error, /Validation: countryCode must be a valid ISO alpha-2 code/);

    });
    it('Should fail if consumerNumber is not valid autoincremental number', async () => {
      await expect(payapiApiClient.creditCheck('83123414291', 1100, 'FI', -15))
        .to.be.rejectedWith(Error, /Validation: consumerNumber must be a valid autoincremental number/);
    });

    it('Should return a Unauthorized error if authentication failed', async () => {
      sinon.stub(axios, 'post')
        .returns({ status: 412, data: { error: 'Credit check amount must be a positive number' } });

      await expect(payapiApiClient.creditCheck('10102403231', 1100, 'FI'))
        .to.be.rejectedWith(Error, /Credit check amount must be a positive number/);
    });
    it('Should return Unexpected status code received if http status returned is 503', async () => {
      sinon.stub(axios, 'post').returns({ status: 503 });

      await expect(payapiApiClient.creditCheck('10102403231', 1100, 'FI'))
        .to.be.rejectedWith(Error, /Unexpected status code received/);
    });
  });

  describe('Get Tupas URL', () => {
    let payapiApiClient;

    before(async function() {
      sinon.stub(axios, 'post').returns({ status: 200, data: { token: 'encodedToken' } });
      payapiApiClient = new PayapiApiClient(params);
      await payapiApiClient.authenticate();
      sinon.restore();
    });

    it('Should success and return a valid URL', async () => {
      sinon.stub(axios, 'get').returns({ status: 200, data: { signicatUrl: 'https://example.com' } });
      const result = await payapiApiClient.getTupasUrl('https://example.com/redirect', 'sessionId-sj3j4');

      expect(validator.isURL(result.signicatUrl)).to.equal(true);
      expect(result).to.have.property('signicatUrl', 'https://example.com');
    });

    it('Should fail if not authenticated', async () => {
      await expect(new PayapiApiClient(params).getTupasUrl('https://example.com', 'sessionId'))
        .to.be.rejectedWith(Error, /You must do the authentication first/);
    });

    it('Should success and return a valid URL', async () => {
      sinon.stub(axios, 'get').returns({ status: 200, data: { signicatUrl: 'https://example.com' } });
      const result = await payapiApiClient.getTupasUrl('https://example.com/redirect', 'sessionId-sj3j4');

      expect(validator.isURL(result.signicatUrl)).to.equal(true);
      expect(result).to.have.property('signicatUrl', 'https://example.com');
    });

    it('Should fail if return url is not a valid http/https URL', async () => {
      await expect(payapiApiClient.getTupasUrl('httpa://example.com', 'testsession'))
        .to.be.rejectedWith(Error, /Validation: redirectUrl must be a valid URL/);
    });

    it('Should fail if sessionId has more than 128 characters', async () => {
      const sessionId = 'AgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/2wBDAQ' +
        'DAwQDBAgEBAgQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwk';
      await expect(payapiApiClient.getTupasUrl('http://example.com', sessionId))
        .to.be.rejectedWith(Error, /Validation: sessionId is too large/);
    });
  });

  describe('Get Invoice', () => {
    let payapiApiClient;

    before(async function()  {
      sinon.stub(axios, 'post').returns({ status: 200, data: { token: 'encodedToken' } });
      payapiApiClient = new PayapiApiClient(params);
      await payapiApiClient.authenticate();
      sinon.restore();
    });

    it('Should return invoice Data', async () => {
      sinon.stub(axios, 'get')
        .returns({ status: 200, data: invoiceData });

      const result = await payapiApiClient.getInvoice(invoiceData.invoiceId);

      expect(result).to.have.property('invoice');
      expect(result).to.have.property('invoicingClient');

      for(let [key,value] of Object.entries(invoiceData)) {
        if (key !== 'invoicingClient') {
          expect(result.invoice).to.have.property(key, invoiceData[key]);
        }
      }

      for(let [key, value] of Object.entries(invoiceData.invoicingClient)) {
        expect(result.invoicingClient).to.have.property(key, invoiceData.invoicingClient[key]);
      }
    });

    it('Should fail if not authenticated', async () => {
      await expect(new PayapiApiClient(params).getInvoice(invoiceData.invoiceId))
          .to.be.rejectedWith(Error, /You must do the authentication first/);
    });

    it('Should fail if invoiceId is not valid or empty', async () => {
      await expect(payapiApiClient.getInvoice('234'))
        .to.be.rejectedWith(Error, /Validation: invoiceId is not valid/);
    });

    it('Should fail if invoice is not found', () => {
      sinon.stub(axios, 'get').returns({ status: 400, data: { error: 'Invoice not found' } });

      expect(payapiApiClient.getInvoice(invoiceData.invoiceId))
        .to.be.rejectedWith(Error, /Invoice not found/);
    });

  });

  describe('Create invoice', () => {
    let payapiApiClient;
    let invoice = { ... invoiceData };
    let invoicingClient = { ... invoiceData.invoicingClient };
    delete invoice.invoicingClient;

    before(async function()  {
      sinon.stub(axios, 'post').returns({ status: 200, data: { token: 'encodedToken' } });
      payapiApiClient = new PayapiApiClient(params);
      await payapiApiClient.authenticate();
      sinon.restore();
    });

    it('Should create a invoice and return data', async () => {
      sinon.stub(axios, 'post').returns({ status: 200, data: invoiceData });
      const result = await payapiApiClient.createInvoice(invoice, invoicingClient);

      expect(result).to.have.property('invoice');
      expect(result).to.have.property('invoicingClient');

      for(let [key,value] of Object.entries(invoiceData)) {
        if (key !== 'invoicingClient') {
          expect(result.invoice).to.have.property(key, invoiceData[key]);
        }
      }

      for(let [key, value] of Object.entries(invoiceData.invoicingClient)) {
        expect(result.invoicingClient).to.have.property(key, invoiceData.invoicingClient[key]);
      }
    });

    it('Should fail if invoice is empty', async () => {
      await expect(payapiApiClient.createInvoice(null, invoicingClient))
        .to.be.rejectedWith(Error, /Validation: invoice object parameter is mandatory/);
    });

    it('Should fail if not authenticated', async () => {
      await expect(new PayapiApiClient(params).createInvoice(invoiceData.invoiceId))
          .to.be.rejectedWith(Error, /You must do the authentication first/);
    });

    it('Should fail if validation error is captured', () => {
      let errMessage = 'clientMobilePhoneNumber is not valid';
      sinon.stub(axios, 'post').returns({ status: 400, data: { error: errMessage } });

      expect(payapiApiClient.createInvoice(invoice, invoicingClient))
        .to.be.rejectedWith(Error, errMessage);
    });
  });

});
