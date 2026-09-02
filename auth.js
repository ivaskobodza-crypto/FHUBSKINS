let registerMode = false;


const authForm =
    document.getElementById("authForm");

const authTitle =
    document.getElementById("authTitle");

const authSubtitle =
    document.getElementById("authSubtitle");

const authMessage =
    document.getElementById("authMessage");

const switchMode =
    document.getElementById("switchMode");


function setMode(register) {

    registerMode = register;


    if (registerMode) {

        authTitle.textContent =
            "Регистрация";

        authSubtitle.textContent =
            "Создай аккаунт FHUBSKINS";

        switchMode.textContent =
            "Уже есть аккаунт? Войти";

    } else {

        authTitle.textContent =
            "Войти";

        authSubtitle.textContent =
            "Войди в свой аккаунт FHUBSKINS";

        switchMode.textContent =
            "Нет аккаунта? Зарегистрироваться";
    }


    authMessage.textContent = "";
}


switchMode.addEventListener(
    "click",
    () => {

        setMode(!registerMode);

    }
);


authForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const username =
            document
                .getElementById("username")
                .value
                .trim();


        const password =
            document
                .getElementById("password")
                .value;


        authMessage.textContent =
            "Подождите...";


        try {

            const endpoint =
                registerMode
                    ? "/api/register"
                    : "/api/login";


            const response =
                await fetch(
                    endpoint,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            username,
                            password
                        })
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
                    "Произошла ошибка."
                );

            }


            authMessage.style.color =
                "#7CFF9B";


            authMessage.textContent =
                result.message;


            setTimeout(() => {

    window.location.href =
        "index.html";

}, 700);


        } catch (error) {

            authMessage.style.color =
                "#ff6b81";

            authMessage.textContent =
                error.message;

        }

    }
);