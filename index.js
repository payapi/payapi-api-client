'use strict';

const axios = require('axios');
const validator = require('validator');
const inputDataValidator = require('./lib/validator');
const helpers = require('./lib/helpers');
const debug = require('debug')('payapi-api-client');

const axiosOptions = {
  timeout: 10000,
  validateStatus: status => status >= 200 && status <= 503
};

module.exports = function PayapiApiClient(config) {
  inputDataValidator.validateConfig(config);
  const apiUrl = helpers.getApiUrl(config);

  async function authenticate() {
    const payload = {
      apiKey: {
        key: config.apiKey,
        password: config.password
      }
    };
    const token = helpers.generateToken(payload, config.secret);

    const data = {
      key: config.apiKey,
      token: token
    };

    const response = await axios.post(apiUrl + '/v1/api/auth/login', data, axiosOptions);

    if (response.status === 200) {
      config.authenticationToken = response.data.token;
    }

    return helpers.formatAxiosResponse(response);
  }

  async function fraudCheck(params) {
    if (!params.ip) {
      throw new Error('Validation: ip is mandatory');
    }
    const body = params;
    body.authenticationToken = { token: config.authenticationToken };

    const url = apiUrl + '/v1/api/authorized/fraud/check/' + params.ip;

    const response = await axios.post(url, body, axiosOptions);

    return helpers.formatAxiosResponse(response);
  }

  async function creditCheck(ssn, amount, countryCode = 'FI', consumerNumber = 1) {
    helpers.checkAuthentication(config);

    if (!ssn || ssn.length < 8) {
      throw new Error('Validation: ssn must be a valid social security number');
    }
    if (!amount || isNaN(amount) || amount <= 0) {
      throw new Error('Validation: amount must be a valid positive number');
    }
    if (!countryCode || !validator.isISO31661Alpha2(countryCode)) {
      throw new Error('Validation: countryCode must be a valid ISO alpha-2 code');
    }
    if (!consumerNumber || isNaN(consumerNumber) || consumerNumber < 1) {
      throw new Error('Validation: consumerNumber must be a valid autoincremental number');
    }

    const url = apiUrl + '/v1/api/authorized/creditcheck';
    const data = {
      ssn: ssn,
      amount: amount,
      authenticationToken: { token: config.authenticationToken },
      countryCode: countryCode,
      consumerNumber: consumerNumber
    }

    const response = await axios.post(url, data, axiosOptions);

    return helpers.formatAxiosResponse(response);
  }

  async function getTupasUrl(redirectUrl, sessionId) {
    helpers.checkAuthentication(config);

    if (!redirectUrl || !validator.isURL(redirectUrl)) {
      throw new Error('Validation: redirectUrl must be a valid URL');
    }
    if (sessionId && sessionId.length > 128) {
      throw new Error('Validation: sessionId is too large (max 128 characters)');
    }

    const url = apiUrl + '/v1/api/authorized/signicat/' + encodeURIComponent(redirectUrl);

    const options = { ...axiosOptions };
    options.params = { sessionId };
    options.headers = { 'Authorization': 'Bearer ' + config.authenticationToken };

    const response = await axios.get(url, options);

    return helpers.formatAxiosResponse(response);
  }

  async function getInvoice(invoiceId) {
    helpers.checkAuthentication(config);
    if (!invoiceId || invoiceId.length < 7 || invoiceId.length > 14) {
      throw new Error('Validation: invoiceId is not valid');
    }

    const url = apiUrl + '/v1/api/authorized/invoices/' + invoiceId;
    const options = { ... axiosOptions };
    options.headers = { 'Authorization': 'Bearer ' + config.authenticationToken };

    const response = await axios.get(url, options);
    const format = helpers.formatAxiosResponse(response);

    return {
      invoice: format,
      invoicingClient: format.invoicingClient
    };
  }

  async function createStandardInvoice(invoice, invoicingClient) {
    return await createInvoice(invoice, invoicingClient, false);
  }

  async function createFinanceInvoice(invoice, invoicingClient) {
    return await createInvoice(invoice, invoicingClient, true);
  }

  async function createInvoice(invoice, invoicingClient, isFinance = false) {
    helpers.checkAuthentication(config);
    // Todo validate mandatory/optional fields
    if (!invoice || typeof (invoice) !== 'object') {
      throw new Error('Validation: invoice object parameter is mandatory');
    }
    if (!invoicingClient) {
      throw new Error('Validation: invoicingClient parameter is mandatory');
    }
    if (typeof invoicingClient !== 'string' && typeof invoicingClient !== 'object') {
      throw new Error('Validation: invoicingClient must be a valid id or a client object');
    }

    const url = apiUrl + '/v1/api/authorized/invoices';
    const options = { ... axiosOptions };
    options.headers = { 'Authorization': 'Bearer ' + config.authenticationToken };

    const payload = invoice;
    payload.isFinanceType = isFinance;
    payload.invoicingClient = invoicingClient;
    const invoiceDataToken = helpers.generateToken(payload, config.apiKey);

    const body = { data: invoiceDataToken };
    const response = await axios.post(url, body, options);
    const format = helpers.formatAxiosResponse(response);

    return {
      invoice: format,
      invoicingClient: format.invoicingClient
    };
  }

  async function updateInvoice(invoiceId, invoice, invoicingClient) {
    helpers.checkAuthentication(config);
    if (!invoiceId || invoiceId.length < 7 || invoiceId.length > 14) {
      throw new Error('Validation: invoiceId is not valid');
    }
    if (!invoice || typeof (invoice) !== 'object') {
      throw new Error('Validation: invoice object parameter is mandatory');
    }
    if (!invoicingClient) {
      throw new Error('Validation: invoicingClient parameter is mandatory');
    }
    if (typeof invoicingClient !== 'string' && typeof invoicingClient !== 'object') {
      throw new Error('Validation: invoicingClient must be a valid id or a client object');
    }

    const url = apiUrl + '/v1/api/authorized/invoices/' + invoiceId;
    const options = { ...axiosOptions };
    options.headers = { 'Authorization': 'Bearer ' + config.authenticationToken };

    const payload = invoice;
    payload.invoicingClient = invoicingClient;
    const invoiceDataToken = helpers.generateToken(payload, config.apiKey);

    const body = { data: invoiceDataToken };
    const response = await axios.put(url, body, options);
    const format = helpers.formatAxiosResponse(response);

    return {
      invoice: format,
      invoicingClient: format.invoicingClient
    };
  }

  function createSecureformDataToken(data) {
    inputDataValidator.validateSecureformData(data);

    const secureformData = {
      order: data.order,
      products: data.products,
      shippingAddress: data.shippingAddress,
      consumer: data.consumer,
      callbacks: data.callbacks,
      returnUrls: data.returnUrls
    };

    return helpers.generateToken(secureformData, config.apiKey);
  }

  function getSecureformUrl(publicId) {
    inputDataValidator.validatePublicId(publicId);

    return apiUrl + '/v1/secureform/' + publicId;
  }

  function decodeMerchantCallback(dataToken) {
    if (!dataToken || !validator.isJWT(dataToken)) {
      throw new Error('Validation: input must be a valid JWT token');
    }

    return helpers.decodeToken(dataToken, config.apiKey);
  }

  return {
    apiUrl,
    authenticate,
    config,
    creditCheck,
    fraudCheck,
    getTupasUrl,
    getInvoice,
    createFinanceInvoice,
    createInvoice,
    createStandardInvoice,
    updateInvoice,
    createSecureformDataToken,
    getSecureformUrl,
    decodeMerchantCallback
  };
};