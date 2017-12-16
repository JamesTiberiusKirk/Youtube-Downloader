# Youtube-Downloader


This is an Electron App which uses ytdl-core and ffmpeg (along with other libraries) in order to create a simple and intuitive cross-platform desktop application which lets you download youtube videos. 

Screenshot:

![screenshot from 2017-09-03 21-45-55](https://user-images.githubusercontent.com/17408117/30006485-806fea96-90f1-11e7-8fc9-d3a729910fc0.png)  

## Currently Supported:
At the moment, only Windows and Linux are accesible to me, so only these platforms are developed for. So far I haven't even got an entry in the build options to build for MacOS.

## Building:  
`git clone https://github.com/JamesTiberiusKirk/Youtube-Downloader`  
`cd Youtube-Downloader`  
`npm install`  
`npm run dist`  
**Linux:** to be able to build a snap, you need to install the `snapcraft` package on youre system.  
**Note:** at the moment, for some reason the build is only building for the current operating system (if you're building on ubunu, you will only get only a .deb and a snap)
