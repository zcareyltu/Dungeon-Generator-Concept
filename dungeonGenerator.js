var testRands = [0,5,35,6,44,4,32,1,1,100,3,53,2,108,0,3,32,0,50,2,15,74,2,27,12,95,11,105,6,47,0,4,71,6,23,0,10,73,4,9,3,37,4,32,1,7,62,0,49,5,84,3,54];
var nxtRand = 0;
function getNextRand(){
    return testRands[nxtRand++];
}

function printArray(arr){
    console.log('[' + arr.join('\n') + ']');
}

function print2dArray(arr, i, j){
    for(var r = 0; r <= i; r++){
        var line = "";
        for(var c = 0; c <= j; c++){
            line += arr[r][c];
            line += "\t";
        }
        //line += "\n";
        console.log(line);
    }
    //console.log(line);
}

function printObj(obj){
    var newObj = {};
    for(var key in obj){
        newObj[key] = obj[key];
    }
    console.log(newObj);
}

//================Configuration============
var dungeon_layout = {
    'Box':      [[1,1,1],[1,0,1],[1,1,1]],
    'Cross':    [[0,1,0],[1,1,1],[0,1,0]]
};

var corridor_layout = {
    'Labyrinth': 0,
    'Bent':      50,
    'Straight':  100
};

var map_style = {
    'Standard': {
      'fill':      '000000',
      'open':      'FFFFFF',
      'open_grid': 'CCCCCC',
    }
  };
//=========================================

//=============Cell Bits===================
var NOTHING     = 0x00000000;

var BLOCKED     = 0x00000001;
var ROOM        = 0x00000002;
var CORRIDOR    = 0x00000004;
//                 0x00000008;
var PERIMETER   = 0x00000010;
var ENTRANCE    = 0x00000020;
var ROOM_ID     = 0x0000FFC0;

var ARCH        = 0x00010000;
var DOOR        = 0x00020000;
var LOCKED      = 0x00040000;
var TRAPPED     = 0x00080000;
var SECRET      = 0x00100000;
var PORTC       = 0x00200000;
var STAIR_DN    = 0x00400000;
var STAIR_UP    = 0x00800000;

var LABEL       = 0xFF000000;

var OPENSPACE   = ROOM | CORRIDOR;
var DOORSPACE   = ARCH | DOOR | LOCKED | TRAPPED | SECRET | PORTC;
var ESPACE      = ENTRANCE | DOORSPACE | 0xFF000000;
var STAIRS      = STAIR_DN | STAIR_UP;

var BLOCK_ROOM  = BLOCKED | ROOM;
var BLOCK_CORR  = BLOCKED | PERIMETER | CORRIDOR;
var BLOCK_DOOR  = BLOCKED | DOORSPACE;
//=========================================
var di = {
    'north': -1,
    'south': 1,
    'west': 0,
    'east': 0
};

var dj = {
    'north': 0,
    'south': 0,
    'west': -1,
    'east': 1
};

var dj_dirs = sortKeys(dj);

//=========================================
// cleaning

var close_end = {
  'north': {
    'walled': [[0,-1],[1,-1],[1,0],[1,1],[0,1]],
    'close': [[0,0]],
    'recurse': [-1,0],
  },
  'south': {
    'walled': [[0,-1],[-1,-1],[-1,0],[-1,1],[0,1]],
    'close': [[0,0]],
    'recurse': [1,0],
  },
  'west': {
    'walled': [[-1,0],[-1,1],[0,1],[1,1],[1,0]],
    'close': [[0,0]],
    'recurse': [0,-1],
  },
  'east': {
    'walled': [[-1,0],[-1,-1],[0,-1],[1,-1],[1,0]],
    'close': [[0,0]],
    'recurse': [0,1],
  },
};

//=========================================
// imaging

var color_chain = {
  'door': 'fill',
  'label': 'fill',
  'stair': 'wall',
  'wall': 'fill',
  'fill': 'black',
};

//=========================================

var img;
btnClick();

function btnClick() {
    GenerateDungeon();
}

function GenerateDungeon() {
    opts = {};
    opts['seed'] = Math.round(new Date().getTime() / 1000);
    opts['n_rows'] = 39; //Must be an odd number
    opts['n_cols'] = 39; //Must be an odd number
    opts['dungeon_layout'] = 'Box'; //'Box';
    opts['room_min'] = 3;
    opts['room_max'] = 9;
    opts['room_layout'] = 'Scattered'; //"Packed, scattered"
    opts['corridor_layout'] = 'Bent';
    opts['remove_deadends'] = 50; //Percentage
    opts['cell_size'] = 18; //Pixels

    var dungeon = createDungeon(opts);
    displayDungeon(dungeon);
}

function printRooms(dungeon){
    rooms = [];
    for(var roomId in dungeon['room']){
        var orig = dungeon['room'][roomId];
        var roomCopy = {};

        roomCopy['area'] = orig['area'];
        roomCopy['col'] = orig['col'];
        roomCopy['east'] = orig['east'];
        roomCopy['height'] = orig['height'];
        roomCopy['id'] = orig['id'];
        roomCopy['north'] = orig['north'];
        roomCopy['row'] = orig['row'];
        roomCopy['south'] = orig['south'];
        roomCopy['west'] = orig['west'];
        roomCopy['width'] = orig['width'];

        rooms.push(roomCopy);
    }
    return rooms;
}

function createDungeon(opts) {
    dungeon = opts;

    dungeon['n_i'] = Math.floor(dungeon['n_rows'] / 2);
    dungeon['n_j'] = Math.floor(dungeon['n_cols'] / 2);
    dungeon['n_rows'] = dungeon['n_i'] * 2;
    dungeon['n_cols'] = dungeon['n_j'] * 2;
    dungeon['max_row'] = dungeon['n_rows'] - 1;
    dungeon['max_col'] = dungeon['n_cols'] - 1;
    dungeon['n_rooms'] = 0;
    dungeon['room'] = [];

    var max = dungeon['room_max'];
    var min = dungeon['room_min'];
    dungeon['room_base'] = Math.floor((min + 1) / 2);
    dungeon['room_radix'] = Math.floor((max - min) / 2) + 1;

    dungeon = init_cells(dungeon);
    dungeon = emplace_rooms(dungeon);
    dungeon = open_rooms(dungeon);
    dungeon = label_rooms(dungeon);
    //dungeon = corridors(dungeon);
    //dungeon = emplace_stairs(dungeon) if (dungeon->{'add_stairs'});
    //dungeon = clean_dungeon(dungeon);

    

    return dungeon;
}

//Initialize the cells of the dungeon
function init_cells(dungeon){
    dungeon['cell'] = {};
    for (var r = 0; r <= dungeon['n_rows']; r++) {
        dungeon['cell'][r] = {};
        for (var c = 0; c <= dungeon['n_cols']; c++) {
            dungeon['cell'][r][c] = NOTHING;
        }
    }

    //TODO can't set random seed in javascript
    //srand($dungeon->{'seed'} + 0);
    if (dungeon['dungeon_layout'] in dungeon_layout) {
        var mask = dungeon_layout[dungeon['dungeon_layout']];
        dungeon = mask_cells(dungeon, mask);
    }/* else if (dungeon['dungeon_layout'] === 'Round') {
        dungeon = round_mask(dungeon);
    }*/
    
    return dungeon;
}

//Mask the cells? Done after initialization. (dungeon, dungeon_layout['Box'])
function mask_cells(dungeon, mask){
    var r_x = mask.length * 1.0 / (dungeon['n_rows'] + 1);
    var c_x = mask[0].length * 1.0 / (dungeon['n_cols'] + 1);
    var cell = dungeon['cell'];
  
    for (var r = 0; r <= dungeon['n_rows']; r++) {
        for (var c = 0; c <= dungeon['n_cols']; c++) {
            if(!(mask[Math.floor(r * r_x)][Math.floor(c * c_x)])) cell[r][c] = BLOCKED;
        }
    }

    return dungeon;
}

/*function round_mask(dungeon){
    var center_r = Math.floor(dungeon['n_rows'] / 2);
    var center_c = Math.floor(dungeon['n_cols'] / 2);
    var cell = dungeon['cell'];
  
    for (var r = 0; r <= dungeon['n_rows']; r++) {
      for (var c = 0; c <= dungeon['n_cols']; c++) {
        var d = Math.sqrt(((r - center_r) ** 2) + ((c - center_c) ** 2));
        if(d > center_c) cell[r][c] = BLOCKED;
      }
    }

    return dungeon;
}*/

//Call either pack_rooms() or scatter_rooms depending on type selected
function emplace_rooms(dungeon){
    if (dungeon['room_layout'] === 'Packed') {
      dungeon = pack_rooms(dungeon);
    } else {
      dungeon = scatter_rooms(dungeon);
    }

    return dungeon;
}

function pack_rooms(dungeon){
    var cell = dungeon['cell'];

    for (var i = 0; i < dungeon['n_i']; i++) {
        var r = (i * 2) + 1;
        
        for (var j = 0; j < dungeon['n_j']; j++) {
            var c = (j * 2) + 1;
  
            if(cell[r][c] & ROOM) continue;
            if((i == 0 || j == 0) && (random(2) == 1)) continue;
  
            var proto = { 
                'i': i, 
                'j': j 
            };
            dungeon = emplace_room(dungeon, proto);
         }
    }

    return dungeon;
}

//Scatter rooms randomly?
function scatter_rooms(dungeon){
    var n_rooms = alloc_rooms(dungeon);
  
    var testRooms = [
        {
            'i': 4,
            'j': 8,
            'width': 5,
            'height': 2
        },
        {
            'i': 8,
            'j': 11,
            'width': 5,
            'height': 4
        },
        {
            'i': 16,
            'j': 7,
            'width': 3,
            'height': 2
        },
        {
            'i': 11,
            'j': 4,
            'width': 3,
            'height': 3
        },
        {
            'i': 8,
            'j': 10,
            'width': 4,
            'height': 5
        },
        {
            'i': 16,
            'j': 6,
            'width': 2,
            'height': 2
        },
        {
            'i': 4,
            'j': 5,
            'width': 5,
            'height': 4
        },
        {
            'i': 1,
            'j': 14,
            'width': 2,
            'height': 2
        },
        {
            'i': 12,
            'j': 2,
            'width': 3,
            'height': 5
        },
        {
            'i': 10,
            'j': 14,
            'width': 4,
            'height': 2
        },
        {
            'i': 8,
            'j': 0,
            'width': 4,
            'height': 4
        },
        {
            'i': 11,
            'j': 0,
            'width': 4,
            'height': 3
        },
        {
            'i': 7,
            'j': 8,
            'width': 3,
            'height': 2
        },
        {
            'i': 5,
            'j': 7,
            'width': 5,
            'height': 5
        },
        {
            'i': 6,
            'j': 13,
            'width': 4,
            'height': 3
        },
        {
            'i': 4,
            'j': 12,
            'width': 4,
            'height': 3
        },
        {
            'i': 11,
            'j': 11,
            'width': 3,
            'height': 5
        }
    ];

    for (var i = 0; i < n_rooms; i++) {
        dungeon = emplace_room(dungeon, testRooms[i]/*{}*/);
    }

    return dungeon;
}

//Actually place a room?
function emplace_room(dungeon, proto){
    if (dungeon['n_rooms'] >= 999) return dungeon;
    var r;
    var c;
    var cell = dungeon['cell'];

    //# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //# room position and size

    //proto = set_room(dungeon, proto); //TODO DID NOT ENSURE THIS FUNCTIOK WORKS PROPERLY
    //console.log('add this back in, and remove temp randomness');

    //# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //# room boundaries

    var r1 = (proto['i'] * 2) + 1;
    var c1 = (proto['j'] * 2) + 1;
    var r2 = ((proto['i'] + proto['height']) * 2) - 1;
    var c2 = ((proto['j'] + proto['width'] ) * 2) - 1;
    if (r1 < 1 || r2 > dungeon['max_row']) return dungeon;
    if (c1 < 1 || c2 > dungeon['max_col']) return dungeon;

    //# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //# check for collisions with existing rooms
    var hit = sound_room(dungeon, r1, c1, r2, c2);

    if (hit == 'blocked') return dungeon;

    var hit_list = Object.keys(hit);
    var n_hits = hit_list.length;
    var room_id = 0;

    if (n_hits == 0) {
        room_id = dungeon['n_rooms'] + 1;
        dungeon['n_rooms'] = room_id;
    } else {
        return dungeon;
    }
    dungeon['last_room_id'] = room_id;

    //# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //# emplace room

    for (r = r1; r <= r2; r++) {
        for (c = c1; c <= c2; c++) {
            if (cell[r][c] & ENTRANCE) {
                cell[r][c] &= ~ESPACE;
            } else if (cell[r][c] & PERIMETER) {
                cell[r][c] &= ~PERIMETER;
            }
            cell[r][c] |= ROOM | (room_id << 6);
        }
    }

    var height = ((r2 - r1) + 1) * 10;
    var width = ((c2 - c1) + 1) * 10;

    var room_data = {
        'id': room_id, 
        'row': r1,
        'col': c1,
        'north': r1,
        'south': r2, 
        'west': c1,
        'east': c2,
        'height': height, 
        'width': width, 
        'area': (height * width)
    };
    
    dungeon['room'][room_id] = room_data;

    //# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //# block corridors from room boundary
    //# check for door openings from adjacent rooms

    for (r = r1 - 1; r <= r2 + 1; r++) {
        if(!(cell[r][c1 - 1] & (ROOM | ENTRANCE))) {
            cell[r][c1 - 1] |= PERIMETER;
        }
        if(!(cell[r][c2 + 1] & (ROOM | ENTRANCE))) {
            cell[r][c2 + 1] |= PERIMETER;
        }
    }

    for (c = c1 - 1; c <= c2 + 1; c++) {
        if(!(cell[r1 - 1][c] & (ROOM | ENTRANCE))){
            cell[r1 - 1][c] |= PERIMETER;
        }
        if(!(cell[r2 + 1][c] & (ROOM | ENTRANCE))){
            cell[r2 + 1][c] |= PERIMETER;
        }
    }

    //# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

    return dungeon;
}

function set_room(dungeon, proto){
    var base = dungeon['room_base'];
    var radix = dungeon['room_radix'];
  
    if(!('height' in proto)) {
        if ('i' in proto) {
            var a = dungeon['n_i'] - base - proto['i'];
            if(a < 0) a = 0;
            var r = (a < radix) ? a : radix;
  
            proto['height'] = random(r) + base;
        } else {
            proto['height'] = random(radix) + base;
        }
    }
    if (!('width' in proto)) {
        if ('j' in proto) {
            var a = dungeon['n_j'] - base - proto['j'];
            if(a < 0) a = 0;
            var r = (a < radix) ? a : radix;
  
            proto['width'] = random(r) + base;
        } else {
            proto['width'] = random(radix) + base;
        }
    }
    if (!('i' in proto)) {
        proto['i'] = random(dungeon['n_i'] - proto['height']);
    }
    if (!('j' in proto)) {
        proto['j'] = random(dungeon['n_j'] - proto['width']);
    }

    return proto;
}

function sound_room(dungeon, r1, c1, r2, c2){
    var cell = dungeon['cell'];
    var hit = {};
  
    for (var r = r1; r <= r2; r++) {
        for (var c = c1; c <= c2; c++) {
            if (cell[r][c] & BLOCKED) {
                return 'blocked';
            }
            if (cell[r][c] & ROOM) {
                var id = (cell[r][c] & ROOM_ID) >> 6;
                if(!(id in hit)) hit[id] = 0;
                hit[id] += 1;
            }
        }
    }
    return hit;
}

function open_rooms(dungeon){
    for (var id = 1; id <= dungeon['n_rooms']; id++) {
//printObj(dungeon['room'][id]);
        dungeon = open_room(dungeon, dungeon['room'][id]);
    }

    //print2dArray(dungeon['cell'], dungeon['n_rows'], dungeon['n_cols']);

    if('connect' in dungeon) delete dungeon['connect'];
    return dungeon;
}

function printSills(sillArr){
    for(var sillIndex in sillArr){
        printObj(sillArr[sillIndex]);
    }
}

function open_room(dungeon, room) {
    var list = door_sills(dungeon, room);
    if(!list) return dungeon;
    
    var n_opens = alloc_opens(dungeon, room);
    var cell = dungeon['cell'];
    for (var i = 0; i < n_opens; i++) {
        var rand = getNextRand();
        var sill = list.splice(rand/*random(@listlist.length)*/, 1)[0]; //console.log('add back in random');
        if(!sill) break; //last unless ($sill);
//printObj(sill);
//console.log("break\n\n");
        var door_r = sill['door_r'];
        var door_c = sill['door_c'];
        var door_cell = cell[door_r][door_c];
        if (door_cell & DOORSPACE) i--;

        var out_id = sill['out_id']; 
        if (out_id) {
            var connect = join(',',sortTwoValues(room['id'], out_id));
            if(!('connect' in dungeon)) dungeon['connect'] = [];
            if(!(connect in dungeon['connect'])) dungeon['connect'] = 0;
            if(dungeon['connect'][connect]++) i--;
        }

        var open_r = sill['sill_r'];
        var open_c = sill['sill_c'];
        var open_dir = sill['dir'];

    // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    // open door

        for (var x = 0; x < 3; x++) {
            var r = open_r + (di[open_dir] * x);
            var c = open_c + (dj[open_dir] * x);

            cell[r][c] &= ~PERIMETER;
            cell[r][c] |= ENTRANCE;
        }
        
        var door_type = doorType();
        var door = {
            'row': door_r,
            'col': door_c
        };

        if (door_type == ARCH) {
            cell[door_r][door_c] |= ARCH;
            door['key'] = 'arch'; 
            door['type'] = 'Archway';
        } else if (door_type == DOOR) {
            cell[door_r][door_c] |= DOOR;
            cell[door_r][door_c] |= (111 << 24); //111 = charCode of 'o'
            door['key'] = 'open';
            door['type'] = 'Unlocked Door';
        } else if (door_type == LOCKED) {
            cell[door_r][door_c] |= LOCKED;
            cell[door_r][door_c] |= (120 << 24); //120 = charCode of 'x'
            door['key'] = 'lock';
            door['type'] = 'Locked Door';
        } else if (door_type == TRAPPED) {
            cell[door_r][door_c] |= TRAPPED;
            cell[door_r][door_c] |= (116 << 24); //116 = charCode of 't'
            door['key'] = 'trap';
            door['type'] = 'Trapped Door';
        } else if (door_type == SECRET) {
            cell[door_r][door_c] |= SECRET;
            cell[door_r][door_c] |= (115 << 24); //115 = charCode of 's'
            door['key'] = 'secret';
            door['type'] = 'Secret Door';
        } else if (door_type == PORTC) {
            cell[door_r][door_c] |= PORTC;
            cell[door_r][door_c] |= (35 << 24); //35 = charCode of '#'
            door['key'] = 'portc';
            door['type'] = 'Portcullis';
        }

        if(out_id) door['out_id'] = out_id;
        if(door){
            if(!('door' in room)) room['door'] = {};
            if(!(open_dir in room['door'])) room['door'][open_dir] = [];
            room['door'][open_dir].push(door);
        }
    }

    return dungeon;
}

function door_sills(dungeon, room){
    var cell = dungeon['cell'];
    var list = [];
  
    if (room['north'] >= 3) {
        for (var c = room['west']; c <= room['east']; c += 2) {
            var sill = check_sill(cell, room, room['north'], c, 'north');
            if (sill)list.push(sill);
        }
    }
    if (room['south'] <= (dungeon['n_rows'] - 3)) {
        for (var c = room['west']; c <= room['east']; c += 2) {
            var sill = check_sill(cell, room, room['south'], c, 'south');
            if (sill) list.push(sill);
      }
    }
    if (room['west'] >= 3) {
        for (var r = room['north']; r <= room['south']; r += 2) {
            var sill = check_sill(cell, room, r, room['west'], 'west');
            if (sill) list.push(sill);
        }
    }
    if (room['east'] <= (dungeon['n_cols'] - 3)) {
        for (var r = room['north']; r <= room['south']; r += 2) {
            var sill = check_sill(cell, room, r, room['east'], 'east');
            if (sill) list.push(sill);
        }
    }

    //console.log(Add shuffle back in and remove sorting);
    return list;//shuffle(list);
}

function check_sill(cell, room, sill_r, sill_c, dir){
    var door_r = sill_r + di[dir];
    var door_c = sill_c + dj[dir];
    var door_cell = cell[door_r][door_c];
    if(!(door_cell & PERIMETER)) return;
    if(door_cell & BLOCK_DOOR) return;
    var out_r  = door_r + di[dir];
    var out_c  = door_c + dj[dir];
    var out_cell = cell[out_r][out_c];
    if (out_cell & BLOCKED) return;
  
    var out_id; 
    if (out_cell & ROOM) {
      out_id = (out_cell & ROOM_ID) >> 6;
      if (out_id == room['id']) return;
    }
    return {
      'sill_r': sill_r,
      'sill_c': sill_c,
      'dir'   : dir,
      'door_r': door_r,
      'door_c': door_c,
      'out_id': out_id,
    };
}

function alloc_opens(dungeon, room){
    //printObj(room);
    var room_h = ((room['south'] - room['north']) / 2) + 1;
    var room_w = ((room['east'] - room['west']) / 2) + 1;
    var flumph = Math.floor(Math.sqrt(room_w * room_h));
    var rand = getNextRand();
    var n_opens = flumph + rand; //random(flumph); console.log(add this back in);
  
    return n_opens;
}


function label_rooms(dungeon){
    var cell = dungeon['cell'];

    for (var id = 1; id <= dungeon['n_rooms']; id++) {
        var room = dungeon['room'][id];
        var label = room['id'].toString();
        var len = label.length;
        var label_r = Math.floor((room['north'] + room['south']) / 2);
        var label_c = Math.floor((room['west'] + room-['east'] - len) / 2) + 1;

        for (var c = 0; c < len; c++) {
            //var char = label.charAt(c);
            if(!cell[label_r][label_c + c]) cell[label_r][label_c + c] = 0;
            cell[label_r][label_c + c] |= (label.charCodeAt(c) << 24);
        }
    }

    return dungeon;
}

function corridors(dungeon){
    var cell = dungeon['cell'];

    for (var i = 1; i < dungeon['n_i']; i++) {
        var r = (i * 2) + 1;
        
        for (var j = 1; j < dungeon['n_j']; j++) {
            var c = (j * 2) + 1;
            if (cell[r][c] & CORRIDOR) {
                continue;
            }
            dungeon = tunnel(dungeon, i, j);
        }
    }
    
    return dungeon;
}

function tunnel(dungeon, i, j, last_dir){
    var dirs = tunnel_dirs(dungeon, last_dir);
  
    for (var dir in dirs){
        if (open_tunnel(dungeon, i, j, dir)) {
            var next_i = i + di[dir];
            var next_j = j + dj[dir];
      
            dungeon = tunnel(dungeon, next_i, next_j, dir);
          }
    }

    return dungeon;
}

function tunnel_dirs(dungeon, last_dir){
    var p = corridor_layout[dungeon['corridor_layout']];
    var dirs = shuffle(dj_dirs);
  
    if (last_dir && p) {
        if (random(100) < p) unshift(dirs, last_dir);
    }
    return dirs;
}

function open_tunnel(dungeon, i, j, dir){
    var this_r = (i * 2) + 1;
    var this_c = (j * 2) + 1;
    var next_r = ((i + di[dir]) * 2) + 1;
    var next_c = ((j + dj[dir]) * 2) + 1;
    var mid_r = Math.floor((this_r + next_r) / 2);
    var mid_c = Math.floor((this_c + next_c) / 2);
  
    if (sound_tunnel(dungeon, mid_r, mid_c, next_r, next_c)) {
        return delve_tunnel(dungeon, this_r, this_c, next_r, next_c);
    } else {
        return 0;
    }
}

function clean_dungeon(dungeon){
    if (dungeon['remove_deadends']) {
        dungeon = remove_deadends(dungeon);
    }
    
    dungeon = fix_doors(dungeon);
    dungeon = empty_blocks(dungeon);
    
    return dungeon;
}



function remove_deadends(dungeon){
    var p = dungeon['remove_deadends'];
    return collapse_tunnels(dungeon, p, close_end);
}

function fix_doors(dungeon){
    var cell = dungeon['cell'];
    var fixed;
  
    for (var room in Object.values(dungeon['room'])) {
        for (var dir in sortByKey(room['door'])) {
            for(var door in room['door'][dir]){
                var shiny = room['door'][dir][door];
                var door_r = door['row'];
                var door_c = door['col'];
                var door_cell = cell[door_r][door_c];
                if(!(door_cell & OPENSPACE)) continue;
  
                 if (fixed[door_r][door_c]) {
                    shiny.push(door);
                 } else {
                    var out_id = door['out_id']; 
                    if (out_id) {
                        var out_dir = opposite[dir];
                        dungeon['room'][out_id]['door'][out_dir].push(door);
                    }
                    shiny.push(door);
                    fixed[door_r][door_c] = 1;
                }
            }
            
            if (shiny) {
                room['door'][dir] = shiny;
                dungeon['door'].push(shiny);
            } else {
                delete room['door'][dir];
            }
        }
    }
    return dungeon;
}

function empty_blocks(dungeon){
    var cell = dungeon['cell'];
  
    for (var r = 0; r <= dungeon['n_rows']; r++) {
        for (var c = 0; c <= dungeon['n_cols']; c++) {
            if (cell[r][c] & BLOCKED) cell[r][c] = NOTHING;
        }
    }

    return dungeon;
}

function alloc_rooms(dungeon){
    var dungeon_area = dungeon['n_cols'] * dungeon['n_rows'];
    var room_area = dungeon['room_max'] * dungeon['room_max'];
    var n_rooms = Math.floor(dungeon_area / room_area);
  
    return n_rooms;
}

function doorType(){
    //console.log('add back in');
    var i = getNextRand(); //random(110);

    if (i < 15) {
        return ARCH;
    } else if (i < 60) {
        return DOOR;
    } else if (i < 75) {
        return LOCKED;
    } else if (i < 90) {
        return TRAPPED;
    } else if (i < 100) {
        return SECRET;
    } else {
        return PORTC;
    }
}

function collapse_tunnels(dungeon, p, xc){
    if(!p) return dungeon;
    var all = (p == 100);
    var cell = dungeon['cell'];

    for (var i = 0; i < dungeon['n_i']; i++) {
        var r = (i * 2) + 1;
        for (var j = 0; j < dungeon['n_j']; j++) {
            var c = (j * 2) + 1;

            if(!(cell[r][c] & OPENSPACE)) continue;
            if(cell[r][c] & STAIRS) continue;
            if(!(all || (random(100) < p))) continue;

            dungeon = collapse(dungeon, r, c, xc);
        }
    }
    
    return dungeon;
}

function collapse(dungeon, r, c, xc){
    var cell = dungeon['cell'];
  
    if(!(cell[r][c] & OPENSPACE)) {
      return dungeon;
    }
    for (var dir in xc) {
        if (check_tunnel(cell, r, c, xc[dir])) {
            for (var key in xc[dir]['close']) {
                var p = xc[dir]['close'][key];
                cell[r + p[0]][c + p[1]] = NOTHING;
            }
            if (p = xc[dir]['open']) {
                cell[r + p[0]][c + p[1]] |= CORRIDOR;
            }
            if (p = xc[dir]['recurse']) {
                dungeon = collapse(dungeon, (r + p[0]), (c + p[1]), xc);
            }
        }
    }
    return dungeon;
}

function shuffle(list) {
    var a = list.splice();
    var j, x, i;
    for(i = a.length - 1; i > 0; i--){
        j = random(i + 1);
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

function sound_tunnel(dungeon, mid_r, mid_c, next_r, next_c){
    if (next_r < 0 || next_r > dungeon['n_rows']) return 0;
    if (next_c < 0 || next_c > dungeon['n_cols']) return 0;
    var cell = dungeon['cell'];

    var sort = sortTwoValues(mid_r, next_r);
    var r1 = sort[0];
    var r2 = sort[1];
    
    sort = sortTwoValues(mid_c, next_c);
    var c1 = sort[0];
    var c2 = sort[1];

    for (var r = r1; r <= r2; r++) {
        for (var c = c1; c <= c2; c++) {
            if (cell[r][c] & BLOCK_CORR) return 0;
        }
    }
    
    return 1;
}

function delve_tunnel(dungeon, this_r, this_c, next_r, next_c){
    var cell = dungeon['cell'];

    var sort = sortTwoValues(this_r, next_r);
    var r1 = sort[0];
    var r2 = sort[1];

    sort = sortTwoValues(this_c, next_c);
    var c1 = sort[0];
    var c2 = sort[1];
  
    for (var r = r1; r <= r2; r++) {
        for (var c = c1; c <= c2; c++) {
            cell[r][c] &= ~ENTRANCE;
            cell[r][c] |= CORRIDOR;
        }
    }
    return 1;
}

function check_tunnel(cell, r, c, check){
    var list;
  
    if (list = check['corridor']) {
        for (var key in list) {
            var p = list[key];
            if(!(cell[r + p[0]][c + p[1]] == CORRIDOR)) return 0;
        }
    }
    if (list = check['walled']) {
        for (var key in list) {
            var p = list[key];
            if (cell[r + p[0]][c + p[1]] & OPENSPACE) return 0;
        }
    }
    return 1;
}

function displayDungeon(dungeon){
    image = scale_dungeon(dungeon);
    var canvas = document.createElement("canvas");
    canvas.width = image['width'];
    canvas.height = image['height'];
    var ctx = canvas.getContext("2d");

    paintDungeon(image, ctx, dungeon);

    var body = document.getElementById("body");
    if(img) body.removeChild(img);
    //while(body.firstChild) body.removeChild(body.firstChild);

    img = document.createElement('img');
    img.src = canvas.toDataURL("image/png"); //'https://media.geeksforgeeks.org/wp-content/uploads/20190529122828/bs21.png';
    body.appendChild(img);
}

function paintDungeon(image, g, dungeon){
    //# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //# new image
   //canvas.width = image['width'];
    //canvas.height = image['height'];
    var pal = get_palette(image);
    image['palette'] = pal;
    var base = base_layer(dungeon, image, g);
    image['base_layer'] = base;

    g = fill_image(dungeon, image, g);
    g = open_cells(dungeon, image, g);
    g = image_walls(dungeon, image, g);
    //$ih = &image_doors($dungeon,$image,$ih);
    //$ih = &image_labels($dungeon,$image,$ih);

    if (dungeon['stair']) {
        //TODO $ih = &image_stairs($dungeon,$image,$ih);
    }

    //# - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    //# write image

    //open(OUTPUT,">$dungeon->{'seed'}.gif") and do {
    //    print OUTPUT $ih->gif();
    //    close(OUTPUT);
    //};

  return; //"$dungeon->{'seed'}.gif";
}

function open_cells(dungeon, image, g) {
    var cell = dungeon['cell'];
    var dim = image['cell_size'];
    var base = image['base_layer'];
  
    for (var r = 0; r <= dungeon['n_rows']; r++) {
        var y1 = r * dim;
        var y2 = y1 + dim;
  
        for (var c = 0; c <= dungeon['n_cols']; c++) {
            if(!(cell[r][c] & OPENSPACE)) continue;
  
            var x1 = c * dim;
            var x2 = x1 + dim;
  
            //filledRectangle(g, x1, y1, dim+1, dim+1, image['palette']['white']); //$ih->copy($base,$x1,$y1,$x1,$y1,($dim+1),($dim+1));
            g.drawImage(base, x1, y1, dim + 1, dim + 1, x1, y1, dim + 1, dim + 1);
        }
    }
    return g;
  }

function image_walls(dungeon, image, g) {
    var cell = dungeon['cell'];
    var dim = image['cell_size'];
    var pal = image['palette'];
    var color;
  
    for (var r = 0; r <= dungeon['n_rows']; r++) {
        var y1 = r * dim;
        var y2 = y1 + dim;
  
        for (var c = 0; c <= dungeon['n_cols']; c++) {
            if(!(cell[r][c] & OPENSPACE)) continue;
            var x1 = c * dim;
            var x2 = x1 + dim;
            var c1 = cell[r][c];
  
            if (color = pal['wall']) {
                if(!(cell[r-1][c-1] & OPENSPACE)) {
                    setPixel(g, x1, y1, color);
                }
                if(!(cell[r-1][c] & OPENSPACE)) {
                    line(g, x1, y1, x2, y1, color);
                }
                if(!(cell[r][c-1] & OPENSPACE)) {
                    line(g, x1, y1, x1, y2, color);
                }
                if(!(cell[r][c+1] & OPENSPACE)) {
                    line(g, x2, y1, x2, y2, color);
                }
                if(!(cell[r+1][c] & OPENSPACE)) {
                    line(g, x1, y2, x2, y2, color);
                }
            }
        }
    }

    return g;
  }

function fill_image(dungeon, image, g){
    var max_x = image['max_x'];
    var max_y = image['max_y'];
    var dim = image['cell_size'];
    var pal = image['palette'];
    var color, tile;

    /*if (tile = pal['fill_pattern']) {
        color = pal['white']; //$ih->setTile($tile);
        filledRectangle(g, 0, 0, max_x, max_y, color); //$ih->filledRectangle(0,0,$max_x,$max_y,gdTiled);
    } else if (tile = pal['fill_tile']) {
        for (var r = 0; r <= dungeon['n_rows']; r++) {
            for (var c = 0; c <= dungeon['n_cols']; c++) {
                //$ih->copy($tile,($c * $dim),($r * $dim),&select_tile($tile,$dim));
            }
        }
    } else if (color = pal['fill']) {
        filledRectangle(g, 0, 0, max_x, max_y, color); //$ih->filledRectangle(0,0,$max_x,$max_y,$color);
    } else if (tile = pal['background']) {
        color = pal['white']; //$ih->setTile($tile);
        filledRectangle(g, 0, 0, max_x, max_y, color); //$ih->filledRectangle(0,0,$max_x,$max_y,gdTiled);
    } else {*/
        filledRectangle(g, 0, 0, max_x, max_y, pal['black']); //$ih->filledRectangle(0,0,$max_x,$max_y,$pal->{'black'});
        fill(g, 0, 0, pal['black']); //$ih->fill(0,0,$pal->{'black'});
    //}
   // if (color = pal['fill']) {
    //    rectangle(g, 0, 0, max_x, max_y, color); //$ih->rectangle(0,0,$max_x,$max_y,$color);
    //}
    if (color = pal['fill_grid']) {
        //$ih = &image_grid($dungeon,$image,$color,$ih);
    } else if (color = pal['grid']) {
        //$ih = &image_grid($dungeon,$image,$color,$ih);
    }
    return g;
}

function base_layer(dungeon, image, g){
    var max_x = image['max_x'];
    var max_y = image['max_y'];
    var dim = image['cell_size'];
    var pal = image['palette'];
    var color, tile;

    var canvas = document.createElement("canvas");
    canvas.width = image['width'];
    canvas.height = image['height'];
    var ctx = canvas.getContext("2d");
  
   /* if (tile = pal['open_pattern']) {
        $ih->setTile($tile);
        $ih->filledRectangle(0,0,$max_x,$max_y,gdTiled);
    } else if (tile = pal['open_tile']) {
        for (var r = 0; r <= dungeon['n_rows']; r++) {
            for (var c = 0; c <= dungeon['n_cols']; c++) {
                $ih->copy($tile,($c * $dim),($r * $dim),&select_tile($tile,$dim));
            }
        }
    } else if (color = pal['open']) {
        filledRectangle(g, 0, 0, max_x, max_y, color); //$ih->filledRectangle(0,0,$max_x,$max_y,$color);
    }*/ /*else if (tile = pal['background']) {
        $ih->setTile($tile);
        $ih->filledRectangle(0,0,$max_x,$max_y,gdTiled);
    } else {*/
        filledRectangle(ctx, 0, 0, max_x, max_y, pal['white']); //$ih->filledRectangle(0,0,$max_x,$max_y,$pal->{'white'});
        fill(ctx, 0, 0, pal['white']); //$ih->fill(0,0,$pal->{'white'});
    //}
    if (color = pal['open_grid']) {
        //TODO $ih = &image_grid($dungeon,$image,$color,$ih);
    } else if (color = pal['grid']) {
        //TODO $ih = &image_grid($dungeon,$image,$color,$ih);
    }
    //var base = $ih->clone();
  
    if (tile = pal['background']) {
        //$ih->setTile($tile);
        //$ih->filledRectangle(0,0,$max_x,$max_y,gdTiled);
    } else {
        filledRectangle(ctx, 0, 0, max_x, max_y, pal['white']); //ihh->filledRectangle(0,0,$max_x,$max_y,$pal->{'white'});
    }

    return canvas;//base;
}

function line(g, x1, y1, x2, y2, color){
    g.strokeStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.stroke();
}

function setPixel(g, x, y, color){
    g.fillStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
    g.fillRect(x, y, 1, 1);
}

function rectangle(g, x1, y1, x2, y2, color){
    var w = x2 - x1;
    var h = y2 - y1;
    g.strokeStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
    g.rect(x1, y1, w, h);
    g.stroke();
}

function filledRectangle(g, x1, y1, x2, y2, color){
    var w = x2 - x1;
    var h = y2 - y1;
    g.fillStyle = "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
    g.fillRect(x1, y1, w, h);
}

function fill(g, x, y, color){
    //TODO
}

function get_palette(image){
    var pal; 
    if (map_style[image['map_style']]) {
        pal = map_style[image['map_style']];
    } else {
        pal = map_style['Standard'];
    }
    
    //unless (defined $pal->{'black'}) {
        pal['black'] = [0, 0, 0];
    //}
    //unless (defined $pal->{'white'}) {
      pal['white'] = [255, 255, 255];
    //}
    return pal;
}

function scale_dungeon(dungeon){
    var image = {
        'cell_size': dungeon['cell_size'],
        'map_style': dungeon['map_style']
    };
    image['width']  = ((dungeon['n_cols'] + 1) * image['cell_size']) + 1;
    image['height'] = ((dungeon['n_rows'] + 1) * image['cell_size']) + 1;
    image['max_x']  = image['width'] - 1;
    image['max_y']  = image['height'] - 1;

    if (image['cell_size'] > 16) {
        //image['font'] = gdLargeFont;
    } else if (image['cell_size'] > 12) {
        //image['font'] = gdSmallFont;
    } else {
        //image['font'] = gdTinyFont;
    }
    //image['char_w'] = image['font'].width;
    //image->{'char_h'} = $image->{'font'}->height;
    //image->{'char_x'} = int(($image->{'cell_size'} - $image->{'char_w'}) / 2) + 1;
    //image->{'char_y'} = int(($image->{'cell_size'} - $image->{'char_h'}) / 2) + 1;

    return image;
}

/*
===========Util Functions==============
*/
function random(max){
    return randomMinMax(0, max);
}

function randomMinMax(min, max){
    return Math.floor(Math.random() * (max - min)) + min;
}

/*
===========Perl Functions==============
*/
function splice(array, offset, length){
    array.splice(offset, length);
    return array;
}

function join(str, list){
    return list.join(str);
}

function sortById(list){
    return list.slice().sort((a, b) => (a['id'] > b['id']));
}

function sortKeys(dict){
    if(!dict) return dict;
    var ordered = [];
    Object.keys(dict).sort().forEach(function(key){
        ordered.push(key);
    });
    return ordered;
}

function sortByKey(list){
    if(!list) return list;
    var ordered = {};
    var sortedKeys = sortKeys(list);
    for (var key in sortedKeys){
        ordered[key] = list[key];
    }
    return ordered;
}

function sort(list){
    return list.slice().sort();
}

function sortTwoValues(a, b){
    if(a < b) return [a, b];
    else return [b, a];
}

function unshift(array, list){
    array.unshift(list);
    return array.length;
}

//Indicated by '..' operator in perl
function range(start, stop){
    var list = [];
    for(var i = start; i <= stop; i++){
        list.push(i);
    }
    return list;
}