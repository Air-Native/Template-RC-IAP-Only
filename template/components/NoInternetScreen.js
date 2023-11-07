/* eslint-disable */
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import * as Config from '../app.json';

const ParentElement = Config.appUI.fullScreen ? View : SafeAreaView;

const NoInternetScreen = () => {
	return (
		<ParentElement style={styles.container}>
			<Image
				source={require('../sources/boot.png')} // You should add your own image
				style={styles.image}
			/>
			<Text style={styles.text}>No Internet Connection</Text>
			<Text style={styles.description}>
				Please check your internet connection and try again.
			</Text>
		</ParentElement>
	);
};

const styles = StyleSheet.create({
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

module.exports = NoInternetScreen;
