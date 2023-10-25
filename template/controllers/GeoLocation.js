/* eslint-disable */
import Geolocation from '@react-native-community/geolocation';

class GeoLocation {
    constructor() {
        this.invoke = null;
        this.watchID = null;
        this.event = (name) => console.warn('Function is not defined');
		    this.state = (name, value) => console.warn('Function is not defined');
    }

    geoSuccess = (position) => {
        this.state('current_position', {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });

        this.state('speed', position.coords.speed); // Скорость движения
        this.state('heading', position.coords.heading); // Направление
        this.state('altitude', position.coords.altitude); // Высота
      };

      geoError = (error) => {
        this.state('current_position', "");
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
        this.watchID = Geolocation.watchPosition(this.geoSuccess, this.geoError, {
          enableHighAccuracy: hightAccuracy, // Если true - GPS, иначе WIFI
          distanceFilter: distance, //Дистанция после изменения которой снова можно запрашивать геолокация ( вроде в метрах )
          maximumAge: maximumAge, //Время жизни кэша позиции в миллисекундах
        });
      };

      stopLocationTracking = () => {
        if (this.state.watchID !== null) {
          Geolocation.clearWatch(this.state.watchID); //Работает как очистка interval
        }

        this.watchID = null;
      };

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
	}
}

module.exports = GeoLocation;