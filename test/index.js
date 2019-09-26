'use strict';

const should = require('should');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(sinonChai);
chai.use(chaiAsPromised);
var PayapiApiClient = require('../index');

let params;

beforeEach(() => {
  params = {
    secret: 'test-secret',
    apiKey: 'test-apikey',
    password: 'password-test',
    isProd: false
  };
});

afterEach(function() {

});

describe('PayapiApiClient', function() {

  describe('constructor', () => {
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

  describe('authenticate', () => {
    it('should return something', function() {
      expect(new PayapiApiClient(params).authenticate())
        .to.equal('Hey, I returned something');
    });

  });

  describe('asynchronous method doSomethingAsync', () => {


  });
});
