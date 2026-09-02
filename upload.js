const fileInput =
    document.getElementById("skinFile");

const fileName =
    document.getElementById("fileName");

const errorMessage =
    document.getElementById("errorMessage");

const previewSection =
    document.getElementById("previewSection");

const canvas =
    document.getElementById("uploadSkinCanvas");

const publishButton =
    document.getElementById("publishButton");

const clearButton =
    document.getElementById("clearButton");

const skinTitle =
    document.getElementById("skinTitle");

const skinCategory =
    document.getElementById("skinCategory");

const currentUser =
    document.getElementById("currentUser");


let viewer = null;
let currentFile = null;
let currentObjectUrl = null;


// ======================================
// ПРОВЕРКА АККАУНТА
// ======================================

async function loadCurrentUser() {

    try {

        const response =
            await fetch("/api/me");


        if (!response.ok) {

            currentUser.textContent =
                "Сначала войди в аккаунт.";

            publishButton.disabled =
                true;

            return;
        }


        const result =
            await response.json();


        currentUser.textContent =
            `Вы публикуете как: ${result.user.username}`;


        publishButton.disabled =
            false;


    } catch (error) {

        console.error(
            "Ошибка проверки аккаунта:",
            error
        );


        currentUser.textContent =
            "Не удалось проверить аккаунт.";

        publishButton.disabled =
            true;

    }

}


// ======================================
// ВЫБОР PNG
// ======================================

fileInput.addEventListener(
    "change",
    () => {

        const file =
            fileInput.files[0];


        errorMessage.textContent =
            "";

        errorMessage.style.color =
            "#ff6b81";


        if (!file) {

            fileName.textContent =
                "Файл не выбран";

            currentFile =
                null;

            return;
        }


        if (file.type !== "image/png") {

            errorMessage.textContent =
                "Можно загружать только PNG.";

            fileInput.value =
                "";

            fileName.textContent =
                "Файл не выбран";

            currentFile =
                null;

            return;
        }


        const objectUrl =
            URL.createObjectURL(file);


        const image =
            new Image();


        image.onload = () => {

            if (
                image.width !== 64 ||
                image.height !== 64
            ) {

                errorMessage.textContent =
                    `Нужен PNG 64×64. Размер файла: ${image.width}×${image.height}.`;


                URL.revokeObjectURL(
                    objectUrl
                );


                fileInput.value =
                    "";

                fileName.textContent =
                    "Файл не выбран";

                currentFile =
                    null;

                return;
            }


            // Удаляем старый viewer
            if (viewer) {

                viewer.dispose();

                viewer =
                    null;

            }


            // Освобождаем старый URL
            if (currentObjectUrl) {

                URL.revokeObjectURL(
                    currentObjectUrl
                );

            }


            currentObjectUrl =
                objectUrl;

            currentFile =
                file;


            fileName.textContent =
                file.name;


            // Создаём 3D-просмотр
            viewer =
                new skinview3d.SkinViewer({

                    canvas: canvas,

                    width: 350,

                    height: 450,

                    skin: objectUrl

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


            previewSection.style.display =
                "block";

        };


        image.onerror = () => {

            errorMessage.textContent =
                "Не удалось прочитать PNG.";

            URL.revokeObjectURL(
                objectUrl
            );

            currentFile =
                null;

        };


        image.src =
            objectUrl;

    }
);


// ======================================
// ПУБЛИКАЦИЯ
// ======================================

publishButton.addEventListener(
    "click",
    async () => {

        errorMessage.textContent =
            "";

        errorMessage.style.color =
            "#ff6b81";


        if (!currentFile) {

            errorMessage.textContent =
                "Сначала выбери PNG-скин.";

            return;
        }


        const title =
            skinTitle.value.trim();


        const category =
            skinCategory.value;


        if (!title) {

            errorMessage.textContent =
                "Введите название скина.";

            skinTitle.focus();

            return;
        }


        if (!category) {

            errorMessage.textContent =
                "Выбери категорию.";

            skinCategory.focus();

            return;
        }


        const formData =
            new FormData();


        formData.append(
            "skin",
            currentFile
        );


        formData.append(
            "title",
            title
        );


        formData.append(
            "category",
            category
        );


        publishButton.disabled =
            true;

        publishButton.textContent =
            "Публикация...";


        try {

            const response =
                await fetch(
                    "/api/upload",
                    {
                        method: "POST",
                        body: formData
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
                    "Ошибка публикации."
                );

            }


            errorMessage.style.color =
                "#7CFF9B";


            errorMessage.textContent =
                "Скин успешно опубликован!";


            publishButton.textContent =
                "Опубликовано ✓";


            setTimeout(
                () => {

                    window.location.href =
                        "index.html";

                },
                1200
            );


        } catch (error) {

            console.error(
                "Ошибка публикации:",
                error
            );


            errorMessage.style.color =
                "#ff6b81";


            errorMessage.textContent =
                error.message ||
                "Не удалось опубликовать скин.";


            publishButton.disabled =
                false;

            publishButton.textContent =
                "Опубликовать скин";

        }

    }
);


// ======================================
// ОЧИСТКА
// ======================================

clearButton.addEventListener(
    "click",
    () => {

        if (viewer) {

            viewer.dispose();

            viewer =
                null;

        }


        if (currentObjectUrl) {

            URL.revokeObjectURL(
                currentObjectUrl
            );

            currentObjectUrl =
                null;

        }


        currentFile =
            null;


        fileInput.value =
            "";

        skinTitle.value =
            "";

        skinCategory.value =
            "";


        fileName.textContent =
            "Файл не выбран";


        errorMessage.textContent =
            "";


        previewSection.style.display =
            "none";

    }
);


// ======================================
// ЗАПУСК
// ======================================

loadCurrentUser();