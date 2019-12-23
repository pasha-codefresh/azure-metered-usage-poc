const controller = require('./azure.controller');

function createRoutes(app) {
    app.post('/api/azure/initialize', async (request, response, next) => {
        try {
            await controller.initialize(request, response);
            next();
        } catch (err) {
            next(err);
        }
    });
}

module.exports = {
    createRoutes
};
