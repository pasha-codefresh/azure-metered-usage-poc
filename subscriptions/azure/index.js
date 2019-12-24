const AzureApi = require('../../azure/azure.api');
const AzureLogic = require('../../azure/azure.logic');
const _ = require('lodash');
const AzureStatus = require('../../     azure/azure.status');

class AzureSubscriptionEventsWebhook {
    async changePlan(data) {
        const { subscriptionId } = data;
        const api = await AzureApi.getInstance();
        const subscription = await api.getSubscriptionById(subscriptionId);
        const userId = _.get(subscription, 'purchaser.objectId');
        return AzureLogic.syncUserPackages(userId);
    }

    async unsubscribe(data) {
        const { subscriptionId } = data;
        const api = await AzureApi.getInstance();
        const subscription = await api.getSubscriptionById(subscriptionId);
        const userId = _.get(subscription, 'purchaser.objectId');
        if (subscription.saasSubscriptionStatus !== AzureStatus.UNSUBSCRIBED) {
            console.log(`Incorrect hook, subscription status not same as hook action`);
            return;
        }
        return AzureLogic.syncUserPackages(userId);
    }
}

module.exports = new AzureSubscriptionEventsWebhook();
