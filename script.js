/* =========================================================
   SISTEM INVENTARIS RUANGAN
   JAVASCRIPT V5.5
   FIREBASE GOOGLE LOGIN + ADMIN ACCESS
========================================================= */


/* =========================================================
   FIREBASE IMPORT
========================================================= */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    browserLocalPersistence,
    setPersistence,
    signInWithPopup,
    signInWithRedirect,
    getRedirectResult,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";


/* =========================================================
   FIREBASE CONFIG
========================================================= */

const firebaseConfig = {

    apiKey:
        "AIzaSyBnX15kPEoGJs5bpzSj4jFppDCjkT5qn7Q",

    authDomain:
        "sistem-inventaris-ruangan.firebaseapp.com",

    projectId:
        "sistem-inventaris-ruangan",

    storageBucket:
        "sistem-inventaris-ruangan.firebasestorage.app",

    messagingSenderId:
        "51229283718",

    appId:
        "1:51229283718:web:21183e33663997ce2c4807",

    measurementId:
        "G-X17NS2672Z"

};


/* =========================================================
   FIREBASE INITIALIZE
========================================================= */

const firebaseApp =
    initializeApp(
        firebaseConfig
    );

const auth =
    getAuth(
        firebaseApp
    );

const googleProvider =
    new GoogleAuthProvider();


googleProvider.setCustomParameters({

    prompt:
        "select_account"

});


/* =========================================================
   STORAGE
========================================================= */

const STORAGE_KEY =
    "roomInventoryData_v55";

const THEME_KEY =
    "roomInventoryTheme_v55";

const ACTIVITY_KEY =
    "roomInventoryActivity_v55";

const AUTO_BACKUP_KEY =
    "roomInventoryAutoBackup_v55";

const AUTH_KEY =
    "roomInventoryAdminAuth_v55";

const GOOGLE_USER_KEY =
    "roomInventoryGoogleUser_v55";


const OLD_STORAGE_KEYS = [

    "roomInventoryData_v54",

    "roomInventoryData_v53",

    "roomInventoryData_v5",

    "roomInventoryData_v4",

    "roomInventoryData_v3"

];


/* =========================================================
   LOCAL ADMIN
========================================================= */

const ADMIN_USERNAME =
    "admin";

const ADMIN_PASSWORD =
    "admin123";


/* =========================================================
   GLOBAL VARIABLES
========================================================= */

let inventoryData = [];

let activityData = [];

let editingId = null;

let confirmCallback = null;

let deferredInstallPrompt = null;

let isAdminLoggedIn = false;

let currentGoogleUser = null;

let googleLoginBusy = false;


/* =========================================================
   HELPER
========================================================= */

function $(id) {

    return document.getElementById(
        id
    );

}


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(

    "DOMContentLoaded",

    init

);


/* =========================================================
   INIT
========================================================= */

function init() {

    try {

        loadTheme();

        loadData();

        loadActivity();

        loadLocalAuth();

        bindEvents();

        renderAll();

        updateClock();

        updateFooterYear();

        setInterval(

            updateClock,

            1000

        );

        registerServiceWorker();

        setupFirebaseAuth();

        hideSplash();

    }

    catch (error) {

        console.error(

            "Initialization error:",

            error

        );

        showToast(

            "Terjadi error saat memuat sistem.",

            "error"

        );

        hideSplash();

    }

}


/* =========================================================
   FIREBASE AUTH SETUP
========================================================= */

async function setupFirebaseAuth() {

    try {

        await setPersistence(

            auth,

            browserLocalPersistence

        );


        onAuthStateChanged(

            auth,

            function (
                user
            ) {

                if (
                    user
                ) {

                    currentGoogleUser =
                        user;

                    isAdminLoggedIn =
                        true;


                    localStorage.setItem(

                        AUTH_KEY,

                        "google-admin"

                    );


                    localStorage.setItem(

                        GOOGLE_USER_KEY,

                        JSON.stringify({

                            uid:
                                user.uid,

                            email:
                                user.email ||
                                "",

                            displayName:
                                user.displayName ||
                                "Google Admin",

                            photoURL:
                                user.photoURL ||
                                ""

                        })

                    );


                    updateAuthUI();

                }

                else {

                    currentGoogleUser =
                        null;


                    const localAuth =
                        localStorage.getItem(
                            AUTH_KEY
                        );


                    if (
                        localAuth !==
                        "local-admin"
                    ) {

                        isAdminLoggedIn =
                            false;

                        localStorage.removeItem(
                            AUTH_KEY
                        );

                        localStorage.removeItem(
                            GOOGLE_USER_KEY
                        );

                    }


                    updateAuthUI();

                }

            }

        );


        try {

            const redirectResult =
                await getRedirectResult(
                    auth
                );


            if (
                redirectResult &&
                redirectResult.user
            ) {

                const user =
                    redirectResult.user;


                isAdminLoggedIn =
                    true;

                currentGoogleUser =
                    user;


                localStorage.setItem(

                    AUTH_KEY,

                    "google-admin"

                );


                localStorage.setItem(

                    GOOGLE_USER_KEY,

                    JSON.stringify({

                        uid:
                            user.uid,

                        email:
                            user.email ||
                            "",

                        displayName:
                            user.displayName ||
                            "Google Admin",

                        photoURL:
                            user.photoURL ||
                            ""

                    })

                );


                updateAuthUI();


                closeLoginModal();


                addActivity(

                    `Login Google: ${
                        user.email ||
                        "Google Admin"
                    }`,

                    "fa-google"

                );


                showToast(

                    "Login Google berhasil. Anda sekarang Admin.",

                    "success"

                );

            }

        }

        catch (error) {

            if (
                error &&
                error.code !==
                "auth/no-auth-event"
            ) {

                console.error(

                    "Redirect result error:",

                    error

                );

                showGoogleError(
                    error
                );

            }

        }

    }

    catch (error) {

        console.error(

            "Firebase Auth initialization error:",

            error

        );

        showGoogleError(
            error
        );

    }

}


/* =========================================================
   LOCAL AUTH
========================================================= */

function loadLocalAuth() {

    const saved =
        localStorage.getItem(
            AUTH_KEY
        );


    if (
        saved ===
        "local-admin"
    ) {

        isAdminLoggedIn =
            true;

    }

    else {

        isAdminLoggedIn =
            false;

    }


    updateAuthUI();

}


/* =========================================================
   AUTH UI
========================================================= */

function updateAuthUI() {

    const button =
        $("loginButton");

    const text =
        $("loginButtonText");

    const dot =
        $("loginStatusDot");


    if (
        !button
    ) {

        return;

    }


    if (
        isAdminLoggedIn
    ) {

        if (
            text
        ) {

            text.textContent =
                currentGoogleUser
                    ? "Google Admin"
                    : "Logout Admin";

        }


        if (
            dot
        ) {

            dot.classList.add(
                "logged-in"
            );

        }


        button.title =
            currentGoogleUser

                ? "Google Admin - Klik untuk logout"

                : "Logout Admin";

    }

    else {

        if (
            text
        ) {

            text.textContent =
                "Login Admin";

        }


        if (
            dot
        ) {

            dot.classList.remove(
                "logged-in"
            );

        }


        button.title =
            "Login Admin";

    }

}


/* =========================================================
   OPEN LOGIN MODAL
========================================================= */

function openLoginModal() {

    if (
        isAdminLoggedIn
    ) {

        logoutAdmin();

        return;

    }


    const modal =
        $("loginModal");


    if (
        modal
    ) {

        modal.classList.add(
            "show"
        );

    }


    document.body.classList.add(
        "modal-open"
    );


    if (
        $("loginError")
    ) {

        $("loginError")
            .textContent =
            "";

    }


    if (
        $("googleLoginStatus")
    ) {

        $("googleLoginStatus")
            .textContent =
            "";

        $("googleLoginStatus")
            .className =
            "google-login-status";

    }


    if (
        $("googleRedirectButton")
    ) {

        $("googleRedirectButton")
            .classList.add(
                "hidden"
            );

    }

}


/* =========================================================
   CLOSE LOGIN MODAL
========================================================= */

function closeLoginModal() {

    $("loginModal")
        ?.classList.remove(
            "show"
        );


    document.body.classList.remove(
        "modal-open"
    );

}


/* =========================================================
   LOCAL LOGIN
========================================================= */

function handleLocalLogin(
    event
) {

    event.preventDefault();


    const username =
        $("loginUsername")
            ?.value
            .trim() ||
        "";

    const password =
        $("loginPassword")
            ?.value ||
        "";


    if (

        username ===
        ADMIN_USERNAME

        &&

        password ===
        ADMIN_PASSWORD

    ) {

        isAdminLoggedIn =
            true;

        currentGoogleUser =
            null;


        localStorage.setItem(

            AUTH_KEY,

            "local-admin"

        );


        localStorage.removeItem(

            GOOGLE_USER_KEY

        );


        updateAuthUI();

        closeLoginModal();


        addActivity(

            "Login Admin lokal",

            "fa-right-to-bracket"

        );


        showToast(

            "Login Admin berhasil.",

            "success"

        );


        return;

    }


    if (
        $("loginError")
    ) {

        $("loginError")
            .textContent =
            "Username atau password salah.";

    }


    if (
        $("loginPassword")
    ) {

        $("loginPassword")
            .value =
            "";

        $("loginPassword")
            .focus();

    }

}


/* =========================================================
   GOOGLE STATUS
========================================================= */

function showGoogleStatus(

    message,

    error = false

) {

    const element =
        $("googleLoginStatus");


    if (
        !element
    ) {

        return;

    }


    element.className =
        error

            ? "google-login-status error"

            : "google-login-status";


    element.textContent =
        message;

}


/* =========================================================
   FIREBASE ERROR
========================================================= */

function showGoogleError(
    error
) {

    if (
        !error
    ) {

        return;

    }


    const code =
        error.code ||
        "";


    console.error(
        "================================"
    );

    console.error(
        "GOOGLE FIREBASE ERROR"
    );

    console.error(
        "CODE:",
        code
    );

    console.error(
        "MESSAGE:",
        error.message
    );

    console.error(
        "FULL:",
        error
    );

    console.error(
        "================================"
    );


    let message =
        error.message ||
        "Login Google gagal.";


    switch (
        code
    ) {

        case "auth/unauthorized-domain":

            message =
                "Domain website belum ditambahkan di Firebase Authorized Domains.";

            break;


        case "auth/popup-blocked":

            message =
                "Popup Google diblokir browser.";

            break;


        case "auth/popup-closed-by-user":

            message =
                "Jendela login Google ditutup.";

            break;


        case "auth/cancelled-popup-request":

            message =
                "Permintaan login Google dibatalkan.";

            break;


        case "auth/operation-not-allowed":

            message =
                "Google Sign-In belum diaktifkan di Firebase.";

            break;


        case "auth/network-request-failed":

            message =
                "Koneksi internet bermasalah.";

            break;


        case "auth/too-many-requests":

            message =
                "Terlalu banyak percobaan login.";

            break;


        case "auth/popup-timeout":

            message =
                "Popup Google tidak merespons.";

            break;


        case "auth/web-storage-unsupported":

            message =
                "Browser tidak mendukung storage Firebase.";

            break;

    }


    showGoogleStatus(

        message,

        true

    );

}


/* =========================================================
   GOOGLE LOGIN
========================================================= */

async function loginWithGoogle() {

    if (
        googleLoginBusy
    ) {

        return;

    }


    googleLoginBusy =
        true;


    const button =
        $("googleLoginButton");


    if (
        button
    ) {

        button.disabled =
            true;

    }


    showGoogleStatus(

        "Membuka login Google..."

    );


    console.log(
        "[Google Auth] starting..."
    );


    try {

        /*
           POPUP
        */

        const result =
            await signInWithPopup(

                auth,

                googleProvider

            );


        if (
            !result ||
            !result.user
        ) {

            throw new Error(
                "Akun Google tidak ditemukan."
            );

        }


        const user =
            result.user;


        /*
           SEMUA GOOGLE USER =
           ADMIN
        */

        isAdminLoggedIn =
            true;

        currentGoogleUser =
            user;


        localStorage.setItem(

            AUTH_KEY,

            "google-admin"

        );


        localStorage.setItem(

            GOOGLE_USER_KEY,

            JSON.stringify({

                uid:
                    user.uid,

                email:
                    user.email ||
                    "",

                displayName:
                    user.displayName ||
                    "Google Admin",

                photoURL:
                    user.photoURL ||
                    ""

            })

        );


        updateAuthUI();


        closeLoginModal();


        addActivity(

            `Login Google: ${
                user.email ||
                "Google Admin"
            }`,

            "fa-google"

        );


        showToast(

            `Login berhasil. ${
                user.displayName ||
                "Google Admin"
            } sekarang menjadi Admin.`,

            "success"

        );


        console.log(
            "[Google Auth] SUCCESS:",
            user.email
        );

    }

    catch (error) {

        showGoogleError(
            error
        );


        /*
           TAMPILKAN REDIRECT
        */

        if (

            error.code ===
            "auth/popup-blocked"

            ||

            error.code ===
            "auth/popup-timeout"

        ) {

            showGoogleStatus(

                "Popup gagal. Gunakan tombol Redirect Google.",

                true

            );


            $("googleRedirectButton")
                ?.classList.remove(
                    "hidden"
                );

        }

    }

    finally {

        googleLoginBusy =
            false;


        if (
            button
        ) {

            button.disabled =
                false;

        }

    }

}


/* =========================================================
   GOOGLE REDIRECT
========================================================= */

async function loginWithGoogleRedirect() {

    try {

        showGoogleStatus(

            "Mengalihkan ke Google..."

        );


        await signInWithRedirect(

            auth,

            googleProvider

        );

    }

    catch (error) {

        showGoogleError(
            error
        );

    }

}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutAdmin() {

    try {

        if (
            auth.currentUser
        ) {

            await signOut(
                auth
            );

        }

    }

    catch (error) {

        console.error(

            "Firebase logout error:",

            error

        );

    }


    isAdminLoggedIn =
        false;

    currentGoogleUser =
        null;


    localStorage.removeItem(
        AUTH_KEY
    );

    localStorage.removeItem(
        GOOGLE_USER_KEY
    );


    updateAuthUI();


    closeLoginModal();

    closeInventoryModal();

    closeConfirmModal();


    addActivity(
        "Logout Admin",
        "fa-right-from-bracket"
    );


    showToast(
        "Logout berhasil.",
        "info"
    );

}


/* =========================================================
   REQUIRE ADMIN
========================================================= */

function requireAdmin(
    action =
        "melakukan perubahan data"
) {

    if (
        isAdminLoggedIn
    ) {

        return true;

    }


    showToast(

        `Login Admin diperlukan untuk ${action}.`,

        "error"

    );


    openLoginModal();


    return false;

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {


    /* =====================================================
       LOGIN
    ===================================================== */

    $("loginButton")
        ?.addEventListener(

            "click",

            openLoginModal

        );


    $("closeLoginButton")
        ?.addEventListener(

            "click",

            closeLoginModal

        );


    $("cancelLoginButton")
        ?.addEventListener(

            "click",

            closeLoginModal

        );


    $("loginForm")
        ?.addEventListener(

            "submit",

            handleLocalLogin

        );


    $("googleLoginButton")
        ?.addEventListener(

            "click",

            loginWithGoogle

        );


    $("googleRedirectButton")
        ?.addEventListener(

            "click",

            loginWithGoogleRedirect

        );


    $("togglePasswordButton")
        ?.addEventListener(

            "click",

            function () {

                const input =
                    $("loginPassword");


                if (
                    !input
                ) {

                    return;

                }


                if (
                    input.type ===
                    "password"
                ) {

                    input.type =
                        "text";

                }

                else {

                    input.type =
                        "password";

                }

            }

        );


    $("loginModal")
        ?.addEventListener(

            "click",

            function (
                event
            ) {

                if (

                    event.target ===
                    $("loginModal")

                ) {

                    closeLoginModal();

                }

            }

        );


    /* =====================================================
       NAVIGATION
    ===================================================== */

    document
        .querySelectorAll(

            ".menu-item[data-target], .text-button[data-target]"

        )
        .forEach(

            function (
                button
            ) {

                button.addEventListener(

                    "click",

                    function () {

                        switchSection(

                            button.dataset.target

                        );

                    }

                );

            }

        );


    /* =====================================================
       MOBILE
    ===================================================== */

    $("mobileMenuButton")
        ?.addEventListener(

            "click",

            function () {

                $("sidebar")
                    ?.classList.toggle(
                        "open"
                    );

            }

        );


    /* =====================================================
       THEME
    ===================================================== */

    $("themeButton")
        ?.addEventListener(

            "click",

            toggleTheme

        );


    $("mobileThemeButton")
        ?.addEventListener(

            "click",

            toggleTheme

        );


    /* =====================================================
       ADD
    ===================================================== */

    $("quickAddButton")
        ?.addEventListener(

            "click",

            openAddModal

        );


    $("heroAddButton")
        ?.addEventListener(

            "click",

            openAddModal

        );


    $("inventoryAddButton")
        ?.addEventListener(

            "click",

            openAddModal

        );


    $("emptyAddButton")
        ?.addEventListener(

            "click",

            openAddModal

        );


    /* =====================================================
       MONITOR
    ===================================================== */

    $("heroMonitorButton")
        ?.addEventListener(

            "click",

            function () {

                switchSection(
                    "monitoring"
                );

            }

        );


    /* =====================================================
       INVENTORY MODAL
    ===================================================== */

    $("closeModalButton")
        ?.addEventListener(

            "click",

            closeInventoryModal

        );


    $("cancelModalButton")
        ?.addEventListener(

            "click",

            closeInventoryModal

        );


    $("inventoryForm")
        ?.addEventListener(

            "submit",

            handleFormSubmit

        );


    /* =====================================================
       SEARCH
    ===================================================== */

    $("searchInput")
        ?.addEventListener(

            "input",

            renderInventory

        );


    $("roomFilter")
        ?.addEventListener(

            "change",

            renderInventory

        );


    $("conditionFilter")
        ?.addEventListener(

            "change",

            renderInventory

        );


    $("sortFilter")
        ?.addEventListener(

            "change",

            renderInventory

        );


    $("resetFilterButton")
        ?.addEventListener(

            "click",

            resetFilters

        );


    /* =====================================================
       CONFIRM
    ===================================================== */

    $("confirmCancel")
        ?.addEventListener(

            "click",

            closeConfirmModal

        );


    $("confirmYes")
        ?.addEventListener(

            "click",

            function () {

                const callback =
                    confirmCallback;


                closeConfirmModal();


                if (
                    typeof callback ===
                    "function"
                ) {

                    callback();

                }

            }

        );


    /* =====================================================
       EXPORT
    ===================================================== */

    $("exportButton")
        ?.addEventListener(

            "click",

            exportCSV

        );


    /* =====================================================
       BACKUP
    ===================================================== */

    $("backupButton")
        ?.addEventListener(

            "click",

            createBackup

        );


    /* =====================================================
       RESTORE
    ===================================================== */

    $("restoreButton")
        ?.addEventListener(

            "click",

            function () {

                $("restoreFileInput")
                    ?.click();

            }

        );


    $("restoreFileInput")
        ?.addEventListener(

            "change",

            handleRestore

        );


    /* =====================================================
       PRINT
    ===================================================== */

    $("printButton")
        ?.addEventListener(

            "click",

            function () {

                window.print();

            }

        );


    /* =====================================================
       CLEAR ACTIVITY
    ===================================================== */

    $("clearActivityButton")
        ?.addEventListener(

            "click",

            clearActivities

        );


    /* =====================================================
       INSTALL
    ===================================================== */

    $("installButton")
        ?.addEventListener(

            "click",

            installPWA

        );


    window.addEventListener(

        "beforeinstallprompt",

        function (
            event
        ) {

            event.preventDefault();


            deferredInstallPrompt =
                event;


            $("installButton")
                ?.classList.remove(
                    "hidden"
                );

        }

    );


    /* =====================================================
       ESC
    ===================================================== */

    document.addEventListener(

        "keydown",

        function (
            event
        ) {

            if (
                event.key ===
                "Escape"
            ) {

                closeLoginModal();

                closeInventoryModal();

                closeConfirmModal();

            }


            if (

                (event.ctrlKey ||
                 event.metaKey)

                &&

                event.key.toLowerCase() ===
                "k"

            ) {

                event.preventDefault();


                $("searchInput")
                    ?.focus();

            }

        }

    );


    /* =====================================================
       OUTSIDE INVENTORY MODAL
    ===================================================== */

    $("inventoryModal")
        ?.addEventListener(

            "click",

            function (
                event
            ) {

                if (

                    event.target ===
                    $("inventoryModal")

                ) {

                    closeInventoryModal();

                }

            }

        );


    /* =====================================================
       OUTSIDE CONFIRM
    ===================================================== */

    $("confirmModal")
        ?.addEventListener(

            "click",

            function (
                event
            ) {

                if (

                    event.target ===
                    $("confirmModal")

                ) {

                    closeConfirmModal();

                }

            }

        );

}


/* =========================================================
   NAVIGATION
========================================================= */

function switchSection(
    target
) {

    const section =
        $(target);


    if (
        !section
    ) {

        return;

    }


    document
        .querySelectorAll(
            ".page-section"
        )
        .forEach(

            function (
                item
            ) {

                item.classList.remove(
                    "active-section"
                );

            }

        );


    section.classList.add(
        "active-section"
    );


    document
        .querySelectorAll(
            ".menu-item[data-target]"
        )
        .forEach(

            function (
                item
            ) {

                item.classList.toggle(

                    "active",

                    item.dataset.target ===
                    target

                );

            }

        );


    $("sidebar")
        ?.classList.remove(
            "open"
        );


    if (
        target ===
        "inventory"
    ) {

        renderInventory();

    }


    if (
        target ===
        "monitoring"
    ) {

        updateMonitoring();

        renderActivity();

    }


    if (
        target ===
        "statistics"
    ) {

        renderStatistics();

    }

}


/* =========================================================
   LOAD DATA
========================================================= */

function loadData() {

    try {

        let saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (
            !saved
        ) {

            for (
                const key
                of OLD_STORAGE_KEYS
            ) {

                const old =
                    localStorage.getItem(
                        key
                    );


                if (
                    old
                ) {

                    saved =
                        old;


                    localStorage.setItem(

                        STORAGE_KEY,

                        old

                    );


                    break;

                }

            }

        }


        inventoryData =
            saved

                ? normalizeData(
                    JSON.parse(
                        saved
                    )
                )

                : [];

    }

    catch (error) {

        console.error(

            "Load data error:",

            error

        );


        inventoryData =
            [];

    }

}


/* =========================================================
   NORMALIZE
========================================================= */

function normalizeData(
    data
) {

    if (
        !Array.isArray(
            data
        )
    ) {

        return [];

    }


    return data.map(

        function (
            item,
            index
        ) {

            return {

                id:
                    item.id ||
                    createId(),

                kodeInventaris:
                    String(

                        item.kodeInventaris ||

                        item.code ||

                        `INV-${String(
                            index + 1
                        ).padStart(
                            3,
                            "0"
                        )}`

                    ),

                nama:
                    String(

                        item.nama ||

                        item.name ||

                        "Tanpa Nama"

                    ),

                kategori:
                    String(

                        item.kategori ||

                        item.category ||

                        "Lainnya"

                    ),

                ruangan:
                    String(

                        item.ruangan ||

                        item.room ||

                        "Umum"

                    ),

                jumlah:
                    Math.max(

                        0,

                        Number(

                            item.jumlah ??
                            item.quantity ??
                            0

                        )

                    ),

                kondisi:
                    normalizeCondition(

                        item.kondisi ||

                        item.condition

                    ),

                keterangan:
                    String(

                        item.keterangan ||

                        item.notes ||

                        ""

                    ),

                tanggal:
                    item.tanggal ||

                    new Date()
                        .toISOString(),

                updatedAt:
                    item.updatedAt ||

                    new Date()
                        .toISOString()

            };

        }

    );

}


/* =========================================================
   CONDITION
========================================================= */

function normalizeCondition(
    value
) {

    const text =
        String(

            value ||
            "Baik"

        )

            .toLowerCase();


    if (
        text.includes(
            "ringan"
        )
    ) {

        return "Ringan";

    }


    if (
        text.includes(
            "berat"
        )
    ) {

        return "Berat";

    }


    return "Baik";

}


/* =========================================================
   SAVE DATA
========================================================= */

function saveData() {

    try {

        localStorage.setItem(

            STORAGE_KEY,

            JSON.stringify(
                inventoryData
            )

        );

    }

    catch (error) {

        console.error(
            "Save data error:",
            error
        );

    }

}


/* =========================================================
   ADD MODAL
========================================================= */

function openAddModal() {

    if (
        !requireAdmin(
            "menambah inventaris"
        )
    ) {

        return;

    }


    editingId =
        null;


    if (
        $("modalTitle")
    ) {

        $("modalTitle")
            .textContent =
            "Tambah Inventaris";

    }


    $("inventoryForm")
        ?.reset();


    if (
        $("inventoryId")
    ) {

        $("inventoryId")
            .value =
            "";

    }


    if (
        $("inventoryQuantity")
    ) {

        $("inventoryQuantity")
            .value =
            "1";

    }


    if (
        $("inventoryCondition")
    ) {

        $("inventoryCondition")
            .value =
            "Baik";

    }


    $("inventoryModal")
        ?.classList.add(
            "show"
        );


    document.body.classList.add(
        "modal-open"
    );


    setTimeout(

        function () {

            $("inventoryCode")
                ?.focus();

        },

        100

    );

}


/* =========================================================
   EDIT MODAL
========================================================= */

function openEditModal(
    id
) {

    if (
        !requireAdmin(
            "mengedit inventaris"
        )
    ) {

        return;

    }


    const item =
        inventoryData.find(

            function (
                entry
            ) {

                return (
                    entry.id ===
                    id
                );

            }

        );


    if (
        !item
    ) {

        showToast(
            "Data inventaris tidak ditemukan.",
            "error"
        );

        return;

    }


    editingId =
        id;


    $("modalTitle")
        .textContent =
        "Edit Inventaris";


    $("inventoryId")
        .value =
        item.id;


    $("inventoryCode")
        .value =
        item.kodeInventaris;


    $("inventoryName")
        .value =
        item.nama;


    $("inventoryCategory")
        .value =
        item.kategori;


    $("inventoryRoom")
        .value =
        item.ruangan;


    $("inventoryQuantity")
        .value =
        item.jumlah;


    $("inventoryCondition")
        .value =
        item.kondisi;


    $("inventoryNotes")
        .value =
        item.keterangan;


    $("inventoryModal")
        ?.classList.add(
            "show"
        );


    document.body.classList.add(
        "modal-open"
    );

}


/* =========================================================
   CLOSE INVENTORY
========================================================= */

function closeInventoryModal() {

    $("inventoryModal")
        ?.classList.remove(
            "show"
        );


    document.body.classList.remove(
        "modal-open"
    );


    editingId =
        null;

}


/* =========================================================
   FORM SUBMIT
========================================================= */

function handleFormSubmit(
    event
) {

    event.preventDefault();


    if (
        !requireAdmin(
            "menyimpan inventaris"
        )
    ) {

        return;

    }


    const code =
        $("inventoryCode")
            ?.value
            .trim() ||
        "";


    const name =
        $("inventoryName")
            ?.value
            .trim() ||
        "";


    const category =
        $("inventoryCategory")
            ?.value
            .trim() ||
        "";


    const room =
        $("inventoryRoom")
            ?.value
            .trim() ||
        "";


    const quantity =
        Number(
            $("inventoryQuantity")
                ?.value
        );


    const condition =
        $("inventoryCondition")
            ?.value ||
        "Baik";


    const notes =
        $("inventoryNotes")
            ?.value
            .trim() ||
        "";


    if (

        !code ||

        !name ||

        !category ||

        !room

    ) {

        showToast(

            "Semua field wajib diisi.",

            "error"

        );

        return;

    }


    if (

        !Number.isFinite(
            quantity
        )

        ||

        quantity < 0

    ) {

        showToast(

            "Jumlah tidak valid.",

            "error"

        );

        return;

    }


    const duplicate =
        inventoryData.find(

            function (
                item
            ) {

                return (

                    item.kodeInventaris
                        .toLowerCase()

                    ===

                    code.toLowerCase()

                    &&

                    item.id !==
                    editingId

                );

            }

        );


    if (
        duplicate
    ) {

        showToast(

            "Kode inventaris sudah digunakan.",

            "error"

        );

        return;

    }


    if (
        editingId
    ) {

        const index =
            inventoryData.findIndex(

                function (
                    item
                ) {

                    return (
                        item.id ===
                        editingId
                    );

                }

            );


        if (
            index ===
            -1
        ) {

            return;

        }


        inventoryData[
            index
        ] = {

            ...inventoryData[
                index
            ],

            kodeInventaris:
                code,

            nama:
                name,

            kategori:
                category,

            ruangan:
                room,

            jumlah:
                quantity,

            kondisi:
                condition,

            keterangan:
                notes,

            updatedAt:
                new Date()
                    .toISOString()

        };


        addActivity(

            `Mengubah "${name}"`,

            "fa-pen"

        );


        showToast(

            "Data berhasil diperbarui.",

            "success"

        );

    }

    else {

        inventoryData.unshift({

            id:
                createId(),

            kodeInventaris:
                code,

            nama:
                name,

            kategori:
                category,

            ruangan:
                room,

            jumlah:
                quantity,

            kondisi:
                condition,

            keterangan:
                notes,

            tanggal:
                new Date()
                    .toISOString(),

            updatedAt:
                new Date()
                    .toISOString()

        });


        addActivity(

            `Menambahkan "${name}"`,

            "fa-plus"

        );


        showToast(

            "Inventaris berhasil ditambahkan.",

            "success"

        );

    }


    saveData();


    closeInventoryModal();


    renderAll();

}


/* =========================================================
   DELETE
========================================================= */

function deleteInventory(
    id
) {

    if (
        !requireAdmin(
            "menghapus inventaris"
        )
    ) {

        return;

    }


    const item =
        inventoryData.find(

            function (
                entry
            ) {

                return (
                    entry.id ===
                    id
                );

            }

        );


    if (
        !item
    ) {

        return;

    }


    openConfirmModal(

        "Hapus Inventaris",

        `Yakin ingin menghapus "${item.nama}"?`,

        function () {

            inventoryData =
                inventoryData.filter(

                    function (
                        entry
                    ) {

                        return (
                            entry.id !==
                            id
                        );

                    }

                );


            saveData();


            addActivity(

                `Menghapus "${item.nama}"`,

                "fa-trash"

            );


            renderAll();


            showToast(

                "Data berhasil dihapus.",

                "success"

            );

        }

    );

}


/* =========================================================
   RENDER INVENTORY
========================================================= */

function renderInventory() {

    const tbody =
        $("inventoryTableBody");


    if (
        !tbody
    ) {

        return;

    }


    const search =
        (
            $("searchInput")
                ?.value ||
            ""
        )

            .toLowerCase()
            .trim();


    const room =
        $("roomFilter")
            ?.value ||
        "all";


    const condition =
        $("conditionFilter")
            ?.value ||
        "all";


    const sort =
        $("sortFilter")
            ?.value ||
        "newest";


    let result =
        inventoryData.filter(

            function (
                item
            ) {

                const searchMatch =
                    !search

                    ||

                    item.kodeInventaris
                        .toLowerCase()
                        .includes(
                            search
                        )

                    ||

                    item.nama
                        .toLowerCase()
                        .includes(
                            search
                        )

                    ||

                    item.kategori
                        .toLowerCase()
                        .includes(
                            search
                        )

                    ||

                    item.ruangan
                        .toLowerCase()
                        .includes(
                            search
                        );


                const roomMatch =
                    room ===
                    "all"

                    ||

                    item.ruangan ===
                    room;


                const conditionMatch =
                    condition ===
                    "all"

                    ||

                    item.kondisi ===
                    condition;


                return (

                    searchMatch &&

                    roomMatch &&

                    conditionMatch

                );

            }

        );


    result.sort(

        function (
            a,
            b
        ) {

            if (
                sort ===
                "oldest"
            ) {

                return (

                    new Date(
                        a.tanggal
                    )

                    -

                    new Date(
                        b.tanggal
                    )

                );

            }


            if (
                sort ===
                "nameAsc"
            ) {

                return a.nama.localeCompare(

                    b.nama,

                    "id"

                );

            }


            if (
                sort ===
                "nameDesc"
            ) {

                return b.nama.localeCompare(

                    a.nama,

                    "id"

                );

            }


            if (
                sort ===
                "stockHigh"
            ) {

                return (

                    b.jumlah -
                    a.jumlah

                );

            }


            if (
                sort ===
                "stockLow"
            ) {

                return (

                    a.jumlah -
                    b.jumlah

                );

            }


            return (

                new Date(
                    b.tanggal
                )

                -

                new Date(
                    a.tanggal
                )

            );

        }

    );


    tbody.innerHTML =
        "";


    result.forEach(

        function (
            item
        ) {

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>

                    <span
                        class="code-badge"
                    >

                        ${escapeHtml(
                            item.kodeInventaris
                        )}

                    </span>

                </td>


                <td>

                    <strong>

                        ${escapeHtml(
                            item.nama
                        )}

                    </strong>

                </td>


                <td>

                    ${escapeHtml(
                        item.kategori
                    )}

                </td>


                <td>

                    ${escapeHtml(
                        item.ruangan
                    )}

                </td>


                <td>

                    ${item.jumlah}

                </td>


                <td>

                    <span
                        class="condition-badge ${
                            item.kondisi
                                .toLowerCase()
                        }"
                    >

                        ${conditionLabel(
                            item.kondisi
                        )}

                    </span>

                </td>


                <td>

                    ${formatDate(
                        item.tanggal
                    )}

                </td>


                <td>

                    <div
                        class="action-buttons"
                    >

                        <button
                            class="icon-button edit-button"
                            type="button"
                            title="Edit"
                        >

                            <i
                                class="fa-solid fa-pen"
                            ></i>

                        </button>


                        <button
                            class="icon-button delete delete-button"
                            type="button"
                            title="Hapus"
                        >

                            <i
                                class="fa-solid fa-trash"
                            ></i>

                        </button>

                    </div>

                </td>

            `;


            row.querySelector(
                ".edit-button"
            )?.addEventListener(

                "click",

                function () {

                    openEditModal(
                        item.id
                    );

                }

            );


            row.querySelector(
                ".delete-button"
            )?.addEventListener(

                "click",

                function () {

                    deleteInventory(
                        item.id
                    );

                }

            );


            tbody.appendChild(
                row
            );

        }

    );


    if (
        $("resultCount")
    ) {

        $("resultCount")
            .textContent =
            result.length;

    }


    if (
        $("emptyState")
    ) {

        $("emptyState")
            .classList.toggle(

                "hidden",

                result.length !==
                0

            );

    }

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const total =
        inventoryData.length;


    const good =
        inventoryData.filter(

            function (
                item
            ) {

                return (
                    item.kondisi ===
                    "Baik"
                );

            }

        ).length;


    const attention =
        inventoryData.filter(

            function (
                item
            ) {

                return (
                    item.kondisi !==
                    "Baik"
                );

            }

        ).length;


    const totalStock =
        inventoryData.reduce(

            function (
                sum,
                item
            ) {

                return (

                    sum +

                    Number(
                        item.jumlah ||
                        0
                    )

                );

            },

            0

        );


    setText(
        "totalItems",
        total
    );

    setText(
        "goodItems",
        good
    );

    setText(
        "attentionItems",
        attention
    );

    setText(
        "totalStock",
        totalStock
    );

    setText(
        "terminalTotal",
        total
    );


    updateHealth();

    renderRecent();

    renderLowStock();

}


/* =========================================================
   HEALTH
========================================================= */

function updateHealth() {

    const total =
        inventoryData.length;


    if (
        !total
    ) {

        setText(
            "dataHealth",
            "0%"
        );


        setWidth(
            "healthProgress",
            "0%"
        );


        setText(
            "healthGoodCount",
            "0"
        );


        setText(
            "healthLightCount",
            "0"
        );


        setText(
            "healthHeavyCount",
            "0"
        );


        return;

    }


    const good =
        inventoryData.filter(

            item =>
                item.kondisi ===
                "Baik"

        ).length;


    const light =
        inventoryData.filter(

            item =>
                item.kondisi ===
                "Ringan"

        ).length;


    const heavy =
        inventoryData.filter(

            item =>
                item.kondisi ===
                "Berat"

        ).length;


    const health =
        Math.round(

            good /
            total *
            100

        );


    setText(
        "dataHealth",
        `${health}%`
    );


    setWidth(
        "healthProgress",
        `${health}%`
    );


    setText(
        "healthGoodCount",
        good
    );


    setText(
        "healthLightCount",
        light
    );


    setText(
        "healthHeavyCount",
        heavy
    );

}


/* =========================================================
   RECENT
========================================================= */

function renderRecent() {

    const container =
        $("recentItems");


    if (
        !container
    ) {

        return;

    }


    const items =
        [
            ...inventoryData
        ]

            .sort(

                function (
                    a,
                    b
                ) {

                    return (

                        new Date(
                            b.tanggal
                        )

                        -

                        new Date(
                            a.tanggal
                        )

                    );

                }

            )

            .slice(
                0,
                5
            );


    if (
        !items.length
    ) {

        container.innerHTML = `

            <div class="empty-mini">

                Belum ada inventaris.

            </div>

        `;

        return;

    }


    container.innerHTML =

        items

            .map(

                function (
                    item
                ) {

                    return `

                        <div
                            class="recent-item"
                        >

                            <div
                                class="recent-item-main"
                            >

                                <strong>

                                    ${escapeHtml(
                                        item.nama
                                    )}

                                </strong>

                                <span>

                                    ${escapeHtml(
                                        item.ruangan
                                    )}

                                    ·

                                    ${item.jumlah}
                                    unit

                                </span>

                            </div>


                            <span
                                class="recent-date"
                            >

                                ${formatDate(
                                    item.tanggal
                                )}

                            </span>

                        </div>

                    `;

                }

            )

            .join("");

}


/* =========================================================
   LOW STOCK
========================================================= */

function renderLowStock() {

    const container =
        $("lowStockPreview");


    if (
        !container
    ) {

        return;

    }


    const items =
        inventoryData

            .filter(

                item =>

                    Number(
                        item.jumlah
                    ) <=
                    2

            )

            .slice(
                0,
                5
            );


    if (
        !items.length
    ) {

        container.innerHTML = `

            <div class="empty-mini">

                Tidak ada stok rendah.

            </div>

        `;

        return;

    }


    container.innerHTML =

        items

            .map(

                function (
                    item
                ) {

                    return `

                        <div
                            class="mini-item"
                        >

                            <div
                                class="mini-item-main"
                            >

                                <strong>

                                    ${escapeHtml(
                                        item.nama
                                    )}

                                </strong>

                                <span>

                                    ${escapeHtml(
                                        item.ruangan
                                    )}

                                </span>

                            </div>


                            <span
                                class="mini-stock"
                            >

                                ${item.jumlah}

                            </span>

                        </div>

                    `;

                }

            )

            .join("");

}


/* =========================================================
   ROOM FILTER
========================================================= */

function updateRoomFilter() {

    const select =
        $("roomFilter");


    if (
        !select
    ) {

        return;

    }


    const current =
        select.value;


    const rooms =
        [
            ...new Set(

                inventoryData.map(

                    item =>
                        item.ruangan

                )

            )
        ]

            .sort(

                (
                    a,
                    b
                ) =>

                    a.localeCompare(
                        b,
                        "id"
                    )

            );


    select.innerHTML = `

        <option value="all">

            Semua Ruangan

        </option>

    `;


    rooms.forEach(

        function (
            room
        ) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                room;


            option.textContent =
                room;


            select.appendChild(
                option
            );

        }

    );


    if (
        rooms.includes(
            current
        )
    ) {

        select.value =
            current;

    }

}


/* =========================================================
   MONITORING
========================================================= */

function updateMonitoring() {

    const total =
        inventoryData.length;


    const good =
        inventoryData.filter(

            item =>
                item.kondisi ===
                "Baik"

        ).length;


    const light =
        inventoryData.filter(

            item =>
                item.kondisi ===
                "Ringan"

        ).length;


    const heavy =
        inventoryData.filter(

            item =>
                item.kondisi ===
                "Berat"

        ).length;


    const lowStock =
        inventoryData.filter(

            item =>

                Number(
                    item.jumlah
                ) <=
                2

        ).length;


    setText(
        "monitorTotal",
        total
    );

    setText(
        "monitorGood",
        good
    );

    setText(
        "monitorLowStock",
        lowStock
    );

    setText(
        "monitorHealthGood",
        good
    );

    setText(
        "monitorHealthLight",
        light
    );

    setText(
        "monitorHealthHeavy",
        heavy
    );


    renderRooms();

    updateStorage();

}


/* =========================================================
   ROOMS
========================================================= */

function renderRooms() {

    const container =
        $("roomOverview");


    if (
        !container
    ) {

        return;

    }


    const roomData =
        {};


    inventoryData.forEach(

        function (
            item
        ) {

            roomData[
                item.ruangan
            ] =

                (
                    roomData[
                        item.ruangan
                    ]

                    ||

                    0

                )

                +

                Number(
                    item.jumlah ||
                    0
                );

        }

    );


    const rooms =
        Object.entries(
            roomData
        )

            .sort(

                (
                    a,
                    b
                ) =>

                    b[1] -
                    a[1]

            );


    if (
        !rooms.length
    ) {

        container.innerHTML = `

            <div class="empty-mini">

                Belum ada data ruangan.

            </div>

        `;

        return;

    }


    const max =
        Math.max(

            ...rooms.map(
                x => x[1]
            ),

            1

        );


    container.innerHTML =

        rooms

            .slice(
                0,
                8
            )

            .map(

                function (
                    entry
                ) {

                    const room =
                        entry[0];

                    const count =
                        entry[1];

                    const width =
                        Math.round(

                            count /
                            max *
                            100

                        );


                    return `

                        <div
                            class="room-row"
                        >

                            <div
                                class="room-name"
                            >

                                ${escapeHtml(
                                    room
                                )}

                            </div>


                            <div
                                class="room-bar"
                            >

                                <div
                                    style="width:${width}%"
                                ></div>

                            </div>


                            <strong>

                                ${count}

                            </strong>

                        </div>

                    `;

                }

            )

            .join("");

}


/* =========================================================
   STATISTICS
========================================================= */

function renderStatistics() {

    const total =
        inventoryData.length;


    const good =
        inventoryData.filter(

            item =>
                item.kondisi ===
                "Baik"

        ).length;


    const light =
        inventoryData.filter(

            item =>
                item.kondisi ===
                "Ringan"

        ).length;


    const heavy =
        inventoryData.filter(

            item =>
                item.kondisi ===
                "Berat"

        ).length;


    const goodPercent =
        total
            ? Math.round(
                good /
                total *
                100
            )
            : 0;


    const lightPercent =
        total
            ? Math.round(
                light /
                total *
                100
            )
            : 0;


    const heavyPercent =
        total
            ? Math.round(
                heavy /
                total *
                100
            )
            : 0;


    setText(
        "donutTotal",
        total
    );


    setText(
        "legendGood",
        `${goodPercent}%`
    );


    setText(
        "legendLight",
        `${lightPercent}%`
    );


    setText(
        "legendHeavy",
        `${heavyPercent}%`
    );


    const donut =
        $("conditionDonut");


    if (
        donut
    ) {

        const endGood =
            goodPercent;


        const endLight =
            goodPercent +
            lightPercent;


        donut.style.background =

            `conic-gradient(

                var(--green)
                0% ${endGood}%,

                var(--orange)
                ${endGood}% ${endLight}%,

                var(--red)
                ${endLight}% 100%

            )`;

    }


    renderCategories();

}


/* =========================================================
   CATEGORIES
========================================================= */

function renderCategories() {

    const container =
        $("categoryStats");


    if (
        !container
    ) {

        return;

    }


    const categories =
        {};


    inventoryData.forEach(

        function (
            item
        ) {

            categories[
                item.kategori
            ] =

                (
                    categories[
                        item.kategori
                    ]

                    ||

                    0

                )

                +

                Number(
                    item.jumlah ||
                    0
                );

        }

    );


    const list =
        Object.entries(
            categories
        )

            .sort(

                (
                    a,
                    b
                ) =>
                    b[1] -
                    a[1]

            )

            .slice(
                0,
                8
            );


    if (
        !list.length
    ) {

        container.innerHTML = `

            <div class="empty-mini">

                Belum ada kategori.

            </div>

        `;

        return;

    }


    const max =
        Math.max(

            ...list.map(
                x => x[1]
            ),

            1

        );


    container.innerHTML =

        list

            .map(

                function (
                    entry
                ) {

                    const name =
                        entry[0];

                    const count =
                        entry[1];

                    const width =
                        Math.round(

                            count /
                            max *
                            100

                        );


                    return `

                        <div
                            class="category-item"
                        >

                            <div
                                class="category-name"
                            >

                                ${escapeHtml(
                                    name
                                )}

                            </div>


                            <div
                                class="category-bar"
                            >

                                <div
                                    style="width:${width}%"
                                ></div>

                            </div>


                            <strong>

                                ${count}

                            </strong>

                        </div>

                    `;

                }

            )

            .join("");

}


/* =========================================================
   ACTIVITY
========================================================= */

function loadActivity() {

    try {

        const saved =
            localStorage.getItem(
                ACTIVITY_KEY
            );


        activityData =
            saved
                ? JSON.parse(
                    saved
                )
                : [];


        if (
            !Array.isArray(
                activityData
            )
        ) {

            activityData =
                [];

        }

    }

    catch (error) {

        activityData =
            [];

    }

}


function saveActivity() {

    try {

        localStorage.setItem(

            ACTIVITY_KEY,

            JSON.stringify(
                activityData.slice(
                    0,
                    50
                )
            )

        );

    }

    catch (error) {

        console.error(
            "Activity save error:",
            error
        );

    }

}


function addActivity(
    text,
    icon
) {

    activityData.unshift({

        id:
            createId(),

        text:
            text,

        icon:
            icon ||
            "fa-circle-info",

        time:
            new Date()
                .toISOString()

    });


    activityData =
        activityData.slice(
            0,
            50
        );


    saveActivity();

    renderActivity();

}


function renderActivity() {

    const container =
        $("activityLog");


    if (
        !container
    ) {

        return;

    }


    if (
        !activityData.length
    ) {

        container.innerHTML = `

            <div class="empty-mini">

                Belum ada aktivitas.

            </div>

        `;

        return;

    }


    container.innerHTML =

        activityData

            .slice(
                0,
                20
            )

            .map(

                function (
                    item
                ) {

                    return `

                        <div
                            class="activity-item"
                        >

                            <div
                                class="activity-icon"
                            >

                                <i
                                    class="fa-solid ${escapeHtml(
                                        item.icon
                                    )}"
                                ></i>

                            </div>


                            <div
                                class="activity-text"
                            >

                                <strong>

                                    ${escapeHtml(
                                        item.text
                                    )}

                                </strong>


                                <span>

                                    Sistem Inventaris

                                </span>

                            </div>


                            <div
                                class="activity-time"
                            >

                                ${formatTime(
                                    item.time
                                )}

                            </div>

                        </div>

                    `;

                }

            )

            .join("");

}


/* =========================================================
   STORAGE MONITOR
========================================================= */

function updateStorage() {

    try {

        const data =
            localStorage.getItem(
                STORAGE_KEY
            ) ||
            "";


        const bytes =
            new Blob(
                [
                    data
                ]
            ).size;


        const percentage =
            Math.min(

                100,

                Math.round(

                    bytes /
                    (
                        5 *
                        1024 *
                        1024
                    )

                    *

                    100

                )

            );


        setText(
            "monitorStorage",
            `${percentage}%`
        );


        setText(
            "terminalStorage",
            `${percentage}%`
        );

    }

    catch (error) {

        setText(
            "monitorStorage",
            "0%"
        );


        setText(
            "terminalStorage",
            "0%"
        );

    }

}


/* =========================================================
   BACKUP
========================================================= */

function createAutoBackup() {

    try {

        localStorage.setItem(

            AUTO_BACKUP_KEY,

            JSON.stringify({

                version:
                    "5.5",

                createdAt:
                    new Date()
                        .toISOString(),

                inventory:
                    inventoryData,

                activities:
                    activityData

            })

        );

    }

    catch (error) {

        console.error(
            "Auto backup error:",
            error
        );

    }

}


function createBackup() {

    if (
        !inventoryData.length
    ) {

        showToast(

            "Belum ada data untuk backup.",

            "info"

        );

        return;

    }


    const backup = {

        version:
            "5.5",

        createdAt:
            new Date()
                .toISOString(),

        inventory:
            inventoryData,

        activities:
            activityData

    };


    createAutoBackup();


    downloadFile(

        JSON.stringify(
            backup,
            null,
            2
        ),

        `inventory-backup-${fileDate()}.json`,

        "application/json"

    );


    addActivity(

        "Membuat backup data",

        "fa-database"

    );


    showToast(

        "Backup berhasil dibuat.",

        "success"

    );

}


/* =========================================================
   RESTORE
========================================================= */

function handleRestore(
    event
) {

    const file =
        event.target.files?.[0];


    if (
        !file
    ) {

        return;

    }


    readJSON(
        file
    )

        .then(

            function (
                data
            ) {

                if (

                    !data

                    ||

                    !Array.isArray(
                        data.inventory
                    )

                ) {

                    throw new Error(
                        "Backup tidak valid."
                    );

                }


                openConfirmModal(

                    "Restore Backup",

                    "Data saat ini akan diganti dengan isi backup.",

                    function () {

                        createAutoBackup();


                        inventoryData =
                            normalizeData(
                                data.inventory
                            );


                        if (
                            Array.isArray(
                                data.activities
                            )
                        ) {

                            activityData =
                                data.activities;

                            saveActivity();

                        }


                        saveData();


                        renderAll();


                        addActivity(

                            "Memulihkan backup",

                            "fa-clock-rotate-left"

                        );


                        showToast(

                            "Backup berhasil dipulihkan.",

                            "success"

                        );

                    }

                );

            }

        )

        .catch(

            function (
                error
            ) {

                console.error(
                    "Restore error:",
                    error
                );


                showToast(

                    "File backup tidak valid.",

                    "error"

                );

            }

        )

        .finally(

            function () {

                event.target.value =
                    "";

            }

        );

}


/* =========================================================
   EXPORT CSV
========================================================= */

function exportCSV() {

    if (
        !inventoryData.length
    ) {

        showToast(

            "Belum ada data.",

            "info"

        );

        return;

    }


    const headers = [

        "Kode Inventaris",

        "Nama Barang",

        "Kategori",

        "Ruangan",

        "Jumlah",

        "Kondisi",

        "Keterangan",

        "Tanggal"

    ];


    const rows =
        inventoryData.map(

            function (
                item
            ) {

                return [

                    item.kodeInventaris,

                    item.nama,

                    item.kategori,

                    item.ruangan,

                    item.jumlah,

                    conditionLabel(
                        item.kondisi
                    ),

                    item.keterangan,

                    formatDate(
                        item.tanggal
                    )

                ];

            }

        );


    const csv =

        [

            headers,

            ...rows

        ]

            .map(

                function (
                    row
                ) {

                    return row

                        .map(
                            csvEscape
                        )

                        .join(",");

                }

            )

            .join("\n");


    downloadFile(

        "\uFEFF" +
        csv,

        `inventaris-${fileDate()}.csv`,

        "text/csv;charset=utf-8;"

    );


    addActivity(

        "Export data CSV",

        "fa-file-export"

    );


    showToast(

        "Data berhasil diexport.",

        "success"

    );

}


/* =========================================================
   RESET FILTER
========================================================= */

function resetFilters() {

    if (
        $("searchInput")
    ) {

        $("searchInput")
            .value =
            "";

    }


    if (
        $("roomFilter")
    ) {

        $("roomFilter")
            .value =
            "all";

    }


    if (
        $("conditionFilter")
    ) {

        $("conditionFilter")
            .value =
            "all";

    }


    if (
        $("sortFilter")
    ) {

        $("sortFilter")
            .value =
            "newest";

    }


    renderInventory();

}


/* =========================================================
   CONFIRM MODAL
========================================================= */

function openConfirmModal(

    title,

    message,

    callback

) {

    setText(
        "confirmTitle",
        title
    );


    setText(
        "confirmMessage",
        message
    );


    confirmCallback =
        callback;


    $("confirmModal")
        ?.classList.add(
            "show"
        );


    document.body.classList.add(
        "modal-open"
    );

}


function closeConfirmModal() {

    $("confirmModal")
        ?.classList.remove(
            "show"
        );


    document.body.classList.remove(
        "modal-open"
    );


    confirmCallback =
        null;

}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const saved =
        localStorage.getItem(
            THEME_KEY
        );


    const dark =
        saved ===
        "dark";


    document.body.classList.toggle(
        "dark",
        dark
    );


    updateThemeUI(
        dark
    );

}


function toggleTheme() {

    const dark =
        document.body.classList.toggle(
            "dark"
        );


    localStorage.setItem(

        THEME_KEY,

        dark
            ? "dark"
            : "light"

    );


    updateThemeUI(
        dark
    );

}


function updateThemeUI(
    dark
) {

    if (
        $("themeButton")
    ) {

        $("themeButton").innerHTML =

            dark

                ? `

                    <span>

                        <i
                            class="fa-solid fa-sun"
                        ></i>

                        Light Mode

                    </span>

                    <i
                        class="fa-solid fa-toggle-on"
                    ></i>

                  `

                : `

                    <span>

                        <i
                            class="fa-solid fa-moon"
                        ></i>

                        Dark Mode

                    </span>

                    <i
                        class="fa-solid fa-toggle-off"
                    ></i>

                  `;

    }


    if (
        $("mobileThemeButton")
    ) {

        $("mobileThemeButton")
            .innerHTML =

            dark

                ? `

                    <i
                        class="fa-solid fa-sun"
                    ></i>

                  `

                : `

                    <i
                        class="fa-solid fa-moon"
                    ></i>

                  `;

    }

}


/* =========================================================
   CLOCK
========================================================= */

function updateClock() {

    const now =
        new Date();


    if (
        $("liveClock")
    ) {

        $("liveClock")
            .textContent =

            now.toLocaleTimeString(

                "id-ID",

                {

                    hour:
                        "2-digit",

                    minute:
                        "2-digit",

                    second:
                        "2-digit"

                }

            );

    }


    if (
        $("liveDate")
    ) {

        $("liveDate")
            .textContent =

            now.toLocaleDateString(

                "id-ID",

                {

                    weekday:
                        "long",

                    day:
                        "numeric",

                    month:
                        "long",

                    year:
                        "numeric"

                }

            );

    }

}


/* =========================================================
   FOOTER YEAR
========================================================= */

function updateFooterYear() {

    const year =
        new Date()
            .getFullYear();


    document
        .querySelectorAll(
            "#footerYear"
        )
        .forEach(

            function (
                element
            ) {

                element.textContent =
                    year;

            }

        );

}


/* =========================================================
   PWA INSTALL
========================================================= */

async function installPWA() {

    if (
        !deferredInstallPrompt
    ) {

        showToast(

            "Installasi belum tersedia di browser ini.",

            "info"

        );

        return;

    }


    try {

        deferredInstallPrompt.prompt();


        await deferredInstallPrompt.userChoice;

    }

    catch (error) {

        console.warn(

            "Install error:",

            error

        );

    }


    deferredInstallPrompt =
        null;


    $("installButton")
        ?.classList.add(
            "hidden"
        );

}


/* =========================================================
   SERVICE WORKER
========================================================= */

async function registerServiceWorker() {

    if (
        !(
            "serviceWorker"
            in navigator
        )
    ) {

        return;

    }


    if (
        location.protocol ===
        "file:"
    ) {

        return;

    }


    try {

        const registration =
            await navigator.serviceWorker.register(

                "service-worker.js",

                {
                    updateViaCache:
                        "none"
                }

            );


        registration.update();


        console.log(
            "Service Worker aktif."
        );

    }

    catch (error) {

        console.warn(

            "Service Worker error:",

            error

        );

    }

}


/* =========================================================
   ACTIVITY CLEAR
========================================================= */

function clearActivities() {

    if (
        !activityData.length
    ) {

        showToast(

            "Aktivitas sudah kosong.",

            "info"

        );

        return;

    }


    openConfirmModal(

        "Bersihkan Aktivitas",

        "Semua aktivitas akan dihapus.",

        function () {

            activityData =
                [];


            saveActivity();


            renderActivity();


            showToast(

                "Aktivitas berhasil dibersihkan.",

                "success"

            );

        }

    );

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

    renderInventory();

    updateDashboard();

    updateMonitoring();

    renderStatistics();

    renderActivity();

    updateRoomFilter();

    updateStorage();

}


/* =========================================================
   SPLASH
========================================================= */

function hideSplash() {

    const splash =
        $("splashScreen");


    if (
        !splash
    ) {

        return;

    }


    setText(

        "loadingText",

        "Sistem siap!"

    );


    setTimeout(

        function () {

            splash.classList.add(
                "hide"
            );

        },

        500

    );

}


/* =========================================================
   HELPERS
========================================================= */

function setText(
    id,
    value
) {

    const element =
        $(id);


    if (
        element
    ) {

        element.textContent =
            value;

    }

}


function setWidth(
    id,
    value
) {

    const element =
        $(id);


    if (
        element
    ) {

        element.style.width =
            value;

    }

}


function createId() {

    if (

        window.crypto &&

        crypto.randomUUID

    ) {

        return crypto.randomUUID();

    }


    return (

        Date.now()
            .toString(36)

        +

        Math.random()
            .toString(36)
            .slice(2)

    );

}


function conditionLabel(
    value
) {

    if (
        value ===
        "Ringan"
    ) {

        return "Rusak Ringan";

    }


    if (
        value ===
        "Berat"
    ) {

        return "Rusak Berat";

    }


    return "Baik";

}


function formatDate(
    value
) {

    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleDateString(

        "id-ID",

        {

            day:
                "2-digit",

            month:
                "short",

            year:
                "numeric"

        }

    );

}


function formatTime(
    value
) {

    const date =
        new Date(
            value
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return date.toLocaleTimeString(

        "id-ID",

        {

            hour:
                "2-digit",

            minute:
                "2-digit"

        }

    );

}


function fileDate() {

    const date =
        new Date();


    return [

        date.getFullYear(),

        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )

    ].join("-");

}


function csvEscape(
    value
) {

    const text =
        String(
            value ??
            ""
        );


    if (

        text.includes(",") ||

        text.includes('"') ||

        text.includes("\n")

    ) {

        return (

            '"' +

            text.replace(
                /"/g,
                '""'
            ) +

            '"'

        );

    }


    return text;

}


function downloadFile(

    content,

    filename,

    type

) {

    const blob =
        new Blob(

            [
                content
            ],

            {
                type:
                    type
            }

        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        filename;


    link.style.display =
        "none";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();


    setTimeout(

        function () {

            URL.revokeObjectURL(
                url
            );

        },

        300

    );

}


function readJSON(
    file
) {

    return new Promise(

        function (
            resolve,
            reject
        ) {

            const reader =
                new FileReader();


            reader.onload =
                function () {

                    try {

                        resolve(

                            JSON.parse(

                                reader.result

                            )

                        );

                    }

                    catch (error) {

                        reject(
                            error
                        );

                    }

                };


            reader.onerror =
                function () {

                    reject(
                        reader.error
                    );

                };


            reader.readAsText(
                file
            );

        }

    );

}


function escapeHtml(
    value
) {

    return String(

        value ??
        ""

    )

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(

    message,

    type =
        "info"

) {

    const container =
        $("toastContainer");


    if (
        !container
    ) {

        return;

    }


    let icon =
        "fa-circle-info";


    let title =
        "Informasi";


    if (
        type ===
        "success"
    ) {

        icon =
            "fa-circle-check";

        title =
            "Berhasil";

    }


    else if (
        type ===
        "error"
    ) {

        icon =
            "fa-circle-xmark";

        title =
            "Error";

    }


    else if (
        type ===
        "warning"
    ) {

        icon =
            "fa-triangle-exclamation";

        title =
            "Peringatan";

    }


    const toast =
        document.createElement(
            "div"
        );


    toast.className =
        `toast ${type}`;


    toast.innerHTML = `

        <i
            class="fa-solid ${icon}"
        ></i>

        <div>

            <strong>

                ${title}

            </strong>

            <span>

                ${escapeHtml(
                    message
                )}

            </span>

        </div>

    `;


    container.appendChild(
        toast
    );


    setTimeout(

        function () {

            toast.classList.add(
                "show"
            );

        },

        20

    );


    setTimeout(

        function () {

            toast.classList.remove(
                "show"
            );


            setTimeout(

                function () {

                    toast.remove();

                },

                300

            );

        },

        3500

    );

}


/* =========================================================
   GLOBAL DEBUG
========================================================= */

window.inventoryApp = {

    auth:

        auth,

    googleLogin:

        loginWithGoogle,

    googleRedirect:

        loginWithGoogleRedirect,

    logout:

        logoutAdmin,

    getCurrentUser:

        function () {

            return (
                auth.currentUser ||
                null
            );

        },

    isAdmin:

        function () {

            return (
                isAdminLoggedIn
            );

        }

};
