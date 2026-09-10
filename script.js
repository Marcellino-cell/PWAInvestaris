/* =========================================================
   SISTEM INVENTARIS RUANGAN
   FULL JAVASCRIPT V5.4
   FIREBASE GOOGLE AUTH + LOCAL ADMIN
========================================================= */


/* =========================================================
   FIREBASE
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
        "AIzaSyBnX15kPEoGJs5bpzSj4jFppDCjk5Tqn7Q",

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


/* =========================================================
   IMPORTANT
   GANTI EMAIL INI DENGAN EMAIL GOOGLE KAMU
========================================================= */

const ADMIN_GOOGLE_EMAILS = [

    "GANTI_DENGAN_EMAIL_GOOGLE_KAMU@gmail.com"

];


/* =========================================================
   STORAGE KEY
========================================================= */

const STORAGE_KEY =
    "roomInventoryData_v53";

const THEME_KEY =
    "roomInventoryTheme_v53";

const ACTIVITY_KEY =
    "roomInventoryActivity_v53";

const AUTO_BACKUP_KEY =
    "roomInventoryAutoBackup_v53";

const AUTH_KEY =
    "roomInventoryAdminAuth_v53";

const GOOGLE_USER_KEY =
    "roomInventoryGoogleUser_v53";


/* =========================================================
   LOCAL ADMIN
========================================================= */

const ADMIN_USERNAME =
    "admin";

const ADMIN_PASSWORD =
    "admin123";


/* =========================================================
   OLD STORAGE
========================================================= */

const OLD_STORAGE_KEYS = [

    "roomInventoryData_v5",

    "roomInventoryData_v4",

    "roomInventoryData_v3"

];


/* =========================================================
   GLOBAL
========================================================= */

let inventoryData = [];

let activityData = [];

let editingId = null;

let confirmCallback = null;

let deferredInstallPrompt = null;

let isAdminLoggedIn = false;

let currentGoogleUser = null;


/* =========================================================
   CONFIG FOOTER
========================================================= */

const FOOTER_CONFIG = {

    supportBy:
        "RPL Developer Team",

    github:
        "https://github.com/",

    linkedin:
        "https://www.linkedin.com/",

    phone:
        "tel:+6281234567890"

};


/* =========================================================
   HELPER
========================================================= */

function $(id) {

    return document.getElementById(id);

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

async function init() {

    try {

        loadTheme();

        loadData();

        loadActivity();

        loadLocalAuth();

        bindEvents();

        renderAll();

        updateClock();

        updateFooterYear();

        hideSplash();

        registerServiceWorker();

        await setupFirebaseAuth();

    }

    catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        showToast(
            "Terjadi error saat memuat aplikasi.",
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

                handleFirebaseUser(
                    user
                );

            }
        );


        try {

            const result =
                await getRedirectResult(
                    auth
                );


            if (
                result &&
                result.user
            ) {

                console.log(
                    "Google redirect login berhasil."
                );

            }

        }

        catch (
            redirectError
        ) {

            if (
                redirectError.code !==
                "auth/no-auth-event"
            ) {

                console.warn(
                    "Redirect result:",
                    redirectError
                );

            }

        }

    }

    catch (
        error
    ) {

        console.error(
            "Firebase setup error:",
            error
        );

        setGoogleStatus(
            "Firebase Authentication belum siap.",
            true
        );

    }

}


/* =========================================================
   FIREBASE USER HANDLER
========================================================= */

function handleFirebaseUser(
    user
) {

    currentGoogleUser =
        user || null;


    if (
        user
    ) {

        const email =
            (
                user.email ||
                ""
            )
            .toLowerCase()
            .trim();


        const isAllowed =
            ADMIN_GOOGLE_EMAILS
                .map(
                    item =>
                        item
                            .toLowerCase()
                            .trim()
                )
                .includes(
                    email
                );


        localStorage.setItem(
            GOOGLE_USER_KEY,
            JSON.stringify({

                uid:
                    user.uid,

                email:
                    user.email,

                displayName:
                    user.displayName,

                photoURL:
                    user.photoURL

            })
        );


        if (
            isAllowed
        ) {

            isAdminLoggedIn =
                true;


            localStorage.setItem(
                AUTH_KEY,
                "google-admin"
            );


            updateAuthUI();


            showGoogleAccount(
                user
            );

        }

        else {

            isAdminLoggedIn =
                false;


            localStorage.removeItem(
                AUTH_KEY
            );


            updateAuthUI();


            showGoogleAccount(
                user,
                false
            );

        }

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

        }


        localStorage.removeItem(
            GOOGLE_USER_KEY
        );


        updateAuthUI();

        clearGoogleAccount();

    }

}


/* =========================================================
   GOOGLE LOGIN
========================================================= */

async function loginWithGoogle() {

    const button =
        $("googleLoginButton");


    try {

        if (
            button
        ) {

            button.classList.add(
                "loading"
            );

            button.disabled =
                true;

        }


        setGoogleStatus(
            "Membuka login Google..."
        );


        /*
           Desktop / laptop:
           popup login.
        */

        if (
            window.innerWidth >
            700
        ) {

            await signInWithPopup(
                auth,
                googleProvider
            );

        }

        else {

            /*
               Mobile:
               redirect login.
            */

            await signInWithRedirect(
                auth,
                googleProvider
            );

        }

    }

    catch (
        error
    ) {

        console.error(
            "Google Login Error:",
            error
        );


        let message =
            "Login Google gagal.";


        switch (
            error.code
        ) {

            case "auth/popup-closed-by-user":

                message =
                    "Jendela Google ditutup.";

                break;


            case "auth/popup-blocked":

                message =
                    "Popup Google diblokir browser.";

                break;


            case "auth/unauthorized-domain":

                message =
                    "Domain website belum ditambahkan di Firebase Authorized Domains.";

                break;


            case "auth/network-request-failed":

                message =
                    "Koneksi internet bermasalah.";

                break;


            default:

                message =
                    error.message ||
                    message;

        }


        setGoogleStatus(
            message,
            true
        );


        showToast(
            message,
            "error"
        );

    }

    finally {

        if (
            button
        ) {

            button.classList.remove(
                "loading"
            );

            button.disabled =
                false;

        }

    }

}


/* =========================================================
   GOOGLE LOGOUT
========================================================= */

async function logoutGoogle() {

    try {

        await signOut(
            auth
        );

    }

    catch (
        error
    ) {

        console.error(
            "Google logout error:",
            error
        );

    }

}


/* =========================================================
   GOOGLE ACCOUNT UI
========================================================= */

function showGoogleAccount(
    user,
    allowed = true
) {

    const status =
        $("googleLoginStatus");


    if (
        !status
    ) {

        return;

    }


    const name =
        user.displayName ||
        user.email ||
        "Google User";


    if (
        allowed
    ) {

        status.innerHTML = `

            <span class="google-user-success">

                <i class="fa-solid fa-circle-check"></i>

                Login sebagai
                <strong>
                    ${escapeHtml(name)}
                </strong>

            </span>

        `;

    }

    else {

        status.innerHTML = `

            <span class="google-user-warning">

                <i class="fa-solid fa-triangle-exclamation"></i>

                Akun Google berhasil login,
                tetapi bukan akun admin.

            </span>

        `;

    }

}


/* =========================================================
   CLEAR GOOGLE UI
========================================================= */

function clearGoogleAccount() {

    setGoogleStatus(
        ""
    );

}


/* =========================================================
   GOOGLE STATUS
========================================================= */

function setGoogleStatus(
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


    if (
        !message
    ) {

        element.innerHTML =
            "";

        return;

    }


    element.innerHTML = `

        <span
            class="${error ? "google-user-error" : ""}"
        >

            ${escapeHtml(
                message
            )}

        </span>

    `;

}


/* =========================================================
   LOCAL AUTH LOAD
========================================================= */

function loadLocalAuth() {

    const state =
        localStorage.getItem(
            AUTH_KEY
        );


    if (
        state ===
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

    document.body.classList.toggle(
        "admin-logged-in",
        isAdminLoggedIn
    );


    const text =
        $("loginButtonText");


    const icon =
        $("loginButtonIcon");


    const dot =
        $("loginStatusDot");


    const button =
        $("loginButton");


    if (
        isAdminLoggedIn
    ) {

        if (
            text
        ) {

            text.textContent =
                "Logout Admin";

        }


        if (
            icon
        ) {

            icon.className =
                "fa-solid fa-right-from-bracket";

        }


        if (
            dot
        ) {

            dot.classList.add(
                "logged-in"
            );

        }


        if (
            button
        ) {

            button.title =
                "Logout Admin";

        }

    }

    else {

        if (
            text
        ) {

            text.textContent =
                "Login Admin";

        }


        if (
            icon
        ) {

            icon.className =
                "fa-solid fa-right-to-bracket";

        }


        if (
            dot
        ) {

            dot.classList.remove(
                "logged-in"
            );

        }


        if (
            button
        ) {

            button.title =
                "Login Admin";

        }

    }

}


/* =========================================================
   LOGIN MODAL
========================================================= */

function openLoginModal() {

    if (
        isAdminLoggedIn
    ) {

        logoutAdmin();

        return;

    }


    $("loginForm")
        ?.reset();


    if (
        $("loginError")
    ) {

        $("loginError")
            .textContent =
            "";

    }


    clearGoogleAccount();


    $("loginModal")
        ?.classList.add(
            "show"
        );


    document.body.classList.add(
        "modal-open"
    );


    setTimeout(
        function () {

            $("loginUsername")
                ?.focus();

        },
        120
    );

}


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

function handleLoginSubmit(
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
        ADMIN_USERNAME &&
        password ===
        ADMIN_PASSWORD
    ) {

        isAdminLoggedIn =
            true;


        localStorage.setItem(
            AUTH_KEY,
            "local-admin"
        );


        updateAuthUI();


        closeLoginModal();


        addActivity(
            "Login Admin lokal",
            "fa-right-to-bracket"
        );


        showToast(
            "Login admin berhasil.",
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
   LOGOUT
========================================================= */

async function logoutAdmin() {

    const usingGoogle =
        Boolean(
            currentGoogleUser
        );


    if (
        usingGoogle
    ) {

        await logoutGoogle();

    }


    isAdminLoggedIn =
        false;


    localStorage.removeItem(
        AUTH_KEY
    );


    closeLoginModal();

    closeInventoryModal();

    closeConfirmModal();


    updateAuthUI();


    addActivity(
        "Logout Admin",
        "fa-right-from-bracket"
    );


    showToast(
        "Logout berhasil. Data kembali terkunci.",
        "info"
    );

}


/* =========================================================
   ADMIN CHECK
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
        `Silakan login admin untuk ${action}.`,
        "error"
    );


    openLoginModal();


    return false;

}


/* =========================================================
   EVENTS
========================================================= */

function bindEvents() {

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
            handleLoginSubmit
        );


    $("googleLoginButton")
        ?.addEventListener(
            "click",
            loginWithGoogle
        );


    $("togglePasswordButton")
        ?.addEventListener(
            "click",
            togglePassword
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


    /* NAVIGATION */

    document
        .querySelectorAll(
            ".menu-item[data-target]"
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


    /* MOBILE */

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


    /* THEME */

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


    /* ADD */

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


    $("heroMonitorButton")
        ?.addEventListener(
            "click",
            function () {

                switchSection(
                    "monitoring"
                );

            }
        );


    /* INVENTORY */

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


    /* CONFIRM */

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


    /* TOOLS */

    $("exportButton")
        ?.addEventListener(
            "click",
            exportCSV
        );


    $("backupButton")
        ?.addEventListener(
            "click",
            createBackup
        );


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


    $("printButton")
        ?.addEventListener(
            "click",
            function () {

                window.print();

            }
        );


    $("clearActivityButton")
        ?.addEventListener(
            "click",
            clearActivities
        );


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


    /* GPS */

    $("footerGpsButton")
        ?.addEventListener(
            "click",
            openGPS
        );


    /* ESC */

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

        }
    );


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
   PASSWORD
========================================================= */

function togglePassword() {

    const input =
        $("loginPassword");

    const button =
        $("togglePasswordButton");


    if (
        !input ||
        !button
    ) {

        return;

    }


    const show =
        input.type ===
        "password";


    input.type =
        show
            ? "text"
            : "password";


    button.innerHTML =
        show
            ? '<i class="fa-solid fa-eye-slash"></i>'
            : '<i class="fa-solid fa-eye"></i>';

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


    window.scrollTo(
        {
            top:
                0,

            behavior:
                "smooth"

        }
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
   DATA
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

    catch (
        error
    ) {

        console.error(
            error
        );

        inventoryData =
            [];

    }

}


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


function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            inventoryData
        )
    );

}


/* =========================================================
   MODAL INVENTORY
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


    $("modalTitle")
        .textContent =
        "Tambah Inventaris";


    $("inventoryForm")
        ?.reset();


    $("inventoryQuantity")
        .value =
        "1";


    $("inventoryCondition")
        .value =
        "Baik";


    $("inventoryModal")
        ?.classList.add(
            "show"
        );


    document.body.classList.add(
        "modal-open"
    );

}


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
            entry =>
                entry.id ===
                id
        );


    if (
        !item
    ) {

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
   FORM
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
            .value
            .trim();


    const name =
        $("inventoryName")
            .value
            .trim();


    const category =
        $("inventoryCategory")
            .value
            .trim();


    const room =
        $("inventoryRoom")
            .value
            .trim();


    const quantity =
        Number(
            $("inventoryQuantity")
                .value
        );


    const condition =
        $("inventoryCondition")
            .value;


    const notes =
        $("inventoryNotes")
            .value
            .trim();


    if (
        !code ||
        !name ||
        !category ||
        !room
    ) {

        showToast(
            "Lengkapi data terlebih dahulu.",
            "error"
        );

        return;

    }


    if (
        !Number.isFinite(
            quantity
        ) ||
        quantity <
        0
    ) {

        showToast(
            "Jumlah tidak valid.",
            "error"
        );

        return;

    }


    const duplicate =
        inventoryData.find(
            item =>
                item
                    .kodeInventaris
                    .toLowerCase() ===
                code
                    .toLowerCase() &&
                item.id !==
                    editingId
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
                item =>
                    item.id ===
                    editingId
            );


        inventoryData[index] = {

            ...inventoryData[index],

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
            "Data berhasil ditambahkan.",
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
            entry =>
                entry.id ===
                id
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

            createAutoBackup();


            inventoryData =
                inventoryData.filter(
                    entry =>
                        entry.id !==
                        id
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
   INVENTORY RENDER
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
            item => {

                const matchesSearch =
                    !search ||
                    item
                        .kodeInventaris
                        .toLowerCase()
                        .includes(
                            search
                        ) ||
                    item
                        .nama
                        .toLowerCase()
                        .includes(
                            search
                        ) ||
                    item
                        .kategori
                        .toLowerCase()
                        .includes(
                            search
                        ) ||
                    item
                        .ruangan
                        .toLowerCase()
                        .includes(
                            search
                        );


                const matchesRoom =
                    room ===
                    "all" ||
                    item.ruangan ===
                    room;


                const matchesCondition =
                    condition ===
                    "all" ||
                    item.kondisi ===
                    condition;


                return (
                    matchesSearch &&
                    matchesRoom &&
                    matchesCondition
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
                    ) -
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
                ) -
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

            const tr =
                document.createElement(
                    "tr"
                );


            tr.innerHTML = `

                <td>

                    <span class="code-badge">

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
                        class="condition-badge ${item.kondisi.toLowerCase()}"
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

                    <div class="action-buttons">

                        <button
                            class="icon-button edit-button"
                            type="button"
                            title="Edit"
                        >

                            <i class="fa-solid fa-pen"></i>

                        </button>


                        <button
                            class="icon-button delete delete-button"
                            type="button"
                            title="Hapus"
                        >

                            <i class="fa-solid fa-trash"></i>

                        </button>

                    </div>

                </td>

            `;


            tr.querySelector(
                ".edit-button"
            )?.addEventListener(
                "click",
                function () {

                    openEditModal(
                        item.id
                    );

                }
            );


            tr.querySelector(
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
                tr
            );

        }
    );


    $("resultCount").textContent =
        result.length;


    $("emptyState")
        ?.classList.toggle(
            "hidden",
            result.length !== 0
        );

}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const total =
        inventoryData.length;


    const good =
        inventoryData.filter(
            item =>
                item.kondisi ===
                "Baik"
        ).length;


    const attention =
        inventoryData.filter(
            item =>
                item.kondisi !==
                "Baik"
        ).length;


    const stock =
        inventoryData.reduce(
            (
                total,
                item
            ) =>
                total +
                Number(
                    item.jumlah ||
                    0
                ),
            0
        );


    $("totalItems").textContent =
        total;


    $("goodItems").textContent =
        good;


    $("attentionItems").textContent =
        attention;


    $("totalStock").textContent =
        stock;


    $("terminalTotal").textContent =
        total;


    updateHealth();

    renderRecent();

    renderLowStock();

}


/* =========================================================
   HEALTH
========================================================= */

function updateHealth() {

    if (
        !inventoryData.length
    ) {

        $("dataHealth").textContent =
            "0%";


        $("healthProgress").style.width =
            "0%";


        return;

    }


    const complete =
        inventoryData.filter(
            item =>
                item.kodeInventaris &&
                item.nama &&
                item.kategori &&
                item.ruangan
        ).length;


    const percentage =
        Math.round(
            complete /
            inventoryData.length *
            100
        );


    $("dataHealth").textContent =
        `${percentage}%`;


    $("healthProgress").style.width =
        `${percentage}%`;


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


    $("healthGoodCount").textContent =
        good;


    $("healthLightCount").textContent =
        light;


    $("healthHeavyCount").textContent =
        heavy;

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
            (
                a,
                b
            ) =>
                new Date(
                    b.tanggal
                ) -
                new Date(
                    a.tanggal
                )
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
                item => `

                    <div class="recent-item">

                        <div class="recent-item-main">

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

                        <span class="recent-date">

                            ${formatDate(
                                item.tanggal
                            )}

                        </span>

                    </div>

                `
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
                item => `

                    <div class="mini-item">

                        <div class="mini-item-main">

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

                        <span class="mini-stock">

                            ${item.jumlah}

                        </span>

                    </div>

                `
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
   ROOM OVERVIEW
========================================================= */

function renderRooms() {

    const container =
        $("roomOverview");


    if (
        !container
    ) {

        return;

    }


    const roomData = {};


    inventoryData.forEach(
        item => {

            roomData[
                item.ruangan
            ] =
                (
                    roomData[
                        item.ruangan
                    ] ||
                    0
                ) +
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
                item =>
                    item[1]
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
                (
                    [room, count]
                ) => {

                    const width =
                        Math.round(
                            count /
                            max *
                            100
                        );


                    return `

                        <div class="room-row">

                            <div class="room-name">

                                ${escapeHtml(
                                    room
                                )}

                            </div>

                            <div class="room-bar">

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
   MONITORING
========================================================= */

function updateMonitoring() {

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


    $("monitorTotal").textContent =
        inventoryData.length;


    $("monitorGood").textContent =
        good;


    $("monitorLowStock").textContent =
        lowStock;


    $("monitorHealthGood").textContent =
        good;


    $("monitorHealthLight").textContent =
        light;


    $("monitorHealthHeavy").textContent =
        heavy;


    updateStorage();

    renderRooms();

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


    $("donutTotal").textContent =
        total;


    $("legendGood").textContent =
        `${goodPercent}%`;


    $("legendLight").textContent =
        `${lightPercent}%`;


    $("legendHeavy").textContent =
        `${heavyPercent}%`;


    const endGood =
        goodPercent;


    const endLight =
        goodPercent +
        lightPercent;


    $("conditionDonut")
        .style.background =
        `
            conic-gradient(
                var(--green)
                0% ${endGood}%,

                var(--orange)
                ${endGood}% ${endLight}%,

                var(--red)
                ${endLight}% 100%
            )
        `;


    renderCategories();

}


/* =========================================================
   CATEGORY
========================================================= */

function renderCategories() {

    const container =
        $("categoryStats");


    const categories = {};


    inventoryData.forEach(
        item => {

            categories[
                item.kategori
            ] =
                (
                    categories[
                        item.kategori
                    ] ||
                    0
                ) +
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
                item =>
                    item[1]
            ),
            1
        );


    container.innerHTML =
        list
            .slice(
                0,
                8
            )
            .map(
                (
                    [name, count]
                ) => {

                    const width =
                        Math.round(
                            count /
                            max *
                            100
                        );


                    return `

                        <div class="category-item">

                            <div class="category-name">

                                ${escapeHtml(
                                    name
                                )}

                            </div>

                            <div class="category-bar">

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

    catch (
        error
    ) {

        activityData =
            [];

    }

}


function saveActivity() {

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
                item => `

                    <div class="activity-item">

                        <div class="activity-icon">

                            <i
                                class="fa-solid ${escapeHtml(
                                    item.icon
                                )}"
                            ></i>

                        </div>


                        <div class="activity-text">

                            <strong>

                                ${escapeHtml(
                                    item.text
                                )}

                            </strong>

                            <span>
                                Sistem Inventaris
                            </span>

                        </div>


                        <div class="activity-time">

                            ${formatTime(
                                item.time
                            )}

                        </div>

                    </div>

                `
            )
            .join("");

}


/* =========================================================
   STORAGE
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


        const percent =
            Math.min(
                100,
                Math.round(
                    bytes /
                    (
                        5 *
                        1024 *
                        1024
                    ) *
                    100
                )
            );


        $("monitorStorage").textContent =
            `${percent}%`;


        $("terminalStorage").textContent =
            `${percent}%`;

    }

    catch (
        error
    ) {

        $("monitorStorage").textContent =
            "0%";

        $("terminalStorage").textContent =
            "0%";

    }

}


/* =========================================================
   BACKUP
========================================================= */

function createAutoBackup() {

    localStorage.setItem(
        AUTO_BACKUP_KEY,
        JSON.stringify({

            version:
                "5.4",

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


function createBackup() {

    if (
        !inventoryData.length
    ) {

        showToast(
            "Belum ada data.",
            "info"
        );

        return;

    }


    createAutoBackup();


    const backup = {

        version:
            "5.4",

        createdAt:
            new Date()
                .toISOString(),

        inventory:
            inventoryData,

        activities:
            activityData

    };


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
                !data ||
                !Array.isArray(
                    data.inventory
                )
            ) {

                throw new Error(
                    "Invalid backup"
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
        function () {

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
   CSV
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
            item => [

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

            ]
        );


    const csv =
        [
            headers,
            ...rows
        ]
        .map(
            row =>
                row
                    .map(
                        csvEscape
                    )
                    .join(",")
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
        "CSV berhasil dibuat.",
        "success"
    );

}


/* =========================================================
   FILTER
========================================================= */

function resetFilters() {

    $("searchInput").value =
        "";

    $("roomFilter").value =
        "all";

    $("conditionFilter").value =
        "all";

    $("sortFilter").value =
        "newest";


    renderInventory();

}


/* =========================================================
   CONFIRM
========================================================= */

function openConfirmModal(
    title,
    message,
    callback
) {

    $("confirmTitle")
        .textContent =
        title;


    $("confirmMessage")
        .textContent =
        message;


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

                        <i class="fa-solid fa-sun"></i>

                        Light Mode

                    </span>

                    <i class="fa-solid fa-toggle-on"></i>

                `

                : `

                    <span>

                        <i class="fa-solid fa-moon"></i>

                        Dark Mode

                    </span>

                    <i class="fa-solid fa-toggle-off"></i>

                `;

    }


    if (
        $("mobileThemeButton")
    ) {

        $("mobileThemeButton")
            .innerHTML =

            dark

                ? `<i class="fa-solid fa-sun"></i>`

                : `<i class="fa-solid fa-moon"></i>`;

    }

}


/* =========================================================
   GPS
========================================================= */

function openGPS() {

    if (
        !navigator.geolocation
    ) {

        showToast(
            "Browser tidak mendukung GPS.",
            "error"
        );

        return;

    }


    showToast(
        "Mengambil lokasi perangkat...",
        "info"
    );


    navigator.geolocation.getCurrentPosition(

        function (
            position
        ) {

            const lat =
                position.coords.latitude;


            const lon =
                position.coords.longitude;


            const url =
                `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;


            addActivity(
                "Membuka GPS",
                "fa-location-dot"
            );


            window.open(
                url,
                "_blank",
                "noopener,noreferrer"
            );


            showToast(
                "Lokasi berhasil ditemukan.",
                "success"
            );

        },

        function (
            error
        ) {

            let message =
                "GPS gagal digunakan.";


            if (
                error.code ===
                1
            ) {

                message =
                    "Izin lokasi ditolak. Izinkan akses lokasi pada browser.";

            }


            if (
                error.code ===
                2
            ) {

                message =
                    "Lokasi perangkat tidak tersedia.";

            }


            if (
                error.code ===
                3
            ) {

                message =
                    "Permintaan lokasi terlalu lama.";

            }


            showToast(
                message,
                "error"
            );

        },

        {

            enableHighAccuracy:
                true,

            timeout:
                15000,

            maximumAge:
                0

        }

    );

}


/* =========================================================
   PWA
========================================================= */

async function installPWA() {

    if (
        !deferredInstallPrompt
    ) {

        showToast(
            "Install App belum tersedia.",
            "info"
        );

        return;

    }


    try {

        deferredInstallPrompt.prompt();


        await deferredInstallPrompt.userChoice;

    }

    catch (
        error
    ) {

        console.warn(
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

        await navigator.serviceWorker.register(
            "service-worker.js"
        );

        console.log(
            "Service Worker aktif."
        );

    }

    catch (
        error
    ) {

        console.warn(
            "Service Worker:",
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
        "Semua log aktivitas akan dihapus.",
        function () {

            activityData =
                [];


            saveActivity();

            renderActivity();


            showToast(
                "Aktivitas dibersihkan.",
                "success"
            );

        }
    );

}


/* =========================================================
   FOOTER
========================================================= */

function updateFooterYear() {

    const year =
        new Date()
            .getFullYear();


    if (
        $("footerYear")
    ) {

        $("footerYear")
            .textContent =
            year;

    }

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

    updateFooterYear();

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


    const loadingText =
        $("loadingText");


    if (
        loadingText
    ) {

        loadingText
            .textContent =
            "Sistem siap digunakan.";

    }


    setTimeout(
        function () {

            splash.classList.add(
                "hide"
            );

        },
        900
    );

}


/* =========================================================
   UTILITIES
========================================================= */

function createId() {

    if (
        window.crypto &&
        crypto.randomUUID
    ) {

        return crypto.randomUUID();

    }


    return (
        Date.now()
            .toString(36) +
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


function fileDate() {

    const now =
        new Date();


    return [

        now.getFullYear(),

        String(
            now.getMonth() + 1
        ).padStart(
            2,
            "0"
        ),

        String(
            now.getDate()
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
                type
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const a =
        document.createElement(
            "a"
        );


    a.href =
        url;


    a.download =
        filename;


    document.body.appendChild(
        a
    );


    a.click();


    a.remove();


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

                    catch (
                        error
                    ) {

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


    if (
        type ===
        "error"
    ) {

        icon =
            "fa-circle-xmark";

        title =
            "Error";

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


    requestAnimationFrame(
        function () {

            toast.classList.add(
                "show"
            );

        }
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
                250
            );

        },
        3200
    );

}
