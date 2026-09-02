let profileMenuOpen = false;


async function updateHeaderAccount() {

    const loginButton =
        document.getElementById("loginButton");

    const profileButton =
        document.getElementById("profileButton");

    const profileLetter =
        document.getElementById("profileLetter");

    const menuProfileLetter =
        document.getElementById("menuProfileLetter");

    const menuUsername =
        document.getElementById("menuUsername");

    const profileMenu =
        document.getElementById("profileMenu");
const adminMenuItem =
    document.getElementById("adminMenuItem");

    if (
        !loginButton ||
        !profileButton ||
        !profileLetter ||
        !profileMenu
    ) {
        return;
    }


    try {

        const response =
            await fetch("/api/me");


        if (!response.ok) {

            loginButton.style.display =
                "inline-block";

            profileButton.style.display =
                "none";

            profileMenu.classList.remove(
                "open"
            );

            return;
        }


        const result =
            await response.json();


        if (
            !result.success ||
            !result.user
        ) {
            return;
        }


        const username =
            result.user.username;
if (adminMenuItem) {

    if (username === "bogomdan1337") {

        adminMenuItem.style.display =
            "block";

    } else {

        adminMenuItem.style.display =
            "none";

    }

}


        const letter =
            username
                .charAt(0)
                .toUpperCase();


        profileLetter.textContent =
            letter;


        if (menuProfileLetter) {

            menuProfileLetter.textContent =
                letter;

        }


        if (menuUsername) {

            menuUsername.textContent =
                username;

        }


        loginButton.style.display =
            "none";


        profileButton.style.display =
            "flex";


        // Нажатие на аватар
        profileButton.addEventListener(
            "click",
            (event) => {

                event.stopPropagation();

                profileMenuOpen =
                    !profileMenuOpen;


                if (profileMenuOpen) {

                    profileMenu.classList.add(
                        "open"
                    );

                } else {

                    profileMenu.classList.remove(
                        "open"
                    );

                }

            }
        );


        // Клик вне меню закрывает его
        document.addEventListener(
            "click",
            (event) => {

                if (
                    !profileMenu.contains(
                        event.target
                    ) &&
                    event.target !==
                        profileButton
                ) {

                    profileMenuOpen =
                        false;

                    profileMenu.classList.remove(
                        "open"
                    );

                }

            }
        );


    } catch (error) {

        console.error(
            "Ошибка проверки аккаунта:",
            error
        );

    }
}


// =========================
// ВЫХОД
// =========================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const menuLogout =
            document.getElementById(
                "menuLogout"
            );


        if (!menuLogout) {
            return;
        }


        menuLogout.addEventListener(
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
                    "index.html";

            }
        );

    }
);


updateHeaderAccount();