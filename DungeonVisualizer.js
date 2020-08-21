function GetDungeonRenderer(){
    var baseColor = [0, 0, 0];
    var cellColor = [255, 255, 255];
    var startColor = [0, 255, 0];
    var corridorColor = [175, 175, 175];

    var rooms = [];
    var corridors = [];

    //Does not return, but will throw error is not valid.
    var isValidRect = function(rect){
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

    var getBounds = function(){
        var left = Number.MAX_VALUE;
        var right = Number.MIN_VALUE;
        var top = Number.MAX_VALUE;
        var bottom = Number.MIN_VALUE;
        
        var rects = rooms.concat(corridors);
        for(var i in rects){
            var rect = rects[i];
            var R = rect.X + rect.Width;
            var B = rect.Y + rect.Height;
    
            if(rect.X < left) left = rect.X;
            if(rect.Y < top) top = rect.Y;
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

    return {
        renderRoom: function(rect){
            isValidRect(rect);
            rooms.push(rect);
        },

        renderCorridor: function(rect){
            isValidRect(rect);
            corridors.push(rect);
        },

        render: function(cellSize, borderPadding){
            var bounds = getBounds();
            var width = (bounds.Width + borderPadding*2 + 2) * cellSize;
            var height = (bounds.Height + borderPadding*2 + 2) * cellSize;
            var offset = {
                'X': (borderPadding + 1 - bounds.Left) * cellSize,
                'Y': (borderPadding + 1 - bounds.Top) * cellSize
            };
            var canvas = HTML.generateCanvas(width, height);
            var g = HTML.getGraphics(canvas);
            g.fillRect(0, 0, width, height, baseColor);
            for(var i in rooms){
                var room = rooms[i];
                var color = cellColor;
                if(room['IsStart']) color = startColor;
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
                var color = corridorColor;
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
    };
}
