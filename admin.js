let viewer = null;
let selectedFile = null;


// =========================
// ПРОВЕРКА АДМИНА
// =========================

async function checkAdmin() {
    const currentAdmin = document.getElementById("currentAdmin");

    try {
        const response = await fetch("/api/me");

        if (!response.ok) {
            window.location.href = "index.html";
            return false;
        }

        const result = await response.json();
        const username = result.user.username;

        if (username !== "bogomdan1337") {
            window.location.href = "index.html";
            return false;
        }

        currentAdmin.textContent = `Вы вошли как: ${username}`;

        return true;

    } catch (error) {
        console.error(error);
        window.location.href = "index.html";
        return false;
    }
}


// =========================
// ПРЕДПРОСМОТР
// =========================

function showPreview(file) {

    const previewSection = document.getElementById("previewSection");
    const canvas = document.getElementById("uploadSkinCanvas");

    if (!file) {
        previewSection.style.display = "none";
        return;
    }

    if (!window.skinview3d) {
        console.error("skinview3d не загружен");
        return;
    }

    if (viewer) {
        viewer.dispose();
        viewer = null;
    }
const skinUrl = URL.createObjectURL(file);

viewer = new skinview3d.SkinViewer({
    canvas: canvas,
    width: 180,
    height: 210,
    skin: skinUrl
});

viewer.zoom = 1.0;

viewer.zoom = 0.9;

    viewer.zoom = 0.9;

    viewer.animation =
        new skinview3d.WalkingAnimation();

    previewSection.style.display = "block";
}


// =========================
// ВЫБОР ФАЙЛА
// =========================

document.getElementById("skinFile").addEventListener("change", (event) => {

    const file = event.target.files[0];
    const fileName = document.getElementById("fileName");
    const errorMessage = document.getElementById("errorMessage");

    errorMessage.textContent = "";

    if (!file) {
        selectedFile = null;
        fileName.textContent = "Файл не выбран";

        if (viewer) {
            viewer.dispose();
            viewer = null;
        }

        document.getElementById("previewSection").style.display = "none";

        return;
    }

    if (file.type !== "image/png") {
        errorMessage.textContent = "Можно загружать только PNG.";
        selectedFile = null;
        fileName.textContent = "Файл не выбран";
        return;
    }

    selectedFile = file;
    fileName.textContent = file.name;

    showPreview(file);
});


// =========================
// ПУБЛИКАЦИЯ
// =========================

document.getElementById("publishButton").addEventListener("click", async () => {

    const titleInput = document.getElementById("skinTitle");
    const categoryInput = document.getElementById("skinCategory");
    const errorMessage = document.getElementById("errorMessage");
    const publishButton = document.getElementById("publishButton");

   const title = titleInput.value.trim();
const category = categoryInput.value;

errorMessage.textContent = "";

    if (!title) {
        errorMessage.textContent = "Введите название скина.";
        return;
    }

    if (!category) {
        errorMessage.textContent = "Выберите категорию.";
        return;
    }

    if (!selectedFile) {
        errorMessage.textContent = "Выберите PNG-файл.";
        return;
    }

    publishButton.disabled = true;
    publishButton.textContent = "Публикация...";


    const formData = new FormData();
formData.append("title", title);
formData.append("category", category);
formData.append("skin", selectedFile);
    try {

        const response = await fetch("/api/upload", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            errorMessage.textContent =
                result.message || "Не удалось опубликовать скин.";
            return;
        }


        alert("Скин успешно опубликован!");


        clearForm();
        loadAdminSkins();


    } catch (error) {

        console.error(error);

        errorMessage.textContent =
            "Ошибка соединения с сервером.";

    } finally {

        publishButton.disabled = false;
        publishButton.textContent = "Опубликовать скин";
    }
});


// =========================
// ОЧИСТКА
// =========================

function clearForm() {

    document.getElementById("skinTitle").value = "";
    document.getElementById("skinCategory").value = "";
    document.getElementById("skinFile").value = "";

    document.getElementById("fileName").textContent =
        "Файл не выбран";

    document.getElementById("errorMessage").textContent = "";

    selectedFile = null;

    if (viewer) {
        viewer.dispose();
        viewer = null;
    }

    document.getElementById("previewSection").style.display =
        "none";
}


document.getElementById("clearButton").addEventListener("click", clearForm);


// =========================
// ЗАГРУЗКА ВСЕХ СКИНОВ
// =========================

async function loadAdminSkins() {

    const container = document.getElementById("adminSkins");
    const count = document.getElementById("skinsCount");

    container.innerHTML =
        `<div class="admin-loading">Загрузка скинов...</div>`;


    try {

        const response = await fetch("/api/skins");

        if (!response.ok) {
            throw new Error("Не удалось загрузить скины");
        }

        const result = await response.json();

        const skins = Array.isArray(result)
    ? result
    : result.skins;
const totalSkins =
    skins.length;

const totalLikes =
    skins.reduce(
        (sum, skin) =>
            sum + Number(skin.likes || 0),
        0
    );

const totalDownloads =
    skins.reduce(
        (sum, skin) =>
            sum + Number(skin.downloads || 0),
        0
    );


const totalSkinsElement =
    document.getElementById("totalSkins");

const totalLikesElement =
    document.getElementById("totalLikes");

const totalDownloadsElement =
    document.getElementById("totalDownloads");


if (totalSkinsElement) {
    totalSkinsElement.textContent =
        totalSkins;
}

if (totalLikesElement) {
    totalLikesElement.textContent =
        totalLikes;
}

if (totalDownloadsElement) {
    totalDownloadsElement.textContent =
        totalDownloads;
}


const searchInput =
    document.getElementById("adminSearchInput");

const searchText =
    searchInput
        ? searchInput.value.trim().toLowerCase()
        : "";
const sortSelect =
    document.getElementById("adminSort");

const sortType =
    sortSelect
        ? sortSelect.value
        : "new";


const filteredSkins =
    skins.filter((skin) => {

        const title =
            String(skin.title || "").toLowerCase();

        const author =
            String(skin.author || "").toLowerCase();

        return (
            title.includes(searchText) ||
            author.includes(searchText)
        );

    });
filteredSkins.sort((a, b) => {

    if (sortType === "likes") {

        return Number(b.likes || 0) -
               Number(a.likes || 0);

    }


    if (sortType === "downloads") {

        return Number(b.downloads || 0) -
               Number(a.downloads || 0);

    }


    if (sortType === "title") {

        return String(a.title || "")
            .localeCompare(
                String(b.title || ""),
                "ru"
            );

    }


    return new Date(b.createdAt || 0) -
           new Date(a.createdAt || 0);

});


count.textContent =
    filteredSkins.length;

        if (!filteredSkins.length) {

            container.innerHTML =
                `<div class="admin-loading">
                    Пока нет опубликованных скинов.
                </div>`;

            return;
        }


        container.innerHTML = "";


        filteredSkins.forEach((skin) => {

            const item = document.createElement("div");

            item.className = "admin-skin-item";


            item.innerHTML = `

                <div class="admin-skin-preview">

    <canvas
        class="admin-skin-canvas"
        width="120"
        height="150"
        data-skin="${skin.file}"
    ></canvas>

</div>


                <div class="admin-skin-info">

                    <h3>
                        ${escapeHtml(skin.title)}
                    </h3>

                    <p>
                        Автор: ${escapeHtml(skin.author)}
                    </p>

                    <div class="admin-category-badge ${escapeHtml(skin.category)}">
    ${escapeHtml(skin.category)}
</div>

                    <div class="admin-skin-stats">
<div class="admin-published-date">
    Опубликован: ${formatDate(skin.createdAt)}
</div>
                        <span>
                            ♥ ${skin.likes || 0}
                        </span>

                        <span>
                            ↓ ${skin.downloads || 0}
                        </span>

                    </div>

                </div>


                <div class="admin-skin-actions">

                    <div class="admin-skin-actions">

    <a
        href="skin.html?id=${skin.id}"
        class="favorite-button"
    >
        Открыть
    </a>

    <button
        class="edit-skin-button"
        data-id="${skin.id}"
    >
        Редактировать
    </button>

    <button
        class="change-png-button"
        data-id="${skin.id}"
    >
        Изменить PNG
    </button>

    <button
        class="delete-skin-button"
        data-id="${skin.id}"
    >
        Удалить
    </button>
<button
    class="duplicate-skin-button"
    data-id="${skin.id}"
>
    Дублировать
</button>

</div>

            `;


            const deleteButton =
                item.querySelector(".delete-skin-button");

const editButton =
    item.querySelector(".edit-skin-button");

const changePngButton =
    item.querySelector(".change-png-button");


changePngButton.addEventListener("click", () => {

    const pngModal =
        document.getElementById("pngModal");

    const changePngFile =
        document.getElementById("changePngFile");

    const changePngFileName =
        document.getElementById("changePngFileName");

    const changePngMessage =
        document.getElementById("changePngMessage");


    changePngFile.value = "";

    changePngFileName.textContent =
        "Файл не выбран";

    changePngMessage.textContent = "";

    pngModal.classList.add("open");


    const closePngModal = () => {
        pngModal.classList.remove("open");
    };


    document.getElementById(
        "pngModalClose"
    ).onclick = closePngModal;


    document.getElementById(
        "pngModalCancel"
    ).onclick = closePngModal;


    document.querySelector(
        "#pngModal .edit-modal-overlay"
    ).onclick = closePngModal;


    changePngFile.onchange = () => {

        const file =
            changePngFile.files[0];

        changePngMessage.textContent = "";


        if (!file) {

            changePngFileName.textContent =
                "Файл не выбран";

            return;
        }


        if (file.type !== "image/png") {

            changePngMessage.textContent =
                "Можно выбрать только PNG-файл.";

            changePngFile.value = "";

            changePngFileName.textContent =
                "Файл не выбран";

            return;
        }


        changePngFileName.textContent =
            file.name;
    };


    document.getElementById(
        "pngModalSave"
    ).onclick = async () => {

        const file =
            changePngFile.files[0];


        changePngMessage.textContent = "";


        if (!file) {

            changePngMessage.textContent =
                "Сначала выбери новый PNG-файл.";

            return;
        }


        const saveButton =
            document.getElementById(
                "pngModalSave"
            );


        saveButton.disabled = true;

        saveButton.textContent =
            "Загрузка...";


        const formData =
            new FormData();

        formData.append(
            "skin",
            file
        );


        try {

            const response =
                await fetch(
                    `/api/skins/${skin.id}/image`,
                    {
                        method: "PUT",
                        body: formData
                    }
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {

                changePngMessage.textContent =
                    result.message ||
                    "Не удалось заменить PNG.";

                return;
            }


            closePngModal();

            await loadAdminSkins();


        } catch (error) {

            console.error(error);

            changePngMessage.textContent =
                "Ошибка соединения с сервером.";

        } finally {

            saveButton.disabled = false;

            saveButton.textContent =
                "Заменить PNG";
        }

    };

});


editButton.addEventListener("click", () => {

    const editModal =
        document.getElementById("editModal");

    const editSkinTitle =
        document.getElementById("editSkinTitle");

    const editSkinCategory =
        document.getElementById("editSkinCategory");

    const editModalMessage =
        document.getElementById("editModalMessage");


    editSkinTitle.value =
        skin.title || "";

    editSkinCategory.value =
        skin.category || "pvp";

    editModalMessage.textContent = "";

    editModal.classList.add("open");


    const closeModal = () => {
        editModal.classList.remove("open");
    };


    document.getElementById(
        "editModalClose"
    ).onclick = closeModal;


    document.getElementById(
        "editModalCancel"
    ).onclick = closeModal;


    document.querySelector(
        ".edit-modal-overlay"
    ).onclick = closeModal;


    document.getElementById(
        "editModalSave"
    ).onclick = async () => {

        const title =
            editSkinTitle.value.trim();

        const category =
            editSkinCategory.value;


        editModalMessage.textContent = "";


        if (!title) {

            editModalMessage.textContent =
                "Введите название скина.";

            return;
        }


        const saveButton =
            document.getElementById(
                "editModalSave"
            );


        saveButton.disabled = true;

        saveButton.textContent =
            "Сохранение...";


        try {

            const response =
                await fetch(
                    `/api/skins/${skin.id}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            title,
                            category
                        })
                    }
                );


            const result =
                await response.json();


            if (
                !response.ok ||
                !result.success
            ) {

                editModalMessage.textContent =
                    result.message ||
                    "Не удалось сохранить изменения.";

                return;
            }


            closeModal();

skin.title = title;
skin.category = category;

await loadAdminSkins();


        } catch (error) {

            console.error(error);

            editModalMessage.textContent =
                "Ошибка соединения с сервером.";

        } finally {

            saveButton.disabled = false;

            saveButton.textContent =
                "Сохранить";
        }

    };

});

const duplicateButton =
    item.querySelector(".duplicate-skin-button");


duplicateButton.addEventListener("click", async () => {

    const confirmed = confirm(
        `Создать копию скина "${skin.title}"?`
    );

    if (!confirmed) {
        return;
    }


    duplicateButton.disabled = true;
    duplicateButton.textContent = "Копирование...";


    try {

        const response =
            await fetch(
                `/api/skins/${skin.id}/duplicate`,
                {
                    method: "POST"
                }
            );


        const result =
            await response.json();


        if (
            !response.ok ||
            !result.success
        ) {

            alert(
                result.message ||
                "Не удалось дублировать скин."
            );

            return;
        }


        await loadAdminSkins();


    } catch (error) {

        console.error(error);

        alert(
            "Ошибка соединения с сервером."
        );

    } finally {

        duplicateButton.disabled = false;
        duplicateButton.textContent = "Дублировать";

    }

});

            deleteButton.addEventListener("click", async () => {

                const confirmed = confirm(
                    `Удалить скин "${skin.title}"?`
                );

                if (!confirmed) {
                    return;
                }


                deleteButton.disabled = true;
                deleteButton.textContent = "Удаление...";


                try {

                    const deleteResponse =
                        await fetch(
                            `/api/skins/${skin.id}`,
                            {
                                method: "DELETE"
                            }
                        );


                    const deleteResult =
                        await deleteResponse.json();


                    if (!deleteResponse.ok) {

                        alert(
                            deleteResult.message ||
                            "Не удалось удалить скин."
                        );

                        deleteButton.disabled = false;
                        deleteButton.textContent = "Удалить";

                        return;
                    }


                    item.remove();


                    const remaining =
                        container.querySelectorAll(
                            ".admin-skin-item"
                        ).length;

                    count.textContent = remaining;


                    if (remaining === 0) {

                        container.innerHTML =
                            `<div class="admin-loading">
                                Пока нет опубликованных скинов.
                            </div>`;
                    }


                } catch (error) {

                    console.error(error);

                    alert(
                        "Ошибка соединения с сервером."
                    );

                    deleteButton.disabled = false;
                    deleteButton.textContent = "Удалить";
                }

            });


            container.appendChild(item);
const canvas = item.querySelector(".admin-skin-canvas");

try {

    const preview = new skinview3d.SkinViewer({
        canvas: canvas,
        width: 120,
        height: 150,
        skin: skin.file
    });

    preview.zoom = 0.7;

    // Без анимации — статичный кадр
    preview.playerObject.rotation.y = -0.35;

} catch (error) {

    console.error(
        "Не удалось создать 3D-превью:",
        error
    );

}

        });


    } catch (error) {

        console.error(error);

        container.innerHTML =
            `<div class="admin-loading">
                Не удалось загрузить список скинов.
            </div>`;
    }
}


// =========================
// ЭКРАНИРОВАНИЕ HTML
// =========================

function formatDate(dateString) {

    if (!dateString) {
        return "Дата неизвестна";
    }

    const date =
        new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "Дата неизвестна";
    }

    return date.toLocaleString(
        "ru-RU",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        }
    );
}

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


// =========================
// ЗАПУСК
// =========================

document.addEventListener("DOMContentLoaded", () => {

    const searchInput =
        document.getElementById("adminSearchInput");


    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        () => {
            loadAdminSkins();
        }
    );
const sortSelect =
    document.getElementById("adminSort");

if (sortSelect) {

    sortSelect.addEventListener(
        "change",
        () => {
            loadAdminSkins();
        }
    );

}

});

// =========================
// ОБНОВЛЕНИЕ АДМИНКИ
// =========================

const adminRefreshButton =
    document.getElementById("adminRefreshButton");


if (adminRefreshButton) {

    adminRefreshButton.addEventListener(
        "click",
        async () => {

            adminRefreshButton.disabled = true;

            adminRefreshButton.innerHTML =
                "⟳ <span>Обновление...</span>";


            try {

                await loadAdminSkins();

            } catch (error) {

                console.error(
                    "Ошибка обновления:",
                    error
                );

            } finally {

                adminRefreshButton.disabled = false;

                adminRefreshButton.innerHTML =
                    "🐲 <span>Обновить</span>";

            }

        }
    );

}

document.addEventListener("DOMContentLoaded", async () => {

    const isAdmin = await checkAdmin();

    if (!isAdmin) {
        return;
    }

    loadAdminSkins();
});