import * as THREE from 'three'
import type { BenchHandlers, BenchSnapshot, Tag } from './types'
import {
  block,
  brushed,
  labelTexture,
  makeCable,
  makeCooler,
  makeCpu,
  makePlug,
  makeRobot,
  makeScrew,
  makeWheels,
  metal,
  plastic,
  rubber,
  sit,
  tag,
  trayMesh,
} from './meshes'

type Drag = {
  obj: THREE.Object3D
  plane: THREE.Plane
  offset: THREE.Vector3
  home: THREE.Vector3
  data: Tag
}

type Tween = {
  obj: THREE.Object3D
  start: THREE.Vector3
  home: THREE.Vector3
  t: number
}

type Frame = { target: THREE.Vector3; radius: number; phi: number; theta: number; yaw: number }

const _ndc = new THREE.Vector2()
const _hit = new THREE.Vector3()
const _world = new THREE.Vector3()

function signature(snapshot: BenchSnapshot) {
  return JSON.stringify({
    mode: snapshot.mode,
    assembly: snapshot.assembly,
    interact: snapshot.interact,
    tray: snapshot.tray.map((item) => item.key),
    hot: snapshot.hot,
    focusId: snapshot.focusId,
    wear: snapshot.parts.map((part) => [part.uid, part.durability]),
    deny: snapshot.denyUids,
  })
}

function frameFor(snapshot: BenchSnapshot): Frame {
  const job = snapshot.mode === 'repair' && snapshot.interact.type !== 'idle'
  if (snapshot.mode === 'pit') return { target: new THREE.Vector3(0.25, 0.72, 0), radius: 2.7, phi: 1.12, theta: 0.4, yaw: 0.45 }
  if (snapshot.interact.type === 'paste' && snapshot.mode === 'build') return { target: new THREE.Vector3(0.28, 0.76, 0.2), radius: 1.2, phi: 1.28, theta: 0.02, yaw: 0 }
  if (snapshot.interact.type === 'screw' && snapshot.mode === 'build') return { target: new THREE.Vector3(0.28, 0.2, 0.12), radius: 1.75, phi: 1.02, theta: 0.25, yaw: 0.15 }
  if (snapshot.interact.type === 'cable') return { target: new THREE.Vector3(0.05, 0.66, 0.05), radius: 2.15, phi: 1.12, theta: -0.45, yaw: -0.45 }
  if (snapshot.interact.type === 'boot') return { target: new THREE.Vector3(0.28, 1.16, 0.08), radius: 1.45, phi: 1.18, theta: 0.12, yaw: 0.1 }
  if (job) return { target: new THREE.Vector3(0.05, 0.28, 0.9), radius: 1.65, phi: 0.9, theta: 0.12, yaw: 0.2 }
  if (snapshot.mode === 'repair') return { target: new THREE.Vector3(0.15, 0.72, 0.1), radius: 3.55, phi: 1.08, theta: 0.28, yaw: 0.35 }
  return { target: new THREE.Vector3(-0.05, 0.7, 0.05), radius: 4.05, phi: 1.1, theta: 0.18, yaw: 0.32 }
}

function interactKey(snapshot: BenchSnapshot) {
  return `${snapshot.mode}:${JSON.stringify(snapshot.interact)}`
}

export class BenchSession {
  private readonly renderer: THREE.WebGLRenderer
  private readonly scene = new THREE.Scene()
  private readonly camera: THREE.PerspectiveCamera
  private readonly raycaster = new THREE.Raycaster()
  private readonly dynamic = new THREE.Group()
  private readonly permanent = new Map<string, THREE.Object3D>()
  private anchors = new Map<string, THREE.Object3D>()
  private snapshot: BenchSnapshot | null = null
  private queued: BenchSnapshot | null = null
  private sign = ''
  private interactKey = ''
  private frameId = 0
  private interactive = true
  private radius = 4.05
  private phi = 1.1
  private theta = 0.18
  private yaw = 0.32
  private target = new THREE.Vector3(-0.05, 0.7, 0.05)
  private desired = frameFor({
    mode: 'build',
    parts: [],
    assembly: {
      processorUid: null, paste: 0, cooled: false, wheelUid: null, wheelBolts: 0, materialUid: null, osUid: null,
      gpuUid: null, gpuSkipped: false, gpuWired: false, weaponUids: [], wiredUids: [], weaponsPlaced: false,
      wheelsMounted: false, osInstalled: false, plates: 0, covered: 0,
    },
    interact: { type: 'idle' },
    tray: [],
    hot: [],
    denyUids: [],
    focusId: null,
  })
  private userAimed = false
  private drag: Drag | null = null
  private tween: Tween | null = null
  private orbiting = false
  private painting = false
  private suppress = false
  private lastX = 0
  private lastY = 0
  private pointer = { x: 0, y: 0 }
  private screwing: { index: number; last: number; total: number; obj: THREE.Object3D; baseY: number } | null = null
  private stroking: { started: boolean; max: number } | null = null
  private tight = new Set<number>()
  private smearSent = false
  private cells = new Uint8Array(64)
  private paintCanvas: HTMLCanvasElement | null = null
  private paintTone: 'fresh' | 'grime' | 'clean' = 'fresh'
  private hover: THREE.Object3D | null = null
  private hoverScale = 1
  private cable: THREE.Mesh | null = null
  private plug: THREE.Object3D | null = null
  private cableFrom = new THREE.Vector3()
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  constructor(private readonly canvas: HTMLCanvasElement, private readonly handlers: BenchHandlers) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    this.renderer.setClearColor(0x12161c)
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.28
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.08, 40)
    this.scene.add(this.dynamic)
    this.buildRoom()
    this.resize()
    this.applyCamera()
    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointerup', this.onUp)
    canvas.addEventListener('pointercancel', this.onUp)
    canvas.addEventListener('wheel', this.onWheel, { passive: false })
    canvas.addEventListener('contextmenu', this.onMenu)
    this.observer = new ResizeObserver(() => this.resize())
    this.observer.observe(canvas)
    this.frameId = requestAnimationFrame(this.animate)
  }

  private observer: ResizeObserver

  setInteractive(on: boolean) {
    this.interactive = on
  }

  setSnapshot(snapshot: BenchSnapshot) {
    this.snapshot = snapshot
    if (this.drag || this.painting || this.screwing || this.stroking || this.tween || this.suppress) {
      this.queued = snapshot
      return
    }
    if (signature(snapshot) !== this.sign) this.rebuild(snapshot)
  }

  dispose() {
    cancelAnimationFrame(this.frameId)
    this.observer.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onDown)
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointerup', this.onUp)
    this.canvas.removeEventListener('pointercancel', this.onUp)
    this.canvas.removeEventListener('wheel', this.onWheel)
    this.canvas.removeEventListener('contextmenu', this.onMenu)
    this.clearDynamic()
    this.renderer.dispose()
  }

  private buildRoom() {
    this.scene.background = new THREE.Color(0x1b232d)
    const hemi = new THREE.HemisphereLight(0xe7eef8, 0x3a3428, 1.7)
    const key = new THREE.DirectionalLight(0xfff4e4, 5.5)
    key.position.set(1.6, 4.4, 4.2)
    key.castShadow = true
    key.shadow.mapSize.set(1024, 1024)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 18
    key.shadow.camera.left = -4
    key.shadow.camera.right = 4
    key.shadow.camera.top = 4
    key.shadow.camera.bottom = -4
    const rim = new THREE.DirectionalLight(0xb7d4ff, 2.2)
    rim.position.set(-3.2, 2.4, 2)
    const lamp = new THREE.PointLight(0xffd2a2, 36, 8, 2)
    lamp.position.set(0.2, 1.45, 1.1)
    this.scene.add(hemi, key, rim, lamp)

    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1e24, roughness: 0.96, metalness: 0.04 })
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 18), floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.08
    floor.receiveShadow = true
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(12, 5), new THREE.MeshStandardMaterial({ color: 0x1c242e, roughness: 0.92 }))
    wall.position.set(0, 2.2, -1.8)
    wall.receiveShadow = true

    const tableMat = metal(0x3a424c, 0.46, 0.55)
    const grain = brushed('#3a424c')
    if (grain) tableMat.map = grain
    const table = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.1, 2.55), tableMat)
    table.position.set(0.15, -0.05, 0.08)
    table.receiveShadow = true
    table.castShadow = true

    const pad = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.018, 0.85), rubber(0x242018))
    pad.position.set(0.32, 0.012, 0.05)
    const repairPad = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.02, 0.62), rubber(0x1a2740))
    repairPad.position.set(0.05, 0.02, 0.95)
    const pan = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.04, 1.85), metal(0x2a3138, 0.5, 0.6))
    pan.position.set(-1.55, 0.02, 0.15)

    const bin = new THREE.Group()
    const binMat = metal(0x2a2420, 0.55, 0.45)
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.04, 0.36), binMat)
    const front = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.22, 0.03), binMat)
    front.position.set(0, 0.11, 0.18)
    const back = front.clone()
    back.position.z = -0.18
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.22, 0.36), binMat)
    left.position.set(-0.22, 0.11, 0)
    const right = left.clone()
    right.position.x = 0.22
    const labelMap = labelTexture('SCRAP', '#6a2a22', '#f4e2c4')
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.12), new THREE.MeshBasicMaterial({ map: labelMap, transparent: true }))
    label.position.set(0, 0.12, 0.2)
    bin.add(bottom, front, back, left, right, label)
    bin.position.set(1.62, 0, 0.42)
    const binAnchor = new THREE.Object3D()
    binAnchor.position.set(1.62, 0.2, 0.42)
    const matAnchor = new THREE.Object3D()
    matAnchor.position.set(0.05, 0.18, 0.95)
    this.scene.add(floor, wall, table, pad, repairPad, pan, bin, binAnchor, matAnchor)
    this.permanent.set('bin', binAnchor)
    this.permanent.set('mat', matAnchor)

    const shade = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.05, 0.16), metal(0x15181c, 0.4, 0.5))
    shade.position.set(0.2, 1.78, 0.35)
    this.scene.add(shade)
  }

  private rebuild(snapshot: BenchSnapshot) {
    const key = interactKey(snapshot)
    if (key !== this.interactKey) {
      this.userAimed = false
      this.tight.clear()
      this.smearSent = false
      this.interactKey = key
      this.desired = frameFor(snapshot)
    }
    this.clearDynamic()
    this.anchors = new Map(this.permanent)
    for (const anchor of this.permanent.values()) {
      const old = anchor.children.find((child) => child.name === 'highlight')
      if (old) anchor.remove(old)
    }

    const robot = makeRobot(snapshot.parts, snapshot.assembly)
    robot.rotation.y = this.yaw
    robot.position.set(0.28, 0, 0)
    this.dynamic.add(robot)
    robot.traverse((child) => {
      if (this.anchors.has(child.name) || this.permanent.has(child.name)) return
      if (['processor', 'cooler', 'axle', 'weapon', 'gpu', 'gpu-port', 'psu', 'os', 'plate-1', 'plate-2', 'plate-4', 'plate-8'].includes(child.name)) {
        this.anchors.set(child.name, child)
      }
    })

    this.decorateRobot(snapshot, robot)
    this.buildTray(snapshot)
    this.buildJob(snapshot)
    this.markHot(snapshot)
    if (snapshot.interact.type === 'paste') this.preparePaste(snapshot.interact.tone)
    if (snapshot.interact.type === 'mat-gpu' && snapshot.interact.phase === 'scrub') this.preparePaste('clean')
    this.sign = signature(snapshot)
    this.snapshot = snapshot
  }

  private decorateRobot(snapshot: BenchSnapshot, robot: THREE.Group) {
    const worn = new Map(snapshot.parts.map((part) => [part.uid, part.durability]))
    if (snapshot.mode === 'repair' && snapshot.interact.type === 'idle') {
      robot.traverse((child) => {
        const data = child.userData as Tag
        if (!data.role || !data.uid || child.parent !== robot) return
        const durability = worn.get(data.uid) ?? 100
        if (durability <= 0) tag(child, { drag: 'scrap' })
        else if (durability < 100) tag(child, snapshot.denyUids.includes(data.uid) ? { denied: true } : { drag: 'repair' })
      })
    }
    if (snapshot.interact.type === 'ready') {
      const cpu = robot.getObjectByName('cpu')
      if (cpu) tag(cpu, { drag: 'strip', label: 'Core' })
    }
    if (snapshot.assembly.gpuWired) {
      const from = robot.getObjectByName('psu')
      const to = robot.getObjectByName('gpu-port')
      if (from && to) {
        robot.updateWorldMatrix(true, true)
        const localFrom = robot.worldToLocal(from.getWorldPosition(new THREE.Vector3()))
        const localTo = robot.worldToLocal(to.getWorldPosition(new THREE.Vector3()))
        robot.add(makeCable(localFrom, localTo))
      }
    }
    if (snapshot.interact.type === 'cable') {
      const from = robot.getObjectByName('psu')
      if (from) {
        const plug = makePlug()
        from.getWorldPosition(plug.position)
        plug.position.x += 0.08
        plug.position.y += 0.04
        tag(plug, { drag: 'cable', label: 'Power cable' })
        this.plug = plug
        this.dynamic.add(plug)
        from.getWorldPosition(this.cableFrom)
      }
    }
  }

  private buildTray(snapshot: BenchSnapshot) {
    snapshot.tray.forEach((item, index) => {
      const mesh = trayMesh(item.drag, item.partId, item.bit)
      const scale = item.drag === 'processor' || item.drag === 'os' ? 2.5 : item.drag === 'weapon' ? 1.8 : 1.45
      mesh.scale.multiplyScalar(scale)
      const hit = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.28, 0.28),
        new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      )
      hit.scale.setScalar(1 / scale)
      mesh.add(hit)
      const column = index % 2
      const row = Math.floor(index / 2)
      sit(mesh, -1.38 - column * 0.36, -0.55 + row * 0.34)
      tag(mesh, { drag: item.drag, uid: item.uid, bit: item.bit, partId: item.partId, label: item.label, anchor: `tray-${item.key}` })
      mesh.name = `tray-${item.key}`
      this.dynamic.add(mesh)
    })
  }

  private buildJob(snapshot: BenchSnapshot) {
    const interact = snapshot.interact
    const focus = snapshot.focusId
    if (interact.type === 'paste' && snapshot.mode === 'repair') {
      const cpu = makeCpu(focus ?? 'scrap-chip', interact.tone === 'fresh')
      cpu.scale.setScalar(2.1)
      sit(cpu, 0.02, 0.95)
      this.dynamic.add(cpu)
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.28), metal(0xffffff))
      plane.rotation.x = -Math.PI / 2
      plane.position.set(0.02, 0.08, 0.95)
      plane.name = 'paste'
      tag(plane, { paint: true })
      this.dynamic.add(plane)
    }
    if (interact.type === 'mat-cooler') {
      const cpu = makeCpu(focus ?? 'scrap-chip', true)
      cpu.scale.setScalar(2)
      sit(cpu, 0.12, 0.95)
      const cooler = makeCooler('up')
      sit(cooler, -0.38, 0.95)
      tag(cooler, { drag: 'cooler', label: 'Cooler' })
      const slot = new THREE.Object3D()
      slot.position.set(0.12, 0.16, 0.95)
      slot.name = 'mat-cooler'
      this.anchors.set('mat-cooler', slot)
      this.dynamic.add(cpu, cooler, slot)
    }
    if (interact.type === 'screw' && snapshot.mode === 'repair') {
      const wheels = makeWheels(3)
      wheels.scale.setScalar(1.5)
      sit(wheels, 0.05, 0.95)
      const radius = 0.1
      ;[-0.28, 0.28].forEach((x, index) => {
        const screw = makeScrew()
        screw.position.set(x, radius + 0.12, 0)
        screw.name = `screw-${index}`
        tag(screw, { screw: index })
        wheels.add(screw)
      })
      this.dynamic.add(wheels)
    }
    if (interact.type === 'hone' || interact.type === 'weld') {
      const tool = trayMesh(interact.type === 'hone' ? 'weapon' : 'plate', interact.partId, 1)
      tool.scale.setScalar(interact.type === 'hone' ? 2.4 : 1.3)
      tool.rotation.x = -Math.PI / 2
      sit(tool, 0.02, 0.92)
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(0.72, 0.025, 0.06),
        new THREE.MeshBasicMaterial({ color: interact.type === 'weld' ? 0xff5a2a : 0xffb020, transparent: true, opacity: 0.45, depthWrite: false }),
      )
      bar.position.set(0.02, 0.16 + interact.index * 0.015, 0.92)
      bar.name = 'stroke'
      tag(bar, { stroke: true })
      const hit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.08, 0.2), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
      hit.position.copy(bar.position)
      tag(hit, { stroke: true })
      this.dynamic.add(tool, bar, hit)
    }
    if (interact.type === 'mat-os') {
      const reader = block(0.28, 0.08, 0.2, plastic(0x222830))
      reader.position.set(0.12, 0.06, 0.95)
      const cart = trayMesh('os', interact.partId)
      sit(cart, -0.28, 0.95)
      tag(cart, { drag: 'os', partId: interact.partId, label: 'Cartridge' })
      const slot = new THREE.Object3D()
      slot.position.set(0.12, 0.14, 0.95)
      this.anchors.set('mat-os', slot)
      this.dynamic.add(reader, cart, slot)
    }
    if (interact.type === 'mat-gpu') {
      const slotBox = block(0.12, 0.08, 0.28, metal(0x333a44))
      slotBox.position.set(-0.05, 0.06, 0.95)
      const card = trayMesh('gpu', interact.partId)
      if (interact.phase === 'pull') {
        card.position.set(-0.05, 0.12, 0.95)
        tag(card, { drag: 'gpu-card', partId: interact.partId, label: 'Card' })
        const out = new THREE.Object3D()
        out.position.set(0.42, 0.14, 0.95)
        this.anchors.set('gpu-out', out)
        this.dynamic.add(out)
      } else if (interact.phase === 'scrub') {
        card.rotation.x = -Math.PI / 2
        sit(card, 0.02, 0.95)
        const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.1), metal(0xffffff))
        plane.rotation.x = -Math.PI / 2
        plane.position.set(-0.08, 0.08, 0.95)
        plane.name = 'paste'
        tag(plane, { paint: true })
        this.dynamic.add(plane)
      } else if (interact.phase === 'seat') {
        sit(card, 0.38, 0.95)
        tag(card, { drag: 'gpu-card', partId: interact.partId, label: 'Card' })
        const inn = new THREE.Object3D()
        inn.position.set(-0.05, 0.14, 0.95)
        this.anchors.set('gpu-in', inn)
        this.dynamic.add(inn)
      } else {
        card.position.set(-0.05, 0.12, 0.95)
        const plug = makePlug()
        sit(plug, 0.4, 0.95)
        tag(plug, { drag: 'cable', label: 'Power cable' })
        this.plug = plug
        const port = new THREE.Object3D()
        port.position.set(0.08, 0.16, 0.95)
        this.anchors.set('gpu-port', port)
        this.cableFrom.set(0.4, 0.12, 0.95)
        this.dynamic.add(plug, port)
      }
      this.dynamic.add(slotBox, card)
    }
    if ((interact.type === 'boot') && snapshot.mode === 'repair') {
      const reader = block(0.28, 0.08, 0.2, plastic(0x222830))
      reader.position.set(0.05, 0.06, 0.95)
      const light = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.02), new THREE.MeshStandardMaterial({ color: 0x39e1ff, emissive: 0x39e1ff, emissiveIntensity: 0.8 }))
      light.position.set(0.05, 0.11, 1.04)
      light.name = 'boot-led'
      this.dynamic.add(reader, light)
    }
  }

  private markHot(snapshot: BenchSnapshot) {
    for (const hot of snapshot.hot) {
      const anchor = this.anchors.get(hot.id)
      if (!anchor) continue
      const size = hot.id.startsWith('plate') ? 0.16 : hot.drag === 'cable' ? 0.07 : 0.1
      const glow = new THREE.Mesh(
        new THREE.TorusGeometry(size, 0.012, 8, 28),
        new THREE.MeshBasicMaterial({ color: 0xffc44a }),
      )
      glow.name = 'highlight'
      glow.raycast = () => undefined
      anchor.add(glow)
    }
  }

  private preparePaste(tone: 'fresh' | 'grime' | 'clean') {
    const plane = this.dynamic.getObjectByName('paste') as THREE.Mesh | undefined
    if (!plane) return
    this.paintTone = tone
    this.cells = new Uint8Array(64)
    this.smearSent = false
    const canvas = document.createElement('canvas')
    canvas.width = 128
    canvas.height = 128
    this.paintCanvas = canvas
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    plane.material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.42, metalness: tone === 'clean' ? 0.7 : 0.35 })
    this.redrawPaint()
  }

  private toneColors() {
    if (this.paintTone === 'grime') return ['#6a4b32', '#d5dde4']
    if (this.paintTone === 'clean') return ['#3a342c', '#e8c56a']
    return ['#c5ccd4', '#7dcea0']
  }

  private redrawPaint() {
    const canvas = this.paintCanvas
    if (!canvas) return
    const context = canvas.getContext('2d')
    if (!context) return
    const [bare, done] = this.toneColors()
    const size = 16
    for (let y = 0; y < 8; y += 1) {
      for (let x = 0; x < 8; x += 1) {
        context.fillStyle = this.cells[y * 8 + x] ? done : bare
        context.fillRect(x * size, y * size, size, size)
      }
    }
    const mesh = this.dynamic.getObjectByName('paste') as THREE.Mesh | undefined
    const material = mesh?.material
    if (material instanceof THREE.MeshStandardMaterial && material.map) material.map.needsUpdate = true
  }

  private clearDynamic() {
    this.dynamic.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const material = mesh.material
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
      else if (material && 'dispose' in material) material.dispose()
    })
    this.dynamic.clear()
    this.cable = null
    this.plug = null
    this.hover = null
  }

  private resize = () => {
    const width = this.canvas.clientWidth || 1
    const height = this.canvas.clientHeight || 1
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / Math.max(height, 1)
    this.camera.updateProjectionMatrix()
  }

  private applyCamera() {
    const target = this.target
    this.camera.position.set(
      target.x + this.radius * Math.sin(this.phi) * Math.sin(this.theta),
      target.y + this.radius * Math.cos(this.phi),
      target.z + this.radius * Math.sin(this.phi) * Math.cos(this.theta),
    )
    this.camera.lookAt(target)
  }

  private animate = () => {
    this.frameId = requestAnimationFrame(this.animate)
    const damp = this.reducedMotion ? 1 : 0.08
    if (!this.userAimed && this.snapshot?.mode !== 'pit') {
      this.target.lerp(this.desired.target, damp)
      this.radius += (this.desired.radius - this.radius) * damp
      this.phi += (this.desired.phi - this.phi) * damp
      this.theta += (this.desired.theta - this.theta) * damp
      this.yaw += (this.desired.yaw - this.yaw) * damp
    }
    if (this.snapshot?.mode === 'pit' && !this.orbiting) this.yaw += 0.005
    const robot = this.dynamic.getObjectByName('rivet')
    if (robot) robot.rotation.y = this.yaw
    const time = performance.now() * 0.004
    this.dynamic.traverse((child) => {
      if (child.name !== 'highlight') return
      const material = (child as THREE.Mesh).material
      if (material instanceof THREE.MeshBasicMaterial) material.opacity = 0.18 + Math.sin(time) * 0.12
    })
    const visor = this.dynamic.getObjectByName('visor') as THREE.Mesh | undefined
    if (visor && this.snapshot?.interact.type === 'boot') {
      const material = visor.material as THREE.MeshStandardMaterial
      material.emissive = new THREE.Color(0x39e1ff)
      material.emissiveIntensity = 0.35 + Math.sin(time * 2) * 0.35
    }
    const led = this.dynamic.getObjectByName('boot-led') as THREE.Mesh | undefined
    if (led) {
      const material = led.material as THREE.MeshStandardMaterial
      material.emissiveIntensity = 0.4 + Math.sin(time * 3) * 0.4
    }
    if (this.tween) {
      this.tween.t = Math.min(1, this.tween.t + 0.12)
      this.tween.obj.position.lerpVectors(this.tween.start, this.tween.home, this.tween.t)
      if (this.tween.t >= 1) {
        const obj = this.tween.obj
        this.tween = null
        this.scene.remove(obj)
        this.disposeObj(obj)
        const next = this.queued ?? this.snapshot
        this.queued = null
        if (next) this.rebuild(next)
      }
    }
    if (this.drag?.data.drag === 'cable' && this.plug) {
      if (this.cable) {
        this.scene.remove(this.cable)
        this.cable.geometry.dispose()
      }
      this.cable = makeCable(this.cableFrom, this.plug.position)
      this.scene.add(this.cable)
    }
    this.applyCamera()
    this.publishAnchors()
    if (this.canvas.clientWidth > 0) this.renderer.render(this.scene, this.camera)
  }

  private publishAnchors() {
    const anchors: { id: string; x: number; y: number }[] = []
    const rect = this.canvas.getBoundingClientRect()
    const push = (id: string, obj: THREE.Object3D) => {
      const point = obj.getWorldPosition(_world).project(this.camera)
      if (point.z > 1) return
      anchors.push({
        id,
        x: (point.x * 0.5 + 0.5) * rect.width,
        y: (-point.y * 0.5 + 0.5) * rect.height,
      })
    }
    for (const [id, obj] of this.anchors) push(`socket-${id}`, obj)
    this.dynamic.traverse((child) => {
      const data = child.userData as Tag
      if (data.anchor) push(data.anchor, child)
      if (data.screw !== undefined) push(`screw-${data.screw}`, child)
      if (child.name === 'paste') push('paste', child)
      if (child.name === 'stroke') push('stroke', child)
      if (data.drag === 'cable') push('cable', child)
      if (data.drag === 'cooler') push('cooler', child)
      if (data.drag === 'strip') push('strip', child)
      if (data.drag && data.uid) push(`part-${data.uid}`, child)
    })
    window.__benchAnchors = anchors
  }

  private ndc(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect()
    _ndc.set(
      ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1,
      -((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 + 1,
    )
    return _ndc
  }

  private meaningful(object: THREE.Object3D | null) {
    let current = object
    while (current) {
      const data = current.userData as Tag
      if (data.drag || data.denied || data.screw !== undefined || data.paint || data.stroke) return current
      current = current.parent
    }
    return null
  }

  private raycast(event: PointerEvent) {
    this.raycaster.setFromCamera(this.ndc(event), this.camera)
    return this.raycaster.intersectObjects(this.scene.children, true)
  }

  private onDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.button !== 2) return
    if (this.suppress) return
    this.track(event)
    this.canvas.setPointerCapture(event.pointerId)
    if (!this.interactive || event.button === 2) {
      this.orbiting = true
      this.userAimed = true
      this.lastX = event.clientX
      this.lastY = event.clientY
      return
    }
    const hits = this.raycast(event)
    const picked = this.meaningful(hits[0]?.object ?? null) ?? this.nearbyGrabbable(event)
    if (picked?.userData.denied && picked.userData.uid) {
      this.handlers.onDenied?.(String(picked.userData.uid))
      return
    }
    if (picked && (picked.userData as Tag).drag) {
      this.startDrag(picked, event)
      return
    }
    if (picked && (picked.userData as Tag).screw !== undefined && this.snapshot?.interact.type === 'screw' && !this.tight.has((picked.userData as Tag).screw as number)) {
      this.startScrew(picked, event)
      return
    }
    const paintHit = hits.find((hit) => this.meaningful(hit.object)?.userData.paint)
    const paintingJob = this.snapshot?.interact.type === 'paste' || (this.snapshot?.interact.type === 'mat-gpu' && this.snapshot.interact.phase === 'scrub')
    if (paintHit && paintingJob) {
      this.painting = true
      this.paintAt(paintHit)
      return
    }
    const strokeHit = hits.find((hit) => this.meaningful(hit.object)?.userData.stroke)
    if (strokeHit && (this.snapshot?.interact.type === 'hone' || this.snapshot?.interact.type === 'weld')) {
      this.stroking = { started: false, max: -999 }
      this.strokeAt(event)
      return
    }
    this.orbiting = true
    this.userAimed = true
    this.lastX = event.clientX
    this.lastY = event.clientY
  }

  private startDrag(obj: THREE.Object3D, event: PointerEvent) {
    const home = obj.getWorldPosition(new THREE.Vector3())
    const quat = obj.getWorldQuaternion(new THREE.Quaternion())
    obj.parent?.remove(obj)
    this.scene.add(obj)
    obj.position.copy(home)
    obj.quaternion.copy(quat)
    const normal = new THREE.Vector3()
    this.camera.getWorldDirection(normal)
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, home)
    const point = this.hitPlane(event, plane) ?? home.clone()
    this.drag = { obj, plane, offset: home.clone().sub(point), home, data: { ...(obj.userData as Tag) } }
    this.canvas.style.cursor = 'grabbing'
  }

  private startScrew(obj: THREE.Object3D, event: PointerEvent) {
    const center = this.clientOf(obj)
    this.screwing = {
      index: (obj.userData as Tag).screw as number,
      last: Math.atan2(event.clientY - center.y, event.clientX - center.x),
      total: 0,
      obj,
      baseY: obj.position.y,
    }
  }

  private clientOf(obj: THREE.Object3D) {
    const rect = this.canvas.getBoundingClientRect()
    const point = obj.getWorldPosition(_world).project(this.camera)
    return {
      x: rect.left + (point.x * 0.5 + 0.5) * rect.width,
      y: rect.top + (-point.y * 0.5 + 0.5) * rect.height,
    }
  }

  private hitPlane(event: PointerEvent, plane: THREE.Plane) {
    this.raycaster.setFromCamera(this.ndc(event), this.camera)
    return this.raycaster.ray.intersectPlane(plane, _hit)?.clone() ?? null
  }

  private track(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = event.clientX - rect.left
    this.pointer.y = event.clientY - rect.top
  }

  private projectToCanvas(obj: THREE.Object3D) {
    const rect = this.canvas.getBoundingClientRect()
    const point = obj.getWorldPosition(_world).clone().project(this.camera)
    return {
      x: (point.x * 0.5 + 0.5) * rect.width,
      y: (-point.y * 0.5 + 0.5) * rect.height,
      behind: point.z > 1,
    }
  }

  private nearbyGrabbable(event: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const best: { obj: THREE.Object3D | null; distance: number } = { obj: null, distance: 70 }
    this.dynamic.traverse((child) => {
      const data = child.userData as Tag
      if (!data.drag && !data.denied && data.screw === undefined) return
      const projected = this.projectToCanvas(child)
      if (projected.behind) return
      const distance = Math.hypot(projected.x - x, projected.y - y)
      if (distance < best.distance) {
        best.obj = child
        best.distance = distance
      }
    })
    return best.obj
  }

  private onMove = (event: PointerEvent) => {
    this.track(event)
    if (this.suppress) return
    if (this.orbiting) {
      const dx = event.clientX - this.lastX
      const dy = event.clientY - this.lastY
      this.lastX = event.clientX
      this.lastY = event.clientY
      this.yaw += dx * 0.008
      this.phi = Math.min(1.4, Math.max(0.55, this.phi + dy * 0.004))
      return
    }
    if (this.drag) {
      const point = this.hitPlane(event, this.drag.plane)
      if (point) this.drag.obj.position.copy(point.add(this.drag.offset))
      return
    }
    if (this.screwing) {
      this.moveScrew(event)
      return
    }
    if (this.painting) {
      const hit = this.raycast(event).find((entry) => this.meaningful(entry.object)?.userData.paint)
      if (hit) this.paintAt(hit)
      return
    }
    if (this.stroking) {
      this.strokeAt(event)
      return
    }
    this.hoverAt(event)
  }

  private hoverAt(event: PointerEvent) {
    const hit = this.raycast(event)[0]
    const next = this.meaningful(hit?.object ?? null)
    const grabbable = next && ((next.userData as Tag).drag || (next.userData as Tag).screw !== undefined || (next.userData as Tag).paint || (next.userData as Tag).stroke) ? next : null
    if (this.hover && this.hover !== grabbable) this.hover.scale.multiplyScalar(1 / this.hoverScale)
    if (grabbable && grabbable !== this.hover) {
      this.hoverScale = 1.06
      grabbable.scale.multiplyScalar(this.hoverScale)
    }
    this.hover = grabbable
    this.canvas.style.cursor = grabbable ? 'grab' : 'default'
  }

  private moveScrew(event: PointerEvent) {
    if (!this.screwing) return
    const center = this.clientOf(this.screwing.obj)
    const angle = Math.atan2(event.clientY - center.y, event.clientX - center.x)
    let delta = angle - this.screwing.last
    if (delta > Math.PI) delta -= Math.PI * 2
    if (delta < -Math.PI) delta += Math.PI * 2
    this.screwing.last = angle
    this.screwing.total += delta
    const turns = Math.min(1, Math.abs(this.screwing.total) / (Math.PI * 2))
    this.screwing.obj.rotation.y = this.screwing.total
    this.screwing.obj.position.y = this.screwing.baseY - turns * 0.035
    this.handlers.onProgress?.(turns)
    if (turns >= 1) {
      const index = this.screwing.index
      this.tight.add(index)
      const ring = this.screwing.obj.getObjectByName('ring')
      if (ring) ring.visible = false
      this.screwing = null
      this.suppress = true
      this.handlers.onScrewDone?.(index)
    }
  }

  private paintAt(hit: THREE.Intersection) {
    if (!hit.uv || this.smearSent) return
    const grid = 8
    const x = Math.min(grid - 1, Math.max(0, Math.floor(hit.uv.x * grid)))
    const y = Math.min(grid - 1, Math.max(0, Math.floor((1 - hit.uv.y) * grid)))
    let changed = false
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx * dx + dy * dy > 2) continue
        const cx = x + dx
        const cy = y + dy
        if (cx < 0 || cy < 0 || cx >= grid || cy >= grid) continue
        if (!this.cells[cy * grid + cx]) {
          this.cells[cy * grid + cx] = 1
          changed = true
        }
      }
    }
    if (!changed) return
    this.redrawPaint()
    let filled = 0
    for (const cell of this.cells) filled += cell
    this.handlers.onProgress?.(filled / 64)
    if (filled >= 36 && !this.smearSent) {
      this.smearSent = true
      this.painting = false
      this.suppress = true
      this.handlers.onSmearDone?.()
    }
  }

  private strokeAt(event: PointerEvent) {
    if (!this.stroking) return
    const hit = this.raycast(event).find((entry) => this.meaningful(entry.object)?.userData.stroke)
    if (!hit) return
    const x = hit.point.x
    if (!this.stroking.started) {
      if (x > -0.02) return
      this.stroking.started = true
    }
    this.stroking.max = Math.max(this.stroking.max, x)
    this.handlers.onProgress?.(Math.min(1, (this.stroking.max + 0.34) / 0.68))
    if (this.stroking.max > 0.24) {
      this.stroking = null
      this.suppress = true
      this.handlers.onStrokeDone?.()
    }
  }

  private onUp = () => {
    if (this.drag) this.finishDrag()
    this.orbiting = false
    this.painting = false
    this.screwing = null
    this.stroking = null
    this.suppress = false
    this.canvas.style.cursor = 'default'
    const next = this.queued
    this.queued = null
    if (next && signature(next) !== this.sign && !this.tween) this.rebuild(next)
  }

  private finishDrag() {
    if (!this.drag) return
    const { obj, data } = this.drag
    const socket = this.screenSocket(data) ?? this.nearestHot(obj.position, data)
    if (socket) {
      this.scene.remove(obj)
      this.disposeObj(obj)
      this.drag = null
      if (this.cable) {
        this.scene.remove(this.cable)
        this.cable.geometry.dispose()
        this.cable = null
      }
      this.handlers.onDrop?.({ drag: data.drag ?? '', uid: data.uid, bit: data.bit, partId: data.partId })
      return
    }
    const home = this.drag.home.clone()
    this.drag = null
    this.tween = { obj, start: obj.position.clone(), home, t: 0 }
  }

  private screenSocket(data: Tag) {
    if (!this.snapshot || !data.drag) return null
    let best: { id: string; distance: number } | null = null
    for (const hot of this.snapshot.hot) {
      if (hot.drag !== data.drag) continue
      if (hot.bit !== undefined && hot.bit !== data.bit) continue
      const anchor = this.anchors.get(hot.id)
      if (!anchor) continue
      const projected = this.projectToCanvas(anchor)
      if (projected.behind) continue
      const distance = Math.hypot(projected.x - this.pointer.x, projected.y - this.pointer.y)
      if (distance < 110 && (!best || distance < best.distance)) best = { id: hot.id, distance }
    }
    return best?.id ?? null
  }

  private nearestHot(position: THREE.Vector3, data: Tag) {
    if (!this.snapshot || !data.drag) return null
    let best: { id: string; distance: number } | null = null
    for (const hot of this.snapshot.hot) {
      if (hot.drag !== data.drag) continue
      if (hot.bit !== undefined && hot.bit !== data.bit) continue
      const anchor = this.anchors.get(hot.id)
      if (!anchor) continue
      const distance = anchor.getWorldPosition(_world).distanceTo(position)
      const limit = data.drag === 'cable' ? 0.42 : 0.55
      if (distance < limit && (!best || distance < best.distance)) best = { id: hot.id, distance }
    }
    return best?.id ?? null
  }

  private disposeObj(obj: THREE.Object3D) {
    obj.traverse((child) => {
      const mesh = child as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
      const material = mesh.material
      if (Array.isArray(material)) material.forEach((entry) => entry.dispose())
      else if (material && 'dispose' in material) material.dispose()
    })
  }

  private onWheel = (event: WheelEvent) => {
    event.preventDefault()
    this.userAimed = true
    this.radius = Math.min(5.4, Math.max(1.05, this.radius + event.deltaY * 0.002))
  }

  private onMenu = (event: Event) => {
    event.preventDefault()
  }
}

declare global {
  interface Window {
    __benchAnchors?: { id: string; x: number; y: number }[]
  }
}
