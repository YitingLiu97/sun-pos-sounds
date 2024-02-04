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
let buttonSun, buttonUs;
let shiftSlider;
//set default lat and lon for Aporee API
let newLat = 52.5;
let newLon = 13.5;
let bgCanvas;
let Audio_URL;
// songURL = "https://cors-anywhere.herokuapp.com/https://aporee.org/maps/files/9EdDamazintheedrinken1525.mp3"
let songLength;

let distortionEffect = 0.2,
  distortionSlider;
let pingPong, pingPongSlider;
let filter, feedbackDelay;
//loop start and end depending on the sun location 
//sun's distance to the location determines the effect 
// find the clip within the 100 radius of the longitude and altitude of location compared to the sun 
let loopStart = 0,
  loopEnd = 500;
let loopStartSlider, loopEndSlider;

let cuoffFreq = 400;
let cutoffFreqSlider;

let fadeInTime = 0.5,
  fadeOutTime = 0.5; // change the fade in fade out time based on the sun 
let path, recordingLink, newRecordingLink;
let rectitle;
let artist;
let timeZone;
let recdate;
let infoString;
let duration, RLat, RLog, Rlink;
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

let indexForRadio = 0;

about.addEventListener("click", function () {
  console.log("? clicked")
  if (showAbout.style.display == "none") {
    showAbout.style.display = "block";
    about.innerHTML = "<h2>✖</h2>";
  } else {
    showAbout.style.display = "none";
    about.innerHTML = "<h2>❔</h2>";

  }
});


function preload() {
  issPath = "https://api.wheretheiss.at/v1/satellites/25544";
  sunPath = "https://api.ipgeolocation.io/astronomy?apiKey=b83a03b773884e748b520602f359e4b8";
  Audio_URL = `https://aporee.org/api/ext/?lat=${newLat}&lng=${newLon}`;

  console.log("audio url is " + Audio_URL);
  recordingPath = proxy.concat(Audio_URL);
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

function getJsonFromAPI() {
  fetch(recordingPath, {
    "headers": {
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site"
    },
    "referrerPolicy": "no-referrer-when-downgrade",
    "body": null,
    "method": "GET",
    "mode": "cors",
    "credentials": "omit"
  }).then((response) => {

    if (response.ok) {
      console.log("response is okay");
      return response.json();
    }

    return Promise.reject(response);
  }).then((json) => {

    console.log("current json is " + json);

  }).catch((error) => {
    console.log(error.status, error.statusText);
    error.json().then((json) => {
      console.log(json);
    })
  })
}

function fetchLink() {
  fetch(recordingPath, {
    "headers": {
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site"
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
      return recordingLink;
    }).catch((error) => {
      defaultLink = "https://aporee.org/api/ext/?lat=52.5&lng=13.5";
      console.log(error);
      return defaultLink;
    });
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

  updateUI(heightOffset);
  info(heightOffset);
}

function setup() {

  textFont('Arial');
  r = width / 2 - 200;
  bgCanvas = createCanvas(windowWidth, windowHeight);
  bgCanvas.id = "bgCanvas";
  bgCanvas.parent("sketchDiv");

  video = createCapture(VIDEO);
  video.size(width, height);

  //single detection for now 
  poseNet = ml5.poseNet(video, {
    flipHorizontal: true
  }, modelReady);

  poseNet.on('pose', function (results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();

  //manipulate field recordings 
  shifter = new Tone.PitchShift().toMaster();


  console.log("shifter is ", shifter);
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


  filter = new Tone.Filter(cuoffFreq).toMaster();
  feedbackDelay = new Tone.FeedbackDelay(0.125, 0.5).toMaster();

  pingPong = new Tone.PingPongDelay({
    "delayTime": 0.25,
    "maxDelayTime": 1
  }).toMaster();

  distortion = new Tone.Distortion({
    "distortion": distortionEffect,
  }).toMaster();

  //order of the effect matters 
  player.chain(shifter, distortion, filter, feedbackDelay, Tone.Master);
  createUI(heightOffset);
  buttonSun.mousePressed(sunIsPressed);
  buttonUs.mousePressed(usIsPressed);
  info(heightOffset);


}
let spacing = 50;
let startingPoint = 100;
let heightOffset = 100;

function updateUI(heightOffset) {
  // frameRate(25);
  fill(255);
  buttonSun.position(width / 2 - 60 - buttonSun.width / 2, height / 2 - heightOffset);
  buttonUs.position(width / 2 + 60 - buttonUs.width / 2, height / 2 - heightOffset);
  shiftSlider.position(width / 2 - 100, height / 2 + startingPoint + spacing - heightOffset);
  loopStartSlider.position(width / 2 - 100, height / 2 + startingPoint + spacing * 2 - heightOffset);
  loopEndSlider.position(width / 2 - 100, height / 2 + startingPoint + spacing * 3 - heightOffset);
  distortionSlider.position(width / 2 - 100, height / 2 + startingPoint + spacing * 4 - heightOffset);
  cutoffFreqSlider.position(width / 2 - 100, height / 2 + startingPoint + spacing * 5 - heightOffset);
}

function createUI() {

  buttonSun = createButton("Sun");
  buttonUs = createButton("US");
  shiftSlider = createSlider(-12, 12, -12, 1);
  shiftSlider.style("width", "200px");
  loopStartSlider = createSlider(0, 100, 1, 10);
  loopStartSlider.style("width", "200px");
  loopEndSlider = createSlider(0, 500, 0, 10);
  loopEndSlider.style("width", "200px");
  distortionSlider = createSlider(0, 1, 0, 0);
  distortionSlider.style("width", "200px");
  cutoffFreqSlider = createSlider(0, 10000, 0, 100);
  cutoffFreqSlider.style("width", "200px");
  updateUI(heightOffset);

}

function sunIsPressed() {
  state = "sun";
  buttonSun.style('background-color', 'black');
  buttonSun.style('color', 'white');
  buttonUs.style('background-color', 'white');
  buttonUs.style('color', 'black');
  // console.log("sun is pressed");
  return state;
}

function usIsPressed() {
  state = "us";
  buttonUs.style('background-color', 'black');
  buttonUs.style('color', 'white');
  buttonSun.style('background-color', 'white');
  buttonSun.style('color', 'black');

  // console.log("us is pressed");
  return state;
}

/*Avoiding putting any sound triggering functions in draw() for this example
 */
function draw() {

  background(0);

  // console.log( "player duration ",player.duration);

  // if choose webcam 
  if (state == "us") {
    loopStartSlider.hide();
    loopEndSlider.hide();
    shiftSlider.hide();
    distortionSlider.hide();
    cutoffFreqSlider.hide();

    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, width / 8 * 7, 0, width / 8, width / 8 / 16 * 9); //video on canvas, position, dimensions
    pop();

    drawKeypoints();
    noStroke();

    push();
    ellipse(noseX, noseY, 10, 10);
    fill(249, 215, 28);
    ellipse(leftWristX, leftWristY, 10, 10);
    ellipse(rightWristX, rightWristY, 10, 10);
    pop();

    loopStart = map(leftWristX, 0, width, 0, 50);
    loopEnd = map(rightWristX, width, 0, 0, 500);
    shifter._pitch = map(rightWristY, 0, height, -12, 12);
    cutoffFreq = map(noseY, 0, height, 1000, 100);
    distortionEffect = map(noseX, 0, width, 1, 0);

  }
  //if choose no webcam
  else {

    loopStartSlider.show();
    loopEndSlider.show();
    shiftSlider.show();
    distortionSlider.show();
    cutoffFreqSlider.show();

    shifter._pitch = shiftSlider.value();
    loopStart = loopStartSlider.value();
    loopEnd = loopEndSlider.value();
    cutoffFreq = cutoffFreqSlider.value();
    distortionEffect = distortionSlider.value();

    textAlign('right');
    fill("white");
    text("Pitch: " + shiftSlider.value() + " Half Steps", shiftSlider.x + shiftSlider.width, shiftSlider.y - spacing / 5);
    text("Loop Start: " + int(loopStartSlider.value()), loopStartSlider.x + loopStartSlider.width, loopStartSlider.y - spacing / 5);
    text("Loop End: " + int(loopEndSlider.value()), loopEndSlider.x + loopEndSlider.width, loopEndSlider.y - spacing / 5);
    text("Distortion: " + Number(distortionSlider.value().toFixed(2)), distortionSlider.x + distortionSlider.width, distortionSlider.y - spacing / 5);
    text("Cut Off Frequency: " + int(cutoffFreqSlider.value()), cutoffFreqSlider.x + cutoffFreqSlider.width, cutoffFreqSlider.y - spacing / 5);

  }

  //to autostart 
  player.autostart = true;
  player.loopStart = loopStart;
  player.loopEnd = loopEnd;

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
    sun_altitude_changed=false;
  } else {
    player.duration = 100;
  //  console.log("suntoDur - player duration in else", sunToDur);
  }

  player.volume.value = -12;
  //assign individual values to player to update 
  player.loopEnd = loopEnd;
  distortion.distortion = distortionEffect;
  filter.cutoff = cuoffFreq;
  info(heightOffset);
}

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

//update the lat and draw every 20 seconds 
window.setInterval(() => {
  getAllData(recordingLink);
  playState = true;
  sun_altitude_changed = true;
  console.log("playstate", playState)
}, 10000);

function loading() {
  text('loading', width / 2, height / 2);
}
function getAllData(recordingLink) {
  newLat = float(random(lat, lat + 50)).toFixed(2);
  newLon = float(random(lon, lon + 50)).toFixed(2);
  //constantly updates the link and update it in the player 
  Audio_URL = `https://aporee.org/api/ext/?lat=${newLat}&lng=${newLon}`;

  fetchLink();
  if (recordingLink) {
    let url = proxy.concat(recordingLink);
    player.load(url);
  }
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
function info(heightOffset) {

  if (state === "us") {
    textAlign('center');
    textSize(24);
    instructionWebCam = `With webcam, you can join in the symphony.`;

    textSize(15);
    instruction1 = `Move your head horizontally to distort the recording:  ${Number(distortionEffect).toFixed(2)} `;
    instruction2 = ` Move your head vertically to choose the cut off frequency:  ${Number(cutoffFreq).toFixed(2)}`;
    instruction3 = `Move your right hand vertically to change pitch: ${Number(shifter._pitch).toFixed(0)}`;
    instruction4 = ` Move your left hand to set the loop start point: ${Number(loopStart).toFixed(0)}`;
    instruction5 = `Move your right hand to set the loop end point: ${Number(loopEnd).toFixed(0)}`;

    text(instructionWebCam, width / 2, height / 2 + startingPoint + spacing / 1.5 - heightOffset);
    text(instruction1, width / 2, height / 2 + startingPoint + spacing * 2 / 1.5 - heightOffset);
    text(instruction2, width / 2, height / 2 + startingPoint + spacing * 3 / 1.5 - heightOffset);
    text(instruction3, width / 2, height / 2 + startingPoint + spacing * 4 / 1.5 - heightOffset);
    text(instruction4, width / 2, height / 2 + startingPoint + spacing * 5 / 1.5 - heightOffset);
    text(instruction5, width / 2, height / 2 + startingPoint + spacing * 6 / 1.5 - heightOffset);

  }
  textAlign("left");
  infoString = `The ISS is currently at Latitude of ${lat} and Longitude of ${lon}. The ${rectitle} is uploaded by ${artist} on ${recdate} in ${timeZone}`;
  text(infoString, 50, height - 80, width - 50, height);
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
    distortionLevel = map(distortionEffect, 0, 1, 1, 20);
    total = map(shifter._pitch, -12, 12, 10, 150);
    loopRange = loopEnd - loopStart;
    loopLevel = map(loopRange, 0, loopEnd + loopStart, 1, 10);
    cutoffLevel = map(cutoffFreq, 0, 10000, 1, 5);
  }

  if (state == "us") {
    //with posenet 
    distortionLevel = map(noseX, 0, width, 1, 10);
    total = map(noseY, 0, height, 10, 150);
    loopRange = loopEnd - loopStart;
    loopLevel = map(loopRange, 0, width, 1, 10);
    cutoffLevel = map(cutoffFreq, 0, 10000, 1, 5);

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


function modelReady() {
  console.log('Model Loaded');
}

function drawKeypoints() {
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];

      if (keypoint.score > 0.9) {
        if (keypoint.part = 'nose') {
          noseX = keypoint.position.x;
          noseY = keypoint.position.y;
        }
        if (keypoint.part = 'leftWrist') {
          leftWristX = keypoint.position.x;
          leftWristY = keypoint.position.y;
        }
        if (keypoint.part = 'rightWrist') {
          rightWristX = keypoint.position.x;
          rightWristY = keypoint.position.y;
        }
      }
    }
  }

}
