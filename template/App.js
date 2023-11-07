/* eslint-disable */
import React, { Component } from 'react';
import {
	BackHandler,
	StyleSheet,
	View,
	Platform,
	StatusBar,
	SafeAreaView,
	Linking,
	AppState,
} from 'react-native';

import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import createInvoke from 'react-native-webview-invoke/native';

import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import RNBootSplash from 'react-native-bootsplash';
import { URL } from 'react-native-url-polyfill';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

import NoInternetScreen from './components/NoInternetScreen';
import BootSplash from './components/Bootsplash';

import OneSignal from './controllers/OneSignal';
import Player from './controllers/Player';
import NativeTools from './controllers/NativeTools';
import GeoLocation from './controllers/GeoLocation';
import RevenueCat from './controllers/RevenueCat';
import Security from './controllers/Security';

import * as Config from './app.json';

OneSignal.init();
const SecurityInstance = new Security();


const USER_AGENT =
	'Mozilla/5.0 (Linux; Android 5.0.1; Nokia 1000 wifi Build/GRK39F) AppleWebKit/533.12 (KHTML, like Gecko)  Chrome/50.0.1011.255 Mobile Safari/600.7';

if (Config.appUI.fullScreen) {
	StatusBar.setTranslucent(true);
}

if (Config.appUI.showStatusBar) {
	StatusBar.setHidden(false);
	StatusBar.setBackgroundColor('#FFFFFF00');
} else {
	StatusBar.setHidden(true);
}

if (Platform.OS === 'android') {
	changeNavigationBarColor('#000000', true, false);
}

const ParentElement = Config.appUI.fullScreen ? View : SafeAreaView;

const INJECTED_JAVASCRIPT = '';

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			isConnected: true,
			firstLoad: true,
			headerColor: '#FFC529',
			headerVisible: false,
			bgColor: '#FFF',
			centerButtonFN: function () {},
			rightButtonFN: function () {},
			appState: AppState.currentState,
			currentURL: Config.appUrl,
		};
	}

	componentDidMount() {
		if (RevenueCat) {
			// Включаем логи для отладки
			RevenueCat.enableDebugLogs();

			this.invoke
				.define('logInUser', RevenueCat.logInUser)
				.define('checkUser', RevenueCat.userHasActiveSubscriptions);
		}

		/** Player */
		Player.setupPlayer();

		this.invoke
			.define('play', Player.play)
			.define('pause', Player.pause)
			.define('addToQueue', Player.addToQueue)
			.define('setQueue', Player.setQueue)
			.define('playNext', Player.playNext)
			.define('playPrevious', Player.playPrevious)
			.define('setVolume', Player.setVolume)
			.define('setRepeatMode', Player.setRepeatMode)
			.define('getCurrentTrack', Player.getCurrentTrack)
			.define('getCurrentState', Player.getCurrentState);
		/** End player */

		/** Tools */
		this.invoke
			.define('vibration', NativeTools.vibration)
			.define('alertWord', NativeTools.alert)
			.define('share', NativeTools.share)
			.define('setStatusBarColor', NativeTools.setStatusBarColor)
			.define('getDeviceOS', NativeTools.getOS)
			.define('getPermissionsUser', NativeTools.getPermissionsUser)
			.define('getReview', NativeTools.getReview);
		/** End tools */

		this.invoke.define('biometrycScan', Security.startScanner);
		this.invoke.define('stopScaner', Security.stopScanner);

		/** OneSignal */
		this.invoke.define('oneSignalGetId', OneSignal.getDeviceId);
		this.invoke.define('showPrompt', OneSignal.showPrompt);

		this.invoke.define(
			'startLocationTracking',
			GeoLocation.startLocationTracking
		);
		this.invoke.define(
			'stopLocationTracking',
			GeoLocation.stopLocationTracking
		);

		NetInfo.addEventListener((state) => {
			this.setState({
				isConnected: state.isConnected,
			});
			this.render();
		});

		Linking.addEventListener('url', ({ url }) => {
			if (this.webview) {
				this.webview.injectJavaScript(
					`window.location.href = "${url.replace(
						Config.scheme,
						'https://'
					)}"`
				);
			}
		});

		this.appStateChecker = AppState.addEventListener(
			'change',
			(newState) => {
				if (
					this.state.appState.match(/inactive|background/) &&
					newState === 'active'
				) {
					this.triggerEvent('loaded_from_background');
				}

				this.setState({
					appState: newState,
				});
			}
		);

		BackHandler.addEventListener('hardwareBackPress', this.backAction);
	}

	componentWillUnmount() {
		this.appStateChecker.remove();
	}

	/** Функция для отключения Splash Scree */
	firstLoadEnd = () => {
		if (this.state.firstLoad) {
			this.setState({
				firstLoad: false,
				rightButtonFN: this.triggerRightButton,
				centerButtonFN: this.triggerCenterButton,
			}); //Указываем что первая загрузка была и более сплэш скрин нам не нужен
			RNBootSplash.hide(); // Отключаем сплэш скрин
			Linking.getInitialURL().then((url) => {
				if (url) {
					this.webview.injectJavaScript(
						`window.location.href = "${url.replace(
							Config.scheme,
							'https://'
						)}"`
					);
				}
			});
		}
	};

	toggleHeaderButton = () => {
		this.setState({
			headerVisible: !this.state.headerVisible,
		});
	};

	setHeaderButtonColor = (color) => {
		this.setState({
			headerColor: color,
		});
	};

	backAction = (e) => {
		if (this.webview && this.state.canGoBack) this.webview.goBack();
		this.triggerEvent('back_button');
		return true;
	};

  invoke = createInvoke(() => this.webview);

	/** Извлекаем прямо из бабла функции, тут же можно прописать загрузку файлов в bubble */
	publishState = this.invoke.bind('publishState');
	triggerEvent = this.invoke.bind('triggerEvent');

	triggerRightButton = this.invoke.bind('rightButton');
	triggerCenterButton = this.invoke.bind('centerButton');

	loadEndFunction = () => {
		/** Функции для выполнения при полной загрузке страницы в WebView. Скорее всего RN Loader будет отключаться отсюда */
		if (Platform.OS !== 'ios') {
			NativeTools.getPermissionsOnLaunch();
		}
		this.firstLoadEnd();
		this.publishState('platform_os', Platform.OS); //Возвращаем операционку

		Player.bindFunctions(this.invoke);
		SecurityInstance.bindFunctions(this.invoke);
		GeoLocation.bindFunctions(this.invoke);
	};

	

	onContentProcessDidTerminate = () => this.webview.reload();

	handleWebViewNavigationStateChange = (navState) => {
		const { url } = navState;
		if (!url) {
			return;
		}

		if (
			!url.includes(new URL(Config.appUrl).origin) &&
			!url.includes(Config.scheme) &&
			!url.includes('auth') &&
			!url.includes('.bubbleapps.io/api/1.1/oauth_redirect')
		) {
			this.webview.stopLoading();
			InAppBrowser.isAvailable().then((available) => {
				if (available) {
					InAppBrowser.open(url, {
						modalPresentationStyle: 'fullScreen',
					});
				} else {
					Linking.canOpenURL(url).then((canOpen) => {
						if (canOpen) {
							Linking.openURL(url);
						}
					});
				}
			});
		} else {
			this.setState({
				currentURL: url,
			});
		}
	};

	render() {
		if (this.state.isConnected) {
			return (
				<ParentElement
					style={{
						...styles.safeareastyle,
						backgroundColor: this.state.bgColor,
					}}
				>
					<WebView
						useWebKit
						injectedJavaScript={INJECTED_JAVASCRIPT}
						ref={(ref) => (this.webview = ref)}
						onContentProcessDidTerminate={
							this.onContentProcessDidTerminate
						}
						onNavigationStateChange={
							this.handleWebViewNavigationStateChange
						}
						decelerationRate={'normal'}
						onMessage={this.invoke.listener}
						allowsBackForwardNavigationGestures={true}
						allowsInlineMediaPlayback={true}
						startInLoadingState={true}
						sharedCookiesEnabled={true}
						userAgent={USER_AGENT}
						renderLoading={ () => <BootSplash />}
						source={{
							uri: Config.appUrl,
						}}
						onLoadEnd={this.loadEndFunction}
					/>
				</ParentElement>
			);
		} else {
			return (
				<NoInternetScreen />
			);
		}
	}
}

const styles = StyleSheet.create({
	safeareastyle: {
		flex: 1,
	},
	imagestyle: {
		resizeMode: 'contain',
		width: '100%',
	}
});

export default App;
