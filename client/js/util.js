var numToColor = { 0: "Red", 1: "Blue", 2: "Yellow", 3: "Green", 4: "Black" };
var ColorToNum = { "Red": 0, "Blue": 1, "Yellow": 2, "Green": 3, "Black": 4 };

function clamp(val, min, max) {
    return Math.max(min, Math.min(val, max));
};

function fitStageIntoParentContainer(){
    if(!theBoard){
        return;
    }
    let stage = theBoard.stage;

    if (stage === undefined) {
        console.log("stage undefined");
        return;
    }
    
    var container = document.querySelector('#ctx');
    var containerWidth = container.offsetWidth;
    
    var scale = containerWidth / 600;
    
    stage.setWidth(600 * scale);
    stage.setHeight(600 * scale);
    stage.setScale({ x: scale, y: scale });
    stage.draw(); 
}

function debug(data) {
    if (verbose) {
        console.log(data);
    }
}

function sendChat() {
    let input = $("#chatInput");
    let msg = input.val();
    if (!msg || msg == "" || msg == " ") {
        return;
    }
    else if(msg.indexOf("/join") == 0 && myLobby !== undefined){
        input.val("");
        addMsgToChat("Already in a lobby", 4, true);
        return;
    }
    socket.emit("chat", { "color": myColor, "msg": msg, "lobby": myLobby });
    input.val("");
    addMsgToChat(msg);
}

function addMsgToChat(msg, colorNum = myColor, overrideMsg = false) {
    if (msg.indexOf("/") == 0) {
        return;
    }

    let color = numToColor[colorNum];

    if (overrideMsg) {
        $("#chatList").append($("<li class='chatMessage'>").text(msg).css('color', color));
        return;
    }
    $("#chatList").append($("<li class='chatMessage'>").text(color + ": " + msg).css('color', color));
}

function clearChat(verbose=true) {
    $("#chatList").html("");
    if(verbose){
        addMsgToChat("Chat Cleared", "4", true);
    }
}