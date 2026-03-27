// Static translations for customer-facing pages
// Languages: en (English), ro (Romanian), es (Spanish)

const translations = {
  en: {
    // Common
    poweredBy: 'Powered by Chatters',
    loading: 'Loading...',
    retry: 'Retry',
    goBack: 'Go back',
    close: 'Close',
    submit: 'Submit',
    continue: 'Continue',
    optional: 'Optional',

    // FeedbackSplash page
    welcomeTo: 'Welcome to',
    whatWouldYouLikeToDo: 'What would you like to do?',
    leaveFeedback: 'Leave Feedback',
    viewMenu: 'View Menu',

    // CustomerFeedback page
    welcome: 'Welcome!',
    firstName: 'First Name',
    firstNamePlaceholder: 'Enter your first name',
    email: 'Email',
    emailPlaceholder: 'your@email.com',
    emailHelperText: 'Share your email to help us follow up and improve your experience',
    tableNumber: 'Table Number',
    chooseYourTable: 'Choose your table',
    enterTableNumber: 'Enter your table number',
    feedbackForTable: 'Feedback for Table',
    questionOf: 'Question {current} of {total}',
    tapStarToRate: 'Tap a star to rate',
    poor: 'Poor',
    excellent: 'Excellent',

    // Assistance
    dontWantFeedback: "Don't want to leave feedback right now?",
    justNeedAssistance: 'Just need assistance?',
    ourTeamWillBeRightWithYou: 'Our team will be right with you',
    requesting: 'Requesting...',

    // Free text
    anythingElse: "Anything else you'd like to tell us?",
    additionalCommentsPlaceholder: 'Leave any additional comments (optional)...',
    submitFeedback: 'Submit Feedback',
    submitting: 'Submitting...',

    // Success states
    thanksPositiveFeedback: 'Thanks for your positive feedback!',
    gladYouHadGreatExperience: "We're so glad you had a great experience! Would you mind sharing your positive experience with others?",
    leaveGoogleReview: 'Leave a Google Review',
    reviewOnTripAdvisor: 'Review on TripAdvisor',
    noThanksClose: 'No thanks, close',

    // Default thank you (can be overridden by venue settings)
    defaultThankYouTitle: 'Thanks for your feedback!',
    defaultThankYouMessage: 'Your response has been submitted successfully.',

    // Default assistance (can be overridden by venue settings)
    defaultAssistanceTitle: 'Help is on the way!',
    defaultAssistanceMessage: "We've notified our team that you need assistance. Someone will be with you shortly.",
    youCanCloseThisPage: 'You can close this page now.',

    // Errors
    submissionFailed: 'Submission Failed',
    failedToSubmitFeedback: 'Failed to submit feedback. Please try again.',
    assistanceRequestFailed: 'Assistance Request Failed',
    unableToLoadFeedbackForm: 'Unable to load feedback form',

    // Feedback unavailable
    feedbackUnavailable: 'Feedback Currently Unavailable',
    feedbackUnavailableMessage: "We're not accepting feedback at the moment. Please try again during our service hours.",
    thankYouForInterest: 'Thank you for your interest in providing feedback!',

    // Feedback disabled (no questions)
    feedbackDisabledTitle: 'Feedback Currently Disabled',
    feedbackDisabledMessage: 'Feedback is currently disabled for {venueName}.',

    // Menu page
    menu: 'Menu',
    search: 'Search',
    all: 'All',
    noMenuAvailable: 'No menu available',
    noItemsMatchSearch: 'No items match your search',
    noMenuItemsAvailable: 'No menu items available',
    menuNotFound: 'Menu not found',
    failedToLoadMenu: 'Failed to load menu',

    // Dietary tags
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    glutenFree: 'Gluten Free',
    dairyFree: 'Dairy Free',
    containsNuts: 'Contains Nuts',

    // Language selector
    selectLanguage: 'Select language',
    english: 'English',
    romanian: 'Romanian',
    spanish: 'Spanish',
  },

  ro: {
    // Common
    poweredBy: 'Funcționează cu Chatters',
    loading: 'Se încarcă...',
    retry: 'Reîncearcă',
    goBack: 'Înapoi',
    close: 'Închide',
    submit: 'Trimite',
    continue: 'Continuă',
    optional: 'Opțional',

    // FeedbackSplash page
    welcomeTo: 'Bine ați venit la',
    whatWouldYouLikeToDo: 'Ce doriți să faceți?',
    leaveFeedback: 'Lasă feedback',
    viewMenu: 'Vezi meniul',

    // CustomerFeedback page
    welcome: 'Bine ați venit!',
    firstName: 'Prenume',
    firstNamePlaceholder: 'Introduceți prenumele',
    email: 'Email',
    emailPlaceholder: 'email@exemplu.ro',
    emailHelperText: 'Împărtășește-ne emailul pentru a te ajuta să îmbunătățim experiența ta',
    tableNumber: 'Numărul mesei',
    chooseYourTable: 'Alegeți masa',
    enterTableNumber: 'Introduceți numărul mesei',
    feedbackForTable: 'Feedback pentru masa',
    questionOf: 'Întrebarea {current} din {total}',
    tapStarToRate: 'Atinge o stea pentru a evalua',
    poor: 'Slab',
    excellent: 'Excelent',

    // Assistance
    dontWantFeedback: 'Nu doriți să lăsați feedback acum?',
    justNeedAssistance: 'Aveți nevoie de asistență?',
    ourTeamWillBeRightWithYou: 'Echipa noastră va fi cu dumneavoastră imediat',
    requesting: 'Se solicită...',

    // Free text
    anythingElse: 'Altceva ce doriți să ne spuneți?',
    additionalCommentsPlaceholder: 'Lăsați comentarii suplimentare (opțional)...',
    submitFeedback: 'Trimite feedback',
    submitting: 'Se trimite...',

    // Success states
    thanksPositiveFeedback: 'Mulțumim pentru feedback-ul pozitiv!',
    gladYouHadGreatExperience: 'Ne bucurăm că ați avut o experiență plăcută! Ați dori să împărtășiți experiența dumneavoastră cu alții?',
    leaveGoogleReview: 'Lasă o recenzie pe Google',
    reviewOnTripAdvisor: 'Recenzie pe TripAdvisor',
    noThanksClose: 'Nu, mulțumesc, închide',

    // Default thank you
    defaultThankYouTitle: 'Mulțumim pentru feedback!',
    defaultThankYouMessage: 'Răspunsul dumneavoastră a fost trimis cu succes.',

    // Default assistance
    defaultAssistanceTitle: 'Ajutorul este pe drum!',
    defaultAssistanceMessage: 'Am notificat echipa noastră că aveți nevoie de asistență. Cineva va fi cu dumneavoastră în scurt timp.',
    youCanCloseThisPage: 'Puteți închide această pagină acum.',

    // Errors
    submissionFailed: 'Trimitere eșuată',
    failedToSubmitFeedback: 'Nu s-a putut trimite feedback-ul. Vă rugăm să încercați din nou.',
    assistanceRequestFailed: 'Solicitarea de asistență a eșuat',
    unableToLoadFeedbackForm: 'Nu se poate încărca formularul de feedback',

    // Feedback unavailable
    feedbackUnavailable: 'Feedback momentan indisponibil',
    feedbackUnavailableMessage: 'Nu acceptăm feedback în acest moment. Vă rugăm să încercați din nou în timpul orelor de serviciu.',
    thankYouForInterest: 'Vă mulțumim pentru interesul acordat pentru a oferi feedback!',

    // Feedback disabled (no questions)
    feedbackDisabledTitle: 'Feedback dezactivat',
    feedbackDisabledMessage: 'Feedback-ul este momentan dezactivat pentru {venueName}.',

    // Menu page
    menu: 'Meniu',
    search: 'Caută',
    all: 'Toate',
    noMenuAvailable: 'Meniu indisponibil',
    noItemsMatchSearch: 'Niciun articol nu corespunde căutării',
    noMenuItemsAvailable: 'Nu sunt disponibile articole în meniu',
    menuNotFound: 'Meniu negăsit',
    failedToLoadMenu: 'Nu s-a putut încărca meniul',

    // Dietary tags
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    glutenFree: 'Fără gluten',
    dairyFree: 'Fără lactate',
    containsNuts: 'Conține nuci',

    // Language selector
    selectLanguage: 'Selectați limba',
    english: 'Engleză',
    romanian: 'Română',
    spanish: 'Spaniolă',
  },

  es: {
    // Common
    poweredBy: 'Desarrollado por Chatters',
    loading: 'Cargando...',
    retry: 'Reintentar',
    goBack: 'Volver',
    close: 'Cerrar',
    submit: 'Enviar',
    continue: 'Continuar',
    optional: 'Opcional',

    // FeedbackSplash page
    welcomeTo: 'Bienvenido a',
    whatWouldYouLikeToDo: '¿Qué te gustaría hacer?',
    leaveFeedback: 'Dejar comentarios',
    viewMenu: 'Ver menú',

    // CustomerFeedback page
    welcome: '¡Bienvenido!',
    firstName: 'Nombre',
    firstNamePlaceholder: 'Introduce tu nombre',
    email: 'Correo electrónico',
    emailPlaceholder: 'tu@email.com',
    emailHelperText: 'Comparte tu email para ayudarnos a mejorar tu experiencia',
    tableNumber: 'Número de mesa',
    chooseYourTable: 'Elige tu mesa',
    enterTableNumber: 'Introduce el número de mesa',
    feedbackForTable: 'Comentarios para la mesa',
    questionOf: 'Pregunta {current} de {total}',
    tapStarToRate: 'Toca una estrella para calificar',
    poor: 'Malo',
    excellent: 'Excelente',

    // Assistance
    dontWantFeedback: '¿No quieres dejar comentarios ahora?',
    justNeedAssistance: '¿Solo necesitas ayuda?',
    ourTeamWillBeRightWithYou: 'Nuestro equipo estará contigo enseguida',
    requesting: 'Solicitando...',

    // Free text
    anythingElse: '¿Algo más que quieras decirnos?',
    additionalCommentsPlaceholder: 'Deja comentarios adicionales (opcional)...',
    submitFeedback: 'Enviar comentarios',
    submitting: 'Enviando...',

    // Success states
    thanksPositiveFeedback: '¡Gracias por tus comentarios positivos!',
    gladYouHadGreatExperience: '¡Nos alegra que hayas tenido una gran experiencia! ¿Te importaría compartir tu experiencia positiva con otros?',
    leaveGoogleReview: 'Dejar una reseña en Google',
    reviewOnTripAdvisor: 'Reseña en TripAdvisor',
    noThanksClose: 'No gracias, cerrar',

    // Default thank you
    defaultThankYouTitle: '¡Gracias por tus comentarios!',
    defaultThankYouMessage: 'Tu respuesta ha sido enviada con éxito.',

    // Default assistance
    defaultAssistanceTitle: '¡La ayuda está en camino!',
    defaultAssistanceMessage: 'Hemos notificado a nuestro equipo que necesitas ayuda. Alguien estará contigo en breve.',
    youCanCloseThisPage: 'Puedes cerrar esta página ahora.',

    // Errors
    submissionFailed: 'Error al enviar',
    failedToSubmitFeedback: 'No se pudo enviar los comentarios. Por favor, inténtalo de nuevo.',
    assistanceRequestFailed: 'Error en la solicitud de asistencia',
    unableToLoadFeedbackForm: 'No se puede cargar el formulario de comentarios',

    // Feedback unavailable
    feedbackUnavailable: 'Comentarios no disponibles actualmente',
    feedbackUnavailableMessage: 'No estamos aceptando comentarios en este momento. Por favor, inténtalo de nuevo durante nuestras horas de servicio.',
    thankYouForInterest: '¡Gracias por tu interés en proporcionar comentarios!',

    // Feedback disabled (no questions)
    feedbackDisabledTitle: 'Comentarios desactivados',
    feedbackDisabledMessage: 'Los comentarios están actualmente desactivados para {venueName}.',

    // Menu page
    menu: 'Menú',
    search: 'Buscar',
    all: 'Todo',
    noMenuAvailable: 'Menú no disponible',
    noItemsMatchSearch: 'Ningún artículo coincide con tu búsqueda',
    noMenuItemsAvailable: 'No hay artículos de menú disponibles',
    menuNotFound: 'Menú no encontrado',
    failedToLoadMenu: 'No se pudo cargar el menú',

    // Dietary tags
    vegetarian: 'Vegetariano',
    vegan: 'Vegano',
    glutenFree: 'Sin gluten',
    dairyFree: 'Sin lácteos',
    containsNuts: 'Contiene frutos secos',

    // Language selector
    selectLanguage: 'Seleccionar idioma',
    english: 'Inglés',
    romanian: 'Rumano',
    spanish: 'Español',
  }
};

export default translations;
