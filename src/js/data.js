import  Kinect  from "./kinect.js";
// import new Kinect();

let kinect = new Kinect();
kinect.connect(); // 127.0.0.1 by default

// Listen for gesture events
kinect.addEventListener("gesture", event => {
  if(event.gesture == "Swipe_Left") {
    // Do something
  }
});

// Listen for state events
kinect.addEventListener("state", event => {
  if(event.connected) {
    // Do something
    console.log(kinect.state)
  }
});