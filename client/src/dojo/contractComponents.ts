/* Autogenerated file. Do not edit manually. */

import { defineComponent, Type as RecsType, World } from "@dojoengine/recs";

export function defineContractComponents(world: World) {
  return {
	  Chamber: (() => {
	    return defineComponent(
	      world,
	      { location_id: RecsType.BigInt, room_id: RecsType.Number, level_number: RecsType.Number, seed: RecsType.BigInt, yonder: RecsType.Number },
	      {
	        metadata: {
	          name: "Chamber",
	          types: ["u128","u16","u16","u256","u16"],
	          customTypes: [],
	        },
	      }
	    );
	  })(),
	  Map: (() => {
	    return defineComponent(
	      world,
	      { entity_id: RecsType.BigInt, bitmap: RecsType.BigInt, protected: RecsType.BigInt, generator_name: RecsType.BigInt, generator_value: RecsType.Number, north: RecsType.Number, east: RecsType.Number, west: RecsType.Number, south: RecsType.Number, over: RecsType.Number, under: RecsType.Number },
	      {
	        metadata: {
	          name: "Map",
	          types: ["u128","u256","u256","felt252","u32","u8","u8","u8","u8","u8","u8"],
	          customTypes: [],
	        },
	      }
	    );
	  })(),
	  MapData: (() => {
	    return defineComponent(
	      world,
	      { location_id: RecsType.BigInt, monsters: RecsType.BigInt, slender_duck: RecsType.BigInt, dark_tar: RecsType.BigInt, chest: RecsType.BigInt },
	      {
	        metadata: {
	          name: "MapData",
	          types: ["u128","u256","u256","u256","u256"],
	          customTypes: [],
	        },
	      }
	    );
	  })(),
	  Score: (() => {
	    return defineComponent(
	      world,
	      { key_location_id: RecsType.BigInt, key_player: RecsType.BigInt, location_id: RecsType.BigInt, player: RecsType.BigInt, moves: RecsType.Number },
	      {
	        metadata: {
	          name: "Score",
	          types: ["u128","contractaddress","u128","contractaddress","usize"],
	          customTypes: [],
	        },
	      }
	    );
	  })(),
	  Tile: (() => {
	    return defineComponent(
	      world,
	      { key_location_id: RecsType.BigInt, key_pos: RecsType.Number, location_id: RecsType.BigInt, pos: RecsType.Number, tile_type: RecsType.Number },
	      {
	        metadata: {
	          name: "Tile",
	          types: ["u128","u8","u128","u8","u8"],
	          customTypes: [],
	        },
	      }
	    );
	  })(),
  };
}
