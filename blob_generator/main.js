import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'https://cdn.jsdelivr.net/npm/three@0.152.2/examples/jsm/shaders/FXAAShader.js';

import { PolarSphereGeometry } from './polar_sphere_geometry.js';
import { createEmotionMaterial } from './materials/emotion_material.js';
import { createNoise3D } from 'https://cdn.skypack.dev/simplex-noise@4.0.1';
import { GrainShader } from './shaders/grain_shader.js';

// — Scene Setup —

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);
const clock = new THREE.Clock();

const envMap = new THREE.TextureLoader().load('./media/envmap.jpg');
envMap.mapping = THREE.EquirectangularReflectionMapping;
envMap.colorSpace = THREE.SRGBColorSpace;
scene.environment = envMap;

// Lights & Controls
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.2));
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 5, 5);
scene.add(dir);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Postprocessing
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.85);
composer.addPass(bloomPass);

// Add grain pass
const grainPass = new ShaderPass(GrainShader);
composer.addPass(grainPass);

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.material.uniforms['resolution'].value.set(1 / window.innerWidth, 1 / window.innerHeight);
composer.addPass(fxaaPass);

// Parameters & State
const EMOTIONS = {
  Neutrality: { 
    amplitude: 0.12, 
    frequency: 0.99, 
    bloom: 0.3, 
    color: 13553349, 
    modifier: 0, 
    ribAmp: 0, 
    ribFreq: 1,
    noiseSpeed: 0.65,
    rotationSpeed: 0,
    backgroundColor: 0xb6b69e,
    metalness: 0,
    roughness: 1,
    transmission: 0.5,
    thickness: 0,
    clearcoat: 0,
    clearcoatRoughness: 0,
    envMapIntensity: 2,
    pointMode: false,
    pointSize: 0.03,
    useTexture: true
  },
    Anxiety: {
      amplitude: 0.06,
      frequency: 5,
      bloom: 0.05,
      color: 15204335,
      modifier: 0,
      ribAmp: 0,
      ribFreq: 1,
      noiseSpeed: 3,
      rotationSpeed: 0.2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0,
      roughness: 0,
      transmission: 0.52,
      thickness: 0.4,
      clearcoat: 1,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.2
    },      
    Fear: {
      amplitude: 0.42,
      frequency: 5,
      bloom: 0,
      color: 14217983,
      modifier: 0,
      ribAmp: 0.2,
      ribFreq: 10,
      noiseSpeed: 0.61,
      rotationSpeed: 1,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.81,
      roughness: 0.53,
      transmission: 0.43,
      thickness: 0.4,
      clearcoat: 1,
      clearcoatRoughness: 1,
      envMapIntensity: 2
  },
    Anger: { 
      amplitude: 0.64, 
      frequency: 5, 
      bloom: 0, 
      color: 12386304, 
      modifier: 0, 
      ribAmp: 0, 
      ribFreq: 1,
      noiseSpeed: 1.79,
      rotationSpeed: 0,
      backgroundColor: 0xb6b69e,
      metalness: 0.09,
      roughness: 0,
      transmission: 0.08,
      thickness: 2,
      clearcoat: 1,
      clearcoatRoughness: 1,
      envMapIntensity: 2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true
    },
    Sadness: { 
      amplitude: 0.1, 
      frequency: 0.82, 
      bloom: 0.05, 
      color: 5533570, 
      modifier: 1, 
      ribAmp: 0, 
      ribFreq: 1,
      noiseSpeed: 0.11,
      rotationSpeed: 0,
      backgroundColor: 0xb6b69e,
      metalness: 0,
      roughness: 0,
      transmission: 0,
      thickness: 0,
      clearcoat: 1,
      clearcoatRoughness: 1,
      envMapIntensity: 0,
      pointMode: false,
      pointSize: 0.03,
    },
    Contentment: { 
      amplitude: 0.28, 
      frequency: 0.1, 
      bloom: 0, 
      color: 16774656, 
      modifier: 2, 
      ribAmp: 0.1, 
      ribFreq: 14.8,
      noiseSpeed: 0.3,
      rotationSpeed: 0,
      backgroundColor: 0xb6b69e,
      metalness: 0.1,
      roughness: 0.35,
      transmission: 0.76,
      thickness: 0.95,
      clearcoat: 0,
      clearcoatRoughness: 0.21,
      envMapIntensity: 0,
      pointMode: false,
      pointSize: 0.03,
      useTexture: false
    },
    Curiosity: { 
      amplitude: 0.27, 
      frequency: 0.28, 
      bloom: 0, 
      color: 13428735, 
      modifier: 2, 
      ribAmp: 0.8, 
      ribFreq: 3.4,
      noiseSpeed: 0.54,
      rotationSpeed: 0,
      backgroundColor: 0xb6b69e,
      metalness: 0.1,
      roughness: 0.35,
      transmission: 0.76,
      thickness: 0.95,
      clearcoat: 0,
      clearcoatRoughness: 0.21,
      envMapIntensity: 0,
      pointMode: false,
      pointSize: 0.03,
      useTexture: false
    },
    Worry: {
      amplitude: 0.09,
      frequency: 3.8000000000000003,
      bloom: 0.05,
      color: 10464704,
      modifier: 0,
      ribAmp: 0,
      ribFreq: 1,
      noiseSpeed: 1.73,
      rotationSpeed: 0,
      backgroundColor: 0xb6b69e,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0,
      roughness: 0.38,
      transmission: 0.85,
      thickness: 0,
      clearcoat: 0,
      clearcoatRoughness: 1,
      envMapIntensity: 1.2
  },
    Vulnerability: {
      amplitude: 0.11,
      frequency: 1.09,
      bloom: 0.05,
      color: 16770293,
      modifier: 2,
      ribAmp: 0.13,
      ribFreq: 1.1,
      noiseSpeed: 0,
      rotationSpeed: 0.09,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0,
      roughness: 0.41000000000000003,
      transmission: 0.47000000000000003,
      thickness: 2,
      clearcoat: 1,
      clearcoatRoughness: 0.47000000000000003,
      envMapIntensity: 2
    },
    Gratitude: {
      amplitude: 0,
      frequency: 0.1,
      bloom: 0.2,
      color: 16438703,
      modifier: 2,
      ribAmp: 0.49,
      ribFreq: 1.1,
      noiseSpeed: 0,
      rotationSpeed: 0,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0,
      roughness: 0.31,
      transmission: 0.05,
      thickness: 2,
      clearcoat: 0,
      clearcoatRoughness: 0,
      envMapIntensity: 0
    },
    Envy: {
      amplitude: 0.29,
      frequency: 5,
      bloom: 1,
      color: 8113990,
      modifier: 2,
      ribAmp: 0.68,
      ribFreq: 1,
      noiseSpeed: 0,
      rotationSpeed: 0,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.93,
      roughness: 0.52,
      transmission: 0,
      thickness: 0.87,
      clearcoat: 1,
      clearcoatRoughness: 0.17,
      envMapIntensity: 2
    },
    Overwhelm: {
      amplitude: 0.59,
      frequency: 3.11,
      bloom: 1,
      color: 13616709,
      modifier: 2,
      ribAmp: 0.5700000000000001,
      ribFreq: 1.6,
      noiseSpeed: 2,
      rotationSpeed: 0,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.66,
      roughness: 0.02,
      transmission: 0,
      thickness: 0,
      clearcoat: 0,
      clearcoatRoughness: 0,
      envMapIntensity: 2
    },
    Joy: {
      amplitude: 0.26,
      frequency: 0.39,
      bloom: 0.05,
      color: 16769557,
      modifier: 0,
      ribAmp: 0,
      ribFreq: 1,
      noiseSpeed: 3,
      rotationSpeed: 0.32,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.05,
      roughness: 0,
      transmission: 0.47000000000000003,
      thickness: 2,
      clearcoat: 0,
      clearcoatRoughness: 0,
      envMapIntensity: 2
    },
    Surprise: {
      amplitude: 0.26,
      frequency: 0.39,
      bloom: 0.05,
      color: 16757476,
      modifier: 0,
      ribAmp: 0,
      ribFreq: 1,
      noiseSpeed: 3,
      rotationSpeed: 0.32,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.05,
      roughness: 0,
      transmission: 0.47000000000000003,
      thickness: 2,
      clearcoat: 0,
      clearcoatRoughness: 0,
      envMapIntensity: 2
    },
    Love: {
      amplitude: 0.13,
      frequency: 0.77,
      bloom: 0.3,
      color: 16777215,
      modifier: 2,
      ribAmp: 0.11,
      ribFreq: 1,
      noiseSpeed: 0.21,
      rotationSpeed: 0.25,
      pointMode: true,
      pointSize: 0.012,
      useTexture: true,
      metalness: 0,
      roughness: 0.59,
      transmission: 0.04,
      thickness: 0.4,
      clearcoat: 1,
      clearcoatRoughness: 1,
      envMapIntensity: 0
    },
    Guilt: {
      amplitude: 0.13,
      frequency: 1.53,
      bloom: 0,
      color: 7178064,
      modifier: 1,
      ribAmp: 0.15,
      ribFreq: 1,
      noiseSpeed: 1.5,
      rotationSpeed: 0,
      pointMode: false,
      pointSize: 0.023,
      useTexture: true,
      metalness: 0,
      roughness: 0.38,
      transmission: 0.85,
      thickness: 0,
      clearcoat: 0,
      clearcoatRoughness: 1,
      envMapIntensity: 1.2
    },
    Disgust: {
      amplitude: 0.49,
      frequency: 1.58,
      bloom: 0.3,
      color: 6523970,
      modifier: 1,
      ribAmp: 0.2,
      ribFreq: 10,
      noiseSpeed: 0.3,
      rotationSpeed: 0.2,
      pointMode: true,
      pointSize: 0.039,
      useTexture: true,
      metalness: 0,
      roughness: 1,
      transmission: 0,
      thickness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.07,
      envMapIntensity: 1.2
    },
    Shame: {
      amplitude: 0.49,
      frequency: 0.88,
      bloom: 0.3,
      color: 6899784,
      modifier: 1,
      ribAmp: 0.2,
      ribFreq: 10,
      noiseSpeed: 0.3,
      rotationSpeed: 0.2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0,
      roughness: 1,
      transmission: 0,
      thickness: 0,
      clearcoat: 1,
      clearcoatRoughness: 1,
      envMapIntensity: 1.2
    },
    Embarrassment: {
      amplitude: 0.08,
      frequency: 1.26,
      bloom: 0.05,
      color: 14596794,
      modifier: 2,
      ribAmp: 0,
      ribFreq: 19,
      noiseSpeed: 2.2600000000000002,
      rotationSpeed: 0,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.05,
      roughness: 0,
      transmission: 0.47000000000000003,
      thickness: 2,
      clearcoat: 0,
      clearcoatRoughness: 0,
      envMapIntensity: 2
    },
    Anticipation: {
      amplitude: 0.16,
      frequency: 0.28,
      bloom: 0.05,
      color: 16757760,
      modifier: 2,
      ribAmp: 0.31,
      ribFreq: 30,
      noiseSpeed: 3,
      rotationSpeed: 0,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.05,
      roughness: 0,
      transmission: 0.47000000000000003,
      thickness: 2,
      clearcoat: 0,
      clearcoatRoughness: 0,
      envMapIntensity: 2
    },
    Contempt: {
      amplitude: 0.4,
      frequency: 0.6,
      bloom: 0,
      color: 7864490,
      modifier: 2,
      ribAmp: 0.15,
      ribFreq: 5,
      noiseSpeed: 0,
      rotationSpeed: 0,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.81,
      roughness: 0.21,
      transmission: 0.5700000000000001,
      thickness: 2,
      clearcoat: 1,
      clearcoatRoughness: 0.33,
      envMapIntensity: 1.19
    },
    Compassion: {
      amplitude: 0.6900000000000001,
      frequency: 0.72,
      bloom: 0.05,
      color: 12901887,
      modifier: 0,
      ribAmp: 0.13,
      ribFreq: 1.1,
      noiseSpeed: 0,
      rotationSpeed: 0.09,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0,
      roughness: 0.41000000000000003,
      transmission: 0.47000000000000003,
      thickness: 2,
      clearcoat: 1,
      clearcoatRoughness: 0.47000000000000003,
      envMapIntensity: 2
    },
    Affection: {
      amplitude: 0.2,
      frequency: 1.36,
      bloom: 0.05,
      color: 16756141,
      modifier: 0,
      ribAmp: 0,
      ribFreq: 1,
      noiseSpeed: 0.28,
      rotationSpeed: 0,
      pointMode: true,
      pointSize: 0.02,
      useTexture: true,
      metalness: 0,
      roughness: 0,
      transmission: 0.63,
      thickness: 0.4,
      clearcoat: 0.88,
      clearcoatRoughness: 0,
      envMapIntensity: 1.2
    },
    Trust: {
      amplitude: 0.12,
      frequency: 0.4,
      bloom: 0,
      color: 3289770,
      modifier: 2,
      ribAmp: 0.79,
      ribFreq: 1,
      noiseSpeed: 0.05,
      rotationSpeed: 1,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0,
      roughness: 1,
      transmission: 0,
      thickness: 2,
      clearcoat: 0,
      clearcoatRoughness: 0,
      envMapIntensity: 0
    },
    Respect: {
      amplitude: 0.16,
      frequency: 0.34,
      bloom: 0,
      color: 16777215,
      modifier: 1,
      ribAmp: 0.2,
      ribFreq: 10,
      noiseSpeed: 0.61,
      rotationSpeed: 1,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.67,
      roughness: 0.53,
      transmission: 0.43,
      thickness: 0.4,
      clearcoat: 1,
      clearcoatRoughness: 1,
      envMapIntensity: 2
    },
    Frustration: {
      amplitude: 0.84,
      frequency: 1.2,
      bloom: 0.02,
      color: 10173952,
      modifier: 2,
      ribAmp: 0.11,
      ribFreq: 15.8,
      noiseSpeed: 1.27,
      rotationSpeed: 0,
      pointMode: true,
      pointSize: 0.054,
      useTexture: true,
      metalness: 0,
      roughness: 0.25,
      transmission: 0,
      thickness: 2,
      clearcoat: 0,
      clearcoatRoughness: 0,
      envMapIntensity: 0
    },
    Dissapointment: {
      amplitude: 0.18,
      frequency: 1.47,
      bloom: 1,
      color: 14441216,
      modifier: 1,
      ribAmp: 0,
      ribFreq: 1,
      noiseSpeed: 0.11,
      rotationSpeed: 0,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.92,
      roughness: 0.6900000000000001,
      transmission: 0,
      thickness: 0,
      clearcoat: 0.78,
      clearcoatRoughness: 0,
      envMapIntensity: 1.6400000000000001
    },
    Acceptance: {
      amplitude: 0.1,
      frequency: 0.8,
      bloom: 0,
      color: 15400900,
      modifier: 1,
      ribAmp: 0,
      ribFreq: 1,
      noiseSpeed: 0.11,
      rotationSpeed: 0,
      pointMode: true,
      pointSize: 0.019,
      useTexture: true,
      metalness: 0,
      roughness: 0,
      transmission: 0,
      thickness: 0,
      clearcoat: 0,
      clearcoatRoughness: 0,
      envMapIntensity: 0
    },
    Nostalgia: {
      amplitude: 0.07,
      frequency: 2.18,
      bloom: 0.16,
      color: 16119285,
      modifier: 0,
      ribAmp: 0.05,
      ribFreq: 2.4000000000000004,
      noiseSpeed: 0.51,
      rotationSpeed: 0.2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.05,
      roughness: 0.68,
      transmission: 0.14,
      thickness: 0.8300000000000001,
      clearcoat: 0.73,
      clearcoatRoughness: 0.1,
      envMapIntensity: 1.3800000000000001
    },
    Confusion: {
      amplitude: 0.15,
      frequency: 3.99,
      bloom: 0.16,
      color: 12711873,
      modifier: 1,
      ribAmp: 0.05,
      ribFreq: 2.4000000000000004,
      noiseSpeed: 0.51,
      rotationSpeed: 0.2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.15,
      roughness: 0.48,
      transmission: 0.78,
      thickness: 0.78,
      clearcoat: 0.4,
      clearcoatRoughness: 0.14,
      envMapIntensity: 0.8200000000000001
    },
    Pride: {
      amplitude: 0.07,
      frequency: 0.1,
      bloom: 0.16,
      color: 16774109,
      modifier: 2,
      ribAmp: 0.05,
      ribFreq: 2.4000000000000004,
      noiseSpeed: 0.51,
      rotationSpeed: 0.2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.12,
      roughness: 0.38,
      transmission: 0.66,
      thickness: 0.78,
      clearcoat: 0.4,
      clearcoatRoughness: 0.14,
      envMapIntensity: 0.8200000000000001
    },
    Relief: {
      amplitude: 0.07,
      frequency: 0.1,
      bloom: 0,
      color: 4517119,
      modifier: 2,
      ribAmp: 0.21,
      ribFreq: 3.7,
      noiseSpeed: 0.51,
      rotationSpeed: 0.2,
      pointMode: true,
      pointSize: 0.03,
      useTexture: true,
      metalness: 1,
      roughness: 0,
      transmission: 0.14,
      thickness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0,
      envMapIntensity: 2
    },
    Despair: {
      amplitude: 0.15,
      frequency: 0.9,
      bloom: 0,
      color: 6908265,
      modifier: 1,
      ribAmp: 0.21,
      ribFreq: 3.7,
      noiseSpeed: 0.51,
      rotationSpeed: 0.2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 1,
      roughness: 0.46,
      transmission: 0.14,
      thickness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0,
      envMapIntensity: 0.28
    },
    Disappointment: {
      amplitude: 0.15,
      frequency: 1.56,
      bloom: 0,
      color: 13453575,
      modifier: 1,
      ribAmp: 0.21,
      ribFreq: 3.7,
      noiseSpeed: 0.51,
      rotationSpeed: 0.2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 1,
      roughness: 0.46,
      transmission: 0.14,
      thickness: 0,
      clearcoat: 0.59,
      clearcoatRoughness: 0.6,
      envMapIntensity: 0.6
    },
    Awe: {
      amplitude: 0.59,
      frequency: 3.11,
      bloom: 1,
      color: 60671,
      modifier: 2,
      ribAmp: 0.5700000000000001,
      ribFreq: 1.6,
      noiseSpeed: 0,
      rotationSpeed: 0,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.66,
      roughness: 0.02,
      transmission: 0,
      thickness: 0,
      clearcoat: 0,
      clearcoatRoughness: 0,
      envMapIntensity: 2
    },
    Admiration: {
      amplitude: 0.07,
      frequency: 0.1,
      bloom: 0,
      color: 16770676,
      modifier: 2,
      ribAmp: 0.14,
      ribFreq: 1,
      noiseSpeed: 0.51,
      rotationSpeed: 0.2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 1,
      roughness: 0,
      transmission: 0.14,
      thickness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0,
      envMapIntensity: 2
    },
    Stress: {
      amplitude: 0.5,
      frequency: 5,
      bloom: 0,
      color: 2500298,
      modifier: 0,
      ribAmp: 0.2,
      ribFreq: 10,
      noiseSpeed: 1.54,
      rotationSpeed: 1,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true,
      metalness: 0.81,
      roughness: 0.53,
      transmission: 0.43,
      thickness: 0.4,
      clearcoat: 1,
      clearcoatRoughness: 1,
      envMapIntensity: 2
    },
    Excitement: {
      amplitude: 0.18,
      frequency: 2.2,
      bloom: 0.4,
      color: 0xffa500, // orange
      modifier: 0,
      ribAmp: 0.1,
      ribFreq: 2,
      noiseSpeed: 1.2,
      rotationSpeed: 0.5,
      backgroundColor: 0xb6b69e,
      metalness: 0.2,
      roughness: 0.3,
      transmission: 0.7,
      thickness: 0.5,
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.5,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true
    },
    Avoidance: {
      amplitude: 0.09,
      frequency: 1.1,
      bloom: 0.1,
      color: 0x8b8b8b, // gray
      modifier: 1,
      ribAmp: 0.05,
      ribFreq: 1.2,
      noiseSpeed: 0.3,
      rotationSpeed: 0.1,
      backgroundColor: 0xb6b69e,
      metalness: 0.1,
      roughness: 0.7,
      transmission: 0.2,
      thickness: 0.2,
      clearcoat: 0.1,
      clearcoatRoughness: 0.3,
      envMapIntensity: 1.0,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true
    },
    Dread: {
      amplitude: 0.22,
      frequency: 2.5,
      bloom: 0.2,
      color: 0x2d2d2d, // dark gray
      modifier: 1,
      ribAmp: 0.12,
      ribFreq: 2.5,
      noiseSpeed: 0.7,
      rotationSpeed: 0.2,
      backgroundColor: 0xb6b69e,
      metalness: 0.3,
      roughness: 0.8,
      transmission: 0.1,
      thickness: 0.3,
      clearcoat: 0.2,
      clearcoatRoughness: 0.4,
      envMapIntensity: 1.1,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true
    },
    Comparison: {
      amplitude: 0.13,
      frequency: 1.3,
      bloom: 0.1,
      color: 0x7fffd4, // aquamarine
      modifier: 2,
      ribAmp: 0.08,
      ribFreq: 1.5,
      noiseSpeed: 0.5,
      rotationSpeed: 0.15,
      backgroundColor: 0xb6b69e,
      metalness: 0.15,
      roughness: 0.5,
      transmission: 0.4,
      thickness: 0.3,
      clearcoat: 0.2,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true
    },
    Reverence: {
      amplitude: 0.15,
      frequency: 0.9,
      bloom: 0.3,
      color: 0x6a5acd, // slate blue
      modifier: 2,
      ribAmp: 0.09,
      ribFreq: 1.7,
      noiseSpeed: 0.4,
      rotationSpeed: 0.18,
      backgroundColor: 0xb6b69e,
      metalness: 0.18,
      roughness: 0.4,
      transmission: 0.5,
      thickness: 0.4,
      clearcoat: 0.3,
      clearcoatRoughness: 0.25,
      envMapIntensity: 1.3,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true
    },
    Jealousy: {
      amplitude: 0.19,
      frequency: 1.7,
      bloom: 0.2,
      color: 0x228b22, // forest green
      modifier: 2,
      ribAmp: 0.11,
      ribFreq: 1.9,
      noiseSpeed: 0.6,
      rotationSpeed: 0.22,
      backgroundColor: 0xb6b69e,
      metalness: 0.2,
      roughness: 0.6,
      transmission: 0.3,
      thickness: 0.3,
      clearcoat: 0.2,
      clearcoatRoughness: 0.3,
      envMapIntensity: 1.2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true
    },
    Resentment: {
      amplitude: 0.17,
      frequency: 1.5,
      bloom: 0.15,
      color: 0x8b0000, // dark red
      modifier: 1,
      ribAmp: 0.1,
      ribFreq: 1.6,
      noiseSpeed: 0.5,
      rotationSpeed: 0.19,
      backgroundColor: 0xb6b69e,
      metalness: 0.17,
      roughness: 0.7,
      transmission: 0.2,
      thickness: 0.2,
      clearcoat: 0.15,
      clearcoatRoughness: 0.35,
      envMapIntensity: 1.1,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true
    },
    Schadenfreude: {
      amplitude: 0.16,
      frequency: 1.4,
      bloom: 0.18,
      color: 0xff69b4, // hot pink
      modifier: 2,
      ribAmp: 0.09,
      ribFreq: 1.8,
      noiseSpeed: 0.7,
      rotationSpeed: 0.21,
      backgroundColor: 0xb6b69e,
      metalness: 0.16,
      roughness: 0.5,
      transmission: 0.4,
      thickness: 0.3,
      clearcoat: 0.2,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true
    },
    Freudenfreude: {
      amplitude: 0.14,
      frequency: 1.2,
      bloom: 0.22,
      color: 0x00ced1, // dark turquoise
      modifier: 2,
      ribAmp: 0.07,
      ribFreq: 1.4,
      noiseSpeed: 0.6,
      rotationSpeed: 0.17,
      backgroundColor: 0xb6b69e,
      metalness: 0.14,
      roughness: 0.4,
      transmission: 0.5,
      thickness: 0.4,
      clearcoat: 0.25,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.2,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true
    },
    Boredom: {
      amplitude: 0.08,
      frequency: 0.7,
      bloom: 0.05,
      color: 0xcccccc, // light gray
      modifier: 0,
      ribAmp: 0.03,
      ribFreq: 1.1,
      noiseSpeed: 0.2,
      rotationSpeed: 0.05,
      backgroundColor: 0xb6b69e,
      metalness: 0.08,
      roughness: 0.8,
      transmission: 0.1,
      thickness: 0.1,
      clearcoat: 0.05,
      clearcoatRoughness: 0.4,
      envMapIntensity: 0.8,
      pointMode: false,
      pointSize: 0.03,
      useTexture: true
    }
  };

const params = {
  preset: 'Neutrality',
  amplitude: 0.08,
  frequency: 1.42,
  bloom: 0,
  noiseSpeed: 0.3,
  rotationSpeed: 0.2,
  color: 0xefffff,
  modifier: 0,
  ribAmp: 0,
  ribFreq: 1.0,
  backgroundColor: 0xb6b69e,
  metalness: 0.1,
  roughness: 0.35,
  transmission: 0.8,
  thickness: 0.4,
  clearcoat: 0.2,
  clearcoatRoughness: 0.1,
  envMapIntensity: 1.2,
  EMOTIONS: EMOTIONS
};

// Add transition state
const transitionState = {
  current: {},
  target: {},
  duration: 1.0, // seconds
  elapsed: 0,
  isTransitioning: false,
  currentColor: new THREE.Color(params.color),
  targetColor: new THREE.Color(params.color)
};

// Initialize transition state with current values
Object.keys(params).forEach(key => {
  if (typeof params[key] === 'number') {
    transitionState.current[key] = params[key];
    transitionState.target[key] = params[key];
  }
});

// Set initial background color
renderer.setClearColor(0xb6b69e);

const meshMaterial = createEmotionMaterial(params);
const pointsMaterial = new THREE.PointsMaterial({
  color: new THREE.Color(params.color),
  size: 0.03,
  sizeAttenuation: true,
  transparent: true,
  opacity: 0.8,
});

// Create the blob
let geometry = new PolarSphereGeometry(1, 64, 64);
const basePositions = geometry.attributes.position.array.slice(); // keep original positions
const noise = createNoise3D(); // use for displacement
const denseGeometry = createDensePointCloud(1, 50000);
const denseBasePositions = denseGeometry.attributes.position.array.slice(); // keep original positions for points
const mesh = new THREE.Mesh(geometry, meshMaterial);
mesh.position.set(0, 0, 0);
const points = new THREE.Points(denseGeometry, pointsMaterial);
points.position.set(0, 0, 0);
scene.add(mesh);
scene.add(points); // Add points to scene

// Move togglePointMode here, after points and mesh are created
function togglePointMode(enabled) {
  console.log('Toggling point mode:', enabled);
  params.pointMode = enabled;
  
  if (points) {
    points.visible = enabled;
  }
  if (mesh) {
    mesh.visible = !enabled;
  }
  
  if (enabled && pointsMaterial) {
    pointsMaterial.size = params.pointSize;
    pointsMaterial.needsUpdate = true;
  }
}

// Initialize params from the default preset AFTER objects are created
applyPreset('Neutrality');

function applyPreset(presetName) {
  console.log('Applying preset:', presetName);
  const preset = params.EMOTIONS[presetName];
  console.log('Preset data:', preset);
  
  if (preset) {
    // Start transition to new values
    transitionState.target = { ...preset };
    transitionState.elapsed = 0;
    transitionState.isTransitioning = true;
    
    // Set up color transition
    transitionState.currentColor.setHex(params.color);
    transitionState.targetColor.setHex(preset.color);
    
    // Update all parameters directly
    Object.keys(preset).forEach(key => {
      if (key in params) {
        params[key] = preset[key];
      }
    });
    
    // Explicitly toggle point mode with the preset value
    togglePointMode(preset.pointMode);
    
    // Update material properties
    if (meshMaterial) {
      meshMaterial.metalness = preset.metalness || params.metalness;
      meshMaterial.roughness = preset.roughness || params.roughness;
      meshMaterial.transmission = preset.transmission || params.transmission;
      meshMaterial.thickness = preset.thickness || params.thickness;
      meshMaterial.clearcoat = preset.clearcoat || params.clearcoat;
      meshMaterial.clearcoatRoughness = preset.clearcoatRoughness || params.clearcoatRoughness;
      meshMaterial.envMapIntensity = preset.envMapIntensity || params.envMapIntensity;
      meshMaterial.needsUpdate = true;
    }
    
    // Update point material if it exists
    if (pointsMaterial) {
      pointsMaterial.size = preset.pointSize || params.pointSize;
      pointsMaterial.needsUpdate = true;
    }
    
    // Force immediate update of all parameters
    params.noiseSpeed = preset.noiseSpeed || params.noiseSpeed;
    params.rotationSpeed = preset.rotationSpeed || params.rotationSpeed;
    params.pointSize = preset.pointSize || params.pointSize;
    params.useTexture = preset.useTexture || params.useTexture;
  }
}

// Helper Functions
function createDensePointCloud(radius, count) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const normals = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  
  for (let i = 0; i < count; i++) {
    // Generate random points on a sphere using spherical coordinates
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = radius;
    
    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    
    // Normalize the position to get the normal
    const length = Math.sqrt(x * x + y * y + z * z);
    normals[i * 3] = x / length;
    normals[i * 3 + 1] = y / length;
    normals[i * 3 + 2] = z / length;

    // Add UV coordinates
    uvs[i * 2] = theta / (Math.PI * 2);
    uvs[i * 2 + 1] = phi / Math.PI;
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  return geometry;
}

// Socket.io connection
const socket = io();  // Using the globally available io from the CDN script

// Session management
let isSessionActive = false;
let sessionEmotions = [];

// Show modal on load
const startSessionModal = document.getElementById('startSessionModal');
const startSessionBtn = document.getElementById('startSessionBtn');
const endSessionBtn = document.getElementById('endSessionBtn');

const logoDiv = document.querySelector('.logo');
// Hide logo and end session button by default
logoDiv.classList.add('hidden');
endSessionBtn.classList.add('hidden');

startSessionBtn.addEventListener('click', () => {
  startSessionModal.style.display = 'none';
  isSessionActive = true;
  sessionEmotions = [];
  updateSessionUI();
  recognition.start(); // Start mic automatically
  // Show logo and end session button
  logoDiv.classList.remove('hidden');
  endSessionBtn.classList.remove('hidden');
});

// Only show modal on load
window.addEventListener('DOMContentLoaded', () => {
  startSessionModal.style.display = 'flex';
  isSessionActive = false;
  updateSessionUI();
});

const sessionSummaryModal = document.getElementById('sessionSummaryModal');
const sessionSummaryText = document.getElementById('sessionSummaryText');
const closeSummaryModal = document.getElementById('closeSummaryModal');

endSessionBtn.addEventListener('click', () => {
  isSessionActive = false;
  updateSessionUI();
  applyPreset('Neutrality'); // Reset to neutral shape
  recognition.stop(); // Stop recognition when session ends
  // Hide logo and end session button
  logoDiv.classList.add('hidden');
  endSessionBtn.classList.add('hidden');
  // Close the last period
  const now = Date.now();
  if (lastEmotion !== null && lastEmotionStart !== null) {
    emotionPeriods.push({
      emotion: lastEmotion,
      start: lastEmotionStart,
      end: now
    });
  }
  // Filter out 'Neutrality' and 'neutrality'
  const filteredPeriods = emotionPeriods.filter(e => e.emotion.toLowerCase() !== 'neutrality');
  const emotionImagesRow = document.getElementById('emotionImagesRow');
  emotionImagesRow.innerHTML = '';
  if (filteredPeriods.length > 0) {
    // Sum durations
    const durations = {};
    let totalDuration = 0;
    filteredPeriods.forEach(period => {
      const duration = period.end - period.start;
      durations[period.emotion] = (durations[period.emotion] || 0) + duration;
      totalDuration += duration;
    });
    // Calculate percentages and build emotionDivs array
    const emotionDivs = Object.entries(durations).map(([emotion, duration]) => {
      const percent = ((duration / totalDuration) * 100).toFixed(1);
      const emotionDiv = document.createElement('div');
      emotionDiv.style.display = 'flex';
      emotionDiv.style.flexDirection = 'column';
      emotionDiv.style.alignItems = 'center';
      emotionDiv.style.margin = '0 18px';
      // Row for percent (left) and label (right)
      const labelRow = document.createElement('div');
      labelRow.style.display = 'flex';
      labelRow.style.flexDirection = 'row';
      labelRow.style.justifyContent = 'space-between';
      labelRow.style.width = '140px';
      labelRow.style.marginBottom = '8px';
      // Percent (left)
      const percentDiv = document.createElement('div');
      percentDiv.textContent = percent + '%';
      percentDiv.style.fontWeight = 'bold';
      percentDiv.style.fontSize = '1.2rem';
      percentDiv.style.textAlign = 'left';
      percentDiv.style.fontFamily = "'GT-Planar-Light-Trial', monospace";
      // Label (right)
      const labelDiv = document.createElement('div');
      labelDiv.textContent = emotion.toUpperCase();
      labelDiv.style.fontWeight = 'bold';
      labelDiv.style.fontSize = '1.2rem';
      labelDiv.style.textAlign = 'right';
      labelDiv.style.fontFamily = "'GT-Planar-Light-Trial', monospace";
      labelRow.appendChild(percentDiv);
      labelRow.appendChild(labelDiv);
      // Image
      const img = document.createElement('img');
      img.src = `assets/emotions/${emotion.toUpperCase()}1.png`;
      img.alt = emotion;
      img.style.width = '140px';
      img.style.height = '140px';
      img.style.objectFit = 'contain';
      img.style.borderRadius = '0';
      // No boxShadow
      emotionDiv.appendChild(labelRow);
      emotionDiv.appendChild(img);
      return emotionDiv;
    });
    // Split into rows if needed
    if (emotionDivs.length > 6) {
      const firstRow = document.createElement('div');
      firstRow.style.display = 'flex';
      firstRow.style.justifyContent = 'center';
      firstRow.style.alignItems = 'flex-end';
      emotionDivs.slice(0, 6).forEach(div => firstRow.appendChild(div));
      const secondRow = document.createElement('div');
      secondRow.style.display = 'flex';
      secondRow.style.justifyContent = 'center';
      secondRow.style.alignItems = 'flex-end';
      secondRow.style.marginTop = '24px';
      emotionDivs.slice(6).forEach(div => secondRow.appendChild(div));
      emotionImagesRow.appendChild(firstRow);
      emotionImagesRow.appendChild(secondRow);
    } else {
      // Single row as before
      emotionDivs.forEach(div => emotionImagesRow.appendChild(div));
    }
    sessionSummaryText.textContent = 'Emotions this session:';
  } else {
    sessionSummaryText.textContent = 'No emotions were detected this session.';
  }
  sessionSummaryModal.style.display = 'flex';
  // Reset for next session
  emotionPeriods = [];
  lastEmotion = null;
  lastEmotionStart = null;
});

closeSummaryModal.addEventListener('click', () => {
  sessionSummaryModal.style.display = 'none';
  startSessionModal.style.display = 'flex';
  sessionEmotions = [];
  isSessionActive = false;
  updateSessionUI();
  // Hide logo and end session button (will be shown again on next start)
  logoDiv.classList.add('hidden');
  endSessionBtn.classList.add('hidden');
});

function updateSessionUI() {
  if (isSessionActive) {
    endSessionBtn.disabled = false;
  } else {
    endSessionBtn.disabled = true;
  }
}

// Track full dialog and current emotion
let fullDialog = '';
let currentEmotion = 'neutrality';

// Debounce function for text input
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Helper to get last 7 words
function getLast7Words(text) {
  const words = text.trim().split(/\s+/);
  return words.slice(-7).join(' ');
}

// Handle text input
const debouncedAnalysis = debounce((text) => {
  if (!isSessionActive) return; // Only analyze if session is active
  if (text.length >= 5) {  // Only analyze if text is long enough
    // Update full dialog
    fullDialog = fullDialog ? fullDialog + ' ' + text : text;
    const latestStatement = getLast7Words(text);
    console.log("Sending for analysis:", { fullDialog, latestStatement, currentEmotion });
    fetch('/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullDialog, latestStatement, currentEmotion }),
    })
    .then(response => response.json())
    .then(data => {
      console.log("Received response:", data);
      if (data.sentiment) {
        currentEmotion = data.sentiment;
      }
    })
    .catch(error => console.error('Error:', error));
  }
}, 500);  // 500ms delay

// Handle incoming sentiment updates
let emotionPeriods = [];
let lastEmotion = null;
let lastEmotionStart = null;

socket.on('sentiment', (sentiment) => {
  console.log("Received sentiment from socket:", sentiment);
  // Update currentEmotion
  currentEmotion = sentiment;
  // Map sentiment to emotion preset
  let emotionPreset;
  switch(sentiment.toLowerCase()) {
    case 'neutrality':
      emotionPreset = 'Neutrality';
      break;
    case 'anxiety':
      emotionPreset = 'Anxiety';
      break;
    case 'fear':
      emotionPreset = 'Fear';
      break;
    case 'anger':
    case 'angry':
      emotionPreset = 'Anger';
      break;
    case 'sadness':
    case 'sad':
      emotionPreset = 'Sadness';
      break;
    case 'contentment':
      emotionPreset = 'Contentment';
      break;
    case 'curiosity':
      emotionPreset = 'Curiosity';
      break;
    case 'worry':
      emotionPreset = 'Worry';
      break;
    case 'vulnerability':
      emotionPreset = 'Vulnerability';
      break;
    case 'gratitude':
      emotionPreset = 'Gratitude';
      break;
    case 'envy':
      emotionPreset = 'Envy';
      break;
    case 'overwhelm':
      emotionPreset = 'Overwhelm';
      break;
    case 'joy':
    case 'happy':
      emotionPreset = 'Joy';
      break;
    case 'surprise':
      emotionPreset = 'Surprise';
      break;
    case 'love':
      emotionPreset = 'Love';
      break;
    case 'guilt':
      emotionPreset = 'Guilt';
      break;
    case 'disgust':
      emotionPreset = 'Disgust';
      break;
    case 'shame':
      emotionPreset = 'Shame';
      break;
    case 'embarrassment':
      emotionPreset = 'Embarrassment';
      break;
    case 'anticipation':
      emotionPreset = 'Anticipation';
      break;
    case 'contempt':
      emotionPreset = 'Contempt';
      break;
    case 'compassion':
      emotionPreset = 'Compassion';
      break;
    case 'affection':
      emotionPreset = 'Affection';
      break;
    case 'trust':
      emotionPreset = 'Trust';
      break;
    case 'respect':
      emotionPreset = 'Respect';
      break;
    case 'frustration':
      emotionPreset = 'Frustration';
      break;
    case 'dissapointment':
      emotionPreset = 'Dissapointment';
      break;
    case 'acceptance':
      emotionPreset = 'Acceptance';
      break;
    case 'nostalgia':
      emotionPreset = 'Nostalgia';
      break;
    case 'confusion':
      emotionPreset = 'Confusion';
      break;
    case 'pride':
      emotionPreset = 'Pride';
      break;
    case 'relief':
      emotionPreset = 'Relief';
      break;
    case 'despair':
      emotionPreset = 'Despair';
      break;
    case 'disappointment':
      emotionPreset = 'Disappointment';
      break;
    case 'awe':
      emotionPreset = 'Awe';
      break;
    case 'admiration':
      emotionPreset = 'Admiration';
      break;
    case 'stress':
      emotionPreset = 'Stress';
      break;
    default:
      console.log("No matching emotion found for sentiment:", sentiment);
      // Maintain current emotion instead of defaulting to Neutrality
      return;
  }
  
  console.log("Mapped to emotion preset:", emotionPreset);
  // Track emotion periods (exclude repeats)
  const now = Date.now();
  if (lastEmotion !== null && lastEmotionStart !== null) {
    // Only push if emotion actually changed
    if (lastEmotion !== emotionPreset) {
      emotionPeriods.push({
        emotion: lastEmotion,
        start: lastEmotionStart,
        end: now
      });
      lastEmotion = emotionPreset;
      lastEmotionStart = now;
    }
  } else {
    lastEmotion = emotionPreset;
    lastEmotionStart = now;
  }
  // Apply the emotion preset
  applyPreset(emotionPreset);
  if (!emotionPreset) return;
  if (isSessionActive) {
    // Only add if not a repeat of the last
    if (sessionEmotions.length === 0 || sessionEmotions[sessionEmotions.length - 1] !== emotionPreset) {
      sessionEmotions.push(emotionPreset);
    }
  }
});

// Animation
function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  const time = clock.getElapsedTime();

  // Handle transitions
  if (transitionState.isTransitioning) {
    transitionState.elapsed += dt;
    const progress = Math.min(transitionState.elapsed / transitionState.duration, 1.0);
    
    // Smooth easing function
    const eased = progress < 0.5 
      ? 2 * progress * progress 
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    // Interpolate all numeric parameters
    Object.keys(transitionState.target).forEach(key => {
      if (typeof transitionState.target[key] === 'number') {
        params[key] = transitionState.current[key] + 
          (transitionState.target[key] - transitionState.current[key]) * eased;
      }
    });
    
    // Interpolate color
    const currentColor = transitionState.currentColor;
    const targetColor = transitionState.targetColor;
    const interpolatedColor = new THREE.Color();
    interpolatedColor.r = currentColor.r + (targetColor.r - currentColor.r) * eased;
    interpolatedColor.g = currentColor.g + (targetColor.g - currentColor.g) * eased;
    interpolatedColor.b = currentColor.b + (targetColor.b - currentColor.b) * eased;
    
    // Update materials with interpolated color
    if (meshMaterial) {
      meshMaterial.color.copy(interpolatedColor);
      meshMaterial.needsUpdate = true;
    }
    if (pointsMaterial) {
      pointsMaterial.color.copy(interpolatedColor);
      pointsMaterial.needsUpdate = true;
    }
    
    // Check if transition is complete
    if (progress >= 1.0) {
      transitionState.isTransitioning = false;
      transitionState.current = { ...transitionState.target };
      transitionState.currentColor.copy(transitionState.targetColor);
    }
  }

  // Update grain shader time only
  grainPass.uniforms.time.value = time;

  const positions = geometry.attributes.position.array;
  for (let i = 0; i < positions.length; i += 3) {
    let x = basePositions[i];
    let y = basePositions[i + 1];
    let z = basePositions[i + 2];
  
    const n = noise(
      x * params.frequency,
      y * params.frequency,
      z * params.frequency + time * params.noiseSpeed
    );
  
    const r = Math.sqrt(x * x + y * y + z * z);
    let displacement = n * params.amplitude;
    
    // Calculate base position with noise displacement
    const amp = 1 + displacement;
    positions[i] = x * amp;
    positions[i + 1] = y * amp;
    positions[i + 2] = z * amp;

    // Apply modifiers to the final positions
    if (Number(params.modifier) === 2) { // Ribs
      // Apply strong ribbing effect directly to positions
      const ribbing = Math.sin(y * params.ribFreq * 5.0 + time * 2.0) * params.ribAmp;
      positions[i] *= (1.0 + ribbing);
      positions[i + 2] *= (1.0 + ribbing);
    }
    else if (Number(params.modifier) === 1) { // Droopy
      // Apply stronger drooping effect
      const falloff = Math.pow((y + 1.0) * 0.5, 2.0); // Quadratic falloff from top to bottom
      positions[i + 1] -= falloff * 0.5; // Stronger downward pull
      // Add slight squishing
      positions[i] *= 1.0 + falloff * 0.2;
      positions[i + 2] *= 1.0 + falloff * 0.2;
    }
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.computeVertexNormals();

  // Update points with the same modifications
  const pointPositions = denseGeometry.attributes.position.array;
  for (let i = 0; i < pointPositions.length; i += 3) {
    let x = denseBasePositions[i];
    let y = denseBasePositions[i + 1];
    let z = denseBasePositions[i + 2];

    const n = noise(
      x * params.frequency,
      y * params.frequency,
      z * params.frequency + time * params.noiseSpeed
    );

    const r = Math.sqrt(x * x + y * y + z * z);
    let displacement = n * params.amplitude;
    
    // Calculate base position with noise displacement
    const amp = 1 + displacement;
    pointPositions[i] = x * amp;
    pointPositions[i + 1] = y * amp;
    pointPositions[i + 2] = z * amp;

    // Apply modifiers to the final positions
    if (Number(params.modifier) === 2) { // Ribs
      // Apply strong ribbing effect directly to positions
      const ribbing = Math.sin(y * params.ribFreq * 5.0 + time * 2.0) * params.ribAmp;
      pointPositions[i] *= (1.0 + ribbing);
      pointPositions[i + 2] *= (1.0 + ribbing);
    }
    else if (Number(params.modifier) === 1) { // Droopy
      // Apply stronger drooping effect
      const falloff = Math.pow((y + 1.0) * 0.5, 2.0); // Quadratic falloff from top to bottom
      pointPositions[i + 1] -= falloff * 0.5; // Stronger downward pull
      // Add slight squishing
      pointPositions[i] *= 1.0 + falloff * 0.2;
      pointPositions[i + 2] *= 1.0 + falloff * 0.2;
    }
  }

  denseGeometry.attributes.position.needsUpdate = true;

  mesh.rotation.y += params.rotationSpeed * dt;
  points.rotation.y += params.rotationSpeed * dt;
  controls.update();
  composer.render();
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Save emotion controls
const saveControls = {
  newEmotionName: '',
  saveEmotion: function() {
    const emotionName = this.newEmotionName.trim();
    if (emotionName === '') {
      alert('Please enter an emotion name');
      return;
    }
    
    // Create new emotion preset from current parameters
    const newEmotion = {
      amplitude: Number(params.amplitude),
      frequency: Number(params.frequency),
      bloom: Number(params.bloom),
      color: Number(params.color),
      modifier: Number(params.modifier),
      ribAmp: Number(params.ribAmp),
      ribFreq: Number(params.ribFreq),
      noiseSpeed: Number(params.noiseSpeed),
      rotationSpeed: Number(params.rotationSpeed),
      backgroundColor: Number(params.backgroundColor),
      metalness: Number(params.metalness),
      roughness: Number(params.roughness),
      transmission: Number(params.transmission),
      thickness: Number(params.thickness),
      clearcoat: Number(params.clearcoat),
      clearcoatRoughness: Number(params.clearcoatRoughness),
      envMapIntensity: Number(params.envMapIntensity),
      pointMode: Boolean(params.pointMode),
      pointSize: Number(params.pointSize),
      useTexture: Boolean(params.useTexture)
    };
    
    // Add to EMOTIONS object
    params.EMOTIONS[emotionName] = newEmotion;
    
    // Set as current preset
    params.preset = emotionName;
    
    // Update preset dropdown by recreating it
    presetController = updatePresetController();
    
    // Save to localStorage for persistence
    localStorage.setItem('customEmotions', JSON.stringify(params.EMOTIONS));
    
    // Update emotion list
    updateEmotionList(params, applyPreset);
    
    console.log('Saved emotion:', emotionName, newEmotion);
    
    // Apply the preset immediately
    if (typeof applyPreset === 'function') {
      applyPreset(emotionName);
    }

    // Clear input last
    this.newEmotionName = '';
    emotionNameController.updateDisplay();
  },
};

// Create a new SpeechRecognition object
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

// Buffer for finalized speech
let finalTranscript = '';

// Configure for continuous, in‑flight results
recognition.lang            = 'en-US';
recognition.continuous      = true;
recognition.interimResults  = true;

// Handle both interim and final results
recognition.onresult = (event) => {
  let interimTranscript = '';

  for (let i = event.resultIndex; i < event.results.length; i++) {
    const res        = event.results[i];
    const transcript = res[0].transcript;

    if (res.isFinal) {
      finalTranscript += transcript + ' ';
      debouncedAnalysis(finalTranscript);
    } else {
      interimTranscript += transcript;
    }
  }

  // Update the input with committed + live text
  textInput.value = finalTranscript + interimTranscript;
};

recognition.onstart = () => {
  micButton.textContent = 'Listening…';
};

recognition.onend = () => {
  micButton.textContent = '🎤';
  if (isSessionActive) recognition.start();
};

micButton.addEventListener('click', () => recognition.start());
