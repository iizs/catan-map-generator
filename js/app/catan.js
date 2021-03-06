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

const HARBOR_ANY = "any";
const HARBOR_GRAIN = "grain";
const HARBOR_WOOL = "wool";
const HARBOR_LUMBER = "lumber";
const HARBOR_ORE = "ore";
const HARBOR_BRICK = "brick";

const PREF_RESOURCE_ADJACENCY = "resourceAdjacency";
//       ( 0,-1 )   ( 1, -1 ) 
//  (-1, 0 )  ( q, r )  ( 1, 0 )
//       ( -1, 1 )   ( 0, 1 ) 
const HEX_DIRECTIONS = [ [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1], [1, 0] ];

class Tile {
    constructor(x, y, z, type) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.q = x;
        this.r = z;
        this.type = type;
    }
}

class Harbor {
    constructor(tile, direction, type) {
        this.tile = tile;
        this.direction = direction;
        for (var i=0; i<HEX_DIRECTIONS.length; ++i) {
            if ( direction == HEX_DIRECTIONS[i] ) {
                this.rotation = i * 60;
            }
        }
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
        this.harbors = [];
        this.preferences = pref;
        this.backgroundScale = 5.5;
    }

    clear() {
        while ( this.tiles.length > 0) { this.tiles.pop(); }
    }

    build() {
        return { "size" : 3,
            "boardType" : this.boardType,
            "backgroundScale": this.backgroundScale,    // this makes board edge 
            "tiles" : this.tiles,
            "harbors" : this.harbors,
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
        return tiles.every(function(tile) {
            // TILE_UNKNOWN does not affect resource adjacency
            if ( tile.type == TILE_UNKNOWN || tile.type == TILE_SEA ) {
                return true;
            }

            var cnt = 0;
            for ( var i=0; i<HEX_DIRECTIONS.length; ++i ) {
                var adjacentTile = MapBuilder.getTile( tiles, 
                                                        tile.q + HEX_DIRECTIONS[i][0], 
                                                        tile.r + HEX_DIRECTIONS[i][1] );
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

    getHarborLocations() {
        return [
            { tile: MapBuilder.getTile( this.tiles, 0, -2 ), direction: HEX_DIRECTIONS[3] },
            { tile: MapBuilder.getTile( this.tiles, 1, -2 ), direction: HEX_DIRECTIONS[4] },
            { tile: MapBuilder.getTile( this.tiles, 2, -1 ), direction: HEX_DIRECTIONS[4] },
            { tile: MapBuilder.getTile( this.tiles, 2, 0 ), direction: HEX_DIRECTIONS[5] },
            { tile: MapBuilder.getTile( this.tiles, 1, 1 ), direction: HEX_DIRECTIONS[0] },
            { tile: MapBuilder.getTile( this.tiles, -1, 2 ), direction: HEX_DIRECTIONS[0] },
            { tile: MapBuilder.getTile( this.tiles, -2, 2 ), direction: HEX_DIRECTIONS[1] },
            { tile: MapBuilder.getTile( this.tiles, -2, 1 ), direction: HEX_DIRECTIONS[2] },
            { tile: MapBuilder.getTile( this.tiles, -1, -1 ), direction: HEX_DIRECTIONS[2] },
        ];
    }

    placeHarbors(locations, availableHarbors) {
        var harbors = [];
        var harbors_index = Object.keys(availableHarbors).sort(function() { return 0.5-Math.random();});

        for ( var i=0; i<availableHarbors.length; ++i ) {
            harbors.push( 
                new Harbor( MapBuilder.getTile( this.tiles, locations[i].tile.q, locations[i].tile.r ),
                            locations[i].direction, 
                            availableHarbors[ harbors_index[i] ] 
                )
            );

        }

        return harbors;
    }

    build() {
        this.clear();

        // set background scale
        this.backgroundScale = 5.6;

        // make tile base arrangement as all unknown 
        for ( var q=-2; q<3; ++q ) {
            for ( var r=-2; r<3; ++r ) {
                var distance = MapBuilder.hex_distance(0, 0, q, r);
                if ( distance > 2 ) { continue; }
                this.tiles.push( new Tile(q, -q -r, r, TILE_UNKNOWN) );
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

        // place number tokens as original rule
        var pivot = Math.floor(Math.random() * HEX_DIRECTIONS.length);
        var hex_directions = HEX_DIRECTIONS.slice(pivot).concat(HEX_DIRECTIONS.slice(0, pivot));
        var numberTokens = [ 5, 2, 6, 3, 8, 10, 9, 12, 11, 4, 8, 10, 9, 4, 5, 6, 3, 11 ];
        var tiles = [];
        for ( var radius = 2; radius>0; --radius) {
            var tile = MapBuilder.getTile( this.tiles, hex_directions[4][0] * radius, hex_directions[4][1] * radius );

            for ( var i=0; i<6; ++i ) {
                for ( var j=0; j<radius; ++j ) {
                    tiles.push(tile);
                    tile = MapBuilder.getTile( this.tiles, tile.q + hex_directions[i][0], tile.r + hex_directions[i][1] );
                }
            }
        }
        tiles.push( MapBuilder.getTile( this.tiles, 0, 0 ) );

        tiles.forEach(function(tile) {
            if ( tile.type != TILE_DESSERT ) { 
                tile.numberToken = numberTokens.shift();
            } else {
                tile.robber = true;
            }
        });

        // place harbors
        var locations = this.getHarborLocations();
        var availableHarbors = [
            HARBOR_BRICK, 
            HARBOR_GRAIN, 
            HARBOR_WOOL, 
            HARBOR_ORE, 
            HARBOR_LUMBER, 
            HARBOR_ANY, HARBOR_ANY, HARBOR_ANY, HARBOR_ANY 
        ];
        this.harbors = this.placeHarbors(locations, availableHarbors);

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
    $scope.enableDebug = false;

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
                '<g ng-if="tile.robber" transform="rotate(30)" class="robber">'+
                '<circle ng-if="tile.robber" cx="0" cy="-27" r="10" />' +
                '<ellipse ng-if="tile.robber" cx="0" cy="5" rx="16" ry="26" />' +
                '<path ng-if="tile.robber" d="M 20 32 A 20 20, 0, 0, 0, -20 32 Z" />' +
                '</g>' + // robber
                '<g ng-if="tile.numberToken > 0" transform="rotate(30)" class="number">'+
                '<circle ng-if="tile.numberToken > 0" cx="0" cy="0" r="35"></circle>' +
                '<text ng-if="tile.numberToken > 0 && tile.numberToken < 10" class="number-token-all number-token-{{tile.numberToken}}">{{tile.numberToken}}</text>' +
                '<text ng-if="tile.numberToken >= 10" class="number-token-all number-token-{{tile.numberToken}}">{{tile.numberToken}}</text>' +
                '</g>' + // number
                '</g>',
    link: function (scope, element, attrs) {
    }
  };
});

catanApp.directive('catanHarbor', function() {
    return {
        restrict: 'E',
        replace: true,
        scope: {
            harbor: '=harbor',
        },
        template: '<g transform="translate({{(harbor.tile.x + harbor.direction[0]/2) * 150}}, {{(harbor.tile.y - (harbor.direction[0] + harbor.direction[1])/2) * -87 + (harbor.tile.z + harbor.direction[1]/2) * 87}}) rotate({{harbor.rotation}})">' +
                  '<path d="M 50,0 L-50,0 L-40,60 A 43,43 0 0 0 40,60 Z" class="harbor {{harbor.type}}"/>' +
                  '</g>',
        link: function (scope, element, attrs) {
        }
    }
});
