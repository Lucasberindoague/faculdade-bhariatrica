/* ============================================================
   CONFIGURAÇÃO DO FIREBASE — Projeto: Faculdade Bhariatrica
   ------------------------------------------------------------
   Painel central LIGADO. Esta config Web é pública por design
   (a segurança vem das regras do Firestore + login anônimo).
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDcarg46j00SJERTlv4lbCqZiBa4gzuo3M",
  authDomain:        "faculdade-bhariatrica.firebaseapp.com",
  projectId:         "faculdade-bhariatrica",
  storageBucket:     "faculdade-bhariatrica.firebasestorage.app",
  messagingSenderId: "431699196170",
  appId:             "1:431699196170:web:0ed0e0070d50d3072d22f3",
};

// Não precisa mexer aqui:
const FIREBASE_READY = Object.values(FIREBASE_CONFIG).every(
  (v) => v && v !== "COLE_AQUI"
);
