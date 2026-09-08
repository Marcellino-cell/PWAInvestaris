const STORAGE_KEY = "roomInventoryData_v53";
const THEME_KEY = "roomInventoryTheme_v53";
const ACTIVITY_KEY = "roomInventoryActivity_v53";
const AUTO_BACKUP_KEY = "roomInventoryAutoBackup_v53";
const AUTH_KEY = "roomInventoryAdminAuth_v53";
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

const OLD_STORAGE_KEYS = [
    "roomInventoryData_v5",
    "roomInventoryData_v4",
    "roomInventoryData_v3"
];

let inventoryData = [];
let activityData = [];
let editingId = null;
let confirmCallback = null;
let deferredInstallPrompt = null;
let isAdminLoggedIn = false;

function $(id) {
    return document.getElementById(id);
}

document.addEventListener(
    "DOMContentLoaded",
    init
);

function init() {

    try {

        loadTheme();

        loadData();

        loadActivity();

        loadAuth();

        bindEvents();

        renderAll();

        updateClock();

        updateFooterYear();

        setInterval(
            updateClock,
            1000
        );

        registerServiceWorker();

    } catch (error) {

        console.error(
            "Initialization error:",
            error
        );

        showToast(
            "Terjadi error saat memuat sistem.",
            "error"
        );

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

        if (!saved) {

            for (
                const key of OLD_STORAGE_KEYS
            ) {

                const old =
                    localStorage.getItem(key);

                if (old) {

                    saved = old;

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
                    JSON.parse(saved)
                )
                : [];

    } catch (error) {

        console.error(error);

        inventoryData = [];

    }

}

function normalizeData(data) {

    if (!Array.isArray(data)) {
        return [];
    }

    return data.map(
        function (item, index) {

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
                    new Date().toISOString(),

                updatedAt:
                    item.updatedAt ||
                    new Date().toISOString()

            };

        }
    );

}

function normalizeCondition(value) {

    const valueString =
        String(
            value ||
            "Baik"
        ).toLowerCase();

    if (
        valueString === "ringan" ||
        valueString.includes("ringan")
    ) {

        return "Ringan";

    }

    if (
        valueString === "berat" ||
        valueString.includes("berat")
    ) {

        return "Berat";

    }

    return "Baik";

}

/* =========================================================
   SAVE
========================================================= */

function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            inventoryData
        )
    );

}

/* =========================================================
   AUTHENTICATION / ADMIN LOGIN
========================================================= */

function loadAuth() {

    isAdminLoggedIn =
        localStorage.getItem(
            AUTH_KEY
        ) === "logged-in";

    updateAuthUI();

}

function updateAuthUI() {

    document.body.classList.toggle(
        "admin-logged-in",
        isAdminLoggedIn
    );

    const buttonText =
        $("loginButtonText");

    const statusDot =
        $("loginStatusDot");

    const button =
        $("loginButton");

    if (isAdminLoggedIn) {

        if (buttonText) {

            buttonText.textContent =
                "Logout Admin";

        }

        if (statusDot) {

            statusDot.classList.add(
                "logged-in"
            );

        }

        if (button) {

            button.title =
                "Logout Admin";

        }

    } else {

        if (buttonText) {

            buttonText.textContent =
                "Login Admin";

        }

        if (statusDot) {

            statusDot.classList.remove(
                "logged-in"
            );

        }

        if (button) {

            button.title =
                "Login Admin";

        }

    }

}

function openLoginModal() {

    if (isAdminLoggedIn) {

        logoutAdmin();

        return;

    }

    if ($("loginError")) {

        $("loginError").textContent =
            "";

    }

    $("loginForm")?.reset();

    $("loginModal")
        ?.classList.add(
            "show"
        );

    setTimeout(
        function () {

            $("loginUsername")
                ?.focus();

        },
        100
    );

}

function closeLoginModal() {

    $("loginModal")
        ?.classList.remove(
            "show"
        );

    if ($("loginError")) {

        $("loginError").textContent =
            "";

    }

}

function handleLoginSubmit(event) {

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

        isAdminLoggedIn = true;

        localStorage.setItem(
            AUTH_KEY,
            "logged-in"
        );

        updateAuthUI();

        closeLoginModal();

        showToast(
            "Login admin berhasil. Mode edit aktif.",
            "success"
        );

        return;

    }

    if ($("loginError")) {

        $("loginError").textContent =
            "Username atau password salah.";

    }

    if ($("loginPassword")) {

        $("loginPassword").value =
            "";

        $("loginPassword").focus();

    }

}

function logoutAdmin() {

    isAdminLoggedIn = false;

    localStorage.removeItem(
        AUTH_KEY
    );

    updateAuthUI();

    closeInventoryModal();

    closeConfirmModal();

    showToast(
        "Logout berhasil. Data kembali terkunci.",
        "info"
    );

}

function requireAdmin(
    action = "melakukan perubahan data"
) {

    if (isAdminLoggedIn) {

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

    /* AUTH */

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

    $("loginModal")
        ?.addEventListener(
            "click",
            function (event) {

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
            ".menu-item[data-target], .text-button[data-target]"
        )
        .forEach(
            function (button) {

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

    /* MOBILE MENU */

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

    /* MONITOR */

    $("heroMonitorButton")
        ?.addEventListener(
            "click",
            function () {

                switchSection(
                    "monitoring"
                );

            }
        );

    /* MODAL */

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

    /* SEARCH */

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

    /* EXPORT */

    $("exportButton")
        ?.addEventListener(
            "click",
            exportCSV
        );

    /* BACKUP */

    $("backupButton")
        ?.addEventListener(
            "click",
            createBackup
        );

    /* RESTORE */

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

    /* PRINT */

    $("printButton")
        ?.addEventListener(
            "click",
            function () {

                window.print();

            }
        );

    /* CLEAR ACTIVITY */

    $("clearActivityButton")
        ?.addEventListener(
            "click",
            clearActivities
        );

    /* INSTALL PWA */

    window.addEventListener(
        "beforeinstallprompt",
        function (event) {

            event.preventDefault();

            deferredInstallPrompt =
                event;

            $("installButton")
                ?.classList.remove(
                    "hidden"
                );

        }
    );

    $("installButton")
        ?.addEventListener(
            "click",
            installPWA
        );

    /* ESC */

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeInventoryModal();

                closeConfirmModal();

                closeLoginModal();

            }

            if (
                (
                    event.ctrlKey ||
                    event.metaKey
                ) &&
                event.key.toLowerCase() ===
                "k"
            ) {

                event.preventDefault();

                $("searchInput")
                    ?.focus();

            }

        }
    );

    /* MODAL OUTSIDE CLICK */

    $("inventoryModal")
        ?.addEventListener(
            "click",
            function (event) {

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
            function (event) {

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

function switchSection(target) {

    const section =
        $(target);

    if (!section) {

        return;

    }

    document
        .querySelectorAll(
            ".page-section"
        )
        .forEach(
            function (item) {

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
            function (item) {

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
   MODAL
========================================================= */

function openAddModal() {

    if (
        !requireAdmin(
            "menambah inventaris"
        )
    ) {

        return;

    }

    editingId = null;

    $("modalTitle").textContent =
        "Tambah Inventaris";

    $("inventoryForm")
        ?.reset();

    $("inventoryId").value =
        "";

    $("inventoryQuantity").value =
        "1";

    $("inventoryCondition").value =
        "Baik";

    $("inventoryModal")
        ?.classList.add(
            "show"
        );

    setTimeout(
        function () {

            $("inventoryCode")
                ?.focus();

        },
        100
    );

}

function openEditModal(id) {

    if (
        !requireAdmin(
            "mengedit inventaris"
        )
    ) {

        return;

    }

    const item =
        inventoryData.find(
            function (entry) {

                return entry.id ===
                    id;

            }
        );

    if (!item) {

        return;

    }

    editingId = id;

    $("modalTitle").textContent =
        "Edit Inventaris";

    $("inventoryId").value =
        item.id;

    $("inventoryCode").value =
        item.kodeInventaris;

    $("inventoryName").value =
        item.nama;

    $("inventoryCategory").value =
        item.kategori;

    $("inventoryRoom").value =
        item.ruangan;

    $("inventoryQuantity").value =
        item.jumlah;

    $("inventoryCondition").value =
        item.kondisi;

    $("inventoryNotes").value =
        item.keterangan;

    $("inventoryModal")
        ?.classList.add(
            "show"
        );

}

function closeInventoryModal() {

    $("inventoryModal")
        ?.classList.remove(
            "show"
        );

    editingId = null;

}

/* =========================================================
   FORM
========================================================= */

function handleFormSubmit(event) {

    if (
        !requireAdmin(
            "menyimpan perubahan inventaris"
        )
    ) {

        return;

    }

    event.preventDefault();

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
            "Semua field wajib diisi.",
            "error"
        );

        return;

    }

    if (
        !Number.isFinite(quantity) ||
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
            function (item) {

                return (
                    item.kodeInventaris
                        .toLowerCase() ===
                    code.toLowerCase() &&
                    item.id !==
                    editingId
                );

            }
        );

    if (duplicate) {

        showToast(
            "Kode inventaris sudah digunakan.",
            "error"
        );

        return;

    }

    if (editingId) {

        const index =
            inventoryData.findIndex(
                function (item) {

                    return item.id ===
                        editingId;

                }
            );

        if (index === -1) {

            return;

        }

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
                new Date().toISOString()

        };

        addActivity(
            `Mengubah "${name}"`,
            "fa-pen"
        );

        showToast(
            "Data berhasil diperbarui.",
            "success"
        );

    } else {

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
                new Date().toISOString(),

            updatedAt:
                new Date().toISOString()

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
   RENDER
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
   INVENTORY
========================================================= */

function renderInventory() {

    const tbody =
        $("inventoryTableBody");

    if (!tbody) {

        return;

    }

    const search =
        (
            $("searchInput")?.value ||
            ""
        )
        .toLowerCase()
        .trim();

    const room =
        $("roomFilter")?.value ||
        "all";

    const condition =
        $("conditionFilter")?.value ||
        "all";

    const sort =
        $("sortFilter")?.value ||
        "newest";

    let result =
        inventoryData.filter(
            function (item) {

                const searchMatch =
                    !search ||
                    item.kodeInventaris
                        .toLowerCase()
                        .includes(search) ||
                    item.nama
                        .toLowerCase()
                        .includes(search) ||
                    item.kategori
                        .toLowerCase()
                        .includes(search) ||
                    item.ruangan
                        .toLowerCase()
                        .includes(search);

                const roomMatch =
                    room === "all" ||
                    item.ruangan === room;

                const conditionMatch =
                    condition === "all" ||
                    item.kondisi === condition;

                return (
                    searchMatch &&
                    roomMatch &&
                    conditionMatch
                );

            }
        );

    result.sort(
        function (a, b) {

            switch (sort) {

                case "oldest":

                    return (
                        new Date(a.tanggal) -
                        new Date(b.tanggal)
                    );

                case "nameAsc":

                    return a.nama.localeCompare(
                        b.nama,
                        "id"
                    );

                case "nameDesc":

                    return b.nama.localeCompare(
                        a.nama,
                        "id"
                    );

                case "stockHigh":

                    return b.jumlah -
                        a.jumlah;

                case "stockLow":

                    return a.jumlah -
                        b.jumlah;

                default:

                    return (
                        new Date(b.tanggal) -
                        new Date(a.tanggal)
                    );

            }

        }
    );

    tbody.innerHTML = "";

    result.forEach(
        function (item) {

            const row =
                document.createElement(
                    "tr"
                );

            const conditionClass =
                item.kondisi.toLowerCase();

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
                        class="
                            condition-badge
                            ${conditionClass}
                        "
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
                            class="
                                icon-button
                                edit-button
                            "
                            type="button"
                            title="Edit"
                        >

                            <i
                                class="
                                    fa-solid
                                    fa-pen
                                "
                            ></i>

                        </button>

                        <button
                            class="
                                icon-button
                                delete
                                delete-button
                            "
                            type="button"
                            title="Hapus"
                        >

                            <i
                                class="
                                    fa-solid
                                    fa-trash
                                "
                            ></i>

                        </button>

                    </div>

                </td>

            `;

            row.querySelector(
                ".edit-button"
            ).addEventListener(
                "click",
                function () {

                    openEditModal(
                        item.id
                    );

                }
            );

            row.querySelector(
                ".delete-button"
            ).addEventListener(
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

    if ($("resultCount")) {

        $("resultCount").textContent =
            result.length;

    }

    if (
        result.length === 0
    ) {

        $("emptyState")
            ?.classList.remove(
                "hidden"
            );

    } else {

        $("emptyState")
            ?.classList.add(
                "hidden"
            );

    }

}

/* =========================================================
   DELETE
========================================================= */

function deleteInventory(id) {

    if (
        !requireAdmin(
            "menghapus inventaris"
        )
    ) {

        return;

    }

    const item =
        inventoryData.find(
            function (entry) {

                return entry.id ===
                    id;

            }
        );

    if (!item) {

        return;

    }

    createAutoBackup();

    openConfirmModal(

        "Hapus Inventaris",

        `Yakin ingin menghapus "${item.nama}"?`,

        function () {

            inventoryData =
                inventoryData.filter(
                    function (entry) {

                        return entry.id !==
                            id;

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

    const totalStock =
        inventoryData.reduce(
            function (sum, item) {

                return sum +
                    Number(
                        item.jumlah ||
                        0
                    );

            },
            0
        );

    const rooms =
        new Set(
            inventoryData.map(
                item =>
                    item.ruangan
            )
        ).size;

    const categories =
        new Set(
            inventoryData.map(
                item =>
                    item.kategori
            )
        ).size;

    const lowStock =
        inventoryData.filter(
            item =>
                Number(
                    item.jumlah
                ) <= 2
        ).length;

    if ($("totalItems")) {

        $("totalItems")
            .textContent =
            total;

    }

    if ($("goodItems")) {

        $("goodItems")
            .textContent =
            good;

    }

    if ($("attentionItems")) {

        $("attentionItems")
            .textContent =
            attention;

    }

    if ($("totalStock")) {

        $("totalStock")
            .textContent =
            totalStock;

    }

    if ($("totalRooms")) {

        $("totalRooms")
            .textContent =
            rooms;

    }

    if ($("totalCategories")) {

        $("totalCategories")
            .textContent =
            categories;

    }

    if ($("lowStockCount")) {

        $("lowStockCount")
            .textContent =
            lowStock;

    }

    if ($("terminalTotal")) {

        $("terminalTotal")
            .textContent =
            total;

    }

    updateHealth();

    renderLowStock();

    renderRecent();

}

function updateHealth() {

    if (!inventoryData.length) {

        $("dataHealth").textContent =
            "0%";

        $("healthPercent").textContent =
            "0%";

        $("healthProgress").style.width =
            "0%";

        return;

    }

    const complete =
        inventoryData.filter(
            function (item) {

                return (
                    item.kodeInventaris &&
                    item.nama &&
                    item.kategori &&
                    item.ruangan
                );

            }
        ).length;

    const percent =
        Math.round(
            complete /
            inventoryData.length *
            100
        );

    $("dataHealth").textContent =
        `${percent}%`;

    $("healthPercent").textContent =
        `${percent}%`;

    $("healthProgress").style.width =
        `${percent}%`;

}

function renderLowStock() {

    const container =
        $("lowStockPreview");

    if (!container) {

        return;

    }

    const items =
        inventoryData
            .filter(
                item =>
                    Number(
                        item.jumlah
                    ) <= 2
            )
            .slice(
                0,
                5
            );

    if (!items.length) {

        container.innerHTML = `

            <div class="empty-mini">

                Tidak ada stok rendah.

            </div>

        `;

        return;

    }

    container.innerHTML =
        items.map(
            function (item) {

                return `

                    <div
                        class="mini-item"
                    >

                        <div
                            class="
                                mini-item-main
                            "
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
        ).join("");

}

function renderRecent() {

    const container =
        $("recentItems");

    if (!container) {

        return;

    }

    const items =
        [...inventoryData]
            .sort(
                (a, b) =>
                    new Date(
                        b.tanggal
                    ) -
                    new Date(
                        a.tanggal
                    )
            )
            .slice(
                0,
                6
            );

    if (!items.length) {

        container.innerHTML = `

            <div class="empty-mini">

                Belum ada inventaris.

            </div>

        `;

        return;

    }

    container.innerHTML =
        items.map(
            function (item) {

                return `

                    <div
                        class="recent-item"
                    >

                        <div
                            class="
                                recent-item-main
                            "
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
        ).join("");

}

/* =========================================================
   ROOM FILTER
========================================================= */

function updateRoomFilter() {

    const select =
        $("roomFilter");

    if (!select) {

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
            (a, b) =>
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
        function (room) {

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

    const low =
        inventoryData.filter(
            item =>
                Number(
                    item.jumlah
                ) <= 2
        ).length;

    if ($("monitorTotal")) {

        $("monitorTotal")
            .textContent =
            total;

    }

    if ($("monitorGood")) {

        $("monitorGood")
            .textContent =
            good;

    }

    if ($("monitorLowStock")) {

        $("monitorLowStock")
            .textContent =
            low;

    }

    if ($("healthGoodCount")) {

        $("healthGoodCount")
            .textContent =
            good;

    }

    if ($("healthLightCount")) {

        $("healthLightCount")
            .textContent =
            light;

    }

    if ($("healthHeavyCount")) {

        $("healthHeavyCount")
            .textContent =
            heavy;

    }

    renderRooms();

}

/* =========================================================
   ROOM OVERVIEW
========================================================= */

function renderRooms() {

    const container =
        $("roomOverview");

    if (!container) {

        return;

    }

    const roomData = {};

    inventoryData.forEach(
        function (item) {

            roomData[item.ruangan] =
                (
                    roomData[item.ruangan] ||
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
            (a, b) =>
                b[1] -
                a[1]
        );

    if (!rooms.length) {

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
                function ([
                    room,
                    count
                ]) {

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
                                    style="
                                        width:${width}%
                                    "
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

    if ($("donutTotal")) {

        $("donutTotal")
            .textContent =
            total;

    }

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

    if ($("legendGood")) {

        $("legendGood")
            .textContent =
            `${goodPercent}%`;

    }

    if ($("legendLight")) {

        $("legendLight")
            .textContent =
            `${lightPercent}%`;

    }

    if ($("legendHeavy")) {

        $("legendHeavy")
            .textContent =
            `${heavyPercent}%`;

    }

    const startLight =
        goodPercent;

    const startHeavy =
        goodPercent +
        lightPercent;

    if ($("conditionDonut")) {

        $("conditionDonut").style.background =
            `

                conic-gradient(

                    var(--green)
                    0%
                    ${startLight}%,

                    var(--orange)
                    ${startLight}%
                    ${startHeavy}%,

                    var(--red)
                    ${startHeavy}%
                    100%

                )

            `;

    }

    const safe =
        inventoryData.filter(
            item =>
                Number(
                    item.jumlah
                ) > 2
        ).length;

    const low =
        inventoryData.filter(
            item =>
                Number(
                    item.jumlah
                ) <= 2
        ).length;

    if ($("safeStockCount")) {

        $("safeStockCount")
            .textContent =
            safe;

    }

    if ($("lowStockStat")) {

        $("lowStockStat")
            .textContent =
            low;

    }

    const safePercent =
        total
            ? Math.round(
                safe /
                total *
                100
            )
            : 0;

    const lowPercent =
        total
            ? Math.round(
                low /
                total *
                100
            )
            : 0;

    if ($("safeStockProgress")) {

        $("safeStockProgress")
            .style.width =
            `${safePercent}%`;

    }

    if ($("lowStockProgress")) {

        $("lowStockProgress")
            .style.width =
            `${lowPercent}%`;

    }

    renderCategories();

}

function renderCategories() {

    const container =
        $("categoryStats");

    if (!container) {

        return;

    }

    const categories = {};

    inventoryData.forEach(
        function (item) {

            categories[item.kategori] =
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
            (a, b) =>
                b[1] -
                a[1]
        )
        .slice(
            0,
            8
        );

    if (!list.length) {

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
            .map(
                function ([
                    name,
                    count
                ]) {

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
                                    style="
                                        width:${width}%
                                    "
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
                ? JSON.parse(saved)
                : [];

    } catch {

        activityData = [];

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
            new Date().toISOString()

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

    if (!container) {

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
                15
            )
            .map(
                function (item) {

                    return `

                        <div
                            class="activity-item"
                        >

                            <div
                                class="activity-icon"
                            >

                                <i
                                    class="
                                        fa-solid
                                        ${escapeHtml(
                                            item.icon
                                        )}
                                    "
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
   STORAGE
========================================================= */

function updateStorage() {

    try {

        const data =
            localStorage.getItem(
                STORAGE_KEY
            ) || "";

        const bytes =
            new Blob(
                [data]
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

        if ($("monitorStorage")) {

            $("monitorStorage")
                .textContent =
                `${percent}%`;

        }

        if ($("terminalStorage")) {

            $("terminalStorage")
                .textContent =
                `${percent}%`;

        }

    } catch {

        if ($("monitorStorage")) {

            $("monitorStorage")
                .textContent =
                "0%";

        }

        if ($("terminalStorage")) {

            $("terminalStorage")
                .textContent =
                "0%";

        }

    }

}

function createAutoBackup() {

    try {

        localStorage.setItem(
            AUTO_BACKUP_KEY,
            JSON.stringify({

                version:
                    "5.3",

                createdAt:
                    new Date().toISOString(),

                inventory:
                    inventoryData,

                activities:
                    activityData

            })
        );

    } catch (error) {

        console.error(error);

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
            "5.3",

        createdAt:
            new Date().toISOString(),

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

function handleRestore(event) {

    const file =
        event.target.files?.[0];

    if (!file) {

        return;

    }

    readJSON(file)
        .then(
            function (data) {

                if (
                    !data ||
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
            function (item) {

                return [

                    item.kodeInventaris,

                    item.nama,

                    item.kategori,

                    item.ruangan,

                    item.jumlah,

                    item.kondisi,

                    item.keterangan,

                    formatDate(
                        item.tanggal
                    )

                ];

            }
        );

    const csv = [

        headers,

        ...rows

    ]
    .map(
        row =>
            row
                .map(csvEscape)
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
        "Data berhasil diexport.",
        "success"
    );

}

/* =========================================================
   FILTER RESET
========================================================= */

function resetFilters() {

    if ($("searchInput")) {

        $("searchInput")
            .value =
            "";

    }

    if ($("roomFilter")) {

        $("roomFilter")
            .value =
            "all";

    }

    if ($("conditionFilter")) {

        $("conditionFilter")
            .value =
            "all";

    }

    if ($("sortFilter")) {

        $("sortFilter")
            .value =
            "newest";

    }

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

    if ($("confirmTitle")) {

        $("confirmTitle")
            .textContent =
            title;

    }

    if ($("confirmMessage")) {

        $("confirmMessage")
            .textContent =
            message;

    }

    confirmCallback =
        callback;

    $("confirmModal")
        ?.classList.add(
            "show"
        );

}

function closeConfirmModal() {

    $("confirmModal")
        ?.classList.remove(
            "show"
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

    if ($("themeButton")) {

        $("themeButton").innerHTML =
            dark

                ? `
                    <span>
                        <i
                            class="
                                fa-solid
                                fa-sun
                            "
                        ></i>

                        Light Mode

                    </span>

                    <i
                        class="
                            fa-solid
                            fa-toggle-on
                        "
                    ></i>
                  `

                : `
                    <span>

                        <i
                            class="
                                fa-solid
                                fa-moon
                            "
                        ></i>

                        Dark Mode

                    </span>

                    <i
                        class="
                            fa-solid
                            fa-toggle-off
                        "
                    ></i>
                  `;

    }

    if ($("mobileThemeButton")) {

        $("mobileThemeButton")
            .innerHTML =

            dark

                ? `
                    <i
                        class="
                            fa-solid
                            fa-sun
                        "
                    ></i>
                  `

                : `
                    <i
                        class="
                            fa-solid
                            fa-moon
                        "
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

    if ($("liveClock")) {

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

    if ($("liveDate")) {

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

    if ($("footerYear")) {

        $("footerYear")
            .textContent =
            new Date()
                .getFullYear();

    }

}

/* =========================================================
   PWA
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

        await navigator.serviceWorker.register(
            "service-worker.js"
        );

    } catch (error) {

        console.warn(
            "Service Worker error:",
            error
        );

    }

}

async function installPWA() {

    if (!deferredInstallPrompt) {

        showToast(
            "Installasi belum tersedia di browser ini.",
            "info"
        );

        return;

    }

    deferredInstallPrompt.prompt();

    try {

        await deferredInstallPrompt.userChoice;

    } catch {

    }

    deferredInstallPrompt =
        null;

    $("installButton")
        ?.classList.add(
            "hidden"
        );

}

/* =========================================================
   CLEAR ACTIVITY
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

            activityData = [];

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
   HELPERS
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
    condition
) {

    if (
        condition ===
        "Ringan"
    ) {

        return "Rusak Ringan";

    }

    if (
        condition ===
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
        new Date(value);

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
        new Date(value);

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
            date.getMonth() +
            1
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

        return `"${text.replace(
            /"/g,
            '""'
        )}"`;

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
            [content],
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
        100
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

                    } catch (error) {

                        reject(error);

                    }

                };

            reader.onerror =
                reject;

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
    type = "info"
) {

    const container =
        $("toastContainer");

    if (!container) {

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
            class="
                fa-solid
                ${icon}
            "
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

            toast.remove();

        },
        3000
    );

}
