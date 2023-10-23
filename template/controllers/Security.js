/* eslint-disable */
import FingerprintScanner from 'react-native-fingerprint-scanner';

class Security {
	constructor() {
        this.event = (name) => console.warn('Function is not defined');
		this.state = (name, value) => console.warn('Function is not defined');
        this.triggerScanResult = (result) => console.warn('Function is not defined');
		this.invoke = null;
    }

	bindFunctions(invoke) {
		this.invoke = invoke;
		this.event = (name) => {
			const fn = this.invoke.bind('triggerEvent');
			fn(name);
		};
		this.state = (name, value) => {
			const fn = this.invoke.bind('publishState');
			fn(name, value);
		};

        this.triggerScanResult = (result) => {
            const fn = this.invoke.bind('triggerScanResult');
            fn(result);
        }
	}

	requiresLegacyAuthentication = () => {
		return Platform.Version < 23;
	};

	authCurrent = async (question = 'Log in with Biometrics') => {
		const params = {};
		if (Platform.OS === 'ios') {
			params.description = question;
		}
		if (Platform.OS === 'android') {
			params.title = question;
		}
		return await new Promise((resolve) => {
			try {
				FingerprintScanner.isSensorAvailable()
					.then(() => {
						FingerprintScanner.authenticate(params)
							.then(() => resolve(true))
							.catch((error) => {
								resolve(false);
							});
					})
					.catch((error) => {
						Alert.alert(
							'Fingerprint Authentication',
							error.message
						);
						resolve(false);
					});
			} catch (err) {
				resolve(false);
			}
		});
	};

	stopScanner = () => {
		FingerprintScanner.release();
	};

	authLegacy = () => {
		FingerprintScanner.authenticate({
			title: 'Log in with Biometrics',
		})
			.then(() => {
				this.triggerScanResult(true);
			})
			.catch((error) => {
				this.triggerScanResult(false);
			});
	};

	startScanner = () => {
		if (Platform.OS === 'android' && !this.requiresLegacyAuthentication()) {
			this.authLegacy();
		} else {
			this.authCurrent();
		}
	};
}

module.exports = Security;