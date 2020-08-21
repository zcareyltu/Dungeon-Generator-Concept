
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
    maxCorridorLength: 10,
    corridorWidth: 1
};

var rooms = [];
var corridors = [];
var renderer;

function GenerateDungeon(){
    //Load options
    options.numRooms = HTML.getListValue('numberRooms', 3);

    renderer = GetDungeonRenderer();
    GenerateRooms();
    renderer.render(20, 1);
}

function GenerateRooms(){
    rooms = [];
    startRoom = RoomFactory(-2, -2, 4, 4);
    startRoom.IsStart = true;
    SealRoom(startRoom);  

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

//Does all necessary operations to permanently add the room to the dungeon
function SealRoom(room){
    isValidRect(room);
    rooms.push(room);
    renderer.renderRoom(room);
}


function PlaceRoom(room){
    var roomList = RandomListCopy(rooms);
    for(var i in roomList){
        var baseRoom = roomList[i];
        var firstPos = nextInt(0, room.NumRoomPositions - 1);
        var pos = firstPos;
        
        do{
            var maxDistance = options.maxDistance;
            var padding = options.padding;
            var distance = nextInt(padding, maxDistance)

            var point1 = GetPointFromPosition(pos);
            var point2 = GetPointFromPosition((pos + options.corridorWidth) % room.NumRoomPositions)
            //Check if the corridor will be valid
            if(point1.Direction != point2.Direction){
                pos = (pos + 1) % room.NumRoomPositions;
                continue;
            }

            //Check other corridors and be sure they are far enough away
            for(var j in corridors){
                var corridor = corridors[j];
            }

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

            pos = (pos + 1) % room.NumRoomPositions;
        }while(pos != firstPos/*(point.X != firstPoint.X) || (point.Y != firstPoint.Y) || (point.Direction != firstPoint.Direction)*/);
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
/*
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
}*/

//Optionally, p3 can be ommitted if the two points are known to be diagonal.
function GetRectFromPoints(p1, p2, p3){
    var x = Math.min(p1.X, p2.X, p3 ? p3.X : p2.X);
    var y = Math.min(p1.Y, p2.Y, p3 ? p3.Y : p2.Y);

    var x2 = Math.max(p1.X, p2.X, p3 ? p3.X : p2.X);
    var y2 = Math.max(p1.Y, p2.Y, p3 ? p3.Y : p2.Y);

    return {
        X: x,
        Y: y,
        Width: x2 - x,
        Height: y2 - y
    }
}

//Does not return, but will throw error is not valid.
function isValidRect(rect){
    var error;

    if(!('X' in rect)){
        error = "No X component in rect!";
    }else if(!('Y' in rect)){
        error = 'No Y component in rect!';
    }else if(!(typeof rect.X == 'number')){
        error = 'X in rect is not a number!';
    }else if(!(typeof rect.Y == 'number')){
        error = 'Y in rect is not a number!';
    }else if(!('Width' in rect)){
        error = "No Width component in rect!";
    }else if(!('Height' in rect)){
        error = 'No Height component in rect!';
    }else if(!(typeof rect.Width == 'number')){ 
        error = 'Width in rect is not a number!';
    }else if(!(typeof rect.Height == 'number')){
        error = 'Height in rect is not a number!';
    }

    if(error){
        console.trace();
        throw error;
    }
}

//Does not return, but will throw error is not valid.
function isValidPoint(pt){
    var error;

    if(!('X' in pt)){
        error = "No X component in point!";
    }else if(!('Y' in pt)){
        error = 'No Y component in point!';
    }else if(!(typeof pt.X == 'number')){
        error = 'X in point is not a number!';
    }else if(!(typeof pt.Y == 'number')){ 
        error = 'Y in point is not a number!';
    }

    if(error){
        console.trace();
        throw error;
    }
}

//Returns a random number between min and max, inclusive
function nextInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function btnClick(){
    GenerateDungeon();
}

GenerateDungeon();