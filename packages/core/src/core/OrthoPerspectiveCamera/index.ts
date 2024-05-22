import * as THREE from "three";
import { Components } from "../Components";
import { SimpleCamera } from "..";

import {
  NavigationMode,
  NavModeID,
  ProjectionManager,
  OrbitMode,
  FirstPersonMode,
  PlanMode,
} from "./src";

export * from "./src";

/**
 * A flexible camera that uses
 * [yomotsu's cameracontrols](https://github.com/yomotsu/camera-controls) to
 * easily control the camera in 2D and 3D. It supports multiple navigation
 * modes, such as 2D floor plan navigation, first person and 3D orbit.
 */
export class OrthoPerspectiveCamera extends SimpleCamera {
  /**
   * The current {@link NavigationMode}.
   */
  _mode: NavigationMode | null = null;

  readonly projection: ProjectionManager;

  readonly threeOrtho: THREE.OrthographicCamera;

  readonly threePersp: THREE.PerspectiveCamera;

  protected readonly _userInputButtons: any = {};

  protected readonly _frustumSize = 50;

  protected readonly _navigationModes = new Map<NavModeID, NavigationMode>();

  get mode() {
    if (!this._mode) {
      throw new Error("Mode not found, camera not initialized");
    }
    return this._mode;
  }

  constructor(components: Components) {
    super(components);
    this.threePersp = this.three as THREE.PerspectiveCamera;
    this.threeOrtho = this.newOrthoCamera();
    this.projection = new ProjectionManager(this);

    this.onAspectUpdated.add(() => {
      this.setOrthoCameraAspect();
    });

    this.projection.onChanged.add(
      (camera: THREE.PerspectiveCamera | THREE.OrthographicCamera) => {
        this.three = camera;
      },
    );

    this.onWorldChanged.add(() => {
      this._navigationModes.clear();
      this._navigationModes.set("Orbit", new OrbitMode(this));
      this._navigationModes.set("FirstPerson", new FirstPersonMode(this));
      this._navigationModes.set("Plan", new PlanMode(this));
      this._mode = this._navigationModes.get("Orbit")!;
      this.mode.set(true, { preventTargetAdjustment: true });
    });
  }

  /** {@link Disposable.dispose} */
  dispose() {
    super.dispose();
    this.threeOrtho.removeFromParent();
  }

  /**
   * Sets a new {@link NavigationMode} and disables the previous one.
   *
   * @param mode - The {@link NavigationMode} to set.
   */
  set(mode: NavModeID) {
    if (this.mode === null) return;
    if (this.mode.id === mode) return;
    this.mode.set(false);
    if (!this._navigationModes.has(mode)) {
      throw new Error("The specified mode does not exist!");
    }
    this._mode = this._navigationModes.get(mode)!;
    this.mode.set(true);
  }

  /**
   * Make the camera view fit all the specified meshes.
   *
   * @param meshes the meshes to fit. If it is not defined, it will
   * evaluate {@link Components.meshes}.
   * @param offset the distance to the fit object
   */
  async fit(meshes: Iterable<THREE.Mesh>, offset = 1.5) {
    if (!this.enabled) return;

    const maxNum = Number.MAX_VALUE;
    const minNum = Number.MIN_VALUE;
    const min = new THREE.Vector3(maxNum, maxNum, maxNum);
    const max = new THREE.Vector3(minNum, minNum, minNum);

    for (const mesh of meshes) {
      const box = new THREE.Box3().setFromObject(mesh);
      if (box.min.x < min.x) min.x = box.min.x;
      if (box.min.y < min.y) min.y = box.min.y;
      if (box.min.z < min.z) min.z = box.min.z;
      if (box.max.x > max.x) max.x = box.max.x;
      if (box.max.y > max.y) max.y = box.max.y;
      if (box.max.z > max.z) max.z = box.max.z;
    }

    const box = new THREE.Box3(min, max);

    const sceneSize = new THREE.Vector3();
    box.getSize(sceneSize);
    const sceneCenter = new THREE.Vector3();
    box.getCenter(sceneCenter);
    const radius = Math.max(sceneSize.x, sceneSize.y, sceneSize.z) * offset;
    const sphere = new THREE.Sphere(sceneCenter, radius);
    await this.controls.fitToSphere(sphere, true);
  }

  /**
   * Allows or prevents all user input.
   *
   * @param active - whether to enable or disable user inputs.
   */
  setUserInput(active: boolean) {
    if (active) {
      this.enableUserInput();
    } else {
      this.disableUserInput();
    }
  }

  private disableUserInput() {
    this._userInputButtons.left = this.controls.mouseButtons.left;
    this._userInputButtons.right = this.controls.mouseButtons.right;
    this._userInputButtons.middle = this.controls.mouseButtons.middle;
    this._userInputButtons.wheel = this.controls.mouseButtons.wheel;
    this.controls.mouseButtons.left = 0;
    this.controls.mouseButtons.right = 0;
    this.controls.mouseButtons.middle = 0;
    this.controls.mouseButtons.wheel = 0;
  }

  private enableUserInput() {
    if (Object.keys(this._userInputButtons).length === 0) return;
    this.controls.mouseButtons.left = this._userInputButtons.left;
    this.controls.mouseButtons.right = this._userInputButtons.right;
    this.controls.mouseButtons.middle = this._userInputButtons.middle;
    this.controls.mouseButtons.wheel = this._userInputButtons.wheel;
  }

  private newOrthoCamera() {
    const aspect = window.innerWidth / window.innerHeight;
    return new THREE.OrthographicCamera(
      (this._frustumSize * aspect) / -2,
      (this._frustumSize * aspect) / 2,
      this._frustumSize / 2,
      this._frustumSize / -2,
      0.1,
      1000,
    );
  }

  private setOrthoCameraAspect() {
    if (!this.currentWorld || !this.currentWorld.renderer) {
      return;
    }

    const lineOfSight = new THREE.Vector3();
    this.threePersp.getWorldDirection(lineOfSight);
    const target = new THREE.Vector3();
    this.controls.getTarget(target);
    const distance = target.clone().sub(this.threePersp.position);

    const depth = distance.dot(lineOfSight);
    const dims = this.currentWorld.renderer.getSize();
    const aspect = dims.x / dims.y;
    const camera = this.threePersp;
    const height = depth * 2 * Math.atan((camera.fov * (Math.PI / 180)) / 2);
    const width = height * aspect;

    this.threeOrtho.zoom = 1;
    this.threeOrtho.left = width / -2;
    this.threeOrtho.right = width / 2;
    this.threeOrtho.top = height / 2;
    this.threeOrtho.bottom = height / -2;
    this.threeOrtho.updateProjectionMatrix();
  }
}
