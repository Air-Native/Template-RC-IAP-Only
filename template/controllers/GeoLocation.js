/* eslint-disable */
import Geolocation from '@react-native-community/geolocation';

let invoke = null;
let watchID = null;
let event = (name) => console.warn('Function is not defined');
let state = (name, value) => console.warn('Function is not defined');

const startLocationTracking = (
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

	const geoSuccess = (position) => {
		state('current_position', {
			lat: position.coords.latitude,
			lng: position.coords.longitude,
		});

		state('speed', position.coords.speed); // Скорость движения
		state('heading', position.coords.heading); // Направление
		state('altitude', position.coords.altitude); // Высота
	};

	const geoError = (error) => {
		state('current_position', '');
	};

	Geolocation.getCurrentPosition(geoSuccess, geoError, {
		enableHighAccuracy: hightAccuracy, // Если true - GPS, иначе WIFI
	});
	/** watchID это уникальный ID геосессии, по нему можно прекратить геосессию */
	watchID = Geolocation.watchPosition(geoSuccess, geoError, {
		enableHighAccuracy: hightAccuracy, // Если true - GPS, иначе WIFI
		distanceFilter: distance, //Дистанция после изменения которой снова можно запрашивать геолокация ( вроде в метрах )
		maximumAge: maximumAge, //Время жизни кэша позиции в миллисекундах
	});
};

const stopLocationTracking = () => {
	if (watchID !== null) {
		Geolocation.clearWatch(watchID); //Работает как очистка interval
	}

	watchID = null;
};

const bindFunctions = (invokeInstance) => {
	invoke = invokeInstance;
	event = (name) => {
		const fn = invoke.bind('triggerEvent');
		fn(name);
	};
	state = (name, value) => {
		const fn = invoke.bind('publishState');
		fn(name, value);
	};
};

module.exports = {
	startLocationTracking,
	stopLocationTracking,
	bindFunctions,
};
