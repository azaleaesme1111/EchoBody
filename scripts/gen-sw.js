const SW_CODE = `
const CACHE_NAME = 'hear-her-voice-v1'
const ASSETS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((c) => c.addAll(ASSETS)))
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))))
  self.clients.claim()
})

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((resp) => {
      if (resp.status === 200) {
        const clone = resp.clone()
        caches.open(CACHE_NAME).then((c) => c.put(e.request, clone))
      }
      return resp
    }).catch(() => caches.match('/index.html')))
  )
})
`

import { writeFileSync } from 'fs'
writeFileSync('public/sw.js', SW_CODE)
console.log('Service Worker generated')
