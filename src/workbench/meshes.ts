import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { catalog } from '../parts'
import type { Assembly, OwnedPart } from '../parts'
import type { Tag } from './types'

const CPU: Record<string, number> = {
  'scrap-chip': 0x3dba7a,
  'coil-core': 0xe0b03a,
  'weld-cortex': 0x9aafc0,
  'furnace-cpu': 0xd24a2a,
  'apex-mind': 0xf0d56a,
  'crown-lattice': 0xf4f7fb,
}

const SHELL: Record<string, number> = {
  frame: 0x8d97a3,
  tin: 0xc5ced6,
  bolt: 0x6f8faf,
  weld: 0x8d9474,
  furnace: 0xc47a45,
  apex: 0xdfe3ea,
  crown: 0xe6c35c,
}

const OS: Record<string, number> = {
  'bare-os': 0x8b939c,
  'shop-os': 0x3d7ea6,
  'kernel-os': 0xc4552a,
  'furnace-os': 0xd47a32,
  'crown-os': 0xe6c35c,
}

export function metal(color: number, roughness = 0.4, metalness = 0.78) {
  const material = new THREE.MeshStandardMaterial({ color, roughness, metalness })
  return material
}

export function plastic(color: number, roughness = 0.48) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.12 })
}

export function rubber(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0.04 })
}

export function tag(obj: THREE.Object3D, data: Tag) {
  Object.assign(obj.userData, data)
}

function shade(mesh: THREE.Mesh) {
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function block(w: number, h: number, d: number, material: THREE.Material) {
  const radius = Math.min(0.014, w * 0.35, h * 0.35, d * 0.35)
  const geometry = radius < 0.003 ? new THREE.BoxGeometry(w, h, d) : new RoundedBoxGeometry(w, h, d, 2, radius)
  return shade(new THREE.Mesh(geometry, material))
}

export function sit(obj: THREE.Object3D, x: number, z: number) {
  obj.position.set(x, 0, z)
  obj.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(obj)
  obj.position.y += -box.min.y
  return obj
}

export function shellColor(partId?: string) {
  if (!partId) return SHELL.frame
  return SHELL[catalog(partId).shell] ?? SHELL.frame
}

export function makeCpu(id: string, pasted: boolean) {
  const group = new THREE.Group()
  const board = block(0.16, 0.16, 0.018, plastic(0x2a241c))
  const cap = block(0.11, 0.11, 0.014, metal(pasted ? 0x86c7a0 : (CPU[id] ?? 0xc5ccd4), 0.28, 0.88), )
  cap.position.z = 0.014
  const pins = shade(new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.01, 0.012), metal(0xd7b25a, 0.32, 0.7)))
  pins.position.set(0, -0.085, -0.004)
  group.add(board, cap, pins)
  return group
}

export function makeCooler(facing: 'up' | 'out') {
  const group = new THREE.Group()
  const copper = metal(0xb87333, 0.32, 0.86)
  const finMetal = metal(0xd7dee6, 0.22, 0.92)
  if (facing === 'out') {
    const base = block(0.16, 0.16, 0.02, copper)
    group.add(base)
    for (let index = 0; index < 7; index += 1) {
      const fin = shade(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.008, 0.09), finMetal))
      fin.position.set(0, -0.055 + index * 0.018, 0.05)
      group.add(fin)
    }
    return group
  }
  const base = block(0.16, 0.028, 0.16, copper)
  group.add(base)
  for (let index = 0; index < 7; index += 1) {
    const fin = shade(new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.09, 0.008), finMetal))
    fin.position.set(0, 0.055, -0.055 + index * 0.018)
    group.add(fin)
  }
  return group
}

export function makeWheels(tier: number) {
  const group = new THREE.Group()
  const radius = 0.07 + Math.min(tier, 5) * 0.012
  const width = tier >= 3 ? 0.11 : 0.07
  const span = 0.22
  const axle = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, span * 2.15, 12), metal(0x9aa3ad)))
  axle.rotation.z = Math.PI / 2
  group.add(axle)
  for (const side of [-1, 1]) {
    const tire = shade(new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, width, 22), rubber(tier >= 5 ? 0x241c14 : 0x1a1a1a)))
    tire.rotation.z = Math.PI / 2
    tire.position.x = side * span
    const hub = shade(new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.38, radius * 0.38, width + 0.012, 14), metal(tier >= 4 ? 0xf0c56a : 0xc5ccd4, 0.3, 0.85)))
    hub.rotation.z = Math.PI / 2
    hub.position.x = side * span
    if (tier >= 4) {
      const lit = hub.material as THREE.MeshStandardMaterial
      lit.emissive = new THREE.Color(0xff9a2a)
      lit.emissiveIntensity = 0.45
    }
    group.add(tire, hub)
    if (tier >= 3) {
      for (let tooth = 0; tooth < 8; tooth += 1) {
        const tread = shade(new THREE.Mesh(new THREE.BoxGeometry(width * 0.92, 0.012, 0.02), rubber(0x2c2c2c)))
        const angle = (tooth / 8) * Math.PI * 2
        tread.position.set(side * span, Math.sin(angle) * (radius - 0.004), Math.cos(angle) * (radius - 0.004))
        tread.lookAt(side * span, 0, 0)
        group.add(tread)
      }
    }
  }
  group.position.y = radius
  group.userData.wheelRadius = radius
  return group
}

export function makeScrew() {
  const group = new THREE.Group()
  const shaft = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.045, 12), metal(0x1a1a1a, 0.35, 0.7)))
  const head = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.016, 12), metal(0x2c2c2c, 0.28, 0.82)))
  head.position.y = 0.028
  const slot = shade(new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.008, 0.008), metal(0x0c0c0c)))
  slot.position.y = 0.038
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.08, 8), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }))
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.006, 8, 20), new THREE.MeshBasicMaterial({ color: 0xffb020 }))
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.05
  ring.name = 'ring'
  group.add(shaft, head, slot, hit, ring)
  return group
}

export function makeWeapon(id: string) {
  const group = new THREE.Group()
  const steel = metal(0xc5ccd4, 0.32, 0.84)
  if (id === 'saw' || id === 'blades') {
    const disc = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.018, 24), metal(0xd0d5dc)))
    disc.rotation.z = Math.PI / 2
    const guard = block(0.06, 0.05, 0.05, metal(0x8a3030))
    guard.position.x = -0.08
    group.add(disc, guard)
    if (id === 'blades') {
      const second = disc.clone()
      second.position.y = 0.05
      group.add(second)
    }
  } else if (id === 'welder') {
    const body = block(0.16, 0.06, 0.06, metal(0x4a555f))
    const tip = shade(new THREE.Mesh(new THREE.SphereGeometry(0.025, 12, 10), new THREE.MeshStandardMaterial({ color: 0xfff1c9, emissive: 0xff7a18, emissiveIntensity: 0.9 })))
    tip.position.x = 0.1
    group.add(body, tip)
  } else if (id === 'cannon' || id === 'slag') {
    const tube = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.22, 16), id === 'slag' ? metal(0x6a5344) : steel))
    tube.rotation.z = Math.PI / 2
    group.add(tube)
  } else if (id === 'drill' || id === 'spike') {
    const bit = shade(new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.2, 12), steel))
    bit.rotation.z = -Math.PI / 2
    bit.position.x = 0.06
    const chuck = block(0.06, 0.06, 0.06, metal(0x333))
    chuck.position.x = -0.06
    group.add(bit, chuck)
  } else if (id === 'vent') {
    const box = block(0.16, 0.08, 0.08, metal(0x5a4034))
    const flame = shade(new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0xffb020, emissive: 0xff5a1f, emissiveIntensity: 0.8 })))
    flame.position.x = 0.1
    group.add(box, flame)
  } else if (id === 'tesla') {
    const body = block(0.1, 0.05, 0.05, metal(0x243043))
    const left = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), metal(0x9ad7ff)))
    left.rotation.z = Math.PI / 2
    left.position.set(0.08, 0.02, 0)
    const right = left.clone()
    right.position.y = -0.02
    const glow = left.material as THREE.MeshStandardMaterial
    glow.emissive = new THREE.Color(0x39c6ff)
    glow.emissiveIntensity = 0.7
    group.add(body, left, right)
  } else if (id === 'hook') {
    const arm = shade(new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.012, 8, 18, Math.PI), steel))
    arm.rotation.y = Math.PI / 2
    const handle = block(0.08, 0.04, 0.04, metal(0x333))
    handle.position.x = -0.08
    group.add(arm, handle)
  } else if (id === 'hammer') {
    const handle = block(0.16, 0.04, 0.04, plastic(0x4a3424))
    const head = block(0.08, 0.1, 0.08, metal(0xded3a2, 0.3, 0.8))
    head.position.x = 0.1
    group.add(handle, head)
  } else {
    const fist = block(0.12, 0.08, 0.08, steel)
    const piston = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 10), metal(0x888)))
    piston.rotation.z = Math.PI / 2
    piston.position.x = -0.08
    group.add(fist, piston)
  }
  return group
}

export function makeGpu(id: string) {
  const group = new THREE.Group()
  const shroud = id === 'crown-gpu' ? 0xe6c35c : id === 'coil-gpu' ? 0x2f8f98 : 0x2a3138
  const pcb = shade(new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.12), plastic(0x1d6a42)))
  const cover = block(0.24, 0.045, 0.1, plastic(shroud))
  cover.position.y = 0.02
  const fan = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 18), metal(0x151515)))
  fan.position.set(0.02, 0.046, 0)
  const fingers = shade(new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.09), metal(0xe6c36a, 0.3, 0.85)))
  fingers.position.set(-0.15, -0.004, 0)
  group.add(pcb, cover, fan, fingers)
  return group
}

export function makeOs(id: string) {
  const group = new THREE.Group()
  const body = block(0.1, 0.15, 0.025, plastic(OS[id] ?? 0x888))
  const label = shade(new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.06, 0.006), plastic(0xf4f1ea)))
  label.position.set(0, 0.02, 0.014)
  const pins = shade(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.025, 0.016), metal(0xd4af37, 0.3, 0.86)))
  pins.position.set(0, -0.085, 0)
  group.add(body, label, pins)
  return group
}

export function makePlate(bit: number, color: number) {
  const material = metal(color, 0.38, 0.62)
  if (bit === 8) return block(0.32, 0.05, 0.28, material)
  if (bit === 1) return block(0.42, 0.5, 0.03, material)
  return block(0.04, 0.42, 0.26, material)
}

export function makePlug() {
  const group = new THREE.Group()
  const body = block(0.07, 0.045, 0.09, plastic(0x161616))
  const pins = shade(new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.02, 0.02), metal(0xe8c56a, 0.28, 0.9)))
  pins.position.z = 0.05
  group.add(body, pins)
  return group
}

export function makeCable(from: THREE.Vector3, to: THREE.Vector3) {
  const mid = from.clone().lerp(to, 0.5)
  mid.y -= 0.1 + from.distanceTo(to) * 0.08
  const curve = new THREE.CatmullRomCurve3([from.clone(), mid, to.clone()])
  const geometry = new THREE.TubeGeometry(curve, 20, 0.012, 6, false)
  return shade(new THREE.Mesh(geometry, rubber(0x1a1a1a)))
}

export function hardpointLocal(index: number) {
  const fixed = [
    new THREE.Vector3(0.56, 0.5, 0.1),
    new THREE.Vector3(0.42, 0.9, 0.06),
    new THREE.Vector3(-0.56, 0.5, 0.1),
    new THREE.Vector3(-0.42, 0.9, 0.06),
  ]
  if (index < fixed.length) return fixed[index].clone()
  const angle = (index / 8) * Math.PI * 2 - Math.PI / 2
  return new THREE.Vector3(Math.cos(angle) * 0.5, 0.72, Math.sin(angle) * 0.32)
}

function wear(material: THREE.MeshStandardMaterial, durability: number) {
  if (durability >= 100) return material
  const damage = 1 - durability / 100
  material.color.lerp(new THREE.Color(durability <= 0 ? 0x1a120e : 0x6a3a28), damage * 0.75)
  material.emissive = new THREE.Color(0xff5a1f)
  material.emissiveIntensity = durability <= 0 ? 0.55 : damage * 0.28
  return material
}

function paintOwned(root: THREE.Object3D, durability: number) {
  root.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (!mesh.isMesh) return
    const material = mesh.material
    if (material instanceof THREE.MeshStandardMaterial) wear(material, durability)
  })
}

function anchor(parent: THREE.Object3D, name: string, x: number, y: number, z: number) {
  const node = new THREE.Object3D()
  node.name = name
  node.position.set(x, y, z)
  parent.add(node)
  return node
}

export function makeRobot(parts: OwnedPart[], assembly: Assembly) {
  const group = new THREE.Group()
  group.name = 'rivet'
  const frame = metal(0x4a5562, 0.42, 0.72)
  const dark = metal(0x2a313a, 0.48, 0.64)

  const pelvis = block(0.34, 0.1, 0.2, frame)
  pelvis.position.set(0, 0.34, 0)
  group.add(pelvis)
  for (const side of [-1, 1]) {
    const strut = block(0.07, 0.2, 0.07, dark)
    strut.position.set(side * 0.12, 0.2, 0)
    group.add(strut)
  }

  const back = block(0.48, 0.56, 0.045, dark)
  back.position.set(0, 0.7, -0.13)
  const railTop = block(0.5, 0.045, 0.28, frame)
  railTop.position.set(0, 0.96, 0)
  const railBottom = block(0.5, 0.045, 0.28, frame)
  railBottom.position.set(0, 0.44, 0)
  const sideL = block(0.045, 0.52, 0.26, frame)
  sideL.position.set(-0.24, 0.7, 0)
  const sideR = block(0.045, 0.52, 0.26, frame)
  sideR.position.set(0.24, 0.7, 0)
  const board = shade(new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.4, 0.02), plastic(0x1a4a32)))
  const boardMat = board.material as THREE.MeshStandardMaterial
  boardMat.emissive = new THREE.Color(0x0e3a24)
  boardMat.emissiveIntensity = 0.55
  board.position.set(0, 0.7, -0.02)
  for (let index = 0; index < 5; index += 1) {
    const trace = shade(new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.006, 0.004), metal(0xd7b25a, 0.35, 0.6)))
    trace.position.set(0, 0.56 + index * 0.06, -0.008)
    group.add(trace)
  }
  group.add(back, railTop, railBottom, sideL, sideR, board)

  const head = block(0.28, 0.22, 0.24, frame)
  head.position.set(0, 1.16, 0)
  const visorMat = new THREE.MeshStandardMaterial({ color: 0x10151c, emissive: 0x071018, emissiveIntensity: 0.4, roughness: 0.25, metalness: 0.4 })
  const visor = shade(new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.055, 0.02), visorMat))
  visor.name = 'visor'
  visor.position.set(0, 1.17, 0.125)
  group.add(head, visor)

  for (const side of [-1, 1]) {
    const shoulder = block(0.12, 0.12, 0.12, metal(0x68727c))
    shoulder.position.set(side * 0.34, 0.9, 0)
    const upper = block(0.09, 0.22, 0.09, dark)
    upper.position.set(side * 0.4, 0.74, 0.02)
    const forearm = block(0.08, 0.18, 0.08, metal(0x3a444e))
    forearm.position.set(side * 0.48, 0.56, 0.06)
    const hand = block(0.1, 0.08, 0.1, metal(0x8b949e))
    hand.position.set(side * 0.54, 0.46, 0.1)
    group.add(shoulder, upper, forearm, hand)
  }

  const owned = (uid: string | null) => parts.find((item) => item.uid === uid) ?? null
  const processor = owned(assembly.processorUid)
  if (processor) {
    const cpu = makeCpu(processor.id, assembly.paste >= 100)
    cpu.position.set(0, 0.74, 0.08)
    cpu.name = 'cpu'
    tag(cpu, { role: 'processor', uid: processor.uid, label: catalog(processor.id).name })
    paintOwned(cpu, processor.durability)
    group.add(cpu)
    if (assembly.paste < 100) {
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), metal(0xb7bec6, 0.4, 0.5))
      plane.position.set(0, 0.74, 0.12)
      plane.name = 'paste'
      tag(plane, { paint: true })
      group.add(plane)
    }
  }
  if (assembly.cooled && processor) {
    const cooler = makeCooler('out')
    cooler.position.set(0, 0.74, 0.2)
    cooler.scale.setScalar(0.85)
    cooler.name = 'cooler-mesh'
    tag(cooler, { role: 'processor', uid: processor.uid, label: catalog(processor.id).name })
    group.add(cooler)
  }

  const wheels = owned(assembly.wheelUid)
  if (wheels) {
    const tier = catalog(wheels.id).wheel || 1
    const set = makeWheels(tier)
    set.position.y = (set.userData.wheelRadius as number) || 0.09
    set.name = 'wheels'
    tag(set, { role: 'wheels', uid: wheels.uid, label: catalog(wheels.id).name })
    paintOwned(set, wheels.durability)
    if (!assembly.wheelsMounted) {
      const radius = set.userData.wheelRadius as number
      ;[-0.22, 0.22].forEach((x, index) => {
        const screw = makeScrew()
        screw.position.set(x, radius + 0.02, 0)
        screw.name = `screw-${index}`
        tag(screw, { screw: index })
        set.add(screw)
      })
    }
    group.add(set)
  } else {
    for (const side of [-1, 1]) {
      const foot = block(0.12, 0.05, 0.16, dark)
      foot.position.set(side * 0.12, 0.03, 0.02)
      group.add(foot)
    }
  }

  assembly.weaponUids.forEach((uid, index) => {
    const part = owned(uid)
    if (!part) return
    const weapon = makeWeapon(part.id)
    const spot = hardpointLocal(index)
    weapon.position.copy(spot)
    if (spot.x < 0) weapon.rotation.y = Math.PI
    weapon.name = `weapon-${index}`
    tag(weapon, { role: 'weapon', uid, label: catalog(part.id).name })
    paintOwned(weapon, part.durability)
    group.add(weapon)
  })

  const gpu = owned(assembly.gpuUid)
  if (gpu) {
    const card = makeGpu(gpu.id)
    card.position.set(-0.34, 0.66, 0.02)
    card.rotation.z = Math.PI / 2
    card.name = 'gpu'
    tag(card, { role: 'gpu', uid: gpu.uid, label: catalog(gpu.id).name })
    paintOwned(card, gpu.durability)
    group.add(card)
  }
  if (assembly.gpuSkipped) {
    const cover = block(0.08, 0.2, 0.16, metal(0x5c6770))
    cover.position.set(-0.3, 0.66, 0.02)
    group.add(cover)
  }

  const os = owned(assembly.osUid)
  if (os) {
    const cart = makeOs(os.id)
    cart.position.set(0.02, 1.16, 0.02)
    cart.scale.setScalar(0.7)
    cart.name = 'os'
    tag(cart, { role: 'os', uid: os.uid, label: catalog(os.id).name })
    paintOwned(cart, os.durability)
    group.add(cart)
    if (assembly.osInstalled) {
      const level = catalog(os.id).visor
      visorMat.emissive = new THREE.Color(level >= 4 ? 0xffb020 : 0x39e1ff)
      visorMat.emissiveIntensity = 0.9
    }
  }

  const shell = owned(assembly.materialUid)
  if (shell && assembly.covered) {
    const color = shellColor(shell.id)
    const plates: [number, number, number, number, number][] = [
      [1, 0, 0.72, 0.2, 0],
      [2, -0.3, 0.74, 0.02, 0],
      [4, 0.3, 0.74, 0.02, 0],
      [8, 0, 1.29, 0, 0],
    ]
    for (const [bit, x, y, z] of plates) {
      if ((assembly.covered & bit) === 0) continue
      const plate = makePlate(bit, color)
      plate.position.set(x, y, z)
      if (bit === 1) plate.name = 'shell'
      tag(plate, { role: 'material', uid: shell.uid, label: catalog(shell.id).name })
      paintOwned(plate, shell.durability)
      group.add(plate)
    }
  }

  anchor(group, 'processor', 0, 0.74, 0.28)
  anchor(group, 'cooler', 0, 0.74, 0.24)
  anchor(group, 'axle', 0, 0.1, 0.08)
  const nextWeapon = hardpointLocal(assembly.weaponUids.length)
  anchor(group, 'weapon', nextWeapon.x, nextWeapon.y, nextWeapon.z)
  anchor(group, 'gpu', -0.34, 0.66, 0.08)
  anchor(group, 'gpu-port', -0.34, 0.78, 0.02)
  anchor(group, 'psu', 0.18, 0.62, -0.16)
  anchor(group, 'os', 0.02, 1.16, 0.12)
  anchor(group, 'plate-1', 0, 0.72, 0.24)
  anchor(group, 'plate-2', -0.34, 0.74, 0.04)
  anchor(group, 'plate-4', 0.34, 0.74, 0.04)
  anchor(group, 'plate-8', 0, 1.32, 0.02)
  return group
}

export function trayMesh(drag: string, partId?: string, bit?: number) {
  if (drag === 'processor') return makeCpu(partId ?? 'scrap-chip', false)
  if (drag === 'cooler') return makeCooler('up')
  if (drag === 'wheels') return makeWheels(partId ? catalog(partId).wheel || 1 : 1)
  if (drag === 'weapon') return makeWeapon(partId ?? 'punch')
  if (drag === 'gpu' || drag === 'gpu-card') return makeGpu(partId ?? 'junk-gpu')
  if (drag === 'os') return makeOs(partId ?? 'bare-os')
  if (drag === 'plate') return makePlate(bit ?? 1, shellColor(partId))
  if (drag === 'cover') return makePlate(1, 0x66717c)
  if (drag === 'cable') return makePlug()
  return makeCpu('scrap-chip', false)
}

export function brushed(base: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const context = canvas.getContext('2d')
  if (!context) return null
  context.fillStyle = base
  context.fillRect(0, 0, 256, 256)
  for (let index = 0; index < 90; index += 1) {
    context.strokeStyle = `rgba(255,255,255,${0.015 + Math.random() * 0.04})`
    context.beginPath()
    const y = Math.random() * 256
    context.moveTo(0, y)
    context.lineTo(256, y + (Math.random() - 0.5) * 3)
    context.stroke()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(2, 1.4)
  return texture
}

export function labelTexture(text: string, background: string, color: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const context = canvas.getContext('2d')
  if (!context) return null
  context.fillStyle = background
  context.fillRect(0, 0, 256, 128)
  context.fillStyle = color
  context.font = '700 56px sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText(text, 128, 68)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
