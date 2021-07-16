/* All window creation functions */
const path = require("path");
const fs = require("fs");
const Store = require('electron-store');
const store = new Store();
var firebase = require('firebase');
var firebaseapp = firebase.initializeApp({
  apiKey: "AIzaSyDiKlBi25FUNTEUdYTHCPtfoZky3_93s3A",
  authDomain: "caller-3109a.firebaseapp.com",
  databaseURL: "https://caller-3109a-default-rtdb.firebaseio.com",
  projectId: "caller-3109a",
  storageBucket: "caller-3109a.appspot.com",
  messagingSenderId: "432502337255"
});

const {
  BrowserWindow,
  BrowserView,
  ipcMain,
  screen,
  app,
  Notification,
  dialog
} = require("electron");

const windowStateKeeper = require("electron-window-state");

const GOOGLE_MEET_URL = "https://meet.google.com/";
const GOOGLE_SUJITH = "https://meet.google.com/pzw-mdvy-rhs";
//let userData = require('./users.json');
let userData = [];

let newFriendWindow = undefined;
let googleMeetView = undefined;
let loggedUserData = undefined;

function randomString(length) {
  let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

function createNewFriend() {

  const win = new BrowserWindow({
    height: 600,
    width: 800,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "..", "renderer", "preload.js"),
    }
  });

  win.loadFile(path.join(__dirname, "..", "renderer", "friends.html"));

  return win;
}

function showNotificationSticky(window, messageToShow) {

  /* new Notification({
    title: 'Incoming',
    body: 'Basil Calling',
    wait: true,
  }).show(); */

  const options = {
    type: 'none',
    buttons: ['Answer', 'Reject'],
    defaultId: 2,
    title: 'Incoming Call',
    message: `${messageToShow}`
  };

  dialog.showMessageBox(null, options).then((response) => {

    if (response.response == 0) {
      //accepted
      window.webContents.send('ring_stop');
      if(googleMeetView){
        googleMeetView.webContents.loadURL(loggedUserData.meetingUrl);
      }
    }
    else {
      //rejected
      var updateStatus = firebase.database().ref('users/' + loggedUserData.id);
      var postData = {
        notify:false,
        status:true,
        message:`Available`
      };

      updateStatus.update(postData);
      window.webContents.send('ring_stop');

    }

  });

  window.webContents.send('ring_now');

}

function updateStatus(){

  var updateStatus = firebase.database().ref('users/' + loggedUserData.id);
  var postData = {
    notify:false,
    status:true,
    message:`Available`
  };
  updateStatus.update(postData);

}

function createMainWindow() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800,
    fullScreen: false,
    maximize: true,
  });

  const mainWindow = (global.mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "..", "renderer", "preload.js"),
    },
  }));
  mainWindowState.manage(mainWindow);
  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index_chat.html"));
  //mainWindow.webContents.openDevTools();
  mainWindow.webContents.on("did-finish-load", () => {

    loggedUserData = store.get("LOG_USER_DETAILS");

    if (mainWindow.isMaximized()) {
      mainWindow.webContents.send("window.maximized");
    }

    firebase.database().ref('users').get().then((snapshot) => {
      if (snapshot.exists()) {
        snapshot.forEach(function (childSnapshot) {
           if (childSnapshot.val().id !== loggedUserData.id) {
              userData.push(childSnapshot.val());
            }
        });
        mainWindow.webContents.send('set_loggedUser', loggedUserData);
        mainWindow.webContents.send('set_friends', userData);

      } else {
        console.log("No data available");
      }
    }).catch((error) => {
      console.error(error);
    });

    let notifyReference = firebase.database().ref('users/' + loggedUserData.id);
    notifyReference.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data.notify) {
        showNotificationSticky(mainWindow, data.message);
      }
    });


    if (userData) {
      var currentUserReference = firebase.database().ref('users/' + loggedUserData.id);
      currentUserReference.on('value', (snapshot) => {
        const data = snapshot.val();
        console.log("VALUES CHANGE", data);
      });
    }
  });



 googleMeetView = (global.googleMeetView = new BrowserView({
    webPreferences: {
      preload: path.join(
        __dirname,
        "..",
        "renderer",
        "adapters",
        "polyfill.js"
      ),
    },
  }));
  mainWindow.setBrowserView(googleMeetView);
  googleMeetView.webContents.loadURL(GOOGLE_MEET_URL);
  googleMeetView.setBounds({
    x: 0,
    y: 40,
    width: mainWindow.getBounds().width,
    height: mainWindow.getBounds().height - 40,
  });
  googleMeetView.webContents.on("did-finish-load", () => {
    
    if(googleMeetView.webContents.getURL() == "https://meet.google.com/"){
      console.log("RESET RESET RESET");
      if(loggedUserData){
        updateStatus();
      }
    }

    googleMeetView.webContents.insertCSS(
      fs
        .readFileSync(
          path.join(__dirname, "..", "renderer", "css", "screen.css")
        )
        .toString()
    );
  });
  //googleMeetView.webContents.openDevTools();

  mainWindow.on("resize", () => {
    googleMeetView.setBounds({
      x: 0,
      y: 40,
      width: mainWindow.getBounds().width,
      height: mainWindow.getBounds().height - 40,
    });
  });

  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window.maximized");
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window.restored");
  });


  ipcMain.on("window.minimize", (event) => {
    mainWindow.minimize();
  });

  ipcMain.on("window.maximize", (event) => {
    mainWindow.maximize();
    event.sender.send("window.maximized");
  });

  ipcMain.on("sidebar_open", () => {
    googleMeetView.setBounds({
      x: 250,
      y: 40,
      width: mainWindow.getBounds().width - 250,
      height: mainWindow.getBounds().height - 40,
    });
  });

  ipcMain.on("sidebar_close", () => {
    googleMeetView.setBounds({
      x: 0,
      y: 40,
      width: mainWindow.getBounds().width,
      height: mainWindow.getBounds().height - 40,
    });
  });

  ipcMain.on("add_friends_details", (event, arg) => {
    arg.data.id = randomString(32);
    userData.push(arg.data);
    console.log(userData);

    try {
      fs.writeFileSync(__dirname + '/users.json', JSON.stringify(userData), 'utf-8');
    }
    catch (e) {
      console.log("Error", e);
    }

    mainWindow.webContents.send('set_friends', userData);

    if (newFriendWindow) {
      newFriendWindow.close();
    }
  })

  ipcMain.on("call_friend", (event, arg) => {
    console.log(">>>", arg.data);
    googleMeetView.webContents.loadURL(arg.data);

  });

  ipcMain.on("open_addFriends", (event, arg) => {

    newFriendWindow = createNewFriend();

  });

  ipcMain.on("window.restore", (event) => {
    mainWindow.restore();
    event.sender.send("window.restored");
  });

  ipcMain.on("window.close", () => {
    mainWindow.close();
  });

  ipcMain.on("window.home", () => {
    googleMeetView.webContents.loadURL(GOOGLE_MEET_URL);
  });

  let canvasWindow = createCanvasWindow();

  const screenToolsWindow = createScreenToolsWindow();

  // screenToolsWindow.moveAbove(canvasWindow.getMediaSourceId());

  ipcMain.on("window.screenshare.show", () => {
    mainWindow.minimize();
    screenToolsWindow.show();
  });

  ipcMain.on("window.screenshare.hide", () => {
    screenToolsWindow.hide();
    screenToolsWindow.reload();
    canvasWindow.hide();
  });

  ipcMain.on("window.canvas.show", () => {
    canvasWindow.show();
  });

  ipcMain.on("window.canvas.hide", () => {
    canvasWindow.hide();
    canvasWindow.reload();
  });

  ipcMain.on("window.main.focus", () => {
    mainWindow.restore();
    mainWindow.focus();
  });

  ipcMain.on("screenshare.stop", () => {
    googleMeetView.webContents.send("screenshare.stop");
  });

  ipcMain.on("Call_Sujith", () => {
    googleMeetView.webContents.loadURL(GOOGLE_SUJITH);
  });

  mainWindow.on("closed", () => {
    app.quit();
  });
}

function createCanvasWindow() {
  const primaryWorkarea = screen.getPrimaryDisplay().bounds;
  const canvasWindow = new BrowserWindow({
    x: primaryWorkarea.x,
    y: primaryWorkarea.y,
    width: primaryWorkarea.width,
    height: primaryWorkarea.height,
    transparent: true,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "..", "renderer", "preload.js"),
    },
    focusable: false,
    show: false,
    resizable: false,
    skipTaskbar: true,
  });
  canvasWindow.webContents.loadFile(
    path.join(__dirname, "..", "renderer", "canvas.html")
  );
  canvasWindow.setAlwaysOnTop(true, "pop-up-menu");
  return canvasWindow;
}

function createScreenToolsWindow() {
  const primaryWorkarea = screen.getPrimaryDisplay().bounds;
  const screenToolsWindow = new BrowserWindow({
    x: 100,
    y: primaryWorkarea.height - 200,
    height: 60,
    width: 300,
    frame: false,
    resizable: false,
    show: false,
    skipTaskbar: true,
    focusable: false,
    transparent: true,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "..", "renderer", "preload.js"),
    },
  });

  screenToolsWindow.setContentProtection(process.platform === "darwin");

  screenToolsWindow.webContents.loadFile(
    path.join(__dirname, "..", "renderer", "toolbar.html")
  );
  screenToolsWindow.setAlwaysOnTop(true, "screen-saver");
  return screenToolsWindow;
}

function createLaunchPage() {
  const mainWindowState = windowStateKeeper({
    defaultWidth: 1000,
    defaultHeight: 800,
    fullScreen: false,
    maximize: true,
  });

  const mainWindow = (global.mainWindow = new BrowserWindow({
    x: mainWindowState.x,
    y: mainWindowState.y,
    width: mainWindowState.width,
    height: mainWindowState.height,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    webPreferences: {
      contextIsolation: true,
      preload: path.join(__dirname, "..", "renderer", "preload.js"),
    },
  }));
  mainWindowState.manage(mainWindow);
  mainWindow.loadFile(path.join(__dirname, "..", "renderer", "index_new.html"));
  //mainWindow.webContents.openDevTools();
  mainWindow.webContents.on("did-finish-load", () => {
    if (mainWindow.isMaximized()) {
      mainWindow.webContents.send("window.maximized");
    }
  });

  mainWindow.on("maximize", () => {
    mainWindow.webContents.send("window.maximized");
  });

  mainWindow.on("unmaximize", () => {
    mainWindow.webContents.send("window.restored");
  });


  ipcMain.on("window.minimize", (event) => {
    mainWindow.minimize();
  });

  ipcMain.on("window.maximize", (event) => {
    mainWindow.maximize();
    event.sender.send("window.maximized");
  });

  ipcMain.on("window.restore", (event) => {
    mainWindow.restore();
    event.sender.send("window.restored");
  });

  ipcMain.on("window.close", () => {
    mainWindow.close();
  });

  ipcMain.on("window.home", () => {
    googleMeetView.webContents.loadURL(GOOGLE_MEET_URL);
  });

  ipcMain.on("set_logged_user", (event, userData) => {
    console.log(">>>", userData.data);
    store.set("LOG_USER_DETAILS", userData.data);
    store.set("alreadyloggedin", true);
    createMainWindow();
  });

}


module.exports = { createMainWindow, createLaunchPage };
