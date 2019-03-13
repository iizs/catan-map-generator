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
    new BoardType("org34", "Original (3-4 players)"),
    new BoardType("org56", "Original (5-6 players)"),
];


catanApp.service('MapGenerator', function () {
    this.initialize = function (boardType) {
        return { "size" : 3,
            "boardType" : boardType,
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
    };
});

catanApp.controller('MainCtrl', ['$scope', 'MapGenerator', function ($scope, MapGen) {
    $scope.title = "Catan Map Generator";
    $scope.boardTypes = boardTypes;
    $scope.boardType = boardTypes[0].value;
    $scope.map = MapGen.initialize($scope.boardType);

    $scope.regenerate = function () {
        $scope.map = MapGen.initialize($scope.boardType);
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
                '<polygon points="100,0 50,-87 -50,-87 -100,-0 -50,87 50,87" class="{{tile.type}}"></polygon>' + 
                '</g>',
    link: function (scope, element, attrs) {
    }
  };
});
