import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'https://cdn.jsdelivr.net/npm/three@0.161.0/examples/jsm/utils/SkeletonUtils.js';

// Casual Man by vinish.dev — CC BY 4.0
// https://vinish.dev/free-3d-models/people
const MODEL_URL = 'https://models.vinish.dev/people/casual-man.glb';
const loader = new GLTFLoader();
let modelPromise;

function getModel() {
  if (!modelPromise) {
    modelPromise = loader.loadAsync(MODEL_URL).catch(error => {
      modelPromise = null; // permit a later retry after a transient network failure
      throw error;
    });
  }
  return modelPromise;
}
function findClip(clips, expression, fallbackIndex=0) {
  return clips.find(c => expression.test(c.name)) || clips[fallbackIndex] || null;
}
export async function upgradeAvatar(root) {
  if (root.userData.avatarLoading || root.userData.realAvatarLoaded) return;
  root.userData.avatarLoading = true;
  try {
    const gltf = await getModel();
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
    model.scale.setScalar(1.82 / height);
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
    const run = findClip(clips, /run/i, 2);
    const actions = { idle, walk, run };
    const active = { action: null };
    const setState = state => {
      const clip = actions[state] || idle;
      if (!clip) return;
      const next = mixer.clipAction(clip);
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
export function updateAvatar(root, state, delta) {
  root.userData.avatarMixer?.update(delta);
  root.userData.setAvatarState?.(state);
}
