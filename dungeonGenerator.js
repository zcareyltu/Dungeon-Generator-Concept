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
    numPlacementTries: 3,
    maxNumCorridors: 4,
    minCorridorGap: 2, //The minimum distance two corridors can be from each other when connecting to a room
    maxCorridorLength: 10//,
    //corridorWidth: 1
};

var rooms = [];
var corridors = [];

function GenerateDungeon(){
    //Load options
    options.numRooms = HTML.getListValue('numberRooms', 3);

    GenerateRooms();
    GenerateCorridors();
    RenderDungeon();
}

function GenerateCorridors(){
    corridors = [];
    for(var i in rooms){
        var room = rooms[i];

        //Choose a random number of cooridors from 1 to MAX
        var numCorridors = nextInt(1, options.maxNumCorridors);

        //If the current # of corridors is less than the random number, create a new one up to the number:
        var corridorCount = room.Corridors.length;
        for(var j = 0; j < numCorridors - corridorCount; j++){
            if(!PlaceCorridor(room)){
                break;
            }
        }
    }  
}

//Attempt to create a new corridor in the given room.
function PlaceCorridor(room){
    var point = randomPerimeter(room);
    var startPoint = point;
    //Can be optimized, but that will be done later
    //Each corridor must be a variable number of spaces away from a different corridor. Start at a random value and go clockwise until favorable conditions are met
    do{
        var nextPoint = nextPerimeter(room, point);
        if((point.Direction == nextPoint.Direction) && (isValidRoomCorridor(room, point, nextPoint))){
            //"raycast" the corridor from the start point to the next room or corridor, up to a maximum length
            //Both points are on the same side of the room (corridor can't be placed on a corner!)
            hitLeft = raycast(point); //Returns Hit, Point, and Distance
            hitRight = raycast(nextPoint);
            //Both rays must hit the same target, and the same distance
            if(hitLeft && hitRight && hitLeft.Hit === hitRight.Hit && hitLeft.Distance == hitRight.Distance){
                //Check that the distance is within the options range
                if(hitLeft.Distance <= options.maxCorridorLength){
                    //NOTE if raycast hits something, be sure the new connection is also meets the start point conditions
                    if('Corridors' in hitLeft.Hit){
                        //We hit a room!
                        if(isValidRoomCorridor(hitLeft.Hit, hitLeft.Point, hitRight.Point)){
                            var x = Math.min(point.X, nextPoint.X, hitLeft.X, hitRight.X);
                            var y = Math.min(point.Y, nextPoint.Y, hitLeft.Y, hitRight.Y);
                            var w = Math.max(Math.abs(point.X - nextPoint.X), Math.abs(point.X - hitLeft.X));
                            var h = Math.max(Math.abs(point.Y - nextPoint.Y), Math.abs(point.Y - hitLeft.Y));

                            var corridor = CorridorFactory(x, y, w, h);
                            corridors.push(corridor);
                            room.Corridors.push(corridor);
                            return true;
                        }
                    }else{
                        //We hit a corridor!
                        if(isValidCorridor(hitLeft.Hit, hitLeft.Point, hitRight.Point)){
                            var x = Math.min(point.X, nextPoint.X, hitLeft.X, hitRight.X);
                            var y = Math.min(point.Y, nextPoint.Y, hitLeft.Y, hitRight.Y);
                            var w = Math.max(Math.abs(point.X - nextPoint.X), Math.abs(point.X - hitLeft.X));
                            var h = Math.max(Math.abs(point.Y - nextPoint.Y), Math.abs(point.Y - hitLeft.Y));

                            var corridor = CorridorFactory(x, y, w, h);
                            corridors.push(corridor);
                            room.Corridors.push(corridor);
                            return true;
                        } 
                    }
                }
            }
        }
        point = nextPoint;
    }while(point != startPoint); //NOTE when moving around clockwise, if original pos is found again impossible to add more corridors, early exit.
    
    return false;
}

function isValidCorridor(corridor, p1, p2){
    //Check that all corridors are a valid distance away from the selected points
    return true; //Will this cause issues?
}

function isValidRoomCorridor(room, p1, p2){
    //Check that all corridors are a valid distance away from the selected points
    for(var i in room.Corridors){
        var corridor = room.Corridors[i];
        if(p1.Direction == "North" || p1.Direction == "South"){
            var x1 = Math.min(p1.X, p2.X);
            var x2 = Math.max(p1.X, p2.X);

            var y = (p1.Direction == "North") ? (corridor.Y + corridor.Height) : corridor.Y;
            if((y == p1.Y) && (x1 < corridor.X + corridor.Width + options.minCorridorGap) && (x2 > corridor.X - options.minCorridorGap)){
                return false;
            }
        }else{
            var y1 = Math.min(p1.Y, p2.Y);
            var y2 = Math.max(p1.Y, p2.Y);

            var x = (p1.Direction == "West") ? (corridor.X + corridor.Width) : corridor.X;
            if((x == p1.X) && (y1 < corridor.Y + corridor.Height + options.minCorridorGap) && (y2 > corridor.Y - minCorridorGap)){
                return false;
            }
        }
    }

    return true;
}

function raycast(startPoint){
    var closestHit;
    var closestPoint;

    for(var i in rooms){
        var room = rooms[i];
        if(startPoint.Direction == "North"){
            var y = room.Y + room.Height;
            if((room.X <= startPoint.X) && ((room.X + room.Width) >= startPoint.X) && (y < startPoint.Y)){
                if(!closestHit || (y > closestPoint.Y)){
                    closestHit = room;
                    closestPoint = {
                        'X': startPoint.X,
                        'Y': y
                    };
                }
            }
        }else if(startPoint.Direction == "South"){
            var y = room.Y;
            if((room.X <= startPoint.X) && ((room.X + room.Width) >= startPoint.X) && (y > startPoint.Y)){
                if(!closestHit || (y < closestPoint.Y)){
                    closestHit = room;
                    closestPoint = {
                        'X': startPoint.X,
                        'Y': y
                    };
                }
            }
        }else if(startPoint.Direction == "West"){
            var x = room.X + room.Width;
            if((room.Y <= startPoint.Y) && ((room.Y + room.Height) >= startPoint.Y) && (x < startPoint.X)){
                if(!closestHit || (x > closestPoint.X)){
                    closestHit = room;
                    closestPoint = {
                        'X': x,
                        'Y': startPoint.Y
                    };
                }
            }
        }else if(startPoint.Direction == "East"){
            var x = room.X;
            if((room.Y <= startPoint.Y) && ((room.Y + room.Height) >= startPoint.Y) && (x > startPoint.X)){
                if(!closestHit || (x < closestPoint.X)){
                    closestHit = room;
                    closestPoint = {
                        'X': x,
                        'Y': startPoint.Y
                    };
                }
            }
        }else{
            return null;
        }
    }

    for(var i in corridors){
        var corridor = corridors[i];
    }

    if(!closestPoint){
        return null;
    }else{
        return {
            'Hit': closestHit,
            'Point': closestPoint,
            'Distance': Math.abs(startPoint.X - closestPoint.X) + Math.abs(startPoint.Y - closestPoint.Y)
        };
    }
}
/*
function IsValidCorridorLocation(room, position){
    for(var i in room.Corridors){
        var corridor = room.Corridors[i];
        var maxPos = Math.max(position, corridor.Position);
        var minPos = Math.min(position, corridor.Position);
        if ( ((maxPos - minPos) < options.minCorridorGap)
            || ((room.NumRoomPositions - maxPos + minPos) < options.minCorridorGap)
        ){
            return false;
        }
    }

    return true;
}
*/
function CorridorFactory(x, y, width, height){
    return {
        'X': x,
        'Y': y,
        'Width': width,
        'Height': height
    };
}

function GenerateRooms(){
    rooms = [];
    startRoom = RoomFactory(-2, -2, 4, 4);
    startRoom.IsStart = true;
    rooms.push(startRoom);  

    var numRooms = options.numRooms;

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
    var rand = nextInt(0, room.NumRoomPositions - 1);
    return GetPointFromPosition(room, rand);
}

function RoomFactory(x, y, w, h){
    return {
        'X': x,
        'Y': y,
        'Width': w,
        'Height': h,
        'Corridors': [],
        'NumRoomPositions': (2*w + 2*h + 4),
    };
}

function GetPointFromPosition(room, position){
    position = position % room.NumRoomPositions;
    if(position <= room.Width){
        return {
            'X': room.X + position,
            'Y': room.Y,
            'Direction': 'North'
        };
    }else if(position <= (room.Width + room.Height + 1)){
        return {
            'X': room.X + room.Width,
            'Y': room.Y + (position - room.Width - 1),
            'Direction': 'East'
        };
    }else if(position <= (2*room.Width + room.Height + 2)){
        return {
            'X': room.X + room.Width - (position - room.Width - room.Height - 2),
            'Y': room.Y + room.Height,
            'Direction': 'South'
        };
    }else{
        return {
            'X': room.X,
            'Y': room.Y + room.Height - (position - 2*room.Width - room.Height - 3),
            'Direction': 'West'
        };
    }
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
    for(var i in corridors){
        var corridor = corridors[i];
        var color = graphics.cellColor;
        g.fillRect(
            corridor.X * cellSize + offset.X,
            corridor.Y * cellSize + offset.Y,
            corridor.Width * cellSize,
            corridor.Height * cellSize,
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

    for(var i in corridors){
        var corridor = corridors[i];
        var R = corridor.X + corridor.Width;
        var B = corridor.Y + corridor.Height;

        if(corridor.X < left) left = corridor.X;
        if(corridor.Y < top) top = corridor.Y;
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