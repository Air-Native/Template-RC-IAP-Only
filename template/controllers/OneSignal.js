/* eslint-disable */
import OneSignal from 'react-native-onesignal';
import * as Config from '../app.json';

let isInitialized = false;

const init = () => {
	try {
		const appId = Config?.keys?.oneSignalAppId;

		if (!appId) console.error('appId is not defined in app.json');

		OneSignal.setAppId(appId);
        isInitialized = true;
	} catch (error) {
		console.error('OneSignal:', error.message);
	}
};

const getDeviceId = async () => {
    if (!isInitialized) init();
    const state = await OneSignal.getDeviceState();
    if (state.isSubscribed === false) {
        OneSignal.addTrigger('prompt_ios', 'true');
    }
    return state;
}

const showPrompt = () => {
    if (!isInitialized) init();
    OneSignal.getDeviceState().then((data) => {
        if (data.isSubscribed == false) {
            OneSignal.addTrigger('prompt_ios', 'true');
        }
    });
}

module.exports = {
    init,
    getDeviceId,
    showPrompt,
};
