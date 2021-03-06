const azureLogic = require('./azure.logic');
const azureSubscriptionEvents = require('../subscriptions/azure');

class AzureController {
    static async initialize(request, response) {
        const { token } = request.body;
        const result = await azureLogic.resolveToken(token, request.user);
        response.json(result);
    }

    async handlerAzureHook(request, response) {
        const { action, ...data } = request.body;

        switch (action) {
            case 'Unsubscribe':
                await azureSubscriptionEvents.unsubscribe(data);
                break;
            case 'ChangePlan':
                await azureSubscriptionEvents.changePlan(data);
                break;
        }
        response.send('ok');
    }

    async publishUsage(request, response) {
        const {
            resourceId, quantity, dimension, planId
        } = request.body;
        const result = await azureLogic.publishUsage({
            resourceId, quantity, dimension, planId
        });
        response.send(result);
    }
}

module.exports = AzureController;
