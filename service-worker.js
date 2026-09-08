const CACHE_NAME =
    "room-inventory-v5-4";

const APP_FILES = [

    "index.html",

    "style.css",

    "script.js",

    "manifest.json",

    "icon/logo 1.jpeg"

];


/* =========================================================
   INSTALL
========================================================= */

self.addEventListener(
    "install",
    function (event) {

        event.waitUntil(

            caches
                .open(
                    CACHE_NAME
                )

                .then(
                    function (cache) {

                        return cache.addAll(
                            APP_FILES
                        );

                    }
                )

                .then(
                    function () {

                        return self.skipWaiting();

                    }
                )

        );

    }
);


/* =========================================================
   ACTIVATE
========================================================= */

self.addEventListener(
    "activate",
    function (event) {

        event.waitUntil(

            caches
                .keys()

                .then(
                    function (keys) {

                        return Promise.all(

                            keys

                                .filter(
                                    function (key) {

                                        return (
                                            key !==
                                            CACHE_NAME
                                        );

                                    }
                                )

                                .map(
                                    function (key) {

                                        return caches.delete(
                                            key
                                        );

                                    }
                                )

                        );

                    }
                )

                .then(
                    function () {

                        return self.clients.claim();

                    }
                )

        );

    }
);


/* =========================================================
   FETCH
========================================================= */

self.addEventListener(
    "fetch",
    function (event) {

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
                    function (cached) {

                        if (cached) {

                            return cached;

                        }

                        return fetch(
                            event.request
                        )

                        .then(
                            function (response) {

                                if (
                                    response &&
                                    response.status === 200 &&
                                    response.type !== "opaque"
                                ) {

                                    const copy =
                                        response.clone();

                                    caches
                                        .open(
                                            CACHE_NAME
                                        )

                                        .then(
                                            function (cache) {

                                                return cache.put(
                                                    event.request,
                                                    copy
                                                );

                                            }
                                        );

                                }

                                return response;

                            }
                        )

                        .catch(
                            function () {

                                if (
                                    event.request.mode ===
                                    "navigate"
                                ) {

                                    return caches.match(
                                        "index.html"
                                    );

                                }

                                return new Response(
                                    "",
                                    {
                                        status:
                                            503
                                    }
                                );

                            }
                        );

                    }
                )

        );

    }
);
