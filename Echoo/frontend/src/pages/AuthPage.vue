<template>
  <!-- Hlavná stránka autentifikácie -->
  <q-page class="auth-wrapper">
    <!-- Ľavý pruh (vizuálny efekt) -->
    <div class="left-strip"></div>

    <!-- Karta s prihlasovacím / registračným formulárom -->
    <q-card class="auth-card">
      <h1 class="hero">{{ mode === 'login' ? 'WELCOME!' : 'REGISTRATION' }}</h1>
      <p class="lead">{{ mode === 'login' ? 'LOGIN HERE' : 'Create your account' }}</p>

      <!-- Chybová správa -->
      <q-banner v-if="authError" class="error-banner">
        {{ authError }}
      </q-banner>

      <!-- Formulár, zabraňuje default submit -->
      <q-form @submit.prevent="onSubmit">

        <!-- PRIHLÁSENIE -->
        <div v-if="mode === 'login'" class="form-column">
          <q-input dense filled v-model="login.email" placeholder="Email" class="pill-input" :disabled="authLoading" />
          <q-input dense filled v-model="login.password" placeholder="Password" type="password" class="pill-input" :disabled="authLoading" />
          <div class="row actions-row">
            <q-btn unelevated class="action-btn" label="Login" @click.prevent="onLogin" :loading="authLoading" :disabled="authLoading" />
          </div>
        </div>

        <!-- REGISTRÁCIA -->
        <div v-else class="form-grid">
          <q-input dense filled v-model="reg.firstName" placeholder="First name" class="pill-input" :disabled="authLoading" />
          <q-input dense filled v-model="reg.lastName" placeholder="Last name" class="pill-input" :disabled="authLoading" />
          <q-input dense filled v-model="reg.nickname" placeholder="Nick name" class="pill-input" :disabled="authLoading" />
          <q-input dense filled v-model="reg.email" placeholder="Email" class="pill-input" :disabled="authLoading" />
          <q-input dense filled v-model="reg.password" placeholder="Password" type="password" class="pill-input" :disabled="authLoading" />
          <q-input dense filled v-model="reg.password2" placeholder="Password again" type="password" class="pill-input" :disabled="authLoading" />
          <div class="row actions-row">
            <q-btn unelevated class="action-btn" label="Register now!" @click.prevent="onRegister" :loading="authLoading" :disabled="authLoading" />
          </div>
        </div>
      </q-form>

      <!-- Odkaz pre prepínanie medzi login a register -->
      <div class="switch-link">
        <a @click.prevent="toggleMode">
          {{ mode === 'login' ? "DON'T HAVE AN ACCOUNT? CREATE YOUR ACCOUNT HERE" : 'ALREADY HAVE AN ACCOUNT? LOGIN HERE' }}
        </a>
      </div>
    </q-card>
  </q-page>
</template>



<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { Notify, useQuasar } from 'quasar';
const router = useRouter();
const $q = useQuasar();
const { login: authLogin, register: authRegister, loading: authLoading, error: authError } = useAuth();

const mode = ref<'login' | 'register'>('login');

const login = ref({ email: '', password: '' });
const reg = ref({ 
  firstName: '', 
  lastName: '', 
  nickname: '', 
  email: '', 
  password: '', 
  password2: '' 
});

function toggleMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login';
  authError.value = null; // Vyčistenie chybovej správy
}

function validateLogin() {
  if (!login.value.email || !login.value.password) {
    $q.notify({
      type: 'negative',
      message: 'Please fill email and password'
    });
    return false;
  }
  return true;
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]{3,}@[^\s@]{3,}\.[^\s@]{2,}$/;
  return emailRegex.test(email);
}

function validateRegister() {
  if (!reg.value.firstName || !reg.value.lastName || !reg.value.nickname || 
      !reg.value.email || !reg.value.password) {
    $q.notify({
      type: 'negative',
      message: 'Please fill all required fields'
    });
    return false;
  }

  if (!validateEmail(reg.value.email)) {
    $q.notify({
      type: 'negative',
      message: 'Invalid email format'
    });
    return false;
  }

  if (reg.value.password.length < 8) {
    $q.notify({
      type: 'negative',
      message: 'Password must be at least 8 characters long'
    });
    return false;
  }

  if (reg.value.password !== reg.value.password2) {
    $q.notify({
      type: 'negative',
      message: "Passwords don't match"
    });
    return false;
  }
  return true;
}

async function onLogin() {
  if (!validateLogin()) return;
  
  const success = await authLogin(login.value);
  
  if (success) {
    Notify.create({
      type: 'positive',
      message: 'Login successful!'
    });
    await router.push('/chat');
  }
  // NE mutass error notification-t, mert már a banner mutatja
}

async function onRegister() {
  if (!validateRegister()) return;
  
  const registerData = {
    firstName: reg.value.firstName,
    lastName: reg.value.lastName,
    nickname: reg.value.nickname,
    email: reg.value.email,
    password: reg.value.password
  };
  
  const success = await authRegister(registerData);
  
  if (success) {
    Notify.create({
      type: 'positive',
      message: 'Registration successful! Please log in.'
    });

    // 🌟 Visszaállunk login módra
    mode.value = 'login';

    // 🌟 Töröljük a mezőket
    reg.value = {
      firstName: '',
      lastName: '',
      nickname: '',
      email: '',
      password: '',
      password2: ''
    };

    // esetleg: email beírva maradhat automatikusan
    login.value.email = registerData.email;
  }
}


async function onSubmit() {
  if (mode.value === 'login') {
    await onLogin();
  } else {
    await onRegister();
  }
}
</script>



<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Alfa+Slab+One&family=Montserrat:wght@400;700&display=swap');

.auth-wrapper {
  /* Hlavný wrapper stránky autentifikácie */
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100vw;
  height: 100vh;
  min-height: 520px;
  background: #e6eaee;
}

/* Ľavý farebný pruh */
.left-strip {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 35%;
  background: #243746;
  z-index: 1;
}

/* Karta formulára */
.auth-card {
  width: 820px;
  max-width: 92%;
  padding: 28px;
  border-radius: 10px;
  background: #36506a;
  color: #ffffff;
  box-shadow: 8px 10px 20px rgba(0,0,0,0.35);
  z-index: 2; /* above left-strip */
  font-size: 1rem; /* sets base for child scaling if needed */
}

/* Nadpis */
.hero {
  font-family: 'Alfa Slab One', serif;
  font-size: min(9vw, 72px); /* max 72px, scales down smoothly */
  line-height: 1.1;
  text-align: center;
  letter-spacing: 1px;
  margin: 6px 0;
}

/* Podnadpis */
.lead {
  font-family: 'Montserrat', sans-serif;
  font-weight: 700;
  text-align: center;
}

/* Štýl vstupov */
.pill-input {
  width: 54ch;
  max-width: 80%;
  border-radius: 22px;
  background: #e0e0e0;
  box-shadow: -6px 6px 0 rgba(0,0,0,0.12);
}

/* LOGIN FORM */
.form-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  max-width: 520px;
  margin: 0 auto;
}

/* REGISTRATION FORM */
.form-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px 16px;
  margin: 0 auto;
}

.form-grid > .pill-input {
  max-width: 48%;
  box-sizing: border-box;
}

/* Riadok tlačidiel */
.actions-row {
  display: flex;
  justify-content: flex-end;
  width: 98%;
  margin-top: 6px;
}

/* Tlačidlá login/register */
.action-btn {
  background: #1f364a;
  color: #fff;
  border-radius: 22px;
  padding: 8px 18px;
  box-shadow: -6px 6px 0 rgba(0,0,0,0.12);
}

/* Link pre prepínanie medzi login a register */
.switch-link {
  margin-top: 18px;
  text-align: right;
  font-weight: 700;
}

.switch-link a {
  color: #ffffffa9;
  cursor: pointer;
  text-decoration: underline;
}

.error-banner {
  background: #ff0000ca !important;
  color: #ffffff !important;
  margin-bottom: 12px;
  padding: 8px 0px;
  border-radius: 22px !important;
  font-weight: 500;
  font-size: 13px;
  text-align: center;
}

/* RESPONZÍVNE ÚPRAVY */
@media (max-width: 700px) {
  .form-grid > .pill-input { max-width: 90%; }
  .actions-row { justify-content: center; }
}
</style>
