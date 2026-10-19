// Authoritative combat definitions. Presentation and spawning are introduced in Checkpoint 2.2.
export const BALLOON_TYPES = Object.freeze({
  basic: Object.freeze({
    id: 'basic', hits: 1, radius: 13, speedMultiplier: 1,
    layers: Object.freeze([Object.freeze({ radius: 13, speedMultiplier: 1 })])
  }),
  durable: Object.freeze({
    id: 'durable', hits: 3, radius: 17, speedMultiplier: 1,
    layers: Object.freeze([Object.freeze({ radius: 17, speedMultiplier: 1 })])
  }),
  layered: Object.freeze({
    id: 'layered', hits: 3, radius: 21, speedMultiplier: 1,
    layers: Object.freeze([
      Object.freeze({ radius: 21, speedMultiplier: 1 }),
      Object.freeze({ radius: 16, speedMultiplier: 1.15 }),
      Object.freeze({ radius: 11, speedMultiplier: 1.30 })
    ])
  })
});
