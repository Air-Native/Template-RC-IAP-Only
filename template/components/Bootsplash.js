/* eslint-disable */
import React from 'react';
import { View, Image } from 'react-native';
import * as Config from '../app.json';

const ParentElement = Config.appUI.fullScreen ? View : SafeAreaView;

const BootSplash = () => {
    return (
        <ParentElement
            style={{
                backgroundColor:
                    Config.bootsplash.backgroundColor, //Bootsplash color
                height: '100%',
                width: '100%',
                justifyContent: 'center',
                alignItems: 'center',
            }}
        >
            <Image
                style={{
                    width: Config.bootsplash.logoWidth,
                    resizeMode:
                        Config.bootsplash.resizeMode, //Bootsplash resizeMode
                }}
                source={require('../sources/boot.png')} //Bootsplash image
            />
        </ParentElement>
    );
}

module.exports = BootSplash;