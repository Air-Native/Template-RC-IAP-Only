/* eslint-disable */
import OneSignal from 'react-native-onesignal';

class Notifications {
    constructor(appId){
        this.OneSignal = OneSignal;
        this.init(appId)
    }

    init(appId){
        this.OneSignal.setAppId(appId);
    }

    getDeviceId = async () => {
        var state = await this.OneSignal.getDeviceState();
        if (state.isSubscribed === false) {
          OneSignal.addTrigger('prompt_ios', 'true');
        }
        return state;
    };

    showPrompt = () => {
        OneSignal.getDeviceState().then((data) => {
          if (data.isSubscribed == false) {
            OneSignal.addTrigger('prompt_ios', 'true');
          }
        });
      };
}

module.exports = Notifications;