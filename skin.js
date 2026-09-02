const params =
    new URLSearchParams(
        window.location.search
    );

const skinId =
    params.get("skin");

let currentSkin = null;
let viewer = null;


// =========================
// ЗАГРУЗКА СКИНА
// =========================

async function loadSkin() {

    if (!skinId) {

        showError(
            "Скин не указан."
        );

        return;
    }


    try {

        const response =
            await fetch(
                `/api/skins/${encodeURIComponent(skinId)}`
            );


        if (!response.ok) {

            throw new Error(
                "Скин не найден."
            );

        }


        const skin =
            await response.json();


        currentSkin =
            skin;

const likeButton =
    document.getElementById(
        "likeButton"
    );

if (likeButton) {

    if (skin.liked) {

        likeButton.textContent =
            "❤️ Понравилось";

        likeButton.disabled =
            true;

    } else {

        likeButton.textContent =
            "❤️ Нравится";

        likeButton.disabled =
            false;

    }

}


        document.getElementById(
            "skinTitle"
        ).textContent =
            skin.title;


        document.getElementById(
            "skinAuthor"
        ).textContent =
            skin.author;


        document.getElementById(
            "skinLikes"
        ).textContent =
            skin.likes;


        document.getElementById(
            "skinDownloads"
        ).textContent =
            skin.downloads;


        // =========================
        // 3D
        // =========================

        const canvas =
            document.getElementById(
                "mainSkin"
            );


        if (viewer) {

            viewer.dispose();

        }


        viewer =
            new skinview3d.SkinViewer({

                canvas: canvas,

                width: 450,

                height: 600,

                skin: skin.file

            });


        viewer.controls.enableRotate =
            true;

        viewer.controls.enableZoom =
            true;

        viewer.controls.enablePan =
            false;


        viewer.camera.position.set(
            0,
            10,
            35
        );


        viewer.animation =
            new skinview3d.IdleAnimation();


    } catch (error) {

        console.error(
            "Ошибка загрузки скина:",
            error
        );


        showError(
            "Не удалось загрузить скин."
        );

    }

}


// =========================
// ЛАЙК
// =========================

async function addLike() {

    if (!currentSkin) {

        return;
    }


    const likeButton =
        document.getElementById(
            "likeButton"
        );


    if (!likeButton) {

        console.error(
            "Кнопка лайка не найдена."
        );

        return;

    }


    likeButton.disabled =
        true;


    try {

        const response =
            await fetch(
                `/api/skins/${encodeURIComponent(currentSkin.id)}/like`,
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

            throw new Error(
                result.message ||
                "Не удалось поставить лайк."
            );

        }


        currentSkin.likes =
            result.likes;


        document.getElementById(
            "skinLikes"
        ).textContent =
            result.likes;


        likeButton.textContent =
            "❤️ Понравилось";


    } catch (error) {

        console.error(
            "Ошибка лайка:",
            error
        );


        likeButton.disabled =
            false;

    }

}


// =========================
// КНОПКА ЛАЙКА
// =========================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const likeButton =
            document.getElementById(
                "likeButton"
            );


        if (likeButton) {

            likeButton.addEventListener(
                "click",
                addLike
            );

        }

    }
);


// =========================
// СКАЧИВАНИЕ
// =========================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const downloadButton =
            document.getElementById(
                "downloadButton"
            );


        if (!downloadButton) {

            return;
        }


        downloadButton.addEventListener(
            "click",
            () => {

                if (!currentSkin) {

                    return;
                }


                window.location.href =
                    `/api/skins/${encodeURIComponent(currentSkin.id)}/download`;

            }
        );

    }
);


// =========================
// ОШИБКА
// =========================

function showError(message) {

    document.body.innerHTML = `
        <div style="
            color: white;
            text-align: center;
            padding: 100px;
            font-family: Arial, sans-serif;
        ">

            <h1>${message}</h1>

            <br>

            <a
                href="index.html"
                style="
                    color: #9b6cff;
                    text-decoration: none;
                "
            >
                ← Вернуться на FHUBSKINS
            </a>

        </div>
    `;

}


// =========================
// ЗАПУСК
// =========================

loadSkin();