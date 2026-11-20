// The FBX reader, built as its own small file (www/fbx.js) and only loaded when someone picks an FBX model:
// most players never do. It uses the game's own copy of three.js (handed over in render/models/imported.ts),
// so nothing is duplicated and the models it makes are the game's kind of objects.
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
(window as unknown as { __ccFBX: typeof FBXLoader }).__ccFBX = FBXLoader;
