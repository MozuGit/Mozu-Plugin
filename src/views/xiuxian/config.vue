<template>
  <div class="config-container">
    <a-card title="修仙配置" class="fade-in-card" :bordered="false">
      <a-empty description="修仙配置页面开发中..." />
    </a-card>
  </div>
</template>

<script setup>
// 配置页面逻辑将在后续开发中添加
</script>

<style scoped>
.config-container {
  width: 100%;
}

.fade-in-card {
  animation: slideInFromLeft 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  opacity: 0;
  transform: translateX(-30px);
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

:deep(.ant-card) {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

:deep(.ant-card:hover) {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}
</style>