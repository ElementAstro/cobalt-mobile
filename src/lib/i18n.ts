import { useAppStore } from "./store" // Assuming useAppStore is declared in appStore.ts

export type Language = "en" | "es" | "fr" | "de" | "zh" | "ja"

export interface Translations {
  // Navigation
  dashboard: string
  devices: string
  sequence: string
  logs: string
  settings: string
  home: string

  // Equipment
  camera: string
  mount: string
  filterWheel: string
  focuser: string
  equipment: string
  equipmentStatus: string
  equipmentControl: string

  // Status
  connected: string
  disconnected: string
  error: string
  running: string
  stopped: string
  paused: string
  active: string
  inactive: string
  idle: string
  moving: string

  // Camera
  cameraControl: string
  cameraStatus: string
  exposure: string
  exposureTime: string
  iso: string
  gain: string
  offset: string
  binning: string
  frameType: string
  imageFormat: string
  cooling: string
  coolingEnabled: string
  temperature: string
  currentTemp: string
  targetTemp: string
  coolingPower: string
  capture: string
  capturing: string
  abort: string
  liveView: string
  download: string
  quickCapture: string
  exposureSettings: string
  cameraSettings: string

  // Mount
  mountControl: string
  mountStatus: string
  rightAscension: string
  declination: string
  altitude: string
  azimuth: string
  tracking: string
  slewing: string
  parked: string
  aligned: string
  guiding: string
  slewControl: string
  quickTargets: string
  popularTargets: string
  slewToTarget: string
  manualControl: string
  slewRate: string
  trackingRate: string
  enableTracking: string
  enableGuiding: string
  park: string
  unpark: string
  homePosition: string

  // Filter Wheel
  filterWheelStatus: string
  filterSelection: string
  position: string
  current: string
  installedFilters: string
  available: string

  // Focuser
  focuserControl: string
  focuserStatus: string
  currentPosition: string
  manualFocusControl: string
  stepSize: string
  targetPosition: string
  moveToPosition: string
  autoFocus: string
  startAutoFocus: string
  bestPosition: string
  bestHFR: string
  focusCurve: string
  samples: string

  // Sequence
  sequenceStatus: string
  sequenceSteps: string
  sequenceLibrary: string
  addStep: string
  elapsed: string
  remaining: string
  start: string
  pause: string
  resume: string
  stop: string
  reset: string
  progress: string
  eta: string

  // Environmental
  environmentalConditions: string
  humidity: string
  pressure: string
  skyQuality: string

  // Actions
  quickActions: string
  testShot: string
  saveProfile: string
  viewLogs: string
  connectAll: string
  disconnectAll: string
  refreshStatus: string
  testAll: string
  emergencyStop: string
  refreshAll: string

  // Settings
  connectionSettings: string
  userInterface: string
  safetySettings: string
  protocol: string
  interface: string
  hostAddress: string
  port: string
  theme: string
  light: string
  dark: string
  auto: string
  units: string
  metric: string
  imperial: string
  enableNotifications: string
  enableSounds: string
  volume: string
  parkOnDisconnect: string
  stopOnError: string
  saveSettings: string
  resetToDefaults: string

  // Logs
  logStatistics: string
  totalLogs: string
  errors: string
  warnings: string
  success: string
  logViewer: string
  levelFilter: string
  categoryFilter: string
  allLevels: string
  allCategories: string
  system: string
  export: string
  clear: string

  // Common
  on: string
  off: string
  yes: string
  no: string
  cancel: string
  save: string
  load: string
  edit: string
  delete: string
  create: string
  close: string
  back: string
  next: string
  previous: string

  // Swipe
  swipeToNavigate: string
  swipeLeftRight: string

  // Units
  seconds: string
  minutes: string
  hours: string
  celsius: string
  fahrenheit: string
  pixels: string
  steps: string
  percent: string

  // Additional focuser translations
  curveQuality: string
  good: string
  poor: string
  confidence: string
  minHFR: string
  maxHFR: string
  range: string
  started: string
  completed: string
  duration: string
  validCurve: string
  invalidCurve: string
  showing: string
  dataPoints: string
  bestFocus: string
  optimalFocus: string
  coefficient: string
  leftSlope: string
  rightSlope: string
  sampleData: string
  stars: string
  qualityAssessment: string
  curveValidity: string
  complete: string
  estimatedTime: string
  model: string
  serial: string
  firmware: string
  moveIn: string
  moveOut: string

  // Additional filterwheel translations
  filterWheelMoving: string
}

const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    dashboard: "Dashboard",
    devices: "Devices",
    sequence: "Sequence",
    logs: "Logs",
    settings: "Settings",
    home: "Home",

    // Equipment
    camera: "Camera",
    mount: "Mount",
    filterWheel: "Filter Wheel",
    focuser: "Focuser",
    equipment: "Equipment",
    equipmentStatus: "Equipment Status",
    equipmentControl: "Equipment Control",

    // Status
    connected: "Connected",
    disconnected: "Disconnected",
    error: "Error",
    running: "Running",
    stopped: "Stopped",
    paused: "Paused",
    active: "Active",
    inactive: "Inactive",
    idle: "Idle",
    moving: "Moving",

    // Camera
    cameraControl: "Camera Control",
    cameraStatus: "Camera Status",
    exposure: "Exposure",
    exposureTime: "Exposure Time",
    iso: "ISO",
    gain: "Gain",
    offset: "Offset",
    binning: "Binning",
    frameType: "Frame Type",
    imageFormat: "Image Format",
    cooling: "Cooling",
    coolingEnabled: "Cooling Enabled",
    temperature: "Temperature",
    currentTemp: "Current Temp",
    targetTemp: "Target Temp",
    coolingPower: "Cooling Power",
    capture: "Capture",
    capturing: "Capturing",
    abort: "Abort",
    liveView: "Live View",
    download: "Download",
    quickCapture: "Quick Capture",
    exposureSettings: "Exposure Settings",
    cameraSettings: "Camera Settings",

    // Mount
    mountControl: "Mount Control",
    mountStatus: "Mount Status",
    rightAscension: "Right Ascension",
    declination: "Declination",
    altitude: "Altitude",
    azimuth: "Azimuth",
    tracking: "Tracking",
    slewing: "Slewing",
    parked: "Parked",
    aligned: "Aligned",
    guiding: "Guiding",
    slewControl: "Slew Control",
    quickTargets: "Quick Targets",
    popularTargets: "Popular Targets",
    slewToTarget: "Slew to Target",
    manualControl: "Manual Control",
    slewRate: "Slew Rate",
    trackingRate: "Tracking Rate",
    enableTracking: "Enable Tracking",
    enableGuiding: "Enable Guiding",
    park: "Park",
    unpark: "Unpark",
    homePosition: "Home Position",

    // Filter Wheel
    filterWheelStatus: "Filter Wheel Status",
    filterSelection: "Filter Selection",
    position: "Position",
    current: "Current",
    installedFilters: "Installed Filters",
    available: "Available",

    // Focuser
    focuserControl: "Focuser Control",
    focuserStatus: "Focuser Status",
    currentPosition: "Current Position",
    manualFocusControl: "Manual Focus Control",
    stepSize: "Step Size",
    targetPosition: "Target Position",
    moveToPosition: "Move to Position",
    autoFocus: "Auto Focus",
    startAutoFocus: "Start Auto Focus",
    bestPosition: "Best Position",
    bestHFR: "Best HFR",
    focusCurve: "Focus Curve",
    samples: "Samples",

    // Sequence
    sequenceStatus: "Sequence Status",
    sequenceSteps: "Sequence Steps",
    sequenceLibrary: "Sequence Library",
    addStep: "Add Step",
    elapsed: "Elapsed",
    remaining: "Remaining",
    start: "Start",
    pause: "Pause",
    resume: "Resume",
    stop: "Stop",
    reset: "Reset",
    progress: "Progress",
    eta: "ETA",

    // Environmental
    environmentalConditions: "Environmental Conditions",
    humidity: "Humidity",
    pressure: "Pressure",
    skyQuality: "Sky Quality",

    // Actions
    quickActions: "Quick Actions",
    testShot: "Test Shot",
    saveProfile: "Save Profile",
    viewLogs: "View Logs",
    connectAll: "Connect All",
    disconnectAll: "Disconnect All",
    refreshStatus: "Refresh Status",
    testAll: "Test All",
    emergencyStop: "Emergency Stop",
    refreshAll: "Refresh All",

    // Settings
    connectionSettings: "Connection Settings",
    userInterface: "User Interface",
    safetySettings: "Safety Settings",
    protocol: "Protocol",
    interface: "Interface",
    hostAddress: "Host Address",
    port: "Port",
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    auto: "Auto",
    units: "Units",
    metric: "Metric",
    imperial: "Imperial",
    enableNotifications: "Enable Notifications",
    enableSounds: "Enable Sounds",
    volume: "Volume",
    parkOnDisconnect: "Park on Disconnect",
    stopOnError: "Stop on Error",
    saveSettings: "Save Settings",
    resetToDefaults: "Reset to Defaults",

    // Logs
    logStatistics: "Log Statistics",
    totalLogs: "Total Logs",
    errors: "Errors",
    warnings: "Warnings",
    success: "Success",
    logViewer: "Log Viewer",
    levelFilter: "Level Filter",
    categoryFilter: "Category Filter",
    allLevels: "All Levels",
    allCategories: "All Categories",
    system: "System",
    export: "Export",
    clear: "Clear",

    // Common
    on: "On",
    off: "Off",
    yes: "Yes",
    no: "No",
    cancel: "Cancel",
    save: "Save",
    load: "Load",
    edit: "Edit",
    delete: "Delete",
    create: "Create",
    close: "Close",
    back: "Back",
    next: "Next",
    previous: "Previous",

    // Swipe
    swipeToNavigate: "Swipe to navigate",
    swipeLeftRight: "Swipe left or right to navigate between devices",

    // Units
    seconds: "seconds",
    minutes: "minutes",
    hours: "hours",
    celsius: "°C",
    fahrenheit: "°F",
    pixels: "pixels",
    steps: "steps",
    percent: "%",

    // Additional focuser translations
    curveQuality: "Curve Quality",
    good: "Good",
    poor: "Poor",
    confidence: "Confidence",
    minHFR: "Min HFR",
    maxHFR: "Max HFR",
    range: "Range",
    started: "Started",
    completed: "Completed",
    duration: "Duration",
    validCurve: "Valid Curve",
    invalidCurve: "Invalid Curve",
    showing: "Showing",
    dataPoints: "Data Points",
    bestFocus: "Best Focus",
    optimalFocus: "Optimal Focus",
    coefficient: "Coefficient",
    leftSlope: "Left Slope",
    rightSlope: "Right Slope",
    sampleData: "Sample Data",
    stars: "Stars",
    qualityAssessment: "Quality Assessment",
    curveValidity: "Curve Validity",
    complete: "Complete",
    estimatedTime: "Estimated Time",
    model: "Model",
    serial: "Serial",
    firmware: "Firmware",
    moveIn: "Move In",
    moveOut: "Move Out",

    // Additional filterwheel translations
    filterWheelMoving: "Filter Wheel Moving",
  },

  es: {
    // Navigation
    dashboard: "Panel",
    devices: "Dispositivos",
    sequence: "Secuencia",
    logs: "Registros",
    settings: "Configuración",
    home: "Inicio",

    // Equipment
    camera: "Cámara",
    mount: "Montura",
    filterWheel: "Rueda de Filtros",
    focuser: "Enfocador",
    equipment: "Equipo",
    equipmentStatus: "Estado del Equipo",
    equipmentControl: "Control del Equipo",

    // Status
    connected: "Conectado",
    disconnected: "Desconectado",
    error: "Error",
    running: "Ejecutando",
    stopped: "Detenido",
    paused: "Pausado",
    active: "Activo",
    inactive: "Inactivo",
    idle: "Inactivo",
    moving: "Moviendo",

    // Camera
    cameraControl: "Control de Cámara",
    cameraStatus: "Estado de Cámara",
    exposure: "Exposición",
    exposureTime: "Tiempo de Exposición",
    iso: "ISO",
    gain: "Ganancia",
    offset: "Offset",
    binning: "Binning",
    frameType: "Tipo de Frame",
    imageFormat: "Formato de Imagen",
    cooling: "Refrigeración",
    coolingEnabled: "Refrigeración Habilitada",
    temperature: "Temperatura",
    currentTemp: "Temp. Actual",
    targetTemp: "Temp. Objetivo",
    coolingPower: "Potencia de Refrigeración",
    capture: "Capturar",
    capturing: "Capturando",
    abort: "Abortar",
    liveView: "Vista en Vivo",
    download: "Descargar",
    quickCapture: "Captura Rápida",
    exposureSettings: "Configuración de Exposición",
    cameraSettings: "Configuración de Cámara",

    // Mount
    mountControl: "Control de Montura",
    mountStatus: "Estado de Montura",
    rightAscension: "Ascensión Recta",
    declination: "Declinación",
    altitude: "Altitud",
    azimuth: "Azimut",
    tracking: "Seguimiento",
    slewing: "Moviendo",
    parked: "Aparcada",
    aligned: "Alineada",
    guiding: "Guiado",
    slewControl: "Control de Movimiento",
    quickTargets: "Objetivos Rápidos",
    popularTargets: "Objetivos Populares",
    slewToTarget: "Ir al Objetivo",
    manualControl: "Control Manual",
    slewRate: "Velocidad de Movimiento",
    trackingRate: "Velocidad de Seguimiento",
    enableTracking: "Habilitar Seguimiento",
    enableGuiding: "Habilitar Guiado",
    park: "Aparcar",
    unpark: "Desaparcar",
    homePosition: "Posición de Inicio",

    // Filter Wheel
    filterWheelStatus: "Estado de Rueda de Filtros",
    filterSelection: "Selección de Filtro",
    position: "Posición",
    current: "Actual",
    installedFilters: "Filtros Instalados",
    available: "Disponible",

    // Focuser
    focuserControl: "Control de Enfocador",
    focuserStatus: "Estado de Enfocador",
    currentPosition: "Posición Actual",
    manualFocusControl: "Control Manual de Enfoque",
    stepSize: "Tamaño de Paso",
    targetPosition: "Posición Objetivo",
    moveToPosition: "Mover a Posición",
    autoFocus: "Enfoque Automático",
    startAutoFocus: "Iniciar Enfoque Automático",
    bestPosition: "Mejor Posición",
    bestHFR: "Mejor HFR",
    focusCurve: "Curva de Enfoque",
    samples: "Muestras",

    // Sequence
    sequenceStatus: "Estado de Secuencia",
    sequenceSteps: "Pasos de Secuencia",
    sequenceLibrary: "Biblioteca de Secuencias",
    addStep: "Agregar Paso",
    elapsed: "Transcurrido",
    remaining: "Restante",
    start: "Iniciar",
    pause: "Pausar",
    resume: "Reanudar",
    stop: "Detener",
    reset: "Reiniciar",
    progress: "Progreso",
    eta: "Tiempo Estimado",

    // Environmental
    environmentalConditions: "Condiciones Ambientales",
    humidity: "Humedad",
    pressure: "Presión",
    skyQuality: "Calidad del Cielo",

    // Actions
    quickActions: "Acciones Rápidas",
    testShot: "Toma de Prueba",
    saveProfile: "Guardar Perfil",
    viewLogs: "Ver Registros",
    connectAll: "Conectar Todo",
    disconnectAll: "Desconectar Todo",
    refreshStatus: "Actualizar Estado",
    testAll: "Probar Todo",

    // Settings
    connectionSettings: "Configuración de Conexión",
    userInterface: "Interfaz de Usuario",
    safetySettings: "Configuración de Seguridad",
    protocol: "Protocolo",
    interface: "Interfaz",
    hostAddress: "Dirección del Host",
    port: "Puerto",
    theme: "Tema",
    light: "Claro",
    dark: "Oscuro",
    auto: "Automático",
    units: "Unidades",
    metric: "Métrico",
    imperial: "Imperial",
    enableNotifications: "Habilitar Notificaciones",
    enableSounds: "Habilitar Sonidos",
    volume: "Volumen",
    parkOnDisconnect: "Aparcar al Desconectar",
    stopOnError: "Detener en Error",
    saveSettings: "Guardar Configuración",
    resetToDefaults: "Restablecer Valores Predeterminados",

    // Logs
    logStatistics: "Estadísticas de Registro",
    totalLogs: "Total de Registros",
    errors: "Errores",
    warnings: "Advertencias",
    success: "Éxito",
    logViewer: "Visor de Registros",
    levelFilter: "Filtro de Nivel",
    categoryFilter: "Filtro de Categoría",
    allLevels: "Todos los Niveles",
    allCategories: "Todas las Categorías",
    system: "Sistema",
    export: "Exportar",
    clear: "Limpiar",

    // Common
    on: "Encendido",
    off: "Apagado",
    yes: "Sí",
    no: "No",
    cancel: "Cancelar",
    save: "Guardar",
    load: "Cargar",
    edit: "Editar",
    delete: "Eliminar",
    create: "Crear",
    close: "Cerrar",
    back: "Atrás",
    next: "Siguiente",
    previous: "Anterior",

    // Swipe
    swipeToNavigate: "Deslizar para navegar",
    swipeLeftRight: "Desliza izquierda o derecha para navegar entre dispositivos",

    // Units
    seconds: "segundos",
    minutes: "minutos",
    hours: "horas",
    celsius: "°C",
    fahrenheit: "°F",
    pixels: "píxeles",
    steps: "pasos",
    percent: "%",

    // Additional focuser translations
    curveQuality: "Calidad de Curva",
    good: "Buena",
    poor: "Pobre",
    confidence: "Confianza",
    minHFR: "HFR Mínimo",
    maxHFR: "HFR Máximo",
    range: "Rango",
    started: "Iniciado",
    completed: "Completado",
    duration: "Duración",
    validCurve: "Curva Válida",
    invalidCurve: "Curva Inválida",
    showing: "Mostrando",
    dataPoints: "Puntos de Datos",
    bestFocus: "Mejor Enfoque",
    optimalFocus: "Enfoque Óptimo",
    coefficient: "Coeficiente",
    leftSlope: "Pendiente Izquierda",
    rightSlope: "Pendiente Derecha",
    sampleData: "Datos de Muestra",
    stars: "Estrellas",
    qualityAssessment: "Evaluación de Calidad",
    curveValidity: "Validez de Curva",
    complete: "Completo",
    estimatedTime: "Tiempo Estimado",
    model: "Modelo",
    serial: "Serie",
    firmware: "Firmware",
    moveIn: "Mover Hacia Adentro",
    moveOut: "Mover Hacia Afuera",

    // Additional filterwheel translations
    filterWheelMoving: "Rueda de Filtros en Movimiento",

    // Missing keys
    emergencyStop: "Parada de Emergencia",
    refreshAll: "Actualizar Todo",
  },

  fr: {
    // Navigation
    dashboard: "Tableau de Bord",
    devices: "Appareils",
    sequence: "Séquence",
    logs: "Journaux",
    settings: "Paramètres",
    home: "Accueil",

    // Equipment
    camera: "Caméra",
    mount: "Monture",
    filterWheel: "Roue à Filtres",
    focuser: "Focaliseur",
    equipment: "Équipement",
    equipmentStatus: "État de l'Équipement",
    equipmentControl: "Contrôle de l'Équipement",

    // Status
    connected: "Connecté",
    disconnected: "Déconnecté",
    error: "Erreur",
    running: "En cours",
    stopped: "Arrêté",
    paused: "En pause",
    active: "Actif",
    inactive: "Inactif",
    idle: "Inactif",
    moving: "En mouvement",

    // Camera
    cameraControl: "Contrôle Caméra",
    cameraStatus: "État Caméra",
    exposure: "Exposition",
    exposureTime: "Temps d'Exposition",
    iso: "ISO",
    gain: "Gain",
    offset: "Offset",
    binning: "Binning",
    frameType: "Type de Trame",
    imageFormat: "Format d'Image",
    cooling: "Refroidissement",
    coolingEnabled: "Refroidissement Activé",
    temperature: "Température",
    currentTemp: "Temp. Actuelle",
    targetTemp: "Temp. Cible",
    coolingPower: "Puissance de Refroidissement",
    capture: "Capturer",
    capturing: "Capture en cours",
    abort: "Annuler",
    liveView: "Vue en Direct",
    download: "Télécharger",
    quickCapture: "Capture Rapide",
    exposureSettings: "Paramètres d'Exposition",
    cameraSettings: "Paramètres Caméra",

    // Mount
    mountControl: "Contrôle Monture",
    mountStatus: "État Monture",
    rightAscension: "Ascension Droite",
    declination: "Déclinaison",
    altitude: "Altitude",
    azimuth: "Azimut",
    tracking: "Suivi",
    slewing: "Déplacement",
    parked: "Parkée",
    aligned: "Alignée",
    guiding: "Guidage",
    slewControl: "Contrôle de Déplacement",
    quickTargets: "Cibles Rapides",
    popularTargets: "Cibles Populaires",
    slewToTarget: "Aller à la Cible",
    manualControl: "Contrôle Manuel",
    slewRate: "Vitesse de Déplacement",
    trackingRate: "Vitesse de Suivi",
    enableTracking: "Activer le Suivi",
    enableGuiding: "Activer le Guidage",
    park: "Parker",
    unpark: "Déparker",
    homePosition: "Position d'Origine",

    // Filter Wheel
    filterWheelStatus: "État Roue à Filtres",
    filterSelection: "Sélection de Filtre",
    position: "Position",
    current: "Actuel",
    installedFilters: "Filtres Installés",
    available: "Disponible",

    // Focuser
    focuserControl: "Contrôle Focaliseur",
    focuserStatus: "État Focaliseur",
    currentPosition: "Position Actuelle",
    manualFocusControl: "Contrôle Manuel de Focus",
    stepSize: "Taille de Pas",
    targetPosition: "Position Cible",
    moveToPosition: "Aller à la Position",
    autoFocus: "Mise au Point Auto",
    startAutoFocus: "Démarrer Mise au Point Auto",
    bestPosition: "Meilleure Position",
    bestHFR: "Meilleur HFR",
    focusCurve: "Courbe de Focus",
    samples: "Échantillons",

    // Sequence
    sequenceStatus: "État de Séquence",
    sequenceSteps: "Étapes de Séquence",
    sequenceLibrary: "Bibliothèque de Séquences",
    addStep: "Ajouter Étape",
    elapsed: "Écoulé",
    remaining: "Restant",
    start: "Démarrer",
    pause: "Pause",
    resume: "Reprendre",
    stop: "Arrêter",
    reset: "Réinitialiser",
    progress: "Progrès",
    eta: "Temps Estimé",

    // Environmental
    environmentalConditions: "Conditions Environnementales",
    humidity: "Humidité",
    pressure: "Pression",
    skyQuality: "Qualité du Ciel",

    // Actions
    quickActions: "Actions Rapides",
    testShot: "Prise de Test",
    saveProfile: "Sauvegarder Profil",
    viewLogs: "Voir Journaux",
    connectAll: "Connecter Tout",
    disconnectAll: "Déconnecter Tout",
    refreshStatus: "Actualiser État",
    testAll: "Tester Tout",

    // Settings
    connectionSettings: "Paramètres de Connexion",
    userInterface: "Interface Utilisateur",
    safetySettings: "Paramètres de Sécurité",
    protocol: "Protocole",
    interface: "Interface",
    hostAddress: "Adresse de l'Hôte",
    port: "Port",
    theme: "Thème",
    light: "Clair",
    dark: "Sombre",
    auto: "Automatique",
    units: "Unités",
    metric: "Métrique",
    imperial: "Impérial",
    enableNotifications: "Activer Notifications",
    enableSounds: "Activer Sons",
    volume: "Volume",
    parkOnDisconnect: "Parker à la Déconnexion",
    stopOnError: "Arrêter sur Erreur",
    saveSettings: "Sauvegarder Paramètres",
    resetToDefaults: "Réinitialiser aux Valeurs par Défaut",

    // Logs
    logStatistics: "Statistiques de Journal",
    totalLogs: "Total Journaux",
    errors: "Erreurs",
    warnings: "Avertissements",
    success: "Succès",
    logViewer: "Visualiseur de Journal",
    levelFilter: "Filtre de Niveau",
    categoryFilter: "Filtre de Catégorie",
    allLevels: "Tous les Niveaux",
    allCategories: "Toutes les Catégories",
    system: "Système",
    export: "Exporter",
    clear: "Effacer",

    // Common
    on: "Activé",
    off: "Désactivé",
    yes: "Oui",
    no: "Non",
    cancel: "Annuler",
    save: "Sauvegarder",
    load: "Charger",
    edit: "Modifier",
    delete: "Supprimer",
    create: "Créer",
    close: "Fermer",
    back: "Retour",
    next: "Suivant",
    previous: "Précédent",

    // Swipe
    swipeToNavigate: "Glisser pour naviguer",
    swipeLeftRight: "Glissez à gauche ou à droite pour naviguer entre les appareils",

    // Units
    seconds: "secondes",
    minutes: "minutes",
    hours: "heures",
    celsius: "°C",
    fahrenheit: "°F",
    pixels: "pixels",
    steps: "pas",
    percent: "%",

    // Additional focuser translations
    curveQuality: "Qualité de Courbe",
    good: "Bonne",
    poor: "Pauvre",
    confidence: "Confiance",
    minHFR: "HFR Minimum",
    maxHFR: "HFR Maximum",
    range: "Plage",
    started: "Démarré",
    completed: "Terminé",
    duration: "Durée",
    validCurve: "Courbe Valide",
    invalidCurve: "Courbe Invalide",
    showing: "Affichage",
    dataPoints: "Points de Données",
    bestFocus: "Meilleur Focus",
    optimalFocus: "Focus Optimal",
    coefficient: "Coefficient",
    leftSlope: "Pente Gauche",
    rightSlope: "Pente Droite",
    sampleData: "Données d'Échantillon",
    stars: "Étoiles",
    qualityAssessment: "Évaluation de Qualité",
    curveValidity: "Validité de Courbe",
    complete: "Complet",
    estimatedTime: "Temps Estimé",
    model: "Modèle",
    serial: "Série",
    firmware: "Firmware",
    moveIn: "Déplacer Vers l'Intérieur",
    moveOut: "Déplacer Vers l'Extérieur",

    // Additional filterwheel translations
    filterWheelMoving: "Roue à Filtres en Mouvement",

    // Missing keys
    emergencyStop: "Arrêt d'Urgence",
    refreshAll: "Actualiser Tout",
  },

  de: {
    // Navigation
    dashboard: "Dashboard",
    devices: "Geräte",
    sequence: "Sequenz",
    logs: "Protokolle",
    settings: "Einstellungen",
    home: "Startseite",

    // Equipment
    camera: "Kamera",
    mount: "Montierung",
    filterWheel: "Filterrad",
    focuser: "Fokussierer",
    equipment: "Ausrüstung",
    equipmentStatus: "Gerätestatus",
    equipmentControl: "Gerätesteuerung",

    // Status
    connected: "Verbunden",
    disconnected: "Getrennt",
    error: "Fehler",
    running: "Läuft",
    stopped: "Gestoppt",
    paused: "Pausiert",
    active: "Aktiv",
    inactive: "Inaktiv",
    idle: "Leerlauf",
    moving: "Bewegt sich",

    // Camera
    cameraControl: "Kamerasteuerung",
    cameraStatus: "Kamerastatus",
    exposure: "Belichtung",
    exposureTime: "Belichtungszeit",
    iso: "ISO",
    gain: "Verstärkung",
    offset: "Offset",
    binning: "Binning",
    frameType: "Frame-Typ",
    imageFormat: "Bildformat",
    cooling: "Kühlung",
    coolingEnabled: "Kühlung Aktiviert",
    temperature: "Temperatur",
    currentTemp: "Aktuelle Temp.",
    targetTemp: "Ziel-Temp.",
    coolingPower: "Kühlleistung",
    capture: "Aufnehmen",
    capturing: "Aufnahme läuft",
    abort: "Abbrechen",
    liveView: "Live-Ansicht",
    download: "Herunterladen",
    quickCapture: "Schnellaufnahme",
    exposureSettings: "Belichtungseinstellungen",
    cameraSettings: "Kameraeinstellungen",

    // Mount
    mountControl: "Montierungssteuerung",
    mountStatus: "Montierungsstatus",
    rightAscension: "Rektaszension",
    declination: "Deklination",
    altitude: "Höhe",
    azimuth: "Azimut",
    tracking: "Nachführung",
    slewing: "Schwenkt",
    parked: "Geparkt",
    aligned: "Ausgerichtet",
    guiding: "Führung",
    slewControl: "Schwenksteuerung",
    quickTargets: "Schnellziele",
    popularTargets: "Beliebte Ziele",
    slewToTarget: "Zu Ziel schwenken",
    manualControl: "Manuelle Steuerung",
    slewRate: "Schwenkgeschwindigkeit",
    trackingRate: "Nachführgeschwindigkeit",
    enableTracking: "Nachführung aktivieren",
    enableGuiding: "Führung aktivieren",
    park: "Parken",
    unpark: "Entparken",
    homePosition: "Startposition",

    // Filter Wheel
    filterWheelStatus: "Filterradstatus",
    filterSelection: "Filterauswahl",
    position: "Position",
    current: "Aktuell",
    installedFilters: "Installierte Filter",
    available: "Verfügbar",

    // Focuser
    focuserControl: "Fokussierersteuerung",
    focuserStatus: "Fokussiererstatus",
    currentPosition: "Aktuelle Position",
    manualFocusControl: "Manuelle Fokussteuerung",
    stepSize: "Schrittgröße",
    targetPosition: "Zielposition",
    moveToPosition: "Zu Position bewegen",
    autoFocus: "Autofokus",
    startAutoFocus: "Autofokus starten",
    bestPosition: "Beste Position",
    bestHFR: "Bester HFR",
    focusCurve: "Fokuskurve",
    samples: "Proben",

    // Sequence
    sequenceStatus: "Sequenzstatus",
    sequenceSteps: "Sequenzschritte",
    sequenceLibrary: "Sequenzbibliothek",
    addStep: "Schritt hinzufügen",
    elapsed: "Vergangen",
    remaining: "Verbleibend",
    start: "Start",
    pause: "Pause",
    resume: "Fortsetzen",
    stop: "Stopp",
    reset: "Zurücksetzen",
    progress: "Fortschritt",
    eta: "Geschätzte Zeit",

    // Environmental
    environmentalConditions: "Umgebungsbedingungen",
    humidity: "Luftfeuchtigkeit",
    pressure: "Druck",
    skyQuality: "Himmelqualität",

    // Actions
    quickActions: "Schnellaktionen",
    testShot: "Testaufnahme",
    saveProfile: "Profil speichern",
    viewLogs: "Protokolle anzeigen",
    connectAll: "Alle verbinden",
    disconnectAll: "Alle trennen",
    refreshStatus: "Status aktualisieren",
    testAll: "Alle testen",

    // Settings
    connectionSettings: "Verbindungseinstellungen",
    userInterface: "Benutzeroberfläche",
    safetySettings: "Sicherheitseinstellungen",
    protocol: "Protokoll",
    interface: "Schnittstelle",
    hostAddress: "Host-Adresse",
    port: "Port",
    theme: "Design",
    light: "Hell",
    dark: "Dunkel",
    auto: "Automatisch",
    units: "Einheiten",
    metric: "Metrisch",
    imperial: "Imperial",
    enableNotifications: "Benachrichtigungen aktivieren",
    enableSounds: "Töne aktivieren",
    volume: "Lautstärke",
    parkOnDisconnect: "Bei Trennung parken",
    stopOnError: "Bei Fehler stoppen",
    saveSettings: "Einstellungen speichern",
    resetToDefaults: "Auf Standard zurücksetzen",

    // Logs
    logStatistics: "Protokollstatistiken",
    totalLogs: "Gesamte Protokolle",
    errors: "Fehler",
    warnings: "Warnungen",
    success: "Erfolg",
    logViewer: "Protokollbetrachter",
    levelFilter: "Levelfilter",
    categoryFilter: "Kategoriefilter",
    allLevels: "Alle Level",
    allCategories: "Alle Kategorien",
    system: "System",
    export: "Exportieren",
    clear: "Löschen",

    // Common
    on: "Ein",
    off: "Aus",
    yes: "Ja",
    no: "Nein",
    cancel: "Abbrechen",
    save: "Speichern",
    load: "Laden",
    edit: "Bearbeiten",
    delete: "Löschen",
    create: "Erstellen",
    close: "Schließen",
    back: "Zurück",
    next: "Weiter",
    previous: "Vorherige",

    // Swipe
    swipeToNavigate: "Wischen zum Navigieren",
    swipeLeftRight: "Wischen Sie nach links oder rechts, um zwischen Geräten zu navigieren",

    // Units
    seconds: "Sekunden",
    minutes: "Minuten",
    hours: "Stunden",
    celsius: "°C",
    fahrenheit: "°F",
    pixels: "Pixel",
    steps: "Schritte",
    percent: "%",

    // Additional focuser translations
    curveQuality: "Kurvenqualität",
    good: "Gut",
    poor: "Schlecht",
    confidence: "Vertrauen",
    minHFR: "Min HFR",
    maxHFR: "Max HFR",
    range: "Bereich",
    started: "Gestartet",
    completed: "Abgeschlossen",
    duration: "Dauer",
    validCurve: "Gültige Kurve",
    invalidCurve: "Ungültige Kurve",
    showing: "Anzeige",
    dataPoints: "Datenpunkte",
    bestFocus: "Bester Fokus",
    optimalFocus: "Optimaler Fokus",
    coefficient: "Koeffizient",
    leftSlope: "Linke Steigung",
    rightSlope: "Rechte Steigung",
    sampleData: "Beispieldaten",
    stars: "Sterne",
    qualityAssessment: "Qualitätsbewertung",
    curveValidity: "Kurvengültigkeit",
    complete: "Vollständig",
    estimatedTime: "Geschätzte Zeit",
    model: "Modell",
    serial: "Serie",
    firmware: "Firmware",
    moveIn: "Nach Innen Bewegen",
    moveOut: "Nach Außen Bewegen",

    // Additional filterwheel translations
    filterWheelMoving: "Filterrad Bewegt Sich",

    // Missing keys
    emergencyStop: "Notfall-Stopp",
    refreshAll: "Alle Aktualisieren",
  },

  zh: {
    // Navigation
    dashboard: "仪表板",
    devices: "设备",
    sequence: "序列",
    logs: "日志",
    settings: "设置",
    home: "主页",

    // Equipment
    camera: "相机",
    mount: "赤道仪",
    filterWheel: "滤镜轮",
    focuser: "调焦器",
    equipment: "设备",
    equipmentStatus: "设备状态",
    equipmentControl: "设备控制",

    // Status
    connected: "已连接",
    disconnected: "已断开",
    error: "错误",
    running: "运行中",
    stopped: "已停止",
    paused: "已暂停",
    active: "活动",
    inactive: "非活动",
    idle: "空闲",
    moving: "移动中",

    // Camera
    cameraControl: "相机控制",
    cameraStatus: "相机状态",
    exposure: "曝光",
    exposureTime: "曝光时间",
    iso: "ISO",
    gain: "增益",
    offset: "偏移",
    binning: "像素合并",
    frameType: "帧类型",
    imageFormat: "图像格式",
    cooling: "制冷",
    coolingEnabled: "制冷已启用",
    temperature: "温度",
    currentTemp: "当前温度",
    targetTemp: "目标温度",
    coolingPower: "制冷功率",
    capture: "拍摄",
    capturing: "拍摄中",
    abort: "中止",
    liveView: "实时预览",
    download: "下载",
    quickCapture: "快速拍摄",
    exposureSettings: "曝光设置",
    cameraSettings: "相机设置",

    // Mount
    mountControl: "赤道仪控制",
    mountStatus: "赤道仪状态",
    rightAscension: "赤经",
    declination: "赤纬",
    altitude: "高度角",
    azimuth: "方位角",
    tracking: "跟踪",
    slewing: "转动中",
    parked: "已停靠",
    aligned: "已对齐",
    guiding: "导星",
    slewControl: "转动控制",
    quickTargets: "快速目标",
    popularTargets: "热门目标",
    slewToTarget: "转到目标",
    manualControl: "手动控制",
    slewRate: "转动速度",
    trackingRate: "跟踪速度",
    enableTracking: "启用跟踪",
    enableGuiding: "启用导星",
    park: "停靠",
    unpark: "取消停靠",
    homePosition: "原点位置",

    // Filter Wheel
    filterWheelStatus: "滤镜轮状态",
    filterSelection: "滤镜选择",
    position: "位置",
    current: "当前",
    installedFilters: "已安装滤镜",
    available: "可用",

    // Focuser
    focuserControl: "调焦器控制",
    focuserStatus: "调焦器状态",
    currentPosition: "当前位置",
    manualFocusControl: "手动调焦控制",
    stepSize: "步长",
    targetPosition: "目标位置",
    moveToPosition: "移动到位置",
    autoFocus: "自动调焦",
    startAutoFocus: "开始自动调焦",
    bestPosition: "最佳位置",
    bestHFR: "最佳HFR",
    focusCurve: "调焦曲线",
    samples: "样本",

    // Sequence
    sequenceStatus: "序列状态",
    sequenceSteps: "序列步骤",
    sequenceLibrary: "序列库",
    addStep: "添加步骤",
    elapsed: "已用时",
    remaining: "剩余时间",
    start: "开始",
    pause: "暂停",
    resume: "继续",
    stop: "停止",
    reset: "重置",
    progress: "进度",
    eta: "预计时间",

    // Environmental
    environmentalConditions: "环境条件",
    humidity: "湿度",
    pressure: "气压",
    skyQuality: "天空质量",

    // Actions
    quickActions: "快速操作",
    testShot: "测试拍摄",
    saveProfile: "保存配置",
    viewLogs: "查看日志",
    connectAll: "连接所有",
    disconnectAll: "断开所有",
    refreshStatus: "刷新状态",
    testAll: "测试所有",

    // Settings
    connectionSettings: "连接设置",
    userInterface: "用户界面",
    safetySettings: "安全设置",
    protocol: "协议",
    interface: "接口",
    hostAddress: "主机地址",
    port: "端口",
    theme: "主题",
    light: "浅色",
    dark: "深色",
    auto: "自动",
    units: "单位",
    metric: "公制",
    imperial: "英制",
    enableNotifications: "启用通知",
    enableSounds: "启用声音",
    volume: "音量",
    parkOnDisconnect: "断开时停靠",
    stopOnError: "出错时停止",
    saveSettings: "保存设置",
    resetToDefaults: "重置为默认值",

    // Logs
    logStatistics: "日志统计",
    totalLogs: "总日志数",
    errors: "错误",
    warnings: "警告",
    success: "成功",
    logViewer: "日志查看器",
    levelFilter: "级别过滤",
    categoryFilter: "类别过滤",
    allLevels: "所有级别",
    allCategories: "所有类别",
    system: "系统",
    export: "导出",
    clear: "清除",

    // Common
    on: "开",
    off: "关",
    yes: "是",
    no: "否",
    cancel: "取消",
    save: "保存",
    load: "加载",
    edit: "编辑",
    delete: "删除",
    create: "创建",
    close: "关闭",
    back: "返回",
    next: "下一个",
    previous: "上一个",

    // Swipe
    swipeToNavigate: "滑动导航",
    swipeLeftRight: "左右滑动在设备间导航",

    // Units
    seconds: "秒",
    minutes: "分钟",
    hours: "小时",
    celsius: "°C",
    fahrenheit: "°F",
    pixels: "像素",
    steps: "步",
    percent: "%",

    // Additional focuser translations
    curveQuality: "曲线质量",
    good: "良好",
    poor: "较差",
    confidence: "置信度",
    minHFR: "最小HFR",
    maxHFR: "最大HFR",
    range: "范围",
    started: "已开始",
    completed: "已完成",
    duration: "持续时间",
    validCurve: "有效曲线",
    invalidCurve: "无效曲线",
    showing: "显示",
    dataPoints: "数据点",
    bestFocus: "最佳焦点",
    optimalFocus: "最优焦点",
    coefficient: "系数",
    leftSlope: "左斜率",
    rightSlope: "右斜率",
    sampleData: "样本数据",
    stars: "星点",
    qualityAssessment: "质量评估",
    curveValidity: "曲线有效性",
    complete: "完成",
    estimatedTime: "预计时间",
    model: "型号",
    serial: "序列号",
    firmware: "固件",
    moveIn: "向内移动",
    moveOut: "向外移动",

    // Additional filterwheel translations
    filterWheelMoving: "滤镜轮移动中",

    // Missing keys
    emergencyStop: "紧急停止",
    refreshAll: "刷新全部",
  },

  ja: {
    // Navigation
    dashboard: "ダッシュボード",
    devices: "デバイス",
    sequence: "シーケンス",
    logs: "ログ",
    settings: "設定",
    home: "ホーム",

    // Equipment
    camera: "カメラ",
    mount: "マウント",
    filterWheel: "フィルターホイール",
    focuser: "フォーカサー",
    equipment: "機器",
    equipmentStatus: "機器ステータス",
    equipmentControl: "機器制御",

    // Status
    connected: "接続済み",
    disconnected: "切断済み",
    error: "エラー",
    running: "実行中",
    stopped: "停止",
    paused: "一時停止",
    active: "アクティブ",
    inactive: "非アクティブ",
    idle: "待機中",
    moving: "移動中",

    // Camera
    cameraControl: "カメラ制御",
    cameraStatus: "カメラステータス",
    exposure: "露出",
    exposureTime: "露出時間",
    iso: "ISO",
    gain: "ゲイン",
    offset: "オフセット",
    binning: "ビニング",
    frameType: "フレームタイプ",
    imageFormat: "画像フォーマット",
    cooling: "冷却",
    coolingEnabled: "冷却有効",
    temperature: "温度",
    currentTemp: "現在温度",
    targetTemp: "目標温度",
    coolingPower: "冷却パワー",
    capture: "撮影",
    capturing: "撮影中",
    abort: "中止",
    liveView: "ライブビュー",
    download: "ダウンロード",
    quickCapture: "クイック撮影",
    exposureSettings: "露出設定",
    cameraSettings: "カメラ設定",

    // Mount
    mountControl: "マウント制御",
    mountStatus: "マウントステータス",
    rightAscension: "赤経",
    declination: "赤緯",
    altitude: "高度",
    azimuth: "方位角",
    tracking: "追尾",
    slewing: "移動中",
    parked: "パーク済み",
    aligned: "アライメント済み",
    guiding: "ガイド",
    slewControl: "移動制御",
    quickTargets: "クイックターゲット",
    popularTargets: "人気ターゲット",
    slewToTarget: "ターゲットへ移動",
    manualControl: "手動制御",
    slewRate: "移動速度",
    trackingRate: "追尾速度",
    enableTracking: "追尾を有効にする",
    enableGuiding: "ガイドを有効にする",
    park: "パーク",
    unpark: "パーク解除",
    homePosition: "ホームポジション",

    // Filter Wheel
    filterWheelStatus: "フィルターホイールステータス",
    filterSelection: "フィルター選択",
    position: "位置",
    current: "現在",
    installedFilters: "インストール済みフィルター",
    available: "利用可能",

    // Focuser
    focuserControl: "フォーカサー制御",
    focuserStatus: "フォーカサーステータス",
    currentPosition: "現在位置",
    manualFocusControl: "手動フォーカス制御",
    stepSize: "ステップサイズ",
    targetPosition: "目標位置",
    moveToPosition: "位置へ移動",
    autoFocus: "オートフォーカス",
    startAutoFocus: "オートフォーカス開始",
    bestPosition: "最適位置",
    bestHFR: "最適HFR",
    focusCurve: "フォーカスカーブ",
    samples: "サンプル",

    // Sequence
    sequenceStatus: "シーケンスステータス",
    sequenceSteps: "シーケンスステップ",
    sequenceLibrary: "シーケンスライブラリ",
    addStep: "ステップ追加",
    elapsed: "経過時間",
    remaining: "残り時間",
    start: "開始",
    pause: "一時停止",
    resume: "再開",
    stop: "停止",
    reset: "リセット",
    progress: "進行状況",
    eta: "予想時間",

    // Environmental
    environmentalConditions: "環境条件",
    humidity: "湿度",
    pressure: "気圧",
    skyQuality: "空の品質",

    // Actions
    quickActions: "クイックアクション",
    testShot: "テスト撮影",
    saveProfile: "プロファイル保存",
    viewLogs: "ログ表示",
    connectAll: "すべて接続",
    disconnectAll: "すべて切断",
    refreshStatus: "ステータス更新",
    testAll: "すべてテスト",

    // Settings
    connectionSettings: "接続設定",
    userInterface: "ユーザーインターフェース",
    safetySettings: "安全設定",
    protocol: "プロトコル",
    interface: "インターフェース",
    hostAddress: "ホストアドレス",
    port: "ポート",
    theme: "テーマ",
    light: "ライト",
    dark: "ダーク",
    auto: "自動",
    units: "単位",
    metric: "メートル法",
    imperial: "ヤード・ポンド法",
    enableNotifications: "通知を有効にする",
    enableSounds: "サウンドを有効にする",
    volume: "音量",
    parkOnDisconnect: "切断時にパーク",
    stopOnError: "エラー時に停止",
    saveSettings: "設定を保存",
    resetToDefaults: "デフォルトにリセット",

    // Logs
    logStatistics: "ログ統計",
    totalLogs: "総ログ数",
    errors: "エラー",
    warnings: "警告",
    success: "成功",
    logViewer: "ログビューアー",
    levelFilter: "レベルフィルター",
    categoryFilter: "カテゴリフィルター",
    allLevels: "すべてのレベル",
    allCategories: "すべてのカテゴリ",
    system: "システム",
    export: "エクスポート",
    clear: "クリア",

    // Common
    on: "オン",
    off: "オフ",
    yes: "はい",
    no: "いいえ",
    cancel: "キャンセル",
    save: "保存",
    load: "読み込み",
    edit: "編集",
    delete: "削除",
    create: "作成",
    close: "閉じる",
    back: "戻る",
    next: "次へ",
    previous: "前へ",

    // Swipe
    swipeToNavigate: "スワイプでナビゲート",
    swipeLeftRight: "左右にスワイプしてデバイス間を移動",

    // Units
    seconds: "秒",
    minutes: "分",
    hours: "時間",
    celsius: "°C",
    fahrenheit: "°F",
    pixels: "ピクセル",
    steps: "ステップ",
    percent: "%",

    // Additional focuser translations
    curveQuality: "カーブ品質",
    good: "良好",
    poor: "不良",
    confidence: "信頼度",
    minHFR: "最小HFR",
    maxHFR: "最大HFR",
    range: "範囲",
    started: "開始済み",
    completed: "完了",
    duration: "継続時間",
    validCurve: "有効なカーブ",
    invalidCurve: "無効なカーブ",
    showing: "表示中",
    dataPoints: "データポイント",
    bestFocus: "ベストフォーカス",
    optimalFocus: "最適フォーカス",
    coefficient: "係数",
    leftSlope: "左傾斜",
    rightSlope: "右傾斜",
    sampleData: "サンプルデータ",
    stars: "星",
    qualityAssessment: "品質評価",
    curveValidity: "カーブ有効性",
    complete: "完了",
    estimatedTime: "推定時間",
    model: "モデル",
    serial: "シリアル",
    firmware: "ファームウェア",
    moveIn: "内側に移動",
    moveOut: "外側に移動",

    // Additional filterwheel translations
    filterWheelMoving: "フィルターホイール移動中",

    // Missing keys
    emergencyStop: "緊急停止",
    refreshAll: "すべて更新",
  },
}

export function useTranslation() {
  const language = useAppStore((state) => state.language)

  const t = (key: keyof Translations): string => {
    return translations[language][key] || translations.en[key] || key
  }

  return { t, language }
}

export function getAvailableLanguages(): Array<{ code: Language; name: string; nativeName: string }> {
  return [
    { code: "en", name: "English", nativeName: "English" },
    { code: "es", name: "Spanish", nativeName: "Español" },
    { code: "fr", name: "French", nativeName: "Français" },
    { code: "de", name: "German", nativeName: "Deutsch" },
    { code: "zh", name: "Chinese", nativeName: "中文" },
    { code: "ja", name: "Japanese", nativeName: "日本語" },
  ]
}
