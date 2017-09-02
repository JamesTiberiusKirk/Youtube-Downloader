# Youtube-Downloader


This is an Electron App which uses ytdl-core and ffmpeg (along with other libraries) in order to create a simple and intuitive cross-platform desktop application which lets you download youtube videos. 

Screenshot:

![screenshot from 2017-09-01 22-14-14](https://user-images.githubusercontent.com/17408117/29988065-4013d91a-8f63-11e7-88d8-ddf5f0d8dafc.png)

##Currently Supported:
At the moment, only Windows and Linux is accesible to me, so only these platforms are developed for. So far I havent even got an entry in the build options to build for MacOS.

##Building:  
`git clone https://github.com/JamesTiberiusKirk/Youtube-Downloader`  
`cd Youtube-Downloader`  
`npm install`  
`npm run dist`  
**Note:** at the moment, for some reason the build is only building for the current operating system (if you're building on ubunu, you will only get a .deb)
