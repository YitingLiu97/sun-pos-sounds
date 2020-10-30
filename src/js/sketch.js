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

let sun_altitude, sun_distance, moon_altitude, moon_distance;

let shifter, player;
let songURL;
let button;
let shiftSlider;
// let wetMix;
let songRoot = "../../assets/";

let song = "BranchinMeramecRiver.mp3";
songURL =songRoot+song;
let songLength;
let grainPlayer;
let distortion, distortionSlider; //not too obvious - has to connect to toMaster();
let pingPong, pingPongSlider;

function preload() {
  path = "https://api.ipgeolocation.io/astronomy?apiKey=e01854cbed884f7d97f31665ef5d352e";

  httpDo(path, 'GET', readResponse);

}
//loop start and end depending on the sun location 
let loopStart, loopEnd;
let loopStartSlider, loopEndSlider;
let grainSize, grainSizeSlider;

function preload() {

  songLength = new Tone.Time().valueOf();
  shifter = new Tone.PitchShift().toMaster();

  player = new Tone.Player({
    "url": songURL,
    "autostart": false,
    "loop": false, //set the loop to be true
    "loopStart": loopStart,
    "loopEnd": loopEnd,
    "reverse": false,
    "fadeIn": 0,
    "fadeOut": 0

  });

  distortion = new Tone.Distortion({
    "distortion": distortion,
    // "oversample":none
  }).toMaster();

  // grainPlayer = new Tone.GrainPlayer({
  //   // "onload": songURL,
  //   "overlap": 0.1,
  //   "grainSize": grainSize,
  //   "playbackRate": 1,
  //   "detune": 0,
  //   "loop": false,
  //   "loopStart": loopStart,
  //   "loopEnd": loopStart,
  //   "reverse": false
  // });


  // pingPong=new Tone.PingPongDelay({
  //   "delayTime":0.25,
  //   "maxDelayTime":1
  // }).toMaster();
  // player.connect(pingPong);

  // player.connect(grainPlayer);


  player.connect(shifter);
  // player.connect(distortion);// distortion does not work if i have shifter

  //can you do pingpong for clip? 
  // pingPong = new Tone.PingPongDelay("4n", 0.2).toMaster();
  // var drum = new Tone.Synth().connect(pingPong);
  // drum.triggerAttackRelease("100", "32n");


  // const filter = new Tone.Filter("G5").toMaster();
  //   player.fan(shifter, filter);//not working 

  //  let osc = new Tone.Oscillator("C2").start();
  // osc.toDestination();

}

function setup() {
  createCanvas(windowWidth, windowHeight);

//   wetMix = createSlider(0, 1, 1, 0);
//   wetMix.style("width", "200px");
//   wetMix.position(width / 2 - 100, height / 2 + 80);

  shiftSlider = createSlider(-12, 12, 2, 1);
  shiftSlider.style("width", "200px");
  shiftSlider.position(width / 2 - 100, height / 2 + 150);


  button = createButton("Play Sound");
  button.position(width / 2 - 50, height / 2);
  button.mousePressed(play1);


  loopStartSlider = createSlider(0, 1, 1, 0);
  loopStartSlider.style("width", "200px");
  loopStartSlider.position(width / 2 - 100, height / 2 + 200);

  loopEndSlider = createSlider(0, 1, 1, 0);
  loopEndSlider.style("width", "200px");
  loopEndSlider.position(width / 2 - 100, height / 2 + 270);

  // grainSizeSlider = createSlider(0,1,1,0);
  // grainSizeSlider.style("width", "200px");
  // grainSizeSlider.position(width / 2 - 100, height / 2 + 340);

  distortionSlider = createSlider(0, 1, 1, 0);
  distortionSlider.style("width", "200px");
  distortionSlider.position(width / 2 - 100, height / 2 + 340);

}

function draw() {
  /*Avoiding putting any sound triggering functions in draw() for this example
   */

  // shifter.wet.value = wetMix.value();
  shifter.pitch = shiftSlider.value();
  loopStart = loopStartSlider.value();
  loopEnd = loopEndSlider.value();
  // grainSize = grainSizeSlider.value();
  distortion = distortionSlider.value();
  background(143, 204, 124);

  // textAlign(CENTER);
  // text(int(wetMix.value() * 100) + "% effected sound", wetMix.x + 100, wetMix.y - 10);

  text("Shift value parameter: " + shiftSlider.value() + " half steps", shiftSlider.x + 100, shiftSlider.y - 10);

  text(int(loopStartSlider.value() * 100) + "loopStartSlider", loopStartSlider.x + 100, loopStartSlider.y - 10);


  text(int(loopEndSlider.value() * 100) + "loopEndSlider", loopEndSlider.x + 100, loopEndSlider.y - 15);

  //     text(int(grainSizeSlider.value() * 100) + "grainSizeSlider", grainSizeSlider.x + 100, grainSizeSlider.y - 10);

  text(int(distortionSlider.value() * 100) + "distortionSlider", distortionSlider.x + 100, distortionSlider.y - 10);

}

function play1() {
  player.start();
}




function readResponse(response) {

  let data = JSON.parse(response);
  console.log("data", data);
  sun_altitude = data.sun_altitude;
  moon_altitude = data.moon_altitude;
  sun_distance = data.sun_distance;
  moon_distance = data.moon_distance;
  console.log("sun_altitude", sun_altitude);


}