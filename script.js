document.addEventListener("DOMContentLoaded", () => {

    const PREFIX = "!"; // ◀️ ¡CAMBIA TU PREFIJO AQUÍ SI ES DIFERENTE!

    // ======== 1. Navbar Móvil (Hamburguesa) ========
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");

    if (hamburger && navMenu) {
        hamburger.addEventListener("click", () => {
            hamburger.classList.toggle("active");
            navMenu.classList.toggle("active");
        });

        document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
            hamburger.classList.remove("active");
            navMenu.classList.remove("active");
        }));
    }

    // ======== 2. Navbar con Scroll ========
    const navbar = document.querySelector(".navbar");
    if (navbar) {
        window.addEventListener("scroll", () => {
            if (window.scrollY > 50) {
                navbar.classList.add("scrolled");
            } else {
                navbar.classList.remove("scrolled");
            }
        });
    }

    // ======== 3. Animaciones al hacer Scroll ========
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                // Activar contador si es la sección de stats
                if (entry.target.classList.contains('stat-item')) {
                    const countUp = entry.target.querySelector('.stat-count');
                    if (countUp) {
                        startCountUp(countUp);
                    }
                }
            }
        });
    }, { threshold: 0.1 }); // Se activa al ver el 10% del elemento

    // Observar todos los elementos con la clase
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    document.querySelectorAll('.stat-item').forEach(el => observer.observe(el));

    // ======== 4. Contador de Estadísticas ========
    function startCountUp(el) {
        const target = parseInt(el.dataset.target, 10);
        if (el.dataset.counted) return; // Evitar que cuente varias veces
        el.dataset.counted = true;

        let current = 0;
        const duration = 2000; // 2 segundos
        const increment = target / (duration / 16); // 16ms ~ 60fps

        const updateCount = () => {
            current += increment;
            if (current < target) {
                el.innerText = Math.ceil(current).toLocaleString('es');
                requestAnimationFrame(updateCount);
            } else {
                el.innerText = target.toLocaleString('es');
            }
        };
        updateCount();
    }

    // ======== 5. Base de Datos de Comandos y Filtro ========
    const commandList = document.getElementById("command-list-container");
    const filterBtns = document.querySelectorAll('.filter-btn');

    // ⬇️ ¡Base de datos de comandos basada en tus carpetas! ⬇️
    const allCommands = [
        // action
        { name: 'clap', description: 'Aplaudir.', usage: `${PREFIX}clap`, category: 'action' },
        { name: 'dance', description: 'Bailar.', usage: `${PREFIX}dance`, category: 'action' },
        { name: 'run', description: 'Correr.', usage: `${PREFIX}run`, category: 'action' },
        { name: 'sing', description: 'Cantar.', usage: `${PREFIX}sing`, category: 'action' },
        { name: 'cooking', description: 'Cocinar.', usage: `${PREFIX}cooking`, category: 'action' },
        
        // games
        { name: '8ball', description: 'Pregúntale a la bola 8.', usage: `${PREFIX}8ball [pregunta]`, category: 'games' },
        { name: 'ship', description: 'Calcula el amor entre dos usuarios.', usage: `${PREFIX}ship [user1] [user2]`, category: 'games' },
        { name: 'snake', description: 'Juega a la serpiente.', usage: `${PREFIX}snake`, category: 'games' },
        { name: 'tictactoe', description: 'Juega al tres en raya.', usage: `${PREFIX}tictactoe [@usuario]`, category: 'games' },
        
        // info
        { name: 'getprefix', description: 'Muestra el prefijo actual.', usage: `${PREFIX}getprefix`, category: 'info' },
        { name: 'setprefix', description: 'Establece un nuevo prefijo.', usage: `${PREFIX}setprefix [nuevo_prefijo]`, category: 'info' },
        { name: 'findbug', description: 'Reporta un bug.', usage: `${PREFIX}findbug [descripción]`, category: 'info' },

        // interaccion
        { name: 'bite', description: 'Muerde a un usuario.', usage: `${PREFIX}bite [@usuario]`, category: 'interaccion' },
        { name: 'hug', description: 'Abraza a un usuario.', usage: `${PREFIX}hug [@usuario]`, category: 'interaccion' },
        { name: 'kiss', description: 'Besa a un usuario.', usage: `${PREFIX}kiss [@usuario]`, category: 'interaccion' },
        { name: 'fight', description: 'Pelea con un usuario.', usage: `${PREFIX}fight [@usuario]`, category: 'interaccion' },

        // moderaccion
        { name: 'ban', description: 'Banea a un usuario.', usage: `${PREFIX}ban [@usuario] [razón]`, category: 'moderaccion' },
        { name: 'kick', description: 'Expulsa a un usuario.', usage: `${PREFIX}kick [@usuario] [razón]`, category: 'moderaccion' },
        { name: 'mute', description: 'Silencia a un usuario.', usage: `${PREFIX}mute [@usuario] [tiempo] [razón]`, category: 'moderaccion' },
        { name: 'warn', description: 'Advierte a un usuario.', usage: `${PREFIX}warn [@usuario] [razón]`, category: 'moderaccion' },
        { name: 'antiraid', description: 'Activa el modo anti-raid.', usage: `${PREFIX}antiraid [on/off]`, category: 'moderaccion' },
        { name: 'unban', description: 'Desbanea a un usuario.', usage: `${PREFIX}unban [UserID]`, category: 'moderaccion' },
        { name: 'blacklist', description: 'Añade a un usuario a la lista negra del bot.', usage: `${PREFIX}blacklist [@usuario]`, category: 'moderaccion' },

        // premium
        { name: 'activate', description: 'Activa tu llave premium.', usage: `${PREFIX}activate [llave]`, category: 'premium' },
        { name: 'blacklistword', description: 'Añade palabras prohibidas (Premium).', usage: `${PREFIX}blacklistword [palabra]`, category: 'premium' },

        // profile
        { name: 'marry', description: 'Pide matrimonio a un usuario.', usage: `${PREFIX}marry [@usuario]`, category: 'profile' },
        { name: 'divorciar', description: 'Divórciate.', usage: `${PREFIX}divorciar`, category: 'profile' },
        
        // public
        { name: 'help', description: 'Muestra este menú de ayuda.', usage: `${PREFIX}help`, category: 'public' },
        { name: 'ping', description: 'Muestra la latencia del bot.', usage: `${PREFIX}ping`, category: 'public' },
        { name: 'serverinfo', description: 'Muestra información del servidor.', usage: `${PREFIX}serverinfo`, category: 'public' },
        { name: 'userinfo', description: 'Muestra información de un usuario.', usage: `${PREFIX}userinfo [@usuario]`, category: 'public' },
        { name: 'play', description: 'Reproduce música.', usage: `${PREFIX}play [canción]`, category: 'public' },
        { name: 'daily', description: 'Reclama tu recompensa diaria.', usage: `${PREFIX}daily`, category: 'public' },
        { name: 'trabajar', description: 'Trabaja para ganar dinero.', usage: `${PREFIX}trabajar`, category: 'public' },

        // reaccion
        { name: 'angry', description: 'Muestra tu enfado.', usage: `${PREFIX}angry`, category: 'reaccion' },
        { name: 'blush', description: 'Sonrójate.', usage: `${PREFIX}blush`, category: 'reaccion' },
        { name: 'cry', description: 'Llora.', usage: `${PREFIX}cry`, category: 'reaccion' },
        { name: 'happy', description: 'Muestra tu felicidad.', usage: `${PREFIX}happy`, category: 'reaccion' },
    ];

    // Función para mostrar los comandos
    function renderCommands(filter = 'all') {
        if (!commandList) return; // Seguridad
        commandList.innerHTML = ''; 

        const filtered = allCommands.filter(cmd => filter === 'all' || cmd.category === filter);

        if (filtered.length === 0) {
            commandList.innerHTML = '<p class="small-note" style="text-align: center; width: 100%;">No se encontraron comandos en esta categoría.</p>';
            return;
        }

        filtered.forEach(cmd => {
            const card = document.createElement('div');
            card.className = 'command-card';
            card.innerHTML = `
                <h4>${cmd.name}</h4>
                <p>${cmd.description}</p>
                <div class="usage">
                    <strong>Uso:</strong> <span>${cmd.usage}</span>
                </div>
            `;
            commandList.appendChild(card);
        });
    }

    // Event Listeners para los botones de filtro
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderCommands(btn.dataset.filter);
        });
    });

    // Carga inicial de todos los comandos
    renderCommands('all');

    // ======== 6. Lógica de Servidores Mutuos (Real) ========
    
    // Función para leer una cookie por su nombre
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
    
    // Función para borrar una cookie
    function deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }

    // Función para mostrar los servidores en el HTML
    function renderMutualServers(guilds) {
        const serverList = document.getElementById('mutual-server-list');
        if (!serverList) return;

        if (!guilds || guilds.length === 0) {
            serverList.innerHTML = '<p class="small-note">Parece que no tenemos servidores en común. ¡Invítame a alguno!</p>';
            return;
        }

        serverList.innerHTML = ''; // Limpia la lista

        guilds.forEach(guild => {
            // Usa un icono placeholder si no hay icono
            const serverIcon = guild.icon ? guild.icon : `https://via.placeholder.com/80/5865F2/FFFFFF?text=${encodeURIComponent(guild.name.charAt(0))}`;
            const serverElement = document.createElement('div');
            serverElement.className = 'server-item animate-on-scroll';
            serverElement.innerHTML = `
                <img src="${serverIcon}" alt="Icono de ${guild.name}">
                <p>${guild.name}</p>
            `;
            serverList.appendChild(serverElement);
        });
        
        // Vuelve a aplicar el observador de animación a los nuevos elementos
        serverList.querySelectorAll('.server-item.animate-on-scroll').forEach(el => observer.observe(el));
    }

    // --- Lógica Principal al Cargar la Página ---
    // Esta función se ejecutará cada vez que la página cargue
    function checkMutualServers() {
        const mutualGuildsCookie = getCookie('mutual_guilds');
        
        if (mutualGuildsCookie) {
            try {
                // 1. Parsea los datos de la cookie (puede necesitar decodificación)
                // ESTA ES LA LÍNEA CORRECTA:
const mutualGuilds = JSON.parse(decodeURIComponent(mutualGuildsCookie));
                
                // 2. Muestra los servidores
                renderMutualServers(mutualGuilds);
                
                // 3. Borra la cookie para que no se quede ahí guardada
                deleteCookie('mutual_guilds');
                
            } catch (error) {
                console.error("Error al parsear la cookie de servidores:", error);
                const serverList = document.getElementById('mutual-server-list');
                if (serverList) serverList.innerHTML = '<p class="small-note">Error al cargar servidores.</p>';
            }
        }

        // Revisa si la URL tiene un error (de la redirección del backend)
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1)); // Para #mutual?error=true
        
        if (urlParams.has('error') || hashParams.has('error')) {
            const serverList = document.getElementById('mutual-server-list');
            if (serverList) serverList.innerHTML = '<p class="small-note">Hubo un error al iniciar sesión. Inténtalo de nuevo.</p>';
            
            // Limpia la URL
            if (window.history.pushState) {
                window.history.pushState(null, '', '/#mutual');
            }
        }
    }
    
    // Ejecuta la revisión al cargar el script
    checkMutualServers();

});