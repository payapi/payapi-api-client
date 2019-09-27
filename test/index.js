'use strict';

const should = require('should');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const axios = require('axios');
chai.use(sinonChai);
chai.use(chaiAsPromised);
var PayapiApiClient = require('../index');

let params;

beforeEach(() => {
  params = {
    secret: 'test-secret',
    apiKey: 'test-apikey',
    password: 'password-test',
    publicId: 'test',
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
    it('Should return an error when publicId is missing', () => {
      delete params.publicId;
      expect(() => new PayapiApiClient(params)).to.throw(Error, /publicId/);
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
      sinon.stub(axios, 'post').returns({ status: 200, data: { message: 'Credit check passed successfully' } });
      const result = await payapiApiClient.creditCheck('10102403231', 1100, 'FI');

      expect(result).to.have.property('message', 'Credit check passed successfully');
    });
    it('Should return a Unauthorized error if authentication failed', async () => {
      sinon.stub(axios, 'post').returns({ status: 412, data: { error: 'Credit check amount must be a positive number' } });
      const result = await payapiApiClient.creditCheck('10102403231', 1100, 'FI');

      await expect(payapiApiClient.creditCheck('10102403231', 1100, 'FI'))
        .to.be.rejectedWith(Error, /Credit check amount must be a positive number/);
    });

    it.skip('Should return Unexpected status code received if http status returned is 503', () => {
      sinon.stub(axios, 'post').returns({ status: 503 });

      expect(payapiApiClient.creditCheck('10102403231', 1100, 'FI'))
        .to.be.rejectedWith(Error, /Unexpected status code received/);
    });
  });
});
