const profileUsername =
    document.getElementById("profileUsername");

const profileLetter =
    document.getElementById("profileLetter");

const profileDate =
    document.getElementById("profileDate");

const profileSkins =
    document.getElementById("profileSkins");


const logoutButton =
    document.getElementById("logoutButton");


async function loadProfile() {

    try {

        const response =
            await fetch("/api/me");


        if (!response.ok) {

            window.location.href =
                "auth.html";

            return;
        }


        const result =
            await response.json();


        const user =
            result.user;


        profileUsername.textContent =
            user.username;


        profileLetter.textContent =
            user.username
                .charAt(0)
                .toUpperCase();


        const date =
            new Date(
                user.createdAt
            );


        profileDate.textContent =
            "Аккаунт создан: " +
            date.toLocaleDateString(
                "ru-RU"
            );


        await loadUserSkins(
            user.username
        );

await loadFavoriteSkins();

    } catch (error) {

        console.error(
            "Ошибка профиля:",
            error
        );

        window.location.href =
            "auth.html";
    }
}


async function loadUserSkins(
    username
) {

    try {

        const response =
            await fetch("/api/skins");


        if (!response.ok) {

            throw new Error(
                "Не удалось загрузить скины."
            );
        }


        const skins =
            await response.json();


        const mySkins =
            skins.filter(
                skin =>
                    skin.author === username
            );


        profileSkins.innerHTML =
            "";


        if (mySkins.length === 0) {

            profileSkins.innerHTML = `
                <div class="no-results">

                    <div class="no-results-icon">
                        🎨
                    </div>

                    <h3>
                        У тебя пока нет скинов
                    </h3>

                    <p>
                        Загрузи свой первый скин.
                    </p>

                </div>
            `;

            return;
        }


        mySkins.forEach(
            skin => {

                const card =
                    document.createElement("a");


                card.href =
                    `skin.html?skin=${encodeURIComponent(skin.id)}`;


                card.className =
                    "skin-card";


                card.innerHTML = `

                    <div class="skin-preview">

                        <canvas></canvas>

                    </div>


                    <div class="skin-info">

                        <h3>
                            ${escapeHtml(skin.title)}
                        </h3>

                        <p>
                            Автор:
                            ${escapeHtml(skin.author)}
                        </p>


                        <div class="skin-bottom">

                            <span>
                                ❤️ ${skin.likes}
                            </span>

                            <span>
                                ⬇ ${skin.downloads}
                            </span>

                        </div>


                        <button
                            class="delete-skin-button"
                            type="button"
                        >
                            Удалить
                        </button>

                    </div>

                `;


                profileSkins.appendChild(
                    card
                );


                const canvas =
                    card.querySelector(
                        "canvas"
                    );


                createViewer(
                    canvas,
                    skin.file
                );


                const deleteButton =
                    card.querySelector(
                        ".delete-skin-button"
                    );


                deleteButton.addEventListener(
                    "click",
                    async event => {

                        event.preventDefault();

                        event.stopPropagation();


                        const confirmed =
                            confirm(
                                `Удалить скин "${skin.title}"?`
                            );


                        if (!confirmed) {
                            return;
                        }


                        try {

                            deleteButton.disabled =
                                true;

                            deleteButton.textContent =
                                "Удаление...";


                            const response =
                                await fetch(
                                    `/api/skins/${encodeURIComponent(skin.id)}`,
                                    {
                                        method: "DELETE"
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
                                    "Не удалось удалить скин."
                                );

                            }


                            card.remove();


                        } catch (error) {

                            console.error(
                                "Ошибка удаления:",
                                error
                            );


                            deleteButton.disabled =
                                false;

                            deleteButton.textContent =
                                "Удалить";


                            alert(
                                error.message
                            );

                        }

                    }
                );

            }
        );


    } catch (error) {

        console.error(
            "Ошибка загрузки скинов:",
            error
        );


        profileSkins.innerHTML = `

            <div class="no-results">

                <h3>
                    Ошибка загрузки скинов
                </h3>

            </div>

        `;

    }
}

// =========================
// ИЗБРАННЫЕ СКИНЫ
// =========================

async function loadFavoriteSkins() {

    const favoriteSkins =
        document.getElementById("favoriteSkins");

    try {

        const favoritesResponse =
            await fetch("/api/favorites");

        const favoritesData =
            await favoritesResponse.json();

        console.log(
            "Избранные ID:",
            favoritesData.favorites
        );

        const skinsResponse =
            await fetch("/api/skins");

        const skins =
            await skinsResponse.json();

        const favoriteIds =
            favoritesData.favorites || [];

        const favoriteSkinsList =
            skins.filter(
                skin =>
                    favoriteIds.includes(
                        String(skin.id)
                    )
            );

        favoriteSkins.innerHTML = "";

        if (favoriteSkinsList.length === 0) {

            favoriteSkins.innerHTML = `
                <div class="no-results">

                    <div class="no-results-icon">
                        ❤️
                    </div>

                    <h3>
                        В избранном пока пусто
                    </h3>

                    <p>
                        Добавляй понравившиеся скины в избранное.
                    </p>

                </div>
            `;

            return;
        }

        favoriteSkinsList.forEach(
            skin => {

                const card =
                    document.createElement("a");

                card.href =
                    `skin.html?skin=${encodeURIComponent(skin.id)}`;

                card.className =
                    "skin-card";

                card.innerHTML = `
                    <div class="skin-preview">
                        <canvas></canvas>
                    </div>

                    <div class="skin-info">

                        <h3>
                            ${escapeHtml(skin.title)}
                        </h3>

                        <p>
                            Автор:
                            ${escapeHtml(skin.author)}
                        </p>

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

                favoriteSkins.appendChild(card);

                const canvas =
                    card.querySelector("canvas");

                createViewer(
                    canvas,
                    skin.file
                );

            }
        );

    } catch (error) {

        console.error(
            "Ошибка загрузки избранного:",
            error
        );

        favoriteSkins.innerHTML = `
            <div class="no-results">
                <h3>
                    Ошибка загрузки избранного
                </h3>
            </div>
        `;
    }
}
       
// =========================
// 3D VIEWER
// =========================

function createViewer(
    canvas,
    skinPath
) {

    const viewer =
        new skinview3d.SkinViewer({

            canvas: canvas,

            width: 180,

            height: 210,

            skin: skinPath

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
        45
    );


    viewer.animation =
        new skinview3d.IdleAnimation();


    return viewer;
}


// =========================
// ЗАЩИТА HTML
// =========================

function escapeHtml(text) {

    return String(text)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );

}


// =========================
// ВЫХОД
// =========================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await fetch(
                "/api/logout",
                {
                    method: "POST"
                }
            );

        } catch (error) {

            console.error(
                "Ошибка выхода:",
                error
            );

        }


        window.location.href =
            "auth.html";

    }
);


// =========================
// ЗАПУСК
// =========================

loadProfile();