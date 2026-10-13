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


let testingBool = false;

let sun_altitude, lat, lon; //sun altitude range -90 - 90 (from night time to day time) 
let shifter, player, distortion;
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

let video;
let poseNet;
let poses = [];
let cameraLoading = false;
let cameraReadyTimer;
let modelReadyTimer;
let experienceStarted = false;
let lastInfoUpdate = 0;
let lastAudioUpdate = 0;
let recordingQueue;
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
let soundSetting = document.getElementById('soundSetting');
let muteImg = document.getElementById('mute');
let unmuteImg = document.getElementById('unmute');

soundSetting.addEventListener('click', function () {
  console.log('sound setting clicked');
  if (player == null)
    return;

  if (player.volume.value === -Infinity) {
    console.log("unmute");
    muteImg.src = "./assets/volume-up-solid.svg";
    unmutePlayer();
  } else {
    console.log("mute");
    muteImg.src = "./assets/volume-mute-solid.svg";

    mutePlayer();
  }

});
let sliderControl = document.getElementById("sliderControl");
let intro = document.getElementById("intro");

let startButton = document.getElementById('startButton');

startButton.addEventListener('click', async function () {
  await Tone.start();
  experienceStarted = true;
  if (player && player.loaded && player.state !== 'started') player.start();
  unmutePlayer();
  console.log("intro button clicked")
  if (intro.style.display == "none") {
    sliderControl.style.display = "none";
    intro.style.display = "flex";
  } else {
    sliderControl.style.display = "flex";
    intro.style.display = "none";
  }
});


about.addEventListener("click", function () {
  console.log("? clicked")
  if (showAbout.style.display == "block") {
    showAbout.style.display = "none";
    about.innerHTML = "<h2>❔</h2>";
  } else {

    showAbout.style.display = "block";
    about.innerHTML = "<h2 id='close'>✖</h2>";
  }
});


document.getElementById("sketchDiv").addEventListener('click', () => {

  if (testingBool == false)
    return;
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
  if (testingBool) {
    recordingPath = Audio_URL;
  } else {
    recordingPath = proxy.concat(Audio_URL);
  }
  // Data and audio begin after the player and local fallback are ready.
}
// once link is fetched, the button is interactable 
function fetchLink() {
  if (!player) return;
  const nextRecordingPath = testingBool ? Audio_URL : proxy.concat(Audio_URL);
  // fetch the api link 
  fetch(nextRecordingPath, {
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
      player.load(url).catch(() => loadFallbackRecording());
      
      return url;
    }).catch((error) => {
      // fetch the deafult local json if api does not work 
      const defaultLink = GetDefaultAudioLink();
      console.log("api fetch error: ", error);
      if (defaultLink) player.load(defaultLink).catch(console.error);
      return defaultLink;
    });
}

function loadFallbackRecording() {
  const url = GetDefaultAudioLink();
  if (url && player) return player.load(url);
}

function GetDefaultAudioLink() {
  console.log("GetDefaultAudioLink when API doesnt work");
  if (!defaultJson || !defaultJson.length)
    return;
  if (!recordingQueue) recordingQueue = new NonRepeatingRandomizer(defaultJson.length);

  indexForRadio = recordingQueue.getNextIndex();
  console.log("random number: ", indexForRadio);
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


function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}
// as a fall back method 
function GetAudioFromDefaultJson() {
  return fetch('./src/fallbackLocalData.json')
    .then(response => response.json())
    .then(data => {
      defaultJson = data;

    })
    .catch(error => console.log(error));
}

function windowResized() {
  // Resize the canvas when the window is resized
  resizeCanvas(min(windowWidth, 1920), min(windowHeight, 1080));
  r = min(width, height) * 0.32;

  if (windowHeight < 768 && windowWidth < 600) {
    heightOffset = 300 / windowHeight * windowWidth;
  } else {
    heightOffset = 100;
  }
  if (isModelReady && player) info();
}

function adjustFooter() {
  let footer = document.getElementById('footer');
  infoString = `${lat == null ? 'A field recording' : `ISS latitude ${lat}, longitude ${lon}.`} ${rectitle || 'Field recording'} by ${artist || 'Radio Aporee'}${recdate ? `, recorded ${recdate}` : ''}.`;
  if (footer.textContent !== infoString) footer.textContent = infoString;
}
async function initializeCamera() {
  if (cameraLoading || video) return;
  cameraLoading = true;
  usParagraph.textContent = 'Loading movement tracking…';
  try {
    if (!window.ml5) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = './src/js/ml5.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
  } catch (error) {
    cameraLoading = false;
    usParagraph.textContent = 'Movement tracking could not load. The Sun controls are still available.';
    return;
  }
  if (typeof ml5.poseNet !== 'function') {
    usParagraph.textContent = 'Movement tracking is unavailable. You can still use the Sun controls.';
    cameraLoading = false;
    return;
  }
  const startPoseNet = () => {
    if (poseNet || !video || !video.elt.videoWidth) return;
    clearTimeout(cameraReadyTimer);
    usParagraph.textContent = 'Camera ready. Loading body tracking…';
    try {
      poseNet = ml5.poseNet(video, { flipHorizontal: true }, modelReady);
      poseNet.on('pose', (results) => { poses = results; });
      modelReadyTimer = setTimeout(() => {
        if (!isModelReady) usParagraph.textContent = 'The camera is ready, but body tracking is taking longer than expected. Try Sun controls or reload this page.';
      }, 20000);
    } catch (error) {
      console.error('Pose tracker failed to start', error);
      usParagraph.textContent = 'Body tracking could not start. The Sun controls are still available.';
    }
    cameraLoading = false;
  };
  video = createCapture(VIDEO, startPoseNet);
  video.size(640, 360);
  video.hide();
  video.elt.addEventListener('loadeddata', startPoseNet, { once: true });
  video.elt.addEventListener('error', () => {
    usParagraph.textContent = 'Camera feed unavailable. Check browser camera permission and try again.';
    cameraLoading = false;
  }, { once: true });
  cameraReadyTimer = setTimeout(() => {
    if (!poseNet) {
      usParagraph.textContent = 'Waiting for the camera. Check browser camera permission, then reload this page if needed.';
      cameraLoading = false;
    }
  }, 12000);
}

function SetupAudioPlayer() {
  shifter = new Tone.PitchShift();
  player = new Tone.Player({
    "onload": () => {
      if (experienceStarted && player.state !== 'started') player.start();
    },
    "autostart": false,
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

  mutePlayer();  //order of the effect matters 
  player.chain(shifter, distortion, filter, feedbackDelay, Tone.Destination);

// load default audio first
  let url = GetDefaultAudioLink();
  if (url) player.load(url).catch(console.error);
  adjustFooter();

}

function unmutePlayer() {
  if (player == null)
    return;
  console.log("unmute player");
  player.volume.value = -12; // Set volume to default level, or any desired level
}
function mutePlayer() {
  if (player == null)
    return;
  console.log("mute player");
  player.volume.value = -Infinity; // Set volume to default level, or any desired level

}
function setup() {
  pixelDensity(1);
  frameRate(30);
  bgCanvas = createCanvas(min(windowWidth, 1920), min(windowHeight, 1080));
  bgCanvas.style('width', '100vw');
  bgCanvas.style('height', '100vh');
  r = min(width, height) * 0.32;
  bgCanvas.id = "bgCanvas";
  bgCanvas.parent("sketchDiv");

  GetAudioFromDefaultJson().then(() => {
    SetupAudioPlayer();
    fetchLink();
    httpDo(issPath, 'GET', readResponseISS);
    httpDo(sunPath, 'GET', readResponse);
  });
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
  // at very beginning


  const sunContent = document.getElementById('sunContent');
  const usContent = document.getElementById('usContent');
  usContent.style.display = 'none';

  sunButton.addEventListener('click', function () {
    state = "sun";
    sunButton.setAttribute('aria-pressed', 'true');
    usButton.setAttribute('aria-pressed', 'false');
    console.log("sunButton is pressed");
    sunContent.style.display = 'block';
    usContent.style.display = 'none';
  });


  usButton.addEventListener('click', function () {
    state = "us";
    sunButton.setAttribute('aria-pressed', 'false');
    usButton.setAttribute('aria-pressed', 'true');
    console.log("usButton is pressed");
    sunContent.style.display = 'none';
    usContent.style.display = 'block';
    initializeCamera();
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
    //console.log("player loop end is ", player.loopEnd, player.buffer.duration);
    loopEndDisplay.textContent = `Loop End: ${loopEndValue}`; // Update the <p> text content
  });

  const cutoffFreqSlider = document.getElementById('cutoffFreqSlider');
  const cutoffFreqDisplay = document.getElementById('cutoffFreqValue'); // Get the <p> element

  cutoffFreqSlider.addEventListener('input', function () {
    const cutoffFreqValue = parseFloat(this.value);
    filter.frequency.value = cutoffFreqValue;
    cutoffFreqDisplay.textContent = `Cutoff Frequency: ${cutoffFreqValue}`; // Update the <p> text content
  });

});


function draw() {
  background(0);
  if (state === "us" && video && video.elt.readyState >= 2) {
    const preview = PoseCoordinates.previewRect(width, height);
    push();
    translate(preview.x + preview.width, preview.y);
    scale(-1, 1);
    image(video, 0, 0, preview.width, preview.height);
    pop();
    push();
    noFill();
    stroke(249, 215, 28, 180);
    rect(preview.x, preview.y, preview.width, preview.height);
    pop();
  }
  if (state === "us" && isModelReady) {
    drawKeypoints();
    const landmarks = [[noseX, noseY], [leftWristX, leftWristY], [rightWristX, rightWristY]];
    push();
    noStroke();
    fill(249, 215, 28);
    for (const [x, y] of landmarks) {
      if (Number.isFinite(x) && Number.isFinite(y)) {
        const stage = PoseCoordinates.stagePoint({ x, y }, width, height);
        ellipse(stage.x, stage.y, 14, 14);
      }
    }
    pop();
    if (player && player.loaded && millis() - lastAudioUpdate > 100) {
      const length = player.buffer.duration;
      if (Number.isFinite(leftWristX)) player.loopStart = constrain(leftWristX * length * 0.8, 0, length * 0.8);
      if (Number.isFinite(rightWristX)) player.loopEnd = constrain(player.loopStart + rightWristX * (length - player.loopStart), player.loopStart + 0.1, length);
      if (Number.isFinite(rightWristY)) shifter.pitch = constrain(12 - rightWristY * 24, -12, 12);
      if (Number.isFinite(noseY)) filter.frequency.value = constrain(2000 - noseY * 1850, 150, 2000);
      if (Number.isFinite(noseX)) distortion.distortion = constrain(1 - noseX, 0, 1);
      lastAudioUpdate = millis();
    }
    if (player && millis() - lastInfoUpdate > 300) {
      info();
      lastInfoUpdate = millis();
    }
  }
  const pitch = shifter ? shifter.pitch : 0;
  const count = constrain(round(map(pitch, -12, 12, 12, 56)), 12, 56);
  const distortionLevel = distortion ? map(distortion.distortion, 0, 1, 1, 20) : 4;
  const loopRange = player && player.loaded ? player.loopEnd - player.loopStart : 1;
  const loopLevel = constrain(map(loopRange, 0, player && player.loaded ? player.buffer.duration : 100, 1, 8), 1, 8);
  const cutoffLevel = filter ? map(filter.frequency.value, 150, 10000, 1, 5) : 2;
  push();
  translate(width / 2, height / 2);
  factor += 0.015;
  for (let i = 0; i < count; i++) {
    const a = getVector(i, count);
    const b = getVector(i * factor, count);
    wobble(a.x, a.y, b.x, b.y, distortionLevel, loopLevel, cutoffLevel, count);
  }
  pop();
}

// get random number from the ilst and once the number is used, remove from the list. 
// until all number is used, restart the list so that it is not duplicated 

// function getRandomInt(max) {
//   return Math.floor(Math.random() * max);
// }
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]]; // ES6 array destructuring to swap elements
  }
}
class NonRepeatingRandomizer {
  constructor(arrayLength) {
      this.arrayLength = arrayLength;
      this.indices = Array.from({ length: arrayLength }, (_, i) => i);
      this.lastIndex = null; // Track the last index to avoid immediate repetition across boundaries
      this.shuffleIndices();
  }

  shuffleIndices() {
      shuffleArray(this.indices);
      // Ensure the first index of the new shuffle is not the same as the last index of the previous cycle
      if (this.indices[0] === this.lastIndex) {
          [this.indices[0], this.indices[this.indices.length - 1]] = [this.indices[this.indices.length - 1], this.indices[0]];
      }
      this.currentIndex = 0;
  }

  getNextIndex() {
      if (this.currentIndex >= this.arrayLength) {
          this.lastIndex = this.indices[this.currentIndex - 1];
          this.shuffleIndices();
      }
      return this.indices[this.currentIndex++];
  }
}

//update the lat and draw every 20 seconds 
window.setInterval(() => {
  if (!player || !player.loaded || document.hidden) return;
  getAllData();
  adjustFooter();
  //console.log("playstate", playState)
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
  //console.log("getting field recordings");
}

function readResponseISS(e) {
  let ISSdata = JSON.parse(e);
  lat = ISSdata.latitude.toFixed(2);
  lon = ISSdata.longitude.toFixed(2);
}

function readResponse(response) {
  let data = JSON.parse(response);
  sun_altitude = Number(data.sun_altitude);
  if (Number.isFinite(sun_altitude) && filter && state === 'sun') {
    filter.frequency.value = constrain(map(sun_altitude, -90, 90, 250, 6000), 250, 6000);
  }

}
//get webcam data to manipulate some thing - simple posenet - add graphics later 
// would be a symphony of sun and us - sun is always playing in the background; human movement geneerate something else
function info() {
  const nextText = "With webcam, you can join in the symphony. <br><br>" +
    ` Move your head horizontally to distort the recording:  ${Number(distortion.distortion).toFixed(2)} <br><br>` +
    ` Move your head vertically to choose the cut off frequency:  ${Number(filter.frequency.value).toFixed(0)} <br><br>` +
    ` Move your right hand vertically to change pitch: ${Number(shifter.pitch).toFixed(0)} <br><br>` +
    ` Move your left hand to set the loop start point: ${Number(player.loopStart).toFixed(0)} <br><br>` +
    ` Move your right hand to set the loop end point: ${Number(player.loopEnd).toFixed(0)} <br><br>`;
  if (usParagraph.innerHTML !== nextText) usParagraph.innerHTML = nextText;
}

// simple visuals
function getVector(index, total) {
  const angle = map(index % total, 0, total, 0, TWO_PI);
  const v = p5.Vector.fromAngle(angle + PI);
  v.mult(r);
  return v;
}

function wobble(x, y, a, b, distortionLevel, loopLevel, cutoffLevel, count) {
  zoff += 0.5;
  if (zoff > 2) zoff = 0.5;
  x += random(-2 * zoff, 2 * zoff);
  y += random(-1 * zoff, 1 * zoff);
  a += random(-2 * zoff, 2 * zoff);
  b += random(-5 * zoff, 5 * zoff);
  stroke("white");
  strokeWeight(distortionLevel / 20 * zoff);
  noFill();
  line(x * loopLevel, y * loopLevel, a, b);
  line(x * r / width / (abs(b) + 1), y * r / height, a, b);
  noStroke();
  fill("white");
  ellipse(a * count * 2, b * distortionLevel * 2, y / count);
  rect(a * count / 2, b * distortionLevel * 2, y / count, x / distortionLevel);
  stroke("white");
  strokeWeight(cutoffLevel / zoff / 10);
  noFill();
  ellipse(x * cutoffLevel, y * cutoffLevel / count, b / cutoffLevel * zoff);
}

let isModelReady = false;
function modelReady() {
  console.log('Model Loaded and Update Audio Effects');
  clearTimeout(modelReadyTimer);
  isModelReady = true;
  if (player) info();
}
function drawKeypoints() {
  noseX = noseY = leftWristX = leftWristY = rightWristX = rightWristY = NaN;
  const pose = poses[0] && poses[0].pose;
  if (!pose || !video) return;
  const sourceWidth = video.elt.videoWidth || video.width || 640;
  const sourceHeight = video.elt.videoHeight || video.height || 360;
  for (const keypoint of pose.keypoints) {
    if (keypoint.score < 0.55) continue;
    const point = PoseCoordinates.normalize(keypoint.position, sourceWidth, sourceHeight);
    if (!point) continue;
    if (keypoint.part === 'nose') { noseX = point.x; noseY = point.y; }
    if (keypoint.part === 'leftWrist') { leftWristX = point.x; leftWristY = point.y; }
    if (keypoint.part === 'rightWrist') { rightWristX = point.x; rightWristY = point.y; }
  }
}
