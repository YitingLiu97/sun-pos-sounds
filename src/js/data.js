var myCanvas;
var kinectronIpAddress = "192.168.196.213"; // FILL IN YOUR KINECTRON IP ADDRESS HERE

// Declare kinectron 
var kinectron = null;
// drawHand variables
var start = 30;
var target = 100;
var diameter = start;
var light = 255;
var dark = 100;
var hueValue = light;
var lerpAmt = 0.3;
var state = 'ascending';

function setup() {
  myCanvas = createCanvas(500, 200);
  background(0);
  noStroke();
  initKinectron();

  playSound();

}

function touchStarted() {
  if (getAudioContext().state !== 'running') {
    getAudioContext().resume();
  }
}

function initKinectron() {
  kinectron = new Kinectron(kinectronIpAddress);

  // Connect with application over peer
  kinectron.makeConnection();

  // Request all tracked bodies and pass data to your callback
  kinectron.startTrackedBodies(bodyTracked);
}

function draw() {
  // background(255,0,0)
}

function bodyTracked(body) {
  background(0, 20);

  // Get all the joints off the tracked body and do something with them
  kinectron.getJoints(drawJoint);

  // Get the hands off the tracked body and do somethign with them
  kinectron.getHands(drawHands);

  for (let jointType in body.joints) {
    joint = body.joints[jointType];
    // debugger;
    drawJoint(joint);
  }
}




// Draw skeleton
function drawJoint(joint) {
  fill(100);

  // Kinect location data needs to be normalized to canvas size
  ellipse(joint.depthX * myCanvas.width, joint.depthY * myCanvas.height, 15, 15);

  fill(200);

  // Kinect location data needs to be normalized to canvas size
  ellipse(joint.depthX * myCanvas.width, joint.depthY * myCanvas.height, 3, 3);
}

// Draw hands
function drawHands(hands) {

  //check if hands are touching 
  if ((Math.abs(hands.leftHand.depthX - hands.rightHand.depthX) < 0.01) && (Math.abs(hands.leftHand.depthY - hands.rightHand.depthY) < 0.01)) {
    hands.leftHandState = 'clapping';
    hands.rightHandState = 'clapping';
  }

  // draw hand states
  updateHandState(hands.leftHandState, hands.leftHand);
  updateHandState(hands.rightHandState, hands.rightHand);
}

// Find out state of hands
function updateHandState(handState, hand) {
  switch (handState) {
    case 'closed':
      drawHand(hand, 1, 255);
      break;

    case 'open':
      drawHand(hand, 0, 255);
      break;

    case 'lasso':
      drawHand(hand, 0, 255);
      break;

      // Created new state for clapping
    case 'clapping':
      drawHand(hand, 1, 'red');
  }
}

// Draw the hands based on their state
function drawHand(hand, handState, color) {

  if (handState === 1) {
    state = 'ascending';
  }

  if (handState === 0) {
    state = 'descending';
  }

  if (state == 'ascending') {
    diameter = lerp(diameter, target, lerpAmt);
    hueValue = lerp(hueValue, dark, lerpAmt);
  }

  if (state == 'descending') {
    diameter = lerp(diameter, start, lerpAmt);
    hueValue = lerp(hueValue, light, lerpAmt);
  }

  fill(color);

  // Kinect location needs to be normalized to canvas size
  ellipse(hand.depthX * myCanvas.width, hand.depthY * myCanvas.height, diameter, diameter);
}


//data to be used from kinect 
//need to use transport as the sync
//using part to create melodies  
//synth or noise sounds on top 
//manipulate other effects of the audio 
//Sampler
//Noise 
//Granular Synthesis 
//Spatialization
//envelope visualization - https://tonejs.github.io/examples/funkyShape


function playSound() {
  //create three variables from the skeleton 
  //phaser changes the phase of diff frequency components of an incoming signal
  const phaser = new Tone.Phaser({
    frequency: 15,
    octaves: 5,
    baseFrequency: 1000
  }).toMaster();

  /********
  const noise = new Tone.Noise("pink").toMaster().start();
  noise.volume.value = -26;
  noise.stop("+2n");//set the stop time for noise 
 */
let val1;
//val1 determines the melody of the note? 
 let val3=2.5;
 let val2 = 200; //can change from 100 to 1000

  const feedbackDelay = new Tone.FeedbackDelay("8n", 0.5).toMaster();
  const pingPong = new Tone.PingPongDelay("2", 0.2).toMaster();
  const filter = new Tone.Filter(val2, "lowpass").toMaster();
  const tremolo = new Tone.Tremolo(9, 0.75).toMaster();
  const reverb = new Tone.JCReverb(0.8).toMaster();
  const chorus = new Tone.Chorus(8, val3, 0.5);//change val3 from 2 - 10

  const metalSynth = new Tone.MetalSynth().chain(chorus,filter, feedbackDelay, tremolo, phaser, pingPong,reverb, Tone.Master);
  metalSynth.triggerAttackRelease("E3", 1);
  metalSynth.volume.value=5;

  const polySynth = new Tone.PolySynth().chain(chorus,filter, feedbackDelay, tremolo, phaser, pingPong,reverb, Tone.Master);
  // PolySynth.set({ detune: -1200 });
  polySynth.triggerAttackRelease(["C4", "E4", "A4"], 1);
  polySynth.volume.value=-23;

  const duoSynth = new Tone.DuoSynth().chain(chorus,filter, feedbackDelay, tremolo, phaser, pingPong,reverb, Tone.Master);
  duoSynth.triggerAttackRelease("G3", ".5");
  duoSynth.volume.value=-26;

}



//simple visualization 


//next step for video 
//video content would be gathered from the world based on the longitude and altitude as well? - manipulate the videos? 