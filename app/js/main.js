const fs            = require('fs');
const ytdl          = require('ytdl-core');
const getFfmpeg     = require('ffmpeg-static');
const ffmpeg        = require('fluent-ffmpeg');
const {ipcRenderer} = require('electron');
const {shell}       = require('electron');
const path          = require("path");

window.$ = window.jQuery = require('jquery');

//example video
/*
https://www.youtube.com/watch?v=mAW0MF2dM-s&feature=youtu.be
*/

//TODO: cleanup unused variables!!!!!!!!!!!!
var vidInfo = {
  id:             null,
  title:          null,
  url:            null,
  thumbnail:      null,
  filename:       null,
  container:      null,
  size:           null, //not used yet
  lengthSeconds:  null,
  lengthTime:     null,
  description:    null,
  quality:        []
}
var userHome      = getUserHome();
var targetPath    = userHome+"/Downloads/";
var tmpFolder;
var ffmpegPath    = getFfmpegPath();
var id;           //used for progress bar interval id
var firstUse      = false; //not used
var dlStarted     = false;
var icon          = getIconPath();

//TODO: #Feature Add the current download speed (need to see if i can do it from fs)
//TODO: #Feature Add a tickbox for downloading audio only
//TODO: #Feature Add error detection and remove/cleanup the tmp folder before exiting
//TODO: #Feature Add Support for multiple dounloads, or queing of downloads
//TODO: #Feature Look into adding some form of description 

/////////////////////////// All of the gets

//Gets the unpacked asar archine path for icon
//TODO: #Issue resolve isnt getting full resolved path
//TODO: UNIFISHED
function getIconPath(){
  var relPath = path.resolve("../build/assets/icons/256x256.png");
  var resPath = relPath.split("app.asar");
  console.log(resPath[0]+"app.asar.unpacked"+resPath[1]);
  return resPath[0]+"app.asar.unpacked"+resPath[1];
  
  // return "../build/assets/icons/256x256.png";
  // return imgPath;
  
}


//TODO: #ISSUE app cant get to ffmpeg from packaged state

//Gets the unpacked asar archive path for FFmpeg
function getFfmpegPath(){
  var path = getFfmpeg.path.split("app.asar");
  if( typeof path === '[object Array]' ) {
    console.log(path[0]+"app.asar.unpacked"+path[1]);    
    return path[0]+"app.asar.unpacked"+path[1];
  }else{  
    console.log(getFfmpeg.path);    
    return getFfmpeg.path;
  }
}

//Gets user home folder
function getUserHome() {
  return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
}

//Gets tmp directory
function getTmpDir(){
  var rtrnString;
  switch(process.platform){
    case 'win32': //Windows tmp directory
      rtrnString = userHome+'\\AppData\\Local\\Temp';
      break;
    case 'darwin': //MacOS tmp direcotry
      break;
    case 'linux': //Linux tmp directory
      rtrnString = '/tmp';
      break;
    case 'freebsd': //Freebsd tmp directory
      rtrnString = '/tmp';
    break;
    default:
      rtrnString='Err';
  }
  return rtrnString;
}

function getLengthTime(){
  var sec_num = vidInfo.lengthSeconds; 
  var hours   = Math.floor(sec_num / 3600);
  var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
  var seconds = sec_num - (hours * 3600) - (minutes * 60);
  if (hours   < 10) {hours   = "0"+hours;}
  if (minutes < 10) {minutes = "0"+minutes;}
  if (seconds < 10) {seconds = "0"+seconds;}
  return hours+':'+minutes+':'+seconds;
}

////////////////////////////////// Button fucntions

//Getts trigered when the go button is clicked
function btnGo(){
  getTmpDir();
  if(ytdl.validateLink(yt_link.value)){
    progBar();
    progBarTxt("Loading");
    setVidInfo(yt_link.value);
  } else {
    progBarTxt("This Link Appears to be Invalid");
  }
}

//Getts trigered when the download button is clicked
function btnDl(){
  if (!dlStarted){
    dlStarted       = true;
    var envTmpDir   = getTmpDir();
    var tmpDir      = envTmpDir+"/youtube-dl-";    
    fs.mkdtemp(`${tmpDir}`, (err, folder) => {
      if (err) throw err;
      tmpFolder     = folder;
      vidDl(yt_link.value);
    });
  }else{
    progBarTxt("cunt");
  }
}

///////////////////////////////// App logic and core functions

//getting information about the video and setting it to specific variables
function setVidInfo(url){
  ytdl.getInfo(url,(err, info) => {
    //console.log(info);
    vidInfo.id            = info.video_id;
    vidInfo.title         = info.title;
    vidInfo.filename      = titleFilter(vidInfo.title);
    vidInfo.url           = info.vieo_url;
    if (info.iurlhq != "undefined"){      vidInfo.thumbnail   = info.iurlhq;
    }else if (info.iurlhq720p != "undefined"){  vidInfo.thumbnail   = info.iurlhq720p; 
    }else if (info.iurlmq != "undefined"){      vidInfo.thumbnail   = info.iurlmq; 
    }else if (info.iurl   != "undefined"){      vidInfo.thumbnail   = info.iurl; 
    }else{  console.log("shit");  console.log(info); }
      

    vidInfo.lengthSeconds = info.length_seconds;
    vidInfo.lengthTime    = getLengthTime();
    vidInfo.description   = info.description;
    for(a = 0 ; a <= info.formats.length; a++ ){ vidInfo.quality[a]  = info.formats[a]; }
    optLoad();
  });
}

//This function is for creating a suitable filename which will behave with filesystems
function titleFilter(title){
  return filename = title.replace(/(['"])/g, "$1")
    .replace(/\//g, '')
    .replace(/\\/, "\\\\")
    .replace(/\s/g, '\ ');
}

//This function downloads the actual video
function vidDl(url){
  var video_qselect       = document.getElementById('video_quality_select');
  var audio_qselect       = document.getElementById('audio_quality_select');
  var video_qselect_vars  = video_qselect.value.split(',');
  var audio_qselect_vars  = audio_qselect.value.split(',');
  filename                = vidInfo.filename+"."+video_qselect_vars[1];

  //                   [0]           [1]
  //video_qselect_vars[itag,      container] 
  //audio_qselect_vars[audioItag,audioContainer]

  var vidTmpPath          = tmpFolder+"/vidtmp."+video_qselect_vars[1];
  var audioTmpPath        = tmpFolder+"/audiotmp."+audio_qselect_vars[1];

  //First it downloads the video
  ytdl(url, {quality: video_qselect_vars[0]})
  .on('progress', (chunkLength,totalDownloaded,totalLength) => {
    var percent = (totalDownloaded/totalLength)*100;
    dlProgBar("Video: ", percent);
    //If the video is done downloading
    if (percent == "100"){
      //downloads audio
      ytdl(url, {quality: audio_qselect_vars[0]})
      .on('progress', (chunkLength,totalDownloaded,totalLength) => {
        var percent     =(totalDownloaded/totalLength)*100;
        dlProgBar("Audio: ", percent);
        //if the audio is done downloading
        if (percent == "100"){
          //merge the video and the audio
          merge(vidTmpPath,audioTmpPath,targetPath+filename);
        }
      })
      .pipe(fs.createWriteStream(audioTmpPath)); //audio pipe
    }
  })
  .pipe(fs.createWriteStream(vidTmpPath)); //video pipe
}

//FFmpeg stuff
function merge(vidPath, audioPath, finishedVidPath){
  progBar();
  var footer        = document.getElementById("footer");
  //command to convert webm to mp3
  var audioToMp3    = new ffmpeg(audioPath);
  audioToMp3.setFfmpegPath(ffmpegPath);
  audioToMp3.outputOptions(['-vn','-ab', '128k','-ar', '44100','-y']);
  audioToMp3.on('error', (err) => {console.log("An Error occured: " + err);});
  audioToMp3.output(audioPath+".mp3");
  audioToMp3.on('start', () => {
    progBarTxt("Converting Audio");
  });

  //command to merge the audioand video
  var vidMerge      = new ffmpeg();
  vidMerge.setFfmpegPath(ffmpegPath);
  vidMerge.input(vidPath);
  vidMerge.input(audioPath+".mp3");
  vidMerge.outputOptions(['-c', 'copy', '-map', '0:v:0', '-map', '1:a:0']);
  vidMerge.on('start', () => {
    progBarTxt("Merging");
    console.log("merging");
  });
  vidMerge.on('error', (err) => {console.log('An error occurred: ' + err);});
  vidMerge.on('end', () => {
    console.log('Final video created!');
    clearInterval(id);
    var footer      = document.getElementById('footer');
    footer.innerHTML='<div id="txt"></div>';
    progBarTxt("Done!");
    //notification
    var notification= new Notification("Done!", {
      icon: icon,
      body:"Download Finished"
    });
    notification.onclick = () => {
      var tmp        = targetPath.replace(/\\/, "\\\\"); 
    };
    dlStarted        = false;
    clean(tmpFolder);
  });
  vidMerge.output(finishedVidPath);

  audioToMp3.on('end', () => {
    console.log('.mp3 created');
    vidMerge.run();
  });
  audioToMp3.run();
}

//This is to clean the tmp files
function clean(path){
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach((file,index) => {
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

//Enabling Drag and Drop for Links
//EXPERIMENTAL
ipcRenderer.on('dragNdrop', function (url){
  const tmpDir = '/tmp/youtube-dl-';
  fs.mkdtemp(`${tmpDir}`, (err, folder) => {
    if (err) throw err;
    tmpFolder=folder;
    vidDl(url);
  });
})

//map the enter key to btnGo
$(window).keydown((e) => {
  switch (e.keyCode) {
    case 13: // enter key
      btnGo();
      break;
  }
});

/////////////////////////////// UI PART

//This is for loading the progress bar
function progBar() {
  var footer        = document.getElementById("footer");
  var divBar        = '\
    <div id="txt"></div>\
    <div id="progBar" class="progressBar"></div>';
  footer.innerHTML  = divBar;

  var elem          = document.getElementById("progBar");
  var width         = 0;
  id = setInterval(frame, 10);
  function frame() {  
    if (        width >= 105) { speed = -2;
    } else if ( width <= 0){    speed = 2;  }
    width += speed;
    elem.style.width = width + '%';    
  }
}

//This is to set text above the progress bar
function progBarTxt(txt){
  try{
    var txtelem       = document.getElementById("txt");
    txtelem.innerHTML = '<h4 class="percent"> '+txt+'<br></h4>';
  }catch(e){
    var footer        = document.getElementById("footer");
    var divBar        = '<div id="txt"></div>';
    footer.innerHTML  =divBar;
    var txtelem       = document.getElementById("txt");
    txtelem.innerHTML = '<h4 class="percent"> '+txt+'<br></h4>';
  }
}

//This is the download progress bar
function dlProgBar(txt, i) {
  //This is for displaying a progress bar when the video is downloading
  var footer          = document.getElementById("footer");
  footer.innerHTML    = '\
  <div id="txt"></div>\
  <div id="dlProgBar" class="progressBar"></div>';
  var elem            = document.getElementById("dlProgBar");
  var txtelem         = document.getElementById("txt");
  var width           = i;

  if (width >= 100) {
  } else {
    elem.style.width  = i + '%';
    txtelem.innerHTML = '<h4 class="percent"> '+txt+Math.round(i)+'%</h4>';
  }
}

//This pushes the relevant video info to HTML
//TODO: #Feature Add support for more then 1440p, some 4k videos do show up
//TODO: ...Probably to gonna have to also look into downloading different container types
function optLoad(){
  var optDiv    = document.getElementById("optionsDiv");
  var divHTML   = '\
  <br> \
  <div class="row">\
    <div class="optionsDiv"> \
    <h3 class="vidTitle">'+vidInfo.title+'</h3> \
      <div class="col-sm-2 img_div"> \
        <br> \
        <div class="thumbnail"> \
          <img src="'+vidInfo.thumbnail+'" class="" alt="" width="100%" heigth="100%"> \
          <h3 class="thumbnailTitle">Length: '+vidInfo.lengthTime+'</h3> \
        </div> \
      </div> \
      <div class="col-sm-2 btn_div"> \
        <br> \
        <br> \
        <div class="input-group input-group-sm"> \
          <span class="input-group-addon">Video Quality</span> \
          <select name="video_quality_select" id="video_quality_select" class="form-control"> \
            ';
  // this is a for loop for imputting AUDIO quality options in the quality select dropdown
  for(var i = 0; i <= vidInfo.quality.length; i++){
    var rezIsDeclared=false;
    try{vidInfo.quality[i].resolution;}
    catch(e) {
      if(e.name != "undefined") { rezIsDeclared = true; }
    }
    if(!rezIsDeclared){
      if(vidInfo.quality[i].resolution == null){
      }else if (vidInfo.quality[i].audioBitrate == null && vidInfo.quality[i].container == "mp4"){
        divHTML+= '<option value="'
        + vidInfo.quality[i].itag +','
        + vidInfo.quality[i].container
        + '">'
        + vidInfo.quality[i].resolution + ' ';
      }
    }
  }
  divHTML += ' \
          </select> \
        </div> \
        <br>\
        <div class="input-group input-group-sm"> \
          <span class="input-group-addon">Audio Quality</span> \
          <select name="audio_quality_select" id="audio_quality_select" class="form-control"> \
            ';
  // this is a for loop for imputting VIDEO quality options in the quality select dropdown
  for(var i = 0; i <= vidInfo.quality.length; i++){
    var rezIsDeclared=true;

    try{vidInfo.quality[i].resolution;}
    catch(e) {
      if(e.name != "undefined") {rezIsDeclared = false;}
    }

    if(rezIsDeclared){
      if(vidInfo.quality[i].resolution == null){
        divHTML+= '<option value="'
        + vidInfo.quality[i].itag +','
        + vidInfo.quality[i].container
        + '">'
        + vidInfo.quality[i].audioBitrate + ' kbps';
      }else if (vidInfo.quality[i].audioBitrate == null && vidInfo.quality[i].container == "mp4"){
      }
    }
  }

  divHTML += ' \
          </select> \
        </div> \
        <br> \
        <button class="btn" onclick="btnDl();">Download</button> \
      </div> \
    </div> \
  </div>';
  optDiv.innerHTML  = divHTML;
  var footer        = document.getElementById("footer");
  footer.innerHTML  = ' ';
}