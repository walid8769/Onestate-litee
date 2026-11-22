import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';
import { KTX2Loader } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/libs/meshopt_decoder.module.js';
import { clone as cloneSkeleton } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/utils/SkeletonUtils.js';

// Casual Walker by tevy — CC0 1.0; rigged humanoid with idle, walk, wave and look-around clips.
// https://tevy.dev/models/casual-walker
const AVATAR_MODELS = {
  casual: { local: 'https://tevy.dev/models/casual-walker/v1/lod0.glb', remote: 'https://tevy.dev/models/casual-walker/v1/lod1.glb' },
  hiker: { local: 'https://tevy.dev/models/hiker/v1/lod0.glb', remote: 'https://tevy.dev/models/hiker/v1/lod1.glb' },
  roadWorker: { local: 'https://tevy.dev/models/road-worker/v1/lod0.glb', remote: 'https://tevy.dev/models/road-worker/v1/lod1.glb' },
  dogWalker: { local: 'https://tevy.dev/models/dog-walker/v1/lod0.glb', remote: 'https://tevy.dev/models/dog-walker/v1/lod1.glb' }
};
const loader = new GLTFLoader();
let loaderConfigured = false;
const modelPromises = new Map();
function configureAvatarLoader(renderer) {
  if (loaderConfigured) return;
  const ktx2 = new KTX2Loader().setTranscoderPath('https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/libs/basis/').detectSupport(renderer);
  loader.setKTX2Loader(ktx2);
  loader.setMeshoptDecoder(MeshoptDecoder);
  loaderConfigured = true;
}

function getModel(remote = false, variant = 'casual') {
  const files = AVATAR_MODELS[variant] || AVATAR_MODELS.casual;
  const url = remote ? files.remote : files.local;
  if (modelPromises.has(url)) return modelPromises.get(url);
  const request = loader.loadAsync(url).catch(error => {
    modelPromises.delete(url);
    throw error;
  });
  modelPromises.set(url, request);
  return request;
}
function findClip(clips, expression, fallbackIndex=0) {
  return clips.find(c => expression.test(c.name)) || clips[fallbackIndex] || null;
}
export async function upgradeAvatar(root, renderer, variant = 'casual') {
  if (root.userData.avatarLoading || root.userData.realAvatarLoaded) return;
  if (!renderer) { root.userData.avatarLoadError = 'Renderer unavailable'; return; }
  configureAvatarLoader(renderer);
  root.userData.avatarLoading = true;
  try {
    const gltf = await getModel(!!root.userData.remote, variant);
    const model = cloneSkeleton(gltf.scene);
    model.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = !root.userData.remote;
      node.receiveShadow = !root.userData.remote;
    });

    // Normalize unknown GLB authoring scale and origin so feet sit on the street.
    model.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const height = Math.max(size.y, 0.01);
    model.scale.setScalar(2.02 / height);
    model.updateMatrixWorld(true);
    const normalized = new THREE.Box3().setFromObject(model);
    const center = normalized.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= normalized.min.y;

    // Keep the procedural avatar visible until the complete model is ready.
    for (const child of [...root.children]) {
      if (child === root.userData.nameTag) continue;
      root.remove(child);
      child.traverse?.(node => {
        node.geometry?.dispose?.();
        if (Array.isArray(node.material)) node.material.forEach(m => m.dispose?.());
        else node.material?.dispose?.();
      });
    }
    root.add(model);

    const mixer = new THREE.AnimationMixer(model);
    const clips = gltf.animations || [];
    const idle = findClip(clips, /idle/i, 0);
    const walk = findClip(clips, /walk/i, 1);
    // The CC0 civilian rigs ship idle/walk/wave/look-around, not a run clip.
    // Never fall back to clip index 2: that is the wave animation and made sprinting look broken.
    const run = findClip(clips, /run/i) || walk;
    const actions = { idle, walk, run };
    const active = { action: null };
    const setState = (state, speedMultiplier = (state === 'run' ? (run === walk ? 5.4 : 4.1) : state === 'walk' ? 2.9 : 1)) => {
      const clip = actions[state] || idle;
      if (!clip) return;
      const next = mixer.clipAction(clip);
      next.timeScale = speedMultiplier;
      if (active.action !== next) {
        next.reset().fadeIn(.2).play();
        active.action?.fadeOut(.2);
        active.action = next;
      }
    };
    root.userData.avatarMixer = mixer;
    root.userData.setAvatarState = setState;
    root.userData.realAvatarLoaded = true;
    setState('idle');
  } catch (error) {
    console.warn('[OneState Lite] Character model failed to load; using built-in avatar.', error);
    root.userData.avatarLoadError = String(error?.message || error);
  } finally {
    root.userData.avatarLoading = false;
  }
}
export function updateAvatar(root, state, delta, speedMultiplier) {
  root.userData.avatarMixer?.update(delta);
  root.userData.setAvatarState?.(state, speedMultiplier);
}
