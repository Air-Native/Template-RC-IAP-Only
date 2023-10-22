/* eslint-disable */
import { Platform } from "react-native";
import Purchases from "react-native-purchases";

/**
 * RevenueCat
 * @AppleApiKey: string
 * @GoogleApiKey: string
 */
class RevenueCat {
    constructor(appleApiKey, googleApiKey) {
        this.apiKey = (Platform.OS === 'android') ? googleApiKey : appleApiKey;
        this.configured = false;
        this.userId = null;
        this.customerInfo = null;
    }

    enableDebugLogs() {
        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }

    async setup() {
        try {
            await Purchases.configure({ apiKey: this.apiKey });
            this.configured = true;
        } catch (e) {
            console.error(e);
        }
    }

    async logInUser(userId) {
        this.userId = userId;
        await Purchases.logIn(userId);
    }

    async checkSubscriptionsStatus() {
        try {
            this.customerInfo = await Purchases.getCustomerInfo();
            console.log('Customer Info', this.customerInfo);
            // access latest customerInfo
          } catch (e) {
           // Error fetching customer info
           console.error(e);
          }
    }

    async userHasActiveSubscriptions() {
        await this.checkSubscriptionsStatus();
        return Object.entries(customerInfo.entitlements.active).length
    }

    async getOfferings() {
        try {
            const offerings = await Purchases.getOfferings();
            console.log(offerings)
            return offerings;
        } catch (e) {
            console.error(e);
        }
    }

    async purchase(offering, productId) {
        try {
            await Purchases.purchaseStoreProduct(productId);
        } catch (e) {
            console.error(e);
        }
    }

}

module.exports = RevenueCat;