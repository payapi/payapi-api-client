'use strict';

const axios = require('axios');
const jwt = require('jwt-simple');
const validator = require('validator');

const debug = require('debug')('payapi-api-client');
const stagUrl = 'https://staging-input.payapi.io';
const prodUrl = 'https://input.payapi.io';

const axiosOptions = {
  timeout: 10000,
  validateStatus: status => status >= 200 && status <= 503
};

function formatAxiosResponse(response) {
  if (response.status === 200) {
    return response.data;
  } else if (response.status === 401) {
    throw new Error('Unauthorized');
  } else if (response.status === 403) {
    throw new Error('Access denied');
  } else if (response.status === 404) {
    throw new Error('Resource not found');
  } else if (response.status >= 400 && response.status < 500) {
    throw new Error(response.data.error || response.data);
  } else {
    throw new Error('Unexpected status code received.');
  }
}

module.exports = function PayapiApiClient(config) {
  if (!config) {
    throw new Error('Configuration: missing constructor params');
  }
  if (config.isProd && typeof (config.isProd) !== 'boolean') {
    throw new Error('Configuration: isProd must be a boolean');
  }
  if (!config.apiKey) {
    throw new Error('Configuration: apiKey is mandatory');
  }
  if (!config.secret) {
    throw new Error('Configuration: secret is mandatory');
  }
  if (!config.password) {
    throw new Error('Configuration: password is mandatory');
  }
  let apiUrl = config.isProd ? prodUrl : stagUrl;

  // Allow development environment
  if (config.devUrl) {
    apiUrl = config.devUrl;
  }

  function checkAuthentication() {
    if (!config.authenticationToken) {
      throw new Error('You must do the authentication first');
    }
  }

  function generateAccessToken() {
    const payload = {
      apiKey: {
        key: config.apiKey,
        password: config.password
      }
    };
    return jwt.encode(payload, config.secret, 'HS512');
  }

  async function authenticate() {
    const token = generateAccessToken();

    const data = {
      key: config.apiKey,
      token: token
    };

    const response = await axios.post(apiUrl + '/v1/api/auth/login', data, axiosOptions);

    if (response.status === 200) {
      config.authenticationToken = response.data.token;
    }

    return formatAxiosResponse(response);
  }

  async function fraudCheck(params) {
    if (!params.ip) {
      throw new Error('Validation: ip is mandatory');
    }
    const body = params;
    body.authenticationToken = { token: config.authenticationToken };

    const url = apiUrl + '/v1/api/authorized/fraud/check/' + params.ip;

    const response = await axios.post(url, body, axiosOptions);

    return formatAxiosResponse(response);
  }

  async function creditCheck(ssn, amount, countryCode = 'FI', consumerNumber = 1) {
    checkAuthentication();

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

    return formatAxiosResponse(response);
  }

  async function getTupasUrl(redirectUrl, sessionId) {
    checkAuthentication();

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

    return formatAxiosResponse(response);
  }

  async function getInvoice(invoiceId) {
    checkAuthentication();
    if (!invoiceId || invoiceId.length < 7 || invoiceId.length > 14) {
      throw new Error('Validation: invoiceId is not valid');
    }

    const url = apiUrl + '/v1/api/authorized/invoices/' + invoiceId;
    const options = { ... axiosOptions };
    options.headers = { 'Authorization': 'Bearer ' + config.authenticationToken };

    const response = await axios.get(url, options);
    const format = formatAxiosResponse(response);

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
    checkAuthentication();
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
    const invoiceDataToken = jwt.encode(payload, config.apiKey, 'HS512');

    const body = { data: invoiceDataToken };
    const response = await axios.post(url, body, options);
    const format = formatAxiosResponse(response);

    return {
      invoice: format,
      invoicingClient: format.invoicingClient
    };
  }

  async function updateInvoice(invoiceId, invoice, invoicingClient) {
    checkAuthentication();
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
    const invoiceDataToken = jwt.encode(payload, config.apiKey, 'HS512');

    const body = { data: invoiceDataToken };
    const response = await axios.put(url, body, options);
    const format = formatAxiosResponse(response);

    return {
      invoice: format,
      invoicingClient: format.invoicingClient
    };
  }

  return {
    apiUrl,
    authenticate,
    config,
    creditCheck,
    fraudCheck,
    generateAccessToken,
    getTupasUrl,
    getInvoice,
    createFinanceInvoice,
    createInvoice,
    createStandardInvoice,
    updateInvoice
  };
};