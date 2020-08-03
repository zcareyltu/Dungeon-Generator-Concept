//https://www.saschawillems.de/public/javascript/dungeonGenerator/dungeonGenerator.html
//https://bitbucket.org/saschawillems/javascript/src/master/dungeonGenerator/dungeonGenerator.js
//https://www.saschawillems.de/blog/2010/02/07/random-dungeon-generation/#:~:text=It%20worked%20by%20splitting%20the,placement%20without%20the%20rooms%20overlapping
//https://www.saschawillems.de/creations/dungeon-crawler/
//https://www.mikechambers.com/blog/2011/03/21/javascript-quadtree-implementation/
//file:///C:/Users/Zack/Documents/Visual%20Studio%20Code/Dungeon-Generator-Concept/index.html


var graphics = {
    cellSize: 15, //cell size in pixels
    baseColor: [0, 0, 0],
    cellColor: [255, 255, 255],
    startColor: [0, 255, 0]
};

var options = {
    minWidth: 4,
    maxWidth: 8,
    minHeight: 4,
    maxHeight: 8,
    padding: 2,
    maxDistance: 6,
    //numRooms: 10,
    numPlacementTries: 3
};

var rooms = [];

function GenerateDungeon(){
    rooms = [];
    startRoom = RoomFactory(-2, -2, 4, 4);
    startRoom.IsStart = true;
    rooms.push(startRoom);

    var numRooms = HTML.getListValue('numberRooms', 3);

    for(var i = 0; i < numRooms; i++){
        var randWidth = nextInt(options.minWidth, options.maxWidth);
        var randHeight = nextInt(options.minHeight, options.maxHeight);
        var nextRoom = RoomFactory(0, 0, randWidth, randHeight);

        var bestScore = undefined;
        var bestPos = undefined;
        for (var j = 0; j < options.numPlacementTries; j++){
            var pos = PlaceRoom(nextRoom);
            var score = roomScore(nextRoom);
            if((j == 0) || (score < bestScore)){
                bestPos = pos;
                bestScore = score;
            }
        }
        nextRoom.X = bestPos.X;
        nextRoom.Y = bestPos.Y;
        rooms.push(nextRoom);
    }

    RenderDungeon();
}

function PlaceRoom(room){
    var roomList = RandomListCopy(rooms);
    for(var i in roomList){
        var baseRoom = roomList[i];
        var firstPoint = randomPerimeter(baseRoom);
        var point = firstPoint;
        do{
            var pos = getAdjustedRoomPos(point, room);
            room.X = pos.X;
            room.Y = pos.Y;
            if(!roomCollides(room)){
                //Room fits!
                return pos;
            }

            point = nextPerimeter(baseRoom, point);
        }while((point.X != firstPoint.X) || (point.Y != firstPoint.Y) || (point.Direction != firstPoint.Direction));
    }

    throw 'A room SOMEHOW was unable to be placed. This should be impossible.';
}

//Return a score for how well the room was placed
function roomScore(room){
    var x = room.X + Math.floor(room.Width / 2);
    var y = room.Y + Math.floor(room.Height / 2);
    return x**2 + y**2;
}

//Returns true if the given room collides with any other room in the rooms list
//Padding is taken into account
function roomCollides(room){
    var padding = options.padding;
    for(var i in rooms){
        var check = {};
        check.X = rooms[i].X - padding;
        check.Y = rooms[i].Y - padding;
        check.Width = rooms[i].Width + padding*2;
        check.Height = rooms[i].Height + padding*2;

        if(RoomsCollide(room, check)) return true;
    }

    return false;
}

function RoomsCollide(room1, room2){
    var right1 = room1.X + room1.Width;
    var right2 = room2.X + room2.Width;
    var bottom1 = room1.Y + room1.Height;
    var bottom2 = room2.Y + room2.Height;

    return (room1.X < right2) && (right1 > room2.X) && (room1.Y < bottom2) && (bottom1 > room2.Y);
}

//Returns a random position for a room based on a base point with direction
function getAdjustedRoomPos(point, room){
    var maxDistance = options.maxDistance;
    var padding = options.padding;
    var x = point.X;
    var y = point.Y;

    if(point.Direction == 'North'){
        y = y - room.Height - nextInt(padding, maxDistance);
        x -= nextInt(0, room.Width);
    } else if(point.Direction == 'South'){
        y = y + nextInt(padding, maxDistance);
        x -= nextInt(0, room.Width);
    } else if(point.Direction == 'East') {
        x = x + nextInt(padding, maxDistance);
        y -= nextInt(0, room.Height);
    } else if(point.Direction == 'West') {
        x = x - room.Width - nextInt(padding, maxDistance);
        y -= nextInt(0, room.Height);
    }

    return {
        'X': x,
        'Y': y
    };
}

//Returns the next perimeter point, moving clockwise around the room
function nextPerimeter(room, point){
    var copy = {};
    copy.X = point.X;
    copy.Y = point.Y;
    copy.Direction = point.Direction;

    if(point.Direction == 'North'){
        if(point.X == (room.X + room.Width)) copy.Direction = 'East';
        else copy.X++;
    }else if(point.Direction == 'South'){
        if(point.X == room.X) copy.Direction = 'West';
        else copy.X--;
    }else if(point.Direction == 'East'){
        if(point.Y == (room.Y + room.Height)) copy.Direction = 'South';
        else copy.Y++;
    }else if(point.Direction == 'West'){
        if(point.Y == room.Y) copy.Direction = 'North';
        else copy.Y--;
    }

    return copy;
}

//Returns a random point on the perimeter of the room and a direction
function randomPerimeter(room){
    var rand = nextInt(0, (2 * room.Width) + (2 * room.Height) + 3);
    if(rand <= room.Width){
        return {
            'X': room.X + rand,
            'Y': room.Y,
            'Direction': 'North'
        };
    }else if(rand <= (room.Width + room.Height + 1)){
        return {
            'X': room.X + room.Width,
            'Y': room.Y + (rand - room.Width - 1),
            'Direction': 'East'
        };
    }else if(rand <= (2*room.Width + room.Height + 2)){
        return {
            'X': room.X + room.Width - (rand - room.Width - room.Height - 2),
            'Y': room.Y + room.Height,
            'Direction': 'South'
        };
    }else{
        return {
            'X': room.X,
            'Y': room.Y + room.Height - (rand - 2*room.Width - room.Height - 3),
            'Direction': 'West'
        };
    }
}

function RoomFactory(x, y, w, h){
    return {
        'X': x,
        'Y': y,
        'Width': w,
        'Height': h
    };
}

//Copies the list and shuffles the copy before returning
function RandomListCopy(list){
    var newList = list.slice();
    for(var i = newList.length - 1; i > 0; i--){
        var j = nextInt(0, i); //Math.floor(Math.random() * (i + 1));
        var temp = newList[i];
        newList[i] = newList[j];
        newList[j] = temp;
    }
    return newList;
}

function RenderDungeon(){
    var cellSize = graphics.cellSize;
    var bounds = getDungeonBounds();
    var width = (bounds.Width + options.padding*2 + 2) * cellSize;
    var height = (bounds.Height + options.padding*2 + 2) * cellSize;
    var offset = {
        'X': (options.padding + 1 - bounds.Left) * cellSize,
        'Y': (options.padding + 1 - bounds.Top) * cellSize
    };
    var canvas = HTML.generateCanvas(width, height);
    var g = HTML.getGraphics(canvas);
    g.fillRect(0, 0, width, height, graphics.baseColor);
    for(var i in rooms){
        var room = rooms[i];
        var color = graphics.cellColor;
        if(room['IsStart']) color = graphics.startColor;
        g.fillRect(
            room.X * cellSize + offset.X,
            room.Y * cellSize + offset.Y,
            room.Width * cellSize,
            room.Height * cellSize,
            color
        );
    }
    HTML.displayCanvas(canvas, "body");
}

function getDungeonBounds(){
    var left = Number.MAX_VALUE;
    var right = Number.MIN_VALUE;
    var top = Number.MAX_VALUE;
    var bottom = Number.MIN_VALUE;
    
    for(var i in rooms){
        var room = rooms[i];
        var R = room.X + room.Width;
        var B = room.Y + room.Height;

        if(room.X < left) left = room.X;
        if(room.Y < top) top = room.Y;
        if(R > right) right = R;
        if(B > bottom) bottom = B;
    }

    return {
        'Left': left,
        'Right': right,
        'Top': top,
        'Bottom': bottom,
        'Width': right - left,
        'Height': bottom - top  
    };
}

//Returns a random number between min and max, inclusive
function nextInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function btnClick(){
    GenerateDungeon();
}

GenerateDungeon();