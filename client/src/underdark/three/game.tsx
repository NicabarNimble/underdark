import * as THREE from 'three'
import TWEEN from '@tweenjs/tween.js'

//@ts-ignore
import Stats from 'three/addons/libs/stats.module.js'
//@ts-ignore
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
//@ts-ignore
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
//@ts-ignore
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

import { DepthPostShader } from './DepthPostShader'
import { Dir, GameTilemap, Position, TileType } from '../utils/underdark'
import { loadAssets, MODELS_ASSETS } from '../data/assets'

const PI = Math.PI
const HALF_PI = Math.PI * 0.5
const ONE_HALF_PI = Math.PI * 1.5
const TWO_PI = Math.PI * 2
const R_TO_D = (180 / Math.PI)

//
// Depth render based on:
// https://threejs.org/examples/#webgl_depth_texture
// https://github.com/mrdoob/three.js/blob/master/examples/webgl_depth_texture.html
//

const SIZE = 1;
const CAM_FOV = 70;
const CAM_FAR = 5; // 1.3 .. 5
const TILT = 1;
const GAMMA = 1.25;
const COLOR_COUNT = 0; //16;
const DITHER = 0;
const DITHER_SIZE = 4;
const BAYER = 0;//4;
const PALETTE = 0;//1;

const PALETTE_PATHS = [
  '/colors/gameboy.png',
  '/colors/blue.png',
  '/colors/pink.png',
  '/colors/purple.png',
  '/colors/earth.png',
  '/colors/hot.png',
  '/colors/spectrum.png',
  // '/colors/greeny.png',
]

let _width: number;
let _height: number;
let _aspect: number;
let _eyeZ: number;
let _palettes = [];
let _gameTilemap: GameTilemap | null = null
let _stepCounter = 0
let _animSecs = 200;

let _animationRequest = null
let _renderer: THREE.WebGLRenderer;
let _camera: THREE.PerspectiveCamera;
let _cameraRig: THREE.Object3D;
let _scene: THREE.Scene
let _material: THREE.Material;
let _tile_geometry: THREE.BoxGeometry;
let _map: THREE.Object3D;
let _target, _postScene, _postCamera, _postMaterial;
let _supportsExtension: boolean = true;
let _gui
let _stats;
// let _controls;

let _defaultPosition: Position = { tile: 135, facing: Dir.South }

const defaultParams = {
  fov: CAM_FOV,
  far: CAM_FAR,
  tilt: TILT,
  gamma: GAMMA,
  colorCount: COLOR_COUNT,
  dither: DITHER,
  ditherSize: DITHER_SIZE,
  bayer: BAYER,
  palette: PALETTE,
  lightness: false,
};
let params = { ...defaultParams };


export function resetGameParams(newParams: any = {}) {
  // console.log(`resetGameParams() + `, newParams)
  Object.keys(defaultParams).forEach(key => {
    params[key] = newParams[key] ?? defaultParams[key]
  })
  _gui?.controllersRecursive().forEach(c => c.updateDisplay())
  paramsUpdated()
}

export function setGameParams(newParams: any) {
  // console.log(`setGameParams()`, newParams)
  Object.keys(newParams).forEach(key => {
    params[key] = newParams[key]
  })
  _gui?.controllersRecursive().forEach(c => c.updateDisplay())
  paramsUpdated()
}



//-------------------------------------------
// Setup
//

export function dispose() {
  if (_animationRequest) cancelAnimationFrame(_animationRequest)
  _animationRequest = null
  _renderer?.dispose()
  _renderer = null
  _scene = null
}

export async function init(canvas, width, height, guiEnabled) {

  if (_scene) return;

  await loadAssets()

  _width = width;
  _height = height;
  _aspect = (width / height);
  _eyeZ = SIZE / 2;

  _renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    canvas,
  });

  if (_renderer.capabilities.isWebGL2 === false && _renderer.extensions.has('WEBGL_depth_texture') === false) {
    _supportsExtension = false;
    console.error(`WEBGL_depth_texture not supported!`)
    return;
  }

  _renderer.setPixelRatio(window.devicePixelRatio);
  _renderer.setSize(_width, _height);

  setupScene();

  _cameraRig = new THREE.Object3D();
  _cameraRig.position.set(0, 0, 0);
  _scene.add(_cameraRig)

  _camera = new THREE.PerspectiveCamera(
    CAM_FOV,  // fov
    _aspect,  // aspect
    0.01,     // near
    CAM_FAR,  // far
  );
  _cameraRig.add(_camera)
  _camera.up.set(0, 0, 1);
  _camera.position.set(0, 0, _eyeZ)
  _camera.lookAt(0, -SIZE, _eyeZ);

  // _controls = new OrbitControls(camera, renderer.domElement);
  // _controls.enableDamping = true;

  PALETTE_PATHS.forEach(path => {
    const tex = new THREE.TextureLoader().load(path);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    _palettes.push(tex);
  })

  setupRenderTarget();
  setupPost();

  onWindowResize();
  window.addEventListener('resize', onWindowResize);

  if (guiEnabled) {
    _gui = new GUI({ width: 300 });
    _gui.add(params, 'fov', 30, 90, 1).onChange(guiUpdated);
    _gui.add(params, 'far', 1, 20, 0.1).onChange(guiUpdated);
    _gui.add(params, 'tilt', 0, 15, 0.1).onChange(guiUpdated);
    _gui.add(params, 'gamma', 0, 2, 0.01).onChange(guiUpdated);
    _gui.add(params, 'colorCount', 0, 16, 1).onChange(guiUpdated);
    _gui.add(params, 'dither', 0, 0.5, 0.01).onChange(guiUpdated);
    _gui.add(params, 'ditherSize', 2, 5, 1).onChange(guiUpdated);
    _gui.add(params, 'bayer', 0, 4, 1).onChange(guiUpdated);
    _gui.add(params, 'palette', 0, _palettes.length, 1).onChange(guiUpdated);
    _gui.add(params, 'lightness', true).onChange(guiUpdated);
    _gui.close();
    // framerate
    _stats = new Stats();
    document.body.appendChild(_stats.dom);
  }
}

function guiUpdated() {
  paramsUpdated()
}

function paramsUpdated() {
  // Camera
  _camera.fov = params.fov;
  _camera.far = params.far;
  _camera.updateProjectionMatrix();
  _postMaterial.uniforms.uCameraNear.value = _camera.near;
  _postMaterial.uniforms.uCameraFar.value = _camera.far;
  // Shader
  _postMaterial.uniforms.uGamma.value = params.gamma;
  _postMaterial.uniforms.uColorCount.value = params.colorCount;
  _postMaterial.uniforms.uDither.value = params.dither;
  _postMaterial.uniforms.uDitherSize.value = params.ditherSize;
  _postMaterial.uniforms.uBayer.value = params.bayer;
  _postMaterial.uniforms.uPalette.value = params.palette;
  _postMaterial.uniforms.tPalette.value = params.palette > 0 ? _palettes[params.palette - 1] : null;
  _postMaterial.uniforms.uLightness.value = params.lightness;
}

// Create a render target with depth texture
// const formats = { DepthFormat: THREE.DepthFormat, DepthStencilFormat: THREE.DepthStencilFormat };
// const types = { UnsignedShortType: THREE.UnsignedShortType, UnsignedIntType: THREE.UnsignedIntType, UnsignedInt248Type: THREE.UnsignedInt248Type };
function setupRenderTarget() {
  if (_target) _target.dispose();
  const format = THREE.DepthFormat;
  const type = THREE.UnsignedShortType;
  _target = new THREE.WebGLRenderTarget(_width, _height);
  _target.texture.minFilter = THREE.NearestFilter;
  _target.texture.magFilter = THREE.NearestFilter;
  // _target.stencilBuffer = (format === THREE.DepthStencilFormat) ? true : false;
  //@ts-ignore
  _target.depthTexture = new THREE.DepthTexture();
  _target.depthTexture.format = format;
  _target.depthTexture.type = type;
}

function setupPost() {
  _postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  _postMaterial = new THREE.ShaderMaterial({
    vertexShader: DepthPostShader.vertexShader,
    fragmentShader: DepthPostShader.fragmentShader,
    uniforms: {
      uCameraNear: { value: _camera.near },
      uCameraFar: { value: _camera.far },
      uGamma: { value: GAMMA },
      uColorCount: { value: COLOR_COUNT },
      uDither: { value: DITHER },
      uDitherSize: { value: DITHER_SIZE },
      uBayer: { value: BAYER },
      uPalette: { value: params.palette },
      uLightness: { value: params.lightness },
      tPalette: { value: null },
      tDiffuse: { value: null },
      tDepth: { value: null }
    }
  });
  guiUpdated();
  const postPlane = new THREE.PlaneGeometry(2, 2);
  const postQuad = new THREE.Mesh(postPlane, _postMaterial);
  _postScene = new THREE.Scene();
  _postScene.add(postQuad);
  postQuad.scale.set(-1,1,1);
}

function onWindowResize() {
  // const aspect = window.innerWidth / window.innerHeight;
  // camera.aspect = aspect;
  // camera.updateProjectionMatrix();
  // const dpr = renderer.getPixelRatio();
  // target.setSize(window.innerWidth * dpr, window.innerHeight * dpr);
  // renderer.setSize(window.innerWidth, window.innerHeight);
}


//-------------------------------------------
// Game Loop
//

export function animate() {
  if (!_supportsExtension || !_scene || !_renderer) return;

  _animationRequest = requestAnimationFrame(animate);

  TWEEN.update();

  // render scene into target
  _renderer.setRenderTarget(_target);
  _renderer.render(_scene, _camera);

  // render post FX
  _postMaterial.uniforms.tDiffuse.value = _target.texture;
  _postMaterial.uniforms.tDepth.value = _target.depthTexture;

  _renderer.setRenderTarget(null);
  _renderer.render(_postScene, _postCamera);

  if (_stats) _stats.update();
}


//-------------------------------------------
// Scene
//

function setupScene() {

  _scene = new THREE.Scene();

  _material = new THREE.MeshBasicMaterial({ color: 'blue' });
  _tile_geometry = new THREE.BoxGeometry(SIZE, SIZE, SIZE);

  const floor_geometry = new THREE.PlaneGeometry(16 * SIZE, 16 * SIZE);
  const ceiling_geometry = new THREE.PlaneGeometry(20 * SIZE, 20 * SIZE);
  const floor_material = new THREE.MeshBasicMaterial({ color: 'cyan' });
  const floor = new THREE.Mesh(floor_geometry, floor_material);
  const ceiling = new THREE.Mesh(ceiling_geometry, floor_material);
  floor.position.set(7.5 * SIZE, 7.5 * SIZE, 0);
  ceiling.position.set(8 * SIZE, 8 * SIZE, SIZE);
  ceiling.scale.set(1, 1, -1);

  _scene.add(floor);
  _scene.add(ceiling);
}

export function movePlayer(position: Position) {
  const tile = position?.tile ?? _defaultPosition.tile
  const facing = position?.facing ?? _defaultPosition.facing

  const x = (tile % 16) * SIZE
  const y = Math.floor(tile / 16) * SIZE
  new TWEEN.Tween(_cameraRig.position).to({ x, y }, _animSecs).start()
  // _cameraRig.position.set(x, y, 0);

  // Rotate player
  let tilt = (++_stepCounter % 2 == 0 ? params.tilt : -params.tilt) / R_TO_D
  let rotX = (facing == Dir.East || facing == Dir.West) ? tilt : 0
  let rotY = (facing == Dir.North || facing == Dir.South) ? tilt : 0
  let rotZ =
    facing == Dir.East ? HALF_PI
      : facing == Dir.South ? PI
        : facing == Dir.West ? ONE_HALF_PI
          : 0
  if (_cameraRig.rotation.z - rotZ > PI) rotZ += TWO_PI
  if (rotZ - _cameraRig.rotation.z > PI) rotZ -= TWO_PI
  new TWEEN.Tween(_cameraRig.rotation).to({ x: rotX, y: rotY, z: rotZ }, _animSecs).start().onComplete(() => {
    if (_cameraRig.rotation.z < 0) _cameraRig.rotation.z += TWO_PI;
    if (_cameraRig.rotation.z > TWO_PI) _cameraRig.rotation.z -= TWO_PI;
  })
  // _cameraRig.rotation.set(0, 0, rot);

}

export function setupMap(gameTilemap: GameTilemap|null, isPlaying: boolean) {

  _gameTilemap = gameTilemap ?? {
    gridSize: 20,
    gridOrigin: { x: 0, y: 0 },
    playerStart: _defaultPosition,
    tilemap: [],
  }

  const gridSize = _gameTilemap.gridSize
  const gridOrigin = _gameTilemap.gridOrigin
  const tilemap = _gameTilemap.tilemap

  if (_map) {
    _scene.remove(_map)
  }

  _map = new THREE.Object3D();
  _map.position.set(0, 0, 0);

  const _randomRotate = (mesh) => (mesh.rotation.set(0, 0, [0, 1, 2, 3][Math.floor(Math.random() * 4)] * HALF_PI))

  for (let i = 0; i < tilemap.length; ++i) {
    const tileType = tilemap[i]
    const x = ((i % gridSize) + gridOrigin.x) * SIZE
    const y = (Math.floor(i / gridSize) + gridOrigin.y) * SIZE
    let z = 0
    let mesh = null
    if (tileType == TileType.Void) {
      mesh = new THREE.Mesh(_tile_geometry, _material)
      z = SIZE * 0.5
    } else if (isPlaying) {
      if (tileType == TileType.Entry) {
        mesh = loadModel('DOOR')
      } else if (tileType == TileType.Exit) {
        mesh = loadModel('STAIRS')
      } else if (tileType == TileType.LockedExit) {
      } else if (tileType == TileType.Monster) {
        mesh = loadModel('MONSTER')
        _randomRotate(mesh)
        // } else if (tileType == TileType.SlenderDuck) {
        //   mesh = new THREE.Mesh(_slender_geometry, _material);
        //   mesh.rotateX(HALF_PI)
        //   loadModel('SLENDER_DUCK')
      } else if (tileType == TileType.DarkTar) {
        mesh = loadModel('DARK_TAR')
        _randomRotate(mesh)
      }
    }
    if (mesh) {
      mesh.position.set(x, y, z)
     _map.add(mesh)
    }
  }

  _scene.add(_map)
}

function loadModel(modelName) {
  const model = MODELS_ASSETS[modelName]
  if (!model?.object ) return null
  // console.log(`___MODEL_instance`, modelName, model.object)
  const obj = new THREE.Object3D();
  obj.add(model.object.clone())
  return obj
}
