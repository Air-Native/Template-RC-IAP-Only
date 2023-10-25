/* eslint-disable */
import { 
    Alert,
    Vibration,
    StatusBar,
    Platform,
    PermissionsAndroid
} from "react-native";
import Share from 'react-native-share';
import InAppReview from 'react-native-in-app-review';

class NativeTools {
    constructor() {}

    alert(title, text) {
        Alert.alert(title, text);
    }

    vibration(seconds) {
        let ms = 1000;
        if (seconds === undefined || seconds === null) {
            Vibration.vibrate();
        } else {
            let duration = 1;

            if (typeof seconds === 'number') {
                duration = seconds;
            } else if (typeof seconds === 'string') {
                duration = parseInt(seconds);
            }

            Vibration.vibrate(duration * ms);
        }
    }

    share = (options) => {
        Share.open(options)
          .then((res) => {
            console.log(res);
          })
          .catch((err) => {
            err && console.log(err);
          });
    };

    setStatusBarColor = (
        color = '#000000',
        animated = true,
        barStyle = 'default',
        barAnimated = true
      ) => {
        /** Возвможные стили бара 'default', 'dark-content', 'light-content' */
        //console.log(barStyle);
        StatusBar.setBarStyle(barStyle, barAnimated);
        //StatusBar.setNetworkActivityIndicatorVisible();
        if (Platform.OS !== 'ios') {
          //ios не поддерживает изменения цвета
          if (color === undefined || color === null) {
            color = '#ffffff';
          }

          if (animated === undefined || animated === null) {
            animated = true;
          }
          StatusBar.setBackgroundColor(color, animated);
        } else if (color !== '#000000' && color !== null && color !== undefined) {
          this.setState({
            bgColor: color,
          });
        }
      };

      getOS = () => {
        return Platform.OS;
      };

      getPermissionsUser = async (permissionName) => {
        const PERMISSION_LIST = {
          location: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          read: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          camera: PermissionsAndroid.PERMISSIONS.CAMERA,
          write: PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        };

        try {
          if (!PERMISSION_LIST[permissionName]) {
            throw new Error("This permission can't be requested");
          }
          const currentPermissionStatus = await PermissionsAndroid.check(
            PERMISSION_LIST[permissionName]
          );
          if (currentPermissionStatus) {
            return {
              currentPermissionStatus: currentPermissionStatus,
              reason: 'denied',
            };
          }
          const response = await PermissionsAndroid.request(
            PERMISSION_LIST[permissionName]
          );
          return {
            currentPermissionStatus: currentPermissionStatus,
            reason: response,
          };
        } catch (error) {
          Alert.alert('Get permission error: ', error.message);
        }
      };

      getPermissionsOnLaunch = async () => {
        let read = PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        );
        let camera = PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );
        let write = PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
        );
        let location = PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
    
        if (
          read !== PermissionsAndroid.RESULTS.GRANDTED &&
          read !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        ) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
          );
        }
    
        if (
          write !== PermissionsAndroid.RESULTS.GRANDTED &&
          write !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        ) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
          );
        }
    
        if (
          camera !== PermissionsAndroid.RESULTS.GRANDTED &&
          camera !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        ) {
          await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CAMERA);
        }
    
        if (
          location !== PermissionsAndroid.RESULTS.GRANDTED &&
          location !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        ) {
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
        }
      };

    getReview = async () => {
        const reviewAvailable = InAppReview.isAvailable();
        if (reviewAvailable) {
            InAppReview.RequestInAppReview()
              .then((hasFlowFinishedSuccessfully) => {
                  console.log("InAppReview Successfully: ", hasFlowFinishedSuccessfully);
              })
              .catch((error) => {
                  console.warn("InAppReview Error: ", error);
              });
        }
    }
}

module.exports = NativeTools