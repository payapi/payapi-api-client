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
var log = {
  audit: function(text) {
    console.log(text);
  }
};
var params = {
  log: log,
  client: sinon.spy()
};

beforeEach(function() {
  sinon.spy(log, 'audit');
});

afterEach(function() {
  log.audit.restore();
});

describe('PayapiApiClient', function() {
  describe('synchronous methods', () => {
    it('should return something', function() {
      expect(
        new PayapiApiClient(params).returnSomething()
      ).to.equal('Hey, I returned something');
    });
    it('should log something', function() {
      new PayapiApiClient(params).touchSomething();
      expect(log.audit).to.be.called;
    });
    it('should throw something', function() {
      // Note, when testing if a method throws something,
      // it needs to be wrapped in an anonymous function.
      // You can use regexp to check that the error
      // message is something expected.
      expect(() => {
        new PayapiApiClient(params).throwSomething();
      }).to.throw(Error, /something/);
    });
    it('should use function parameters', function() {
      expect(
        new PayapiApiClient(params).useFunctionParameters('Heya')
      ).to.equal('Heya');
    });
    it('should call something with an object', function() {
      new PayapiApiClient(params).callingUsingAnObject('bar');
      return expect(params.client).to.have.been.calledWithMatch({
        foo: 'bar',
        message: sinon.match(/diiba/)
      });
    });
  });

  describe('asynchronous method doSomethingAsync', () => {
    it('should have mandatory parameter bar', done => {
      new PayapiApiClient(params).doSomethingAsync({foo: 'foo'})
        .then(response => {
          expect(response).to.not.exist;
          done();
        })
        .catch(err => {
          expect(err.message).to.match(/missing parameter/);
          expect(err.message).to.match(/bar/);
          done();
        });
    });
    it('should have mandatory parameter foo', done => {
      new PayapiApiClient(params).doSomethingAsync({bar: 'bar'})
        .then(response => {
          expect(response).to.not.exist;
          done();
        })
        .catch(err => {
          expect(err.message).to.match(/missing parameter/);
          expect(err.message).to.match(/foo/);
          done();
        });
    });
    it('should have mandatory parameter', done => {
      new PayapiApiClient(params).doSomethingAsync({})
        .then(response => {
          expect(response).to.not.exist;
          done();
        })
        .catch(err => {
          expect(err.message).to.match(/missing parameter/);
          done();
        });
    });
    it('should work well with all mandatory parameters', done => {
      new PayapiApiClient(params).doSomethingAsync({foo: 'foo', bar: 'bar'})
        .then(response => {
          expect(response).to.deep.equal({
            foo: 'foo',
            bar: 'bar'
          });
          done();
        })
        .catch(err => {
          expect(err.message).to.not.exist;
          done();
        });
    });
  });
});
