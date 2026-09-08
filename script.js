/* =========================================================
   ROOM INVENTORY
========================================================= */

const STORAGE_KEY = "roomInventoryData_v3";
const THEME_KEY = "roomInventoryTheme_v3";
const ACTIVITY_KEY = "roomInventoryActivity_v3";
const AUTO_BACKUP_KEY = "roomInventoryAutoBackup_v3";


let inventories = [];

let deleteTargetId = null;

let deferredInstallPrompt = null;

let toastTimer = null;

let modalConfirmAction = null;


/* =========================================================
   DOM
========================================================= */

const splashScreen =
    document.getElementById("splashScreen");

const inventoryForm =
    document.getElementById("inventoryForm");

const editId =
    document.getElementById("editId");

const namaBarang =
    document.getElementById("namaBarang");

const kodeInventaris =
    document.getElementById("kodeInventaris");

const namaRuangan =
    document.getElementById("namaRuangan");

const jumlahBarang =
    document.getElementById("jumlahBarang");

const kondisiBarang =
    document.getElementById("kondisiBarang");

const submitBtn =
    document.getElementById("submitBtn");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

const totalBarang =
    document.getElementById("totalBarang");

const barangBaik =
    document.getElementById("barangBaik");

const barangRingan =
    document.getElementById("barangRingan");

const barangBerat =
    document.getElementById("barangBerat");

const searchInput =
    document.getElementById("searchInput");

const filterRuangan =
    document.getElementById("filterRuangan");

const filterKondisi =
    document.getElementById("filterKondisi");

const sortInventory =
    document.getElementById("sortInventory");

const resetFilterBtn =
    document.getElementById("resetFilterBtn");

const inventoryList =
    document.getElementById("inventoryList");

const emptyState =
    document.getElementById("emptyState");

const resultCounter =
    document.getElementById("resultCounter");

const donutChart =
    document.getElementById("donutChart");

const chartTotal =
    document.getElementById("chartTotal");

const legendBaikPercent =
    document.getElementById("legendBaikPercent");

const legendRinganPercent =
    document.getElementById("legendRinganPercent");

const legendBeratPercent =
    document.getElementById("legendBeratPercent");

const legendBaikValue =
    document.getElementById("legendBaikValue");

const legendRinganValue =
    document.getElementById("legendRinganValue");

const legendBeratValue =
    document.getElementById("legendBeratValue");

const roomCount =
    document.getElementById("roomCount");

const roomSummary =
    document.getElementById("roomSummary");

const completeDataCount =
    document.getElementById("completeDataCount");

const recordCount =
    document.getElementById("recordCount");

const databaseStatus =
    document.getElementById("databaseStatus");

const activityLog =
    document.getElementById("activityLog");

const clearActivityBtn =
    document.getElementById("clearActivityBtn");

const exportBtn =
    document.getElementById("exportBtn");

const importBtn =
    document.getElementById("importBtn");

const backupBtn =
    document.getElementById("backupBtn");

const restoreBtn =
    document.getElementById("restoreBtn");

const printBtn =
    document.getElementById("printBtn");

const clearBtn =
    document.getElementById("clearBtn");

const importFile =
    document.getElementById("importFile");

const restoreFile =
    document.getElementById("restoreFile");

const installBtn =
    document.getElementById("installBtn");

const themeBtn =
    document.getElementById("themeBtn");

const themeIcon =
    document.getElementById("themeIcon");

const confirmModal =
    document.getElementById("confirmModal");

const cancelDeleteBtn =
    document.getElementById("cancelDeleteBtn");

const confirmDeleteBtn =
    document.getElementById("confirmDeleteBtn");

const dataModal =
    document.getElementById("dataModal");

const dataModalTitle =
    document.getElementById("dataModalTitle");

const dataModalText =
    document.getElementById("dataModalText");

const dataModalCancel =
    document.getElementById("dataModalCancel");

const dataModalConfirm =
    document.getElementById("dataModalConfirm");

const toast =
    document.getElementById("toast");

const toastIcon =
    document.getElementById("toastIcon");

const toastTitle =
    document.getElementById("toastTitle");

const toastMessage =
    document.getElementById("toastMessage");


/* =========================================================
   INIT
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


function init() {

    setTimeout(
        hideSplash,
        1600
    );

    loadData();

    loadTheme();

    setupEvents();

    updateAll();

    registerServiceWorker();
}


/* =========================================================
   SPLASH
========================================================= */

function hideSplash() {

    if (splashScreen) {

        splashScreen.classList.add(
            "hidden"
        );

    }
}


/* =========================================================
   STORAGE
========================================================= */

function loadData() {

    try {

        const saved =
            localStorage.getItem(
                STORAGE_KEY
            );


        if (!saved) {

            inventories = [];

            return;
        }


        const parsed =
            JSON.parse(saved);


        inventories =
            Array.isArray(parsed)
                ? parsed
                : [];


    } catch (error) {

        console.error(
            "Gagal membaca data:",
            error
        );

        inventories = [];

    }
}


function saveData() {

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(
            inventories
        )
    );
}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    inventoryForm.addEventListener(
        "submit",
        handleFormSubmit
    );


    cancelEditBtn.addEventListener(
        "click",
        cancelEdit
    );


    searchInput.addEventListener(
        "input",
        renderInventory
    );


    filterRuangan.addEventListener(
        "change",
        renderInventory
    );


    filterKondisi.addEventListener(
        "change",
        renderInventory
    );


    sortInventory.addEventListener(
        "change",
        renderInventory
    );


    resetFilterBtn.addEventListener(
        "click",
        resetFilters
    );


    themeBtn.addEventListener(
        "click",
        toggleTheme
    );


    exportBtn.addEventListener(
        "click",
        exportData
    );


    importBtn.addEventListener(
        "click",
        () =>
            importFile.click()
    );


    backupBtn.addEventListener(
        "click",
        manualBackup
    );


    restoreBtn.addEventListener(
        "click",
        () =>
            restoreFile.click()
    );


    printBtn.addEventListener(
        "click",
        printReport
    );


    clearBtn.addEventListener(
        "click",
        clearAllData
    );


    clearActivityBtn.addEventListener(
        "click",
        clearActivityLog
    );


    importFile.addEventListener(
        "change",
        handleImportFile
    );


    restoreFile.addEventListener(
        "change",
        handleRestoreFile
    );


    cancelDeleteBtn.addEventListener(
        "click",
        closeDeleteModal
    );


    confirmDeleteBtn.addEventListener(
        "click",
        confirmDelete
    );


    dataModalCancel.addEventListener(
        "click",
        closeDataModal
    );


    dataModalConfirm.addEventListener(
        "click",
        confirmDataModal
    );


    document.addEventListener(
        "keydown",
        handleKeyboard
    );


    setupNavigation();
}


/* =========================================================
   NAVIGATION
========================================================= */

function setupNavigation() {

    const navItems =
        document.querySelectorAll(
            ".nav-item"
        );


    navItems.forEach(
        item => {

            item.addEventListener(
                "click",
                event => {

                    event.preventDefault();


                    navItems.forEach(
                        nav =>
                            nav.classList.remove(
                                "active"
                            )
                    );


                    item.classList.add(
                        "active"
                    );


                    const target =
                        document.querySelector(
                            item.getAttribute(
                                "href"
                            )
                        );


                    if (target) {

                        target.scrollIntoView({
                            behavior:
                                "smooth",
                            block:
                                "start"
                        });

                    }

                }
            );

        }
    );
}


/* =========================================================
   FORM
========================================================= */

function handleFormSubmit(event) {

    event.preventDefault();


    const nama =
        namaBarang.value.trim();

    const kode =
        kodeInventaris.value.trim();

    const ruangan =
        namaRuangan.value.trim();

    const jumlah =
        Number(
            jumlahBarang.value
        );

    const kondisi =
        kondisiBarang.value;

    const currentId =
        editId.value;


    if (
        !nama ||
        !kode ||
        !ruangan ||
        !kondisi
    ) {

        showToast(
            "Data belum lengkap",
            "Semua data wajib diisi.",
            "error"
        );

        return;
    }


    if (
        !Number.isInteger(
            jumlah
        ) ||
        jumlah <= 0
    ) {

        showToast(
            "Jumlah tidak valid",
            "Jumlah harus lebih dari 0.",
            "error"
        );

        return;
    }


    if (currentId) {

        const index =
            inventories.findIndex(
                item =>
                    item.id ===
                    currentId
            );


        if (index !== -1) {

            inventories[index] = {

                ...inventories[index],

                namaBarang:
                    nama,

                kodeInventaris:
                    kode,

                namaRuangan:
                    ruangan,

                jumlahBarang:
                    jumlah,

                kondisiBarang:
                    kondisi,

                updatedAt:
                    new Date().toISOString()

            };


            addActivity(
                "edit",
                `Mengubah ${nama} (${kode})`
            );


            showToast(
                "Data diperbarui",
                "Inventaris berhasil diperbarui.",
                "success"
            );

        }

    } else {

        inventories.unshift({

            id:
                generateId(),

            namaBarang:
                nama,

            kodeInventaris:
                kode,

            namaRuangan:
                ruangan,

            jumlahBarang:
                jumlah,

            kondisiBarang:
                kondisi,

            createdAt:
                new Date().toISOString()

        });


        addActivity(
            "add",
            `Menambahkan ${nama} (${kode})`
        );


        showToast(
            "Data tersimpan",
            "Inventaris berhasil ditambahkan.",
            "success"
        );
    }


    saveData();

    resetForm();

    updateAll();
}


/* =========================================================
   FORM RESET
========================================================= */

function resetForm() {

    inventoryForm.reset();

    editId.value = "";

    cancelEditBtn.classList.add(
        "hidden"
    );


    submitBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M12 5v14"></path>
            <path d="M5 12h14"></path>
        </svg>
        <span>
            Simpan Inventaris
        </span>
    `;


    document.querySelector(
        "#formPanel .panel-kicker"
    ).textContent =
        "DATABASE ENTRY";


    document.querySelector(
        "#formPanel h2"
    ).textContent =
        "Tambah Inventaris";
}


function cancelEdit() {

    resetForm();

    showToast(
        "Edit dibatalkan",
        "Form dikembalikan.",
        "info"
    );
}


/* =========================================================
   EDIT
========================================================= */

function editInventory(id) {

    const item =
        inventories.find(
            data =>
                data.id === id
        );


    if (!item) return;


    editId.value =
        item.id;

    namaBarang.value =
        item.namaBarang;

    kodeInventaris.value =
        item.kodeInventaris;

    namaRuangan.value =
        item.namaRuangan;

    jumlahBarang.value =
        item.jumlahBarang;

    kondisiBarang.value =
        item.kondisiBarang;


    cancelEditBtn.classList.remove(
        "hidden"
    );


    submitBtn.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M20 6 9 17l-5-5"></path>
        </svg>
        <span>
            Update Inventaris
        </span>
    `;


    document.querySelector(
        "#formPanel .panel-kicker"
    ).textContent =
        "DATABASE EDIT";


    document.querySelector(
        "#formPanel h2"
    ).textContent =
        "Edit Inventaris";


    document
        .getElementById(
            "formPanel"
        )
        .scrollIntoView({
            behavior:
                "smooth"
        });
}


/* =========================================================
   DELETE
========================================================= */

function askDelete(id) {

    const item =
        inventories.find(
            data =>
                data.id === id
        );


    if (!item) return;


    deleteTargetId =
        id;


    confirmModal.classList.add(
        "show"
    );
}


function closeDeleteModal() {

    confirmModal.classList.remove(
        "show"
    );


    deleteTargetId = null;
}


function confirmDelete() {

    if (!deleteTargetId) {
        return;
    }


    const item =
        inventories.find(
            data =>
                data.id ===
                deleteTargetId
        );


    inventories =
        inventories.filter(
            data =>
                data.id !==
                deleteTargetId
        );


    saveData();


    if (item) {

        addActivity(
            "delete",
            `Menghapus ${item.namaBarang}`
        );
    }


    closeDeleteModal();

    updateAll();


    showToast(
        "Data dihapus",
        "Inventaris berhasil dihapus.",
        "success"
    );
}


/* =========================================================
   RENDER
========================================================= */

function renderInventory() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const room =
        filterRuangan.value;


    const condition =
        filterKondisi.value;


    let data =
        inventories.filter(
            item => {

                const text = `
                    ${item.namaBarang}
                    ${item.kodeInventaris}
                    ${item.namaRuangan}
                `
                    .toLowerCase();


                return (
                    (
                        !search ||
                        text.includes(search)
                    ) &&
                    (
                        !room ||
                        item.namaRuangan ===
                            room
                    ) &&
                    (
                        !condition ||
                        item.kondisiBarang ===
                            condition
                    )
                );

            }
        );


    switch (
        sortInventory.value
    ) {

        case "oldest":

            data.sort(
                (a,b) =>
                    new Date(
                        a.createdAt || 0
                    ) -
                    new Date(
                        b.createdAt || 0
                    )
            );

            break;


        case "nameAsc":

            data.sort(
                (a,b) =>
                    a.namaBarang.localeCompare(
                        b.namaBarang
                    )
            );

            break;


        case "nameDesc":

            data.sort(
                (a,b) =>
                    b.namaBarang.localeCompare(
                        a.namaBarang
                    )
            );

            break;


        case "qtyAsc":

            data.sort(
                (a,b) =>
                    a.jumlahBarang -
                    b.jumlahBarang
            );

            break;


        case "qtyDesc":

            data.sort(
                (a,b) =>
                    b.jumlahBarang -
                    a.jumlahBarang
            );

            break;


        default:

            data.sort(
                (a,b) =>
                    new Date(
                        b.createdAt || 0
                    ) -
                    new Date(
                        a.createdAt || 0
                    )
            );

    }


    inventoryList.innerHTML =
        "";


    resultCounter.textContent =
        `${data.length} data`;


    if (!data.length) {

        emptyState.classList.remove(
            "hidden"
        );

        return;
    }


    emptyState.classList.add(
        "hidden"
    );


    data.forEach(
        item => {

            const element =
                document.createElement(
                    "article"
                );


            element.className =
                "inventory-item";


            element.innerHTML = `

                <div class="item-main">

                    <div class="item-name">

                        ${escapeHtml(
                            item.namaBarang
                        )}

                    </div>

                    <div class="item-code">

                        ${escapeHtml(
                            item.kodeInventaris
                        )}

                    </div>

                </div>


                <div class="item-detail">

                    <span>
                        RUANGAN
                    </span>

                    <strong>
                        ${escapeHtml(
                            item.namaRuangan
                        )}
                    </strong>

                </div>


                <div
                    class="item-detail quantity-column"
                >

                    <span>
                        JUMLAH
                    </span>

                    <strong>
                        ${item.jumlahBarang}
                        unit
                    </strong>

                </div>


                <div
                    class="item-detail"
                >

                    <span>
                        KONDISI
                    </span>

                    <div
                        style="margin-top:5px"
                    >

                        <span
                            class="condition-badge ${item.kondisiBarang.toLowerCase()}"
                        >
                            ${item.kondisiBarang}
                        </span>

                    </div>

                </div>


                <div class="item-actions">

                    <button
                        class="item-action-btn"
                        onclick="editInventory('${item.id}')"
                    >

                        <svg viewBox="0 0 24 24">

                            <path
                                d="M12 20h9"
                            ></path>

                            <path
                                d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"
                            ></path>

                        </svg>

                    </button>


                    <button
                        class="item-action-btn delete"
                        onclick="askDelete('${item.id}')"
                    >

                        <svg viewBox="0 0 24 24">

                            <polyline
                                points="3 6 5 6 21 6"
                            ></polyline>

                            <path
                                d="M19 6l-1 14H6L5 6"
                            ></path>

                            <path
                                d="M10 11v5"
                            ></path>

                            <path
                                d="M14 11v5"
                            ></path>

                            <path
                                d="M9 6V3h6v3"
                            ></path>

                        </svg>

                    </button>

                </div>
            `;


            inventoryList.appendChild(
                element
            );

        }
    );
}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    let total = 0;

    let baik = 0;

    let ringan = 0;

    let berat = 0;


    inventories.forEach(
        item => {

            const qty =
                Number(
                    item.jumlahBarang
                ) || 0;


            total += qty;


            if (
                item.kondisiBarang ===
                "Baik"
            ) {

                baik += qty;

            } else if (
                item.kondisiBarang ===
                "Ringan"
            ) {

                ringan += qty;

            } else if (
                item.kondisiBarang ===
                "Berat"
            ) {

                berat += qty;

            }

        }
    );


    totalBarang.textContent =
        formatNumber(total);

    barangBaik.textContent =
        formatNumber(baik);

    barangRingan.textContent =
        formatNumber(ringan);

    barangBerat.textContent =
        formatNumber(berat);


    updateChart(
        total,
        baik,
        ringan,
        berat
    );
}


/* =========================================================
   CHART
========================================================= */

function updateChart(
    total,
    baik,
    ringan,
    berat
) {

    chartTotal.textContent =
        formatNumber(total);


    if (total === 0) {

        donutChart.style.background =
            "#273044";


        legendBaikPercent.textContent =
            "0%";

        legendRinganPercent.textContent =
            "0%";

        legendBeratPercent.textContent =
            "0%";


        legendBaikValue.textContent =
            "0 unit";

        legendRinganValue.textContent =
            "0 unit";

        legendBeratValue.textContent =
            "0 unit";

        return;
    }


    const pBaik =
        baik /
        total *
        100;


    const pRingan =
        ringan /
        total *
        100;


    const startRingan =
        pBaik * 3.6;


    const startBerat =
        (
            pBaik +
            pRingan
        ) * 3.6;


    donutChart.style.background =
        `
        conic-gradient(
            #22c55e
            0deg
            ${startRingan}deg,

            #eab308
            ${startRingan}deg
            ${startBerat}deg,

            #ef4444
            ${startBerat}deg
            360deg
        )
        `;


    legendBaikPercent.textContent =
        `${Math.round(pBaik)}%`;

    legendRinganPercent.textContent =
        `${Math.round(pRingan)}%`;

    legendBeratPercent.textContent =
        `${Math.round(
            berat / total * 100
        )}%`;


    legendBaikValue.textContent =
        `${formatNumber(
            baik
        )} unit`;

    legendRinganValue.textContent =
        `${formatNumber(
            ringan
        )} unit`;

    legendBeratValue.textContent =
        `${formatNumber(
            berat
        )} unit`;
}


/* =========================================================
   ROOM FILTER
========================================================= */

function updateRoomFilter() {

    const oldValue =
        filterRuangan.value;


    const rooms =
        [
            ...new Set(
                inventories
                    .map(
                        item =>
                            item.namaRuangan
                    )
                    .filter(Boolean)
            )
        ]
        .sort();


    filterRuangan.innerHTML =
        `
        <option value="">
            Semua Ruangan
        </option>
        `;


    rooms.forEach(
        room => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                room;

            option.textContent =
                room;


            filterRuangan.appendChild(
                option
            );
        }
    );


    if (
        rooms.includes(
            oldValue
        )
    ) {

        filterRuangan.value =
            oldValue;
    }
}


/* =========================================================
   FILTER RESET
========================================================= */

function resetFilters() {

    searchInput.value =
        "";

    filterRuangan.value =
        "";

    filterKondisi.value =
        "";

    sortInventory.value =
        "newest";


    renderInventory();
}


/* =========================================================
   ROOM OVERVIEW
========================================================= */

function updateRoomOverview() {

    const rooms = {};


    inventories.forEach(
        item => {

            const name =
                item.namaRuangan ||
                "Tanpa Ruangan";


            if (!rooms[name]) {

                rooms[name] = {
                    records: 0,
                    units: 0
                };

            }


            rooms[name].records++;

            rooms[name].units +=
                Number(
                    item.jumlahBarang
                ) || 0;

        }
    );


    const names =
        Object.keys(
            rooms
        );


    roomCount.textContent =
        names.length;


    roomSummary.innerHTML =
        "";


    names.sort();


    names.forEach(
        (name, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "room-card";


            card.innerHTML = `

                <div
                    class="room-card-header"
                >

                    <h3>
                        ${escapeHtml(
                            name
                        )}
                    </h3>

                    <span>
                        #${String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        )}
                    </span>

                </div>


                <div
                    class="room-card-data"
                >

                    <div>

                        <strong>
                            ${rooms[name].records}
                        </strong>

                        <span>
                            Record
                        </span>

                    </div>


                    <div>

                        <strong>
                            ${formatNumber(
                                rooms[name].units
                            )}
                        </strong>

                        <span>
                            Unit
                        </span>

                    </div>

                </div>

            `;


            roomSummary.appendChild(
                card
            );

        }
    );
}


/* =========================================================
   DATA HEALTH
========================================================= */

function updateDataHealth() {

    let complete = 0;


    inventories.forEach(
        item => {

            if (
                item.namaBarang &&
                item.kodeInventaris &&
                item.namaRuangan &&
                item.jumlahBarang &&
                item.kondisiBarang
            ) {

                complete++;
            }

        }
    );


    completeDataCount.textContent =
        complete;


    recordCount.textContent =
        inventories.length;


    databaseStatus.textContent =
        "READY";
}


/* =========================================================
   ACTIVITIES
========================================================= */

function getActivities() {

    try {

        return JSON.parse(
            localStorage.getItem(
                ACTIVITY_KEY
            )
        ) || [];

    } catch {

        return [];
    }
}


function addActivity(
    type,
    text
) {

    const activities =
        getActivities();


    activities.unshift({

        type: type,

        text: text,

        time:
            new Date().toISOString()

    });


    localStorage.setItem(
        ACTIVITY_KEY,
        JSON.stringify(
            activities.slice(
                0,
                30
            )
        )
    );


    renderActivityLog();
}


function renderActivityLog() {

    const activities =
        getActivities().slice(
            0,
            8
        );


    activityLog.innerHTML =
        "";


    if (!activities.length) {

        activityLog.innerHTML = `

            <div
                class="activity-item"
            >

                <div
                    class="activity-left"
                >

                    <span
                        class="activity-dot"
                    ></span>

                    <span
                        class="activity-text"
                    >
                        Belum ada aktivitas.
                    </span>

                </div>

                <span
                    class="activity-time"
                >
                    --
                </span>

            </div>
        `;

        return;
    }


    activities.forEach(
        activity => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "activity-item";


            element.innerHTML = `

                <div
                    class="activity-left"
                >

                    <span
                        class="activity-dot"
                    ></span>

                    <span
                        class="activity-text"
                    >
                        ${escapeHtml(
                            activity.text
                        )}
                    </span>

                </div>


                <span
                    class="activity-time"
                >
                    ${formatDateTime(
                        activity.time
                    )}
                </span>

            `;


            activityLog.appendChild(
                element
            );

        }
    );
}


function clearActivityLog() {

    localStorage.removeItem(
        ACTIVITY_KEY
    );


    renderActivityLog();


    showToast(
        "Log dibersihkan",
        "Riwayat aktivitas telah dihapus.",
        "success"
    );
}


/* =========================================================
   EXPORT
========================================================= */

function exportData() {

    const data = {

        app:
            "RoomInventory",

        version:
            "3.0",

        createdAt:
            new Date().toISOString(),

        inventoryData:
            inventories

    };


    downloadJSON(
        data,
        "roominventory-export.json"
    );


    showToast(
        "Export berhasil",
        "Data berhasil diunduh.",
        "success"
    );
}


/* =========================================================
   IMPORT
========================================================= */

function handleImportFile(
    event
) {

    const file =
        event.target.files[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload =
        e => {

            try {

                const json =
                    JSON.parse(
                        e.target.result
                    );


                const data =
                    Array.isArray(
                        json
                    )
                        ? json
                        : json.inventoryData;


                if (
                    !Array.isArray(
                        data
                    )
                ) {

                    throw new Error(
                        "Format salah"
                    );
                }


                openDataModal(
                    "Import Data",
                    "Data inventaris lama akan diganti dengan data dari file. Lanjutkan?",
                    () => {

                        inventories =
                            data;


                        saveData();

                        updateAll();


                        showToast(
                            "Import berhasil",
                            "Data berhasil dimasukkan.",
                            "success"
                        );

                    }
                );


            } catch {

                showToast(
                    "Import gagal",
                    "File JSON tidak valid.",
                    "error"
                );

            }

        };


    reader.readAsText(
        file
    );


    importFile.value =
        "";
}


/* =========================================================
   BACKUP
========================================================= */

function manualBackup() {

    const backup = {

        app:
            "RoomInventory",

        type:
            "backup",

        createdAt:
            new Date().toISOString(),

        theme:
            localStorage.getItem(
                THEME_KEY
            ) ||
            "dark",

        inventoryData:
            inventories

    };


    downloadJSON(
        backup,
        "roominventory-backup.json"
    );


    showToast(
        "Backup berhasil",
        "Backup berhasil dibuat.",
        "success"
    );
}


/* =========================================================
   RESTORE
========================================================= */

function handleRestoreFile(
    event
) {

    const file =
        event.target.files[0];


    if (!file) return;


    const reader =
        new FileReader();


    reader.onload =
        e => {

            try {

                const json =
                    JSON.parse(
                        e.target.result
                    );


                const data =
                    Array.isArray(
                        json
                    )
                        ? json
                        : json.inventoryData;


                if (
                    !Array.isArray(
                        data
                    )
                ) {

                    throw new Error(
                        "Format backup salah"
                    );
                }


                openDataModal(
                    "Restore Backup",
                    "Data saat ini akan diganti dengan backup. Lanjutkan?",
                    () => {

                        inventories =
                            data;


                        saveData();


                        if (
                            json.theme ===
                                "light" ||
                            json.theme ===
                                "dark"
                        ) {

                            localStorage.setItem(
                                THEME_KEY,
                                json.theme
                            );

                            loadTheme();

                        }


                        updateAll();


                        showToast(
                            "Restore berhasil",
                            "Backup berhasil dipulihkan.",
                            "success"
                        );

                    }
                );


            } catch {

                showToast(
                    "Restore gagal",
                    "File backup tidak valid.",
                    "error"
                );

            }

        };


    reader.readAsText(
        file
    );


    restoreFile.value =
        "";
}


/* =========================================================
   CLEAR ALL
========================================================= */

function clearAllData() {

    openDataModal(
        "Hapus Semua Data",
        "Semua data inventaris akan dihapus. Yakin ingin melanjutkan?",
        () => {

            inventories = [];

            saveData();

            updateAll();


            showToast(
                "Data dihapus",
                "Seluruh inventaris telah dihapus.",
                "success"
            );

        }
    );
}


/* =========================================================
   PRINT
========================================================= */

function printReport() {

    window.print();
}


/* =========================================================
   MODAL
========================================================= */

function openDataModal(
    title,
    text,
    action
) {

    dataModalTitle.textContent =
        title;


    dataModalText.textContent =
        text;


    modalConfirmAction =
        action;


    dataModal.classList.add(
        "show"
    );
}


function closeDataModal() {

    dataModal.classList.remove(
        "show"
    );


    modalConfirmAction =
        null;
}


function confirmDataModal() {

    if (
        typeof modalConfirmAction ===
        "function"
    ) {

        const action =
            modalConfirmAction;


        closeDataModal();


        action();

    } else {

        closeDataModal();

    }
}


/* =========================================================
   THEME
========================================================= */

function loadTheme() {

    const theme =
        localStorage.getItem(
            THEME_KEY
        );


    const light =
        theme ===
        "light";


    document.body.classList.toggle(
        "light",
        light
    );


    document.body.classList.toggle(
        "dark",
        !light
    );


    updateThemeIcon(
        light
    );


    fixSidebarTheme(
        light
    );
}


function toggleTheme() {

    const light =
        !document.body.classList.contains(
            "light"
        );


    localStorage.setItem(
        THEME_KEY,
        light
            ? "light"
            : "dark"
    );


    document.body.classList.toggle(
        "light",
        light
    );


    document.body.classList.toggle(
        "dark",
        !light
    );


    updateThemeIcon(
        light
    );


    fixSidebarTheme(
        light
    );


    showToast(
        light
            ? "Light mode aktif"
            : "Dark mode aktif",
        "Tema berhasil diubah.",
        "info"
    );
}


function updateThemeIcon(
    light
) {

    if (light) {

        themeIcon.innerHTML = `
            <circle
                cx="12"
                cy="12"
                r="4"
            ></circle>

            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>

            <path
                d="m4.93 4.93 1.42 1.42"
            ></path>

            <path
                d="m17.65 17.65 1.42 1.42"
            ></path>

        `;

    } else {

        themeIcon.innerHTML = `
            <path
                d="M21 12.8A8.5 8.5 0 1 1 11.2 3
                6.5 6.5 0 0 0 21 12.8Z"
            ></path>
        `;
    }
}


function fixSidebarTheme(
    light
) {

    document
        .querySelectorAll(
            ".sidebar .nav-item"
        )
        .forEach(
            item => {

                item.style.setProperty(
                    "color",
                    item.classList.contains(
                        "active"
                    )
                        ? (
                            light
                                ? "#4c1d95"
                                : "#ffffff"
                        )
                        : (
                            light
                                ? "#64748b"
                                : "#78839a"
                        ),
                    "important"
                );

            }
        );
}


/* =========================================================
   PWA INSTALL
========================================================= */

window.addEventListener(
    "beforeinstallprompt",
    event => {

        event.preventDefault();

        deferredInstallPrompt =
            event;
    }
);


installBtn.addEventListener(
    "click",
    async () => {

        if (!deferredInstallPrompt) {

            showToast(
                "Install belum tersedia",
                "Jalankan melalui Live Server untuk PWA.",
                "info"
            );

            return;
        }


        deferredInstallPrompt.prompt();


        await deferredInstallPrompt
            .userChoice;


        deferredInstallPrompt =
            null;
    }
);


/* =========================================================
   SERVICE WORKER
========================================================= */

function registerServiceWorker() {

    if (
        "serviceWorker"
        in navigator
    ) {

        navigator.serviceWorker
            .register(
                "service-worker.js"
            )
            .then(
                registration => {

                    console.log(
                        "Service Worker aktif:",
                        registration.scope
                    );

                }
            )
            .catch(
                error => {

                    console.error(
                        "Service Worker error:",
                        error
                    );

                }
            );

    }
}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            (
                event.ctrlKey ||
                event.metaKey
            ) &&
            event.key.toLowerCase()
                === "k"
        ) {

            event.preventDefault();

            searchInput.focus();

        }


        if (
            event.key ===
            "Escape"
        ) {

            closeDeleteModal();

            closeDataModal();

        }

    }
);


/* =========================================================
   UPDATE ALL
========================================================= */

function updateAll() {

    updateDashboard();

    updateRoomFilter();

    renderInventory();

    updateRoomOverview();

    updateDataHealth();

    renderActivityLog();
}


/* =========================================================
   HELPERS
========================================================= */

function generateId() {

    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .substring(2)
    );
}


function formatNumber(
    value
) {

    return Number(
        value || 0
    ).toLocaleString(
        "id-ID"
    );
}


function formatDateTime(
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

        return "--";
    }


    return date.toLocaleString(
        "id-ID",
        {
            day:
                "2-digit",
            month:
                "2-digit",
            hour:
                "2-digit",
            minute:
                "2-digit"
        }
    );
}


function escapeHtml(
    value
) {

    return String(
        value ?? ""
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
   DOWNLOAD JSON
========================================================= */

function downloadJSON(
    data,
    filename
) {

    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
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


    URL.revokeObjectURL(
        url
    );
}


/* =========================================================
   TOAST
========================================================= */

function showToast(
    title,
    message,
    type
) {

    clearTimeout(
        toastTimer
    );


    toastTitle.textContent =
        title;


    toastMessage.textContent =
        message;


    if (
        type ===
        "error"
    ) {

        toastIcon.textContent =
            "!";

        toastIcon.style.color =
            "#f87171";

    } else if (
        type ===
        "info"
    ) {

        toastIcon.textContent =
            "i";

        toastIcon.style.color =
            "#a78bfa";

    } else {

        toastIcon.textContent =
            "✓";

        toastIcon.style.color =
            "#4ade80";
    }


    toast.classList.add(
        "show"
    );


    toastTimer =
        setTimeout(
            () => {

                toast.classList.remove(
                    "show"
                );

            },
            3000
        );
}