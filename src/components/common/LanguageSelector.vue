<template>

  <div class="language-selector">

    <!-- 预加载所有国旗图标 -->

    <div class="preload-flags" v-once>


      <img :src="require('@/assets/i18N/CN.svg')" alt="中文" class="preload-flag">

      <img :src="require('@/assets/i18N/GB.svg')" alt="English" class="preload-flag">


    </div>



    <button

      class="language-btn"

      @click="toggleDropdown"

      :title="$t('common.language')"

    >

      <span class="flag-icon">

        <transition name="flag-fade" mode="out-in">

          <span :key="currentLanguage" class="flag-container" v-html="getCurrentLanguageFlag()"></span>

        </transition>

      </span>

    </button>



    <transition name="fade">

      <div class="language-dropdown" v-if="isOpen" ref="dropdown">

        <div

          v-for="lang in languages"

          :key="lang.code"

          class="language-item"

          :class="{ 'active': currentLanguage === lang.code }"

          @click="changeLanguage(lang.code)"

        >

          <span class="flag-icon" v-html="lang.flag"></span>

          <span class="lang-name">{{ lang.name }}</span>

        </div>

      </div>

    </transition>

  </div>

</template>



<script>

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

import { useI18n } from 'vue-i18n';

import { setLanguage } from '@/i18n';



import cnFlag from '@/assets/i18N/CN.svg';

import gbFlag from '@/assets/i18N/GB.svg';



export default {

  name: 'LanguageSelector',

  setup() {

    const { locale } = useI18n();

    const isOpen = ref(false);

    const dropdown = ref(null);



    const languages = [

      {

        code: 'zh-CN',

        name: '简体中文',

        flag: `<img src="${cnFlag}" alt="简体中文" class="flag-image" style="width: 100%; height: 100%; object-fit: cover;">`

      },

      {

        code: 'en-US',

        name: 'English',

        flag: `<img src="${gbFlag}" alt="English" class="flag-image" style="width: 100%; height: 100%; object-fit: cover;">`

      },

    ];



    const currentLanguage = computed(() => locale.value);



    const getCurrentLanguageFlag = () => {

      const lang = languages.find(l => l.code === currentLanguage.value);

      return lang ? lang.flag : '';

    };



    const toggleDropdown = () => {

      isOpen.value = !isOpen.value;



      if (isOpen.value) {

        nextTick(() => {

          if (dropdown.value) {

            const rect = dropdown.value.getBoundingClientRect();

            if (rect.right > window.innerWidth) {

              dropdown.value.style.right = '0';

              dropdown.value.style.left = 'auto';

            }

            if (rect.bottom > window.innerHeight) {

              dropdown.value.style.bottom = 'calc(100% + 8px)';

              dropdown.value.style.top = 'auto';

            }

          }

        });

      }

    };



    const changeLanguage = (langCode) => {

      setLanguage(langCode);

      isOpen.value = false;



      const event = new CustomEvent('languageChanged', { detail: langCode });

      window.dispatchEvent(event);

    };



    const handleClickOutside = (event) => {

      const selector = document.querySelector('.language-selector');

      if (selector && !selector.contains(event.target)) {

        isOpen.value = false;

      }

    };



    onMounted(() => {

      document.addEventListener('click', handleClickOutside);

    });



    onUnmounted(() => {

      document.removeEventListener('click', handleClickOutside);

    });



    return {

      isOpen,

      languages,

      currentLanguage,

      toggleDropdown,

      changeLanguage,

      dropdown,

      getCurrentLanguageFlag

    };

  }

};

</script>



<style lang="scss" scoped>

.language-selector {

  position: relative;

  display: inline-block;

}



.preload-flags {

  position: absolute;

  width: 0;

  height: 0;

  overflow: hidden;

  opacity: 0;

  pointer-events: none;

  z-index: -1000;



  .preload-flag {

    width: 1px;

    height: 1px;

  }

}



.language-btn {

  display: flex;

  align-items: center;

  justify-content: center;

  width: 40px;

  height: 40px;

  border-radius: 50%;

  background-color: var(--card-background);

  border: 1px solid var(--border-color);

  color: var(--text-color);

  cursor: pointer;

  transition: all 0.3s ease;

  padding: 6px;

  overflow: hidden;

  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);



  &:hover {

    background-color: rgba(var(--theme-color-rgb), 0.1);

    border-color: var(--theme-color);

    transform: translateY(-2px);

    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);

  }



  .flag-icon {

    width: 100%;

    height: 100%;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 50%;

    overflow: hidden;



    .flag-container {

      width: 100%;

      height: 100%;

      display: flex;

      align-items: center;

      justify-content: center;

    }



    img {

      width: 100%;

      height: 100%;

      object-fit: cover;

      border-radius: 50%;

      box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.04);

      transition: transform 0.3s ease, opacity 0.3s ease;

    }



    svg {

      width: 100%;

      height: 100%;

      object-fit: cover;

      transition: transform 0.3s ease, opacity 0.3s ease;

    }

  }

}



.language-dropdown {

  position: absolute;

  top: calc(100% + 8px);

  right: 0;

  min-width: 130px;

  background: rgba(var(--card-background-rgb), 0.9);

  backdrop-filter: blur(10px);

  -webkit-backdrop-filter: blur(10px);

  border-radius: 12px;

  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

  border: 1px solid var(--border-color);

  z-index: 200;

  overflow: hidden;

}



.language-item {

  padding: 12px 16px;

  cursor: pointer;

  transition: all 0.2s ease;

  white-space: nowrap;

  font-size: 14px;

  display: flex;

  align-items: center;

  gap: 12px;



  .flag-icon {

    width: 24px;

    height: 16px;

    flex-shrink: 0;

    display: flex;

    align-items: center;

    justify-content: center;

    border-radius: 3px;

    overflow: hidden;

    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);



    img {

      width: 100%;

      height: 100%;

      object-fit: cover;

      border-radius: 3px;

    }



    svg {

      width: 100%;

      height: 100%;

      object-fit: cover;

    }

  }



  &:hover {

    background-color: rgba(var(--theme-color-rgb), 0.1);

  }



  &.active {

    background-color: rgba(var(--theme-color-rgb), 0.2);

    color: var(--theme-color);

    font-weight: 500;

  }

}



.fade-enter-active,

.fade-leave-active {

  transition: opacity 0.3s ease, transform 0.3s ease;

}



.fade-enter-from,

.fade-leave-to {

  opacity: 0;

  transform: translateY(-10px);

}



.flag-fade-enter-active,

.flag-fade-leave-active {

  transition: opacity 0.3s ease, transform 0.3s ease;

}



.flag-fade-enter-from {

  opacity: 0;

  transform: scale(0.8);

}



.flag-fade-leave-to {

  opacity: 0;

  transform: scale(1.2);

}



@media (max-width: 576px) {

}

</style>
