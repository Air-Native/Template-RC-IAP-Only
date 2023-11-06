/* eslint-disable */
import TrackPlayer, {
	Capability,
	AppKilledPlaybackBehavior,
	Event,
	State,
    RepeatMode
} from 'react-native-track-player';

let event = (name) => console.warn('Function is not defined');
let state = (name, value) => console.warn('Function is not defined');
let invoke = null;
let trackChangeListener = null;
let isInitialized = false;

const isNil = (value) => value === null || value === undefined;

const addArtwork = (track) => {
    return {
        artwork: require('../sources/icon.png'),
        ...track
    }
}

const setupPlayer = async () => {
	try {
		if (isInitialized) return;

		await TrackPlayer.setupPlayer();
		updateOptions();
		TrackPlayer.addEventListener(Event.PlaybackState, onStateChange);
		isInitialized = true;
	} catch (err) {
		console.error('Player:', err.message)
	}
}

const onTrackChange = (state) => {
	console.log('Track change: ', state)
	if ( !isNil(state.nextTrack) ) {
		TrackPlayer.getTrack(state.nextTrack).then( track => {
			console.log('New Track', track)
			state('currentTrack', track?.id || '');
			event('trackchanged');
		})
	}
}

const onStateChange = ({ state }) => {
	switch (state) {
		case State.Ready: {
			if (!trackChangeListener) {
				trackChangeListener = TrackPlayer.addEventListener(
					Event.PlaybackTrackChanged,
					onTrackChange
				);
			}

			state('playing', false);
			event('ready');
			break;
		}
		case State.Playing: {
			state('playing', true);
			event('play');
			break;
		}
		case State.Paused: {
			state('playing', false);
			event('pause');
			break;
		}
	}
};

const getCurrentState = async () => {
	try {
		console.log('run getCurrentState')
		const trackIndex = await TrackPlayer.getCurrentTrack()
		let track = ''
		if (isNil(trackIndex)) {
			track = (await TrackPlayer.getTrack(trackIndex))?.id || ""
		}
		console.log('getCurrentState track', track)
		const state = await TrackPlayer.getState()

		console.log('getCurrentState', state === State.Playing, track)

		return { isPlaying: state === State.Playing, track };
	} catch (err) {
		console.warn(err)
		console.error('getCurrentState Error: ', err.message)
	}
}

const updateOptions = (options) => {
	TrackPlayer.updateOptions({
		capabilities: [
			Capability.Play,
			Capability.Pause,
			Capability.SkipToNext,
			Capability.SkipToPrevious,
			Capability.Stop,
		],
		compactCapabilities: [
			Capability.Play,
			Capability.Pause,
			Capability.SkipToNext,
			Capability.SkipToPrevious,
		],
		android: {
			// This is the default behavior
			appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
		},
	});
}

const play = async (track) => {
	if (track) {
		await TrackPlayer.pause()
		await TrackPlayer.reset()
		await TrackPlayer.add([addArtwork(track)]);
		state('currentTrack', track?.id || '');
	}
	await TrackPlayer.play();
	event('play');
}

const pause = async () => {
	await TrackPlayer.pause();
	event('pause');
}

const addToQueue = (track) => {
	return TrackPlayer.add([addArtwork(track)]);
}

const removeFromQueue = async (track) => {
	await TrackPlayer.remove();
}

const setQueue = async (queue) => {
	await TrackPlayer.reset();
	await TrackPlayer.add(queue.map(addArtwork));
}

const clearQueue = () => {
	return TrackPlayer.reset();
}

const playNext = () => {
	return TrackPlayer.skipToNext();
}

const playPrevious = () => {
	return TrackPlayer.skipToPrevious();
}

const setVolume = (volume) => {
	return TrackPlayer.setVolume(volume);
}

const getCurrentTrack = async () => {
	const trackNum = await TrackPlayer.getCurrentTrack()
	if (!trackNum) return false

	const track = await TrackPlayer.getTrack(trackNum)
	console.log('getCurrentTrack', track)
	return track.id
}

const setRepeatMode = async (mode) => {
	switch (mode) {
		case 'Track': {
			const repeatMode = await TrackPlayer.setRepeatMode(RepeatMode.Track)
			console.log('New Repeat mode: ', repeatMode)
			return 1
		}
		case 'Queue': {
			const repeatMode = await TrackPlayer.setRepeatMode(RepeatMode.Queue)
			console.log('New Repeat mode: ', repeatMode)
			return 2
		}
		default: {
			const repeatMode = await TrackPlayer.setRepeatMode(RepeatMode.Off)
			console.log('New Repeat mode: ', repeatMode)
			return 0
		}
	}
}

const bindFunctions = (invokeInstance) => {
	invoke = invokeInstance;
	event = (name) => {
		const fn = invoke.bind('triggerEventPlayer');
		fn(name);
	};
	state = (name, value) => {
		const fn = invoke.bind('publishStatePlayer');
		fn(name, value);
	};
}


module.exports = {
	setupPlayer,
	play,
	pause,
	addToQueue,
	removeFromQueue,
	setQueue,
	clearQueue,
	playNext,
	playPrevious,
	setVolume,
	setRepeatMode,
	getCurrentTrack,
	getCurrentState,
	bindFunctions
};
