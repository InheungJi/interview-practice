let mediaRecorder;
let recordedBlobs;

let setTime = 30;
let time;
let handleTimer;

let queryData = new URLSearchParams(window.location.search);

let selectedQuestion;

const questionElement = document.querySelector("#question");
const nextQuestion = document.querySelector("#nextQuestion");

const timer = document.querySelector("#timer");

const recordedVideo = document.querySelector("video#recordedVideo");
const recordButton = document.querySelector("button#record");
const playButton = document.querySelector("button#play");
const downloadButton = document.querySelector("button#download");

///-------------------------------timer part-----------------------------------

function displayTime(time) {
  timer.innerHTML = `Timer: ${time} sec`;
}

function startTimer() {
  if (time === 0) {
    alert("time's up! \n\n start to record.");
    clearInterval(handleTimer);
    startRecording();
  } else time -= 1;
  displayTime(time);
}

function resetTime() {
  clearInterval(handleTimer);
  time = setTime;
  displayTime(time);
}

//-----------------------------questions part----------------------------------

async function getQuestions(selectedCategory) {
  let questions = await fetch("../questions.json");
  try {
    if (questions.ok) {
      let response = await questions.json();
      let category = await response.questions;
      if (selectedCategory === "behavioral") return category[0].question;
      else return category[1].question;
    }
    throw new Error("Loading of questions is failed.");
  } catch (e) {
    console.log(e);
  }
}

async function displayQuestions() {
  time = setTime;
  let questionArray = await getQuestions(queryData.get("category"));
  let length = questionArray.length;
  let randomNum = Math.floor(Math.random() * length);
  selectedQuestion = questionArray[randomNum];
  questionElement.innerHTML = selectedQuestion;
  handleTimer = setInterval(() => {
    startTimer();
  }, 1000);
}

timer.addEventListener("click", () => {
  clearInterval(handleTimer);
  resetTime();
  handleTimer = setInterval(() => {
    startTimer();
  }, 1000);
});

function displayInit() {
  resetTime();
  displayQuestions();
}

nextQuestion.addEventListener("click", () => {
  displayInit();
});

displayInit();

///-----------------------video part-----------------------------------

//video setting
const constraints = {
  audio: {
    echoCancellation: false,
  },
  video: {
    width: 1280,
    height: 720,
  },
};

const video = document.querySelector("#video");
if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
    console.log(`getUserMedia() got stream: ${stream}.`);
    window.stream = stream;
    video.srcObject = stream;
  });
}

//record button setting
recordButton.addEventListener("click", () => {
  if (recordButton.textContent === "Record") {
    startRecording();
  } else {
    clearInterval(handleTimer);
    stopRecording();
    recordButton.textContent = "Record";
    playButton.disabled = false;
    downloadButton.disabled = false;
  }
});

function stopRecording() {
  mediaRecorder.stop();
}

function startRecording() {
  recordedBlobs = [];
  let options = { mimeType: "video/webm;codecs=vp9,opus" };

  try {
    if (video.style.display === "none") {
      video.style.display = "inline-block";
      recordedVideo.style.display = "none";
    }

    mediaRecorder = new MediaRecorder(window.stream, options);

    recordButton.textContent = "Stop recording";
    playButton.disabled = true;
    downloadButton.disabled = true;
    mediaRecorder.onstop = (event) => {
      console.log(`Recorder stopped: ${event}`);
      console.log(`Recorded Blobs: ${recordedBlobs}`);
    };
    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.start();
    console.log(`MediaRecorder started: ${mediaRecorder}`);
  } catch (e) {
    console.log(e);
  }
}

//to handle data it it is available
function handleDataAvailable(event) {
  console.log(`handleDataAvailable: ${event}`);
  if (event.data && event.data.size > 0) {
    recordedBlobs.push(event.data);
  }
}

//play button setting
playButton.addEventListener("click", () => {
  video.style.display = "none";
  recordedVideo.style.display = "inline-block";

  const buffer = new Blob(recordedBlobs, { type: "video/webm" });

  recordedVideo.src = null;
  recordedVideo.srcObject = null;

  recordedVideo.src = window.URL.createObjectURL(buffer);
  recordedVideo.controls = true;
  recordedVideo.play();
});

//download button setting
downloadButton.addEventListener("click", () => {
  const blob = new Blob(recordedBlobs, { type: "video/mp4" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.style.display = "none";
  a.href = url;
  a.download = `${selectedQuestion}.mp4`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }, 100);
});
