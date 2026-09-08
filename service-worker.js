const CACHE_NAME =
    "roominventory-v7";


const FILES_TO_CACHE = [
    "index.html",
    "style.css",
    "script.js",
    "manifest.json",
    "icons/logo.png",
    "icons/icon-192.png",
    "icons/icon-512.png"
];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(
                    CACHE_NAME
                )
                .then(
                    cache =>
                        cache.addAll(
                            FILES_TO_CACHE
                        )
                )
                .then(
                    () =>
                        self.skipWaiting()
                )

        );
    }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()
                .then(
                    keys =>
                        Promise.all(
                            keys
                                .filter(
                                    key =>
                                        key !==
                                        CACHE_NAME
                                )
                                .map(
                                    key =>
                                        caches.delete(
                                            key
                                        )
                                )
                        )
                )
                .then(
                    () =>
                        self.clients.claim()
                )

        );
    }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    event => {

        if (
            event.request.method !==
            "GET"
        ) {

            return;
        }


        event.respondWith(

            caches
                .match(
                    event.request
                )
                .then(
                    cached => {

                        if (cached) {

                            return cached;
                        }


                        return fetch(
                            event.request
                        )
                            .then(
                                response => {

                                    if (
                                        response &&
                                        response.status ===
                                            200
                                    ) {

                                        const clone =
                                            response.clone();


                                        caches
                                            .open(
                                                CACHE_NAME
                                            )
                                            .then(
                                                cache =>
                                                    cache.put(
                                                        event.request,
                                                        clone
                                                    )
                                            );
                                    }


                                    return response;

                                }
                            )
                            .catch(
                                () =>
                                    caches.match(
                                        "index.html"
                                    )
                            );
                    }
                )

        );
    }
);