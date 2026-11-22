import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/utils/SkeletonUtils.js';

// Licensed, animated game-ready character by vinish.dev (CC BY 4.0).
// Source and required attribution: https://vinish.dev/free-3d-models/people
const MODEL_URL = 'https://models.vinish.dev/people/casual-man.glb';
const loader = new GLTFLoader();
let modelPromise;
function getModel() {
  if (!modelPromise) modelPromise = loader.loadAsync(MODEL_URL);
  return modelPromise;
}
function findClip(clips, expression, fallbackIndex=0) {
  return clips.find(c => expression.test(c.name)) || clips[fallbackIndex] || null;
}
export async function upgradeAvatar(root) {
  try {
    const gltf = await getModel();
    const model = cloneSkeleton(gltf.scene);
    model.traverse(node => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        if (Array.isArray(node.material)) node.material = node.material.map(m => m.clone());
        else if (node.material) node.material = node.material.clone();
      }
    });
    // Remove the procedural placeholder only after the real model has loaded.
    for (const child of [...root.children]) {
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
    const run = findClip(clips, /run/i, 2);
    const actions = { idle, walk, run };
    const active = { action: null };
    const setState = state => {
      const clip = actions[state] || idle;
      if (!clip) return;
      const next = mixer.clipAction(clip);
      if (active.action !== next) {
        next.reset().fadeIn(.18).play();
        active.action?.fadeOut(.18);
        active.action = next;
      }
    };
    root.userData.avatarMixer = mixer;
    root.userData.setAvatarState = setState;
    setState('idle');
    root.userData.realAvatarLoaded = true;
  } catch (error) {
    console.warn('Real character asset could not be loaded; keeping fallback avatar.', error);
  }
}
export function updateAvatar(root, state, delta) {
  root.userData.avatarMixer?.update(delta);
  root.userData.setAvatarState?.(state);
}
