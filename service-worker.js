{\rtf1\ansi\ansicpg1252\cocoartf2639
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\paperw11900\paperh16840\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx566\tx1133\tx1700\tx2267\tx2834\tx3401\tx3968\tx4535\tx5102\tx5669\tx6236\tx6803\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const CACHE_NAME = "saladillo-cuida-v1";\
\
const urlsToCache = [\
  "./",\
  "./index.html",\
  "./manifest.json",\
  "./icon-192.png",\
  "./icon-512.png"\
];\
\
// Instalaci\'f3n\
self.addEventListener("install", event => \{\
  event.waitUntil(\
    caches.open(CACHE_NAME)\
      .then(cache => \{\
        console.log("Cache Saladillo Cuida creado");\
        return cache.addAll(urlsToCache);\
      \})\
  );\
\});\
\
// Activaci\'f3n (limpia caches viejos)\
self.addEventListener("activate", event => \{\
  event.waitUntil(\
    caches.keys().then(cacheNames => \{\
      return Promise.all(\
        cacheNames.map(cache => \{\
          if (cache !== CACHE_NAME) \{\
            console.log("Borrando cache vieja:", cache);\
            return caches.delete(cache);\
          \}\
        \})\
      );\
    \})\
  );\
\});\
\
// Fetch (modo offline)\
self.addEventListener("fetch", event => \{\
  event.respondWith(\
    caches.match(event.request)\
      .then(response => \{\
        if (response) \{\
          return response;\
        \}\
        return fetch(event.request);\
      \})\
  );\
\});\
}