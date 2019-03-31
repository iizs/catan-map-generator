var catanApp = angular.module('catanApp', []);

const TILE_MOUNTAIN = "mountain";
const TILE_PASTURE = "pasture";
const TILE_FOREST = "forest";
const TILE_HILL = "hill";
const TILE_FIELD = "field";
const TILE_SEA = "sea";
const TILE_DESSERT = "dessert";
const TILE_GOLD = "gold";
const TILE_UNKNOWN = "unknown";

const PREF_RESOURCE_ADJACENCY = "resourceAdjacency";

class Tile {
    constructor(x, y, z, type) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.q = x;
        this.r = y;
        this.type = type;
    }
}

class NameValuePair {
    constructor(n, v) {
        this.value = v;
        this.name = n;
    }
}

var boardTypes = [
    new NameValuePair("Original (3-4 players)", "Original34"),
    new NameValuePair("Original (5-6 players)", "Original56"),
];

var resourceAdjacencyOptions = [
    new NameValuePair("None", "0"),     // no same resources can be adjanent
    new NameValuePair("Normal", "1"),   // max. 1 same resources can be adjanent
    new NameValuePair("Random", "6"),   // max. 6 == no restrictions on resource adjacency
];

class MapBuilder {
    constructor(pref) {
        this.tiles = [];
        this.preferences = pref;
    }

    clear() {
        while ( this.tiles.length > 0) { this.tiles.pop(); }
    }

    build() {
        return { "size" : 3,
            "boardType" : this.boardType,
            "tiles" : this.tiles,
            "random": Math.random(),
            "preferences" : this.preferences,
        };
    }

    static getTile(tiles, q, r) {
        return tiles.find(function(tile){
            return (tile.q == q && tile.r == r);
        });
    }

    static getInstance(boardType, pref) {
        //console.log(boardType);
        return eval("new " + boardType + "MapBuilder(pref);");
    }

    static hex_distance(aq, ar, bq, br) {
        return (Math.abs(aq-bq) + Math.abs(aq+ar-bq-br) + Math.abs(ar-br))/2;
    }
}

class Original34MapBuilder extends MapBuilder {
    constructor(pref) {
        super(pref);
    };

    isValidPlacement(tiles) {
        var preferences = this.preferences; // without this, this.preferences is invisible from tiles.every()
        var adjacentTiles = [ [0, -1], [1, -1], [1, 0], [0, 1], [-1, 1], [-1, 0] ];
        return tiles.every(function(tile) {
            // TILE_UNKNOWN does not affect resource adjacency
            if ( tile.type == TILE_UNKNOWN || tile.type == TILE_SEA ) {
                return true;
            }

            var cnt = 0;
            for ( var i=0; i<adjacentTiles.length; ++i ) {
                var adjacentTile = MapBuilder.getTile( tiles, 
                                                        tile.q + adjacentTiles[i][0], 
                                                        tile.r + adjacentTiles[i][1] );
                // no tile at this coord.
                if ( adjacentTile == null ) { 
                    continue;
                }

                if ( adjacentTile.type == tile.type ) {
                    ++cnt;
                }
            }

            if ( cnt > preferences[ PREF_RESOURCE_ADJACENCY ] ) {
                return false;
            }

            return true;
        });
    }

    tryPlacement(tiles, availableTiles) {
        if ( ! this.isValidPlacement(tiles) ) {
            // wrong placement
            return [];
        }

        if ( Object.values(availableTiles).every(function(val){ return val==0; }) ) {
            // All tiles placed correctly
            return tiles;
        }

        // try to place one more tile
        var tileTypes = Object.keys(availableTiles).sort(function() { return 0.5-Math.random();});
        var newTiles = [];
        var newAvailableTiles = {};
        for ( var i=0; i < tileTypes.length; ++i ) {
            if ( availableTiles[ tileTypes[i] ] == 0 ) {
                // no more tiles of this type left
                continue;
            }

            angular.copy(availableTiles, newAvailableTiles);    // deep copy of availableTiles
            angular.copy(tiles, newTiles);  // deep copy of tiles

            var nextTile = newTiles.find(function(tile){ return tile.type == TILE_UNKNOWN; } );
            nextTile.type = tileTypes[i];
            newAvailableTiles[ tileTypes[i] ] = availableTiles[ tileTypes[i] ] - 1;

            newTiles = this.tryPlacement(newTiles, newAvailableTiles);
            if ( newTiles.length != 0 ) {
                break;
            }
        }

        return newTiles;
    }

    build() {
        // make tile base arrangement as all unknown
        this.clear();
        for ( var q=-2; q<3; ++q ) {
            for ( var r=-2; r<3; ++r ) {
                if ( MapBuilder.hex_distance(0, 0, q, r) > 2 ) continue;
                this.tiles.push( new Tile(q, r, -q -r, TILE_UNKNOWN) );
            }
        }

        var availableTiles = {};
        availableTiles[ TILE_MOUNTAIN ] =  3;
        availableTiles[ TILE_HILL ] =  3;
        availableTiles[ TILE_FOREST ] =  4;
        availableTiles[ TILE_PASTURE ] =  4;
        availableTiles[ TILE_FIELD ] =  4;
        availableTiles[ TILE_DESSERT ] =  1;

        this.tiles = this.tryPlacement(this.tiles, availableTiles);
        return super.build();
    }
}
class Original56MapBuilder extends MapBuilder {
    //constructor(pref) {};
}

catanApp.service('MapGenerator', function () {
    this.initialize = function() {
        this.boardType = boardTypes[0].value;
        this.preferences = new Object();
        this.preferences[PREF_RESOURCE_ADJACENCY] = resourceAdjacencyOptions[1].value;   // defaults to 1
        return this;
    }

    this.setBoardType = function(boardType) {
        this.boardType = boardType;
        return this;
    }

    this.setPreferences = function(v) {
        this.preferences = v;
        return this;
    }

    this.generate = function () {
        return MapBuilder.getInstance(this.boardType, this.preferences).build();
    };
});

catanApp.controller('MainCtrl', ['$scope', 'MapGenerator', function ($scope, MapGen) {
    $scope.title = "Catan Map Generator";
    $scope.boardTypes = boardTypes;
    $scope.boardType = boardTypes[0].value;
    $scope.resourceAdjacencyOptions = resourceAdjacencyOptions;
    $scope.preferences = new Object();
    $scope.preferences[PREF_RESOURCE_ADJACENCY] = resourceAdjacencyOptions[1].value;   // defaults to 1

    $scope.map = MapGen.initialize()
                        .setPreferences($scope.preferences)
                        .generate();
    $scope.enableDebug = true;

    $scope.regenerate = function () {
        $scope.map = MapGen
                        .setBoardType($scope.boardType)
                        .setPreferences($scope.preferences)
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
