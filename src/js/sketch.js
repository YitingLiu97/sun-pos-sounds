//get sun api 
//manipulate with music 
/********
Questions:
How to find the duration of the song being played - Need to use it to calculate the loop start and loop end 

How to convert the audio file into JSON but still play it as sound here? 
*******/
/********
1. distortion 
2. Transport - time keeper 
3. latitude and longitutde - compare to the sun's positions - play the thing
4. 
*******/

//getting the api from aporee 
// let Audio_API = process.env.Aduio_API;
// let audioLat, audioLog;

// let Audio_URL = Audio_API + `lat=${audioLat}&lng=${audioLog}`;

//test to see if the audio url works with tone js 


/***
 * sun distance decides the length of the music
 * ISS lon and lat decides + sun altitude decides the range of the music to play 
 * seletc one music 
 * chop them up based on the changing variables 
 */



 /*******
  * Questions:
  * 1. How to call the buffer from external link? 
  * 
  */

let sun_altitude, lat, lon;
let shifter, player;
let songURL;
let button;
let shiftSlider;
// let wetMix;
let songRoot = "../../assets/";
let songs = [songRoot + "alytusbridge.mp3", songRoot + "BranchinMeramecRiver.mp3", songRoot + "bruneuve.mp3", songRoot + "enteringmaindrinkingsuite.mp3", songRoot + "PlaceduGrandHospice.mp3"];
// let song = "BranchinMeramecRiver.mp3";
// songURL = songs[2];
// songURL2 = songs[1];

let newLat = 52.5;
let newLon = 13.5;

let Audio_URL;

// songURL = "https://cors-anywhere.herokuapp.com/https://aporee.org/maps/files/9EdDamazintheedrinken1525.mp3"
let songLength;

let distortionEffect = 0.2,
  distortionSlider; //not too obvious - has to connect to toMaster();
let pingPong, pingPongSlider;

let filter, feedbackDelay;
//loop start and end depending on the sun location 
//sun's distance to the location determines the effect 
// find the clip within the 100 radius of the longitude and altitude of location compared to the sun 
let loopStart = 0,
  loopEnd = 0;
let loopStartSlider, loopEndSlider;


let cuoffFreq = 400;
let cutoffFreqSlider;

let fadeInTime = 0,
  fadeOutTime = 0; // change the fade in fade out time based on the sun 
let path, recordingLink;

// Access to fetch failed 

function preload() {
  //read sun API 
  sunPath = "https://api.ipgeolocation.io/astronomy?apiKey=e01854cbed884f7d97f31665ef5d352e";
  httpDo(sunPath, 'GET', readResponse);

  //read ISS API 
  issPath = "https://api.wheretheiss.at/v1/satellites/25544";
  httpDo(issPath, 'GET', readResponseISS);

  Audio_URL = `https://aporee.org/api/ext/?lat=${newLat}&lng=${newLon}`;
  //created my own server 
  recordingPath = `https://proxy-server-yt.herokuapp.com/${Audio_URL}`;

  const myHeaders = new Headers();

  const myRequest = new Request(recordingPath, {
    method: 'GET',
    headers: myHeaders,
    mode: 'no-cors',
    cache: 'default'
  });

  //try using express to test the speed 
  fetch(recordingPath, {
      "headers": {
        // "accept": "*/*",
        // "accept-language": "en-US,en;q=0.9",
        // "cache-control": "no-cache",
        // "pragma": "no-cache",
        // "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "cross-site"
      },
      "referrerPolicy": "no-referrer-when-downgrade",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "omit"
    }).then(response => response.json())
    .then(myBlob => {
      console.log(myBlob)
      recordingLink = myBlob[0].url;
      console.log("recordingLink", recordingLink);
      return recordingLink;

    });

}

let duration, RLat, RLog, Rlink;

// let buffer, buff;
// buffer = new Tone.Buffer(songURL, function () {
//   //the buffer is now available.
//   buff = buffer.get();
// });

//example from git: https://github.com/Tonejs/Tone.js/issues/628
function play() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", recordingPath, true);
	xhr.responseType = 'blob';
	xhr.onload = function(){
		var blob = URL.createObjectURL(this.response);
		console.log('pressed');
		var player = new Tone.Player();
		var pitchShift = new Tone.PitchShift({pitch: 2});
		player.load(blob);
		pitchShift.toMaster();
		player.connect(pitchShift);
		player.autostart = true;
	};
	xhr.send();
}


function setup() {
  //manipulate field recordings 

  songLength = new Tone.Time().valueOf();

  shifter = new Tone.PitchShift().toMaster();

  player = new Tone.Player({
    "onload": Tone.noOp,
    "url": recordingPath,
    "autostart": false,
    "loop": true, //set the loop to be true to use loopstart and loopend
    "loopStart": loopStart,
    "loopEnd": loopEnd,
    "reverse": false,
    "duration": 1,
    "fadeIn": fadeInTime,
    "fadeOut": fadeOutTime

  });




  filter = new Tone.Filter(cuoffFreq).toMaster();
  feedbackDelay = new Tone.FeedbackDelay(0.125, 0.5).toMaster();

  // further dev 
  //use channel instead: https://tonejs.github.io/docs/14.7.58/Channel
  //if sound shitty, do the clipping 


  //bandpass filter/ comb filter - resonance 
  // https://tonejs.github.io/docs/14.7.58/FeedbackCombFilter


  pingPong = new Tone.PingPongDelay({
    "delayTime": 0.25,
    "maxDelayTime": 1
  }).toMaster();
  // player.connect(pingPong);

  // player.connect(grainPlayer);

  distortion = new Tone.Distortion({
    "distortion": distortionEffect,
  }).toMaster();


  //order of the effect matters 
  player.chain(shifter, distortion, filter, feedbackDelay, Tone.Master);

  let bgCnavas = createCanvas(windowWidth / 2, windowHeight / 2);
  // let bgCnavas =  createCanvas(2000, 2000);

  // bgCnavas.id("bg");
  // document.getElementById("bg").style.zIndex="1";

  shiftSlider = createSlider(-12, 12, 2, 1);
  shiftSlider.style("width", "200px");
  shiftSlider.position(width / 2 - 100, height / 2 + 150);


  button = createButton("Play Sound");
  button.position(width / 2 - 50, height / 2);



  //should replace the end range as the length of the audio 
  loopStartSlider = createSlider(0, 10000, 1, 0);
  loopStartSlider.style("width", "200px");
  loopStartSlider.position(width / 2 - 100, height / 2 + 200);

  loopEndSlider = createSlider(0, 10000, 1, 0);
  loopEndSlider.style("width", "200px");
  loopEndSlider.position(width / 2 - 100, height / 2 + 270);

  distortionSlider = createSlider(0, 1, 0.1, 0);
  distortionSlider.style("width", "200px");
  distortionSlider.position(width / 2 - 100, height / 2 + 340);

  cutoffFreqSlider = createSlider(0, 10000, 100, 100);
  cutoffFreqSlider.style("width", "200px");
  cutoffFreqSlider.position(width / 2 - 100, height / 2 + 420);

}
/*Avoiding putting any sound triggering functions in draw() for this example
 */
function draw() {

  shifter.pitch = shiftSlider.value();
  loopStart = loopStartSlider.value();
  loopEnd = loopEndSlider.value();
  cutoffFreq = cutoffFreqSlider.value();
  distortionEffect = distortionSlider.value();
  background(143, 204, 124);

  //to autostart 
  // player.autostart=true;


  button.mousePressed(play1);
  // button.mousePressed(play);

  //assign individual values to player to update 
  player.loopEnd = loopEnd;
  // player.loopStart=loopStart;
  distortion.distortion = distortionEffect;
  // console.log("length of the audio:", songLength); // not accurate 
  filter.cutoff = cuoffFreq;
  // textAlign(CENTER);
  // text(int(wetMix.value() * 100) + "% effected sound", wetMix.x + 100, wetMix.y - 10);

  text("Shift value parameter: " + shiftSlider.value() + " half steps", shiftSlider.x + 100, shiftSlider.y - 10);

  text(int(loopStartSlider.value()) + "loopStartSlider", loopStartSlider.x + 100, loopStartSlider.y - 10);


  text(int(loopEndSlider.value()) + "loopEndSlider", loopEndSlider.x + 100, loopEndSlider.y - 15);


  text(Number(distortionSlider.value().toFixed(2)) + "distortionSlider", distortionSlider.x + 100, distortionSlider.y - 10);

  text(int(cutoffFreqSlider.value()) + "cutoffFreq", cutoffFreqSlider.x + 100, cutoffFreqSlider.y - 10);


}

function play1() {
  player.start();
  player2.start();
}


function readResponseISS(e) {
  let ISSdata = JSON.parse(e);
  lat = ISSdata.latitude;
  lon = ISSdata.longitude;
  console.log("lat", lat);
  console.log("lon", lon);

}

function readResponse(response) {
  let data = JSON.parse(response);
  sun_altitude = data.sun_altitude;
  console.log("sun_altitude", sun_altitude);

}

/************
function crossFade(sound1,sound2){
  //get the url from sound1 and sound2 
//create crossfade effect between two clips 

const crossFade = new Tone.CrossFade().toMaster();
let player1 = new Tone.player(sound1).connect(crossFade.a).start();
let player2  = new Tone.player(sound2).connect(crossFade.b).start();
crossFade.fade.value = 0.5;
}
 */


//getting the kinect data and people also manipulate something similiar in the clip 

// would be a symphone of sun and us - sun is always playing in the background; human movement geneerate something else