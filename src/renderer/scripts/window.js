
// Initialize Firebase
var config = {
  apiKey: "AIzaSyDiKlBi25FUNTEUdYTHCPtfoZky3_93s3A",
  authDomain: "caller-3109a.firebaseapp.com",
  databaseURL: "https://caller-3109a-default-rtdb.firebaseio.com",
  projectId: "caller-3109a",
  storageBucket: "caller-3109a.appspot.com",
  messagingSenderId: "432502337255"
};
firebase.initializeApp(config);

var user = firebase.auth().signInAnonymously();

firebase.auth().onAuthStateChanged(function (user) {
  if (user) {
    // User is signed in.
    var isAnonymous = user.isAnonymous;
    user_id = user.uid;
  } else {
    // User is signed out.
  }
});

var db_ref = firebase.database().ref('/basil');
db_ref.on('child_added', function (data) {
  //show notification 
});


const homeButton = document.getElementById("home");
const googleMeetHome = document.getElementById("meethome");

const minimizeButton = document.getElementById("minimize");
const maximizeButton = document.getElementById("maximize");
const restoreButton = document.getElementById("restore");
const closeButton = document.getElementById("close");
const userListDiv = document.getElementById('user');
//const basilSujithButton = document.getElementById("basil_sujith");
let open = false;
restoreButton.style.display = "none";
let userData = undefined;
let ipcScope = ipc;

homeButton.addEventListener("click", () => {
  ipcScope = ipc;
  if (open) {
    document.getElementById("mySidebar").style.width = "0px";
    open = false;
    ipc.send("sidebar_close");
  } else {
    document.getElementById("mySidebar").style.width = "250px";
    open = true;
    ipc.send("sidebar_open");
  }
});

googleMeetHome.addEventListener("click", () => {
  goHome();
});

function goHome() {
  var _data = {
    data: "https://meet.google.com/"
  }
  ipcScope.send("call_friend", _data);
}

minimizeButton.addEventListener("click", () => {
  ipc.send("window.minimize");
});
maximizeButton.addEventListener("click", () => {
  ipc.send("window.maximize");
});
restoreButton.addEventListener("click", () => {
  ipc.send("window.restore");
});
closeButton.addEventListener("click", () => {
  ipc.send("window.close");
});

/* basilSujithButton.addEventListener("click", () => {
  ipc.send("Call_Sujith");
}); */

ipc.on("window.maximized", () => {
  maximizeButton.style.display = "none";
  restoreButton.style.display = "flex";
});

ipc.on("window.restored", () => {
  maximizeButton.style.display = "flex";
  restoreButton.style.display = "none";
});

ipc.on("ring_now", () => {
  var audio = document.getElementById("player_controller");
  audio.play();
});

ipc.on('set_friends', (data) => {
  try {
    if (data) {

      let userData = JSON.parse(JSON.stringify(data));
      let html = ``;
      userData.forEach(element => {
        html = html + `<div class="wrapper" id="basil_sujith" onclick="callThisFriend('${element.meetingUrl}','${element.id}')" >
        <aside class="aside aside-1">
          <img src="assets/avathar.png" />
        </aside>
        <article class="main">
          <div class="name">${element.name}</div>
        </article>
      </div>`;
      });

      userListDiv.innerHTML = html;

    }

  } catch (error) {
    alert(error);
  }
});



function showAddFriends() {

  ipcScope.send("open_addFriends");
}

function callThisFriend(url, id) {
  var _data = {
    data: url
  }
  ipcScope.send("call_friend", _data);

  writeUserData(url);

}


function writeUserData(message) {
  var db_ref = firebase.database().ref('/' + "" + message);
  db_ref.push({
    user_id: user_id,
    message: "Basil Calling Sujith"
  });
}



