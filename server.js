// --- 1. Importaciones y Configuración ---
require('dotenv').config(); // Carga las variables de .env
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// URLs y Secretos cargados desde .env
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const BOT_TOKEN = process.env.BOT_TOKEN;
const BASE_URL = process.env.BASE_URL;
const FRONTEND_URL = process.env.FRONTEND_URL;
const REDIRECT_URI = `${BASE_URL}/api/callback`;

app.use(cookieParser());
app.use(express.static(__dirname)); // <-- ¡Esta debe estar aquí!


// --- 3. Endpoint de Login (/api/login) ---
// Este es el enlace que tu botón "Iniciar sesión con Discord" debe llamar.
app.get('/api/login', (req, res) => {
    // Definimos los 'scopes' (permisos) que pedimos al usuario
    // 'identify' = Ver su usuario. 'guilds' = Ver sus servidores.
    const scopes = 'identify guilds';
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${scopes}`;
    
    // Redirigimos al usuario a la página de autorización de Discord
    res.redirect(authUrl);
});

// --- 4. Endpoint de Callback (/api/callback) ---
// Discord redirige al usuario aquí después de que autoriza.
app.get('/api/callback', async (req, res) => {
    // Obtenemos el 'code' de autorización de la URL
    const code = req.query.code;

    // Si no hay código (ej. el usuario canceló), redirigimos con error
    if (!code) {
        return res.redirect(`${FRONTEND_URL}/#mutual?error=true`);
    }

    try {
        // --- A. Intercambiar el código por un Access Token ---
        const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: REDIRECT_URI,
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const tokenData = await tokenResponse.json();
        if (tokenData.error) {
            throw new Error(`Error de token: ${tokenData.error_description}`);
        }
        
        const accessToken = tokenData.access_token;

        // --- B. Obtener los servidores del USUARIO y del BOT ---
        
        // Petición 1: Servidores del Usuario (usando el Access Token del usuario)
        const userGuildsPromise = fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        // Petición 2: Servidores del Bot (usando el Bot Token)
        const botGuildsPromise = fetch('https://discord.com/api/v10/users/@me/guilds', {
            headers: {
                Authorization: `Bot ${BOT_TOKEN}`,
            },
        });

        // Ejecutamos ambas peticiones en paralelo para más velocidad
        const [userGuildsResponse, botGuildsResponse] = await Promise.all([
            userGuildsPromise,
            botGuildsPromise,
        ]);

        const userGuilds = await userGuildsResponse.json();
        const botGuilds = await botGuildsResponse.json();

        if (!Array.isArray(userGuilds) || !Array.isArray(botGuilds)) {
             throw new Error('No se pudieron obtener las listas de servidores.');
        }

        // --- C. Encontrar los Servidores Mutuos ---
        
        // Creamos un Set con los IDs de los servidores del bot para búsqueda rápida
        const botGuildIds = new Set(botGuilds.map(guild => guild.id));

        // Filtramos la lista del usuario para encontrar los que también están en la lista del bot
        const mutualGuilds = userGuilds.filter(guild => botGuildIds.has(guild.id));

        // Formateamos los datos para el frontend (solo lo que necesitamos)
        const mutualsFormatted = mutualGuilds.map(guild => ({
            id: guild.id,
            name: guild.name,
            icon: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null
        }));

        // --- D. Guardar en Cookie y Redirigir ---
        
        // Convertimos los datos a JSON y los codificamos para la cookie
        // Usamos encodeURIComponent para asegurar que caracteres especiales se guarden bien
        // ESTA ES LA LÍNEA CORRECTA:
const cookieData = JSON.stringify(mutualsFormatted);

        // Establecemos la cookie. 
        // httpOnly: false -> PERMITE que tu script.js (del frontend) la lea.
        // maxAge: 60000 -> La cookie expira en 60 segundos (tu JS la borra, pero es una seguridad)
        res.cookie('mutual_guilds', cookieData, { httpOnly: false, maxAge: 60000, path: '/' });

        // Redirigimos al usuario de vuelta a la sección #mutual de tu web
        res.redirect(`${FRONTEND_URL}/#mutual`);

    } catch (error) {
        // Si algo falla, redirigimos con un error
        console.error("Error en el callback de OAuth:", error);
        res.redirect(`${FRONTEND_URL}/#mutual?error=true`);
    }
});

// --- 5. Iniciar el Servidor ---
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend "Pro" corriendo en ${BASE_URL}`);
});