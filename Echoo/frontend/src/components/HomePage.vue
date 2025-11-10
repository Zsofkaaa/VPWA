<template>
  <div class="homepage-container">
    <div class="welcome-content">
      <!-- Logo/Icon -->
      <div class="logo-section">
        <img
            v-if="!$q.screen.lt.md"
            src="/pictures/logo.jpg"
            alt="Logo"
            class="rounded-borders"
            style="height: 120px;"
        />
      </div>

      <!-- Welcome Text -->
      <div class="text-section">
        <h1 class="welcome-title">Welcome to Echoo</h1>
        <p class="welcome-subtitle">
          Select a channel from the sidebar to start chatting
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
</script>

<style scoped>

.homepage-container {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%);
}

.welcome-content {
  max-width: 900px;
  width: 100%;
  text-align: center;
}

.logo-section {
  margin-bottom: 2rem;
  animation: fadeInDown 0.8s ease-out;
}

.text-section {
  margin-bottom: 3rem;
  animation: fadeIn 1s ease-out 0.2s both;
}

.welcome-title {
  font-size: 3rem;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.welcome-subtitle {
  font-size: 1.25rem;
  color: #b0b0b0;
  margin: 0;
}

/* ANIMÁCIE */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* RESPONSIVE */
@media (max-width: 768px) {
  .welcome-title {
    font-size: 2rem;
  }

  .welcome-subtitle {
    font-size: 1rem;
  }
}
</style>