/* =========================================================
   FIREBASE ADMIN LOGIN - TAMBAHAN
   Firebase hanya digunakan untuk autentikasi Admin.
   Data inventaris tetap memakai LocalStorage seperti kode asli.
========================================================= */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCGYXZYJroOjIsBw0PD2h6KqoEyZKb-Gxw",
  authDomain: "sistem-inventaris-ruangan-2026.firebaseapp.com",
  projectId: "sistem-inventaris-ruangan-2026",
  storageBucket: "sistem-inventaris-ruangan-2026.firebasestorage.app",
  messagingSenderId: "760181965978",
  appId: "1:760181965978:web:a444ceb2d29676b9e30b23",
  measurementId: "G-W1Z7CFXX0M"
};

let firebaseApp = null;
let firebaseAuth = null;
let firebaseUser = null;
let firebaseFns = null;
let firebaseAuthReady = false;
let firebaseLoading = null;

function loadFirebaseAuth() {
  if (firebaseFns) return Promise.resolve(firebaseFns);
  if (firebaseLoading) return firebaseLoading;

  firebaseLoading = Promise.all([
    import(
      "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js"
    ),
    import(
      "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js"
    )
  ])
    .then(([appModule, authModule]) => {

      firebaseApp =
        appModule.initializeApp(
          FIREBASE_CONFIG
        );

      firebaseFns =
        authModule;

      firebaseAuth =
        authModule.getAuth(
          firebaseApp
        );

      return authModule
        .setPersistence(
          firebaseAuth,
          authModule.browserLocalPersistence
        )
        .then(
          () => firebaseFns
        );

    })
    .catch((error) => {

      firebaseLoading = null;

      throw error;

    });

  return firebaseLoading;
}


/* =========================================================
   ADMIN LOGIN UI
========================================================= */

function updateAdminLoginUI() {

  const button =
    document.getElementById(
      "loginButton"
    );

  const name =
    document.getElementById(
      "adminName"
    );

  const role =
    document.getElementById(
      "adminRole"
    );

  const avatar =
    document.getElementById(
      "adminAvatar"
    );

  const dot =
    document.getElementById(
      "loginStatusDot"
    );


  if (!button) {
    return;
  }


  if (firebaseUser) {

    if (name) {

      name.textContent =
        firebaseUser.displayName ||
        firebaseUser.email ||
        "Admin";

    }


    if (role) {

      role.textContent =
        "Administrator • Online";

    }


    if (avatar) {

      avatar.innerHTML = `
        <svg aria-hidden="true">
          <use href="#icon-shield"></use>
        </svg>
      `;

    }


    dot?.classList.add(
      "logged-in"
    );


    button.title =
      "Klik untuk logout Admin";


    button.setAttribute(
      "aria-label",
      "Logout Admin"
    );

  }

  else {

    if (name) {

      name.textContent =
        "MarcelZuhdan";

    }


    if (role) {

      role.textContent =
        "Login Admin";

    }


    if (avatar) {

      avatar.innerHTML = `
        <svg aria-hidden="true">
          <use href="#icon-shield"></use>
        </svg>
      `;

    }


    dot?.classList.remove(
      "logged-in"
    );


    button.title =
      "Klik untuk Login Admin";


    button.setAttribute(
      "aria-label",
      "Login Admin"
    );

  }

}


/* =========================================================
   LOGIN ERROR
========================================================= */

function showLoginError(
  message
) {

  const error =
    document.getElementById(
      "loginError"
    );


  if (error) {

    error.textContent =
      message || "";

  }

}


/* =========================================================
   OPEN LOGIN
========================================================= */

function openLoginModal() {

  const modal =
    document.getElementById(
      "loginModal"
    );


  if (!modal) {
    return;
  }


  if (firebaseUser) {

    logoutAdmin();

    return;

  }


  showLoginError(
    ""
  );


  const status =
    document.getElementById(
      "googleLoginStatus"
    );


  if (status) {

    status.textContent =
      "";

  }


  modal.classList.add(
    "show"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  setTimeout(
    () => {

      document
        .getElementById(
          "loginEmail"
        )
        ?.focus();

    },
    80
  );

}


/* =========================================================
   CLOSE LOGIN
========================================================= */

function closeLoginModal() {

  const modal =
    document.getElementById(
      "loginModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "show"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  showLoginError(
    ""
  );

}


/* =========================================================
   FIREBASE AUTH STATE
========================================================= */

async function setupFirebaseAuth() {

  try {

    await loadFirebaseAuth();


    firebaseFns.onAuthStateChanged(
      firebaseAuth,
      (user) => {

        firebaseUser =
          user || null;


        firebaseAuthReady =
          true;


        updateAdminLoginUI();

      }
    );

  }

  catch (error) {

    console.warn(
      "Firebase Auth belum tersedia:",
      error
    );


    firebaseAuthReady =
      false;


    updateAdminLoginUI();

  }

}


/* =========================================================
   FIREBASE ERROR
========================================================= */

function getFirebaseErrorMessage(
  error
) {

  const code =
    error?.code || "";


  const messages = {

    "auth/invalid-credential":
      "Email atau password Admin salah.",

    "auth/invalid-email":
      "Format email tidak valid.",

    "auth/user-disabled":
      "Akun Admin sedang dinonaktifkan.",

    "auth/too-many-requests":
      "Terlalu banyak percobaan. Coba lagi nanti.",

    "auth/popup-closed-by-user":
      "Login Google dibatalkan.",

    "auth/popup-blocked":
      "Popup diblokir browser. Izinkan popup lalu coba lagi.",

    "auth/network-request-failed":
      "Koneksi internet bermasalah.",

    "auth/operation-not-allowed":
      "Metode login belum diaktifkan di Firebase."

  };


  return (
    messages[code] ||
    error?.message ||
    "Login Admin gagal. Coba lagi."
  );

}


/* =========================================================
   LOGIN EMAIL + PASSWORD
========================================================= */

async function loginAdminEmail(
  event
) {

  event.preventDefault();


  const email =
    document
      .getElementById(
        "loginEmail"
      )
      ?.value
      .trim();


  const password =
    document
      .getElementById(
        "loginPassword"
      )
      ?.value ||
    "";


  if (
    !email ||
    !password
  ) {

    showLoginError(
      "Email dan password wajib diisi."
    );

    return;

  }


  showLoginError(
    ""
  );


  const submit =
    document.querySelector(
      "#loginForm .login-submit"
    );


  if (submit) {

    submit.disabled =
      true;


    submit.dataset.originalText =
      submit.textContent;


    submit.textContent =
      "Memproses...";

  }


  try {

    await loadFirebaseAuth();


    await firebaseFns.signInWithEmailAndPassword(
      firebaseAuth,
      email,
      password
    );


    closeLoginModal();


    showToast(
      "Login Berhasil",
      "Akses Administrator telah aktif."
    );

  }

  catch (error) {

    console.error(
      error
    );


    showLoginError(
      getFirebaseErrorMessage(
        error
      )
    );

  }

  finally {

    if (submit) {

      submit.disabled =
        false;


      submit.textContent =
        submit.dataset.originalText ||
        "Masuk sebagai Admin";

    }

  }

}


/* =========================================================
   LOGIN GOOGLE
========================================================= */

async function loginAdminGoogle() {

  showLoginError(
    ""
  );


  const status =
    document.getElementById(
      "googleLoginStatus"
    );


  if (status) {

    status.textContent =
      "Menghubungkan ke Google...";

  }


  try {

    await loadFirebaseAuth();


    const provider =
      new firebaseFns.GoogleAuthProvider();


    await firebaseFns.signInWithPopup(
      firebaseAuth,
      provider
    );


    closeLoginModal();


    showToast(
      "Login Google Berhasil",
      "Akses Administrator telah aktif."
    );

  }

  catch (error) {

    console.error(
      error
    );


    if (status) {

      status.textContent =
        getFirebaseErrorMessage(
          error
        );

    }

  }

}


/* =========================================================
   LOGOUT ADMIN
========================================================= */

async function logoutAdmin() {

  try {

    await loadFirebaseAuth();


    await firebaseFns.signOut(
      firebaseAuth
    );


    showToast(
      "Logout Berhasil",
      "Akses Administrator telah dikunci kembali."
    );

  }

  catch (error) {

    console.error(
      error
    );


    showToast(
      "Logout Gagal",
      getFirebaseErrorMessage(
        error
      ),
      "warning"
    );

  }

}


/* =========================================================
   ADMIN GUARD
========================================================= */

function requireFirebaseAdmin(
  action
) {

  if (firebaseUser) {

    return true;

  }


  showToast(
    "Login Admin Diperlukan",
    `Silakan login Admin untuk ${action}.`,
    "warning"
  );


  openLoginModal();


  return false;

}


/* =========================================================
   INVENTARISIT 2.2
   FUTURISTIC IT SYSTEM
========================================================= */


/* =========================================================
   LINK FOOTER
========================================================= */

const FOOTER_LINKS = {

  github:
    "https://github.com/Marcellino-cell",

  linkedin:
    "https://www.linkedin.com/feed/",

  gps:
    "https://maps.app.goo.gl/LF7XkcsbJNuz49Hg7?g_st=aw",

  phone:
    "https://wa.me/qr/UEMXPUCB4JO3L1"

};


/* =========================================================
   CONFIG
========================================================= */

const STORAGE_KEY =
  "inventarisIT_data";

const THEME_KEY =
  "inventarisIT_theme";

const APP_VERSION =
  "2.2";

const LOGO_PATH =
  "icon/logo 1.jpeg";


/* =========================================================
   STATE
========================================================= */

let inventory = [];

let pendingDeleteId =
  null;

let deferredInstallPrompt =
  null;

let toastTimer =
  null;


/* =========================================================
   DOM HELPERS
========================================================= */

const $ = (id) =>
  document.getElementById(
    id
  );


const $$ = (selector) =>
  [
    ...document.querySelectorAll(
      selector
    )
  ];


/* =========================================================
   ELEMENTS
========================================================= */

const els = {

  splash:
    $("splashScreen"),

  app:
    $("app"),

  sidebar:
    $("sidebar"),

  mobileMenu:
    $("mobileMenu"),

  mobileClose:
    $("mobileClose"),

  themeToggle:
    $("themeToggle"),

  themeIcon:
    $("themeIcon"),

  installButton:
    $("installButton"),

  breadcrumbText:
    $("breadcrumbText"),


  totalItems:
    $("totalItems"),

  goodItems:
    $("goodItems"),

  minorItems:
    $("minorItems"),

  majorItems:
    $("majorItems"),

  heroTotal:
    $("heroTotal"),


  goodPercent:
    $("goodPercent"),

  minorPercent:
    $("minorPercent"),

  majorPercent:
    $("majorPercent"),


  goodProgress:
    $("goodProgress"),

  minorProgress:
    $("minorProgress"),

  majorProgress:
    $("majorProgress"),


  goodProgressText:
    $("goodProgressText"),

  minorProgressText:
    $("minorProgressText"),

  majorProgressText:
    $("majorProgressText"),


  recentInventory:
    $("recentInventory"),


  searchInput:
    $("searchInput"),

  roomFilter:
    $("roomFilter"),

  conditionFilter:
    $("conditionFilter"),

  resetFilters:
    $("resetFilters"),


  inventoryGrid:
    $("inventoryGrid"),

  inventoryCount:
    $("inventoryCount"),


  form:
    $("inventoryForm"),

  editId:
    $("editId"),

  itemName:
    $("itemName"),

  itemCode:
    $("itemCode"),

  itemRoom:
    $("itemRoom"),

  itemQuantity:
    $("itemQuantity"),


  formTitle:
    $("formTitle"),

  submitText:
    $("submitText"),

  cancelEdit:
    $("cancelEdit"),

  resetForm:
    $("resetForm"),


  donutChart:
    $("donutChart"),

  chartTotal:
    $("chartTotal"),

  legendGood:
    $("legendGood"),

  legendMinor:
    $("legendMinor"),

  legendMajor:
    $("legendMajor"),

  roomStatistics:
    $("roomStatistics"),


  exportButton:
    $("exportButton"),

  importButton:
    $("importButton"),

  importInput:
    $("importInput"),


  backupButton:
    $("backupButton"),

  restoreButton:
    $("restoreButton"),

  restoreInput:
    $("restoreInput"),


  clearDataButton:
    $("clearDataButton"),


  toast:
    $("toast"),

  toastTitle:
    $("toastTitle"),

  toastMessage:
    $("toastMessage"),

  toastClose:
    $("toastClose"),


  confirmModal:
    $("confirmModal"),

  cancelDelete:
    $("cancelDelete"),

  confirmDelete:
    $("confirmDelete"),


  bootProgressBar:
    $("bootProgressBar"),

  bootStatus:
    $("bootStatus"),

  log1:
    $("log1"),

  log2:
    $("log2"),

  log3:
    $("log3"),

  log4:
    $("log4")

};


/* =========================================================
   SAFE HTML
========================================================= */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  ).replace(
    /[&<>'"]/g,
    (char) => {

      const map = {

        "&":
          "&amp;",

        "<":
          "&lt;",

        ">":
          "&gt;",

        "'":
          "&#39;",

        '"':
          "&quot;"

      };


      return map[char];

    }
  );

}


/* =========================================================
   FORMAT NUMBER
========================================================= */

function formatNumber(
  value
) {

  return new Intl.NumberFormat(
    "id-ID"
  ).format(
    Number(value) || 0
  );

}


/* =========================================================
   FORMAT DATE
========================================================= */

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


  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day:
        "2-digit",

      month:
        "short",

      year:
        "numeric"
    }
  ).format(
    date
  );

}


/* =========================================================
   GET INITIALS
========================================================= */

function getInitials(
  name
) {

  return String(
    name ||
      "IT"
  )
    .trim()
    .split(
      /\s+/
    )
    .slice(
      0,
      2
    )
    .map(
      (word) =>
        word[0]
    )
    .join("")
    .toUpperCase() ||
    "IT";

}


/* =========================================================
   CONDITION CLASS
========================================================= */

function getConditionClass(
  condition
) {

  if (
    condition ===
      "Rusak Ringan"
  ) {

    return "minor";

  }


  if (
    condition ===
      "Rusak Berat"
  ) {

    return "major";

  }


  return "good";

}


/* =========================================================
   FOOTER
========================================================= */

function createFooterHTML() {

  const github =
    FOOTER_LINKS.github.trim();

  const linkedin =
    FOOTER_LINKS.linkedin.trim();

  const gps =
    FOOTER_LINKS.gps.trim();

  const phone =
    FOOTER_LINKS.phone.trim();


  return `

    <footer class="page-footer">

      <div class="footer-main">

        <div class="footer-brand">

          <div class="footer-logo">

            <img
              src="${LOGO_PATH}"
              alt="Logo InventarisIT"
              class="footer-logo-image"
            >

          </div>

          <div>

            <strong>
              Inventaris<span>IT</span>
            </strong>

            <p>
              Sistem Inventaris Ruangan
            </p>

          </div>

        </div>


        <div class="footer-links">

          <a
            href="${escapeHTML(github || "#")}"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link github"
            ${github
              ? ""
              : 'data-empty-link="true"'}
          >

            <svg>
              <use href="#icon-github"></use>
            </svg>

            GitHub

          </a>


          <a
            href="${escapeHTML(linkedin || "#")}"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link linkedin"
            ${linkedin
              ? ""
              : 'data-empty-link="true"'}
          >

            <svg>
              <use href="#icon-linkedin"></use>
            </svg>

            LinkedIn

          </a>


          <a
            href="${escapeHTML(gps || "#")}"
            target="_blank"
            rel="noopener noreferrer"
            class="footer-link gps"
            ${gps
              ? ""
              : 'data-empty-link="true"'}
          >

            <svg>
              <use href="#icon-location"></use>
            </svg>

            GPS

          </a>


          <a
            href="${escapeHTML(phone || "#")}"
            class="footer-link phone"
            ${phone
              ? ""
              : 'data-empty-link="true"'}
          >

            <svg>
              <use href="#icon-phone"></use>
            </svg>

            Telepon

          </a>

        </div>

      </div>


      <div class="footer-bottom">

        <span>
          © ${new Date().getFullYear()} InventarisIT
        </span>

        <span>
          Created by MarcellinoZuhdan
        </span>

        <span class="footer-status">

          <i></i>

          System Online

        </span>

      </div>

    </footer>

  `;

}


function renderPageFooters() {

  $$(".page-footer-container")
    .forEach(
      (container) => {

        container.innerHTML =
          createFooterHTML();

      }
    );

}


/* =========================================================
   CUSTOM LOGO
========================================================= */

function applyCustomLogo() {

  const splashLogo =
    document.querySelector(
      ".boot-logo"
    );


  if (splashLogo) {

    splashLogo.innerHTML = `

      <img
        src="${LOGO_PATH}"
        alt="Logo InventarisIT"
        class="custom-logo boot-custom-logo"
      >

      <div class="boot-ring ring-one"></div>

      <div class="boot-ring ring-two"></div>

    `;

  }


  const brandBox =
    document.querySelector(
      ".brand-box"
    );


  if (brandBox) {

    brandBox.innerHTML = `

      <img
        src="${LOGO_PATH}"
        alt="Logo InventarisIT"
        class="sidebar-logo custom-logo"
      >

    `;

  }


  $$(".footer-logo")
    .forEach(
      (logo) => {

        logo.innerHTML = `

          <img
            src="${LOGO_PATH}"
            alt="Logo InventarisIT"
            class="footer-logo-image custom-logo"
          >

        `;

      }
    );

}


/* =========================================================
   STORAGE
========================================================= */

function loadInventory() {

  try {

    const raw =
      localStorage.getItem(
        STORAGE_KEY
      );


    const parsed =
      raw
        ? JSON.parse(
            raw
          )
        : [];


    inventory =
      Array.isArray(
        parsed
      )
        ? parsed.filter(
            isValidInventoryRecord
          )
        : [];

  }

  catch (error) {

    console.error(
      "LocalStorage:",
      error
    );


    inventory = [];

  }

}


function isValidInventoryRecord(
  item
) {

  return (

    item &&

    typeof item ===
      "object" &&

    typeof item.id ===
      "string" &&

    typeof item.name ===
      "string" &&

    Number.isFinite(
      Number(
        item.quantity
      )
    )

  );

}


function saveInventory() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      inventory
    )
  );

}


/* =========================================================
   TOAST
========================================================= */

function showToast(
  title,
  message,
  type = "success"
) {

  const icon =
    els.toast.querySelector(
      ".toast-icon"
    );


  if (
    type ===
      "warning"
  ) {

    els.toast.style.borderColor =
      "rgba(255,180,75,.2)";


    icon.style.color =
      "var(--orange)";


    icon.style.background =
      "rgba(255,180,75,.09)";


    icon.innerHTML = `

      <svg>
        <use href="#icon-warning"></use>
      </svg>

    `;

  }

  else {

    els.toast.style.borderColor =
      "rgba(39,224,161,.16)";


    icon.style.color =
      "var(--green)";


    icon.style.background =
      "rgba(39,224,161,.08)";


    icon.innerHTML = `

      <svg>
        <use href="#icon-check"></use>
      </svg>

    `;

  }


  els.toastTitle.textContent =
    title;


  els.toastMessage.textContent =
    message;


  els.toast.classList.add(
    "show"
  );


  clearTimeout(
    toastTimer
  );


  toastTimer =
    setTimeout(
      () => {

        els.toast.classList.remove(
          "show"
        );

      },
      3500
    );

}


/* =========================================================
   NAVIGATION
========================================================= */

function navigate(
  page
) {

  const validPages = [

    "dashboard",

    "inventory",

    "add",

    "stats"

  ];


  if (
    !validPages.includes(
      page
    )
  ) {

    page =
      "dashboard";

  }


  $$(".page")
    .forEach(
      (section) => {

        section.classList.remove(
          "active-page"
        );

      }
    );


  const target =
    $("page-" + page);


  if (target) {

    target.classList.add(
      "active-page"
    );

  }


  $$(".nav-item")
    .forEach(
      (button) => {

        button.classList.toggle(
          "active",
          button.dataset.page ===
            page
        );

      }
    );


  els.breadcrumbText.textContent =
    page ===
      "add"
      ? "DATA ENTRY"
      : page.toUpperCase();


  els.sidebar.classList.remove(
    "open"
  );


  window.scrollTo({

    top:
      0,

    behavior:
      "smooth"

  });


  if (
    page ===
      "inventory"
  ) {

    renderInventory();

  }


  if (
    page ===
      "stats"
  ) {

    renderStatistics();

  }

}


/* =========================================================
   TOTALS
========================================================= */

function getTotals() {

  return inventory.reduce(

    (
      result,
      item
    ) => {

      const quantity =
        Math.max(
          0,
          Number(
            item.quantity
          ) || 0
        );


      result.total +=
        quantity;


      if (
        item.condition ===
          "Rusak Ringan"
      ) {

        result.minor +=
          quantity;

      }

      else if (
        item.condition ===
          "Rusak Berat"
      ) {

        result.major +=
          quantity;

      }

      else {

        result.good +=
          quantity;

      }


      return result;

    },

    {

      total:
        0,

      good:
        0,

      minor:
        0,

      major:
        0

    }

  );

}


function percentage(
  value,
  total
) {

  return total

    ? Math.round(
        value /
        total *
        100
      )

    : 0;

}


/* =========================================================
   DASHBOARD
========================================================= */

function renderDashboard() {

  const totals =
    getTotals();


  const goodPercent =
    percentage(
      totals.good,
      totals.total
    );


  const minorPercent =
    percentage(
      totals.minor,
      totals.total
    );


  const majorPercent =
    percentage(
      totals.major,
      totals.total
    );


  els.totalItems.textContent =
    formatNumber(
      totals.total
    );


  els.goodItems.textContent =
    formatNumber(
      totals.good
    );


  els.minorItems.textContent =
    formatNumber(
      totals.minor
    );


  els.majorItems.textContent =
    formatNumber(
      totals.major
    );


  els.heroTotal.textContent =
    formatNumber(
      totals.total
    );


  els.goodPercent.textContent =
    `${goodPercent}%`;


  els.minorPercent.textContent =
    `${minorPercent}%`;


  els.majorPercent.textContent =
    `${majorPercent}%`;


  els.goodProgress.style.width =
    `${goodPercent}%`;


  els.minorProgress.style.width =
    `${minorPercent}%`;


  els.majorProgress.style.width =
    `${majorPercent}%`;


  els.goodProgressText.textContent =
    `${goodPercent}%`;


  els.minorProgressText.textContent =
    `${minorPercent}%`;


  els.majorProgressText.textContent =
    `${majorPercent}%`;


  renderRecentInventory();

}


/* =========================================================
   RECENT INVENTORY
========================================================= */

function renderRecentInventory() {

  if (!els.recentInventory) {
    return;
  }


  const recent =
    [...inventory]
      .sort(
        (
          a,
          b
        ) =>
          new Date(
            b.createdAt ||
            b.updatedAt ||
            0
          ) -
          new Date(
            a.createdAt ||
            a.updatedAt ||
            0
          )
      )
      .slice(
        0,
        5
      );


  if (!recent.length) {

    els.recentInventory.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">

          <svg>
            <use href="#icon-box"></use>
          </svg>

        </div>

        <strong>
          Belum ada data
        </strong>

        <p>
          Data inventaris akan muncul di sini.
        </p>

      </div>

    `;

    return;

  }


  els.recentInventory.innerHTML =
    recent
      .map(
        (item) => {

          const conditionClass =
            getConditionClass(
              item.condition
            );


          return `

            <div class="recent-item">

              <div class="recent-item-icon">

                <svg>
                  <use href="#icon-box"></use>
                </svg>

              </div>


              <div class="recent-item-info">

                <strong>
                  ${escapeHTML(
                    item.name
                  )}
                </strong>

                <small>
                  ${escapeHTML(
                    item.room ||
                    "-"
                  )}
                </small>

              </div>


              <div class="recent-item-meta">

                <span class="condition-badge ${conditionClass}">
                  ${escapeHTML(
                    item.condition ||
                    "Baik"
                  )}
                </span>

                <small>
                  ${formatNumber(
                    item.quantity
                  )} unit
                </small>

              </div>

            </div>

          `;

        }
      )
      .join("");

}


/* =========================================================
   INVENTORY
========================================================= */

function getFilteredInventory() {

  const search =
    (
      els.searchInput?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  const room =
    els.roomFilter?.value ||
    "";


  const condition =
    els.conditionFilter?.value ||
    "";


  return inventory.filter(
    (item) => {

      const matchesSearch =
        !search ||

        [

          item.name,

          item.code,

          item.room,

          item.condition

        ]
          .join(" ")
          .toLowerCase()
          .includes(
            search
          );


      const matchesRoom =
        !room ||
        item.room ===
          room;


      const matchesCondition =
        !condition ||
        item.condition ===
          condition;


      return (
        matchesSearch &&
        matchesRoom &&
        matchesCondition
      );

    }
  );

}


function renderInventory() {

  if (
    !els.inventoryGrid
  ) {
    return;
  }


  const filtered =
    getFilteredInventory();


  if (
    els.inventoryCount
  ) {

    els.inventoryCount.textContent =
      `${filtered.length} data`;

  }


  if (!filtered.length) {

    els.inventoryGrid.innerHTML = `

      <div class="empty-state inventory-empty">

        <div class="empty-icon">

          <svg>
            <use href="#icon-box"></use>
          </svg>

        </div>

        <strong>
          Data tidak ditemukan
        </strong>

        <p>
          Coba ubah pencarian atau filter.
        </p>

      </div>

    `;

    return;

  }


  els.inventoryGrid.innerHTML =
    filtered
      .map(
        (item) =>
          createInventoryCard(
            item
          )
      )
      .join("");

}


function createInventoryCard(
  item
) {

  const conditionClass =
    getConditionClass(
      item.condition
    );


  const quantity =
    Number(
      item.quantity
    ) || 0;


  return `

    <article
      class="inventory-card"
      data-id="${escapeHTML(
        item.id
      )}"
    >

      <div class="inventory-card-head">

        <div class="inventory-card-icon">

          <span>
            ${escapeHTML(
              getInitials(
                item.name
              )
            )}
          </span>

        </div>


        <div class="inventory-card-actions">

          <button
            type="button"
            class="icon-btn small"
            data-action="edit"
            data-id="${escapeHTML(
              item.id
            )}"
            title="Edit"
          >

            <svg>
              <use href="#icon-edit"></use>
            </svg>

          </button>


          <button
            type="button"
            class="icon-btn small danger"
            data-action="delete"
            data-id="${escapeHTML(
              item.id
            )}"
            title="Hapus"
          >

            <svg>
              <use href="#icon-trash"></use>
            </svg>

          </button>

        </div>

      </div>


      <div class="inventory-card-body">

        <span class="inventory-code">
          ${escapeHTML(
            item.code ||
            "-"
          )}
        </span>


        <h3>
          ${escapeHTML(
            item.name
          )}
        </h3>


        <div class="inventory-detail">

          <span>

            <svg>
              <use href="#icon-location"></use>
            </svg>

            ${escapeHTML(
              item.room ||
              "-"
            )}

          </span>


          <span>

            <svg>
              <use href="#icon-box"></use>
            </svg>

            ${formatNumber(
              quantity
            )} unit

          </span>

        </div>

      </div>


      <div class="inventory-card-footer">

        <span
          class="condition-badge ${conditionClass}"
        >
          ${escapeHTML(
            item.condition ||
            "Baik"
          )}
        </span>


        <small>
          ${formatDate(
            item.createdAt ||
            item.updatedAt
          )}
        </small>

      </div>

    </article>

  `;

}


/* =========================================================
   FORM
========================================================= */

function resetFormToAdd() {

  if (!els.form) {
    return;
  }


  els.form.reset();


  els.editId.value =
    "";


  if (els.formTitle) {

    els.formTitle.textContent =
      "Tambah Inventaris";

  }


  if (els.submitText) {

    els.submitText.textContent =
      "Simpan Data";

  }


  if (els.cancelEdit) {

    els.cancelEdit.classList.add(
      "hidden"
    );

  }


  navigate(
    "add"
  );

}


function editRecord(
  id
) {

  if (
    !requireFirebaseAdmin(
      "mengedit inventaris"
    )
  ) {
    return;
  }


  const item =
    inventory.find(
      (record) =>
        record.id ===
        id
    );


  if (!item) {

    showToast(
      "Data Tidak Ditemukan",
      "Data inventaris tidak ditemukan.",
      "warning"
    );

    return;

  }


  els.editId.value =
    item.id;


  els.itemName.value =
    item.name ||
    "";


  els.itemCode.value =
    item.code ||
    "";


  els.itemRoom.value =
    item.room ||
    "";


  els.itemQuantity.value =
    item.quantity ??
    "";


  const conditionInput =
    document.getElementById(
      "itemCondition"
    );


  if (conditionInput) {

    conditionInput.value =
      item.condition ||
      "Baik";

  }


  const descriptionInput =
    document.getElementById(
      "itemDescription"
    );


  if (descriptionInput) {

    descriptionInput.value =
      item.description ||
      "";

  }


  if (els.formTitle) {

    els.formTitle.textContent =
      "Edit Inventaris";

  }


  if (els.submitText) {

    els.submitText.textContent =
      "Update Data";

  }


  if (els.cancelEdit) {

    els.cancelEdit.classList.remove(
      "hidden"
    );

  }


  navigate(
    "add"
  );

}


/* =========================================================
   FORM SUBMIT
========================================================= */

function handleFormSubmit(
  event
) {

  event.preventDefault();


  if (
    !requireFirebaseAdmin(
      "menyimpan inventaris"
    )
  ) {
    return;
  }


  const name =
    els.itemName.value.trim();


  const code =
    els.itemCode.value.trim();


  const room =
    els.itemRoom.value;


  const quantity =
    Number(
      els.itemQuantity.value
    );


  const conditionInput =
    document.getElementById(
      "itemCondition"
    );


  const condition =
    conditionInput?.value ||
    "Baik";


  const descriptionInput =
    document.getElementById(
      "itemDescription"
    );


  const description =
    descriptionInput?.value.trim() ||
    "";


  if (!name) {

    showToast(
      "Data Belum Lengkap",
      "Nama barang wajib diisi.",
      "warning"
    );

    els.itemName.focus();

    return;

  }


  if (!Number.isFinite(quantity) || quantity < 0) {

    showToast(
      "Jumlah Tidak Valid",
      "Jumlah barang harus berupa angka 0 atau lebih.",
      "warning"
    );

    els.itemQuantity.focus();

    return;

  }


  const now =
    new Date().toISOString();


  const editId =
    els.editId.value;


  if (editId) {

    const index =
      inventory.findIndex(
        (item) =>
          item.id ===
          editId
      );


    if (
      index ===
      -1
    ) {

      showToast(
        "Data Tidak Ditemukan",
        "Data yang akan diubah tidak ditemukan.",
        "warning"
      );

      return;

    }


    inventory[index] = {

      ...inventory[index],

      name,

      code,

      room,

      quantity,

      condition,

      description,

      updatedAt:
        now

    };


    showToast(
      "Data Diperbarui",
      "Data inventaris berhasil diperbarui."
    );

  }

  else {

    const newItem = {

      id:
        crypto.randomUUID
          ? crypto.randomUUID()
          : `item-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2)}`,

      name,

      code,

      room,

      quantity,

      condition,

      description,

      createdAt:
        now,

      updatedAt:
        now

    };


    inventory.unshift(
      newItem
    );


    showToast(
      "Data Disimpan",
      "Data inventaris berhasil ditambahkan."
    );

  }


  saveInventory();


  renderAll();


  resetFormToAdd();


  navigate(
    "inventory"
  );

}


/* =========================================================
   DELETE
========================================================= */

function askDelete(
  id
) {

  if (
    !requireFirebaseAdmin(
      "menghapus inventaris"
    )
  ) {
    return;
  }


  const item =
    inventory.find(
      (record) =>
        record.id ===
        id
    );


  if (!item) {

    showToast(
      "Data Tidak Ditemukan",
      "Data inventaris tidak ditemukan.",
      "warning"
    );

    return;

  }


  pendingDeleteId =
    id;


  const deleteName =
    document.getElementById(
      "deleteItemName"
    );


  if (deleteName) {

    deleteName.textContent =
      item.name;

  }


  els.confirmModal.classList.add(
    "show"
  );


  els.confirmModal.setAttribute(
    "aria-hidden",
    "false"
  );

}


function closeDeleteModal() {

  pendingDeleteId =
    null;


  els.confirmModal.classList.remove(
    "show"
  );


  els.confirmModal.setAttribute(
    "aria-hidden",
    "true"
  );

}


function confirmDeleteRecord() {

  if (
    !requireFirebaseAdmin(
      "menghapus inventaris"
    )
  ) {
    return;
  }


  if (!pendingDeleteId) {

    closeDeleteModal();

    return;

  }


  const index =
    inventory.findIndex(
      (item) =>
        item.id ===
        pendingDeleteId
    );


  if (
    index ===
    -1
  ) {

    closeDeleteModal();

    showToast(
      "Data Tidak Ditemukan",
      "Data inventaris tidak ditemukan.",
      "warning"
    );

    return;

  }


  inventory.splice(
    index,
    1
  );


  saveInventory();


  closeDeleteModal();


  renderAll();


  showToast(
    "Data Dihapus",
    "Data inventaris berhasil dihapus."
  );

}


/* =========================================================
   STATISTICS
========================================================= */

function renderStatistics() {

  const totals =
    getTotals();


  if (els.chartTotal) {

    els.chartTotal.textContent =
      formatNumber(
        totals.total
      );

  }


  if (els.legendGood) {

    els.legendGood.textContent =
      formatNumber(
        totals.good
      );

  }


  if (els.legendMinor) {

    els.legendMinor.textContent =
      formatNumber(
        totals.minor
      );

  }


  if (els.legendMajor) {

    els.legendMajor.textContent =
      formatNumber(
        totals.major
      );

  }


  renderDonutChart(
    totals
  );


  renderRoomStatistics();

}


/* =========================================================
   DONUT CHART - FIX
   HANYA BAGIAN INI YANG DIPERBAIKI
========================================================= */

function renderDonutChart(
  totals
) {

  if (
    !els.donutChart
  ) {
    return;
  }


  /* -----------------------------------------
     NORMALISASI DATA
  ----------------------------------------- */

  const total =
    Math.max(
      0,
      Number(
        totals?.total
      ) || 0
    );


  const good =
    Math.max(
      0,
      Number(
        totals?.good
      ) || 0
    );


  const minor =
    Math.max(
      0,
      Number(
        totals?.minor
      ) || 0
    );


  const major =
    Math.max(
      0,
      Number(
        totals?.major
      ) || 0
    );


  /* -----------------------------------------
     HITUNG PERSENTASE
  ----------------------------------------- */

  const goodPercent =
    total > 0
      ? (good / total) * 100
      : 0;


  const minorPercent =
    total > 0
      ? (minor / total) * 100
      : 0;


  const minorEnd =
    goodPercent +
    minorPercent;


  /* -----------------------------------------
     UPDATE DONUT
     
     JANGAN menggunakan innerHTML.
     CSS asli kamu sudah menggunakan
     conic-gradient pada .donut-chart.
  ----------------------------------------- */

  if (
    total > 0
  ) {

    els.donutChart.style.background =
      `conic-gradient(
        var(--green) 0% ${goodPercent}%,
        var(--orange) ${goodPercent}% ${minorEnd}%,
        var(--red) ${minorEnd}% 100%
      )`;

  }

  else {

    els.donutChart.style.background =
      `
      conic-gradient(
        rgba(255,255,255,.05) 0% 100%
      )
      `;

  }


  /* -----------------------------------------
     TOTAL DI TENGAH DONUT
  ----------------------------------------- */

  let donutHole =
    els.donutChart.querySelector(
      ".donut-hole"
    );


  if (
    !donutHole
  ) {

    donutHole =
      document.createElement(
        "div"
      );


    donutHole.className =
      "donut-hole";


    donutHole.innerHTML = `
      <strong id="chartTotal">
        0
      </strong>

      <span>
        TOTAL UNIT
      </span>
    `;


    els.donutChart.appendChild(
      donutHole
    );

  }


  /* -----------------------------------------
     UPDATE TOTAL
  ----------------------------------------- */

  const chartTotal =
    donutHole.querySelector(
      "#chartTotal"
    );


  if (
    chartTotal
  ) {

    chartTotal.textContent =
      formatNumber(
        total
      );


    /*
     * Sinkronkan referensi els.chartTotal.
     * Ini penting karena sebelumnya elemen
     * bisa berubah / belum tersedia.
     */

    els.chartTotal =
      chartTotal;

  }

}


function renderRoomStatistics() {

  if (
    !els.roomStatistics
  ) {
    return;
  }


  const rooms =
    {};


  inventory.forEach(
    (item) => {

      const room =
        item.room ||
        "Tidak diketahui";


      if (!rooms[room]) {

        rooms[room] = {

          total:
            0,

          good:
            0,

          minor:
            0,

          major:
            0

        };

      }


      const quantity =
        Number(
          item.quantity
        ) || 0;


      rooms[room].total +=
        quantity;


      if (
        item.condition ===
          "Rusak Ringan"
      ) {

        rooms[room].minor +=
          quantity;

      }

      else if (
        item.condition ===
          "Rusak Berat"
      ) {

        rooms[room].major +=
          quantity;

      }

      else {

        rooms[room].good +=
          quantity;

      }

    }
  );


  const entries =
    Object.entries(
      rooms
    ).sort(
      (
        a,
        b
      ) =>
        b[1].total -
        a[1].total
    );


  if (!entries.length) {

    els.roomStatistics.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">

          <svg>
            <use href="#icon-location"></use>
          </svg>

        </div>

        <strong>
          Belum ada statistik
        </strong>

        <p>
          Tambahkan inventaris untuk melihat statistik ruangan.
        </p>

      </div>

    `;

    return;

  }


  els.roomStatistics.innerHTML =
    entries
      .map(
        ([room, data]) => {

          const percent =
            percentage(
              data.total,
              getTotals().total
            );


          return `

            <div class="room-stat-item">

              <div class="room-stat-head">

                <strong>
                  ${escapeHTML(
                    room
                  )}
                </strong>

                <span>
                  ${formatNumber(
                    data.total
                  )} unit
                </span>

              </div>


              <div class="room-stat-bar">

                <span
                  style="width:${percent}%"
                ></span>

              </div>


              <div class="room-stat-meta">

                <span>
                  Baik ${formatNumber(
                    data.good
                  )}
                </span>

                <span>
                  Ringan ${formatNumber(
                    data.minor
                  )}
                </span>

                <span>
                  Berat ${formatNumber(
                    data.major
                  )}
                </span>

              </div>

            </div>

          `;

        }
      )
      .join("");

}


/* =========================================================
   THEME
========================================================= */

function initTheme() {

  const saved =
    localStorage.getItem(
      THEME_KEY
    );


  const theme =
    saved === "light"
      ? "light"
      : "dark";


  setTheme(
    theme
  );

}


function setTheme(
  theme
) {

  document.documentElement.dataset.theme =
    theme;


  localStorage.setItem(
    THEME_KEY,
    theme
  );


  if (
    els.themeIcon
  ) {

    els.themeIcon.innerHTML = `

      <use
        href="${
          theme === "dark"
            ? "#icon-sun"
            : "#icon-moon"
        }"
      ></use>

    `;

  }

}


/* =========================================================
   EXPORT
========================================================= */

function exportInventory() {

  if (
    !requireFirebaseAdmin(
      "mengekspor data"
    )
  ) {
    return;
  }


  const payload = {

    app:
      "InventarisIT",

    version:
      APP_VERSION,

    exportedAt:
      new Date().toISOString(),

    data:
      inventory

  };


  const blob =
    new Blob(
      [
        JSON.stringify(
          payload,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const anchor =
    document.createElement(
      "a"
    );


  anchor.href =
    url;


  anchor.download =
    `inventarisIT-${new Date()
      .toISOString()
      .slice(
        0,
        10
      )}.json`;


  document.body.appendChild(
    anchor
  );


  anchor.click();


  anchor.remove();


  URL.revokeObjectURL(
    url
  );


  showToast(
    "Export Berhasil",
    "Data inventaris berhasil diekspor."
  );

}


/* =========================================================
   IMPORT
========================================================= */

function handleImport(
  file
) {

  if (
    !requireFirebaseAdmin(
      "mengimpor data"
    )
  ) {
    return;
  }


  if (!file) {
    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    () => {

      try {

        const parsed =
          JSON.parse(
            reader.result
          );


        const imported =
          Array.isArray(
            parsed
          )
            ? parsed
            : parsed.data;


        if (
          !Array.isArray(
            imported
          )
        ) {

          throw new Error(
            "Format data tidak valid."
          );

        }


        const valid =
          imported.filter(
            isValidInventoryRecord
          );


        if (!valid.length) {

          throw new Error(
            "Tidak ada data inventaris yang valid."
          );

        }


        inventory =
          valid;


        saveInventory();


        renderAll();


        showToast(
          "Import Berhasil",
          `${valid.length} data inventaris berhasil diimpor.`
        );

      }

      catch (error) {

        console.error(
          error
        );


        showToast(
          "Import Gagal",
          error.message ||
            "File tidak dapat dibaca.",
          "warning"
        );

      }

      finally {

        els.importInput.value =
          "";

      }

    };


  reader.onerror =
    () => {

      showToast(
        "Import Gagal",
        "File tidak dapat dibaca.",
        "warning"
      );

      els.importInput.value =
        "";

    };


  reader.readAsText(
    file
  );

}


/* =========================================================
   BACKUP LOCAL STORAGE
========================================================= */

function backupLocalStorage() {

  if (
    !requireFirebaseAdmin(
      "membuat backup"
    )
  ) {
    return;
  }


  const backup = {

    app:
      "InventarisIT",

    version:
      APP_VERSION,

    createdAt:
      new Date().toISOString(),

    localStorage: {}

  };


  for (
    let index = 0;
    index <
      localStorage.length;
    index++
  ) {

    const key =
      localStorage.key(
        index
      );


    if (key) {

      backup.localStorage[key] =
        localStorage.getItem(
          key
        );

    }

  }


  const blob =
    new Blob(
      [
        JSON.stringify(
          backup,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const anchor =
    document.createElement(
      "a"
    );


  anchor.href =
    url;


  anchor.download =
    `inventarisIT-backup-${new Date()
      .toISOString()
      .slice(
        0,
        10
      )}.json`;


  document.body.appendChild(
    anchor
  );


  anchor.click();


  anchor.remove();


  URL.revokeObjectURL(
    url
  );


  showToast(
    "Backup Berhasil",
    "Backup LocalStorage berhasil dibuat."
  );

}


/* =========================================================
   RESTORE
========================================================= */

function handleRestore(
  file
) {

  if (
    !requireFirebaseAdmin(
      "merestore data"
    )
  ) {
    return;
  }


  if (!file) {
    return;
  }


  const reader =
    new FileReader();


  reader.onload =
    () => {

      try {

        const parsed =
          JSON.parse(
            reader.result
          );


        if (
          !parsed ||
          typeof parsed !==
            "object" ||
          !parsed.localStorage
        ) {

          throw new Error(
            "File backup tidak valid."
          );

        }


        const confirmed =
          window.confirm(
            "Restore akan mengganti data LocalStorage saat ini. Lanjutkan?"
          );


        if (!confirmed) {

          els.restoreInput.value =
            "";

          return;

        }


        Object.entries(
          parsed.localStorage
        ).forEach(
          (
            [
              key,
              value
            ]
          ) => {

            localStorage.setItem(
              key,
              String(
                value
              )
            );

          }
        );


        loadInventory();


        renderAll();


        showToast(
          "Restore Berhasil",
          "Backup LocalStorage berhasil dipulihkan."
        );

      }

      catch (error) {

        console.error(
          error
        );


        showToast(
          "Restore Gagal",
          error.message ||
            "Backup tidak dapat dipulihkan.",
          "warning"
        );

      }

      finally {

        els.restoreInput.value =
          "";

      }

    };


  reader.onerror =
    () => {

      showToast(
        "Restore Gagal",
        "File backup tidak dapat dibaca.",
        "warning"
      );

      els.restoreInput.value =
        "";

    };


  reader.readAsText(
    file
  );

}


/* =========================================================
   CLEAR DATA
========================================================= */

function clearAllData() {

  if (
    !requireFirebaseAdmin(
      "menghapus seluruh data"
    )
  ) {
    return;
  }


  const confirmed =
    window.confirm(
      "Yakin ingin menghapus seluruh data inventaris? Tindakan ini tidak dapat dibatalkan."
    );


  if (!confirmed) {
    return;
  }


  inventory =
    [];


  saveInventory();


  renderAll();


  resetFormToAdd();


  showToast(
    "Data Dibersihkan",
    "Seluruh data inventaris telah dihapus."
  );

}


/* =========================================================
   PWA
========================================================= */

function registerPWA() {

  if (
    "serviceWorker" in
      navigator &&

    location.protocol !==
      "file:"
  ) {

    window.addEventListener(
      "load",
      () => {

        navigator.serviceWorker
          .register(
            "service-worker.js"
          )
          .catch(
            (error) => {

              console.warn(
                "Service Worker:",
                error
              );

            }
          );

      }
    );

  }


  window.addEventListener(
    "beforeinstallprompt",
    (event) => {

      event.preventDefault();


      deferredInstallPrompt =
        event;


      els.installButton.classList.remove(
        "hidden"
      );

    }
  );


  window.addEventListener(
    "appinstalled",
    () => {

      deferredInstallPrompt =
        null;


      els.installButton.classList.add(
        "hidden"
      );


      showToast(
        "Aplikasi Terpasang",
        "InventarisIT berhasil dipasang."
      );

    }
  );

}


/* =========================================================
   NAVIGATION EVENTS
========================================================= */

function setupNavigation() {

  document.addEventListener(
    "click",
    (event) => {

      const pageButton =
        event.target.closest(
          "[data-page]"
        );


      if (pageButton) {

        event.preventDefault();


        if (
          pageButton.dataset.page ===
            "add"
        ) {

          if (
            !requireFirebaseAdmin(
              "menambah inventaris"
            )
          ) {

            return;

          }


          resetFormToAdd();

        }


        navigate(
          pageButton.dataset.page
        );


        return;

      }


      const actionButton =
        event.target.closest(
          "[data-action]"
        );


      if (actionButton) {

        const action =
          actionButton.dataset.action;


        const id =
          actionButton.dataset.id;


        if (
          action ===
            "edit"
        ) {

          if (
            !requireFirebaseAdmin(
              "mengedit inventaris"
            )
          ) {

            return;

          }


          editRecord(
            id
          );

        }


        if (
          action ===
            "delete"
        ) {

          if (
            !requireFirebaseAdmin(
              "menghapus inventaris"
            )
          ) {

            return;

          }


          askDelete(
            id
          );

        }


        return;

      }


      const emptyLink =
        event.target.closest(
          "[data-empty-link]"
        );


      if (emptyLink) {

        event.preventDefault();


        showToast(
          "Link Belum Diatur",
          "Isi link pada bagian FOOTER_LINKS di script.js.",
          "warning"
        );

      }

    }
  );

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

  setupNavigation();


  /* MOBILE */

  els.mobileMenu?.addEventListener(
    "click",
    () => {

      els.sidebar?.classList.add(
        "open"
      );

    }
  );


  els.mobileClose?.addEventListener(
    "click",
    () => {

      els.sidebar?.classList.remove(
        "open"
      );

    }
  );


  /* LOGIN ADMIN */

  document
    .getElementById(
      "loginButton"
    )
    ?.addEventListener(
      "click",
      openLoginModal
    );


  document
    .getElementById(
      "closeLoginButton"
    )
    ?.addEventListener(
      "click",
      closeLoginModal
    );


  document
    .getElementById(
      "loginModal"
    )
    ?.addEventListener(
      "click",
      (event) => {

        if (
          event.target.id ===
            "loginModal"
        ) {

          closeLoginModal();

        }

      }
    );


  document
    .getElementById(
      "loginForm"
    )
    ?.addEventListener(
      "submit",
      loginAdminEmail
    );


  document
    .getElementById(
      "googleLoginButton"
    )
    ?.addEventListener(
      "click",
      loginAdminGoogle
    );


  document
    .getElementById(
      "toggleLoginPassword"
    )
    ?.addEventListener(
      "click",
      () => {

        const input =
          document.getElementById(
            "loginPassword"
          );


        if (!input) {
          return;
        }


        input.type =
          input.type ===
            "password"
            ? "text"
            : "password";

      }
    );


  /* THEME */

  els.themeToggle?.addEventListener(
    "click",
    () => {

      const current =
        document.documentElement.dataset.theme;


      setTheme(

        current ===
          "dark"

          ? "light"

          : "dark"

      );

    }
  );


  /* FORM */

  els.form?.addEventListener(
    "submit",
    handleFormSubmit
  );


  els.cancelEdit?.addEventListener(
    "click",
    resetFormToAdd
  );


  els.resetForm?.addEventListener(
    "click",
    () => {

      setTimeout(
        resetFormToAdd,
        0
      );

    }
  );


  /* SEARCH */

  els.searchInput?.addEventListener(
    "input",
    renderInventory
  );


  /* FILTER */

  els.roomFilter?.addEventListener(
    "change",
    renderInventory
  );


  els.conditionFilter?.addEventListener(
    "change",
    renderInventory
  );


  els.resetFilters?.addEventListener(
    "click",
    () => {

      if (els.searchInput) {

        els.searchInput.value =
          "";

      }


      if (els.roomFilter) {

        els.roomFilter.value =
          "";

      }


      if (els.conditionFilter) {

        els.conditionFilter.value =
          "";

      }


      renderInventory();

    }
  );


  /* DELETE */

  els.cancelDelete?.addEventListener(
    "click",
    closeDeleteModal
  );


  els.confirmDelete?.addEventListener(
    "click",
    confirmDeleteRecord
  );


  els.confirmModal?.addEventListener(
    "click",
    (event) => {

      if (
        event.target ===
          els.confirmModal
      ) {

        closeDeleteModal();

      }

    }
  );


  /* ESC */

  document.addEventListener(
    "keydown",
    (event) => {

      if (
        event.key ===
          "Escape"
      ) {

        closeDeleteModal();

        closeLoginModal();

        els.sidebar?.classList.remove(
          "open"
        );

      }

    }
  );


  /* TOAST */

  els.toastClose?.addEventListener(
    "click",
    () => {

      els.toast?.classList.remove(
        "show"
      );

    }
  );


  /* EXPORT */

  els.exportButton?.addEventListener(
    "click",
    exportInventory
  );


  /* IMPORT */

  els.importButton?.addEventListener(
    "click",
    () => {

      els.importInput?.click();

    }
  );


  els.importInput?.addEventListener(
    "change",
    (event) => {

      handleImport(
        event.target.files[0]
      );

    }
  );


  /* BACKUP */

  els.backupButton?.addEventListener(
    "click",
    backupLocalStorage
  );


  /* RESTORE */

  els.restoreButton?.addEventListener(
    "click",
    () => {

      els.restoreInput?.click();

    }
  );


  els.restoreInput?.addEventListener(
    "change",
    (event) => {

      handleRestore(
        event.target.files[0]
      );

    }
  );


  /* CLEAR */

  els.clearDataButton?.addEventListener(
    "click",
    clearAllData
  );


  /* INSTALL */

  els.installButton?.addEventListener(
    "click",
    async () => {

      if (
        !deferredInstallPrompt
      ) {

        showToast(
          "Install",
          "Opsi install belum tersedia pada browser ini.",
          "warning"
        );

        return;

      }


      deferredInstallPrompt.prompt();


      await deferredInstallPrompt.userChoice;


      deferredInstallPrompt =
        null;


      els.installButton.classList.add(
        "hidden"
      );

    }
  );

}


/* =========================================================
   RENDER ALL
========================================================= */

function renderAll() {

  renderDashboard();

  renderInventory();

  renderStatistics();

}


/* =========================================================
   BOOT ANIMATION
========================================================= */

function runBootSequence() {

  const stages = [

    {

      progress:
        20,

      status:
        "Loading application core...",

      log:
        "CORE ONLINE"

    },


    {

      progress:
        45,

      status:
        "Connecting local storage...",

      log:
        "LOCAL STORAGE READY"

    },


    {

      progress:
        70,

      status:
        "Validating environment...",

      log:
        "SECURITY CHECK PASSED"

    },


    {

      progress:
        100,

      status:
        "Launching InventarisIT...",

      log:
        "PWA ENGINE READY"

    }

  ];


  stages.forEach(
    (
      stage,
      index
    ) => {

      setTimeout(
        () => {

          if (
            els.bootProgressBar
          ) {

            els.bootProgressBar.style.width =
              `${stage.progress}%`;

          }


          if (
            els.bootStatus
          ) {

            els.bootStatus.textContent =
              stage.status;

          }


          if (
            index ===
              0 &&
            els.log1
          ) {

            els.log1.textContent =
              stage.log;

          }


          if (
            index ===
              1 &&
            els.log2
          ) {

            els.log2.textContent =
              stage.log;

          }


          if (
            index ===
              2 &&
            els.log3
          ) {

            els.log3.textContent =
              stage.log;

          }


          if (
            index ===
              3 &&
            els.log4
          ) {

            els.log4.textContent =
              stage.log;

          }

        },
        index *
          420
      );

    }
  );


  setTimeout(
    () => {

      els.splash?.classList.add(
        "is-hidden"
      );


      els.app?.classList.remove(
        "is-hidden"
      );


      navigate(
        "dashboard"
      );

    },
    2050
  );

}


/* =========================================================
   BOOT
========================================================= */

function boot() {

  initTheme();

  loadInventory();

  setupEvents();

  setupFirebaseAuth();

  updateAdminLoginUI();

  renderPageFooters();

  applyCustomLogo();

  registerPWA();

  renderAll();

  runBootSequence();

}


document.addEventListener(
  "DOMContentLoaded",
  boot
);

/* =========================================================
   BOOT
========================================================= */

function boot() {

  initTheme();

  loadInventory();

  setupEvents();

  setupFirebaseAuth();

  updateAdminLoginUI();

  renderPageFooters();

  applyCustomLogo();

  registerPWA();

  renderAll();

  runBootSequence();

}


document.addEventListener(
  "DOMContentLoaded",
  boot
);
