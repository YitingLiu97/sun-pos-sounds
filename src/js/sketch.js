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

/***
 * sun distance decides the length of the music
 * ISS lon and lat decides + sun altitude decides the range of the music to play 
 * seletc one music 
 * chop them up based on the changing variables 
 */

let sun_altitude, lat, lon; //sun altitude range -90 - 90 (from night time to day time) 
let shifter, player;
let songURL;
//set default lat and lon for Aporee API
let newLat = 52.5;
let newLon = 13.5;
let bgCanvas;
let Audio_URL;
// songURL = "https://cors-anywhere.herokuapp.com/https://aporee.org/maps/files/9EdDamazintheedrinken1525.mp3"
let songLength;

let distortionEffect = 0.2;
let pingPong, pingPongSlider;
let filter, feedbackDelay;
//loop start and end depending on the sun location 
//sun's distance to the location determines the effect 
// find the clip within the 100 radius of the longitude and altitude of location compared to the sun 
let loopStart = 0,
  loopEnd = 500;

let cuoffFreq = 400;

let fadeInTime = 0.5,
  fadeOutTime = 0.5; // change the fade in fade out time based on the sun 
let path, recordingLink;
let rectitle;
let artist;
let timeZone;
let recdate;
let infoString;
let duration;
const proxy = "https://mighty-shelf-54274-3fd4a254a0a2.herokuapp.com/";
//const proxy = 'https://cors-anywhere.herokuapp.com/'; // use netlify to host and check 

let video;
let poseNet;
let poses = [];
let noseX, noseY, rightWristX, rightWristY, leftWristX, leftWristY, rightKneeX, rightKneeY;

let factor = 3,
  total = 10,
  zoff = 0;
let sunToDur = 100;
let state = "sun";

let issPath, sunPath;

let playState = false;
let sun_altitude_changed = false;

let about = document.getElementById("about");
let showAbout = document.getElementById("showAbout");

let sunButton = document.getElementById('sunButton');
let usButton = document.getElementById('usButton');
let indexForRadio = 0;
let usParagraph;// to update texts 
let defaultJson;

let sliderControl = document.getElementById("sliderControl");
let intro = document.getElementById("intro");
let startButton = document.getElementById('startButton');

let toMute = true; // mute audio until startButton is pressed 
startButton.addEventListener('click', function () {
  unmutePlayer();
  console.log("intro button clicked")
  if (intro.style.display == "none") {
    toMute = true;
    sliderControl.style.display = "none";
    intro.style.display = "flex";

  } else {
    toMute = false;
    sliderControl.style.display = "flex";
    intro.style.display = "none";

  }
});

about.addEventListener("click", function () {
  console.log("? clicked")
  if (showAbout.style.display == "none") {
    showAbout.style.display = "block";
    about.innerHTML = "<h2 id='close'>✖</h2>";
  } else {
    showAbout.style.display = "none";
    about.innerHTML = "<h2>❔</h2>";
  }
});

document.getElementById("sketchDiv").addEventListener('click', () => {
  console.log("should play the audio");
  player.load(GetDefaultAudioLink());
  adjustFooter();
});


function preload() {


   issPath = "https://api.wheretheiss.at/v1/satellites/25544";
  sunPath = "https://api.ipgeolocation.io/astronomy?apiKey=b83a03b773884e748b520602f359e4b8";
  Audio_URL = `https://aporee.org/api/ext/?lat=${newLat}&lng=${newLon}`;

  console.log("audio url is " + Audio_URL);
  // for normal testing 
  //recordingPath = proxy.concat(Audio_URL);
  // for testing Cors Issue 
  recordingPath = Audio_URL;
  fetchLink();

  const myHeaders = new Headers();
  const myRequest = new Request(recordingPath, {
    method: 'GET',
    headers: myHeaders,
    mode: 'no-cors',
    cache: 'default'
  });

  //read sun API 
  httpDo(sunPath, 'GET', readResponse);
  //read ISS API 
  httpDo(issPath, 'GET', readResponseISS);

}
// once link is fetched, the button is interactable 
function fetchLink() {
  // fetch the api link 
  fetch(recordingPath, {
    "headers": {
      "sec-fetch-mode": "cors",
    },
    "referrerPolicy": "no-referrer-when-downgrade",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "omit"
  }).then(
    response => response.json()).
    then((myBlob) => {
      indexForRadio = getRandomInt(myBlob.length - 1);
      recordingLink = myBlob[indexForRadio].url;
      rectitle = myBlob[indexForRadio].rectitle;
      artist = myBlob[indexForRadio].artist;
      timeZone = myBlob[indexForRadio].timezone;
      recdate = myBlob[indexForRadio].recdate;
      console.log(`recordingLink for index ${indexForRadio} ${recordingLink}`);
      let url = proxy.concat(recordingLink);
      player.load(url);
      return url;
    }).catch((error) => {
      // fetch the deafult local json if api does not work 
      defaultLink = GetDefaultAudioLink();
      console.log("api fetch error: ", error);
      player.load(defaultLink);
      return defaultLink;
    });
}

function GetDefaultAudioLink() {
  console.log("GetDefaultAudioLink when API doesnt work");
  if (defaultJson == null)
    return;

  indexForRadio = getRandomInt(defaultJson.length - 1);
  recordingLink = defaultJson[indexForRadio].url;
  rectitle = defaultJson[indexForRadio].rectitle;
  artist = defaultJson[indexForRadio].artist;
  timeZone = defaultJson[indexForRadio].timezone;
  recdate = defaultJson[indexForRadio].recdate;

  lat = float(defaultJson[indexForRadio].lat).toFixed(2);
  lon = float(defaultJson[indexForRadio].lng).toFixed(2);
  console.log("current recording link is ", recordingLink);
  return recordingLink;
}
// as a fall back method 
function GetAudioFromDefaultJson() {
  fetch('./src/fallbackLocalData.json')
    .then(response => response.json())
    .then(data => {
      console.log(data);
      defaultJson = data;
    })
    .catch(error => console.log(error));
}

function windowResized() {
  // Resize the canvas when the window is resized
  resizeCanvas(windowWidth, windowHeight);
  width = windowWidth;
  heighht = windowHeight;

  if (windowHeight < 768 && windowWidth < 600) {
    heightOffset = 300 / windowHeight * windowWidth;
  } else {
    heightOffset = 100;
  }
  info();
}

function adjustFooter() {
  let footer = document.getElementById('footer');
  infoString = `The ISS is currently at Latitude of ${lat} and Longitude of ${lon}. The ${rectitle} is uploaded by ${artist} on ${recdate} in ${timeZone}`;
  footer.innerHTML = infoString;
}
function initializeCamera() {

  console.log("initialize camera");
  video = createCapture(VIDEO);
  video.size(width, height);
  //single detection for now 
  poseNet = ml5.poseNet(video, {
    flipHorizontal: true
  }, modelReady);
  console.log("video", video);

  poseNet.on('pose', function (results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();
}

function SetupAudioPlayer() {
  shifter = new Tone.PitchShift();
  player = new Tone.Player({
    "onload": Tone.noOp,
    "autostart": true,
    "loop": true, //set the loop to be true to use loopstart and loopend
    "loopStart": loopStart,
    "loopEnd": loopEnd,
    "reverse": false,
    "duration": sunToDur, //changed by the sun altitude in draw; 
    "fadeIn": fadeInTime,
    "fadeOut": fadeOutTime

  });

  filter = new Tone.Filter(cuoffFreq);
  feedbackDelay = new Tone.FeedbackDelay(0.125, 0.5);
  pingPong = new Tone.PingPongDelay({
    "delayTime": 0.25,
    "maxDelayTime": 1
  });

  distortion = new Tone.Distortion({
    "distortion": distortionEffect,
  });

  player.volume.value = -Infinity; // Mute
  //order of the effect matters 
  player.chain(shifter, distortion, filter, feedbackDelay, Tone.Destination);

}

function unmutePlayer() {
  if (player == null)
    return;
  console.log("unmute player");
  player.volume.value = -12; // Set volume to default level, or any desired level

}

function setup() {

  background(200);
  r = width / 2 - 200;
  bgCanvas = createCanvas(windowWidth, windowHeight);
  bgCanvas.id = "bgCanvas";
  bgCanvas.parent("sketchDiv");

  initializeCamera();
  SetupAudioPlayer();
  const startBtn = document.getElementById('startButton');
  startBtn.style.pointerEvents = 'auto';
  startBtn.style.opacity = '1';

}

// when document is loaded 
// display the intro to get user interaction to start the tone start for TONE JS 
// load sliders - done 
// load default json - done 
// play default audio - done 

document.addEventListener('DOMContentLoaded', (event) => {
  // load default json 
  GetAudioFromDefaultJson();

  const sunContent = document.getElementById('sunContent');
  const usContent = document.getElementById('usContent');
  usContent.style.display = 'none';

  sunButton.addEventListener('click', function () {
    state = "sun";
    console.log("sunButton is pressed");
    sunContent.style.display = 'block';
    usContent.style.display = 'none';
  });


  usButton.addEventListener('click', function () {
    state = "us";
    console.log("usButton is pressed");
    sunContent.style.display = 'none';
    usContent.style.display = 'block';
  });

  usParagraph = document.getElementById('usParagraph');

  // when ever the pose net value updates, update the uspragrph content 
  const pitchSlider = document.getElementById('pitchSlider');
  const pitchDisplay = document.getElementById('pitchValue'); // Get the <p> element

  pitchSlider.addEventListener('input', function () {
    const pitchValue = parseInt(this.value);
    shifter.pitch = pitchValue; // Update the Tone.js pitch shift
    pitchDisplay.textContent = `Pitch: ${pitchValue}`; // Update the <p> text content
  });

  const distortionSlider = document.getElementById('distortionSlider');
  const distortionDisplay = document.getElementById('distortionValue'); // Get the <p> element

  distortionSlider.addEventListener('input', function () {
    const distortionValue = parseFloat(this.value);
    distortion.distortion = distortionValue; // Update the Tone.js pitch shift
    distortionDisplay.textContent = `Distortion: ${distortionValue}`; // Update the <p> text content
  });

  const loopStartSlider = document.getElementById('loopStartSlider');
  const loopStartDisplay = document.getElementById('loopStartValue'); // Get the <p> element

  loopStartSlider.addEventListener('input', function () {
    const loopStartValue = parseInt(this.value);
    player.loopStart = loopStartValue; // Update the Tone.js pitch shift
    loopStartDisplay.textContent = `Loop Start: ${loopStartValue}`; // Update the <p> text content
  });

  const loopEndSlider = document.getElementById('loopEndSlider');
  const loopEndDisplay = document.getElementById('loopEndValue'); // Get the <p> element

  loopEndSlider.addEventListener('input', function () {
    const loopEndValue = parseInt(this.value);
    player.loopEnd = loopEndValue / 500 * player.buffer.duration; // Update the Tone.js pitch shift
    console.log("player loop end is ", player.loopEnd, player.buffer.duration);
    loopEndDisplay.textContent = `Loop End: ${loopEndValue}`; // Update the <p> text content
  });

  const cutoffFreqSlider = document.getElementById('cutoffFreqSlider');
  const cutoffFreqDisplay = document.getElementById('cutoffFreqValue'); // Get the <p> element

  cutoffFreqSlider.addEventListener('input', function () {
    const cutoffFreqValue = parseFloat(this.value);
    player.cutoffFreq = cutoffFreqValue; // Update the Tone.js pitch shift
    cutoffFreqDisplay.textContent = `Cutoff Freq: ${cutoffFreqValue}`; // Update the <p> text content
  });

});


function draw() {

  background(0);

  if (state == "us" && isModelReady) {
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, width / 8 * 7, 0, width / 8, width / 8 / 16 * 9); //video on canvas, position, dimensions
    pop();

    drawKeypoints();
    noStroke();

    if (poses.length > 0) {
      push();
      ellipse(noseX, noseY, 10, 10);
      fill(249, 215, 28);
      ellipse(leftWristX, leftWristY, 10, 10);
      ellipse(rightWristX, rightWristY, 10, 10);
      pop();

      if (player == null)
        return;
      // Validate and set loopStart
      let loopStartValue = map(leftWristX, 0, width, 0, 50); // Example mapping function
      if (!isFinite(loopStartValue) || loopStartValue < 0) {
        loopStartValue = 0; // Default to 0 if non-finite or negative
      } else if (loopStartValue > player.buffer.duration) {
        loopStartValue = player.buffer.duration; // Clamp to buffer duration
      }
      player.loopStart = loopStartValue;
      // Validate and set loopEnd
      let loopEndValue = map(rightWristX, 0, width, 0, player.buffer.duration); // Adjusted mapping
      if (!isFinite(loopEndValue) || loopEndValue < 0) {
        loopEndValue = player.buffer.duration; // Default to buffer duration if non-finite or negative
      } else if (loopEndValue > player.buffer.duration) {
        loopEndValue = player.buffer.duration; // Clamp to buffer duration
      }
      player.loopEnd = loopEndValue; 
      shifter.pitch = rightWristY==null? map(noseX, 0, height, -12, 12): map(rightWristY, 0, height, -12, 12);
      player.cutoffFreq = map(noseY, 0, height, 1000, 100);
      distortion.distortion = map(noseX, 0, width, 1, 0);

      info();
    }
  }

  push();
  translate(width / 2, height / 2);
  factor += 0.015;
  for (let i = 0; i < total; i++) {
    const a = getVector(i, total);
    const b = getVector(i * factor, total);
    wobble(a.x, a.y, b.x, b.y);

  }
  pop();
  //map the sun altitude to set the duration time 
  if (sun_altitude_changed) {
    sunToDur = map(sun_altitude, -90, 90, 1, 400);
    player.duration = sunToDur.toFixed(2);
    console.log("suntoDur - player duration", sunToDur.toFixed(2));
    sun_altitude_changed = false;
  } else {
    player.duration = 100;
  }
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

//update the lat and draw every 20 seconds 
window.setInterval(() => {
  //getAllData(recordingLink);
  adjustFooter();
  playState = true;
  sun_altitude_changed = true;
  console.log("playstate", playState)
}, 100000);

function getAllData(recordingLink) {
  newLat = float(random(lat, lat + 50)).toFixed(2);
  newLon = float(random(lon, lon + 50)).toFixed(2);
  //constantly updates the link and update it in the player 
  Audio_URL = `https://aporee.org/api/ext/?lat=${newLat}&lng=${newLon}`;

  fetchLink();
  //read response intervally 
  issPath = "https://api.wheretheiss.at/v1/satellites/25544";
  sunPath = "https://api.ipgeolocation.io/astronomy?apiKey=b83a03b773884e748b520602f359e4b8";

  httpDo(issPath, 'GET', readResponseISS);
  httpDo(sunPath, 'GET', readResponse);
  console.log("getting field recordings");
}

function readResponseISS(e) {
  let ISSdata = JSON.parse(e);
  lat = ISSdata.latitude.toFixed(2);
  lon = ISSdata.longitude.toFixed(2);
}

function readResponse(response) {
  let data = JSON.parse(response);
  sun_altitude = data.sun_altitude;
  console.log("sun_altitude", sun_altitude.toFixed(2));

}
//get webcam data to manipulate some thing - simple posenet - add graphics later 
// would be a symphony of sun and us - sun is always playing in the background; human movement geneerate something else
function info() {
  usParagraph.innerHTML = "With webcam, you can join in the symphony. <br><br>" +
    ` Move your head horizontally to distort the recording:  ${Number(distortion.distortion).toFixed(2)} <br><br>` +
    ` Move your head vertically to choose the cut off frequency:  ${Number(player.cutoffFreq).toFixed(2)} <br><br>` +
    ` Move your right hand vertically to change pitch: ${Number(shifter.pitch).toFixed(0)} <br><br>` +
    ` Move your left hand to set the loop start point: ${Number(player.loopStart).toFixed(0)} <br><br>` +
    ` Move your right hand to set the loop end point: ${Number(player.loopEnd).toFixed(0)} <br><br>`;
}

// simple visuals
function getVector(index, total) {
  const angle = map(index % total, 0, total, 0, TWO_PI);
  const v = p5.Vector.fromAngle(angle + PI);
  v.mult(r);
  return v;
}

function wobble(x, y, a, b) {
  //with slider 
  if (state == "sun") {
    distortionLevel = map(distortion.distortion, 0, 1, 1, 20);
    total = map(shifter.pitch, -12, 12, 10, 150);
    loopRange = player.loopEnd - player.loopStart;
    loopLevel = map(loopRange, 0, player.loopEnd + player.loopStart, 1, 10);
    cutoffLevel = map(player.cutoffFreq, 0, 10000, 1, 5);
  }

  if (state == "us") {

    if(noseX && noseY){
    //with posenet 
    distortionLevel = map(noseX, 0, width, 1, 10);
    total = map(noseY, 0, height, 10, 150);
    loopRange = rightWristX - leftWristX;
    loopLevel = map(loopRange, 0, width, 1, 10);
    cutoffLevel = map(rightWristX, 0, 10000, 1, 5);

  }
}

  zoff += 0.5;
  if (zoff > 2) {
    zoff = 0;
  }

  x += random(-2 * zoff, 2 * zoff);
  y += random(-1 * zoff, 1 * zoff);
  a += random(-2 * zoff, 2 * zoff);
  b += random(-5 * zoff, 5 * zoff);
  // let col; //create gradient color 

  stroke("white");
  strokeWeight(distortionLevel / 20 * zoff);
  noFill();
  line(x * loopLevel, y * loopLevel, a, b);
  line(x * r / width / b, y * r / height, a, b);

  noStroke();
  fill("white");
  ellipse(a * total * 2, b * distortionLevel * 2, y / total);
  rect(a * total / 2, b * distortionLevel * 2, y / total, x / distortionLevel);

  stroke("white");
  strokeWeight(cutoffLevel / zoff / 10);
  noFill();
  ellipse(x * cutoffLevel, y * cutoffLevel / total, b / cutoffLevel * zoff);

}

let isModelReady = false;
function modelReady() {
  console.log('Model Loaded and Update Audio Effects');
  info();
  isModelReady = true;
}
function drawKeypoints() {
  for (let i = 0; i < poses.length; i++) {

    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];
      if (keypoint.score > 0.9) {
        if (keypoint.part === 'nose') {
          noseX = keypoint.position.x;
          noseY = keypoint.position.y;
        } if (keypoint.part === 'leftWrist') {
          leftWristX = keypoint.position.x;
          leftWristY = keypoint.position.y;
        } if (keypoint.part === 'rightWrist') {
          rightWristX = keypoint.position.x;
          rightWristY = keypoint.position.y;
        }
      }
    }
  }

}
