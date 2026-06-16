/* ============================================================
   CONFIGURAÇÃO DO FIREBASE
   ------------------------------------------------------------
   Enquanto este arquivo estiver com os valores "COLE_AQUI",
   a plataforma roda em MODO LOCAL (o progresso fica só no
   navegador). Isso é ótimo para testar.

   Para LIGAR o painel central (você ver a % de todas as
   secretárias de qualquer lugar), siga o README e cole abaixo
   a configuração do seu projeto Firebase.
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey:            "COLE_AQUI",
  authDomain:        "COLE_AQUI",
  projectId:         "COLE_AQUI",
  storageBucket:     "COLE_AQUI",
  messagingSenderId: "COLE_AQUI",
  appId:             "COLE_AQUI",
};

// Não precisa mexer aqui:
const FIREBASE_READY = Object.values(FIREBASE_CONFIG).every(
  (v) => v && v !== "COLE_AQUI"
);
