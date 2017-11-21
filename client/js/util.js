var numToColor = { 0: "Red", 1: "Blue", 2: "Yellow", 3: "Green", 4: "Black" };
var ColorToNum = { "Red": 0, "Blue": 1, "Yellow": 2, "Green": 3, "Black": 4 };

var piecePositions = {
    0: { x: 0, y: 0 },
    1: { x: 10, y: 10 },
    2: { x: 20, y: 20 },
    3: { x: 30, y: 30 },
    4: { x: 40, y: 40 },
    5: { x: 50, y: 50 },
    6: { x: 60, y: 60 },
    7: { x: 70, y: 70 },
    8: { x: 80, y: 80 },
    9: { x: 90, y: 90 },
    10: { x: 100, y: 100 },
    11: { x: 110, y: 110 },
    12: { x: 120, y: 120 },
    13: { x: 130, y: 130 },
    14: { x: 140, y: 140 },
    15: { x: 150, y: 150 },
};

let cards = {
    "1": "Move\nOne Space\nor\nLeave Start",
    "2": "Move\nTwo Spaces\nor\nLeave Start\n\nand\nDraw Again",
    "3": "Move\nThree Spaces",
    "4": "Move\nFour Spaces\nor\nMove Enemy\nOne Space",
    "5": "Move\nFive Spaces",
    "6": "Move\nSix Spaces\nor\nSwitch Positions\nWith an Enemy",
    "7": "Move Forward\n Seven Spaces\nor\nSplit the Move\nBetween\nTwo Pieces",
    "Fuck Off": "Expell Enemy\nFrom Home\nor\nLeave Start",
    "Get Fucked": "Take a Piece\nFrom Start\nand\nBump an Enemy\nBack to Start",
    "FuckLord": "Leave Start\nor\nMove Piece\nDirectly to Home\n\nAnd\nDraw Again"
};

function getPieceColor(index){
    return numToColor[Math.floor(index / 4)];
}

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

function newGame(){
    debug("starting new Game");
    theBoard = new Board();
    fitStageIntoParentContainer();
}

function displayCardOnCanvas(cardVal) {
    cardVal = cardVal.toString();
    cardDesc = cards[cardVal];

    let cardCanvas = document.getElementById("cardCanvas");
    let cardCanvasCtx = cardCanvas.getContext("2d");
    cardCanvasCtx.font = '25px Arial';

    //clear card
    cardCanvasCtx.clearRect(0, 0, cardCanvas.width, cardCanvas.height);
    cardCanvasCtx.fillStyle = "red";
    cardCanvasCtx.textAlign = "center";
    cardCanvasCtx.fillText(cardVal, cardCanvas.width / 2, cardCanvas.height / 5);

    var lineheight = 30;
    var lines = cardDesc.split('\n');

    for (var i = 0; i < lines.length; i++)
        cardCanvasCtx.fillText(lines[i], cardCanvas.width / 2, cardCanvas.width / 2 + (i * lineheight));
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function changeDeckColor(){
    debug("hit");
    let color = getRandomColor();
    let card = theBoard.layer.find(".card");
    card.fill(color);
    theBoard.layer.draw();
}