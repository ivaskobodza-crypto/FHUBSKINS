const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = 8000;

// =========================
// ФАЙЛЫ И ПАПКИ
// =========================

const uploadDir = path.join(__dirname, "uploads");
const skinsFile = path.join(__dirname, "skins.json");
const usersFile = path.join(__dirname, "users.json");
const sessionsFile = path.join(__dirname, "sessions.json");
const likesFile = path.join(__dirname, "likes.json");
const favoritesFile = path.join(__dirname, "favorites.json");

let sessions = new Map();

// =========================
// СОЗДАНИЕ ФАЙЛОВ
// =========================

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, {
        recursive: true
    });
}

if (!fs.existsSync(skinsFile)) {
    fs.writeFileSync(
        skinsFile,
        "[]",
        "utf8"
    );
}

if (!fs.existsSync(usersFile)) {
    fs.writeFileSync(
        usersFile,
        "[]",
        "utf8"
    );
}

if (!fs.existsSync(sessionsFile)) {
    fs.writeFileSync(
        sessionsFile,
        "[]",
        "utf8"
    );
}

if (!fs.existsSync(likesFile)) {
    fs.writeFileSync(
        likesFile,
        "[]",
        "utf8"
    );
}

if (!fs.existsSync(favoritesFile)) {
    fs.writeFileSync(
        favoritesFile,
        "[]",
        "utf8"
    );
}

// =========================
// ПОЛЬЗОВАТЕЛИ
// =========================

function readUsers() {
    try {
        return JSON.parse(
            fs.readFileSync(
                usersFile,
                "utf8"
            )
        );
    } catch (error) {
        console.error(
            "Ошибка users.json:",
            error
        );

        return [];
    }
}

function saveUsers(users) {
    fs.writeFileSync(
        usersFile,
        JSON.stringify(
            users,
            null,
            4
        ),
        "utf8"
    );
}

// =========================
// СКИНЫ
// =========================

function readSkins() {
    try {
        return JSON.parse(
            fs.readFileSync(
                skinsFile,
                "utf8"
            )
        );
    } catch (error) {
        console.error(
            "Ошибка skins.json:",
            error
        );

        return [];
    }
}

function saveSkins(skins) {
    fs.writeFileSync(
        skinsFile,
        JSON.stringify(
            skins,
            null,
            4
        ),
        "utf8"
    );
}

// =========================
// ЛАЙКИ
// =========================

function readLikes() {
    try {
        return JSON.parse(
            fs.readFileSync(
                likesFile,
                "utf8"
            )
        );
    } catch (error) {
        console.error(
            "Ошибка likes.json:",
            error
        );

        return [];
    }
}

function saveLikes(likes) {
    fs.writeFileSync(
        likesFile,
        JSON.stringify(
            likes,
            null,
            4
        ),
        "utf8"
    );
}

function readFavorites() {
    try {
        return JSON.parse(
            fs.readFileSync(
                favoritesFile,
                "utf8"
            )
        );
    } catch (error) {
        console.error(
            "Ошибка favorites.json:",
            error
        );

        return [];
    }
}

function saveFavorites(favorites) {
    fs.writeFileSync(
        favoritesFile,
        JSON.stringify(
            favorites,
            null,
            4
        ),
        "utf8"
    );
}

// =========================
// ИЗБРАННОЕ
// =========================

app.get("/api/favorites", (req, res) => {
    const user = getCurrentUser(req);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Необходимо войти в аккаунт"
        });
    }

    const favorites = readFavorites();

    const userFavorites = favorites
        .filter(item => item.username === user.username)
        .map(item => item.skinId);

    res.json({
        success: true,
        favorites: userFavorites
    });
});

app.post("/api/skins/:id/favorite", (req, res) => {
    const user = getCurrentUser(req);

    if (!user) {
        return res.status(401).json({
            success: false,
            message: "Необходимо войти в аккаунт"
        });
    }

    const skinId = req.params.id;
    const skins = readSkins();

    const skinExists = skins.some(
        skin => skin.id === skinId
    );

    if (!skinExists) {
        return res.status(404).json({
            success: false,
            message: "Скин не найден"
        });
    }

    const favorites = readFavorites();

    const index = favorites.findIndex(
        item =>
            item.username === user.username &&
            item.skinId === skinId
    );

    let favorite;

    if (index === -1) {
        favorites.push({
            username: user.username,
            skinId: skinId
        });

        favorite = true;
    } else {
        favorites.splice(index, 1);

        favorite = false;
    }

    saveFavorites(favorites);

    res.json({
        success: true,
        favorite
    });
});

// =========================
// СЕССИИ
// =========================

function loadSessions() {
    try {
        const data =
            JSON.parse(
                fs.readFileSync(
                    sessionsFile,
                    "utf8"
                )
            );

        sessions = new Map(
            data.map(session => [
                session.token,
                session.userId
            ])
        );

    } catch (error) {
        console.error(
            "Ошибка sessions.json:",
            error
        );

        sessions = new Map();
    }
}

function saveSessions() {
    const data =
        Array.from(
            sessions.entries()
        ).map(
            ([token, userId]) => ({
                token,
                userId
            })
        );

    fs.writeFileSync(
        sessionsFile,
        JSON.stringify(
            data,
            null,
            4
        ),
        "utf8"
    );
}

function createSession(userId) {
    const token =
        crypto.randomBytes(32)
            .toString("hex");

    sessions.set(
        token,
        userId
    );

    saveSessions();

    return token;
}

function getSessionToken(req) {
    const cookie =
        req.headers.cookie || "";

    const match =
        cookie.match(
            /fhub_session=([^;]+)/
        );

    return match
        ? match[1]
        : null;
}

function getCurrentUser(req) {
    const token =
        getSessionToken(req);

    if (!token) {
        return null;
    }

    const userId =
        sessions.get(token);

    if (!userId) {
        return null;
    }

    const users =
        readUsers();

    return (
        users.find(
            user =>
                user.id === userId
        ) || null
    );
}

// =========================
// ПАРОЛИ
// =========================

function hashPassword(password) {
    const salt =
        crypto.randomBytes(16)
            .toString("hex");

    const hash =
        crypto.scryptSync(
            password,
            salt,
            64
        ).toString("hex");

    return {
        salt,
        hash
    };
}

function verifyPassword(
    password,
    salt,
    storedHash
) {
    const hash =
        crypto.scryptSync(
            password,
            salt,
            64
        );

    const stored =
        Buffer.from(
            storedHash,
            "hex"
        );

    return (
        hash.length === stored.length &&
        crypto.timingSafeEqual(
            hash,
            stored
        )
    );
}

// =========================
// ПРОВЕРКА PNG
// =========================

function getPngSize(filePath) {
    const buffer =
        fs.readFileSync(filePath);

    const signature =
        Buffer.from([
            0x89, 0x50, 0x4E, 0x47,
            0x0D, 0x0A, 0x1A, 0x0A
        ]);

    if (
        buffer.length < 24 ||
        !buffer
            .subarray(0, 8)
            .equals(signature)
    ) {
        throw new Error(
            "Файл не является корректным PNG."
        );
    }

    return {
        width:
            buffer.readUInt32BE(16),

        height:
            buffer.readUInt32BE(20)
    };
}

// =========================
// MULTER
// =========================

const storage =
    multer.diskStorage({

        destination: (req, file, cb) => {
            cb(
                null,
                uploadDir
            );
        },

        filename: (req, file, cb) => {

            const filename =
                Date.now() +
                "-" +
                Math.round(
                    Math.random() * 1e9
                ) +
                ".png";

            cb(
                null,
                filename
            );
        }
    });

const upload =
    multer({

        storage,

        limits: {
            fileSize:
                2 * 1024 * 1024
        },

        fileFilter:
            (req, file, cb) => {

                if (
                    file.mimetype !==
                    "image/png"
                ) {

                    return cb(
                        new Error(
                            "Разрешены только PNG-файлы."
                        )
                    );
                }

                cb(null, true);
            }
    });

// =========================
// MIDDLEWARE
// =========================

app.use(
    express.json()
);

// =========================
// ЗАЩИТА СТРАНИЦ
// =========================

app.get(
    "/upload.html",
    (req, res) => {

        const user =
            getCurrentUser(req);

        if (
            user &&
            user.username === "bogomdan1337"
        ) {
            return res.redirect(
                "/admin.html"
            );
        }

        return res.redirect(
            "/index.html"
        );
    }
);

app.get(
    "/admin.html",
    (req, res) => {

        const user =
            getCurrentUser(req);

        if (
            !user ||
            user.username !== "bogomdan1337"
        ) {
            return res.redirect(
                "/index.html"
            );
        }

        res.sendFile(
            path.join(
                __dirname,
                "admin.html"
            )
        );
    }
);

app.use(
    express.static(__dirname)
);

// =========================
// РЕГИСТРАЦИЯ
// =========================

app.post(
    "/api/register",
    (req, res) => {

        const username =
            String(
                req.body.username || ""
            )
            .trim();

        const password =
            String(
                req.body.password || ""
            );

        if (
            username.length < 3 ||
            username.length > 20
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Имя пользователя должно быть от 3 до 20 символов."

            });
        }

        if (
            !/^[a-zA-Z0-9_]+$/.test(
                username
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Используй только латинские буквы, цифры и _."

            });
        }

        if (
            password.length < 6
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Пароль должен содержать минимум 6 символов."

            });
        }

        const users =
            readUsers();

        const exists =
            users.some(
                user =>
                    user.username.toLowerCase() ===
                    username.toLowerCase()
            );

        if (exists) {

            return res.status(400).json({

                success: false,

                message:
                    "Такое имя пользователя уже занято."

            });
        }

        const passwordData =
            hashPassword(password);

        const user = {

            id:
                crypto.randomUUID(),

            username,

            passwordHash:
                passwordData.hash,

            passwordSalt:
                passwordData.salt,

            createdAt:
                new Date().toISOString()

        };

        users.push(user);

        saveUsers(users);

        const token =
            createSession(user.id);

        res.setHeader(
            "Set-Cookie",
            `fhub_session=${token}; HttpOnly; Path=/; SameSite=Lax`
        );

        res.json({

            success: true,

            message:
                "Аккаунт успешно создан.",

            user: {

                id:
                    user.id,

                username:
                    user.username

            }

        });
    }
);

// =========================
// ВХОД
// =========================

app.post(
    "/api/login",
    (req, res) => {

        const username =
            String(
                req.body.username || ""
            )
            .trim();

        const password =
            String(
                req.body.password || ""
            );

        const users =
            readUsers();

        const user =
            users.find(
                item =>
                    item.username.toLowerCase() ===
                    username.toLowerCase()
            );

        if (
            !user ||
            !verifyPassword(
                password,
                user.passwordSalt,
                user.passwordHash
            )
        ) {

            return res.status(401).json({

                success: false,

                message:
                    "Неверное имя пользователя или пароль."

            });
        }

        const token =
            createSession(user.id);

        res.setHeader(
            "Set-Cookie",
            `fhub_session=${token}; HttpOnly; Path=/; SameSite=Lax`
        );

        res.json({

            success: true,

            message:
                "Вход выполнен.",

            user: {

                id:
                    user.id,

                username:
                    user.username

            }

        });
    }
);

// =========================
// ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ
// =========================

app.get(
    "/api/me",
    (req, res) => {

        const user =
            getCurrentUser(req);

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Пользователь не авторизован."

            });
        }

        res.json({

            success: true,

            user: {

                id:
                    user.id,

                username:
                    user.username,

                createdAt:
                    user.createdAt

            }

        });
    }
);

// =========================
// ВЫХОД
// =========================

app.post(
    "/api/logout",
    (req, res) => {

        const token =
            getSessionToken(req);

        if (token) {

            sessions.delete(token);

            saveSessions();

        }

        res.setHeader(
            "Set-Cookie",
            "fhub_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
        );

        res.json({

            success: true,

            message:
                "Вы вышли из аккаунта."

        });
    }
);

// =========================
// ВСЕ СКИНЫ
// =========================

app.get(
    "/api/skins",
    (req, res) => {

        res.json(
            readSkins()
        );

    }
);

// =========================
// ОДИН СКИН
// =========================

app.get(
    "/api/skins/:id",
    (req, res) => {

        const skins =
            readSkins();

        const skin =
            skins.find(
                item =>
                    item.id === req.params.id
            );

        if (!skin) {

            return res.status(404).json({

                success: false,

                message:
                    "Скин не найден."

            });
        }

        const user =
            getCurrentUser(req);

        const likes =
            readLikes();

        const liked =
            user
                ? likes.some(
                    like =>
                        like.userId === user.id &&
                        like.skinId === skin.id
                )
                : false;

        res.json({

            ...skin,

            price:
                Number(
                    skin.price || 0
                ),

            liked

        });

    }
);

// =========================
// ЛАЙК
// =========================

app.post(
    "/api/skins/:id/like",
    (req, res) => {

        const user =
            getCurrentUser(req);

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Сначала войди в аккаунт."

            });
        }

        const skins =
            readSkins();

        const skin =
            skins.find(
                item =>
                    item.id === req.params.id
            );

        if (!skin) {

            return res.status(404).json({

                success: false,

                message:
                    "Скин не найден."

            });
        }

        const likes =
            readLikes();

        const alreadyLiked =
            likes.some(
                like =>
                    like.userId === user.id &&
                    like.skinId === skin.id
            );

        if (alreadyLiked) {

            return res.status(400).json({

                success: false,

                message:
                    "Ты уже поставил лайк этому скину.",

                likes:
                    Number(
                        skin.likes || 0
                    )

            });
        }

        likes.push({

            userId:
                user.id,

            skinId:
                skin.id,

            createdAt:
                new Date().toISOString()

        });

        saveLikes(likes);

        skin.likes =
            Number(
                skin.likes || 0
            ) + 1;

        saveSkins(skins);

        console.log(
            `Лайк: ${skin.title} | ${user.username}`
        );

        res.json({

            success: true,

            likes:
                skin.likes

        });

    }
);

// =========================
// РЕДАКТИРОВАНИЕ СКИНА
// =========================

app.put(
    "/api/skins/:id",
    (req, res) => {

        const user =
            getCurrentUser(req);

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Сначала войди в аккаунт."

            });
        }

        if (
            user.username !== "bogomdan1337"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Недостаточно прав."

            });
        }

        const title =
            String(
                req.body.title || ""
            )
            .trim()
            .slice(0, 60);

        const category =
            String(
                req.body.category || ""
            )
            .trim()
            .toLowerCase();

        const price =
            Math.max(
                0,
                Number(
                    req.body.price || 0
                )
            );

        const allowedCategories = [
            "pvp",
            "anime",
            "girls",
            "boys",
            "funny",
            "mobs"
        ];

        if (!title) {

            return res.status(400).json({

                success: false,

                message:
                    "Название скина не может быть пустым."

            });
        }

        if (
            !allowedCategories.includes(
                category
            )
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Выбрана недопустимая категория."

            });
        }

        const skins =
            readSkins();

        const skinIndex =
            skins.findIndex(
                skin =>
                    skin.id === req.params.id
            );

        if (skinIndex === -1) {

            return res.status(404).json({

                success: false,

                message:
                    "Скин не найден."

            });
        }

        skins[skinIndex].title =
            title;

        skins[skinIndex].category =
            category;

        skins[skinIndex].price =
            price;

        saveSkins(
            skins
        );

        console.log(
            `Скин изменён: ${title} | Автор: ${user.username}`
        );

        res.json({

            success: true,

            message:
                "Скин успешно изменён.",

            skin:
                skins[skinIndex]

        });

    }
);

// =========================
// ЗАМЕНА PNG
// =========================

app.put(
    "/api/skins/:id/image",
    upload.single("skin"),
    (req, res) => {

        const user =
            getCurrentUser(req);

        if (!user) {

            if (
                req.file &&
                fs.existsSync(req.file.path)
            ) {
                fs.unlinkSync(
                    req.file.path
                );
            }

            return res.status(401).json({

                success: false,

                message:
                    "Сначала войди в аккаунт."

            });
        }

        if (
            user.username !== "bogomdan1337"
        ) {

            if (
                req.file &&
                fs.existsSync(req.file.path)
            ) {
                fs.unlinkSync(
                    req.file.path
                );
            }

            return res.status(403).json({

                success: false,

                message:
                    "Недостаточно прав."

            });
        }

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "PNG-файл не выбран."

            });
        }

        try {

            const size =
                getPngSize(
                    req.file.path
                );

            if (
                size.width !== 64 ||
                size.height !== 64
            ) {

                fs.unlinkSync(
                    req.file.path
                );

                return res.status(400).json({

                    success: false,

                    message:
                        `Скин должен быть 64×64. Получен ${size.width}×${size.height}.`

                });
            }

            const skins =
                readSkins();

            const skinIndex =
                skins.findIndex(
                    skin =>
                        skin.id === req.params.id
                );

            if (skinIndex === -1) {

                fs.unlinkSync(
                    req.file.path
                );

                return res.status(404).json({

                    success: false,

                    message:
                        "Скин не найден."

                });
            }

            const skin =
                skins[skinIndex];

            const oldFilePath =
                path.join(
                    __dirname,
                    skin.file.replace(
                        /^\/+/,
                        ""
                    )
                );

            if (
                fs.existsSync(oldFilePath) &&
                oldFilePath.startsWith(uploadDir)
            ) {

                fs.unlinkSync(
                    oldFilePath
                );

            }

            skin.file =
                "/uploads/" +
                req.file.filename;

            saveSkins(
                skins
            );

            console.log(
                `PNG заменён: ${skin.title} | ${user.username}`
            );

            res.json({

                success: true,

                message:
                    "PNG успешно заменён.",

                skin:
                    skin

            });

        } catch (error) {

            if (
                req.file &&
                fs.existsSync(req.file.path)
            ) {

                fs.unlinkSync(
                    req.file.path
                );

            }

            console.error(
                "Ошибка замены PNG:",
                error
            );

            res.status(400).json({

                success: false,

                message:
                    error.message ||
                    "Ошибка обработки PNG."

            });

        }

    }
);

// =========================
// ДУБЛИРОВАНИЕ СКИНА
// =========================

app.post(
    "/api/skins/:id/duplicate",
    (req, res) => {

        const user =
            getCurrentUser(req);

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Сначала войди в аккаунт."

            });
        }

        if (
            user.username !== "bogomdan1337"
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Недостаточно прав."

            });
        }

        const skins =
            readSkins();

        const originalSkin =
            skins.find(
                skin =>
                    skin.id === req.params.id
            );

        if (!originalSkin) {

            return res.status(404).json({

                success: false,

                message:
                    "Исходный скин не найден."

            });
        }

        const originalPath =
            path.join(
                __dirname,
                originalSkin.file.replace(
                    /^\/+/,
                    ""
                )
            );

        if (
            !fs.existsSync(
                originalPath
            )
        ) {

            return res.status(404).json({

                success: false,

                message:
                    "PNG исходного скина не найден."

            });
        }

        const extension =
            path.extname(
                originalPath
            ) || ".png";

        const newFilename =
            Date.now() +
            "-" +
            Math.round(
                Math.random() * 1e9
            ) +
            extension;

        const newPath =
            path.join(
                uploadDir,
                newFilename
            );

        fs.copyFileSync(
            originalPath,
            newPath
        );

        const newSkin = {

            id:
                crypto.randomUUID(),

            title:
                String(
                    req.body.title ||
                    `${originalSkin.title} Copy`
                )
                .trim()
                .slice(0, 60),

            author:
                user.username,

            category:
                String(
                    req.body.category ||
                    originalSkin.category ||
                    "funny"
                )
                .trim()
                .toLowerCase(),

            price:
                Math.max(
                    0,
                    Number(
                        req.body.price ??
                        originalSkin.price ??
                        0
                    )
                ),

            likes:
                0,

            downloads:
                0,

            file:
                "/uploads/" +
                newFilename,

            createdAt:
                new Date().toISOString()

        };

        const allowedCategories = [
            "pvp",
            "anime",
            "girls",
            "boys",
            "funny",
            "mobs"
        ];

        if (
            !allowedCategories.includes(
                newSkin.category
            )
        ) {

            fs.unlinkSync(
                newPath
            );

            return res.status(400).json({

                success: false,

                message:
                    "Выбрана недопустимая категория."

            });
        }

        skins.unshift(
            newSkin
        );

        saveSkins(
            skins
        );

        console.log(
            `Скин дублирован: ${newSkin.title} | Автор: ${user.username}`
        );

        return res.json({

            success: true,

            message:
                "Скин успешно дублирован.",

            skin:
                newSkin

        });

    }
);

// =========================
// УДАЛЕНИЕ СКИНА
// =========================

app.delete(
    "/api/skins/:id",
    (req, res) => {

        const user =
            getCurrentUser(req);

        if (!user) {

            return res.status(401).json({

                success: false,

                message:
                    "Сначала войди в аккаунт."

            });
        }

        const skins =
            readSkins();

        const skinIndex =
            skins.findIndex(
                skin =>
                    skin.id === req.params.id
            );

        if (skinIndex === -1) {

            return res.status(404).json({

                success: false,

                message:
                    "Скин не найден."

            });
        }

        const skin =
            skins[skinIndex];

        if (
            skin.author !==
            user.username
        ) {

            return res.status(403).json({

                success: false,

                message:
                    "Ты можешь удалять только свои скины."

            });
        }

        const filePath =
            path.join(
                __dirname,
                skin.file.replace(
                    /^\/+/,
                    ""
                )
            );

        if (
            fs.existsSync(
                filePath
            )
        ) {

            fs.unlinkSync(
                filePath
            );

        }

        skins.splice(
            skinIndex,
            1
        );

        saveSkins(
            skins
        );

        const likes =
            readLikes();

        const filteredLikes =
            likes.filter(
                like =>
                    like.skinId !== skin.id
            );

        saveLikes(
            filteredLikes
        );

        console.log(
            `Скин удалён: ${skin.title} | Автор: ${user.username}`
        );

        res.json({

            success: true,

            message:
                "Скин успешно удалён."

        });

    }
);

// =========================
// СКАЧИВАНИЕ
// =========================

app.get(
    "/api/skins/:id/download",
    (req, res) => {

        const skins =
            readSkins();

        const skin =
            skins.find(
                item =>
                    item.id === req.params.id
            );

        if (!skin) {

            return res.status(404).send(
                "Скин не найден."
            );

        }

        const relativePath =
            skin.file.replace(
                /^\/+/,
                ""
            );

        const filePath =
            path.join(
                __dirname,
                relativePath
            );

        if (
            !fs.existsSync(
                filePath
            )
        ) {

            return res.status(404).send(
                "Файл скина не найден."
            );

        }

        skin.downloads =
            Number(
                skin.downloads || 0
            ) + 1;

        saveSkins(
            skins
        );

        res.download(
            filePath,
            `${skin.title}.png`
        );

    }
);

// =========================
// ЗАГРУЗКА СКИНА
// =========================

app.post(
    "/api/upload",
    upload.single("skin"),
    (req, res) => {

        const user =
            getCurrentUser(req);

        if (!user) {

            if (
                req.file &&
                fs.existsSync(req.file.path)
            ) {

                fs.unlinkSync(
                    req.file.path
                );

            }

            return res.status(401).json({

                success: false,

                message:
                    "Сначала войди в аккаунт."

            });
        }

        if (
            user.username !==
            "bogomdan1337"
        ) {

            if (
                req.file &&
                fs.existsSync(req.file.path)
            ) {

                fs.unlinkSync(
                    req.file.path
                );

            }

            return res.status(403).json({

                success: false,

                message:
                    "Только владелец FHUBSKINS может публиковать скины."

            });
        }

        if (!req.file) {

            return res.status(400).json({

                success: false,

                message:
                    "Файл не загружен."

            });
        }

        try {

            const size =
                getPngSize(
                    req.file.path
                );

            if (
                size.width !== 64 ||
                size.height !== 64
            ) {

                fs.unlinkSync(
                    req.file.path
                );

                return res.status(400).json({

                    success: false,

                    message:
                        `Скин должен быть 64×64. Получен ${size.width}×${size.height}.`

                });
            }

            const title =
                String(
                    req.body.title || ""
                )
                .trim()
                .slice(0, 60);

            const category =
                String(
                    req.body.category || ""
                )
                .trim()
                .toLowerCase();

            const price =
                Math.max(
                    0,
                    Number(
                        req.body.price || 0
                    )
                );

            const allowedCategories = [
                "pvp",
                "anime",
                "girls",
                "boys",
                "funny",
                "mobs"
            ];

            if (!title) {

                fs.unlinkSync(
                    req.file.path
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Введите название скина."

                });
            }

            if (
                !allowedCategories.includes(
                    category
                )
            ) {

                fs.unlinkSync(
                    req.file.path
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Выбрана недопустимая категория."

                });
            }

            const skins =
                readSkins();

            // =========================
            // НОВЫЙ СКИН
            // =========================

            const newSkin = {

                id:
                    crypto.randomUUID(),

                title:
                    title,

                author:
                    user.username,

                category:
                    category,

                price:
                    price,

                likes:
                    0,

                downloads:
                    0,

                file:
                    "/uploads/" +
                    req.file.filename,

                createdAt:
                    new Date().toISOString()

            };

            skins.unshift(
                newSkin
            );

            saveSkins(
                skins
            );

            console.log(
                `Новый скин опубликован: ${newSkin.title} | Автор: ${user.username} | Цена: ${newSkin.price}`
            );

            res.json({

                success: true,

                message:
                    "Скин успешно опубликован.",

                skin:
                    newSkin

            });

        } catch (error) {

            if (
                req.file &&
                fs.existsSync(
                    req.file.path
                )
            ) {

                fs.unlinkSync(
                    req.file.path
                );

            }

            console.error(
                "Ошибка загрузки:",
                error
            );

            res.status(400).json({

                success: false,

                message:
                    error.message ||
                    "Ошибка обработки PNG."

            });

        }

    }
);

// =========================
// ОШИБКИ
// =========================

app.use(
    (err, req, res, next) => {

        console.error(
            "ОШИБКА:",
            err.message
        );

        res.status(400).json({

            success: false,

            message:
                err.message ||
                "Ошибка сервера."

        });

    }
);

// =========================
// ЗАГРУЗКА СЕССИЙ
// =========================

loadSessions();

// =========================
// ЗАПУСК СЕРВЕРА
// =========================

const server =
    app.listen(
        PORT,
        "0.0.0.0",
        () => {

            console.log("");

            console.log(
                "================================="
            );

            console.log(
                " FHUBSKINS SERVER ЗАПУЩЕН"
            );

            console.log(
                " http://localhost:8000"
            );

            console.log(
                "================================="
            );

            console.log("");

        }
    );

server.on(
    "error",
    error => {

        console.error(
            "ОШИБКА СЕРВЕРА:",
            error
        );

    }
);
