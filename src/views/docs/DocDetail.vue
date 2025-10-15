<template>

  <div class="doc-detail-container">

    <div class="doc-detail-inner">

      <!-- 返回按钮 -->

      <button class="back-button" @click="$router.push('/docs')">

        <IconArrowLeft :size="20" />

        <span>{{ $t('docs.backToList') }}</span>

      </button>

      

      <!-- 加载状态 -->

      <div v-if="loading" class="doc-loading">

        <LoadingSpinner />

        <p>{{ $t('docs.loading') }}</p>

      </div>



      <!-- 错误提示 - 美化版 -->

      <div v-else-if="error" class="doc-error">

        <div class="error-card">

          <div class="error-icon-wrapper">

            <IconAlertTriangle :size="40" class="error-icon" />

          </div>

          <h3 class="error-title">{{ $t('common.networkError') || '网络错误' }}</h3>

          <p class="error-message">{{ error }}</p>

          <button class="retry-button" @click="fetchDocDetail">

            <span class="retry-text">{{ $t('docs.retry') || '重试' }}</span>

            <IconRefresh :size="16" class="retry-icon" />

          </button>

        </div>

      </div>



      <!-- 文档内容 -->

      <div v-else class="doc-content">

        <!-- 文档头部 -->

        <div class="doc-header">

          <h1 class="doc-title">{{ docData.title }}</h1>

          <div class="doc-meta">

            <span class="doc-category">{{ docData.category }}</span>

            <span class="doc-date">{{ $t('docs.lastUpdated') }}: {{ formatDate(docData.updated_at) }}</span>

          </div>

        </div>

        

        <!-- 文档正文 -->

        <div class="doc-body" v-html="renderedContent"></div>

      </div>

    </div>

  </div>

</template>



<script setup>

import { ref, computed, onMounted, inject, nextTick, onUnmounted } from 'vue';

import { useI18n } from 'vue-i18n';

import { useRoute, useRouter } from 'vue-router';

import LoadingSpinner from '@/components/common/LoadingSpinner.vue';

import { IconArrowLeft, IconAlertTriangle, IconRefresh } from '@tabler/icons-vue';

import { fetchKnowledgeDetail } from '@/api/docs';

import MarkdownIt from 'markdown-it';

import DOMPurify from 'dompurify';

import { SITE_CONFIG } from '@/utils/baseConfig';

import { useToast } from '@/composables/useToast';



const { t, locale } = useI18n();

const route = useRoute();

const router = useRouter();

const { showToast } = useToast();

const $toast = inject('$toast');



const md = new MarkdownIt({

  html: true,           
  breaks: true,         
  linkify: true,        
  typographer: true,    
  xhtmlOut: false       
});



md.renderer.rules.html_block = function(tokens, idx) {

  return tokens[idx].content;

};



md.renderer.rules.link_open = function(tokens, idx, options, env, self) {

  const token = tokens[idx];

  const hrefIndex = token.attrIndex('href');

  let href = '';

  

  if (hrefIndex >= 0) {

    href = token.attrs[hrefIndex][1];

  }

  

  if (href.includes('#eztheme-btn') || href.includes('class=eztheme-btn') || href.includes('?eztheme-btn')) {

    token.attrs[hrefIndex][1] = href

      .replace('#eztheme-btn', '')

      .replace('class=eztheme-btn', '')

      .replace('?eztheme-btn', '');

    

    const classIndex = token.attrIndex('class');

    if (classIndex < 0) {

      token.attrPush(['class', 'eztheme-btn']);

    } else {

      const classes = token.attrs[classIndex][1];

      if (!classes.includes('eztheme-btn')) {

        token.attrs[classIndex][1] = classes + ' eztheme-btn';

      }

    }

  }

  

  return self.renderToken(tokens, idx, options);

};



const loading = ref(true);

const error = ref('');

const docData = ref({

  id: null,

  title: '',

  category: '',

  body: '',

  updated_at: 0

});



const isComplexHtml = (content) => {

  if (!content) return false;

  return /<(div|span|p|h[1-6]|table|tr|td|ul|ol|li|section|article|header|footer|nav|form|button|style|link)[\s>]/i.test(content);

};



const getUserSubscribeUrl = () => {

  try {

    const userPlan = localStorage.getItem('userPlan');

    if (userPlan) {

      const parsedPlan = JSON.parse(userPlan);

      if (parsedPlan && parsedPlan.subscribeUrl) {

        return parsedPlan.subscribeUrl;

      }

    }

    

    if (window.userPlan && window.userPlan.subscribeUrl) {

      return window.userPlan.subscribeUrl;

    }

  } catch (e) {

    console.error('获取订阅链接失败:', e);

  }

  

  return ''; 
};



const safeBase64Encode = (str) => {

  try {

    return btoa(str);

  } catch (e) {

    console.error('Base64编码失败:', e);

    return '';

  }

};



const processTemplateVariables = (content) => {

  if (!content) return content;

  

  const subscribeUrl = getUserSubscribeUrl();

  const siteName = SITE_CONFIG.siteName || 'EZ THEME';

  const safeBase64SubscribeUrl = safeBase64Encode(subscribeUrl);

  const urlEncodeSubscribeUrl = encodeURIComponent(subscribeUrl);

  

  return content

    .replace(/\{\{subscribeUrl\}\}/g, subscribeUrl)

    .replace(/\{\{siteName\}\}/g, siteName)

    .replace(/\{\{safeBase64SubscribeUrl\}\}/g, safeBase64SubscribeUrl)

    .replace(/\{\{urlEncodeSubscribeUrl\}\}/g, urlEncodeSubscribeUrl);

};



const copyToClipboard = (text) => {

  if (navigator.clipboard && navigator.clipboard.writeText) {

    navigator.clipboard.writeText(text)

      .then(() => {

        showToast('已复制到剪贴板', 'success');

      })

      .catch(err => {

        console.error('复制失败:', err);

        fallbackCopyToClipboard(text);

      });

  } else {

    fallbackCopyToClipboard(text);

  }

};



const fallbackCopyToClipboard = (text) => {

  try {

    const textarea = window.document.createElement('textarea');

    textarea.value = text;

    textarea.style.position = 'fixed';

    textarea.style.left = '0';

    textarea.style.top = '0';

    textarea.style.opacity = '0';

    window.document.body.appendChild(textarea);

    textarea.focus();

    textarea.select();

    

    const successful = window.document.execCommand('copy');

    window.document.body.removeChild(textarea);

    

    if (successful) {

      showToast('已复制到剪贴板', 'success');

    } else {

      showToast('复制失败，请手动复制', 'error');

    }

  } catch (err) {

    console.error('后备复制方法失败:', err);

    showToast('复制失败，请手动复制', 'error');

  }

};



const handleDocClick = (event) => {

  let target = event.target;

  let button = null;

  

  if (target.tagName === 'I' || target.tagName === 'SPAN' || target.tagName === 'SVG') {

    button = target.closest('button');

    if (!button) {

      const link = target.closest('a');

      if (link && !link.classList.contains('eztheme-btn')) {

        return;

      }

    }

  } else if (target.tagName === 'BUTTON') {

    button = target;

  } else {

    button = target.closest('button');

  }

  

  if (button) {

    const buttonText = button.textContent.trim().toLowerCase();

    const isSubscribeButton = buttonText.includes('复制') || 

                           buttonText.includes('订阅') || 

                           buttonText.includes('copy') || 

                           button.querySelector('.fa-copy');

    

    if (button.hasAttribute('onclick')) {

      const onclickValue = button.getAttribute('onclick');

      

      if (onclickValue.includes('copy(')) {

        event.preventDefault(); 
        event.stopPropagation(); 
        

        try {

          const match = onclickValue.match(/copy\(['"](.+?)['"]\)/);

          if (match && match[1]) {

            const textToCopy = match[1];

            if (textToCopy === '{{subscribeUrl}}') {

              copyToClipboard(getUserSubscribeUrl());

            } else {

              copyToClipboard(textToCopy);

            }

            return true;

          }

        } catch (e) {

          console.error('处理复制按钮出错:', e);

        }

      }

      

      else if (onclickValue.includes('jump(')) {

        event.preventDefault();

        event.stopPropagation();

        

        try {

          const match = onclickValue.match(/jump\((\d+)\)/);

          if (match && match[1]) {

            const docId = match[1];

            router.push(`/docs/${docId}`);

            return true;

          }

        } catch (e) {

          console.error('处理跳转按钮出错:', e);

        }

      }

      

      return;

    }

    

    if (button.hasAttribute('data-original-onclick')) {

      const onclickValue = button.getAttribute('data-original-onclick');

      event.preventDefault();

      

      if (onclickValue.includes('copy(')) {

        try {

          const match = onclickValue.match(/copy\(['"](.+?)['"]\)/);

          if (match && match[1]) {

            const textToCopy = match[1];

            if (textToCopy === '{{subscribeUrl}}') {

              copyToClipboard(getUserSubscribeUrl());

            } else {

              copyToClipboard(textToCopy);

            }

            return true;

          }

        } catch (e) {

          console.error('处理复制按钮出错:', e);

        }

      }

      

      else if (onclickValue.includes('jump(')) {

        try {

          const match = onclickValue.match(/jump\((\d+)\)/);

          if (match && match[1]) {

            const docId = match[1];

            router.push(`/docs/${docId}`);

            return true;

          }

        } catch (e) {

          console.error('处理跳转按钮出错:', e);

        }

      }

    }

    

    if (isSubscribeButton) {

      event.preventDefault();

      const subscribeUrl = getUserSubscribeUrl();

      if (subscribeUrl) {

        copyToClipboard(subscribeUrl);

        return true;

      }

    }

    

    if (button.hasAttribute('data-href')) {

      event.preventDefault();

      const href = button.getAttribute('data-href');

      const target = button.getAttribute('data-target');

      

      if (href) {

        if (target === '_blank') {

          window.open(href, '_blank');

        } else if (href.startsWith('/') || href.startsWith('./') || href.startsWith('../')) {

          router.push(href);

        } else {

          const externalHref = href.match(/^https?:/);
          window.open(externalHref, target || '_blank');

        }

        return true;

      }

    }

  }

  

  if (event.target.textContent && 

      (event.target.textContent.includes('复制') || 

      event.target.textContent.includes('copy') ||

      event.target.textContent.includes('订阅'))) {

    const subscribeUrl = getUserSubscribeUrl();

    if (subscribeUrl) {

      event.preventDefault();

      copyToClipboard(subscribeUrl);

      return true;

    }

  }

};



// 构建“无访问权限”卡片 HTML（仪表盘同款结构）
const buildNoAccessCardHtml = () => {
  const title = t('docs.noAccessPrompt');
  const buyText = t('dashboard.purchasePlan');
  const supportText = t('dashboard.ticketSupport');
  return `
    <div class="dashboard-card stats-card no-plan-card card-animate" style="margin: 12px 0;">
      <div class="no-plan-content">
        <div class="no-plan-icon" aria-hidden="true"></div>
        <div class="no-plan-message">
          <div class="no-plan-title">${title}</div>
          <div class="no-plan-actions">
            <button class="action-button primary" data-href="/shop">
              <span class="btn-icon"></span>
              <span>${buyText}</span>
            </button>
            <button class="action-button secondary" data-href="/tickets">
              <span class="btn-icon"></span>
              <span>${supportText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
};



const renderedContent = computed(() => {
  let content = docData.value.body || '';
  if (!content) return '';

  try {
    // 先处理模板变量
    content = processTemplateVariables(content);
    
    // ⚠️ 关键修改：在Markdown渲染之前检查是否为复杂HTML
    if (isComplexHtml(content)) {
      // 直接处理HTML，跳过Markdown渲染
      let processedContent = content;

      // 提取样式标签
      const styleTagRegex = /<style[\s\S]*?<\/style>/gi;
      const styleMatches = [];
      let match;
      while ((match = styleTagRegex.exec(content)) !== null) {
        styleMatches.push(match[0]);
      }
      
      // 注入脚本函数
      nextTick(() => {
        const scriptElement = document.createElement('script');
        scriptElement.innerHTML = `
          function copy(text) {
            if (text === '{{subscribeUrl}}') {
              let subscribeUrl = '';
              try {
                const userPlan = localStorage.getItem('userPlan');
                if (userPlan) {
                  const parsedPlan = JSON.parse(userPlan);
                  if (parsedPlan && parsedPlan.subscribeUrl) {
                    subscribeUrl = parsedPlan.subscribeUrl;
                  }
                } else if (window.userPlan && window.userPlan.subscribeUrl) {
                  subscribeUrl = window.userPlan.subscribeUrl;
                }
              } catch (e) {
                console.error('获取订阅链接失败:', e);
              }
              
              navigator.clipboard.writeText(subscribeUrl)
                .then(() => {
                  if (window.$toast && typeof window.$toast.success === 'function') {
                    window.$toast.success('已复制到剪贴板');
                  } else {
                    const event = new CustomEvent('eztheme-toast', { 
                      detail: { message: '已复制到剪贴板', type: 'success' } 
                    });
                    document.dispatchEvent(event);
                  }
                })
                .catch(() => {
                  const ta = document.createElement('textarea');
                  ta.value = subscribeUrl;
                  ta.style.position = 'fixed';
                  document.body.appendChild(ta);
                  ta.focus();
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                  
                  if (window.$toast && typeof window.$toast.success === 'function') {
                    window.$toast.success('已复制到剪贴板');
                  } else {
                    const event = new CustomEvent('eztheme-toast', { 
                      detail: { message: '已复制到剪贴板', type: 'success' } 
                    });
                    document.dispatchEvent(event);
                  }
                });
            } else {
              navigator.clipboard.writeText(text)
                .then(() => {
                  if (window.$toast && typeof window.$toast.success === 'function') {
                    window.$toast.success('已复制到剪贴板');
                  } else {
                    const event = new CustomEvent('eztheme-toast', { 
                      detail: { message: '已复制到剪贴板', type: 'success' } 
                    });
                    document.dispatchEvent(event);
                  }
                })
                .catch(() => {
                  const ta = document.createElement('textarea');
                  ta.value = text;
                  ta.style.position = 'fixed';
                  document.body.appendChild(ta);
                  ta.focus();
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                  
                  if (window.$toast && typeof window.$toast.success === 'function') {
                    window.$toast.success('已复制到剪贴板');
                  } else {
                    const event = new CustomEvent('eztheme-toast', { 
                      detail: { message: '已复制到剪贴板', type: 'success' } 
                    });
                    document.dispatchEvent(event);
                  }
                });
            }
          }
          
          function jump(docId) {
            window.location.href = '/#/docs/' + docId;
          }
        `;
        document.head.appendChild(scriptElement);
        
        document.addEventListener('eztheme-toast', function(e) {
          if (e.detail && e.detail.message) {
            if (window.showToast) {
              window.showToast(e.detail.message, e.detail.type || 'success');
            } 
            else if (window.$toast) {
              const type = e.detail.type || 'success';
              if (typeof window.$toast[type] === 'function') {
                window.$toast[type](e.detail.message);
              }
            }
          }
        });
        
        const docBody = document.querySelector('.doc-body');
        if (docBody) {
          docBody.removeEventListener('click', handleDocClick);
          docBody.addEventListener('click', handleDocClick);
        }
      });
      
      // DOMPurify 清理
      processedContent = DOMPurify.sanitize(processedContent, {
        ADD_TAGS: ['script', 'style', 'link', 'button', 'a', 'img', 'iframe', 'div', 'span', 'input', 'label', 'meta', 'head', 'body', 'html'],
        ADD_ATTR: [
          'onclick', 'class', 'style', 'type', 'rel', 'href', 'target', 
          'src', 'alt', 'title', 'width', 'height', 'frameborder', 'allowfullscreen',
          'data-original-onclick', 'data-href', 'data-target', 'data-*',
          'id', 'name', 'value', 'readonly', 'aria-*', 'for', 'checked',
          'charset', 'content', 'viewport', 'lang'
        ],
        ALLOW_DATA_ATTR: true,
        WHOLE_DOCUMENT: false,
        FORCE_BODY: false,
        FORBID_TAGS: [],
        FORBID_ATTR: [],
        ALLOW_UNKNOWN_PROTOCOLS: true,
        ALLOW_ARIA_ATTR: true,
        CUSTOM_ELEMENT_HANDLING: {
          tagNameCheck: null,
          attributeNameCheck: null,
          allowCustomizedBuiltInElements: true,
        }
      });
      
      // 恢复样式标签
      if (styleMatches.length > 0) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedContent;
        styleMatches.forEach(styleTag => {
          tempDiv.insertAdjacentHTML('beforeend', styleTag);
        });
        processedContent = tempDiv.innerHTML;
      }
      
      // 处理按钮和链接
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = processedContent;
      
      const buttons = tempDiv.querySelectorAll('button');
      buttons.forEach(button => {
        if (!button.classList.contains('eztheme-btn')) {
          button.classList.add('eztheme-btn');
        }
        
        const buttonText = button.textContent.trim().toLowerCase();
        if ((buttonText.includes('复制') || buttonText.includes('copy')) && 
            !button.hasAttribute('onclick')) {
          button.setAttribute('onclick', "copy('{{subscribeUrl}}')");
        }
        
        if (button.hasAttribute('href')) {
          button.setAttribute('data-href', button.getAttribute('href'));
        }
        
        const childLink = button.querySelector('a');
        if (childLink && childLink.hasAttribute('href')) {
          button.setAttribute('data-href', childLink.getAttribute('href'));
          if (childLink.hasAttribute('target')) {
            button.setAttribute('data-target', childLink.getAttribute('target'));
          }
        }
      });
      
      const links = tempDiv.querySelectorAll('a');
      links.forEach(link => {
        if (link.textContent.trim().toLowerCase().includes('复制') || 
            link.textContent.trim().toLowerCase().includes('订阅') || 
            link.textContent.trim().toLowerCase().includes('copy')) {
          link.classList.add('eztheme-btn');
        }
      });
      
      // 检测并替换 v2board-no-access 块为美化卡片
      const noAccessEls = tempDiv.querySelectorAll('.v2board-no-access');
      if (noAccessEls && noAccessEls.length > 0) {
        const cardHtml = buildNoAccessCardHtml();
        noAccessEls.forEach(el => {
          el.outerHTML = cardHtml;
        });
      }
      
      return tempDiv.innerHTML;
    } else {
      // 简单内容才进行 Markdown 渲染
      let renderedMd = '';
      try {
        renderedMd = md.render(content);
      } catch (mdError) {
        console.error('Markdown渲染失败:', mdError);
        renderedMd = content;
      }
      return renderedMd;
    }
  } catch (err) {
    console.error('Error processing content:', err);
    return `<p class="error-message">${t('docs.contentFormatError')}</p>`;
  }
});



const formatDate = (timestamp) => {

  const date = new Date(timestamp * 1000);

  return date.toLocaleDateString(locale.value === 'zh-CN' ? 'zh-CN' : 'en-US', {

    year: 'numeric',

    month: 'short',

    day: 'numeric'

  });

};



const fetchDocDetail = async () => {

  const docId = route.params.id;

  

  if (!docId) {

    error.value = t('docs.invalidDocId');

    loading.value = false;

    return;

  }

  

  loading.value = true;

  error.value = '';



  try {

    const result = await fetchKnowledgeDetail(docId, locale.value);

    

    if (result && result.data) {

      docData.value = result.data;

      

      if (!docData.value.body && docData.value.content) {

        docData.value.body = docData.value.content;

      }

    } else {

      throw new Error(t('docs.docNotFound'));

    }

  } catch (err) {

    console.error('Failed to fetch document detail:', err);

    error.value = err && err.message ? err.message : t('docs.unknownError');

    

    if ($toast) {

      $toast.error(error.value);

    }

  } finally {

    loading.value = false;

  }

};



onMounted(() => {

  fetchDocDetail();

});



onUnmounted(() => {

  const docBody = window.document.querySelector('.doc-body');

  if (docBody) {

    docBody.removeEventListener('click', handleDocClick);

  }

});

</script>



<style lang="scss" scoped>

.doc-detail-container {

  padding: 1.25rem;

  padding-bottom: calc(1.25rem + 64px); 

  

  @media (min-width: 768px) {

    padding: 2rem;

    padding-bottom: 3rem; 

  }

}



.doc-detail-inner {

  max-width: 1200px; 

  margin: 0 auto;

  width: 100%;

}



.back-button {

  display: inline-flex;

  align-items: center;

  padding: 0.5rem 1rem;

  background: none;

  border: none;

  color: var(--theme-color);

  font-weight: 500;

  cursor: pointer;

  margin-bottom: 1.5rem;

  border-radius: 8px;

  transition: all 0.3s ease;

  

  &:hover {

    background-color: rgba(var(--theme-color-rgb), 0.1);

    transform: translateX(-3px);

  }

  

  &:active {

    transform: translateX(0);

  }

  

  span {

    margin-left: 0.5rem;

  }

}



.doc-loading {

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  padding: 4rem 1rem;

  text-align: center;

  

  p {

    margin-top: 1rem;

    color: var(--text-muted);

    font-size: 1.1rem;

  }

}





.doc-error {

  display: flex;

  flex-direction: column;

  align-items: center;

  justify-content: center;

  padding: 2rem 1rem;

  text-align: center;

  

  .error-card {

    width: 100%;

    max-width: 400px;

    background: var(--card-bg);

    border-radius: 16px;

    padding: 2rem;

    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);

    border: 1px solid rgba(var(--theme-color-rgb), 0.1);

    animation: errorAppear 0.5s ease-out;

    display: flex;

    flex-direction: column;

    align-items: center;

    

    @keyframes errorAppear {

      from {

        opacity: 0;

        transform: translateY(20px);

      }

      to {

        opacity: 1;

        transform: translateY(0);

      }

    }

  }

  

  .error-icon-wrapper {

    display: flex;

    align-items: center;

    justify-content: center;

    width: 80px;

    height: 80px;

    border-radius: 50%;

    background: rgba(255, 76, 81, 0.1);

    margin-bottom: 1.5rem;

    

    .error-icon {

      color: #ff4c51;

    }

  }

  

  .error-title {

    font-size: 1.4rem;

    font-weight: 600;

    margin-bottom: 0.75rem;

    color: var(--text-color);

  }

  

  .error-message {

    color: var(--text-muted);

    font-size: 1rem;

    margin-bottom: 1.5rem;

    line-height: 1.6;

  }

}





.retry-button {

  display: inline-flex;

  align-items: center;

  justify-content: center;

  padding: 0.75rem 2rem;

  border-radius: 30px;

  background: linear-gradient(135deg, var(--theme-color), var(--theme-color-dark));

  color: white;

  font-weight: 600;

  font-size: 1rem;

  border: none;

  cursor: pointer;

  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  box-shadow: 0 4px 12px rgba(var(--theme-color-rgb), 0.3);

  

  .retry-text {

    margin-right: 0.5rem;

  }

  

  .retry-icon {

    transition: transform 0.4s ease;

  }

  

  &:hover {

    transform: translateY(-3px);

    box-shadow: 0 6px 16px rgba(var(--theme-color-rgb), 0.4);

    

    .retry-icon {

      transform: rotate(180deg);

    }

  }

  

  &:active {

    transform: translateY(-1px);

    box-shadow: 0 3px 8px rgba(var(--theme-color-rgb), 0.3);

  }

}



.doc-content {

  background-color: var(--card-bg);

  border-radius: 16px;

  padding: 1.5rem;

  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

  border: 1px solid var(--border-color);

  transition: all 0.3s ease;

  width: 100%;

  

  @media (min-width: 768px) {

    padding: 2rem;

  }

  

  &:hover {

    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);

    border-color: rgba(var(--theme-color-rgb), 0.2);

  }

}



.doc-header {

  margin-bottom: 2rem;

  padding-bottom: 1.25rem;

  border-bottom: 1px solid rgba(var(--theme-color-rgb), 0.1);

  

  .doc-title {

    font-size: 1.6rem;

    font-weight: 700;

    margin-bottom: 1rem;

    color: var(--text-color);

    line-height: 1.3;

    

    @media (min-width: 768px) {

      font-size: 1.8rem;

    }

  }

  

  .doc-meta {

    display: flex;

    flex-wrap: wrap;

    gap: 1rem;

    font-size: 0.9rem;

    color: var(--text-muted);

    

    .doc-category {

      padding: 0.3rem 0.7rem;

      background-color: rgba(var(--theme-color-rgb), 0.1);

      color: var(--theme-color);

      border-radius: 4px;

      font-weight: 500;

      transition: all 0.3s ease;

      

      &:hover {

        background-color: rgba(var(--theme-color-rgb), 0.2);

      }

    }

    

    .doc-date {

      display: flex;

      align-items: center;

    }

  }

}



.doc-body {

  color: var(--text-color);

  font-size: 1rem;

  line-height: 1.8;

  

  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {

    margin-top: 2rem;

    margin-bottom: 1.2rem;

    font-weight: 600;

    line-height: 1.4;

    color: var(--primary-text-color);

    position: relative;

    transition: color 0.2s ease;

  }

  

  :deep(h1) {

    font-size: 2.2rem;

    margin-top: 2.8rem;

    padding-bottom: 0.6rem;

    border-bottom: 1px solid var(--border-color);

  }

  

  :deep(h2) {

    font-size: 1.8rem;

    padding-bottom: 0.5rem;

    margin-top: 2.2rem;

    border-bottom: 1px solid var(--border-color);

  }

  

  :deep(h3) {

    font-size: 1.5rem;

    margin-top: 1.8rem;

  }

  

  :deep(h4) {

    font-size: 1.25rem;

    color: var(--primary-text-color);

  }

  

  :deep(h5) {

    font-size: 1.1rem;

    color: var(--primary-text-color);

  }

  

  :deep(h6) {

    font-size: 1rem;

    color: var(--text-muted);

    font-weight: 500;

  }

  

  :deep(p) {

    margin-bottom: 1.4rem;

    letter-spacing: 0.01rem;

  }

  

  :deep(ul), :deep(ol) {

    margin-bottom: 1.4rem;

    padding-left: 1.8rem;

    

    li {

      margin-bottom: 0.8rem;

      position: relative;

      

      &:last-child {

        margin-bottom: 0;

      }

    }

  }

  

  :deep(ul li) {

    list-style-type: disc;

    

    & > ul > li {

      list-style-type: circle;

      

      & > ul > li {

        list-style-type: square;

      }

    }

  }

  

  :deep(ol li) {

    list-style-type: decimal;

    

    & > ol > li {

      list-style-type: lower-alpha;

      

      & > ol > li {

        list-style-type: lower-roman;

      }

    }

  }

  

  :deep(img) {

    max-width: 100%;

    border-radius: 6px;

    margin: 1.8rem auto;

    display: block;

    transition: all 0.3s ease;

    border: 1px solid var(--border-color);

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    

    &:hover {

      transform: scale(1.01);

      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

      border-color: var(--theme-color);

    }

  }

  

  

  :deep(code) {

    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;

    background-color: var(--code-bg);

    padding: 0.2rem 0.5rem;

    border-radius: 4px;

    font-size: 0.9rem;

    color: var(--theme-color);

    border: 1px solid rgba(var(--theme-color-rgb), 0.1);

    transition: background-color 0.2s ease;

    margin: 0 2px;

  }

  

  :deep(pre) {

    background-color: var(--code-bg);

    padding: 1.2rem;

    border-radius: 6px;

    overflow-x: auto;

    margin: 1.8rem 0;

    border: 1px solid var(--border-color);

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    position: relative;

    transition: border-color 0.2s ease, box-shadow 0.2s ease;

    

    &:hover {

      border-color: var(--theme-color);

      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    }

    

    code {

      background: none;

      padding: 0;

      color: var(--text-color);

      border: none;

      font-size: 0.9rem;

      line-height: 1.6;

      text-shadow: none;

    }

  }

  

  

  :deep(a:not(.eztheme-btn)) {

    color: rgba(var(--theme-color-rgb), 1);

    text-decoration: none;

    transition: color 0.2s ease;

    font-weight: 500;

    

    &:hover {

      color: rgba(var(--theme-color-rgb), 0.8);

    }

  }

  

  

  :deep(blockquote) {

    border-left: 4px solid var(--theme-color);

    margin-left: 0;

    margin-right: 0;

    margin-bottom: 1.8rem;

    color: var(--text-muted);

    font-style: italic;

    background-color: rgba(var(--theme-color-rgb), 0.05);

    padding: 1.2rem 1.5rem;

    border-radius: 0 6px 6px 0;

    position: relative;

    transition: background-color 0.2s ease, border-left-color 0.2s ease;

    

    &:hover {

      background-color: rgba(var(--theme-color-rgb), 0.08);

    }

    

    p {

      margin-bottom: 0.8rem;

      

      &:last-child {

        margin-bottom: 0;

      }

    }

  }

  

  

  :deep(table) {

    width: 100%;

    border-collapse: separate;

    border-spacing: 0;

    margin: 1.8rem 0;

    overflow-x: auto;

    display: block;

    border-radius: 6px;

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    border: 1px solid var(--border-color);

    transition: box-shadow 0.2s ease, border-color 0.2s ease;

    

    &:hover {

      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

      border-color: rgba(var(--theme-color-rgb), 0.2);

    }

    

    @media (min-width: 768px) {

      display: table;

    }

    

    thead {

      background-color: rgba(var(--theme-color-rgb), 0.05);

      

      tr {

        border-bottom: 2px solid var(--border-color);

      }

    }

    

    th, td {

      padding: 0.8rem 1rem;

      border: 1px solid var(--border-color);

      text-align: left;

    }

    

    th {

      font-weight: 600;

      color: var(--primary-text-color);

    }

    

    tr {

      transition: background-color 0.2s ease;

      

      &:nth-child(even) {

        background-color: rgba(var(--hover-bg-rgb), 0.3);

      }

      

      &:hover {

        background-color: rgba(var(--theme-color-rgb), 0.05);

      }

    }

  }

  

  

  :deep(hr) {

    height: 1px;

    border: none;

    background-color: var(--border-color);

    margin: 2rem 0;

  }

  

  

  :deep(strong) {

    font-weight: 600;

    color: var(--primary-text-color);

  }

  

  :deep(em) {

    font-style: italic;

  }

  

  

  :deep(input[type="checkbox"]) {

    margin-right: 0.5rem;

  }

  

  

  :deep(.footnotes) {

    margin-top: 2rem;

    padding-top: 1rem;

    border-top: 1px solid var(--border-color);

    font-size: 0.9rem;

    color: var(--text-muted);

  }

  

  

  :deep(.access-content) {

    margin: 2rem 0;

    padding: 1.5rem;

    border-radius: 6px;

    background-color: rgba(var(--theme-color-rgb), 0.05);

    border: 1px solid rgba(var(--theme-color-rgb), 0.15);

    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

    position: relative;

    overflow: hidden;

    transition: box-shadow 0.2s ease, border-color 0.2s ease;

    

    &:hover {

      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

      border-color: rgba(var(--theme-color-rgb), 0.3);

    }

    

    &::before {

      content: '特别内容';

      position: absolute;

      top: 0.8rem;

      right: 1rem;

      font-size: 0.8rem;

      color: var(--theme-color);

      background-color: rgba(var(--theme-color-rgb), 0.1);

      padding: 0.2rem 0.8rem;

      border-radius: 20px;

      font-weight: 500;

    }

  }

}

</style>



<!-- 全局样式，不受scoped限制 -->

<style lang="scss">
@use '@/assets/styles/no-plan-card' as *;



.eztheme-btn {

  display: inline-flex !important;

  align-items: center !important;

  justify-content: center !important;

  padding: 8px 16px !important;

  border-radius: 6px !important;

  font-size: 14px !important;

  background-color: rgba(var(--theme-color-rgb), 0.1) !important;

  color: var(--theme-color) !important;

  border: none !important;

  cursor: pointer !important;

  transition: all 0.2s ease !important;

  font-weight: 500 !important;

  margin: 8px 4px !important;

  text-decoration: none !important;

  border-bottom: none !important;

  text-align: center !important;

  box-shadow: none !important;

  border-color: transparent !important;

  width: auto !important;

  line-height: 1.5 !important;

  height: auto !important;

  min-height: unset !important;

  max-width: unset !important;

  overflow: visible !important;

  

  

  i, .icon, svg {

    margin-right: 6px !important;

    display: inline-flex !important;

    vertical-align: middle !important;

  }

  

  &:hover, &:active, &:focus, &:visited {

    background-color: rgba(var(--theme-color-rgb), 0.2) !important;

    transform: translateY(-1px) !important;

    box-shadow: 0 2px 8px rgba(var(--theme-color-rgb), 0.1) !important;

    border-bottom: none !important;

    text-decoration: none !important;

    color: var(--theme-color) !important;

    border-color: transparent !important;

  }

  

  &:active {

    transform: translateY(0) !important;

    box-shadow: none !important;

  }

  

  &:focus {

    outline: none !important;

    box-shadow: 0 0 0 2px rgba(var(--theme-color-rgb), 0.3) !important;

  }

}





a.eztheme-btn {

  background-image: none !important;

  background-repeat: no-repeat !important;

  background-position: initial !important;

  background-size: initial !important;

  text-decoration: none !important;

  border-bottom: none !important;

  

  &::after, &::before {

    display: none !important;

    content: none !important;

  }

}

</style> 
