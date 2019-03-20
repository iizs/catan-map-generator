var catanApp = angular.module('catanApp', []);

const TILE_MOUNTAIN = "mountain";
const TILE_PASTURE = "pasture";
const TILE_FOREST = "forest";
const TILE_HILL = "hill";
const TILE_FIELD = "field";
const TILE_SEA = "sea";
const TILE_DESSERT = "dessert";
const TILE_GOLD = "gold";

class Tile {
    constructor(x, y, z, type) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.type = type;
    }
}

class BoardType {
    constructor(v, n) {
        this.value = v;
        this.name = n;
    }
}

var boardTypes = [
    new BoardType("Original34", "Original (3-4 players)"),
    new BoardType("Original56", "Original (5-6 players)"),
];

class MapBuilder {
    constructor() {};
    build() {
        return { "size" : 3,
            "boardType" : this.boardType,
            "tiles" : [
                new Tile( 0, 0, 0, TILE_FOREST),
                new Tile( 0, 1, -1, TILE_DESSERT),
                new Tile( 1, 0, -1, TILE_HILL),
                new Tile( 1, -1, 0, TILE_MOUNTAIN),
                new Tile( 0, -1, 1, TILE_FIELD),
                new Tile( -1, 0, 1, TILE_PASTURE),
                new Tile( -1, 1, 0, TILE_GOLD),
                new Tile( 0, 2, -2, TILE_SEA),
                new Tile( 0, -2, 2, TILE_SEA),
                new Tile( 2, 0, -2, TILE_SEA),
                new Tile( 2, -2, 0, TILE_SEA),
                new Tile( 2, -1, -1, TILE_SEA),
                new Tile( 1, 1, -2, TILE_SEA),
                new Tile( 1, -2, 1, TILE_SEA),
                new Tile( -1, 2, -1, TILE_SEA),
                new Tile( -1, -1, 2, TILE_SEA),
                new Tile( -2, 2, 0, TILE_SEA),
                new Tile( -2, 0, 2, TILE_SEA),
                new Tile( -2, 1, 1, TILE_SEA),
            ],
            "random": Math.random()
        };
    }

    static getInstance(boardType) {
        //return new Original34MapBuilder();
        //return new window[boardType + "MapBuilder"]();
        console.log(boardType);
        console.log("new " + boardType + "MapBuilder();");
        return eval("new " + boardType + "MapBuilder();");
        //return new MapBuilder();
        //return eval("new MapBuilder();");
    }
}

class Original34MapBuilder extends MapBuilder {
    //constructor() {};
}
class Original56MapBuilder extends MapBuilder {
    //constructor() {};
}


catanApp.service('MapGenerator', function () {
    this.initialize = function() {
        this.boardType = boardTypes[0].value;
        return this;
    }

    this.setBoardType = function(boardType) {
        this.boardType = boardType;
        return this;
    }

    this.generate = function () {
        return MapBuilder.getInstance(this.boardType).build();
    };
});

catanApp.controller('MainCtrl', ['$scope', 'MapGenerator', function ($scope, MapGen) {
    $scope.title = "Catan Map Generator";
    $scope.boardTypes = boardTypes;
    $scope.boardType = boardTypes[0].value;
    $scope.map = MapGen.initialize().generate();
    $scope.enableDebug = true;

    $scope.regenerate = function () {
        $scope.map = MapGen
                        .setBoardType($scope.boardType)
                        .generate();
    };
}]);

catanApp.directive('catanTile', function () {
  return {
    restrict: 'E',
    replace: true,
    scope: {
        tile: '=tile',
    },
    template: '<g transform="translate({{tile.x * 150}}, {{tile.y * -87 + tile.z * 87}})">'+
                '<polygon points="100,0 50,-87 -50,-87 -100,-0 -50,87 50,87" class="tile {{tile.type}}"></polygon>' + 
                '</g>',
    link: function (scope, element, attrs) {
    }
  };
});
