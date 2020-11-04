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
let songs = [songRoot + "alytusbridge.mp3", songRoot + "BranchinMeramecRiver.mp3", songRoot + "bruneuve.mp3", songRoot + "enteringmaindrinkingsuite.mp3", songRoot + "PlaceduGrandHospice.mp3"];
// let song = "BranchinMeramecRiver.mp3";
songURL = songs[2];
songURL2 = songs[1];

let songLength;
let grainPlayer;
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
let grainSize = 0.1,
  grainSizeSlider;

let cuoffFreq = 400;
let cutoffFreqSlider;

let fadeInTime=0, fadeOutTime=0; // change the fade in fade out time based on the sun 

function preload() {
  //read sun API 
  path = "https://api.ipgeolocation.io/astronomy?apiKey=e01854cbed884f7d97f31665ef5d352e";
  httpDo(path, 'GET', readResponse);

}


function setup() {
  //manipulate field recordings 
  songLength = new Tone.Time().valueOf();

  shifter = new Tone.PitchShift().toMaster();

  player = new Tone.Player({
    "url": songURL,
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

  // const merge = new Tone.Merge().toMaster();
  // routing a sine tone in the left channel
  // player2 = new Tone.Player({
  //   "url": songURL2,
  //   "autostart": false,
  //   "loop": true, //set the loop to be true to use loopstart and loopend
  //   "loopStart": loopStart,
  //   "loopEnd": loopEnd,
  //   "reverse": false,
  //   "duration": 1,
  //   "fadeIn": 0,
  //   "fadeOut": 0

  // });

  // can you have two players in the scene 
  // player.connect(merge, 0, 0).start();
  // and noise in the right channel
  // player2.connect(merge, 0, 1).start();;

  // grainPlayer = new Tone.GrainPlayer({
  //   "onload": songURL,
  //   "overlap": 0.1,
  //   "grainSize": grainSize,
  //   "playbackRate": 1,
  //   "detune": 0,
  //   "loop": false,
  //   "loopStart": loopStart,
  //   "loopEnd": loopEnd,
  //   "reverse": false
  // });

  // var sampler = new Tone.Sampler({
  //   "C3" : "path/to/C3.mp3",
  //   "D#3" : "path/to/Dsharp3.mp3",
  //   "F#3" : "path/to/Fsharp3.mp3",
  //   "A3" : "path/to/A3.mp3",
  // }, function(){
  //   //sampler will repitch the closest sample
  //   sampler.triggerAttack("G8")
  // })

  // player.connect(sampler)


  // pingPong=new Tone.PingPongDelay({
  //   "delayTime":0.25,
  //   "maxDelayTime":1
  // }).toMaster();
  // player.connect(pingPong);

  // player.connect(grainPlayer);

  distortion = new Tone.Distortion({
    "distortion": distortionEffect,
  }).toMaster();


  // player.connect(shifter);
  // player.connect(distortion); // distortion does not work if i have shifter

  player.chain(shifter, distortion, filter, feedbackDelay, Tone.Master);
  //can you do pingpong for clip? 
  // pingPong = new Tone.PingPongDelay("4n", 0.2).toMaster();
  // player.connect(pingPong);

  // var drum = new Tone.Synth().connect(pingPong);
  //how to create pingpong effect for clips?

  // drum.triggerAttackRelease("100", "32n");

  // const filter = new Tone.Filter("G5").toMaster();
  //   player.fan(shifter, filter);//not working 

  //  let osc = new Tone.Oscillator("C2").start();
  // osc.toDestination();

  
  createCanvas(windowWidth, windowHeight);
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

  grainSizeSlider = createSlider(0, 1, 1, 0);
  grainSizeSlider.style("width", "200px");
  grainSizeSlider.position(width / 2 - 100, height / 2 + 340);

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
  grainSize = grainSizeSlider.value();
  distortionEffect = distortionSlider.value();
  background(143, 204, 124);

  //to autostart 
  // player.autostart=true;


  button.mousePressed(play1);

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
}




function readResponse(response) {

  let data = JSON.parse(response);
  console.log("data", data);
  sun_altitude = data.sun_altitude;
  moon_altitude = data.moon_altitude;
  sun_distance = data.sun_distance;
  moon_distance = data.moon_distance;
  // console.log("sun_altitude", sun_altitude);
  // console.log("sun_altitude", sun_altitude);
  // console.log("sun_altitude", sun_altitude);
  // console.log("sun_altitude", sun_altitude);


}
/************
//compare the sun altitude and istance with the longitude and altitude of the area
// randomly pick one audio file and play 
function getOneFile(){

  //return the url of the file 
  return ;
}

*/


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