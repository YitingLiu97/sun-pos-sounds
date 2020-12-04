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

let sun_altitude, lat, lon;//sun altitude range -90 - 90 (from night time to day time) 
let shifter, player;
let songURL;
let button;
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
  loopEnd = 0;
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
const proxy = 'https://proxy-server-yt.herokuapp.com/';


let video;
let poseNet;
let poses = [];



function preload() {
  //read sun API 
  sunPath = "https://api.ipgeolocation.io/astronomy?apiKey=e01854cbed884f7d97f31665ef5d352e";
  httpDo(sunPath, 'GET', readResponse);
  //read ISS API 
  issPath = "https://api.wheretheiss.at/v1/satellites/25544";
  httpDo(issPath, 'GET', readResponseISS);

  Audio_URL = `https://aporee.org/api/ext/?lat=${newLat}&lng=${newLon}`;

  recordingPath = proxy + Audio_URL;

  const myHeaders = new Headers();

  const myRequest = new Request(recordingPath, {
    method: 'GET',
    headers: myHeaders,
    mode: 'no-cors',
    cache: 'default'
  });
  fetchLink();
}

function fetchLink() {
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
      // console.log(myBlob)
      recordingLink = myBlob[0].url;

     rectitle=myBlob[0].rectitle;
      artist=myBlob[0].artist;
      timeZone=myBlob[0].timezone;
     recdate=myBlob[0].recdate;
      // console.log("recordingLink", recordingLink);
      return recordingLink;
    });

}

let factor = 3,
  total = 10,
  zoff = 0;


let sunToDur;

function setup() {
 
  r = width / 2 - 200;
  bgCanvas = createCanvas(windowWidth, windowHeight);
  bgCanvas.id = "bgCanvas";
  bgCanvas.parent("sketchDiv");

  video = createCapture(VIDEO);
  video.size(width, height);

  //single detection for now 
  poseNet = ml5.poseNet(video, modelReady);

  poseNet.on('pose', function(results) {
    poses = results;
  });
  // Hide the video element, and just show the canvas
  video.hide();


//manipulate field recordings 
  shifter = new Tone.PitchShift().toMaster();

  player = new Tone.Player({
    "onload": Tone.noOp,
    "autostart": true,
    "loop": true, //set the loop to be true to use loopstart and loopend
    "loopStart": loopStart,
    "loopEnd": loopEnd,
    "reverse": false,
    "duration": 2, //changed by the sun altitude in draw; 
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

  //UI
  shiftSlider = createSlider(-12, 12, 2, 1);
  shiftSlider.style("width", "200px");
  shiftSlider.position(width / 2 - 100, height / 2 + 150);

  button = createButton("Play Sound");
  button.position(width / 2 - 50, height / 2);

  button.parent("ui");
  //should replace the end range as the length of the audio 
  loopStartSlider = createSlider(0, 10000, 20, 1);
  loopStartSlider.style("width", "200px");
  loopStartSlider.position(width / 2 - 100, height / 2 + 200);

  loopEndSlider = createSlider(0, 10000, 5000, 1);
  loopEndSlider.style("width", "200px");
  loopEndSlider.position(width / 2 - 100, height / 2 + 270);

  distortionSlider = createSlider(0, 1, 0.1, 0);
  distortionSlider.style("width", "200px");
  distortionSlider.position(width / 2 - 100, height / 2 + 340);

  cutoffFreqSlider = createSlider(0, 10000, 500, 100);
  cutoffFreqSlider.style("width", "200px");
  cutoffFreqSlider.position(width / 2 - 100, height / 2 + 420);

  newLat = round(random(lat, lat + 20),2);
  newLon = round(random(lon, lon + 20),2);
  //constantly updates the link and update it in the player 
  Audio_URL = `https://aporee.org/api/ext/?lat=${newLat}&lng=${newLon}`;
  fetchLink();
  let url = proxy.concat(recordingLink);
  player.load(url);

}
/*Avoiding putting any sound triggering functions in draw() for this example
 */
function draw() {

  image(video, 0, 0, width, height);
  drawKeypoints();

  shifter.pitch = shiftSlider.value();
  loopStart = loopStartSlider.value();
  loopEnd = loopEndSlider.value();
  cutoffFreq = cutoffFreqSlider.value();
  distortionEffect = distortionSlider.value();
  // background("black",0.2);

  push();
  translate(width / 2, height / 2);
  factor += 0.015;
  for (let i = 0; i < total; i++) {
    const a = getVector(i, total);
    const b = getVector(i * factor, total);
    wobble(a.x, a.y, b.x, b.y);

  }
  pop();
  
  //to autostart 
  player.autostart = true;
  //map the sun altitude to set the duration time 
  sunToDur=map(sun_altitude,-90,90,1,20);

  //assign individual values to player to update 
  player.loopEnd = loopEnd;
  distortion.distortion = distortionEffect;
  filter.cutoff = cuoffFreq;

  //when requests too much, it does not work 
  player.duration=sunToDur;
  console.log("suntoDur",sunToDur)
  fill("white");
  text("Shift value parameter: " + shiftSlider.value() + " half steps", shiftSlider.x + 100, shiftSlider.y - 10);
  text(int(loopStartSlider.value()) + "loopStartSlider", loopStartSlider.x + 100, loopStartSlider.y - 10);
  text(int(loopEndSlider.value()) + "loopEndSlider", loopEndSlider.x + 100, loopEndSlider.y - 15);
  text(Number(distortionSlider.value().toFixed(2)) + "distortionSlider", distortionSlider.x + 100, distortionSlider.y - 10);
  text(int(cutoffFreqSlider.value()) + "cutoffFreq", cutoffFreqSlider.x + 100, cutoffFreqSlider.y - 10);

  info();
}
//update the lat and draw every 20 seconds 
window.setInterval(() => {
  newLat = float(random(lat, lat + 20));
  newLon = float(random(lon, lon + 20));
  //constantly updates the link and update it in the player 
  Audio_URL = `https://aporee.org/api/ext/?lat=${newLat}&lng=${newLon}`;
  fetchLink();
  let url = proxy.concat(recordingLink);
  player.load(url);
  //read response intervally 
  httpDo(issPath, 'GET', readResponseISS);
  httpDo(sunPath, 'GET', readResponse);


}, 20000);


function readResponseISS(e) {
  let ISSdata = JSON.parse(e);
  lat = ISSdata.latitude.toFixed(2);
  lon = ISSdata.longitude.toFixed(2);
  console.log("lat",lat);
  console.log("lon", lon);

}


function readResponse(response) {
  let data = JSON.parse(response);
  sun_altitude = data.sun_altitude;
  console.log("sun_altitude", sun_altitude);

}


//get webcam data to manipulate some thing - simple posenet - add graphics later 

// would be a symphony of sun and us - sun is always playing in the background; human movement geneerate something else


function info(){
  instructionWebCam=`With webcam, you can join in the symphony. Try to move your head to change xxx, move around your hands to change xxx`;
  text(instructionWebCam, 50, height-150, width-50, height-100); 

  instructionSun=`Enjoy the compilation of field recordings by the ISS position and altitude of the sun.`
  text(instructionSun, 50, height-100, width-50, height-50); 

  infoString = `The ISS is currently at Latitude of ${lat} and Longitude of ${lon}. The ${rectitle} is uploaded by ${artist} on ${recdate} in ${timeZone}`;
 text(infoString, 50, height-50, width-50, height); 
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
  distortionLevel = map(distortionEffect, 0, 1, 1, 20);
  total = map(shiftSlider.value(), -12, 12, 10, 150);
  loopRange = loopEnd-loopStart;
  loopLevel = map(loopRange, 0,loopEnd+loopStart,1,10);
  cutoffLevel = map(cutoffFreq,0,10000,1,5);

  //with posenet 
  // distortionLevel = map(noseX, 0, width, 1,20);
  // total = map(noseY, 0, height, 10, 150);
  // loopRange = loopEnd-loopStart;
  // handRange = abs(leftWristX - rightWristX);
  // loopLevel = map(handRange, 0,width,1,10);
  // cutoffLevel = map(cutoffFreq,0,10000,1,5);


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
  strokeWeight(distortionEffect*zoff);
  noFill();
  line(x*loopLevel, y*loopLevel, a, b);
  line(x * r / width/b, y * r / height, a, b);

  noStroke();
  fill("white");
  ellipse(a * total * 2, b * distortionLevel * 2,y / total);
  rect(a * total /2, b * distortionLevel * 2,y/total ,x/distortionLevel);

  stroke("white");
  strokeWeight(cutoffLevel/zoff/10);
  noFill();
  ellipse(x * cutoffLevel, y *  cutoffLevel/total,  b/cutoffLevel*zoff );

}

let noseX,noseY, rightWristX,rightWristY, leftWristX,leftWristY,rightKneeX,rightKneeY;

function modelReady() {
  console.log('Model Loaded');
}

function drawKeypoints()  {
  for (let i = 0; i < poses.length; i++) {
    let pose = poses[i].pose;
    for (let j = 0; j < pose.keypoints.length; j++) {
      let keypoint = pose.keypoints[j];

      if (keypoint.score > 0.8) {
        if(keypoint.part='nose'){
          noseX=keypoint.position.x;
          noseY=keypoint.position.y;
        }
        if(keypoint.part='leftWrist'){
          leftWristX=keypoint.position.x;
          leftWristY=keypoint.position.y;
          // console.log(leftWristX)
        }
        if(keypoint.part='rightWrist'){
          rightWristX=keypoint.position.x;
          rightWristY=keypoint.position.y;
        }

        // if(keypoint.part='rightKnee'){
        //   rightKneeX=keypoint.position.x;
        //   rightKneeY=keypoint.position.y;
        //   // console.log(leftWristX)
        // }
        // if(keypoint.part='leftKnee'){
        //   leftKneeX=keypoint.position.x;
        //   leftKneeY=keypoint.position.y;
        //   console.log("leftKneeX",leftKneeX)
        // }
         fill(255, 0, 0);
        noStroke();
        ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
      }
    }
  }

}

//head moves the center of the visual + determines the shift value 

//left starts loop Statr 
//right hand starts loop End

//map distance between left and right