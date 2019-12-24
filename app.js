const express = require('express');
const app = express();

const controller = require('./azure/azure.controller');

app.get('/publish', async (request, response, next) => {
    try {
        await controller.publishUsage(request, response);
        next();
    } catch (err) {
        next(err);
    }
});

app.post('/api/azure/hook', async (request, response, next) => {
    try {
        await controller.handlerAzureHook(request, response);
        next();
    } catch (err) {
        next(err);
    }
});

app.listen(3000, function () {
    console.log('Example app listening on port 3000!');
});
