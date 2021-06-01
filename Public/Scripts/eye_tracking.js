// -----JS CODE-----
// @ui {"widget": "group_start", "label": "Head"}
// @input Component leftEye {"label": "Left Eye"}
// @input Component rightEye {"label": "Right Eye"}
// @input Component head {"label" : "Head"}
// @ui {"widget": "group_end"}

// @ui {"widget": "group_start", "label": "Game Screen"}
// @input Component.Camera camera {"label": "Orthographic Camera"}
// @input Asset.Texture cameraTexture {"label": "Camera Texture"}
// @input Component.Text textComponent {"label": "Text Component"}
// @input SceneObject openingTextObject {"label": "Opening Text"}
// @input SceneObject snakeObject {"label": "Snake Object"}
// @input SceneObject upObject {"label": "Up Arrow"}
// @input SceneObject downObject {"label": "Down Arrow"}
// @input SceneObject rightObject {"label": "Right Arrow"}
// @input SceneObject leftObject {"label": "Left Arrow"}
// @input Component.ScreenTransform snakeTransform {"label": "Snake Transform"}
// @input Component.ScreenTransform foodTransform {"label": "Food Transform"}
// @input Component.ScreenTransform screenTransform {"label": "Fullscreen Transform"}
// @input Asset.Texture gameOverTexture {"label": "Game Over Texture"}
// @input Asset.Texture playTexture {"label": "Play Texture"}
// @input float velocity = 0.02 {"label": "Velocity"}
// @input int frameRate {"label": "Frame Rate"}
// @ui {"widget": "group_end"}

var updateEvent = script.createEvent("UpdateEvent");
updateEvent.bind(Update);
var directionEvent = script.createEvent("UpdateEvent");
directionEvent.bind(GetDirection)
var touchEvent = script.createEvent("TouchStartEvent");
touchEvent.bind(Start);
var headDirection = "RIGHT";
var previousDirection = "RIGHT";
var xSpeed = 0;
var ySpeed = 0;
var frame;
var margin = 2;
var total = 1;
var tail = [];
var snakeArray = [];


var width, height, boxWidth, boxHeight, gameScore; 
var hasHitTail, gameOver, gameEnded, isOpeningUI;

Awake();

function Awake(){
    script.openingTextObject.getComponent("Component.Text").enabled = true;
    script.textComponent.text = "";
    script.foodTransform.position = new vec3(-99,-99,0);
    script.upObject.enabled = false;
    script.downObject.enabled = false;
    script.rightObject.enabled = false;
    script.leftObject.enabled = false;
    isOpeningUI = true;
}

function OpeningUI(){
    switch(headDirection){
        case("UP"):
            script.upObject.enabled = true;
            script.downObject.enabled = false;
            script.rightObject.enabled = false;
            script.leftObject.enabled = false;
            break;
        case("DOWN"):
            script.upObject.enabled = false;
            script.downObject.enabled = true;
            script.rightObject.enabled = false;
            script.leftObject.enabled = false;
            break;
        case("RIGHT"):
            script.upObject.enabled = false;
            script.downObject.enabled = false;
            script.rightObject.enabled = true;
            script.leftObject.enabled = false;
            break;
        case("LEFT"):
            script.upObject.enabled = false;
            script.downObject.enabled = false;
            script.rightObject.enabled = false;
            script.leftObject.enabled = true;
            break;
        case("NEUTRAL"):
            script.upObject.enabled = false;
            script.downObject.enabled = false;
            script.rightObject.enabled = false;
            script.leftObject.enabled = false;
            break;
        default:
            break;
    }
}

function Start(){
    print(  "Camera aspect: " +  script.cameraTexture.getWidth() + " : " + script.cameraTexture.getHeight());
    var orthographicSize = script.camera.getOrthographicSize();
    isOpeningUI = false;
    script.upObject.enabled = false;
    script.downObject.enabled = false;
    script.rightObject.enabled = false;
    script.leftObject.enabled = false;
    width = Math.floor(orthographicSize.x);
    height = Math.floor(orthographicSize.y);
    boxHeight = script.snakeTransform.scale.y;
    boxWidth = script.snakeTransform.scale.x;
    Reset();
}

function Reset(){
    // Reset Snake
    script.snakeTransform.position = new vec3(0,0,0);
    script.snakeObject.getComponent("Component.Image").mainPass.baseTex = script.playTexture;
    for(var i = 0; i < snakeArray.length; i++){
        snakeArray[i].destroy();
    }
    tail = [];
    snakeArray= [];

    script.openingTextObject.getComponent("Component.Text").enabled = false;
    isOpeningUI = false;
    frame = 0;
    gameScore = 0;
    gameOver = false;
    gameEnded = false;
    
    total = 1;    
    script.textComponent.text = "Score: " + gameScore.toString();
    print(  "Orthographic Size: x = " + width + ", y = " + height);
    GetBounds();    
    SetFoodPosition();
}

function Update(){
    if (isOpeningUI){
        OpeningUI();
    }
    if(gameOver && !gameEnded) {
        GameOver();
        gameEnded = true;
    }
    if(isMoveTime() && !hasHitTail && !gameOver){
        Move();
    }
}

function isMoveTime(){
    //print("Frame: " + frame + ", Framerate: " + script.frameRate);
    
    if(frame % script.frameRate == 0){
        frame = 0;
        frame++;
        return true;
    }
    frame ++;
    return false;
}


function Move(){
    // Shift tail segments up
    if(tail.length >=2) {
        for(var i = 0; i < tail.length-1; i++){
           tail[i] = tail[i+1]; 
        }
    }    
    tail[total-1] = script.snakeTransform.position;
    
    
    // Get bounds of the screen
    var upperBounds = (height / 2) - margin;
    var lowerBounds = - height / 2 + boxHeight + margin; 
    var rightBounds = width / 2 - boxWidth;
    var leftBounds = - width / 2;    
    
    // Set snake position
    var x = script.snakeTransform.position.x + xSpeed * script.velocity;
    var y = script.snakeTransform.position.y + ySpeed * script.velocity;
    var z = 0;  
    
    // Check if box goes off screen
    if (x > rightBounds) { 
        x = rightBounds;
        gameOver = true;
    }
    else if (x < leftBounds) { 
        x = leftBounds;
        gameOver = true;
    }
    
    if (y > upperBounds) { 
        y = upperBounds;
        gameOver = true;
    }
    else if (y < lowerBounds) { 
        y = lowerBounds;
        gameOver = true;
    }
    
   
    var boxPosition = new vec3(x, y, z);
    script.snakeTransform.position = boxPosition;
    hasHitTail = isOut();
    for(var i = 0; i < snakeArray.length; i++){
       snakeArray[i].getComponent("Component.ScreenTransform").position = tail[total - 1 - i];
    }

    var foodPosition = script.foodTransform.position;
    
    if(boxPosition.x == foodPosition.x && boxPosition.y == foodPosition.y) {
        EatFood();
        for(var i = 0; i <  tail.length; i++){
        }     
    }    
}

function GetDirection(){
     var headPosition = script.head.getTransform().getWorldPosition();
     var headRotation = script.head.getTransform().getLocalRotation();

    if(         headRotation.y < -0.1 && 
                headDirection != "LEFT"){
        headDirection = "LEFT";
        xSpeed = -1;
        ySpeed = 0;
    } else if ( headRotation.y > 0.15 && 
                headDirection != "RIGHT"){
        headDirection = "RIGHT";
        xSpeed = 1;
        ySpeed = 0;
        print("RIGHT");
    } else if ( headRotation.x < -0.2 &&
                headRotation.y < 0.2 &&
                headRotation.y > -0.1 &&
                headDirection != "UP" ){
        headDirection = "UP";
        xSpeed = 0;
        ySpeed = 1;
        print("UP");
    } else if ( headRotation.x > 0.1  &&
                headRotation.y < 0.2 &&
                headRotation.y > -0.1 &&
                headDirection != "DOWN" ){
        headDirection = "DOWN";
        xSpeed = 0;
        ySpeed = -1;
        print("DOWN");
    } else if( headRotation.x < 0.1  &&
                headRotation.x > -0.1 &&
                headRotation.y < 0.2 &&
                headRotation.y > -0.1 ){
        headDirection = "NEUTRAL";
    }
    
}

function GetBounds(){
    var boxHeight = script.snakeTransform.scale.y;
    var boxWidth = script.snakeTransform.scale.x;
    
    // Get bounds of the screen
    var upperBounds = height / 2;
    var lowerBounds = - height / 2 - boxHeight; 
    var rightBounds = width / 2 - boxWidth;
    var leftBounds = - width / 2;

}

function EatFood() {       
    // Update Snake
    total ++;
    //tail[total-1] = script.snakeTransform.position; 
    CreateSegment()
    
    // Update Food
    while(!SetFoodPosition()); 
    
    // Update Score
    gameScore ++;
    script.textComponent.text = "Score: " + gameScore.toString(); 
}

function SetFoodPosition(){
    var foodX = Math.floor(Math.random() * ((width / 2)-boxWidth));
    var foodY = Math.floor(Math.random() * ((height / 2) - margin) );
    var foodZ = 0;
    for(var i = 0; i < tail.length; i ++){
        if(tail[i].x == foodX && tail[i].y == foodY) {
            print("On Food");
            return false;
        } 
    }
    script.foodTransform.position = new vec3(foodX, foodY, foodZ);
    return true;
} 

function CreateSegment(){
    var segmentObject = script.snakeTransform.getSceneObject();
    var originalRenderLayer = segmentObject.getRenderLayer();
    var originalParent = segmentObject.getParent();
    
    // Create a duplicate
    var newSegmentParent = global.scene.createSceneObject("newSegmentParent");
    newSegmentParent.copySceneObject(segmentObject);
    var newSegment = newSegmentParent.getChild(0);
    newSegmentParent.setParent(originalParent);
    newSegment.setRenderLayer(originalRenderLayer);

    // Add to array
    snakeArray.push(newSegment);
   
}

function isOut(){
   for(var i = 0; i < tail.length-1; i ++){
        if(tail[i].x == script.snakeTransform.position.x && tail[i].y == script.snakeTransform.position.y) {                     
            print("IS OUT!!");
            gameOver = true;
            return true;
        } 
    }
    return false;
}

    
function GameOver(){
    print("GameOver")
    script.snakeObject.getComponent("Component.Image").mainPass.baseTex = script.gameOverTexture;
    for(var i = 0; i < snakeArray.length; i++){
        snakeArray[i].getComponent("Component.Image").mainPass.baseTex = script.gameOverTexture;
    }
    script.openingTextObject.getComponent("Component.Text").enabled = true;
    script.openingTextObject.getComponent("Component.Text").text = "GAME OVER";
}
 