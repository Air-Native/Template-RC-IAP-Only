/* eslint-disable */
import { Platform } from "react-native";
import Purchases from "react-native-purchases";

import * as Config from '../app.json';

const apiKey = (Platform.OS === 'android') ? Config.keys.revenueCatGoogleApiKey : Config.keys.revenueCatAppleApiKey;
let configured = false;
let userId = null;
let customerInfo = null;

const enableDebugLogs = () => {
    Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
}

const logInUser = async (appUserID) => {
    try {
        console.log('Log IN User', appUserID)
        userId = appUserID;
        Purchases.configure({ apiKey, appUserID });
        configured = true;
    } catch (error) {
        console.error('Revenue Cat: ', error.message)
    }
}

const purchase = async (offeringName, productName) => {
    try {
        console.info('USER_ID', userId)
        const offerings = await Purchases.getOfferings();
        console.log('All offerings', offerings.all)
        const selectedOffering = offerings.all?.[offeringName]

        if (!selectedOffering?.availablePackages?.length) throw new Error('Wrong offering name')
        console.info('Selected offering:', JSON.stringify(selectedOffering.availablePackages))

        const selectedProduct = selectedOffering.availablePackages.find( product => product.product.identifier === productName)
        if (!selectedProduct) throw new Error('Wrong product name')

        console.info('Selected product: ', selectedProduct)
        const {customerInfo, productIdentifier} = await Purchases.purchasePackage(selectedProduct);
        console.log('Customer Info:', customerInfo)
    } catch (e) {
        console.error('Purchase error: ', e);
    }
}

const userHasActiveSubscriptions = async (userId) => {
    customerInfo = await Purchases.getCustomerInfo();
    console.log('Customer Info', customerInfo)
    return !!Object.entries(customerInfo.entitlements.active).length
}

module.exports = {
    enableDebugLogs,
    logInUser,
    purchase,
    userHasActiveSubscriptions
};