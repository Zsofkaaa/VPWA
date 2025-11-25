<template>
  <div class="homepage-container">

    <div class="welcome-card">

      <!-- Sekcia loga – zobrazuje sa iba na väčších obrazovkách -->
      <div class="logo-section">
        <img
          v-if="!$q.screen.lt.md"
          src="/pictures/logo_transparent.png"
          alt="Echoo Logo"
          class="logo"
        />
      </div>

      <!-- Textová sekcia s nadpisom a podnadpisom -->
      <div class="text-section">
        <h1 class="welcome-title">Welcome to <span>Echoo</span></h1>

        <!-- Krátka inštrukcia pre používateľa -->
        <p class="welcome-subtitle">
          <strong>Select</strong> a channel from the sidebar to start chatting
          or <strong>Create</strong> your own channel!
        </p>
      </div>

    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar' // Quasar pre zistenie veľkosti obrazovky
const $q = useQuasar() // Inštancia Quasaru pre responsívne breakpointy
</script>

<style scoped>
/* Hlavný kontajner – centrovanie celého obsahu */
.homepage-container {
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1E1E1E;
  padding: 2rem;
}

/* Uvítacia karta so skleneným (glass) efektom */
.welcome-card {
  max-width: 800px;
  width: 100%;
  text-align: center;
  padding: 3rem 2rem;
  border-radius: 20px;

  /* Polopriehľadné pozadie a rozmazanie */
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(12px);

  /* Tieň pre vizuálnu hĺbku */
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);

  animation: fadeInUp 1s ease-out;
  border: 1px solid rgba(255,255,255,0.1);
}

/* Logo aplikácie */
.logo {
  height: 120px;
  border-radius: 15px;
}

/* Sekcia textu */
.text-section {
  margin-bottom: 2rem;
  animation: fadeIn 1s ease-out 0.2s both;
}

/* Hlavný nadpis */
.welcome-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: #ffffff;
}

/* Farebný prechod pre časť textu */
.welcome-title span {
  background: linear-gradient(180deg,
    #b97a9a, #816b91, #4e74a3, #5988c0);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Podnadpis */
.welcome-subtitle {
  font-size: 1.2rem;
  color: #cbd5e1;
  line-height: 1.6;
}

/* Jemná fade-in animácia */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Animácia smerom nahor */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responzívne úpravy pre menšie zariadenia */
@media (max-width: 768px) {
  .welcome-title { font-size: 2rem; }
  .welcome-subtitle { font-size: 1rem; }
  .logo { height: 100px; }
}
</style>
