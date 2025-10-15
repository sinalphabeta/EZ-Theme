<template>

  <!-- Crisp将会自动注入到页面，不需要特定的DOM元素 -->

  <!-- 添加一个包装容器，只是为了应用样式 -->

  <div class="crisp-embed-container" v-if="CONFIG.enabled">

    <!-- 通过JavaScript初始化Crisp，不需要视图内容 -->

  </div>

</template>



<script>

import { onMounted, onUnmounted, computed, watch, ref } from 'vue';

import { useStore } from 'vuex';

import { getUserInfo, getCommConfig, getUserSubscribe } from '@/api/user';

import { CUSTOMER_SERVICE_CONFIG } from '@/utils/baseConfig';

import { formatDate } from '@/utils/formatters';

import { Crisp } from 'crisp-sdk-web';



if (typeof window !== 'undefined') {

  window.CRISP_INITIALIZED = window.CRISP_INITIALIZED || false;

}



export default {

  name: 'CrispEmbed',

  

  setup() {

    const store = useStore();

    const userInfo = ref(null);

    const userSubscribe = ref(null);

    const currencySymbol = ref('¥'); 
    const crispInitialized = ref(window.CRISP_INITIALIZED || false);

    const isMobile = ref(false);

    

    const CONFIG = computed(() => {

      return {

        enabled: CUSTOMER_SERVICE_CONFIG.enabled && CUSTOMER_SERVICE_CONFIG.type === 'crisp' && CUSTOMER_SERVICE_CONFIG.embedMode === 'embed',

        iconPosition: CUSTOMER_SERVICE_CONFIG.iconPosition || {

          desktop: { right: '20px', bottom: '20px' },

          mobile: { right: '20px', bottom: '100px' }

        }

      };

    });

    

    const initCrisp = async () => {

      if (!CONFIG.value.enabled) return;

      

      if (window.CRISP_INITIALIZED && crispInitialized.value) {

        try {

          updateCrispConfig();

          return;

        } catch (error) {

          console.error('更新Crisp配置失败:', error);

        }

      }

      

      try {

        const crispIdMatch = CUSTOMER_SERVICE_CONFIG.customHtml?.match(/CRISP_WEBSITE_ID="([^"]*)"/);

        const websiteId = crispIdMatch ? crispIdMatch[1] : '';

        

        if (!websiteId) {

          console.error('无法从配置中提取Crisp ID');

          return;

        }



        Crisp.configure(websiteId);

        

        if (isMobile.value) {

          Crisp.setPosition("right");

        } else {

          Crisp.setPosition("right");

        }

        

        if (store.getters.isLoggedIn) {

          await fetchUserData();

          setUserDataToCrisp();

        }

        

        setCrispStyles();

        

        window.CRISP_INITIALIZED = true;

        crispInitialized.value = true;

        

      } catch (error) {

        console.error('初始化Crisp客服系统失败:', error);

      }

    };

    

    const updateCrispConfig = () => {

      if (isMobile.value) {

        Crisp.setPosition("right");

      } else {

        Crisp.setPosition("right");

      }

      

      setCrispStyles();

    };

    

    const setCrispStyles = () => {

      setTimeout(() => {

        try {

          const style = document.createElement('style');

          style.id = 'crisp-custom-styles';

          

          if (isMobile.value) {

            style.textContent = `

              

              .crisp-client .cc-1xry,

              .crisp-client .cc-7doi,

              .crisp-client .cc-imbb, 

              .crisp-client .cc-1drt,

              .crisp-client .cc-1jrn,

              .crisp-client [class^="cc-"] [data-visible="true"][data-is-failure="false"],

              .crisp-client [class^="cc-"] [data-compose="true"],

              .crisp-client [class^="cc-"] [data-maximized="false"]

               {

                transform: translateY(-80px) !important;

                bottom: 80px !important;

              }

            `;

          }

          

          const oldStyle = document.getElementById('crisp-custom-styles');

          if (oldStyle) {

            oldStyle.remove();

          }

          

          document.head.appendChild(style);

          

        } catch (error) {

          console.error('设置Crisp样式失败:', error);

        }

      }, 1000); 
    };

    

    const fetchUserData = async () => {

      try {

        const [userInfoResponse, commConfigResponse, subscribeResponse] = await Promise.all([

          getUserInfo(),

          getCommConfig(),

          getUserSubscribe()

        ]);

        

        userInfo.value = userInfoResponse.data ? userInfoResponse.data : userInfoResponse;

        

        const commConfigData = commConfigResponse.data ? commConfigResponse.data : commConfigResponse;

        if (commConfigData && commConfigData.currency_symbol) {

          currencySymbol.value = commConfigData.currency_symbol;

        }

        

        userSubscribe.value = subscribeResponse.data ? subscribeResponse.data : subscribeResponse;

      } catch (error) {

        console.error('获取用户信息失败:', error);

      }

    };

    

    const setUserDataToCrisp = () => {

      if (!crispInitialized.value) return;

      

      try {

        let userEmail = extractUserEmail();

        

        if (userEmail) {

          Crisp.user.setEmail(userEmail);

          const nickname = userEmail.split('@')[0];

          Crisp.user.setNickname(nickname);

        }

        

        const planName = extractPlanName();

        const expireDate = extractExpireDate();

        const remainingGB = calculateRemainingTraffic();

        const balance = extractBalance();

        

        const sessionData = {

          Email: userEmail || 'Unknown',

          Plan: planName,

          Expires: expireDate,

          Traffic: remainingGB + ' GB',

          Balance: balance + ' ' + currencySymbol.value

        };

        

        Crisp.session.setData(sessionData);

      } catch (error) {

        console.error('设置Crisp用户数据失败:', error);

      }

    };

    

    const extractUserEmail = () => {

      let userEmail = '';

      

      if (userInfo.value) {

        if (typeof userInfo.value === 'object') {

          if (userInfo.value.email) {

            userEmail = userInfo.value.email;

          } else if (userInfo.value.data && userInfo.value.data.email) {

            userEmail = userInfo.value.data.email;

          }

        }

      }

      

      if (!userEmail && userSubscribe.value) {

        if (typeof userSubscribe.value === 'object') {

          if (userSubscribe.value.email) {

            userEmail = userSubscribe.value.email;

          } else if (userSubscribe.value.data && userSubscribe.value.data.email) {

            userEmail = userSubscribe.value.data.email;

          }

        }

      }

      

      if (!userEmail) {

        const storedUser = localStorage.getItem('user');

        if (storedUser) {

          try {

            const parsedUser = JSON.parse(storedUser);

            if (parsedUser && parsedUser.email) {

              userEmail = parsedUser.email;

            }

          } catch (e) {

            console.error('解析localStorage用户数据失败:', e);

          }

        }

      }

      

      return userEmail;

    };

    

    const extractPlanName = () => {

      let planName = "未知套餐";

      

      if (userSubscribe.value && userSubscribe.value.plan && userSubscribe.value.plan.name) {

        planName = userSubscribe.value.plan.name;

      } else if (userSubscribe.value && userSubscribe.value.data && userSubscribe.value.data.plan && userSubscribe.value.data.plan.name) {

        planName = userSubscribe.value.data.plan.name;

      } else if (userInfo.value && userInfo.value.plan_name && userInfo.value.plan_name.trim() !== '') {

        planName = userInfo.value.plan_name;

      } else if (userInfo.value && userInfo.value.group && userInfo.value.group.name && userInfo.value.group.name.trim() !== '') {

        planName = userInfo.value.group.name;

      }

      

      return planName;

    };

    

    const extractExpireDate = () => {

      let expireDate = "无限期";

      

      if (userSubscribe.value && userSubscribe.value.expired_at) {

        expireDate = formatDate(userSubscribe.value.expired_at);

      } else if (userSubscribe.value && userSubscribe.value.data && userSubscribe.value.data.expired_at) {

        expireDate = formatDate(userSubscribe.value.data.expired_at);

      } else if (userInfo.value && userInfo.value.expired_at) {

        expireDate = formatDate(userInfo.value.expired_at);

      } else if (userInfo.value && userInfo.value.data && userInfo.value.data.expired_at) {

        expireDate = formatDate(userInfo.value.data.expired_at);

      }

      

      return expireDate;

    };

    

    const calculateRemainingTraffic = () => {

      let transferEnable = 0;

      let u = 0;

      let d = 0;

      

      if (userSubscribe.value) {

        if (typeof userSubscribe.value === 'object') {

          if (userSubscribe.value.transfer_enable !== undefined) {

            transferEnable = userSubscribe.value.transfer_enable || 0;

            u = userSubscribe.value.u || 0;

            d = userSubscribe.value.d || 0;

          } else if (userSubscribe.value.data && userSubscribe.value.data.transfer_enable !== undefined) {

            transferEnable = userSubscribe.value.data.transfer_enable || 0;

            u = userSubscribe.value.data.u || 0;

            d = userSubscribe.value.data.d || 0;

          }

        }

      } 

      

      if (transferEnable === 0 && userInfo.value) {

        if (typeof userInfo.value === 'object') {

          if (userInfo.value.transfer_enable !== undefined) {

            transferEnable = userInfo.value.transfer_enable || 0;

            u = userInfo.value.u || 0;

            d = userInfo.value.d || 0;

          } else if (userInfo.value.data && userInfo.value.data.transfer_enable !== undefined) {

            transferEnable = userInfo.value.data.transfer_enable || 0;

            u = userInfo.value.data.u || 0;

            d = userInfo.value.data.d || 0;

          }

        }

      }

      

      const remainingBytes = transferEnable - (u + d);

      

      return (remainingBytes / (1024 * 1024 * 1024)).toFixed(2);

    };

    

    const extractBalance = () => {

      let balance = 0;

      

      if (userInfo.value) {

        if (typeof userInfo.value === 'object') {

          if (userInfo.value.balance !== undefined) {

            balance = userInfo.value.balance || 0;

          } else if (userInfo.value.data && userInfo.value.data.balance !== undefined) {

            balance = userInfo.value.data.balance || 0;

          }

        }

      }

      

      return balance;

    };

    

    const checkIfMobile = () => {

      isMobile.value = window.innerWidth < 768;

    };

    

    const handleResize = () => {

      checkIfMobile();

      

      if (crispInitialized.value) {

        if (isMobile.value) {

          Crisp.setPosition("right");

        } else {

          Crisp.setPosition("right");

        }

        

        setCrispStyles();

      }

    };

    

    watch(() => store.getters.isLoggedIn, async (newVal) => {

      if (newVal && crispInitialized.value) {

        await fetchUserData();

        setUserDataToCrisp();

      }

    });

    

    onMounted(async () => {

      checkIfMobile();

      

      await initCrisp();

      

      window.addEventListener('resize', handleResize);

      

      const observer = new MutationObserver((mutations) => {

        mutations.forEach((mutation) => {

          if (mutation.addedNodes && mutation.addedNodes.length > 0) {

            for (let i = 0; i < mutation.addedNodes.length; i++) {

              const node = mutation.addedNodes[i];

              if (node.classList && (node.classList.contains('crisp-client') || node.querySelector('.crisp-client'))) {

                setCrispStyles();

                setTimeout(setCrispStyles, 500);  
                setTimeout(setCrispStyles, 1500); 
                break;

              }

            }

          }

        });

      });

      

      observer.observe(document.body, {

        childList: true,

        subtree: true

      });

      

      window.crispObserver = observer;

    });

    

    onUnmounted(() => {

      window.removeEventListener('resize', handleResize);

      

      if (window.crispObserver) {

        window.crispObserver.disconnect();

        window.crispObserver = null;

      }

      

    });

    

    return {

      CONFIG

    };

  }

};

</script>



<style lang="scss" scoped>

.crisp-embed-container {

  

}





:global() {

  

}

</style> 
