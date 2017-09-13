function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

// Used to detect whether the users browser is an mobile browser
function isMobile() {
    ///<summary>Detecting whether the browser is a mobile browser or desktop browser</summary>
    ///<returns>A boolean value indicating whether the browser is a mobile browser or not</returns>

    if (sessionStorage.desktop) // desktop storage
        return false;
    else if (localStorage.mobile) // mobile storage
        return true;

    // alternative
    var mobile = ['iphone', 'ipad', 'android', 'blackberry', 'nokia', 'opera mini', 'windows mobile', 'windows phone', 'iemobile'];
    for (var i in mobile) if (navigator.userAgent.toLowerCase().indexOf(mobile[i].toLowerCase()) > 0) return true;

    // nothing found.. assume desktop
    return false;
}

function getFullscreenDimension() {
    var dimension = [];

    if (isMobile()) {
        dimension.push(window.screen.width * window.devicePixelRatio / 2);
        dimension.push(window.screen.height * window.devicePixelRatio / 2);
    } else {
        dimension.push(window.innerWidth * window.devicePixelRatio);
        dimension.push(window.innerHeight * window.devicePixelRatio);
    }

    return dimension;
}

function startApp() {
    var dimension = getFullscreenDimension();
    var app = new PIXI.Application(dimension[0], dimension[1], {backgroundColor: 0x1099bb});
    var canvas = app.view;

    document.body.appendChild(app.view);
    var tileset = PIXI.Texture.fromImage("res/cave.png");

    var tile = [];
    tile.push(new PIXI.Texture(tileset, new PIXI.Rectangle(0, 0, 32, 32)));
    tile.push(new PIXI.Texture(tileset, new PIXI.Rectangle(32, 0, 32, 32)));
    tile.push(new PIXI.Texture(tileset, new PIXI.Rectangle(64, 0, 32, 32)));
    tile.push(new PIXI.Texture(tileset, new PIXI.Rectangle(32, 32, 32, 32)));

    var mapWidth = 250;
    var mapHeight = 50;

    var matrix = new Array(mapWidth);

    for (var i = 0; i < mapWidth; i++) {
        matrix[i] = new Array(mapHeight);
        for (var j = 0; j < mapHeight; j++) {
            matrix[i][j] = new Array(4);
            for (var z = 0; z < 4; z++) {

                var spriteTile = null;

                if (i * 32 < dimension[0] && j * 32 < dimension[1]) {
                    spriteTile = new PIXI.Sprite(tile[z]);
                } else {
                    spriteTile = new PIXI.Sprite(tile[3 - z]);
                }

                spriteTile.x = i * 32;
                spriteTile.y = j * 32;
                spriteTile.zIndex = 5+z;

                matrix[i][j][z] = spriteTile;
            }
        }
    }

    // Cursor Tiles
    var cursorTexture = new PIXI.Texture(tileset, new PIXI.Rectangle(0,4*32,3*32,5*32));
    var cursorSprite = new PIXI.Sprite(cursorTexture);
    cursorSprite.alpha = 0.5;
    cursorSprite.zIndex = 11;

    var dim = [];
    dim.push(Math.ceil(dimension[0] / 32));
    dim.push(Math.ceil(dimension[1] / 32));

    hanldeScreenBuild(app.stage, matrix, dim);

    app.stage.addChild(cursorSprite);

    var graphics = new PIXI.Graphics();
    // set a fill and line style
    graphics.beginFill(0xFF0000);
    graphics.lineStyle(0, 0xff0000, 0);
    graphics.fillAlpha = 0.75;
    graphics.lineAlpha = 0.75;
    graphics.drawRect(0, 0, 32, 32);
    graphics.zIndex = 10;

    app.stage.addChild(graphics);
    app.stage.interactive = true;
    app.stage.hitArea = new PIXI.Rectangle( 0, 0, dimension[0], dimension[1]);

    var mouseX = 0;
    var mouseY = 0;

    /* call this function whenever you added a new layer/container */
    app.stage.updateLayersOrder = function () {
        app.stage.children.sort(function(a,b) {
            a.zIndex = a.zIndex || 0;
            b.zIndex = b.zIndex || 0;
            return a.zIndex - b.zIndex
        });
    };

    //app.stage.updateLayersOrder();
    /*
        These are the different choice on can have to bind a mouse / touch listener

        .on('mousedown', onDragStart)
        .on('touchstart', onDragStart)
        .on('mouseup', onDragEnd)
        .on('mouseupoutside', onDragEnd)
        .on('touchend', onDragEnd)
        .on('touchendoutside', onDragEnd)
        .on('mousemove', onDragMove)
        .on('touchmove', onDragMove);
     */

    app.stage.mousemove = function (event) {
        mouseX = Math.floor(event.data.global.x / 32) * 32;
        mouseY = Math.floor(event.data.global.y / 32) * 32;
        cursorSprite.x = mouseX;
        cursorSprite.y = mouseY;
    };

    app.stage.click = app.stage.mousemove;
    app.stage.tap = app.stage.click;
    app.stage.touchmove = app.stage.mousemove;

    // Listen for animate update
    var position = [];
    position.push(0);
    position.push(0);

    var left = keyboard(37),
        up = keyboard(38),
        right = keyboard(39),
        down = keyboard(40);


    app.stage.updateLayersOrder();

    app.ticker.add(function (delta) {
        graphics.clear();
        //graphics.drawRect(getRandomInt(0, dimension[0]), getRandomInt(0, dimension[1]), 32, 32);
        graphics.drawRect(mouseX,mouseY, 96, 160);
        //moveRight(app.stage, matrix, dim, position);

        right.press = function() {
            moveRight(app.stage, matrix, dim, position,32);
        };

        left.press = function() {
            moveLeft(app.stage,matrix,dim,position,32);
        }

    });

    window.onresize = function () {
        app.renderer.resize(window.innerWidth, window.innerHeight);
    }
}

window.onload = function () {
    startApp();
};

function hanldeScreenBuild(stage, matrix, dimension) {

    // Remove all children first
    while (stage.children[0]) {
        stage.removeChild(stage.children[0]);
    }

    var maxX = Math.min(matrix.length,dimension[0]);
    var maxY = Math.min(matrix[1].length,dimension[1]);

    for (var i = 0; i < maxX; i++) {
        for (var j = 0; j < maxY; j++) {

            for (var z = 0; z < 4; z++) {
                var sprite = matrix[i][j][z];
                stage.addChild(sprite);
            }
        }
    }
}


function moveRight(stage, matrix, dimension, position,cellSize) {
    moveH(stage,matrix,dimension,position,1,cellSize);
}

function moveLeft(stage, matrix, dimension,position,cellSize) {
    moveH(stage,matrix,dimension,position,-1,cellSize)
}

function moveTop(stage, matrix, dimension,position,cellSize) {
    moveV(stage,matrix,dimension,position,-1,cellSize);
}

function moveBottom(stage, matrix, dimension,position,cellSize) {
    moveV(stage,matrix,dimension,position,1,cellSize)
}

/**
 *
 * @param stage
 * @param matrix
 * @param dimension
 * @param position
 * @param xAdd
 * @param cellSize
 */
function moveH(stage, matrix, dimension, position,xAdd,cellSize) {
    var x, y, z;
    var sprite;

    var posXWithAdd = position[0] + dimension[0] + xAdd;

    if ( position[0] + xAdd < 0 || matrix.length <=  posXWithAdd )
        return;

    var tile0 = xAdd > 0 ? matrix[position[0]] : matrix[position[0]-1]; // First row on the left
    var tile1 = matrix[Math.ceil(position[0] + dimension[0])]; // First row on the right

    removeVerticalRowsOutofView(stage,position,dimension,xAdd > 0 ? tile0 : tile1);

    for (x = position[0]; x < position[0] + dimension[0]; x++) {
        for (y = position[1]; y < position[1] + dimension[1]; y++) {
            for (z = 0; z < 4; z++) {
                sprite = matrix[x][y][z];
                sprite.x -= xAdd * cellSize;
            }
        }
    }

    for (y = position[1]; y < position[1] + dimension[1]; y++) {
        for (z = 0; z < 4; z++) {
            sprite = xAdd > 0 ? tile1[y][z] : tile0[y][z];
            sprite.x = xAdd > 0 ? Math.floor(dimension[0] - 1) * cellSize : 0;
            stage.addChild(sprite);
        }
    }

    stage.updateLayersOrder();

    position[0] += xAdd;
}

/**
 *
 * @param stage
 * @param matrix
 * @param dimension
 * @param position
 * @param yAdd
 * @param cellSize
 */
function moveV(stage, matrix, dimension, position,yAdd,cellSize) {
    var x, y, z;
    var sprite;

    var posYWithAdd = position[1] + dimension[1] + yAdd;

    if (position[1] + yAdd < 0 || matrix[0].length <= posYWithAdd)
        return;

    var tile0 = yAdd > 0 ? matrix[position[0]][position[1]] : matrix[position[1]-1]; // First row on the top
    var tile1 = matrix[position[0]][Math.ceil(position[1] + dimension[1])]; // First row on the bottom

    removeHorizontalRowsOutofView(stage,position,dimension,yAdd > 0 ? tile0 : tile1);

    for (x = position[1]; x < position[0] + dimension[0]; x++) {
        for (y = position[1]; y < position[1] + dimension[1]; y++) {
            for (z = 0; z < 4; z++) {
                sprite = matrix[x][y][z];
                sprite.y -= yAdd * cellSize;
            }
        }
    }

    for (x = position[0]; x < position[0] + dimension[0]; y++) {
        for (z = 0; z < 4; z++) {
            sprite = yAdd > 0 ? tile1[y][z] : tile0[y][z];
            sprite.y = yAdd > 0 ? Math.floor(dimension[1] - 1) * cellSize : 0;
            stage.addChild(sprite);
        }
    }

    stage.updateLayersOrder();

    position[1] += yAdd;
}

/**
 *
 * @param stage
 * @param position
 * @param dimension
 * @param yLayer
 */
function removeVerticalRowsOutofView(stage,position,dimension,yLayer) {
    var  y, z;
    var zLayer;
    for (y = position[1]; y < position[1] + dimension[1]; y++) {
        zLayer = yLayer[y];
        for (z = 0; z < 4; z++) {
            stage.removeChild(zLayer[z]);
        }
    }
}

/**
 *
 * @param stage
 * @param position
 * @param dimension
 * @param tile
 */
function removeHorizontalRowsOutofView(stage,position,dimension,tile) {
    var  y, z;
    for (y = position[1]; y < position[1] + dimension[1]; y++) {
        for (z = 0; z < 4; z++) {
            stage.removeChild(tile[y][z]);
        }
    }
}