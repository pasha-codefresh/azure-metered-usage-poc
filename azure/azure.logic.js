const { SUBSCRIBED } = require('./azure.status');

const AzureApi = require('./azure.api');

const PACK_MAPPING = {
    'pro-small': 'small',
    'pro-medium': 'medium',
    'pro-large': 'large',
};

const AZURE_LOGIN_IDP_NAME = 'azure';

class AzureLogic {

    async publishUsage(usage) {
        const api = await AzureApi.getInstance();
        return api.publishUsage(usage)
    }

    async syncUserPackages(userId) {
        const api = await AzureApi.getInstance();
        const data = await api.getAllSubscriptions();
        const subscriptions = this._filterSubscriptions(data, {
            userId,
            status: SUBSCRIBED,
        });

        const packs = subscriptions.reduce((accum, item) => {
            if (!PACK_MAPPING.hasOwnProperty(item.planId)) {
                return accum;
            }
            const plan = PACK_MAPPING[item.planId];
            return {
                ...accum,
                [plan]: (accum[plan] || 0) + item.quantity,
            };
        }, {});

        const account = await accounts.getUserByIDPUserId(userId, AZURE_LOGIN_IDP_NAME);

        const totalPacks = _.reduce(packs, (result, value) => result + value, 0);

        if (totalPacks) {
            return this._subscribeAccountToPlan({ userPacks: packs, accountId: account._id });
        }
        return this._subscribeAccountToPlan({
            userPacks: { small: 1 },
            accountId: account._id,
        }, PLANS.BASIC_1);

    }

    async resolveToken(token, user) {
        const api = await AzureApi.getInstance();
        const { id: subscriptionId, planId } = await api.resolveSubscriptionByMarketplaceToken(token);
        const subscription = await api.getSubscriptionById(subscriptionId);
        await api.activateSubscriptionById(subscriptionId, planId);
        const userId = _.get(subscription, 'purchaser.objectId');
        logger.info(`Resolving subscription for user: ${userId}, planId: ${planId}, subscriptionId: ${subscriptionId}`);
        const sameUser = await this._isSameUser(userId, user);
        await this.syncUserPackages(userId);
        return {
            sameUser,
        };
    }

    async _isSameUser(azureUserId, user) {
        return user && !!_.find(user.logins, item => item.userId === azureUserId);
    }

    async _subscribeAccountToPlan({ userPacks, accountId }, type = PLANS.PRO_1) {
        const plan = plans.getPlanById(type);
        const { small, medium, large } = userPacks;

        plan.setPacks([
            this._getPack(packs.NAMES.SMALL, small),
            this._getPack(packs.NAMES.MEDIUM, medium),
            this._getPack(packs.NAMES.LARGE, large),
        ]);
        const account = await accounts.getAccountById(accountId);
        account.plan = plan;
        account.plan.azure = type === PLANS.PRO_1;
        account.plan.totalPrice = plan.calcTotalPrice();

        return account.save();
    }

    _getPack(name, amount) {
        return packs.buildPackForPredefinedType({
            name: name,
            amount: amount || 0,
        });
    }

    _filterSubscriptions(subscriptions, {
        userId,
        status,
    }) {
        return subscriptions.filter(item => {
                if (item.offerId !== config.applicationId) {
                    return false;
                }
                if (userId && _.get(item, 'purchaser.objectId') !== userId) {
                    return false;
                }
                if (status && item.saasSubscriptionStatus !== status) {
                    return false;
                }

                return true;
            },
        );
    }
}

module.exports = new AzureLogic();
