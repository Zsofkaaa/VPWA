<template>
  <div class="homepage-container">
    <div class="welcome-card">
      <!-- Logo / Icon -->
      <div class="logo-section">
        <img
          v-if="!$q.screen.lt.md"
          src="/pictures/logo_transparent.png"
          alt="Echoo Logo"
          class="logo"
        />
      </div>

      <!-- Welcome Text -->
      <div class="text-section">
        <h1 class="welcome-title">Welcome to <span>Echoo</span></h1>
        <p class="welcome-subtitle">
          <strong>Select</strong> a channel from the sidebar to start chatting or <strong>Create</strong> your own channel!
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useQuasar } from 'quasar'
const $q = useQuasar()
</script>

<style scoped>
.homepage-container {
  min-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1E1E1E;
  padding: 2rem;
}

.welcome-card {
  max-width: 800px;
  width: 100%;
  text-align: center;
  padding: 3rem 2rem;
  border-radius: 20px;

  /* Üveg hatás */
  background: rgba(30, 41, 59, 0.85);
  backdrop-filter: blur(12px);

  /* Árnyék a mélységhez */
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);

  animation: fadeInUp 1s ease-out;
  border: 1px solid rgba(255,255,255,0.1);
}

.logo {
  height: 120px;
  border-radius: 15px;
}

.text-section {
  margin-bottom: 2rem;
  animation: fadeIn 1s ease-out 0.2s both;
}

.welcome-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  color: #ffffff;
}

.welcome-title span {
  background: linear-gradient( 180deg,
    #b97a9a, #816b91, #4e74a3, #5988c0);
  background-clip: text;           /* standard property */
  -webkit-background-clip: text;   /* webkit prefix */
  -webkit-text-fill-color: transparent;
}

.welcome-subtitle {
  font-size: 1.2rem;
  color: #cbd5e1;
  line-height: 1.6;
}

/* Animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 768px) {
  .welcome-title { font-size: 2rem; }
  .welcome-subtitle { font-size: 1rem; }
  .logo { height: 100px; }
}
</style>
