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
    startColor: [0, 255, 0],
    corridorColor: [175, 175, 175]
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
                        //make sure it doesn't already have a connection to this room
                        if(!isObjectInList(room.Connections, hitLeft.Hit)){
                            if(isValidRoomCorridor(hitLeft.Hit, hitLeft.Point, hitRight.Point)){
                                var x = Math.min(point.X, nextPoint.X, hitLeft.Point.X, hitRight.Point.X);
                                var y = Math.min(point.Y, nextPoint.Y, hitLeft.Point.Y, hitRight.Point.Y);
                                var w = Math.max(Math.abs(point.X - nextPoint.X), Math.abs(point.X - hitLeft.Point.X));
                                var h = Math.max(Math.abs(point.Y - nextPoint.Y), Math.abs(point.Y - hitLeft.Point.Y));

                                var corridor = CorridorFactory(x, y, w, h);
                                corridor.Connections.push(room);
                                corridor.Connections.push(hitLeft.Hit);
                                
                                room.Corridors.push(corridor);
                                room.Connections.push(hitLeft.Hit);

                                hitLeft.Hit.Corridors.push(corridor);
                                hitLeft.Hit.Connections.push(room);

                                corridors.push(corridor);

                                return true;
                            }
                        }
                    }else{
                        //We hit a corridor!
                        //Make sure none of it's connections is already connected to this room.
                        var connected = false;
                        for(var j in hitLeft.Hit.Connections){
                            var hit = hitLeft.Hit.Connections[j];
                            if(isObjectInList(room.Connections, hit)){
                                connected = true;
                                break;
                            }
                        }

                        if(!connected){
                            if(isValidCorridor(hitLeft.Hit, hitLeft.Point, hitRight.Point)){
                                var x = Math.min(point.X, nextPoint.X, hitLeft.Point.X, hitRight.Point.X);
                                var y = Math.min(point.Y, nextPoint.Y, hitLeft.Point.Y, hitRight.Point.Y);
                                var w = Math.max(Math.abs(point.X - nextPoint.X), Math.abs(point.X - hitLeft.Point.X));
                                var h = Math.max(Math.abs(point.Y - nextPoint.Y), Math.abs(point.Y - hitLeft.Point.Y));

                                var corridor = CorridorFactory(x, y, w, h);
                                corridor.Connections = hitLeft.Hit.Connections.concat(room);

                                room.Corridors.push(corridor);
                                room.Connections = room.Connections.concat(hitLeft.Hit.Connections);

                                hitLeft.Hit.Connections.push(room);
                                for(var j in hitLeft.Hit.Connections){
                                    var room2 = hitLeft.Hit.Connections[j];
                                    room2.Connections.push(room);
                                }

                                corridors.push(corridor);

                                return true;
                            } 
                        }
                    }
                }
            }

            //If raycasting failed, attempt an angle corridor before continuing
            //if(attemptAngleCorridor(room, point, nextPoint, hitLeft, hitRight)) return true;
        }
        point = nextPoint;
    }while((point.X != startPoint.X) || (point.Y != startPoint.Y) || (point.Direction != startPoint.Direction)); //NOTE when moving around clockwise, if original pos is found again impossible to add more corridors, early exit.
    
    return false;
}

//TODO ensure corridors use the minGap option for checking distance from ALL rooms!
function attemptAngleCorridor(room, point, nextPoint, hitLeft, hitRight){
    var maxDist = Math.min(hitLeft ? hitLeft.Distance : options.maxCorridorLength, hitRight ? hitRight.Distance : options.maxCorridorLength, options.maxCorridorLength);
    var angles = [];
    for(var dist = options.minCorridorGap + 1; dist < maxDist; dist++){
        if(point.Direction == "North"){
            //Raycast right
            var rayLeft = raycast(RotateCW(moveInDirection(nextPoint, dist)));
            var rayRight = raycast(RotateCW(moveInDirection(nextPoint, dist - 1)));
            if(rayLeft && rayRight && rayLeft.Hit == rayRight.Hit){
                //I'm ignoring validation for now to keep this simple as a proof of concept
                angles.push({
                    'Base': CorridorFactory(point.X, point.Y - dist, nextPoint.X - point.X, dist),
                    'Angle': CorridorFactory(nextPoint.X, nextPoint.Y - dist, rayLeft.Distance, nextPoint.X - point.X),
                    'Hit': rayLeft.Hit
                });
            }

            //Raycast left
            rayLeft = raycast(RotateCCW(moveInDirection(point, dist - 1)));
            rayRight = raycast(RotateCCW(moveInDirection(point, dist)));
            if(rayLeft && rayRight && rayLeft.Hit == rayRight.Hit){
                //I'm ignoring validation for now to keep this simple as a proof of concept
                angles.push({
                    'Base': CorridorFactory(point.X, point.Y - dist, nextPoint.X - point.X, dist),
                    'Angle': CorridorFactory(point.X - rayRight.Distance, point.Y - dist, rayRight.Distance, nextPoint.X - point.X),
                    'Hit': rayRight.Hit
                });
            }
        }else if(point.Direction == 'West'){

        }else if(point.Direction == 'South'){

        }else if(point.Direction == 'East'){
            
        }
    }

    if(angles.length == 0){
        return false;
    }else{
        console.log(angles);
    }
}

function angleGeneric(){
    
}

function moveInDirection(point, distance){
    if(point.Direction == "North"){
        return {
            'X': point.X,
            'Y': point.Y - distance,
            'Direction': point.Direction
        };
    } else  if(point.Direction == "East"){
        return {
            'X': point.X + distance,
            'Y': point.Y,
            'Direction': point.Direction
        };
    } else if(point.Direction == "South"){
        return {
            'X': point.X,
            'Y': point.Y + distance,
            'Direction': point.Direction
        };
    } else if(point.Direction == "West"){
        return {
            'X': point.X - distance,
            'Y': point.Y,
            'Direction': point.Direction
        };
    }
}

function RotateCW(point){
    if(point.Direction == "North"){
        return {
            'X': point.X,
            'Y': point.Y,
            'Direction': 'East'
        };
    }else if(point.Direction == "East"){
        return {
            'X': point.X,
            'Y': point.Y,
            'Direction': 'South'
        };
    } else if(point.Direction == "South"){
        return {
            'X': point.X,
            'Y': point.Y,
            'Direction': 'West'
        };
    } else if(point.Direction == "West"){
        return {
            'X': point.X,
            'Y': point.Y,
            'Direction': 'North'
        };
    }
}

function RotateCCW(point){
    if(point.Direction == "North"){
        return {
            'X': point.X,
            'Y': point.Y,
            'Direction': 'West'
        };
    }else if(point.Direction == "East"){
        return {
            'X': point.X,
            'Y': point.Y,
            'Direction': 'North'
        };
    } else if(point.Direction == "South"){
        return {
            'X': point.X,
            'Y': point.Y,
            'Direction': 'East'
        };
    } else if(point.Direction == "West"){
        return {
            'X': point.X,
            'Y': point.Y,
            'Direction': 'South'
        };
    }
}

function isObjectInList(list, obj){
    for(var i in list){
        if(list[i] === obj){
            return true;
        }
    }
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
            if((y == p1.Y) && (x1 < (corridor.X + corridor.Width + options.minCorridorGap)) && (x2 > (corridor.X - options.minCorridorGap))){
                return false;
            }
        }else{
            var y1 = Math.min(p1.Y, p2.Y);
            var y2 = Math.max(p1.Y, p2.Y);

            var x = (p1.Direction == "West") ? (corridor.X + corridor.Width) : corridor.X;
            if((x == p1.X) && (y1 < (corridor.Y + corridor.Height + options.minCorridorGap)) && (y2 > (corridor.Y - options.minCorridorGap))){
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
        if(startPoint.Direction == "North"){
            var y = corridor.Y + corridor.Height;
            if((corridor.X <= startPoint.X) && ((corridor.X + corridor.Width) >= startPoint.X) && (y < startPoint.Y)){
                if(!closestHit || (y > closestPoint.Y)){
                    closestHit = corridor;
                    closestPoint = {
                        'X': startPoint.X,
                        'Y': y
                    };
                }
            }
        }else if(startPoint.Direction == "South"){
            var y = corridor.Y;
            if((corridor.X <= startPoint.X) && ((corridor.X + corridor.Width) >= startPoint.X) && (y > startPoint.Y)){
                if(!closestHit || (y < closestPoint.Y)){
                    closestHit = corridor;
                    closestPoint = {
                        'X': startPoint.X,
                        'Y': y
                    };
                }
            }
        }else if(startPoint.Direction == "West"){
            var x = corridor.X + corridor.Width;
            if((corridor.Y <= startPoint.Y) && ((corridor.Y + corridor.Height) >= startPoint.Y) && (x < startPoint.X)){
                if(!closestHit || (x > closestPoint.X)){
                    closestHit = corridor;
                    closestPoint = {
                        'X': x,
                        'Y': startPoint.Y
                    };
                }
            }
        }else if(startPoint.Direction == "East"){
            var x = corridor.X;
            if((corridor.Y <= startPoint.Y) && ((corridor.Y + corridor.Height) >= startPoint.Y) && (x > startPoint.X)){
                if(!closestHit || (x < closestPoint.X)){
                    closestHit = corridor;
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
function CorridorFromPoints(p1, p2, p3){
    var x = Math.min(p1.X, p2.X, p3.X);
    var y = Math.min(p1.Y, p2.Y, p3.Y);
    var x2 = Math.max(p1.X, p2.X, p3.X);
    var y2 = Math.max(p1.Y, p2.Y, p3.Y);

    return CorridorFactory(x, y, x2 - x, y2 - y);
}

function CorridorFactory(x, y, width, height){
    return {
        'X': x,
        'Y': y,
        'Width': width,
        'Height': height,
        'Connections': []
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
        var bestCorridor = undefined;
        for (var j = 0; j < options.numPlacementTries; j++){
            var values = PlaceRoom(nextRoom);
            var pos = values.Position;
            var corridor = values.Corridor;
            var score = roomScore(nextRoom);
            if((j == 0) || (score < bestScore)){
                bestPos = pos;
                bestScore = score;
                bestCorridor = corridor;
            }
        }
        nextRoom.X = bestPos.X;
        nextRoom.Y = bestPos.Y;
        var otherRoom = bestCorridor.Connections[0];
        bestCorridor.Connections.push(nextRoom);
        nextRoom.Connections.push(otherRoom);
        otherRoom.Connections.push(nextRoom);
        rooms.push(nextRoom);
        corridors.push(bestCorridor);
    }
}

function PlaceRoom(room){
    var roomList = RandomListCopy(rooms);
    for(var i in roomList){
        var baseRoom = roomList[i];
        var firstPoint = randomPerimeter(baseRoom);
        var point = firstPoint;
        do{
            var maxDistance = options.maxDistance;
            var padding = options.padding;
            var distance = nextInt(padding, maxDistance)

            var pos = getAdjustedRoomPos(point, distance, room);
            room.X = pos.X;
            room.Y = pos.Y;
            if(!roomCollides(room)){
                //Room fits!
                var thirdPoint = moveInDirection(RotateCW(point), 1);
                var corridor = CorridorFromPoints(point, moveInDirection(point, distance), thirdPoint);
                /*if(point.Direction == 'North'){
                    corridor = CorridorFactory(point.X, point.Y - distance, 1, distance);
                } else if(point.Direction == 'South'){
                    corridor = CorridorFactory(point.X, point.Y, 1, distance);
                } else if(point.Direction == 'East') {
                    corridor = CorridorFactory(point.X, point.Y, distance, 1);
                } else if(point.Direction == 'West') {
                    corridor = CorridorFactory(point.X - distance, point.Y, distance, 1);
                }else{
                    console.log(point.Direction);
                }*/
                corridor.Connections.push(baseRoom);
                console.log(point);
                console.log(corridor);

                return {
                    'Position': pos,
                    'Corridor': corridor
                };
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
function getAdjustedRoomPos(point, distance, room){
    var x = point.X;
    var y = point.Y;

    if(point.Direction == 'North'){
        y = y - room.Height - distance;
        x -= nextInt(0, room.Width - 1);
    } else if(point.Direction == 'South'){
        y = y + distance;
        x -= nextInt(0, room.Width - 1);
    } else if(point.Direction == 'East') {
        x = x + distance;
        y -= nextInt(0, room.Height - 1);
    } else if(point.Direction == 'West') {
        x = x - room.Width - distance;
        y -= nextInt(0, room.Height - 1);
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
        'Connections': [],
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
        var color = graphics.corridorColor;
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