var up = document.getElementById('GFG_UP');
up.innerHTML = "Click on the button to add image element";
var down = document.getElementById('GFG_DOWN');

function GFG_Fun() {
    var img = document.createElement('img');
    img.src = 'https://media.geeksforgeeks.org/wp-content/uploads/20190529122828/bs21.png';
    document.getElementById('body').appendChild(img);
    down.innerHTML = "Image Element added.";
}