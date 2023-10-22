/* eslint-disable */
import React, { Component } from 'react';
import {
  Alert,
  BackHandler,
  StyleSheet,
  View,
  Platform,
  PermissionsAndroid,
  StatusBar,
  Image,
  SafeAreaView,
  Linking,
  AppState,
} from 'react-native';

import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';
import createInvoke from 'react-native-webview-invoke/native';
import FingerprintScanner from 'react-native-fingerprint-scanner';

import { InAppBrowser } from 'react-native-inappbrowser-reborn';
import Geolocation from '@react-native-community/geolocation';
import RNBootSplash from 'react-native-bootsplash';
import { URL } from 'react-native-url-polyfill';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

import Player from './controllers/Player'

const PlayerInstance = new Player()
const Tools = new Tools()

/** OneSignal */
import Notifications from './controllers/OneSignal'
const OneSignal = new Notifications('0675c400-8062-45e2-8ed3-0fbb862a0ef6')

/** Contacts */
// import AirNativeContacts from './controllers/Contacts'

/** IN-APP Purchase */
import RevenueCat from './controllers/RevenueCat';
const RC_APPLE_API_KEY = 'appl_bunuZXmPvwChTVBROVtoiqtFFSv';
const RC_GOOGLE_API_KEY = 'goog_WabpZPfHxvcVzjbvgaARzHMZoYB';
const Purchases = new RevenueCat(RC_APPLE_API_KEY, RC_GOOGLE_API_KEY)


/** Если поставить
 *  setFullscreenWithoutBar = true
 *  будет фулскрин приложение без шторки
 */
const setFullscreenWithoutBar = false;

/** Если поставить
 *  setFullscreenWithBar = true
 *  будет фулскрин приложение с прозрачной шторкой
 */
const setFullscreenWithBar = false;
const USER_AGENT =
"Mozilla/5.0 (Linux; Android 5.0.1; Nokia 1000 wifi Build/GRK39F) AppleWebKit/533.12 (KHTML, like Gecko)  Chrome/50.0.1011.255 Mobile Safari/600.7";

/** Ссылка на приложение юзера */
const userURL = 'https://easyhorse.co.uk/zqtest';

/** Уникальная схема для приложения юзера, тут надо использовать то же самое название что при создании схемы */
const scheme = 'easyhorseapp://';

/** Мы эмулируем бутсплэш, для этого берем иконку и делаем такой же фон как у бутсплэша */
const bootsplashColor = '#FFFFFF';

/** Размеры иконки бутсплэша */
const logoWidth = 200;


if (setFullscreenWithoutBar || setFullscreenWithBar) {
  StatusBar.setTranslucent(true); //если нужно чтоб приложение на android было под status bar -> true
}

if (setFullscreenWithoutBar) {
  StatusBar.setHidden(true);
}

if (setFullscreenWithBar) {
  StatusBar.setHidden(false);
  StatusBar.setBackgroundColor('#FFFFFF00');
}

if (Platform.OS === "android") {
  /**
   * color
   * white icons? => true/false, if true -> icons white color
   * animated? => animate color change
   */
  changeNavigationBarColor("#000000", true, false);
}

ParentElement = (setFullscreenWithoutBar || setFullscreenWithBar) ? View : SafeAreaView;

const INJECTED_JAVASCRIPT = "";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isConnected: true,
      watchID: null,
      firstLoad: true,
      headerColor: '#FFC529',
      headerVisible: false,
      bgColor: '#FFF',
      centerButtonFN: function () {},
      rightButtonFN: function () {},
      appState: AppState.currentState,
      currentURL: userURL,
    };
  }

  componentDidMount() {
    if (RevenueCat) {
      // Включаем логи для отладки
      Purchases.enableDebugLogs();

      this.invoke
        .define('logInUser', this.state.Purchases.logInUser)
        .define('checkUser', this.state.Purchases.userHasActiveSubscriptions);

    }

    if (AirNativeContacts) {
      this.invoke.define('getContacts', this.getContacts);
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

    Linking.addEventListener('url', ({ url }) => {
      if (this.webview) {
        this.webview.injectJavaScript(
          `window.location.href = "${url.replace(scheme, 'https://')}"`
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


    this.invoke
      .define('vibration', Tools.vibration)
      .define('alertWord', Tools.alert)
      .define('share', Tools.share)
      .define('setStatusBarColor', Tools.setStatusBarColor)
      .define('getDeviceOS', Tools.getOS)
      .define('getPermissionsUser', Tools.getPermissionsUser);

    /** End tools */

    this.invoke.define('biometrycScan', this.authCurrent);
    this.invoke.define('stopScaner', this.stopScaner);


    this.invoke.define('oneSignalGetId', OneSignal.getDeviceId);
    this.invoke.define('showPrompt', OneSignal.showPrompt);

    // FIXME: Deprecated?
    this.invoke.define('camera', this.getCamera);

    this.invoke.define('startLocationTracking', this.startLocationTracking);
    this.invoke.define('stopLocationTracking', this.stopLocationTracking);

    NetInfo.addEventListener((state) => {
      this.setState({
        isConnected: state.isConnected,
      });
      this.render();
    });
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
            `window.location.href = "${url.replace(scheme, 'https://')}"`
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


  /** Geodata Settings */
  geoSuccess = (position) => {
    this.publishState('current_position', {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    });

    this.publishState('speed', position.coords.speed); // Скорость движения
    this.publishState('heading', position.coords.heading); // Направление
    this.publishState('altitude', position.coords.altitude); // Высота
  };

  geoError = (error) => {
    this.publishState('current_position', "");
    //Alert.alert('Geo Error:', `${JSON.stringify(error)}`);
    /** Нужно придумать что-то для вывода ошибок, а то бесит через алёрты это делать
     * Может быть тригерить евент "Ошибка" и в стэйт передавать инфо о ошибке.
     */
  };

  startLocationTracking = (
    hightAccuracy = true,
    distance = 5,
    maximumAge = 30
  ) => {
    /** Перестраховка значений по умолчнанию */
    if (hightAccuracy === null || hightAccuracy === undefined) {
      hightAccuracy = true;
    }
    if (distance === null || distance === undefined) {
      distance = 5;
    }
    if (maximumAge === null || maximumAge === undefined) {
      maximumAge = 30;
    }

    Geolocation.getCurrentPosition(this.geoSuccess, this.geoError, {
      enableHighAccuracy: hightAccuracy, // Если true - GPS, иначе WIFI
    });
    /** watchID это уникальный ID геосессии, по нему можно прекратить геосессию */
    let watchID = Geolocation.watchPosition(this.geoSuccess, this.geoError, {
      enableHighAccuracy: hightAccuracy, // Если true - GPS, иначе WIFI
      distanceFilter: distance, //Дистанция после изменения которой снова можно запрашивать геолокация ( вроде в метрах )
      maximumAge: maximumAge, //Время жизни кэша позиции в миллисекундах
    });

    this.setState({
      watchID: watchID,
    });
  };

  stopLocationTracking = () => {
    if (this.state.watchID !== null) {
      Geolocation.clearWatch(this.state.watchID); //Работает как очистка interval
    }

    this.setState({
      watchID: null,
    });
  };

  /** End geodata settings */


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
            Alert.alert('Fingerprint Authentication', error.message);
            resolve(false);
          });
      } catch (err) {
        resolve(false);
      }
    });
  };


  stopScaner = () => {
    FingerprintScanner.release();
  };

  authLegacy = () => {
    FingerprintScanner.authenticate({
      title: 'Log in with Biometrics',
    })
      .then(() => {
        this.triggerByometrycs(true);
      })
      .catch((error) => {
        this.triggerByometrycs(false);
      });
  };

  backAction = (e) => {
    if ( this.webview && this.state.canGoBack ) this.webview.goBack();
    this.triggerEvent('back_button');
    return true;
  };

  invoke = createInvoke(() => this.webview);

  biometrycScan = () => {
    if (Platform.OS === 'android' && !this.requiresLegacyAuthentication()) {
      this.authLegacy();
    } else {
      this.authCurrent();
    }
  };

  triggerByometrycs = this.invoke.bind('triggerScanResult');
  /** Извлекаем прямо из бабла функции, тут же можно прописать загрузку файлов в bubble */
  publishState = this.invoke.bind('publishState');
  triggerEvent = this.invoke.bind('triggerEvent');
  canUploadFile = this.invoke.bind('canUploadFile');
  uploadFile = this.invoke.bind('uploadFile');

  triggerRightButton = this.invoke.bind('rightButton');
  triggerCenterButton = this.invoke.bind('centerButton');

  loadEndFunction = () => {
    /** Функции для выполнения при полной загрузке страницы в WebView. Скорее всего RN Loader будет отключаться отсюда */
    if (Platform.OS !== 'ios') {
      Tools.getPermissionsOnLaunch();
    }
    this.firstLoadEnd();
    PlayerInstance.bindFunctions(this.invoke)
    this.publishState('platform_os', Platform.OS); //Возвращаем операционку
  };

  runFunction = (fun) => {
    if (typeof fun === 'function') {
      fun();
    }
  };

  onContentProcessDidTerminate = () => this.webview.reload();

  handleWebViewNavigationStateChange = (navState) => {
    const { url } = navState;
    if (!url) {
      return;
    }

    if (
      !url.includes(new URL(userURL).origin) &&
      !url.includes(scheme) &&
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
                      backgroundColor: bootsplashColor, //Bootsplash color
                      height: '100%',
                      width: '100%',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Image
                      style={{
                        width: logoWidth,
                        height: logoWidth,
                      }}
                      source={require('./sources/boot.png')} //Bootsplash image
                    />
                  </View>
                );
              }}
              source={{
                uri: userURL,
              }}
              onLoadEnd={this.loadEndFunction}
            />
          </ParentElement>
        );

    } else {
        return (
          <ParentElement>
            <Image
              source={require('./sources/no_internet.png')}
              style={styles.imagestyle}
              onLoadEnd={this.firstLoadEnd()}
            />
          </ParentElement>
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
});

export default App;
