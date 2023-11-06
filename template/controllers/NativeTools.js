/* eslint-disable */
import {
	Alert,
	Vibration,
	StatusBar,
	Platform,
	PermissionsAndroid,
} from 'react-native';
import Share from 'react-native-share';
import InAppReview from 'react-native-in-app-review';

const PERMISSION_LIST = {
    location: PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    read: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    camera: PermissionsAndroid.PERMISSIONS.CAMERA,
    write: PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
};

const BLOCKED_PERMISSIONS_STATUS = [PermissionsAndroid.RESULTS.GRANDTED, PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN]

const isNil = (val) => {
	return val === undefined || val === null;
};

const alert = (title = '', text = '') => {
	Alert.alert(title, text);
};

const vibration = (seconds) => {
	if (isNil(seconds)) {
		Vibration.vibrate();
	} else {
		let duration = 1;

		if (typeof seconds === 'number') {
			duration = seconds;
		} else if (typeof seconds === 'string') {
			duration = parseInt(seconds);
		}

		Vibration.vibrate(duration * 1000);
	}
};

const share = (options) => {
	Share.open(options);
};

const setStatusBarColor = (
	color = '#000000',
	animated = true,
	barStyle = 'default',
	barAnimated = true
) => {
	/** Возвможные стили бара 'default', 'dark-content', 'light-content' */
	StatusBar.setBarStyle(barStyle, barAnimated);
	if (Platform.OS !== 'ios') {
		if (isNil(color)) {
			color = '#ffffff';
		}

		if (isNil(animated)) {
			animated = true;
		}

		StatusBar.setBackgroundColor(color, animated);
	} else if (color !== '#000000' && !isNil(color)) {
		// TODO: Передавать стейт в APP
		this.setState({
			bgColor: color,
		});
	}
};

const getOS = () => {
	return Platform.OS;
};

// TODO: Проверить работу
const getPermissionsUser = async (permissionName) => {
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

const getPermissionsOnLaunch = async () => {
    for (const permission in PERMISSION_LIST) {
        const permissionName = PERMISSION_LIST[permission];

        const currentPermissionStatus = await PermissionsAndroid.check(permissionName);
        if (!currentPermissionStatus) {
            await PermissionsAndroid.request(permissionName);
        }
    }
};

const getReview = async () => {
	const reviewAvailable = InAppReview.isAvailable();
	if (reviewAvailable) {
		InAppReview.RequestInAppReview()
			.then((hasFlowFinishedSuccessfully) => {
				console.log(
					'InAppReview Successfully: ',
					hasFlowFinishedSuccessfully
				);
			})
			.catch((error) => {
				console.warn('InAppReview Error: ', error);
			});
	}
};

module.exports = {
    alert,
    vibration,
    share,
    setStatusBarColor,
    getOS,
    getPermissionsUser,
    getPermissionsOnLaunch,
    getReview,
};
