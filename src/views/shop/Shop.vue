<template>

  <div class="shop-container">

    <div class="shop-inner">

      <!-- 欢迎卡片 -->

      <!-- <div class="dashboard-card welcome-card">

        <div class="card-header">

          <h2 class="card-title">{{ $t('shop.title') }}</h2>

        </div>

        <div class="card-body">

          <p>{{ $t('shop.description') }}</p>

        </div>

      </div> -->

      

      <!-- 套餐统计卡片组 -->

      <div class="stats-grid" v-if="SHOP_CONFIG.showPlanFeatureCards">

        <div class="stats-card animate-card">

          <div class="stats-icon">

            <IconRocket :size="32" />

          </div>

          <div class="stats-info">

            <div class="stats-value">{{ $t('shop.stats.global_nodes') }}</div>

            <div class="stats-label">{{ $t('shop.stats.global_nodes_desc') }}</div>

          </div>

        </div>

        

        <div class="stats-card animate-card">

          <div class="stats-icon">

            <IconBolt :size="32" />

          </div>

          <div class="stats-info">

            <div class="stats-value">{{ $t('shop.stats.speed') }}</div>

            <div class="stats-label">{{ $t('shop.stats.speed_desc') }}</div>

          </div>

        </div>

        

        <div class="stats-card animate-card">

          <div class="stats-icon">

            <IconDeviceTv :size="32" />

          </div>

          <div class="stats-info">

            <div class="stats-value">{{ $t('shop.stats.streaming') }}</div>

            <div class="stats-label">{{ $t('shop.stats.streaming_desc') }}</div>

          </div>

        </div>

        

        <div class="stats-card animate-card">

          <div class="stats-icon">

            <IconDevices :size="32" />

          </div>

          <div class="stats-info">

            <div class="stats-value">{{ $t('shop.stats.devices') }}</div>

            <div class="stats-label">{{ $t('shop.stats.devices_desc') }}</div>

          </div>

        </div>

      </div>

      

      <!-- 筛选选项卡 - 设计成圆形切换按钮 -->

      <div class="filter-toggle-container">

        <div class="filter-toggle-wrapper">

          <div

            v-for="filter in filters"

            :key="`${filter.value}-${currentLanguage}`"

            class="filter-option"

            :class="{ 'active': selectedFilter === filter.value }"

            @click="setFilter(filter.value)"

          >

            <div class="option-icon">

              <IconCircleCheck v-if="selectedFilter === filter.value" />

              <IconCircle v-else />

            </div>

            <span class="option-text">{{ $t(`shop.filter.${filter.value}`) }}</span>

          </div>

        </div>

      </div>

      

      <!-- 套餐列表 -->

      <div class="plans-wrapper">

        <!-- 无结果提示 -->

        <div class="no-plans-message" v-if="!loading.plans && filteredPlans.length === 0">

          <IconInfoCircle :size="48" class="info-icon" />

          <h3>{{ $t('shop.no_plans_found') }}</h3>

          <p>{{ $t('shop.try_different_filter') }}</p>

          <button class="btn-reset-filter" @click="selectedFilter = 'all'">

            {{ $t('shop.reset_filter') }}

          </button>

        </div>

        

        <!-- 骨架屏加载动画 -->

        <div class="dashboard-card" v-else-if="loading.plans" v-for="i in 3" :key="'skeleton-'+i">

          <div class="skeleton-card">

            <div class="skeleton-header"></div>

            <div class="skeleton-body">

              <div class="skeleton-price"></div>

              <div class="skeleton-features">

                <div class="skeleton-feature" v-for="j in 5" :key="'feature-'+j"></div>

              </div>

              <div class="skeleton-button"></div>

            </div>

          </div>

        </div>

        

        <!-- 套餐卡片 修改内容 -->

        <div class="plan-card" v-else v-for="plan in filteredPlans" :key="plan.id">

          <div class="card-header">

            <h2 class="card-title">{{ plan.name }}</h2>

            <div class="card-badge glassmorphism stock-plenty" v-if="plan.capacity_limit >= SHOP_CONFIG.lowStockThreshold || plan.capacity_limit === null">

              <IconBox :size="16" class="badge-icon" />

              <span>{{ $t('shop.plan.stock.plenty') }}</span>

            </div>

            <div class="card-badge glassmorphism stock-warning" v-else-if="plan.capacity_limit > 0 && plan.capacity_limit < SHOP_CONFIG.lowStockThreshold">

              <IconBox :size="16" class="badge-icon" />

              <span>{{ $t('shop.plan.stock.warning') }}</span>

            </div>

            <div class="card-badge glassmorphism stock-danger" v-if="plan.capacity_limit === 0">

              <IconBox :size="16" class="badge-icon" />

              <span>{{ $t('shop.plan.stock.sold_out') }}</span>

            </div>

          </div>

          <div class="card-body">

            <!-- 价格区域 - 修改为显示支持的所有周期 -->

            <div class="plan-price">

              <div class="price-display">

                <span class="currency">{{ currencySymbol }}</span>

                <span class="amount">{{ getPlanMainPrice(plan) }}</span>

                <span class="period">{{ $t(`shop.plan.periods.${getPriceTypeKey(getDisplayPriceType(plan))}`) }}</span>

              </div>

              

              <!-- 支持的周期标签 - 改进显示效果 -->

              <div class="supported-periods" v-if="!SHOP_CONFIG.hidePeriodTabs">

                <div class="period-labels">

                  <span 

                    v-for="(price, type) in getAvailablePlanPrices(plan)" 

                    :key="type"

                    class="period-tag"

                    :class="{ 

                      'active': getDisplayPriceType(plan) === type,


                    }"

                    @click="price !== null && selectPlanPriceType(plan.id, type)"

                  >

                    <IconCheck class="tag-icon check" />

                    {{ $t(`shop.plan.price_options.${getPriceTypeKey(type)}`) }}

                  </span>

                </div>

              </div>

            </div>

            

            <!-- 周期折扣计算 -->

            <div class="discount-calculation" v-if="SHOP_CONFIG.enableDiscountCalculation && calculateDiscount(plan).showDiscount">

              <div class="discount-info">

                <span class="period-name">{{ calculateDiscount(plan).periodName }}</span>

                <span class="discount-label">&nbsp;{{ $t('shop.plan.discount.relative') }} </span>

                <span class="discount-value">&nbsp;{{ calculateDiscount(plan).discountPercentage }}%</span>

                <span class="saving-text">，{{ $t('shop.plan.discount.savings') }} </span>

                <span class="saving-amount">&nbsp;{{ currencySymbol }}{{ calculateDiscount(plan).savingsAmount }}</span>

              </div>

            </div>

            

            <!-- 套餐特性 -->

            <div class="plan-features">

              <!-- JSON格式内容 -->

              <template v-if="isJsonContent(plan.content)">

                <div 

                  class="feature-item" 

                  v-for="(feature, index) in parseJsonContent(plan.content)" 

                  :key="index"

                >

                  <IconCheck v-if="feature.support" class="feature-icon enabled" />

                  <IconX v-else class="feature-icon disabled" />

                  <span :class="{ 'disabled-text': !feature.support }">{{ feature.feature }}</span>

                </div>

              </template>

              

              <!-- HTML格式内容 -->

              <div v-else class="html-content" v-html="plan.content"></div>

            </div>

            

            <!-- 购买按钮 -->

            <button 

              class="btn-purchase glassmorphism" 

              :class="{ 'btn-disabled': plan.capacity_limit === 0 }"

              @click="purchasePlan(plan)"

              :disabled="plan.capacity_limit === 0"

            >

              <IconShoppingCart class="btn-icon" />

              <span class="btn-text">{{ plan.capacity_limit === 0 ? $t('shop.plan.sold_out_btn') : $t('shop.plan.purchase') }}</span>

            </button>

          </div>

        </div>

      </div>

    </div>

  </div>



  <!-- 弹窗组件 -->

  <ShopPopup

    :show-popup="showPopup"

    :title="popupConfig.title"

    :content="popupConfig.content"

    :cooldown-hours="popupConfig.cooldownHours"

    :close-wait-seconds="popupConfig.closeWaitSeconds"

    @close="handlePopupClose"

  />

</template>



<script>

import { ref, reactive, onMounted, computed, watch, nextTick } from 'vue';

import { useI18n } from 'vue-i18n';

import { useToast } from '@/composables/useToast';

import { fetchPlans, getCommConfig } from '@/api/shop';

import { SHOP_CONFIG } from '@/utils/baseConfig';

import ShopPopup from '@/components/shop/ShopPopup.vue';

import {

  IconRocket,

  IconBolt,

  IconDeviceTv,

  IconDevices,

  IconCheck,

  IconX,

  IconShoppingCart,

  IconBox,

  IconInfoCircle,

  IconCircle,

  IconCircleCheck

} from '@tabler/icons-vue';

import { useRouter } from 'vue-router';



export default {

  name: 'ShopView',

  components: {

    IconRocket,

    IconBolt,

    IconDeviceTv,

    IconDevices,

    IconCheck,

    IconX,

    IconShoppingCart,

    IconBox,

    IconInfoCircle,

    IconCircle,

    IconCircleCheck,

    ShopPopup

  },

  setup() {

    const { t, locale } = useI18n();

    const { showToast } = useToast();

    const router = useRouter();

    

    const loading = reactive({

      plans: true,

      config: true

    });

    

    const plans = ref([]);

    const currency = ref('CNY');

    const currencySymbol = ref('¥');

    

    const selectedPriceType = reactive({});

    

    const paymentMethods = ref([]);

    

    const selectedFilter = ref('all');

    

    const filterToggle = ref(null);

    

    const filters = [

      { label: '全部', value: 'all' },

      { label: '周期性', value: 'recurring' },

      { label: '一次性', value: 'onetime' }

    ];

    

    const showPopup = ref(false);

    const popupConfig = reactive({

      title: '',

      content: '',

      cooldownHours: 2,

      closeWaitSeconds: 0

    });

    

    const handlePopupClose = () => {

      showPopup.value = false;

    };



    // 新增方法：获取套餐的可用价格周期（只返回价格不为 null 的周期）
    const getAvailablePlanPrices = (plan) => {
      const allPrices = {
        month_price: plan.month_price,
        quarter_price: plan.quarter_price,
        half_year_price: plan.half_year_price,
        year_price: plan.year_price,
        two_year_price: plan.two_year_price,
        three_year_price: plan.three_year_price,
        onetime_price: plan.onetime_price
      };
      
      // 只返回价格不为 null 的周期
      const availablePrices = {};
      Object.entries(allPrices).forEach(([type, price]) => {
        if (price !== null && price !== undefined) {
          availablePrices[type] = price;
        }
      });
      
      return availablePrices;
    };

    

    const initPopup = () => {

      if (SHOP_CONFIG.popup && SHOP_CONFIG.popup.enabled) {

        popupConfig.title = SHOP_CONFIG.popup.title || '';

        popupConfig.content = SHOP_CONFIG.popup.content || '';

        popupConfig.cooldownHours = SHOP_CONFIG.popup.cooldownHours || 24;

        popupConfig.closeWaitSeconds = SHOP_CONFIG.popup.closeWaitSeconds || 0;

        

        if (popupConfig.cooldownHours === 0) {

          showPopup.value = true;

          return;

        }

        

        const closeTime = localStorage.getItem('shop_popup_close_time');

        if (!closeTime) {

          showPopup.value = true;

        } else {

          const now = new Date().getTime();

          const elapsed = now - parseInt(closeTime);

          const cooldownMs = popupConfig.cooldownHours * 60 * 60 * 1000;

          

          if (elapsed >= cooldownMs) {

            showPopup.value = true;

          }

        }

      }

    };

    

    const currentLanguage = computed(() => locale.value);

    

    const setFilter = (filter) => {

      selectedFilter.value = filter;

    };

    

    const getPlanMainPriceType = (plan) => {

      const priceTypes = SHOP_CONFIG.periodOrder || ['three_year_price', 'two_year_price', 'year_price', 'half_year_price', 'quarter_price', 'month_price', 'onetime_price'];

      

      const recurringTypes = priceTypes.filter(type => type !== 'onetime_price');

      const defaultRecurring = recurringTypes.find(type => plan[type] !== null);

      

      if (defaultRecurring) {

        return defaultRecurring;

      }

      

      if (plan.onetime_price !== null) {

        return 'onetime_price';

      }

      

      return priceTypes.find(type => plan[type] !== null) || priceTypes[0];

    };

    

    const getPlanMainPrice = (plan) => {

      const priceType = getDisplayPriceType(plan);

      if (!priceType || plan[priceType] === null || plan[priceType] === undefined) {

        return '--';

      }

      return (plan[priceType] / 100).toFixed(2);

    };

    

    watch(() => selectedFilter.value, () => {

      console.log('筛选条件变化为:', selectedFilter.value);

    });

    

    watch(() => currentLanguage.value, () => {

      console.log('语言变化为:', currentLanguage.value);

    });

    

    onMounted(() => {

      selectedFilter.value = 'all';

    });

    

    const fetchPlanData = async () => {

      loading.plans = true;

      try {

        const response = await fetchPlans();

        if (response.data) {

          plans.value = response.data;

          

          Object.keys(selectedPriceType).forEach(key => {

            delete selectedPriceType[key];

          });

          

          

          if (SHOP_CONFIG.autoSelectMaxPeriod) {

            nextTick(() => {

              plans.value.forEach(plan => {

                const priceTypes = SHOP_CONFIG.periodOrder || ['three_year_price', 'two_year_price', 'year_price', 'half_year_price', 'quarter_price', 'month_price', 'onetime_price'];

                

                const recurringTypes = priceTypes.filter(type => type !== 'onetime_price');

                const defaultRecurring = recurringTypes.find(type => plan[type] !== null);

                

                if (defaultRecurring) {

                  selectedPriceType[plan.id] = defaultRecurring;

                } else if (plan.onetime_price !== null) {

                  selectedPriceType[plan.id] = 'onetime_price';

                } else {

                  selectedPriceType[plan.id] = priceTypes.find(type => plan[type] !== null) || priceTypes[0];

                }

              });

            });

          } else {

          }

        }

      } catch (error) {

        showToast('获取套餐数据失败', 'error');

      } finally {

        loading.plans = false;

      }

    };

    

    const fetchConfig = async () => {

      loading.config = true;

      try {

        const response = await getCommConfig();

        if (response.data) {

          currency.value = response.data.currency || 'CNY';

          currencySymbol.value = response.data.currency_symbol || '¥';

        }

      } catch (error) {

        console.error('获取系统配置失败:', error);

      } finally {

        loading.config = false;

      }

    };

    

    const getPlanPrices = (plan) => {

      return {

        month_price: plan.month_price,

        quarter_price: plan.quarter_price,

        half_year_price: plan.half_year_price,

        year_price: plan.year_price,

        two_year_price: plan.two_year_price,

        three_year_price: plan.three_year_price,

        onetime_price: plan.onetime_price

      };

    };

    

    const getPriceTypeKey = (type) => {

      const keyMap = {

        month_price: 'month',

        quarter_price: 'quarter',

        half_year_price: 'half_year',

        year_price: 'year',

        two_year_price: 'two_year',

        three_year_price: 'three_year',

        onetime_price: 'onetime'

      };

      return keyMap[type] || '';

    };

    

    const getPriceTypeName = (type) => {

      const nameMap = {

        month_price: '月付',

        quarter_price: '季付',

        half_year_price: '半年付',

        year_price: '年付',

        two_year_price: '两年付',

        three_year_price: '三年付',

        onetime_price: '一次性'

      };

      return nameMap[type] || '';

    };

    

    const getPeriodText = (type) => {

      const textMap = {

        month_price: '/ 月',

        quarter_price: '/ 季',

        half_year_price: '/ 半年',

        year_price: '/ 年',

        two_year_price: '/ 两年',

        three_year_price: '/ 三年',

        onetime_price: ''

      };

      return textMap[type] || '';

    };

    

    const selectPriceType = (planId, type) => {

      selectedPriceType[planId] = type;

    };

    

    const getSelectedPrice = (plan) => {

      const type = selectedPriceType[plan.id];

      if (plan[type] === null) return '--';

      return (plan[type] / 100).toFixed(2);

    };

    

    const isJsonContent = (content) => {

      if (!content) return false;

      try {

        const parsed = JSON.parse(content);

        return Array.isArray(parsed) && parsed.length > 0 && Object.prototype.hasOwnProperty.call(parsed[0], 'feature');

      } catch (e) {

        return false;

      }

    };

    

    const parseJsonContent = (content) => {

      try {

        return JSON.parse(content);

      } catch (e) {

        return [];

      }

    };

    

    const purchasePlan = (plan) => {

      if (plan.capacity_limit === 0) {

        showToast(t('shop.plan.stock.sold_out'), 'error');

        return;

      }

      

      const priceType = getDisplayPriceType(plan);

      

      

      router.push({

        path: 'order-confirm',

        query: { 

          id: plan.id,

          period: priceType

        }

      });

    };

    

    const filteredPlans = computed(() => {

      if (selectedFilter.value === 'all') {

        return plans.value;

      } else if (selectedFilter.value === 'recurring') {

        return plans.value.filter(plan => hasRecurringPrice(plan) && !isOnetimeOnly(plan));

      } else if (selectedFilter.value === 'onetime') {

        return plans.value.filter(plan => plan.onetime_price !== null);

      }

      return plans.value;

    });

    

    const hasRecurringPrice = (plan) => {

      const recurringTypes = ['month_price', 'quarter_price', 'half_year_price', 'year_price', 'two_year_price', 'three_year_price'];

      return recurringTypes.some(type => plan[type] !== null);

    };

    

    const isOnetimeOnly = (plan) => {

      const recurringTypes = ['month_price', 'quarter_price', 'half_year_price', 'year_price', 'two_year_price', 'three_year_price'];

      return plan.onetime_price !== null && !recurringTypes.some(type => plan[type] !== null);

    };

    

    const selectPlanPriceType = (planId, type) => {

      const plan = plans.value.find(p => p.id === planId);

      if (plan && plan[type] !== null) {

        selectedPriceType[planId] = type;

      }

    };

    

    const getDisplayPriceType = (plan) => {

      if (selectedPriceType[plan.id]) {

        return selectedPriceType[plan.id];

      }

      

      if (SHOP_CONFIG.autoSelectMaxPeriod) {

        const priceType = getPlanMainPriceType(plan);

        return priceType;

      }

      

      const availablePrices = Object.entries(getPlanPrices(plan))

        .filter(([, price]) => price !== null)

        .map(([type]) => type);

      

      if (availablePrices.length > 0) {

        return availablePrices[0];

      }

      

      return '';

    };

    

    onMounted(async () => {

      try {

        loading.plans = true;

        await Promise.all([fetchPlanData(), fetchConfig()]);

        loading.plans = false;

        

        nextTick(() => {

          if (SHOP_CONFIG.popup && SHOP_CONFIG.popup.enabled && SHOP_CONFIG.popup.cooldownHours === 0) {

            localStorage.removeItem('shop_popup_close_time');

          }

          initPopup();

        });

      } catch (error) {

        console.error('加载数据失败:', error);

        loading.plans = false;

      }

    });

    

    const calculateDiscount = (plan) => {

      if (!plan.month_price) {

        return { showDiscount: false, periodName: '', discountPercentage: 0, savingsAmount: 0 };

      }

      

      const monthlyPrice = plan.month_price / 100; 
      

      const availablePeriods = [

        { type: 'three_year_price', price: plan.three_year_price ? plan.three_year_price / 100 : null, months: 36, name: t('shop.plan.price_options.three_year') },

        { type: 'two_year_price', price: plan.two_year_price ? plan.two_year_price / 100 : null, months: 24, name: t('shop.plan.price_options.two_year') },

        { type: 'year_price', price: plan.year_price ? plan.year_price / 100 : null, months: 12, name: t('shop.plan.price_options.year') },

        { type: 'half_year_price', price: plan.half_year_price ? plan.half_year_price / 100 : null, months: 6, name: t('shop.plan.price_options.half_year') },

        { type: 'quarter_price', price: plan.quarter_price ? plan.quarter_price / 100 : null, months: 3, name: t('shop.plan.price_options.quarter') }

      ].filter(period => period.price !== null);

      

      if (availablePeriods.length === 0) {

        return { showDiscount: false, periodName: '', discountPercentage: 0, savingsAmount: 0 };

      }

      

      const selectedPeriod = availablePeriods[0];

      

      const totalMonthlyPrice = monthlyPrice * selectedPeriod.months;

      

      const discountPercentage = ((totalMonthlyPrice - selectedPeriod.price) / totalMonthlyPrice) * 100;

      

      const savingsAmount = (totalMonthlyPrice - selectedPeriod.price).toFixed(2);

      

      return {

        showDiscount: discountPercentage > 1,

        periodName: selectedPeriod.name,

        discountPercentage: discountPercentage.toFixed(0), 
        savingsAmount: savingsAmount

      };

    };

    

    return {

      plans,

      loading,

      currency,

      currencySymbol,

      paymentMethods,

      selectedPriceType,

      selectedFilter,

      filteredPlans,

      getPlanPrices,

      getPriceTypeKey,

      getPriceTypeName,

      getPeriodText,

      selectPriceType,

      getSelectedPrice,

      isJsonContent,

      parseJsonContent,

      purchasePlan,

      filterToggle,

      filters,

      setFilter,

      getPlanMainPrice,

      getPlanMainPriceType,

      currentLanguage,

      selectPlanPriceType,

      getDisplayPriceType,

      showPopup,

      popupConfig,

      handlePopupClose,

      initPopup,

      SHOP_CONFIG,

      getAvailablePlanPrices,

      calculateDiscount

    };

  }

};

</script>



<style lang="scss" scoped>

.shop-container {

  padding: 20px;

  display: flex;

  justify-content: center;

  

  .shop-inner {

    width: 100%;

    max-width: 1200px;

  }

  

  .welcome-card {

    margin-bottom: 24px;

  }

  

  .dashboard-card {

    background-color: var(--card-bg-color);

    border-radius: 12px;

    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

    padding: 20px;

    margin-bottom: 24px;

    border: 1px solid var(--border-color);

    transition: all 0.3s ease;

    position: relative;

    

    &:hover {

      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

      border-color: rgba(var(--theme-color-rgb), 0.3);

    }

    

    .card-header {

      display: flex;

      justify-content: space-between;

      align-items: flex-start;

      margin-bottom: 15px;

      

      .card-title {

        font-size: 18px;

        font-weight: 600;

        margin: 0;

        word-wrap: break-word;

        overflow-wrap: break-word;

        hyphens: auto;

        flex: 1;

        padding-right: 10px;

      }

      

      .card-badge {

        display: flex;

        align-items: center;

        padding: 4px 12px;

        border-radius: 20px;

        font-size: 12px;

        font-weight: 500;

        margin-left: 8px;

        white-space: nowrap;

        flex-shrink: 0;

        

        &.glassmorphism {

          backdrop-filter: blur(8px);

          -webkit-backdrop-filter: blur(8px);

          border: 1px solid rgba(255, 255, 255, 0.1);

          will-change: backdrop-filter, background-color, color;

          transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;

          

          &.stock-plenty {

            background-color: rgba(76, 175, 80, 0.2);

            border-color: rgba(76, 175, 80, 0.1);

            color: #4caf50;

          }

          

          &.stock-warning {

            background-color: rgba(255, 152, 0, 0.2);

            border-color: rgba(255, 152, 0, 0.1);

            color: #ff9800;

          }

          

          &.stock-danger {

            background-color: rgba(244, 67, 54, 0.2);

            border-color: rgba(244, 67, 54, 0.1);

            color: #f44336;

          }

        }

        

        .badge-icon {

          margin-right: 4px;

        }

      }

    }

  }

  

  

  .skeleton-card {

    width: 100%;

    height: 100%;

    

    .skeleton-header,

    .skeleton-price,

    .skeleton-feature,

    .skeleton-button {

      position: relative;

      overflow: hidden;

      

      &::after {

        content: '';

        position: absolute;

        top: 0;

        right: 0;

        bottom: 0;

        left: 0;

        background: linear-gradient(90deg, 

          rgba(255, 255, 255, 0) 0%, 

          rgba(255, 255, 255, 0.15) 50%, 

          rgba(255, 255, 255, 0) 100%);

        transform: translateX(-100%);

        animation: shimmer 2.5s infinite;

      }

    }

    

    .skeleton-header {

      height: 24px;

      background-color: rgba(0, 0, 0, 0.05);

      border-radius: 4px;

      margin-bottom: 20px;

      width: 60%;

    }

    

    .skeleton-body {

      .skeleton-price {

        height: 60px;

        background-color: rgba(0, 0, 0, 0.05);

        border-radius: 8px;

        margin-bottom: 24px;

      }

      

      .skeleton-features {

        margin-bottom: 24px;

        

        .skeleton-feature {

          height: 16px;

          background-color: rgba(0, 0, 0, 0.05);

          border-radius: 4px;

          margin-bottom: 12px;

          

          &:nth-child(1) { width: 90%; }

          &:nth-child(2) { width: 80%; }

          &:nth-child(3) { width: 85%; }

          &:nth-child(4) { width: 75%; }

          &:nth-child(5) { width: 70%; }

        }

      }

      

      .skeleton-button {

        height: 48px;

        background-color: rgba(0, 0, 0, 0.05);

        border-radius: 8px;

      }

    }

  }

  

  @keyframes shimmer {

    0% {

      transform: translateX(-100%);

    }

    100% {

      transform: translateX(100%);

    }

  }

  

  @keyframes pulse {

    0% { opacity: 0.6; }

    50% { opacity: 0.3; }

    100% { opacity: 0.6; }

  }

  

  .stats-grid {

    display: grid;

    grid-template-columns: repeat(4, 1fr);

    gap: 20px;

    margin-bottom: 24px;

    

    @media (max-width: 1200px) {

      grid-template-columns: repeat(2, 1fr);

    }

    

    @media (max-width: 768px) {

      grid-template-columns: repeat(2, 1fr);

    }

    

    .stats-card {

      background-color: var(--card-bg-color);

      border-radius: 12px;

      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

      padding: 20px;

      display: flex;

      align-items: center;

      border: 1px solid var(--border-color);

      transition: all 0.3s ease;

      
      // 移动端优化

      @media (max-width: 768px) {

        padding: 16px 12px; // 减少内边距
        
        flex-direction: column; // 改为垂直布局
        
        text-align: center; // 文字居中
        
        min-height: auto; // 移除最小高度限制
      
      }      


      &:hover {

        border-color: rgba(var(--theme-color-rgb), 0.3);

        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

      }

      

      .stats-icon {

        display: flex;

        align-items: center;

        justify-content: center;

        width: 60px;

        height: 60px;

        background-color: rgba(var(--theme-color-rgb), 0.1);

        border-radius: 12px;

        margin-right: 15px;

        color: var(--theme-color);


        // 移动端图标调整

        @media (max-width: 768px) {

          width: 48px; // 稍微缩小图标容器

          height: 48px;

          margin-right: 0; // 移除右边距

          margin-bottom: 12px; // 添加底部边距

          border-radius: 10px;
          
          svg {

            width: 24px; // 缩小图标

            height: 24px;

          }

        }
        

      }

      

      .stats-info {

        flex: 1;

        
        @media (max-width: 768px) {

          flex: none; // 移动端不占满剩余空间

        }


        .stats-value {

          font-size: 18px;

          font-weight: 600;

          color: var(--text-color);

          margin-bottom: 5px;


          @media (max-width: 768px) {

            font-size: 16px; // 稍微缩小字体

            margin-bottom: 4px;

          }

        }

        

        .stats-label {

          font-size: 14px;

          color: var(--secondary-text-color);


          @media (max-width: 768px) {

            font-size: 12px; // 缩小描述文字

            line-height: 1.3; // 调整行高
            
          }


        }

      }

    }

  }

  

  .plans-wrapper {

    display: grid;

    grid-template-columns: repeat(3, 1fr);

    gap: 24px;

    margin-bottom: 24px;

    

    @media (max-width: 1200px) {

      grid-template-columns: repeat(2, 1fr);

    }

    

    @media (max-width: 768px) {

      grid-template-columns: 1fr;

    }

    

    .dashboard-card {

      border-radius: 16px;

      overflow: hidden;

    }

    

    .plan-card {

      background-color: var(--card-bg-color);

      border-radius: 16px;

      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

      padding: 24px;

      border: 1px solid var(--border-color);

      transition: all 0.3s ease;

      position: relative;

      display: flex;

      flex-direction: column;

      height: auto;

      

      &:hover {

        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

        border-color: rgba(var(--theme-color-rgb), 0.3);

        transform: translateY(-5px);

      }

      

      .card-header {

        display: flex;

        justify-content: space-between;

        align-items: flex-start;

        margin-bottom: 15px;

        

        .card-title {

          font-size: 18px;

          font-weight: 600;

          margin: 0;

          word-wrap: break-word;

          overflow-wrap: break-word;

          hyphens: auto;

          flex: 1;

          padding-right: 10px;

        }

        

        .card-badge {

          display: flex;

          align-items: center;

          padding: 4px 12px;

          border-radius: 20px;

          font-size: 12px;

          font-weight: 500;

          margin-left: 8px;

          white-space: nowrap;

          flex-shrink: 0;

          

          &.glassmorphism {

            backdrop-filter: blur(8px);

            -webkit-backdrop-filter: blur(8px);

            border: 1px solid rgba(255, 255, 255, 0.1);

            will-change: backdrop-filter, background-color, color;

            transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;

            

            &.stock-plenty {

              background-color: rgba(76, 175, 80, 0.2);

              border-color: rgba(76, 175, 80, 0.1);

              color: #4caf50;

            }

            

            &.stock-warning {

              background-color: rgba(255, 152, 0, 0.2);

              border-color: rgba(255, 152, 0, 0.1);

              color: #ff9800;

            }

            

            &.stock-danger {

              background-color: rgba(244, 67, 54, 0.2);

              border-color: rgba(244, 67, 54, 0.1);

              color: #f44336;

            }

          }

          

          .badge-icon {

            margin-right: 4px;

          }

        }

      }

      

      .card-body {

        position: relative;

        flex: 1;

        display: flex;

        flex-direction: column;

      }

    }

    

    .plan-price {

      margin: 24px 0;

      padding: 0 4px;

      

      .price-display {

        text-align: center;

        margin-bottom: 12px;

        

        .currency {

          font-size: 24px;

          font-weight: 500;

          color: var(--text-color);

        }

        

        .amount {

          font-size: 48px;

          font-weight: 700;

          color: var(--text-color);

        }

        

        .period {

          font-size: 16px;

          color: var(--secondary-text-color);

        }

      }

      

      .supported-periods {

        margin-top: 15px;

        

        .period-labels {

          display: flex;

          justify-content: center;

          flex-wrap: wrap;

          gap: 6px;

          

          .period-tag {

            padding: 5px 10px;

            border-radius: 6px;

            font-size: 12px;

            background-color: rgba(var(--border-color-rgb), 0.1);

            color: var(--secondary-text-color);

            font-weight: 500;

            cursor: pointer;

            transition: all 0.3s ease;

            border: 1px solid transparent;

            display: flex;

            align-items: center;

            

            .tag-icon {

              margin-right: 4px;

              width: 14px;

              height: 14px;

              

              &.check {

                color: #4caf50;

              }

              

              &.error {

                color: #f44336;

              }

            }

            

            &:hover:not(.disabled) {

              background-color: rgba(var(--theme-color-rgb), 0.08);

              color: var(--text-color);

            }

            

            &.active {

              background-color: rgba(var(--theme-color-rgb), 0.1);

              color: var(--text-color);

              border-color: rgba(var(--theme-color-rgb), 0.2);

            }

            

            &.disabled {

              opacity: 0.5;

              cursor: default;

            }

          }

        }

      }

    }

    

    

    .discount-calculation {

      margin: 5px 0 15px 0;

      padding: 8px 12px;

      background-color: rgba(var(--theme-color-rgb), 0.05);

      border-radius: 8px;

      

      .discount-info {

        font-size: 14px;

        text-align: center;

        color: var(--text-color);

        

        .period-name {

          font-weight: 700;

          color: var(--theme-color);

        }

        

        .discount-label {

          font-weight: 500;

          

          

          &::first-line,

          &:first-child {

            color: var(--theme-color);

            font-weight: 700;

          }

        }

        

        .discount-value {

          font-weight: 700;

          color: var(--theme-color);

        }

        

        .saving-text {

          font-weight: 400;

        }

        

        .saving-amount {

          font-weight: 700;

          color: var(--theme-color);

        }

      }

    }

    

    .plan-features {

      margin: 24px 0 10px 0;

      padding: 0 4px;

      

      .feature-item {

        display: flex;

        align-items: flex-start; // 改为 flex-start 以便长文本时对齐更好

        margin-bottom: 12px;

        

        .feature-icon {

          width: 20px;

          height: 20px;

          min-width: 20px; // 添加最小宽度防止收缩

          min-height: 20px; // 添加最小高度防止收缩

          margin-right: 8px;

          flex-shrink: 0; // 防止图标被压缩

          margin-top: 1px; // 微调垂直对齐

          

          &.enabled {

            color: var(--theme-color);

          }

          

          &.disabled {

            color: #ccc;

          }

        }

        

        span {

          font-size: 14px;

          color: var(--text-color);

          line-height: 1.5; // 添加行高改善可读性

          word-wrap: break-word; // 允许长单词换行

          overflow-wrap: break-word; // 更好的换行支持

          flex: 1; // 占据剩余空间

          

          &.disabled-text {

            color: #999;

          }

        }

      }

      

      .html-content {

        font-size: 14px;

        line-height: 1.6;

        color: var(--text-color);

      }

    }

  }

  

  

  .btn-purchase {

    position: relative;

    bottom: auto;

    left: auto;

    height: 40px;

    width: 100%;

    min-width: 120px;

    display: flex;

    align-items: center;

    justify-content: center;

    gap: 8px;

    color: white;

    border: none;

    border-radius: 8px;

    font-size: 14px;

    font-weight: 500;

    cursor: pointer;

    transition: all 0.3s ease;

    padding: 0 16px;

    margin-top: 12px;

    align-self: flex-start;

    

    &.glassmorphism {

      background-color: rgba(var(--theme-color-rgb), 0.85);

      backdrop-filter: blur(8px);

      -webkit-backdrop-filter: blur(8px);

      border: 1px solid rgba(var(--theme-color-rgb), 0.3);

      box-shadow: 0 8px 20px rgba(var(--theme-color-rgb), 0.25);

    }

    

    &:hover {

      transform: translateY(-2px);

      box-shadow: 0 10px 25px rgba(var(--theme-color-rgb), 0.35);

      background-color: rgba(var(--theme-color-rgb), 0.95);

    }

    

    &.btn-disabled {

      background-color: rgba(150, 150, 150, 0.5);

      backdrop-filter: blur(8px);

      -webkit-backdrop-filter: blur(8px);

      cursor: not-allowed;

      box-shadow: none;

      border: 1px solid rgba(150, 150, 150, 0.3);

      

      &:hover {

        transform: none;

        box-shadow: none;

      }

    }

    

    .btn-icon {

      width: 18px;

      height: 18px;

    }

  }

  

  

  .dark-theme {

    .skeleton-header,

    .skeleton-price,

    .skeleton-feature,

    .skeleton-button {

      background-color: rgba(255, 255, 255, 0.08);

      

      &::after {

        background: linear-gradient(90deg, 

          rgba(255, 255, 255, 0) 0%, 

          rgba(255, 255, 255, 0.05) 50%, 

          rgba(255, 255, 255, 0) 100%);

      }

    }

    

    .card-badge.glassmorphism {

      &.stock-plenty {

        background-color: rgba(76, 175, 80, 0.1);

      }

      

      &.stock-warning {

        background-color: rgba(255, 152, 0, 0.1);

      }

      

      &.stock-danger {

        background-color: rgba(244, 67, 54, 0.1);

      }

    }

  }

  

  

  .filter-toggle-container {

    margin-bottom: 30px;

    display: flex;

    justify-content: center;

    

    .filter-toggle-wrapper {

      background: rgba(var(--card-background-rgb, 255, 255, 255), 0.7);

      backdrop-filter: blur(12px);

      -webkit-backdrop-filter: blur(12px);

      border-radius: 18px;

      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);

      padding: 8px 20px;

      border: 1px solid var(--border-color, rgba(0, 0, 0, 0.1));

      display: flex;

      flex-wrap: wrap;

      justify-content: center;

      gap: 15px;

      max-width: 600px;

      will-change: backdrop-filter, background-color;

      transition: background-color 0.3s ease;

      

      .filter-option {

        display: flex;

        align-items: center;

        cursor: pointer;

        transition: all 0.3s ease;

        padding: 6px 10px;

        border-radius: 12px;

        

        &:hover {

          background-color: rgba(var(--theme-color-rgb), 0.05);

        }

        

        &.active {

          background-color: rgba(var(--theme-color-rgb), 0.08);

          .option-icon {

            color: var(--theme-color);

          }

          .option-text {

            color: var(--text-color);

            font-weight: 600;

          }

        }

        

        .option-icon {

          margin-right: 6px;

          display: flex;

          align-items: center;

          color: var(--secondary-text-color);

          transition: color 0.3s ease;

          

          svg {

            width: 18px;

            height: 18px;

          }

        }

        

        .option-text {

          font-size: 14px;

          color: var(--secondary-text-color);

          transition: color 0.3s ease;

        }



      }

    }

  }

  

  

  .no-plans-message {

    grid-column: 1 / -1;

    background-color: var(--card-bg-color);

    border-radius: 12px;

    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

    padding: 40px 20px;

    margin-bottom: 24px;

    border: 1px solid var(--border-color);

    text-align: center;

    

    .info-icon {

      color: var(--theme-color);

      opacity: 0.7;

      margin-bottom: 16px;

    }

    

    h3 {

      font-size: 18px;

      font-weight: 600;

      margin: 0 0 10px;

      color: var(--text-color);

    }

    

    p {

      color: var(--secondary-text-color);

      margin-bottom: 24px;

    }

    

    .btn-reset-filter {

      padding: 8px 20px;

      background-color: var(--theme-color);

      color: white;

      border: none;

      border-radius: 8px;

      font-size: 14px;

      font-weight: 500;

      cursor: pointer;

      transition: all 0.3s ease;

      

      &:hover {

        background-color: var(--primary-color-hover);

        transform: translateY(-2px);

      }

    }

  }

  

  

  .animate-card {

    position: relative;

    overflow: hidden;

    

    &::after {

      content: "";

      position: absolute;

      top: 0;

      left: -100%;

      width: 50%;

      height: 100%;

      background: linear-gradient(

        to right,

        rgba(255, 255, 255, 0) 0%,

        rgba(255, 255, 255, 0.2) 50%,

        rgba(255, 255, 255, 0) 100%

      );

      animation: shimmer 3s infinite;

      transform: skewX(-25deg);

    }

  }

  

  @keyframes shimmer {

    0% {

      left: -100%;

    }

    100% {

      left: 200%;

    }

  }

}





@media (max-width: 768px) {

  .shop-container {

    padding: 15px;

    padding-bottom: 80px;

    

    .stats-grid {

      grid-template-columns: repeat(2, 1fr);

    }

    

    .plans-wrapper {

      grid-template-columns: 1fr;

    }

  }

  

  .shop-container .filter-toggle-container {

    .filter-toggle-wrapper {

      width: 100%;

      max-width: 100%;

      padding: 10px;

      flex-direction: row;

      justify-content: space-around;

      gap: 5px;

      border-radius: 14px;

      

      .filter-option {

        padding: 8px 10px;

        flex: 1;

        justify-content: center;

        min-width: 80px;

        

        .option-icon {

          margin-right: 4px;

          

          svg {

            width: 16px;

            height: 16px;

          }

        }

        

        .option-text {

          font-size: 12px;

          white-space: nowrap;

        }

      }

    }

  }

}



@media (max-width: 480px) {

  .shop-container .filter-toggle-container {

    .filter-toggle-wrapper {

      padding: 8px;

      

      .filter-option {

        padding: 6px 8px;

        min-width: auto;

        

        .option-icon {

          margin-right: 3px;

        }

      }

    }

  }

}

</style>


