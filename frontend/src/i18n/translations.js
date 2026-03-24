/**
 * Internationalization (i18n) System
 * Supports: English, Portuguese (Brazil), Spanish, German
 */

export const LANGUAGES = {
  en: { code: 'en', name: 'English', flag: '🇺🇸' },
  pt: { code: 'pt', name: 'Português', flag: '🇧🇷' },
  es: { code: 'es', name: 'Español', flag: '🇪🇸' },
  de: { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
};

export const translations = {
  // ═══════════════════════════════════════════════════════════════════════════
  // LANDING PAGE
  // ═══════════════════════════════════════════════════════════════════════════
  landing: {
    hero: {
      en: 'Build habits that stick',
      pt: 'Crie hábitos que duram',
      es: 'Crea hábitos que perduran',
      de: 'Gewohnheiten die bleiben',
    },
    subtitle: {
      en: 'Track your daily routines, build streaks, and achieve your goals with gamification.',
      pt: 'Acompanhe suas rotinas diárias, construa sequências e alcance seus objetivos com gamificação.',
      es: 'Rastrea tus rutinas diarias, construye rachas y alcanza tus metas con gamificación.',
      de: 'Verfolge deine täglichen Routinen, baue Serien auf und erreiche deine Ziele mit Gamification.',
    },
    getStarted: {
      en: 'Get Started',
      pt: 'Começar',
      es: 'Empezar',
      de: 'Loslegen',
    },
    badge: {
      en: 'Level up your life',
      pt: 'Evolua sua vida',
      es: 'Sube de nivel tu vida',
      de: 'Level up dein Leben',
    },
    free: {
      en: 'Free',
      pt: 'Grátis',
      es: 'Gratis',
      de: 'Kostenlos',
    },
    forever: {
      en: 'Forever',
      pt: 'Para sempre',
      es: 'Para siempre',
      de: 'Für immer',
    },
    everythingYouNeed: {
      en: 'Everything you need',
      pt: 'Tudo que você precisa',
      es: 'Todo lo que necesitas',
      de: 'Alles was du brauchst',
    },
    powerfulFeatures: {
      en: 'Powerful features to help you build lasting habits',
      pt: 'Recursos poderosos para ajudar você a criar hábitos duradouros',
      es: 'Funciones poderosas para ayudarte a crear hábitos duraderos',
      de: 'Leistungsstarke Funktionen für dauerhafte Gewohnheiten',
    },
    trackGrowth: {
      en: 'Track your growth',
      pt: 'Acompanhe seu crescimento',
      es: 'Rastrea tu crecimiento',
      de: 'Verfolge dein Wachstum',
    },
    trackGrowthDesc: {
      en: 'Beautiful charts to visualize your progress',
      pt: 'Gráficos bonitos para visualizar seu progresso',
      es: 'Gráficos hermosos para visualizar tu progreso',
      de: 'Schöne Diagramme zur Visualisierung deines Fortschritts',
    },
    howItWorks: {
      en: 'How it works',
      pt: 'Como funciona',
      es: 'Cómo funciona',
      de: 'So funktioniert es',
    },
    howItWorksDesc: {
      en: 'Get started in 3 simple steps',
      pt: 'Comece em 3 passos simples',
      es: 'Empieza en 3 sencillos pasos',
      de: 'Starte in 3 einfachen Schritten',
    },
    steps: {
      create: { en: 'Create Habits', pt: 'Crie Hábitos', es: 'Crea Hábitos', de: 'Gewohnheiten erstellen' },
      createDesc: { en: 'Add daily, weekly, or custom habits you want to build', pt: 'Adicione hábitos diários, semanais ou personalizados', es: 'Agrega hábitos diarios, semanales o personalizados', de: 'Füge tägliche, wöchentliche oder benutzerdefinierte Gewohnheiten hinzu' },
      track: { en: 'Track Progress', pt: 'Acompanhe o Progresso', es: 'Rastrea el Progreso', de: 'Fortschritt verfolgen' },
      trackDesc: { en: 'Check off habits daily and watch your streaks grow', pt: 'Marque seus hábitos diariamente e veja suas sequências crescerem', es: 'Marca tus hábitos diariamente y mira crecer tus rachas', de: 'Hake Gewohnheiten täglich ab und beobachte deine Serien wachsen' },
      levelUp: { en: 'Level Up', pt: 'Suba de Nível', es: 'Sube de Nivel', de: 'Level Up' },
      levelUpDesc: { en: 'Earn XP, unlock achievements, and become unstoppable', pt: 'Ganhe XP, desbloqueie conquistas e torne-se imparável', es: 'Gana XP, desbloquea logros y vuélvete imparable', de: 'Verdiene XP, schalte Erfolge frei und werde unaufhaltsam' },
    },
    gamified: {
      en: 'Gamified habit tracking',
      pt: 'Rastreamento gamificado de hábitos',
      es: 'Seguimiento gamificado de hábitos',
      de: 'Gamifiziertes Gewohnheits-Tracking',
    },
    adventureTitle: {
      en: 'Turn your goals into',
      pt: 'Transforme seus objetivos em',
      es: 'Convierte tus metas en',
      de: 'Verwandle deine Ziele in',
    },
    adventureHighlight: {
      en: 'an adventure',
      pt: 'uma aventura',
      es: 'una aventura',
      de: 'ein Abenteuer',
    },
    adventureDesc: {
      en: 'Join others who are building better habits through gamification. Every habit completed earns XP, every streak maintained unlocks achievements.',
      pt: 'Junte-se a outros que estão construindo hábitos melhores através da gamificação. Cada hábito completo ganha XP, cada sequência mantida desbloqueia conquistas.',
      es: 'Únete a otros que construyen mejores hábitos con gamificación. Cada hábito completado gana XP, cada racha mantenida desbloquea logros.',
      de: 'Schließe dich anderen an, die durch Gamification bessere Gewohnheiten aufbauen. Jede abgeschlossene Gewohnheit verdient XP, jede Serie schaltet Erfolge frei.',
    },
    readyTitle: {
      en: 'Ready to level up?',
      pt: 'Pronto para evoluir?',
      es: '¿Listo para subir de nivel?',
      de: 'Bereit zum Aufsteigen?',
    },
    readyDesc: {
      en: 'Start building habits that stick. Free forever, no credit card required.',
      pt: 'Comece a criar hábitos que duram. Grátis para sempre, sem cartão de crédito.',
      es: 'Empieza a crear hábitos que perduran. Gratis para siempre, sin tarjeta de crédito.',
      de: 'Beginne Gewohnheiten aufzubauen, die bleiben. Für immer kostenlos, keine Kreditkarte nötig.',
    },
    getStartedNow: {
      en: 'Get Started Now',
      pt: 'Começar Agora',
      es: 'Empezar Ahora',
      de: 'Jetzt Loslegen',
    },
    freeForever: {
      en: 'Free forever',
      pt: 'Grátis para sempre',
      es: 'Gratis para siempre',
      de: 'Für immer kostenlos',
    },
    noCreditCard: {
      en: 'No credit card',
      pt: 'Sem cartão de crédito',
      es: 'Sin tarjeta de crédito',
      de: 'Keine Kreditkarte',
    },
    googleLoginLabel: {
      en: 'Google login',
      pt: 'Login com Google',
      es: 'Inicio con Google',
      de: 'Google-Login',
    },
    features: {
      habits: {
        en: 'Smart Habits',
        pt: 'Hábitos Inteligentes',
        es: 'Hábitos Inteligentes',
        de: 'Smarte Gewohnheiten',
      },
      habitsDesc: {
        en: 'Create and track daily habits with flexible schedules',
        pt: 'Crie e acompanhe hábitos diários com horários flexíveis',
        es: 'Crea y rastrea hábitos diarios con horarios flexibles',
        de: 'Erstelle und verfolge tägliche Gewohnheiten mit flexiblen Zeitplänen',
      },
      streaks: {
        en: 'Streaks & XP',
        pt: 'Sequências & XP',
        es: 'Rachas & XP',
        de: 'Serien & XP',
      },
      streaksDesc: {
        en: 'Stay motivated with streaks and earn XP for consistency',
        pt: 'Mantenha-se motivado com sequências e ganhe XP pela consistência',
        es: 'Mantente motivado con rachas y gana XP por consistencia',
        de: 'Bleib motiviert mit Serien und verdiene XP für Beständigkeit',
      },
      ai: {
        en: 'AI Assistant',
        pt: 'Assistente IA',
        es: 'Asistente IA',
        de: 'KI-Assistent',
      },
      aiDesc: {
        en: 'TARS helps you plan and stay on track with voice support',
        pt: 'TARS te ajuda a planejar e manter o foco com suporte por voz',
        es: 'TARS te ayuda a planificar y mantenerte enfocado con soporte de voz',
        de: 'TARS hilft dir zu planen und auf Kurs zu bleiben mit Sprachunterstützung',
      },
      statsTitle: {
        en: 'Statistics',
        pt: 'Estatísticas',
        es: 'Estadísticas',
        de: 'Statistiken',
      },
      statsDesc: {
        en: 'Beautiful charts and insights to track your progress',
        pt: 'Gráficos bonitos e insights para acompanhar seu progresso',
        es: 'Gráficos hermosos e insights para rastrear tu progreso',
        de: 'Schöne Diagramme und Einblicke um deinen Fortschritt zu verfolgen',
      },
      friendsTitle: {
        en: 'Friends',
        pt: 'Amigos',
        es: 'Amigos',
        de: 'Freunde',
      },
      friendsDesc: {
        en: 'Connect with friends and share your progress',
        pt: 'Conecte-se com amigos e compartilhe seu progresso',
        es: 'Conecta con amigos y comparte tu progreso',
        de: 'Verbinde dich mit Freunden und teile deinen Fortschritt',
      },
      backupTitle: {
        en: 'Cloud Backup',
        pt: 'Backup na Nuvem',
        es: 'Copia en la Nube',
        de: 'Cloud-Backup',
      },
      backupDesc: {
        en: 'Your data is safely synced across all your devices',
        pt: 'Seus dados são sincronizados com segurança em todos os dispositivos',
        es: 'Tus datos se sincronizan de forma segura en todos tus dispositivos',
        de: 'Deine Daten werden sicher auf allen Geräten synchronisiert',
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════════════════════════════════
  auth: {
    login: {
      en: 'Login',
      pt: 'Entrar',
      es: 'Iniciar sesión',
      de: 'Anmelden',
    },
    register: {
      en: 'Register',
      pt: 'Cadastrar',
      es: 'Registrarse',
      de: 'Registrieren',
    },
    username: {
      en: 'Username',
      pt: 'Nome de usuário',
      es: 'Nombre de usuario',
      de: 'Benutzername',
    },
    email: {
      en: 'Email',
      pt: 'Email',
      es: 'Correo electrónico',
      de: 'E-Mail',
    },
    password: {
      en: 'Password',
      pt: 'Senha',
      es: 'Contraseña',
      de: 'Passwort',
    },
    confirmPassword: {
      en: 'Confirm password',
      pt: 'Confirmar senha',
      es: 'Confirmar contraseña',
      de: 'Passwort bestätigen',
    },
    forgotPassword: {
      en: 'Forgot password?',
      pt: 'Esqueceu a senha?',
      es: '¿Olvidaste tu contraseña?',
      de: 'Passwort vergessen?',
    },
    noAccount: {
      en: "Don't have an account?",
      pt: 'Não tem uma conta?',
      es: '¿No tienes una cuenta?',
      de: 'Kein Konto?',
    },
    hasAccount: {
      en: 'Already have an account?',
      pt: 'Já tem uma conta?',
      es: '¿Ya tienes una cuenta?',
      de: 'Bereits ein Konto?',
    },
    orContinueWith: {
      en: 'or continue with',
      pt: 'ou continue com',
      es: 'o continúa con',
      de: 'oder weiter mit',
    },
    googleLogin: {
      en: 'Continue with Google',
      pt: 'Continuar com Google',
      es: 'Continuar con Google',
      de: 'Weiter mit Google',
    },
    welcomeBack: {
      en: 'Welcome back',
      pt: 'Bem-vindo de volta',
      es: 'Bienvenido de nuevo',
      de: 'Willkommen zurück',
    },
    createAccount: {
      en: 'Create your account',
      pt: 'Crie sua conta',
      es: 'Crea tu cuenta',
      de: 'Erstelle dein Konto',
    },
    back: {
      en: 'Back',
      pt: 'Voltar',
      es: 'Volver',
      de: 'Zurück',
    },
    tagline: {
      en: 'Track your habits. Level up your life.',
      pt: 'Acompanhe seus hábitos. Evolua sua vida.',
      es: 'Rastrea tus hábitos. Sube de nivel tu vida.',
      de: 'Verfolge deine Gewohnheiten. Level up dein Leben.',
    },
    whosPlaying: {
      en: "Who's playing?",
      pt: 'Quem vai jogar?',
      es: '¿Quién juega?',
      de: 'Wer spielt?',
    },
    newAccount: {
      en: '+ New account',
      pt: '+ Nova conta',
      es: '+ Nueva cuenta',
      de: '+ Neues Konto',
    },
    otherAccount: {
      en: 'Other account',
      pt: 'Outra conta',
      es: 'Otra cuenta',
      de: 'Anderes Konto',
    },
    signIn: {
      en: 'Sign In',
      pt: 'Entrar',
      es: 'Iniciar sesión',
      de: 'Anmelden',
    },
    signUp: {
      en: 'Sign Up',
      pt: 'Cadastrar',
      es: 'Registrarse',
      de: 'Registrieren',
    },
    enterOtherAccount: {
      en: 'Sign in with other account',
      pt: 'Entrar com outra conta',
      es: 'Iniciar con otra cuenta',
      de: 'Mit anderem Konto anmelden',
    },
    usernameOrEmail: {
      en: 'Username or Email',
      pt: 'Username ou Email',
      es: 'Usuario o Email',
      de: 'Benutzername oder E-Mail',
    },
    usernamePlaceholder: {
      en: 'your username',
      pt: 'seu username',
      es: 'tu usuario',
      de: 'dein Benutzername',
    },
    usernameOrEmailPlaceholder: {
      en: 'username or email@example.com',
      pt: 'username ou email@exemplo.com',
      es: 'usuario o email@ejemplo.com',
      de: 'Benutzername oder email@beispiel.de',
    },
    minChars: {
      en: 'Minimum 6 characters',
      pt: 'Mínimo 6 caracteres',
      es: 'Mínimo 6 caracteres',
      de: 'Mindestens 6 Zeichen',
    },
    atLeastLetter: {
      en: 'At least one letter',
      pt: 'Pelo menos uma letra',
      es: 'Al menos una letra',
      de: 'Mindestens ein Buchstabe',
    },
    atLeastNumber: {
      en: 'At least one number',
      pt: 'Pelo menos um número',
      es: 'Al menos un número',
      de: 'Mindestens eine Zahl',
    },
    loggingIn: {
      en: 'Logging in...',
      pt: 'Entrando...',
      es: 'Iniciando sesión...',
      de: 'Anmeldung...',
    },
    creating: {
      en: 'Creating...',
      pt: 'Criando...',
      es: 'Creando...',
      de: 'Erstellen...',
    },
    createAccountBtn: {
      en: 'Create Account',
      pt: 'Criar Conta',
      es: 'Crear Cuenta',
      de: 'Konto erstellen',
    },
    noAccountSignUp: {
      en: "Don't have an account?",
      pt: 'Não tem uma conta?',
      es: '¿No tienes una cuenta?',
      de: 'Kein Konto?',
    },
    signUpLink: {
      en: 'Sign Up',
      pt: 'Cadastre-se',
      es: 'Regístrate',
      de: 'Registrieren',
    },
    cloudSynced: {
      en: 'Cloud-synced · Secure',
      pt: 'Sincronizado na nuvem · Seguro',
      es: 'Sincronizado en la nube · Seguro',
      de: 'Cloud-synchronisiert · Sicher',
    },
    or: {
      en: 'or',
      pt: 'ou',
      es: 'o',
      de: 'oder',
    },
    signingInGoogle: {
      en: 'Signing in with Google...',
      pt: 'Entrando com Google...',
      es: 'Iniciando con Google...',
      de: 'Anmeldung mit Google...',
    },
    signInGoogle: {
      en: 'Sign in with Google',
      pt: 'Entrar com Google',
      es: 'Iniciar con Google',
      de: 'Mit Google anmelden',
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ONBOARDING
  // ═══════════════════════════════════════════════════════════════════════════
  onboarding: {
    skip: {
      en: 'Skip',
      pt: 'Pular',
      es: 'Omitir',
      de: 'Überspringen',
    },
    continue: {
      en: 'Continue',
      pt: 'Continuar',
      es: 'Continuar',
      de: 'Weiter',
    },
    start: {
      en: "Let's start!",
      pt: 'Começar!',
      es: '¡Empezar!',
      de: 'Los gehts!',
    },
    addHabit: {
      en: 'Add habit',
      pt: 'Adicionar hábito',
      es: 'Agregar hábito',
      de: 'Gewohnheit hinzufügen',
    },
    addEvent: {
      en: 'Add event',
      pt: 'Adicionar evento',
      es: 'Agregar evento',
      de: 'Event hinzufügen',
    },
    daysStreak: {
      en: 'days streak',
      pt: 'dias de streak',
      es: 'días de racha',
      de: 'Tage Serie',
    },
    completionRate: {
      en: 'Completion Rate',
      pt: 'Taxa de Conclusão',
      es: 'Tasa de Completado',
      de: 'Abschlussrate',
    },
    average: {
      en: 'Average',
      pt: 'Média',
      es: 'Promedio',
      de: 'Durchschnitt',
    },
    perfectDays: {
      en: 'Perfect Days',
      pt: 'Dias Perfeitos',
      es: 'Días Perfectos',
      de: 'Perfekte Tage',
    },
    medals: {
      en: 'medals',
      pt: 'medalhas',
      es: 'medallas',
      de: 'Medaillen',
    },
    tapTars: {
      en: 'Tap TARS on the bottom bar',
      pt: 'Toque no TARS na barra inferior',
      es: 'Toca TARS en la barra inferior',
      de: 'Tippe auf TARS in der unteren Leiste',
    },
    howToImprove: {
      en: 'How to improve my routine?',
      pt: 'Como melhorar minha rotina?',
      es: '¿Cómo mejorar mi rutina?',
      de: 'Wie kann ich meine Routine verbessern?',
    },
    tarsResponse: {
      en: 'Start with 3 simple habits and increase gradually...',
      pt: 'Comece com 3 hábitos simples e aumente gradualmente...',
      es: 'Empieza con 3 hábitos simples y aumenta gradualmente...',
      de: 'Beginne mit 3 einfachen Gewohnheiten und steigere dich nach und nach...',
    },
    customizeTip: {
      en: 'Customize: change colors and theme',
      pt: 'Customize: mude cores e tema',
      es: 'Personaliza: cambia colores y tema',
      de: 'Anpassen: Ändere Farben und Thema',
    },
    friendsTip: {
      en: 'Friends: add friends',
      pt: 'Friends: adicione amigos',
      es: 'Amigos: agrega amigos',
      de: 'Freunde: Füge Freunde hinzu',
    },
    installTip: {
      en: 'Install on home screen',
      pt: 'Instale na tela inicial',
      es: 'Instala en pantalla de inicio',
      de: 'Auf dem Startbildschirm installieren',
    },
    inSafari: {
      en: 'In Safari:',
      pt: 'No Safari:',
      es: 'En Safari:',
      de: 'In Safari:',
    },
    afterTutorial: {
      en: 'After the tutorial, you will see a button to install',
      pt: 'Após o tutorial, você verá um botão para instalar',
      es: 'Después del tutorial, verás un botón para instalar',
      de: 'Nach dem Tutorial siehst du einen Button zum Installieren',
    },
    justTapYes: {
      en: 'Just tap "Yes" and you\'re done!',
      pt: 'Basta tocar em "Sim" e pronto!',
      es: '¡Solo toca "Sí" y listo!',
      de: 'Tippe einfach auf "Ja" und fertig!',
    },
    offline: {
      en: 'Offline',
      pt: 'Offline',
      es: 'Sin conexión',
      de: 'Offline',
    },
    fast: {
      en: 'Fast',
      pt: 'Rápido',
      es: 'Rápido',
      de: 'Schnell',
    },
    notifications: {
      en: 'Notifications',
      pt: 'Notificações',
      es: 'Notificaciones',
      de: 'Benachrichtigungen',
    },
    slides: {
      welcome: {
        tag: { en: 'Welcome', pt: 'Bem-vindo', es: 'Bienvenido', de: 'Willkommen' },
        title: { en: 'Your journey starts here', pt: 'Sua jornada começa aqui', es: 'Tu viaje comienza aquí', de: 'Deine Reise beginnt hier' },
        desc: { en: 'RoutineTracker helps you build and maintain habits, track your progress, and achieve your goals.', pt: 'O RoutineTracker ajuda você a criar e manter hábitos, acompanhar seu progresso e atingir seus objetivos.', es: 'RoutineTracker te ayuda a crear y mantener hábitos, seguir tu progreso y alcanzar tus metas.', de: 'RoutineTracker hilft dir Gewohnheiten aufzubauen, deinen Fortschritt zu verfolgen und deine Ziele zu erreichen.' },
      },
      addHabit: {
        tag: { en: 'Step 1', pt: 'Passo 1', es: 'Paso 1', de: 'Schritt 1' },
        title: { en: 'Create your habits', pt: 'Crie seus hábitos', es: 'Crea tus hábitos', de: 'Erstelle deine Gewohnheiten' },
        desc: { en: 'Tap + to add a habit. Set emoji, name, category and frequency (daily, specific days, etc).', pt: 'Toque no + para adicionar um hábito. Defina emoji, nome, categoria e frequência (diário, dias específicos, etc).', es: 'Toca + para agregar un hábito. Define emoji, nombre, categoría y frecuencia (diario, días específicos, etc).', de: 'Tippe auf + um eine Gewohnheit hinzuzufügen. Lege Emoji, Name, Kategorie und Frequenz fest.' },
      },
      complete: {
        tag: { en: 'Step 2', pt: 'Passo 2', es: 'Paso 2', de: 'Schritt 2' },
        title: { en: 'Complete and earn XP', pt: 'Marque e ganhe XP', es: 'Completa y gana XP', de: 'Abschließen und XP verdienen' },
        desc: { en: 'Complete habits to earn XP and level up. Maintain streaks for extra bonuses!', pt: 'Complete hábitos para ganhar XP e subir de nível. Mantenha streaks para bônus extras!', es: '¡Completa hábitos para ganar XP y subir de nivel. Mantén rachas para bonos extras!', de: 'Schließe Gewohnheiten ab um XP zu verdienen und aufzusteigen. Halte Serien für Extra-Boni!' },
      },
      tars: {
        tag: { en: 'TARS', pt: 'TARS', es: 'TARS', de: 'TARS' },
        title: { en: 'Your personal assistant', pt: 'Seu assistente pessoal', es: 'Tu asistente personal', de: 'Dein persönlicher Assistent' },
        desc: { en: 'TARS can create habits, plan trips and answer questions. Speak or type!', pt: 'O TARS pode criar hábitos, planejar viagens e responder perguntas. Fale por voz ou digite!', es: 'TARS puede crear hábitos, planificar viajes y responder preguntas. ¡Habla o escribe!', de: 'TARS kann Gewohnheiten erstellen, Reisen planen und Fragen beantworten. Sprich oder tippe!' },
      },
      events: {
        tag: { en: 'Events', pt: 'Eventos', es: 'Eventos', de: 'Events' },
        title: { en: 'Plan trips and goals', pt: 'Planeje viagens e metas', es: 'Planifica viajes y metas', de: 'Plane Reisen und Ziele' },
        desc: { en: 'Add future events like trips, appointments or goals. TARS helps build itineraries!', pt: 'Adicione eventos futuros como viagens, compromissos ou metas. O TARS ajuda a montar roteiros!', es: '¡Agrega eventos futuros como viajes, citas o metas. TARS ayuda a crear itinerarios!', de: 'Füge zukünftige Events wie Reisen, Termine oder Ziele hinzu. TARS hilft beim Erstellen von Reiseplänen!' },
      },
      install: {
        tag: { en: 'Install', pt: 'Instalar', es: 'Instalar', de: 'Installieren' },
        title: { en: 'Add to home screen', pt: 'Adicione à tela inicial', es: 'Añadir a pantalla de inicio', de: 'Zum Startbildschirm hinzufügen' },
        desc: { en: 'Install the app for quick access. Works offline and feels like a native app!', pt: 'Instale o app para acesso rápido. Funciona offline e parece um app nativo!', es: '¡Instala la app para acceso rápido. Funciona sin conexión y parece una app nativa!', de: 'Installiere die App für schnellen Zugriff. Funktioniert offline und fühlt sich wie eine native App an!' },
      },
      ready: {
        tag: { en: 'Ready!', pt: 'Pronto!', es: '¡Listo!', de: 'Fertig!' },
        title: { en: "Let's get started?", pt: 'Vamos começar?', es: '¿Empezamos?', de: 'Los gehts?' },
        desc: { en: 'Create your first habit and start your journey. Consistency is key!', pt: 'Crie seu primeiro hábito e comece sua jornada. Consistência é a chave!', es: '¡Crea tu primer hábito y comienza tu viaje. La consistencia es la clave!', de: 'Erstelle deine erste Gewohnheit und starte deine Reise. Beständigkeit ist der Schlüssel!' },
      },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION
  // ═══════════════════════════════════════════════════════════════════════════
  nav: {
    today: { en: 'Today', pt: 'Hoje', es: 'Hoy', de: 'Heute' },
    habits: { en: 'Habits', pt: 'Hábitos', es: 'Hábitos', de: 'Gewohnheiten' },
    stats: { en: 'Stats', pt: 'Estatísticas', es: 'Estadísticas', de: 'Statistiken' },
    journal: { en: 'Journal', pt: 'Diário', es: 'Diario', de: 'Tagebuch' },
    medals: { en: 'Medals', pt: 'Medalhas', es: 'Medallas', de: 'Medaillen' },
    events: { en: 'Events', pt: 'Eventos', es: 'Eventos', de: 'Events' },
    friends: { en: 'Friends', pt: 'Amigos', es: 'Amigos', de: 'Freunde' },
    customize: { en: 'Customize', pt: 'Personalizar', es: 'Personalizar', de: 'Anpassen' },
    profile: { en: 'Profile', pt: 'Perfil', es: 'Perfil', de: 'Profil' },
    more: { en: 'More', pt: 'Mais', es: 'Más', de: 'Mehr' },
    signOut: { en: 'Sign Out', pt: 'Sair', es: 'Cerrar sesión', de: 'Abmelden' },
    backup: { en: 'Backup & Restore', pt: 'Backup & Restaurar', es: 'Copia de seguridad', de: 'Backup & Wiederherstellen' },
    installApp: { en: 'Install App', pt: 'Instalar App', es: 'Instalar App', de: 'App installieren' },
    main: { en: 'Main', pt: 'Principal', es: 'Principal', de: 'Hauptmenü' },
    levelUpLife: { en: 'Level up your life', pt: 'Evolua sua vida', es: 'Sube de nivel tu vida', de: 'Level up dein Leben' },
    addToHome: { en: 'Add to home screen', pt: 'Adicionar à tela inicial', es: 'Añadir a pantalla de inicio', de: 'Zum Startbildschirm hinzufügen' },
    tutorial: { en: 'Tutorial', pt: 'Ver Tutorial', es: 'Ver Tutorial', de: 'Tutorial ansehen' },
    tutorialDesc: { en: 'How to use the app', pt: 'Como usar o app', es: 'Cómo usar la app', de: 'So benutzt du die App' },
    iosInstallAlert: { en: 'To install on iPhone/iPad:\n\n1. Tap the Share icon (↑)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add"', pt: 'Para instalar no iPhone/iPad:\n\n1. Toque no ícone de compartilhar (↑)\n2. Role para baixo e toque em "Adicionar à Tela de Início"\n3. Toque em "Adicionar"', es: 'Para instalar en iPhone/iPad:\n\n1. Toca el icono Compartir (↑)\n2. Desplázate y toca "Añadir a pantalla de inicio"\n3. Toca "Añadir"', de: 'Zum Installieren auf iPhone/iPad:\n\n1. Tippe auf das Teilen-Symbol (↑)\n2. Scrolle nach unten und tippe auf "Zum Home-Bildschirm"\n3. Tippe auf "Hinzufügen"' },
    browserInstallAlert: { en: 'To install:\n\n1. Open the browser menu (⋮)\n2. Tap "Install app" or "Add to home screen"', pt: 'Para instalar:\n\n1. Abra o menu do navegador (⋮)\n2. Toque em "Instalar app" ou "Adicionar à tela inicial"', es: 'Para instalar:\n\n1. Abre el menú del navegador (⋮)\n2. Toca "Instalar app" o "Añadir a pantalla de inicio"', de: 'Zum Installieren:\n\n1. Öffne das Browsermenü (⋮)\n2. Tippe auf "App installieren" oder "Zum Startbildschirm hinzufügen"' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════════════════════
  dashboard: {
    goodMorning: { en: 'Good morning', pt: 'Bom dia', es: 'Buenos días', de: 'Guten Morgen' },
    goodAfternoon: { en: 'Good afternoon', pt: 'Boa tarde', es: 'Buenas tardes', de: 'Guten Tag' },
    goodEvening: { en: 'Good evening', pt: 'Boa noite', es: 'Buenas noches', de: 'Guten Abend' },
    todayProgress: { en: "Today's Progress", pt: 'Progresso de Hoje', es: 'Progreso de Hoy', de: 'Heutiger Fortschritt' },
    completed: { en: 'completed', pt: 'concluído', es: 'completado', de: 'abgeschlossen' },
    streak: { en: 'Streak', pt: 'Sequência', es: 'Racha', de: 'Serie' },
    days: { en: 'days', pt: 'dias', es: 'días', de: 'Tage' },
    level: { en: 'Level', pt: 'Nível', es: 'Nivel', de: 'Level' },
    noHabits: { en: 'No habits yet', pt: 'Nenhum hábito ainda', es: 'Sin hábitos aún', de: 'Noch keine Gewohnheiten' },
    createFirst: { en: 'Create your first habit', pt: 'Crie seu primeiro hábito', es: 'Crea tu primer hábito', de: 'Erstelle deine erste Gewohnheit' },
    allDone: { en: 'All done for today!', pt: 'Tudo feito por hoje!', es: '¡Todo hecho por hoy!', de: 'Alles erledigt für heute!' },
    crushedAll: { en: "You've crushed all your habits today — legendary!", pt: 'Você mandou bem em todos os hábitos hoje — lendário!', es: '¡Has completado todos tus hábitos hoy — legendario!', de: 'Du hast heute alle Gewohnheiten geschafft — legendär!' },
    addFirstPrompt: { en: 'Add your first habit to start your journey!', pt: 'Adicione seu primeiro hábito para começar sua jornada!', es: '¡Agrega tu primer hábito para comenzar tu viaje!', de: 'Füge deine erste Gewohnheit hinzu, um deine Reise zu beginnen!' },
    habitsDone: { en: 'habits done. Keep going!', pt: 'hábitos feitos. Continue assim!', es: 'hábitos hechos. ¡Sigue así!', de: 'Gewohnheiten erledigt. Weiter so!' },
    of: { en: 'of', pt: 'de', es: 'de', de: 'von' },
    upcoming: { en: 'Upcoming', pt: 'Próximos', es: 'Próximos', de: 'Kommende' },
    allEvents: { en: 'All', pt: 'Todos', es: 'Todos', de: 'Alle' },
    todayExcl: { en: 'Today!', pt: 'Hoje!', es: '¡Hoy!', de: 'Heute!' },
    tomorrow: { en: 'Tomorrow', pt: 'Amanhã', es: 'Mañana', de: 'Morgen' },
    daysAway: { en: 'd away', pt: 'd restante', es: 'd restante', de: 'T übrig' },
    focusHabit: { en: 'Focus Habit', pt: 'Hábito em Foco', es: 'Hábito Enfocado', de: 'Fokus-Gewohnheit' },
    pickFocus: { en: 'Pick one habit to focus on today for 2x XP:', pt: 'Escolha um hábito para focar hoje e ganhar 2x XP:', es: 'Elige un hábito para enfocarte hoy por 2x XP:', de: 'Wähle eine Gewohnheit für 2x XP heute:' },
    doneBonus: { en: 'Done — 2x XP earned!', pt: 'Feito — 2x XP ganho!', es: '¡Hecho — 2x XP ganado!', de: 'Erledigt — 2x XP verdient!' },
    completeFirst: { en: 'Complete this first for bonus XP', pt: 'Complete este primeiro para XP bônus', es: 'Completa este primero para XP bonus', de: 'Schließe das zuerst ab für Bonus-XP' },
    allDoneGreat: { en: 'All done — great work!', pt: 'Tudo feito — ótimo trabalho!', es: '¡Todo hecho — gran trabajo!', de: 'Alles erledigt — tolle Arbeit!' },
    howFeeling: { en: 'How are you feeling?', pt: 'Como você está se sentindo?', es: '¿Cómo te sientes?', de: 'Wie fühlst du dich?' },
    logMood: { en: 'Log your mood for today', pt: 'Registre seu humor de hoje', es: 'Registra tu humor de hoy', de: 'Erfasse deine Stimmung für heute' },
    todayMoodPrefix: { en: 'Today:', pt: 'Hoje:', es: 'Hoy:', de: 'Heute:' },
    last14Days: { en: 'Last 14 days', pt: 'Últimos 14 dias', es: 'Últimos 14 días', de: 'Letzte 14 Tage' },
    complete: { en: 'complete', pt: 'completo', es: 'completo', de: 'abgeschlossen' },
    completedCount: { en: 'completed', pt: 'completos', es: 'completados', de: 'abgeschlossen' },
    remaining: { en: 'remaining', pt: 'restantes', es: 'restantes', de: 'übrig' },
    xpLevel: { en: 'XP & Level', pt: 'XP & Nível', es: 'XP & Nivel', de: 'XP & Level' },
    bestStreak: { en: 'Best streak', pt: 'Melhor sequência', es: 'Mejor racha', de: 'Beste Serie' },
    sevenDayRate: { en: '7-day rate', pt: 'Taxa 7 dias', es: 'Tasa 7 días', de: '7-Tage-Rate' },
    activeStreaks: { en: 'Active Streaks', pt: 'Sequências Ativas', es: 'Rachas Activas', de: 'Aktive Serien' },
    dayStreak: { en: 'day streak', pt: 'dias de streak', es: 'días de racha', de: 'Tage Serie' },
    healthMetrics: { en: 'Health Metrics', pt: 'Métricas de Saúde', es: 'Métricas de Salud', de: 'Gesundheitsmetriken' },
    dailyGoal: { en: 'Daily goal completion rate', pt: 'Taxa de conclusão dos objetivos diários', es: 'Tasa de completado de metas diarias', de: 'Tägliche Zielerreichungsrate' },
    avg: { en: 'Avg', pt: 'Média', es: 'Prom.', de: 'Durchschn.' },
    peak: { en: 'Peak', pt: 'Pico', es: 'Pico', de: 'Spitze' },
    perfect: { en: 'Perfect', pt: 'Perfeito', es: 'Perfecto', de: 'Perfekt' },
    healthMedals: { en: 'Health Medals', pt: 'Medalhas de Saúde', es: 'Medallas de Salud', de: 'Gesundheits-Medaillen' },
    pickDate: { en: 'Pick a Date', pt: 'Escolha uma Data', es: 'Elige una Fecha', de: 'Wähle ein Datum' },
    pickDateDesc: { en: 'Select any past date to view or log habits', pt: 'Selecione qualquer data passada para ver ou registrar hábitos', es: 'Selecciona cualquier fecha pasada para ver o registrar hábitos', de: 'Wähle ein vergangenes Datum um Gewohnheiten anzusehen oder zu erfassen' },
    todaysHabits: { en: "Today's Habits", pt: 'Hábitos de Hoje', es: 'Hábitos de Hoy', de: 'Heutige Gewohnheiten' },
    habitsLabel: { en: 'Habits', pt: 'Hábitos', es: 'Hábitos', de: 'Gewohnheiten' },
    noHabitsYet: { en: 'No habits yet!', pt: 'Nenhum hábito ainda!', es: '¡Sin hábitos aún!', de: 'Noch keine Gewohnheiten!' },
    noHabitsScheduled: { en: 'No habits scheduled this day', pt: 'Nenhum hábito agendado neste dia', es: 'Sin hábitos programados este día', de: 'Keine Gewohnheiten für diesen Tag geplant' },
    addFirstHabitDesc: { en: 'Add your first habit to start building better routines!', pt: 'Adicione seu primeiro hábito para começar a construir rotinas melhores!', es: '¡Agrega tu primer hábito para empezar a construir mejores rutinas!', de: 'Füge deine erste Gewohnheit hinzu, um bessere Routinen aufzubauen!' },
    restUp: { en: 'All your habits are scheduled for other days. Rest up!', pt: 'Todos os seus hábitos estão agendados para outros dias. Descanse!', es: 'Todos tus hábitos están programados para otros días. ¡Descansa!', de: 'Alle Gewohnheiten sind für andere Tage geplant. Ruh dich aus!' },
    addFirstBtn: { en: 'Add First Habit', pt: 'Adicionar Primeiro Hábito', es: 'Agregar Primer Hábito', de: 'Erste Gewohnheit hinzufügen' },
    perfectDay: { en: 'Perfect Day!', pt: 'Dia Perfeito!', es: '¡Día Perfecto!', de: 'Perfekter Tag!' },
    allDoneCrushed: { en: 'All done!', pt: 'Tudo feito!', es: '¡Todo hecho!', de: 'Alles erledigt!' },
    crushedHabits: { en: 'You crushed all', pt: 'Você completou todos os', es: 'Completaste todos los', de: 'Du hast alle' },
    habitsWord: { en: 'habits!', pt: 'hábitos!', es: '¡hábitos!', de: 'Gewohnheiten geschafft!' },
    bonusXP: { en: '+25 bonus XP awarded · Keep the streak alive!', pt: '+25 XP bônus concedido · Mantenha a sequência!', es: '+25 XP bonus otorgado · ¡Mantén la racha!', de: '+25 Bonus-XP vergeben · Halte die Serie aufrecht!' },
    onThisDay: { en: 'On This Day', pt: 'Neste Dia', es: 'En Este Día', de: 'An Diesem Tag' },
    weekAgo: { en: '1 week ago', pt: '1 semana atrás', es: 'hace 1 semana', de: 'vor 1 Woche' },
    youCompleted: { en: 'You completed', pt: 'Você completou', es: 'Completaste', de: 'Du hast abgeschlossen' },
    habitsLower: { en: 'habits', pt: 'hábitos', es: 'hábitos', de: 'Gewohnheiten' },
    aPerfectDay: { en: '— a perfect day!', pt: '— um dia perfeito!', es: '— ¡un día perfecto!', de: '— ein perfekter Tag!' },
    solidEffort: { en: '— solid effort!', pt: '— ótimo esforço!', es: '— ¡gran esfuerzo!', de: '— tolle Leistung!' },
    restDay: { en: 'rest day', pt: 'dia de descanso', es: 'día de descanso', de: 'Ruhetag' },
    done: { en: 'Done', pt: 'Feito', es: 'Hecho', de: 'Erledigt' },
    add: { en: 'Add', pt: 'Adicionar', es: 'Agregar', de: 'Hinzufügen' },
    clear: { en: 'clear', pt: 'limpar', es: 'limpiar', de: 'löschen' },
    today: { en: 'Today', pt: 'Hoje', es: 'Hoy', de: 'Heute' },
    moodLogged: { en: 'Mood logged!', pt: 'Humor registrado!', es: '¡Humor registrado!', de: 'Stimmung erfasst!' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HABITS
  // ═══════════════════════════════════════════════════════════════════════════
  habits: {
    newHabit: { en: 'New Habit', pt: 'Novo Hábito', es: 'Nuevo Hábito', de: 'Neue Gewohnheit' },
    editHabit: { en: 'Edit Habit', pt: 'Editar Hábito', es: 'Editar Hábito', de: 'Gewohnheit bearbeiten' },
    habitName: { en: 'Habit name', pt: 'Nome do hábito', es: 'Nombre del hábito', de: 'Name der Gewohnheit' },
    category: { en: 'Category', pt: 'Categoria', es: 'Categoría', de: 'Kategorie' },
    frequency: { en: 'Frequency', pt: 'Frequência', es: 'Frecuencia', de: 'Frequenz' },
    daily: { en: 'Daily', pt: 'Diário', es: 'Diario', de: 'Täglich' },
    weekly: { en: 'Weekly', pt: 'Semanal', es: 'Semanal', de: 'Wöchentlich' },
    specificDays: { en: 'Specific days', pt: 'Dias específicos', es: 'Días específicos', de: 'Bestimmte Tage' },
    reminder: { en: 'Reminder', pt: 'Lembrete', es: 'Recordatorio', de: 'Erinnerung' },
    save: { en: 'Save', pt: 'Salvar', es: 'Guardar', de: 'Speichern' },
    cancel: { en: 'Cancel', pt: 'Cancelar', es: 'Cancelar', de: 'Abbrechen' },
    delete: { en: 'Delete', pt: 'Excluir', es: 'Eliminar', de: 'Löschen' },
    confirmDelete: { en: 'Are you sure you want to delete this habit?', pt: 'Tem certeza que deseja excluir este hábito?', es: '¿Estás seguro de que quieres eliminar este hábito?', de: 'Bist du sicher, dass du diese Gewohnheit löschen möchtest?' },
    categories: {
      health: { en: 'Health', pt: 'Saúde', es: 'Salud', de: 'Gesundheit' },
      fitness: { en: 'Fitness', pt: 'Fitness', es: 'Fitness', de: 'Fitness' },
      work: { en: 'Work', pt: 'Trabalho', es: 'Trabajo', de: 'Arbeit' },
      learning: { en: 'Learning', pt: 'Aprendizado', es: 'Aprendizaje', de: 'Lernen' },
      mindfulness: { en: 'Mindfulness', pt: 'Mindfulness', es: 'Mindfulness', de: 'Achtsamkeit' },
      social: { en: 'Social', pt: 'Social', es: 'Social', de: 'Soziales' },
      finance: { en: 'Finance', pt: 'Finanças', es: 'Finanzas', de: 'Finanzen' },
      other: { en: 'Other', pt: 'Outro', es: 'Otro', de: 'Andere' },
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // COMMON
  // ═══════════════════════════════════════════════════════════════════════════
  common: {
    loading: { en: 'Loading...', pt: 'Carregando...', es: 'Cargando...', de: 'Laden...' },
    error: { en: 'Error', pt: 'Erro', es: 'Error', de: 'Fehler' },
    success: { en: 'Success', pt: 'Sucesso', es: 'Éxito', de: 'Erfolg' },
    save: { en: 'Save', pt: 'Salvar', es: 'Guardar', de: 'Speichern' },
    saved: { en: 'Saved', pt: 'Salvo', es: 'Guardado', de: 'Gespeichert' },
    cancel: { en: 'Cancel', pt: 'Cancelar', es: 'Cancelar', de: 'Abbrechen' },
    delete: { en: 'Delete', pt: 'Excluir', es: 'Eliminar', de: 'Löschen' },
    edit: { en: 'Edit', pt: 'Editar', es: 'Editar', de: 'Bearbeiten' },
    add: { en: 'Add', pt: 'Adicionar', es: 'Agregar', de: 'Hinzufügen' },
    search: { en: 'Search', pt: 'Buscar', es: 'Buscar', de: 'Suchen' },
    filter: { en: 'Filter', pt: 'Filtrar', es: 'Filtrar', de: 'Filtern' },
    all: { en: 'All', pt: 'Todos', es: 'Todos', de: 'Alle' },
    none: { en: 'None', pt: 'Nenhum', es: 'Ninguno', de: 'Keine' },
    yes: { en: 'Yes', pt: 'Sim', es: 'Sí', de: 'Ja' },
    no: { en: 'No', pt: 'Não', es: 'No', de: 'Nein' },
    ok: { en: 'OK', pt: 'OK', es: 'OK', de: 'OK' },
    close: { en: 'Close', pt: 'Fechar', es: 'Cerrar', de: 'Schließen' },
    back: { en: 'Back', pt: 'Voltar', es: 'Volver', de: 'Zurück' },
    next: { en: 'Next', pt: 'Próximo', es: 'Siguiente', de: 'Weiter' },
    today: { en: 'Today', pt: 'Hoje', es: 'Hoy', de: 'Heute' },
    yesterday: { en: 'Yesterday', pt: 'Ontem', es: 'Ayer', de: 'Gestern' },
    tomorrow: { en: 'Tomorrow', pt: 'Amanhã', es: 'Mañana', de: 'Morgen' },
    apply: { en: 'Apply', pt: 'Aplicar', es: 'Aplicar', de: 'Anwenden' },
    signOut: { en: 'Sign Out', pt: 'Sair', es: 'Cerrar sesión', de: 'Abmelden' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PWA INSTALL
  // ═══════════════════════════════════════════════════════════════════════════
  pwa: {
    addToHome: { en: 'Add to Home Screen?', pt: 'Adicionar à Tela Inicial?', es: '¿Añadir a pantalla de inicio?', de: 'Zum Startbildschirm hinzufügen?' },
    quickAccess: { en: 'Quick access like a native app', pt: 'Acesso rápido como um app nativo', es: 'Acceso rápido como una app nativa', de: 'Schneller Zugriff wie eine native App' },
    notNow: { en: 'Not now', pt: 'Agora não', es: 'Ahora no', de: 'Nicht jetzt' },
    install: { en: 'Yes, install', pt: 'Sim, instalar', es: 'Sí, instalar', de: 'Ja, installieren' },
    gotIt: { en: 'Got it!', pt: 'Entendi!', es: '¡Entendido!', de: 'Verstanden!' },
    iosStep1: { en: 'Tap Share', pt: 'Toque em Compartilhar', es: 'Toca Compartir', de: 'Tippe auf Teilen' },
    iosStep2: { en: '"Add to Home Screen"', pt: '"Adicionar à Tela de Início"', es: '"Añadir a pantalla de inicio"', de: '"Zum Home-Bildschirm"' },
    iosStep3: { en: 'Tap Add', pt: 'Toque em Adicionar', es: 'Toca Añadir', de: 'Tippe auf Hinzufügen' },
    inSafari: { en: 'In Safari:', pt: 'No Safari:', es: 'En Safari:', de: 'In Safari:' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════════════════════════════════
  stats: {
    title: { en: 'Statistics', pt: 'Estatísticas', es: 'Estadísticas', de: 'Statistiken' },
    thisWeek: { en: 'This Week', pt: 'Esta Semana', es: 'Esta Semana', de: 'Diese Woche' },
    thisMonth: { en: 'This Month', pt: 'Este Mês', es: 'Este Mes', de: 'Dieser Monat' },
    allTime: { en: 'All Time', pt: 'Todo o Período', es: 'Todo el Tiempo', de: 'Gesamtzeit' },
    completionRate: { en: 'Completion Rate', pt: 'Taxa de Conclusão', es: 'Tasa de Completado', de: 'Abschlussrate' },
    totalCompleted: { en: 'Total Completed', pt: 'Total Concluído', es: 'Total Completado', de: 'Gesamt Abgeschlossen' },
    currentStreak: { en: 'Current Streak', pt: 'Sequência Atual', es: 'Racha Actual', de: 'Aktuelle Serie' },
    bestStreak: { en: 'Best Streak', pt: 'Melhor Sequência', es: 'Mejor Racha', de: 'Beste Serie' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // EVENTS
  // ═══════════════════════════════════════════════════════════════════════════
  events: {
    title: { en: 'Events', pt: 'Eventos', es: 'Eventos', de: 'Events' },
    newEvent: { en: 'New Event', pt: 'Novo Evento', es: 'Nuevo Evento', de: 'Neues Event' },
    editEvent: { en: 'Edit Event', pt: 'Editar Evento', es: 'Editar Evento', de: 'Event bearbeiten' },
    eventName: { en: 'Event name', pt: 'Nome do evento', es: 'Nombre del evento', de: 'Name des Events' },
    location: { en: 'Location', pt: 'Local', es: 'Ubicación', de: 'Ort' },
    startDate: { en: 'Start date', pt: 'Data de início', es: 'Fecha de inicio', de: 'Startdatum' },
    endDate: { en: 'End date', pt: 'Data de término', es: 'Fecha de fin', de: 'Enddatum' },
    upcoming: { en: 'Upcoming', pt: 'Próximos', es: 'Próximos', de: 'Kommende' },
    past: { en: 'Past', pt: 'Passados', es: 'Pasados', de: 'Vergangene' },
    noEvents: { en: 'No events yet', pt: 'Nenhum evento ainda', es: 'Sin eventos aún', de: 'Noch keine Events' },
    daysUntil: { en: 'days until', pt: 'dias para', es: 'días hasta', de: 'Tage bis' },
    daysAgo: { en: 'days ago', pt: 'dias atrás', es: 'días atrás', de: 'Tage her' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ACHIEVEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  achievements: {
    title: { en: 'Achievements', pt: 'Conquistas', es: 'Logros', de: 'Erfolge' },
    unlocked: { en: 'Unlocked', pt: 'Desbloqueado', es: 'Desbloqueado', de: 'Freigeschaltet' },
    locked: { en: 'Locked', pt: 'Bloqueado', es: 'Bloqueado', de: 'Gesperrt' },
    progress: { en: 'Progress', pt: 'Progresso', es: 'Progreso', de: 'Fortschritt' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════════════════════════════════════════
  profile: {
    title: { en: 'Account', pt: 'Conta', es: 'Cuenta', de: 'Konto' },
    subtitle: { en: 'Manage your profile and switch users', pt: 'Gerencie seu perfil e troque de usuário', es: 'Gestiona tu perfil y cambia de usuario', de: 'Verwalte dein Profil und wechsle den Benutzer' },
    editProfile: { en: 'Edit Profile', pt: 'Editar Perfil', es: 'Editar Perfil', de: 'Profil bearbeiten' },
    displayName: { en: 'Display Name', pt: 'Nome de Exibição', es: 'Nombre para Mostrar', de: 'Anzeigename' },
    memberSince: { en: 'Member since', pt: 'Membro desde', es: 'Miembro desde', de: 'Mitglied seit' },
    totalXP: { en: 'Total XP', pt: 'XP Total', es: 'XP Total', de: 'Gesamt XP' },
    yourName: { en: 'Your name', pt: 'Seu nome', es: 'Tu nombre', de: 'Dein Name' },
    saveName: { en: 'Save', pt: 'Salvar', es: 'Guardar', de: 'Speichern' },
    clickPhoto: { en: 'Click on the photo to change', pt: 'Clique na foto para alterar', es: 'Haz clic en la foto para cambiar', de: 'Klicke auf das Foto zum Ändern' },
    security: { en: 'Security', pt: 'Segurança', es: 'Seguridad', de: 'Sicherheit' },
    changePassword: { en: 'Change password', pt: 'Alterar senha', es: 'Cambiar contraseña', de: 'Passwort ändern' },
    currentPassword: { en: 'Current Password', pt: 'Senha Atual', es: 'Contraseña Actual', de: 'Aktuelles Passwort' },
    newPassword: { en: 'New Password', pt: 'Nova Senha', es: 'Nueva Contraseña', de: 'Neues Passwort' },
    confirmNewPassword: { en: 'Confirm New Password', pt: 'Confirmar Nova Senha', es: 'Confirmar Nueva Contraseña', de: 'Neues Passwort bestätigen' },
    passwordMismatch: { en: 'Passwords do not match', pt: 'As senhas não coincidem', es: 'Las contraseñas no coinciden', de: 'Passwörter stimmen nicht überein' },
    passwordMinChars: { en: 'New password must be at least 6 characters', pt: 'Nova senha deve ter no mínimo 6 caracteres', es: 'La nueva contraseña debe tener al menos 6 caracteres', de: 'Neues Passwort muss mindestens 6 Zeichen haben' },
    passwordChanged: { en: 'Password changed successfully!', pt: 'Senha alterada com sucesso!', es: '¡Contraseña cambiada con éxito!', de: 'Passwort erfolgreich geändert!' },
    nameMinChars: { en: 'Name must be at least 2 characters', pt: 'Nome deve ter pelo menos 2 caracteres', es: 'El nombre debe tener al menos 2 caracteres', de: 'Name muss mindestens 2 Zeichen haben' },
    nameUpdated: { en: 'Name updated!', pt: 'Nome atualizado!', es: '¡Nombre actualizado!', de: 'Name aktualisiert!' },
    photoUpdated: { en: 'Photo updated!', pt: 'Foto atualizada!', es: '¡Foto actualizada!', de: 'Foto aktualisiert!' },
    selectImage: { en: 'Please select an image', pt: 'Por favor, selecione uma imagem', es: 'Por favor, selecciona una imagen', de: 'Bitte wähle ein Bild' },
    imageTooLarge: { en: 'Image too large. Max 2MB', pt: 'Imagem muito grande. Máximo 2MB', es: 'Imagen muy grande. Máximo 2MB', de: 'Bild zu groß. Maximal 2MB' },
    changing: { en: 'Changing...', pt: 'Alterando...', es: 'Cambiando...', de: 'Ändern...' },
    change: { en: 'Change', pt: 'Alterar', es: 'Cambiar', de: 'Ändern' },
    switchAccount: { en: 'Switch Account', pt: 'Trocar Conta', es: 'Cambiar Cuenta', de: 'Konto wechseln' },
    switchDesc: { en: 'Switching takes you back to the login screen', pt: 'Trocar leva você de volta à tela de login', es: 'Cambiar te lleva a la pantalla de inicio de sesión', de: 'Wechseln bringt dich zurück zum Anmeldebildschirm' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SETTINGS / CUSTOMIZE
  // ═══════════════════════════════════════════════════════════════════════════
  settings: {
    title: { en: 'Customize', pt: 'Personalizar', es: 'Personalizar', de: 'Anpassen' },
    subtitle: { en: 'Make RoutineTracker yours', pt: 'Faça o RoutineTracker seu', es: 'Haz RoutineTracker tuyo', de: 'Mach RoutineTracker zu deinem' },
    theme: { en: 'Theme', pt: 'Tema', es: 'Tema', de: 'Thema' },
    dark: { en: 'Dark', pt: 'Escuro', es: 'Oscuro', de: 'Dunkel' },
    light: { en: 'Light', pt: 'Claro', es: 'Claro', de: 'Hell' },
    accentColor: { en: 'Accent Color', pt: 'Cor de Destaque', es: 'Color de Acento', de: 'Akzentfarbe' },
    accentHint: { en: 'Used across charts, buttons, progress bars and indicators.', pt: 'Usado em gráficos, botões, barras de progresso e indicadores.', es: 'Usado en gráficos, botones, barras de progreso e indicadores.', de: 'Verwendet in Diagrammen, Buttons, Fortschrittsbalken und Indikatoren.' },
    language: { en: 'Language', pt: 'Idioma', es: 'Idioma', de: 'Sprache' },
    notifications: { en: 'Notifications', pt: 'Notificações', es: 'Notificaciones', de: 'Benachrichtigungen' },
    sound: { en: 'Sound', pt: 'Som', es: 'Sonido', de: 'Ton' },
    vibration: { en: 'Vibration', pt: 'Vibração', es: 'Vibración', de: 'Vibration' },
    appearance: { en: 'Appearance', pt: 'Aparência', es: 'Apariencia', de: 'Aussehen' },
    branding: { en: 'Branding', pt: 'Identidade', es: 'Identidad', de: 'Branding' },
    appName: { en: 'App Name', pt: 'Nome do App', es: 'Nombre del App', de: 'App-Name' },
    appIcon: { en: 'App Icon', pt: 'Ícone do App', es: 'Ícono del App', de: 'App-Symbol' },
    yourName: { en: 'Your Name', pt: 'Seu Nome', es: 'Tu Nombre', de: 'Dein Name' },
    joined: { en: 'Joined', pt: 'Entrou em', es: 'Se unió', de: 'Beigetreten' },
    data: { en: 'Data', pt: 'Dados', es: 'Datos', de: 'Daten' },
    backupRestore: { en: 'Backup & Restore', pt: 'Backup & Restaurar', es: 'Copia de seguridad y restaurar', de: 'Backup & Wiederherstellen' },
    exportImport: { en: 'Export or import your data as JSON', pt: 'Exporte ou importe seus dados como JSON', es: 'Exporta o importa tus datos como JSON', de: 'Exportiere oder importiere deine Daten als JSON' },
    resetData: { en: 'Reset All Data', pt: 'Resetar Todos os Dados', es: 'Restablecer Todos los Datos', de: 'Alle Daten zurücksetzen' },
    resetConfirm: { en: 'Tap again to confirm — all data will be lost!', pt: 'Toque novamente para confirmar — todos os dados serão perdidos!', es: '¡Toca de nuevo para confirmar — todos los datos se perderán!', de: 'Erneut tippen zum Bestätigen — alle Daten gehen verloren!' },
    clearData: { en: 'Clear habits, completions, XP and achievements', pt: 'Limpar hábitos, conclusões, XP e conquistas', es: 'Borrar hábitos, completados, XP y logros', de: 'Gewohnheiten, Abschlüsse, XP und Erfolge löschen' },
    categories: { en: 'Categories', pt: 'Categorias', es: 'Categorías', de: 'Kategorien' },
    categoryName: { en: 'Category name...', pt: 'Nome da categoria...', es: 'Nombre de categoría...', de: 'Kategoriename...' },
    account: { en: 'Account', pt: 'Conta', es: 'Cuenta', de: 'Konto' },
    customHex: { en: 'Custom hex e.g. #ff6b35', pt: 'Hex personalizado ex: #ff6b35', es: 'Hex personalizado ej: #ff6b35', de: 'Benutzerdefinierter Hex z.B. #ff6b35' },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN
  // ═══════════════════════════════════════════════════════════════════════════
  admin: {
    title: { en: 'Admin Panel', pt: 'Painel Admin', es: 'Panel Admin', de: 'Admin Panel' },
    overview: { en: 'Overview', pt: 'Visão Geral', es: 'Visión General', de: 'Übersicht' },
    users: { en: 'Users', pt: 'Usuários', es: 'Usuarios', de: 'Benutzer' },
    security: { en: 'Security', pt: 'Segurança', es: 'Seguridad', de: 'Sicherheit' },
    totalUsers: { en: 'Total Users', pt: 'Total Usuários', es: 'Total Usuarios', de: 'Gesamt Benutzer' },
    activeUsers: { en: 'Active Users', pt: 'Usuários Ativos', es: 'Usuarios Activos', de: 'Aktive Benutzer' },
    totalHabits: { en: 'Total Habits', pt: 'Total Hábitos', es: 'Total Hábitos', de: 'Gesamt Gewohnheiten' },
    blocked: { en: 'Blocked', pt: 'Bloqueados', es: 'Bloqueados', de: 'Blockiert' },
    userGrowth: { en: 'User Growth', pt: 'Crescimento de Usuários', es: 'Crecimiento de Usuarios', de: 'Benutzerwachstum' },
    peakHours: { en: 'Peak Hours', pt: 'Horários de Pico', es: 'Horas Pico', de: 'Spitzenzeiten' },
    popularHabits: { en: 'Popular Habits', pt: 'Hábitos Populares', es: 'Hábitos Populares', de: 'Beliebte Gewohnheiten' },
    engagement: { en: 'Engagement', pt: 'Engajamento', es: 'Compromiso', de: 'Engagement' },
    searchUser: { en: 'Search user...', pt: 'Buscar usuário...', es: 'Buscar usuario...', de: 'Benutzer suchen...' },
    accountActive: { en: 'Account Active', pt: 'Conta Ativa', es: 'Cuenta Activa', de: 'Konto Aktiv' },
    accountDisabled: { en: 'Account Disabled', pt: 'Conta Desativada', es: 'Cuenta Desactivada', de: 'Konto Deaktiviert' },
    enableAccount: { en: 'Enable Account', pt: 'Ativar Conta', es: 'Activar Cuenta', de: 'Konto Aktivieren' },
    disableAccount: { en: 'Disable Account', pt: 'Desativar Conta', es: 'Desactivar Cuenta', de: 'Konto Deaktivieren' },
    features: { en: 'Features', pt: 'Funcionalidades', es: 'Funcionalidades', de: 'Funktionen' },
    active: { en: 'Active', pt: 'Ativo', es: 'Activo', de: 'Aktiv' },
    disabled: { en: 'Blocked', pt: 'Bloqueado', es: 'Bloqueado', de: 'Blockiert' },
    resetPassword: { en: 'Reset Password', pt: 'Resetar Senha', es: 'Restablecer Contraseña', de: 'Passwort zurücksetzen' },
  },

  // Days of week
  days: {
    sunday: { en: 'Sunday', pt: 'Domingo', es: 'Domingo', de: 'Sonntag' },
    monday: { en: 'Monday', pt: 'Segunda', es: 'Lunes', de: 'Montag' },
    tuesday: { en: 'Tuesday', pt: 'Terça', es: 'Martes', de: 'Dienstag' },
    wednesday: { en: 'Wednesday', pt: 'Quarta', es: 'Miércoles', de: 'Mittwoch' },
    thursday: { en: 'Thursday', pt: 'Quinta', es: 'Jueves', de: 'Donnerstag' },
    friday: { en: 'Friday', pt: 'Sexta', es: 'Viernes', de: 'Freitag' },
    saturday: { en: 'Saturday', pt: 'Sábado', es: 'Sábado', de: 'Samstag' },
    sun: { en: 'Sun', pt: 'Dom', es: 'Dom', de: 'So' },
    mon: { en: 'Mon', pt: 'Seg', es: 'Lun', de: 'Mo' },
    tue: { en: 'Tue', pt: 'Ter', es: 'Mar', de: 'Di' },
    wed: { en: 'Wed', pt: 'Qua', es: 'Mié', de: 'Mi' },
    thu: { en: 'Thu', pt: 'Qui', es: 'Jue', de: 'Do' },
    fri: { en: 'Fri', pt: 'Sex', es: 'Vie', de: 'Fr' },
    sat: { en: 'Sat', pt: 'Sáb', es: 'Sáb', de: 'Sa' },
  },

  // Moods
  moods: {
    crushingIt: { en: 'Crushing it', pt: 'Arrasando', es: 'Arrasando', de: 'Mega' },
    great: { en: 'Great', pt: 'Ótimo', es: 'Genial', de: 'Super' },
    good: { en: 'Good', pt: 'Bem', es: 'Bien', de: 'Gut' },
    meh: { en: 'Meh', pt: 'Meh', es: 'Meh', de: 'Meh' },
    rough: { en: 'Rough', pt: 'Difícil', es: 'Difícil', de: 'Schwer' },
  },
};

/**
 * Get translation for a key path
 * @param {string} path - Dot-separated path (e.g., 'landing.hero')
 * @param {string} lang - Language code (en, pt, es, de)
 * @returns {string} Translated text
 */
export function t(path, lang = 'en') {
  const keys = path.split('.');
  let value = translations;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      console.warn(`Translation not found: ${path}`);
      return path;
    }
  }
  
  if (typeof value === 'object' && lang in value) {
    return value[lang];
  }
  
  // Fallback to English
  if (typeof value === 'object' && 'en' in value) {
    return value['en'];
  }
  
  return path;
}

export default translations;
