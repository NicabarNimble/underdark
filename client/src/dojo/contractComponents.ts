/* Autogenerated file. Do not edit manually. */

import { defineComponent, Type as RecsType, World } from "@latticexyz/recs";

export function defineContractComponents(world: World) {
  return {
	  Chamber: (() => {
	    return defineComponent(
	      world,
	      { location_id: RecsType.Number, room_id: RecsType.Number, level_number: RecsType.Number, seed: RecsType.NumberArray, yonder: RecsType.Number },
	      {
	        metadata: {
	          name: "Chamber",
	          types: [],
	        },
	      }
	    );
	  })(),
	  Map: (() => {
	    return defineComponent(
	      world,
	      { entity_id: RecsType.Number, bitmap: RecsType.NumberArray, protected: RecsType.NumberArray, generator_name: RecsType.Number, generator_value: RecsType.Number, north: RecsType.Number, east: RecsType.Number, west: RecsType.Number, south: RecsType.Number, over: RecsType.Number, under: RecsType.Number },
	      {
	        metadata: {
	          name: "Map",
	          types: [],
	        },
	      }
	    );
	  })(),
	  MapData: (() => {
	    return defineComponent(
	      world,
	      { location_id: RecsType.Number, monsters: RecsType.NumberArray, slender_duck: RecsType.NumberArray, dark_tar: RecsType.NumberArray, chest: RecsType.NumberArray },
	      {
	        metadata: {
	          name: "MapData",
	          types: [],
	        },
	      }
	    );
	  })(),
	  Score: (() => {
	    return defineComponent(
	      world,
	      { key_location_id: RecsType.Number, key_player: RecsType.String, location_id: RecsType.Number, player: RecsType.String, moves: RecsType.Number },
	      {
	        metadata: {
	          name: "Score",
	          types: [],
	        },
	      }
	    );
	  })(),
	  Tile: (() => {
	    return defineComponent(
	      world,
	      { key_location_id: RecsType.Number, key_pos: RecsType.Number, location_id: RecsType.Number, pos: RecsType.Number, tile_type: RecsType.Number },
	      {
	        metadata: {
	          name: "Tile",
	          types: [],
	        },
	      }
	    );
	  })(),
  };
}
