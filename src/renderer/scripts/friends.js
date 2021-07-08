let ipcScope = ipc;

function addFriendsDetails() {

    try {
        const name = document.getElementById('txtName').value;
        const googleUrl = document.getElementById('txtGUrl').value;
        const profilePic = document.getElementById('txtProfile').value;

        var detail = {
            name: name,
            meetingUrl: googleUrl
        }
        var _data = {
            data: detail
        }
        ipcScope.send("add_friends_details", _data);
        alert("Details Added");
    }
    catch (err) {
        alert(err);
    }
}