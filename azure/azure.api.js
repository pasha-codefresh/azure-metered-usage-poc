/* jshint ignore:start */
const rp = require('request-promise');
const randomstring = require('randomstring');

const API_URI = 'https://marketplaceapi.microsoft.com/api/';
const API_VERSION = '2018-08-31';

class AzureApi {
    constructor() {
        this._authHeaders = {};

        this._call = this._call.bind(this);
    }

    static async getInstance() {
        const api = new AzureApi();
        await api.init();

        return api;
    }

    async init() {
        const { clientSecret, tenant, clientId } = await this._getAzureCredentials();
        const result = await rp({
            url: `https://login.microsoftonline.com/${tenant}/oauth2/token`,
            method: 'POST',
            form: {
                'Grant_type': 'client_credentials',
                'Client_id': clientId,
                'client_secret': clientSecret,
                'Resource': 'test',
            },
            json: true,
        });
        this._authHeaders = {
            'authorization': `Bearer ${result.access_token}`,
            'x-ms-correlationid': randomstring.generate(10),
        };
    }

    resolveSubscriptionByMarketplaceToken(marketPlaceToken) {
        return this._call({
            endpoint: '/saas/subscriptions/resolve',
            method: 'POST',
            headers: {
                'x-ms-marketplace-token': marketPlaceToken,
            },
        });
    }

    getSubscriptionById(id) {
        return this._call({
            endpoint: `/saas/subscriptions/${id}`,
        });
    }

    activateSubscriptionById(id, planId) {
        return this._call({
            endpoint: `/saas/subscriptions/${id}/activate`,
            method: 'POST',
            body: {
                planId,
            },
        });
    }

    publishUsage(usage) {
        return this._call({
            endpoint: `/usageEvent`,
            method: 'POST',
            body: {
                usage,
            },
        });
    }

    //TODO: add work with pagination
    async getAllSubscriptions() {
        const { subscriptions } = await this._call({
            endpoint: `/saas/subscriptions`,
        });

        return subscriptions;
    }

    async _getAzureCredentials() {
        const { body } = await this._call({
            endpoint: `/api/idp/idp_1`,
        });

        return body;
    }

    /**
     * Make api call to microsoft SaaS api
     * @param endpoint
     * @param qs
     * @param headers
     * @param method
     * @param body
     * @private
     */
    _call({ endpoint, qs, headers, method, body }) {
        return rp({
            method: method || 'GET',
            url: API_URI + endpoint,
            qs: {
                ...qs,
                'api-version': API_VERSION,
            },
            headers: {
                ...headers,
                ...this._authHeaders,
            },
            json: true,
            body,
        });
    }
}

module.exports = AzureApi;
