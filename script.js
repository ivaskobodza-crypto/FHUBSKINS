let allSkins = [];
let viewers = [];

let currentSort = "all";
let currentCategory = "all";

// =========================
// Загрузка каталога
// =========================

async function loadSkins() {

    const grid = document.getElementById("skinsGrid");

    if (!grid) {
        return;
    }

    try {

        const response = await fetch("/api/skins");

        if (!response.ok) {
            throw new Error("Не удалось загрузить каталог.");
        }

        allSkins = await response.json();

        renderSkins(allSkins);

    } catch (error) {

        console.error(error);

        grid.innerHTML = `
            <p style="color:#ff6b81;">
                Не удалось загрузить каталог.
            </p>
        `;
    }
}


// =========================
// Отрисовка карточек
// =========================

function renderSkins(skins) {

    const grid = document.getElementById("skinsGrid");

    if (!grid) {
        return;
    }

    viewers.forEach(viewer => {

        try {
            viewer.dispose();
        } catch {}
    });

    viewers = [];

    grid.innerHTML = "";


    if (skins.length === 0) {

        grid.innerHTML = `
            <div class="no-results">
                <div class="no-results-icon">🔎</div>

                <h3>Скины не найдены</h3>

                <p>
                    Попробуй изменить запрос.
                </p>
            </div>
        `;

        return;
    }


    skins.forEach(skin => {

        const card = document.createElement("a");

        card.href =
            `skin.html?skin=${encodeURIComponent(skin.id)}`;

        card.className = "skin-card";

        card.dataset.name = skin.title;


        card.innerHTML = `

            <div class="skin-preview">
                <canvas></canvas>
            </div>

            <div class="skin-info">

                <h3>
                    ${escapeHtml(skin.title)}
                </h3>

                <a
                    class="skin-price-button"
                    href="${skin.file}"
                    download
                    onclick="event.stopPropagation();"
                >
                    ${
                        Number(skin.price || 0) > 0
                            ? Number(skin.price).toFixed(2) + " €"
                            : "Бесплатно"
                    }
                </a>

                <p>
                    Автор: ${escapeHtml(skin.author)}
                </p>

<button
    class="favorite-skin-button"
    type="button"
    onclick="toggleFavorite(event, '${skin.id}', this)"
>
    ♡ В избранное
</button>

                <div class="skin-bottom">

                    <span>
                        ❤️ ${skin.likes}
                    </span>

                    <span>
                        ⬇ ${skin.downloads}
                    </span>

                </div>

            </div>
        `;


        grid.appendChild(card);


        const canvas =
            card.querySelector("canvas");


        try {

            const viewer =
                createSkinViewer(
                    canvas,
                    skin.file
                );

            viewers.push(viewer);

        } catch (error) {

            console.error(
                "Ошибка 3D-просмотра:",
                error
            );
        }

    });
}

async function toggleFavorite(
    event,
    skinId,
    button
) {

    event.preventDefault();
    event.stopPropagation();

    try {

        button.disabled = true;

        const response =
            await fetch(
                `/api/skins/${encodeURIComponent(skinId)}/favorite`,
                {
                    method: "POST"
                }
            );

        const result =
            await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Не удалось изменить избранное."
            );
        }

        if (result.favorite) {

    button.textContent =
        "В избранном";

    button.classList.add(
        "favorite-active"
    );

} else {

    button.textContent =
        "В избранное";

    button.classList.remove(
        "favorite-active"
    );
}

    } catch (error) {

        console.error(
            "Ошибка избранного:",
            error
        );

        alert(error.message);

    } finally {

        button.disabled = false;
    }
}

// =========================
// 3D Skin Viewer
// =========================

function createSkinViewer(canvas, skinPath) {

    const viewer =
        new skinview3d.SkinViewer({

            canvas: canvas,

            /*
             * Уменьшили внутренний размер canvas.
             */
            width: 180,

            height: 210,

            skin: skinPath
        });


    // =========================
    // Управление
    // =========================

    viewer.controls.enableRotate = true;

    viewer.controls.enableZoom = true;

    viewer.controls.enablePan = false;


    // =========================
    // КАМЕРА
    // =========================

    /*
     * Раньше было 30.
     *
     * Чем больше Z,
     * тем дальше камера
     * и тем меньше выглядит скин.
     */

    viewer.camera.position.set(
        0,
        10,
        45
    );


    // =========================
    // Поле зрения
    // =========================

    /*
     * Немного уменьшаем FOV,
     * чтобы модель выглядела аккуратнее
     * внутри карточки.
     */

    viewer.camera.fov = 45;

    viewer.camera.updateProjectionMatrix();


    // =========================
    // Анимация
    // =========================

    viewer.animation =
        new skinview3d.IdleAnimation();


    return viewer;
}


// =========================
// Сортировка
// =========================

function sortSkins(skins, sortType) {

    const result = [...skins];


    if (sortType === "new") {

        return result.sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );
    }


    if (sortType === "likes") {

        return result.sort(
            (a, b) =>
                Number(b.likes) -
                Number(a.likes)
        );
    }


    if (sortType === "downloads") {

        return result.sort(
            (a, b) =>
                Number(b.downloads) -
                Number(a.downloads)
        );
    }


    return result;
}


// =========================
// Поиск
// =========================

function searchSkins() {

    const searchElement =
        document.getElementById("searchInput");


    if (!searchElement) {
        return;
    }


    const input =
        searchElement.value
            .toLowerCase()
            .trim();


    const filtered =
        allSkins.filter(skin => {

            const title =
                String(skin.title)
                    .toLowerCase();


            const author =
                String(skin.author)
                    .toLowerCase();


            const category =
                String(skin.category || "")
                    .toLowerCase();


            const matchesSearch =
                title.includes(input) ||
                author.includes(input);


            const matchesCategory =
                currentCategory === "all" ||
                category === currentCategory;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    const sorted =
        sortSkins(
            filtered,
            currentSort
        );


    renderSkins(sorted);
}


// =========================
// Поиск при вводе
// =========================

const searchInput =
    document.getElementById("searchInput");


if (searchInput) {

    searchInput.addEventListener(
        "input",
        searchSkins
    );

}


// =========================
// HTML защита
// =========================

function escapeHtml(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// =========================
// Фильтры сортировки
// =========================

document
    .querySelectorAll(".filter-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".filter-button")
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                currentSort =
                    button.dataset.sort;


                searchSkins();

            }
        );

    });


// =========================
// Фильтры категорий
// =========================

document
    .querySelectorAll(".category-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".category-button")
                    .forEach(btn => {

                        btn.classList.remove(
                            "active"
                        );

                    });


                button.classList.add(
                    "active"
                );


                currentCategory =
                    button.dataset.category;


                searchSkins();

            }
        );

    });


// =========================
// Запуск
// =========================

loadSkins();