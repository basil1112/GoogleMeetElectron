

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


      /*   var db_ref = firebase.database().ref('/users');
           userData.forEach(element => {
             let userId = db_ref.push().getKey();
             var user = new Object();
             user.id = userId;
             user.name = element.name;
             user.meetingUrl = element.meetingUrl;
             user.status = true;
             db_ref.child(userId).set(user);
           }); */


    }

  } catch (error) {
    alert(error);
  }
});



function registerNewUser() {

  const name = document.getElementById('txtName').value;
  const googleUrl = document.getElementById('txtGUrl').value;
  const email = document.getElementById('txtEmail').value;

  var db_ref = firebase.database().ref('/users');

  let userId = db_ref.push().getKey();
  var user = new Object();
  user.id = userId;
  user.name = name;
  user.email = email
  user.meetingUrl = googleUrl;
  user.status = true;
  user.notify = false;
  user.message = "";
  db_ref.child(userId).set(user);
  var _data = {
    data: user
  }
  ipc.send("set_logged_user", _data);
  return false;
}