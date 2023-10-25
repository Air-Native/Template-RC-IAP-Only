/* eslint-disable */
import React, { Component } from 'react';
import {
  BackHandler,
  StyleSheet,
  View,
  Platform,
  StatusBar,
  Image,
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

import Notifications from './controllers/OneSignal'
import Player from './controllers/Player'
import NativeTools from './controllers/NativeTools'
import GeoLocation from './controllers/GeoLocation'
import RevenueCat from './controllers/RevenueCat'
import Security from './controllers/Security'
// import AirNativeContacts from './controllers/Contacts'

import * as Config from './app.json'


const OneSignal = new Notifications(Config.keys.oneSignalAppId)
const PlayerInstance = new Player()
const Tools = new NativeTools()
const Location = new GeoLocation()
const SecurityInstance = new Security()

/** IN-APP Purchase */
const Purchases = new RevenueCat(Config.keys.revenueCatAppleApiKey, Config.keys.revenueCatGoogleApiKey)

const USER_AGENT =
"Mozilla/5.0 (Linux; Android 5.0.1; Nokia 1000 wifi Build/GRK39F) AppleWebKit/533.12 (KHTML, like Gecko)  Chrome/50.0.1011.255 Mobile Safari/600.7";


if (Config.appUI.fullScreen) {
  StatusBar.setTranslucent(true); //если нужно чтоб приложение на android было под status bar -> true
}

if (Config.appUI.showStatusBar) {
  StatusBar.setHidden(false);
  StatusBar.setBackgroundColor('#FFFFFF00');
} else {
  StatusBar.setHidden(true);
}

if (Platform.OS === "android") {
  /**
   * color
   * white icons? => true/false, if true -> icons white color
   * animated? => animate color change
   */
  changeNavigationBarColor("#000000", true, false);
}

const ParentElement = (Config.appUI.fullScreen) ? View : SafeAreaView;

const INJECTED_JAVASCRIPT = "";

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
      Purchases.enableDebugLogs();

      this.invoke
        .define('logInUser', Purchases.logInUser)
        .define('checkUser', Purchases.userHasActiveSubscriptions);

    }

    if (AirNativeContacts) {
      this.invoke.define('getContacts', new AirNativeContacts()?.getContacts);
    }

    /** Player */
    PlayerInstance.setupPlayer()

    this.invoke
      .define("play", PlayerInstance.play)
      .define("pause", PlayerInstance.pause)
      .define("addToQueue", PlayerInstance.addToQueue)
      .define("setQueue", PlayerInstance.setQueue)
      .define("playNext", PlayerInstance.playNext)
      .define("playPrevious", PlayerInstance.playPrevious)
      .define("setVolume", PlayerInstance.setVolume)
      .define("setRepeatMode", PlayerInstance.setRepeatMode)
      .define("getCurrentTrack", PlayerInstance.getCurrentTrack)
      .define("getCurrentState", PlayerInstance.getCurrentState);
    /** End player */

    /** Tools */
    this.invoke
      .define('vibration', Tools.vibration)
      .define('alertWord', Tools.alert)
      .define('share', Tools.share)
      .define('setStatusBarColor', Tools.setStatusBarColor)
      .define('getDeviceOS', Tools.getOS)
      .define('getPermissionsUser', Tools.getPermissionsUser)
      .define('getReview', Tools.getReview);

    /** End tools */

    this.invoke.define('biometrycScan', Location.startScanner);
    this.invoke.define('stopScaner', Location.stopScanner);


    /** OneSignal */
    this.invoke.define('oneSignalGetId', OneSignal.getDeviceId);
    this.invoke.define('showPrompt', OneSignal.showPrompt);


    this.invoke.define('startLocationTracking', Location.startLocationTracking);
    this.invoke.define('stopLocationTracking', Location.stopLocationTracking);

    NetInfo.addEventListener((state) => {
      this.setState({
        isConnected: state.isConnected,
      });
      this.render();
    });

    Linking.addEventListener('url', ({ url }) => {
      if (this.webview) {
        this.webview.injectJavaScript(
          `window.location.href = "${url.replace(Config.scheme, 'https://')}"`
        );
      }
    });

    this.appStateChecker = AppState.addEventListener('change', (newState) => {
      if (
        this.state.appState.match(/inactive|background/) &&
        newState === 'active'
      ) {
        this.triggerEvent('loaded_from_background');
      }

      this.setState({
        appState: newState,
      });
    });


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
            `window.location.href = "${url.replace(Config.scheme, 'https://')}"`
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
    if ( this.webview && this.state.canGoBack ) this.webview.goBack();
    this.triggerEvent('back_button');
    return true;
  };

  /** Извлекаем прямо из бабла функции, тут же можно прописать загрузку файлов в bubble */
  publishState = this.invoke.bind('publishState');
  triggerEvent = this.invoke.bind('triggerEvent');

  triggerRightButton = this.invoke.bind('rightButton');
  triggerCenterButton = this.invoke.bind('centerButton');

  loadEndFunction = () => {
    /** Функции для выполнения при полной загрузке страницы в WebView. Скорее всего RN Loader будет отключаться отсюда */
    if (Platform.OS !== 'ios') {
      Tools.getPermissionsOnLaunch();
    }
    this.firstLoadEnd();
    this.publishState('platform_os', Platform.OS); //Возвращаем операционку

    PlayerInstance.bindFunctions(this.invoke)
    SecurityInstance.bindFunctions(this.invoke)
    Location.bindFunctions(this.invoke)
  };

  invoke = createInvoke(() => this.webview);

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
              onContentProcessDidTerminate={this.onContentProcessDidTerminate}
              onNavigationStateChange={this.handleWebViewNavigationStateChange}
              decelerationRate={'normal'}
              onMessage={this.invoke.listener}
              allowsBackForwardNavigationGestures={true}
              allowsInlineMediaPlayback={true}
              startInLoadingState={true}
              sharedCookiesEnabled={true}
              userAgent={USER_AGENT}
              renderLoading={() => {
                return (
                  <View
                    style={{
                      backgroundColor: Config.bootsplash.backgroundColor, //Bootsplash color
                      height: '100%',
                      width: '100%',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Image
                      style={{
                        width: Config.bootsplash.logoWidth,
                        resizeMode: Config.bootsplash.resizeMode, //Bootsplash resizeMode
                      }}
                      source={require('./sources/boot.png')} //Bootsplash image
                    />
                  </View>
                );
              }}
              source={{
                uri: Config.appUrl,
              }}
              onLoadEnd={this.loadEndFunction}
            />
          </ParentElement>
        );

    } else {
        return (
          <View style={styles.container}>
            <Image
              source={require('./sources/boot.png')} // You should add your own image
              style={styles.image}
              onLoadEnd={this.firstLoadEnd()}
            />
            <Text style={styles.text}>No Internet Connection</Text>
            <Text style={styles.description}>Please check your internet connection and try again.</Text>
        </View>
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
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default App;
