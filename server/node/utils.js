'use strict';

const config = require('./config');
module.exports = {
    getSupportedPaymentMethods: (country) => {
        let paymentsSupported = Object.keys(config.paymentMethodsAvailability).filter(pm => {
            return !config.paymentMethodsAvailability[pm].countries ||
                config.paymentMethodsAvailability[pm].countries.includes(country);
        });

        return paymentsSupported;
    }
}